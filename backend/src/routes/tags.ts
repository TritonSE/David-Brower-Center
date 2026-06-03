import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { getColorFor } from "../lib/tagColors";
import { requireAdmin } from "../middleware/requireAuth";

const router = Router();

type CreateTagBody = {
  name: string;
  description?: string;
  color?: string;
  visibility: string;
};

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseVisibility(value: unknown): "PUBLIC" | "PRIVATE" | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "public") return "PUBLIC";
  if (normalized === "private") return "PRIVATE";
  return null;
}

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        organizations: {
          include: {
            organization: {
              select: { id: true, name: true, website: true },
            },
          },
        },
      },
    });
    return res.status(200).json({ tags });
  } catch {
    return next(createError(500, "Failed to fetch tags"));
  }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as CreateTagBody;

    if (!isRecord(body) || typeof body.name !== "string") {
      return next(createError(400, "Request body must include a non-empty 'name' string"));
    }

    const name = body.name.trim();
    if (name.length === 0) {
      return next(createError(400, "Tag name cannot be empty"));
    }

    const visibility = parseVisibility(body.visibility);
    if (!visibility) {
      return next(
        createError(400, "Request body must include 'visibility' as either 'public' or 'private'"),
      );
    }

    const description =
      body.description === undefined || body.description === null
        ? null
        : typeof body.description === "string"
          ? body.description.trim() || null
          : null;

    let color: string = getColorFor(name);
    if (body.color !== undefined && body.color !== null) {
      if (typeof body.color !== "string" || !HEX_COLOR_PATTERN.test(body.color.trim())) {
        return next(createError(400, "color must be a hex string like '#A8C5F2'"));
      }
      color = body.color.trim();
    }

    const tag = await prisma.tag.create({
      data: { name, description, color, visibility },
    });

    return res.status(201).json({ tag });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return next(createError(409, "A tag with this name already exists"));
    }
    return next(err);
  }
});

router.delete("/:tagId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tagId } = req.params;

    if (typeof tagId !== "string" || tagId.trim().length === 0) {
      return next(createError(400, "Tag id is required"));
    }

    const existingTag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { id: true },
    });

    if (!existingTag) {
      return next(createError(404, "Tag not found"));
    }

    await prisma.$transaction([
      prisma.organizationTag.deleteMany({
        where: { tagId },
      }),
      prisma.tag.delete({
        where: { id: tagId },
      }),
    ]);

    return res.status(200).json({ tagId });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return next(createError(404, "Tag not found"));
    }
    return next(err);
  }
});

/**
 * PATCH /api/tags/:tagID
 * Partially update a tag. Any subset of fields may be provided.
 *
 * Body (all optional, at least one required):
 * {
 *   name?: string,
 *   color?: string,                    // hex like "#A8C5F2"
 *   description?: string | null,
 *   visibility?: "public" | "private",
 *   organizationIds?: string[]
 * }
 */
router.patch(
  "/:tagID",
  ...requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tagID } = req.params;

      if (typeof tagID !== "string" || tagID.length === 0) {
        return next(createError(400, "Invalid tag ID"));
      }

      if (!isRecord(req.body)) {
        return next(createError(400, "Request body must be a JSON object"));
      }

      const body = req.body;
      const hasName = "name" in body;
      const hasColor = "color" in body;
      const hasDescription = "description" in body;
      const hasVisibility = "visibility" in body;
      const hasOrganizationIds = "organizationIds" in body;

      if (!hasName && !hasColor && !hasDescription && !hasVisibility && !hasOrganizationIds) {
        return next(createError(400, "Request body must include at least one updatable field"));
      }

      const tagUpdate: {
        name?: string;
        color?: string;
        description?: string | null;
        visibility?: "PUBLIC" | "PRIVATE";
      } = {};

      if (hasName) {
        if (typeof body.name !== "string" || body.name.trim().length === 0) {
          return next(createError(400, "'name' must be a non-empty string"));
        }
        tagUpdate.name = body.name.trim();
      }

      if (hasColor) {
        if (typeof body.color !== "string" || !HEX_COLOR_PATTERN.test(body.color.trim())) {
          return next(createError(400, "'color' must be a hex string like '#A8C5F2'"));
        }
        tagUpdate.color = body.color.trim();
      }

      if (hasDescription) {
        if (body.description === null) {
          tagUpdate.description = null;
        } else if (typeof body.description === "string") {
          tagUpdate.description = body.description.trim() || null;
        } else {
          return next(createError(400, "'description' must be a string or null"));
        }
      }

      if (hasVisibility) {
        const visibility = parseVisibility(body.visibility);
        if (!visibility) {
          return next(createError(400, "'visibility' must be either 'public' or 'private'"));
        }
        tagUpdate.visibility = visibility;
      }

      let nextOrganizationIds: string[] | null = null;
      if (hasOrganizationIds) {
        if (!Array.isArray(body.organizationIds)) {
          return next(createError(400, "'organizationIds' must be an array"));
        }
        nextOrganizationIds = body.organizationIds.map((id) => String(id));
      }

      // Verify tag exists
      const existingTag = await prisma.tag.findUnique({ where: { id: tagID } });
      if (!existingTag) {
        return next(createError(404, "Tag not found"));
      }

      const operations: Prisma.PrismaPromise<unknown>[] = [];
      if (Object.keys(tagUpdate).length > 0) {
        operations.push(prisma.tag.update({ where: { id: tagID }, data: tagUpdate }));
      }
      if (nextOrganizationIds !== null) {
        operations.push(
          prisma.organizationTag.deleteMany({ where: { tagId: tagID } }),
          prisma.organizationTag.createMany({
            data: nextOrganizationIds.map((organizationId) => ({
              organizationId,
              tagId: tagID,
            })),
            skipDuplicates: true,
          }),
        );
      }

      if (operations.length > 0) {
        await prisma.$transaction(operations);
      }

      const updatedTag = await prisma.tag.findUnique({
        where: { id: tagID },
        include: {
          organizations: {
            include: {
              organization: { select: { id: true, name: true, website: true } },
            },
          },
        },
      });

      return res.status(200).json({ tag: updatedTag });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return next(createError(409, "A tag with this name already exists"));
      }
      return next(err);
    }
  },
);

export default router;

import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { prisma } from "../lib/prisma";

const router = Router();

/** Request body shape for creating a tag */
type CreateTagBody = {
  name: string;
  description?: string;
};

/**
 * GET /api/tags — list tags (mounted as app.use("/api/tags", tagsRouter)).
 */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
    });
    return res.status(200).json({ tags });
  } catch {
    return next(createError(500, "Failed to fetch tags"));
  }
});

/**
 * POST /api/tags — create a tag.
 * Body: { name: string, description?: string }
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as CreateTagBody;

    if (!body || typeof body.name !== "string") {
      return next(createError(400, "Request body must include a non-empty 'name' string"));
    }

    const name = body.name.trim();
    if (name.length === 0) {
      return next(createError(400, "Tag name cannot be empty"));
    }

    const description =
      body.description === undefined || body.description === null
        ? null
        : typeof body.description === "string"
          ? body.description.trim() || null
          : null;

    const tag = await prisma.tag.create({
      data: { name, description },
    });

    return res.status(201).json({ tag });
  } catch (err: unknown) {
    next(err);
  }
});

/**
 * PATCH /api/tags/:tagID
 * Update organizations assigned to a tag.
 *
 * Body:
 * {
 *   organizationIds: string[]
 * }
 */
router.patch("/:tagID", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tagID } = req.params;

    if (!tagID || typeof tagID !== "string") {
      return next(createError(400, "Invalid tag ID"));
    }

    const { organizationIds } = req.body as {
      organizationIds?: unknown;
    };

    // Validate request body
    if (!Array.isArray(organizationIds)) {
      return next(createError(400, "'organizationIds' must be an array"));
    }

    // Verify tag exists
    const existingTag = await prisma.tag.findUnique({
      where: {
        id: tagID,
      },
    });

    if (!existingTag) {
      return next(createError(404, "Tag not found"));
    }

    // Replace existing organization assignments
    await prisma.$transaction([
      prisma.organizationTag.deleteMany({
        where: {
          tagId: tagID,
        },
      }),

      prisma.organizationTag.createMany({
        data: organizationIds.map((organizationId) => ({
          organizationId: String(organizationId),
          tagId: tagID,
        })),
        skipDuplicates: true,
      }),
    ]);

    // Return updated tag
    const updatedTag = await prisma.tag.findUnique({
      where: {
        id: tagID,
      },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    return res.status(200).json({ tag: updatedTag });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;

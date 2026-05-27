import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { getColorFor } from "../lib/tagColors";

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

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return next(createError(400, "Missing tag ID"));
    }
    const tag = await prisma.tag.delete({
      where: { id },
    });

    return res.status(200).json({ tag });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2025") {
      return next(createError(404, "Tag not found"));
    }
    return next(err);
  }
});

export default router;

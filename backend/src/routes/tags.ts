import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

const router = Router();

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

/** Request body shape for creating a tag */
type CreateTagBody = {
  name: string;
  description?: string;
  color: string;
  visibility: string;
};

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

function parseHexColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) return null;
  return trimmed.toUpperCase();
}

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
 * Body: { name: string, color: string, visibility: "public" | "private", description?: string }
 */
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

    const color = parseHexColor(body.color);
    if (!color) {
      return next(
        createError(400, "Request body must include a valid 'color' hex string (e.g. #5A8FBB)"),
      );
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

    const tag = await prisma.tag.create({
      data: { name, description, color, visibility } as Prisma.TagCreateInput,
    });

    return res.status(201).json({ tag });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return next(createError(409, "A tag with this name already exists"));
    }
    return next(err);
  }
});

export default router;

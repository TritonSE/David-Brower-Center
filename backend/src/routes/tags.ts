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
 * GET /api/tags â€” list tags (mounted as app.use("/api/tags", tagsRouter)).
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
 * POST /api/tags â€” create a tag.
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

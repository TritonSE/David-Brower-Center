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
 * POST /tags
 * Creates a new tag in the database.
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

export default router;

import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { prisma } from "../lib/prisma";

const router = Router();

type CreateTagBody = {
  name: string;
  description?: string;
  color?: string;
};

const DEFAULT_TAG_COLOR = "#D9D9D9";
const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

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

    let color: string = DEFAULT_TAG_COLOR;
    if (body.color !== undefined && body.color !== null) {
      if (typeof body.color !== "string" || !HEX_COLOR_PATTERN.test(body.color.trim())) {
        return next(createError(400, "color must be a hex string like '#A8C5F2'"));
      }
      color = body.color.trim();
    }

    const tag = await prisma.tag.create({
      data: { name, description, color },
    });

    return res.status(201).json({ tag });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;

import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { prisma } from "../lib/prisma";

const router = Router();

/**
 * GET /api/relationships — list organization relationships for graph edges.
 */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const relationships = await prisma.organizationRelationship.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return res.status(200).json({ relationships });
  } catch {
    return next(createError(500, "Failed to fetch relationships"));
  }
});

export default router;

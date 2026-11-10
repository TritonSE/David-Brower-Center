import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { prisma } from "../lib/prisma";

const router = Router();

/**
 * Hit daily by Vercel Cron (see vercel.json) so the Supabase free-tier project
 * sees regular database activity and isn't paused after 7 days of inactivity.
 * When CRON_SECRET is set, Vercel sends it as a Bearer token and we require it.
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    next(createError(401, "Unauthorized"));
    return;
  }

  try {
    await prisma.tag.count();
    res.status(200).json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

export default router;

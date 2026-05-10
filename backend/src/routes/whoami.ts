import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { getRequestAuthUser, requireAuth } from "../middleware/requireAuth";

const router = Router();

/** GET /api/whoami — mounted at app.use("/api/whoami", whoamiRouter). */
router.get("/", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getRequestAuthUser(req);

    return res.json({
      id: user.supabase_user_id,
      role: user.role,
      supabase_user_id: user.supabase_user_id,
    });
  } catch (err: unknown) {
    if (createError.isHttpError(err)) {
      next(err);
      return;
    }

    next(err);
  }
});

export default router;

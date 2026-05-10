import { type NextFunction, type Request, type Response, Router } from "express";

import { supabaseAdmin, supabaseAuth } from "../lib/supabaseClients";

const router = Router();

type PublicUserRow = {
  supabase_user_id: string;
  role: string;
};

type AuthUserResult = {
  data: { user: { id: string; email?: string | null } } | null;
  error: Error | null;
};

type DbResult = {
  data: PublicUserRow | null;
  error: Error | null;
};

/** GET /api/whoami — current user id and role (mounted at /api/whoami). */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (typeof authHeader !== "string") {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const [scheme, token] = authHeader.trim().split(/\s+/);
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const authResult = (await supabaseAuth.auth.getUser(token)) as AuthUserResult;
    const { data: authData, error: authError } = authResult;

    if (authError || !authData?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const supabaseUserId = authData.user.id;

    const dbResult = (await supabaseAdmin
      .from("users")
      .select("supabase_user_id, role")
      .eq("supabase_user_id", supabaseUserId)
      .single()) as DbResult;

    const { data: userRow, error: dbError } = dbResult;

    if (dbError || !userRow) {
      return res.status(404).json({ error: "User does not exist" });
    }

    return res.json({
      id: userRow.supabase_user_id,
      role: userRow.role,
      supabase_user_id: userRow.supabase_user_id,
    });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;

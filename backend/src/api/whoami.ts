import { createClient } from "@supabase/supabase-js";
import { type NextFunction, type Request, type Response, Router } from "express";

import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "../config";

const router = Router();

// Use the environment variables from config (already validated)
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type PublicUserRow = {
  supabase_user_id: string;
  role: string;
};

router.get("/whoami", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (typeof authHeader !== "string") {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const [scheme, token] = authHeader.trim().split(/\s+/);
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const supabaseUserId = authData.user.id;

    const { data: userRow, error: dbError } = await supabaseAdmin
      .from("users")
      .select("supabase_user_id, role")
      .eq("supabase_user_id", supabaseUserId)
      .single<PublicUserRow>();

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

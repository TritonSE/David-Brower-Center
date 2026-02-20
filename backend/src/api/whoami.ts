import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type NextFunction, type Request, type Response, Router } from "express";

import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "../config";

const router = Router();

const supabaseAuthUnknown: unknown = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdminUnknown: unknown = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const supabaseAuth = supabaseAuthUnknown as SupabaseClient;
const supabaseAdmin = supabaseAdminUnknown as SupabaseClient;

type PublicUserRow = {
  supabase_user_id: string;
  role: string;
};

type AuthUserResult = {
  data: { user: { id: string } } | null;
  error: Error | null;
};

type DbResult = {
  data: PublicUserRow | null;
  error: Error | null;
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

    // Type the result explicitly, not the client
    const authResult = (await supabaseAuth.auth.getUser(token)) as AuthUserResult;
    const { data: authData, error: authError } = authResult;

    if (authError || !authData?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const supabaseUserId = authData.user.id;

    // Type the result explicitly, not the client
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

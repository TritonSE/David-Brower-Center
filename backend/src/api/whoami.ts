import { createClient } from "@supabase/supabase-js";
import { Router } from "express";

const router = Router();

// Ensure environment variables are strings
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing required Supabase environment variables");
}

// Let TypeScript infer the types - don't explicitly type these
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

type PublicUserRow = {
  supabase_user_id: string;
  role: string;
};

type AuthResult = {
  data: { user: { id: string } } | null;
  error: Error | null;
};

type DbResult = {
  data: PublicUserRow | null;
  error: Error | null;
};

router.get("/whoami", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (typeof authHeader !== "string") {
      return res.status(401).json({ error: "Missing Authorization header" });
    }
    const parts = authHeader.trim().split(/\s+/);
    const scheme = parts[0];
    const token = parts[1];
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    // Type the result, not the client
    const authResult = (await supabaseAuth.auth.getUser(token)) as AuthResult;

    if (authResult.error || !authResult.data?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const supabaseUserId = authResult.data.user.id;

    // Type the result, not the client
    const dbResult = (await supabaseAdmin
      .from("users")
      .select("supabase_user_id, role")
      .eq("supabase_user_id", supabaseUserId)
      .single()) as DbResult;

    if (dbResult.error || !dbResult.data) {
      return res.status(404).json({ error: "User does not exist" });
    }

    const userRow = dbResult.data;

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

import { createClient } from "@supabase/supabase-js";
import { Router } from "express";

const router = Router();

const supabaseAuth = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type PublicUserRow = {
  id: string | number;
  supabase_user_id: string;
  name: string;
  email: string;
  role: string;
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

    const { data, error } = await supabaseAuth.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const supabaseUserId = data.user.id;

    const { data: userRow, error: dbError } = await supabaseAdmin
      .from("users")
      .select("supabase_user_id, name, email, role")
      .eq("supabase_user_id", supabaseUserId)
      .single<PublicUserRow>();

    if (dbError || !userRow) {
      return res.status(404).json({ error: "User does not exist" });
    }

    return res.json({
      id: userRow.supabase_user_id,
      name: userRow.name,
      role: userRow.role,
      email: userRow.email,
    });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;

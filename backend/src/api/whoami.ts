import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type NextFunction, type Request, type Response, Router } from "express";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config";
import { prisma } from "../lib/prisma";

const router = Router();

const supabaseAuthUnknown: unknown = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAuth = supabaseAuthUnknown as SupabaseClient;

type AuthUserResult = {
  data: { user: { id: string; email?: string } } | null;
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
    const userEmail = authData.user.email;

    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { supabase_user_id: supabaseUserId },
      select: { supabase_user_id: true, role: true, email: true },
    });

    // Auto-create user if they don't exist (useful for development)
    if (!user) {
      if (!userEmail) {
        return res.status(400).json({ error: "User email not available from auth provider" });
      }
      user = await prisma.user.create({
        data: {
          supabase_user_id: supabaseUserId,
          email: userEmail,
          role: "admin",
        },
        select: { supabase_user_id: true, role: true, email: true },
      });
      console.info(`Auto-created user: ${userEmail} (${supabaseUserId})`);
    }

    return res.json({
      id: user.supabase_user_id,
      role: user.role,
      supabase_user_id: user.supabase_user_id,
    });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;

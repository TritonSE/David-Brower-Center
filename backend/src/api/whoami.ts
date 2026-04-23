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
  data: { user: { id: string; email?: string | null } } | null;
  error: Error | null;
};

type DbResult = {
  data: PublicUserRow | null;
  error: Error | null;
};

type ProfileRow = {
  supabase_user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
};

type ProfileResult = {
  data: ProfileRow | null;
  error: Error | null;
};

type ProfileRoleResult = {
  data: { role: string } | null;
  error: Error | null;
};

function toNullableTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(value: string): boolean {
  // Split + index checks avoid super-linear backtracking from naive `a+@a+.a+` patterns.
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domainWithTld] = parts;
  if (!local || /\s/.test(local) || !domainWithTld || /\s/.test(domainWithTld)) return false;
  const lastDot = domainWithTld.lastIndexOf(".");
  if (lastDot <= 0 || lastDot >= domainWithTld.length - 1) return false;
  return true;
}

function profileResponse(profile: ProfileRow) {
  return {
    id: profile.supabase_user_id,
    email: profile.email,
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    phone: profile.phone ?? "",
    role: profile.role,
  };
}

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

router.get("/profile", async (req: Request, res: Response, next: NextFunction) => {
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
    const authEmail = toNullableTrimmedString(authData.user.email);

    const profileResult = (await supabaseAdmin
      .from("users")
      .select("supabase_user_id, email, first_name, last_name, phone, role")
      .eq("supabase_user_id", supabaseUserId)
      .single()) as ProfileResult;
    const { data: profile, error: profileError } = profileResult;

    if (!profileError && profile) {
      return res.status(200).json(profileResponse(profile));
    }

    if (!authEmail) {
      return res.status(404).json({ error: "User profile is missing and no email is available." });
    }

    const createdResult = (await supabaseAdmin
      .from("users")
      .upsert(
        {
          supabase_user_id: supabaseUserId,
          email: authEmail,
          role: "admin",
        },
        { onConflict: "supabase_user_id" },
      )
      .select("supabase_user_id, email, first_name, last_name, phone, role")
      .single()) as ProfileResult;

    const { data: createdProfile, error: createdError } = createdResult;

    if (createdError || !createdProfile) {
      return res.status(500).json({ error: "Failed to create user profile." });
    }

    return res.status(200).json(profileResponse(createdProfile));
  } catch (err: unknown) {
    next(err);
  }
});

router.patch("/profile", async (req: Request, res: Response, next: NextFunction) => {
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

    const body = req.body as Record<string, unknown>;
    const firstName = toNullableTrimmedString(body.firstName);
    const lastName = toNullableTrimmedString(body.lastName);
    const phone = toNullableTrimmedString(body.phone);
    const email = toNullableTrimmedString(body.email);

    if (!firstName || !lastName || !email) {
      return res
        .status(400)
        .json({ error: "firstName, lastName, and email are required and must be non-empty." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "email is invalid." });
    }

    const supabaseUserId = authData.user.id;

    const roleResult = (await supabaseAdmin
      .from("users")
      .select("role")
      .eq("supabase_user_id", supabaseUserId)
      .single()) as ProfileRoleResult;
    const userRole = roleResult.data?.role ?? "admin";

    const authEmail = toNullableTrimmedString(authData.user.email);
    if (authEmail !== email) {
      const authUpdate = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, { email });
      if (authUpdate.error) {
        return res.status(400).json({ error: authUpdate.error.message });
      }
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const updateResult = (await supabaseAdmin
      .from("users")
      .upsert(
        {
          supabase_user_id: supabaseUserId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          name: fullName.length > 0 ? fullName : null,
          role: userRole,
        },
        { onConflict: "supabase_user_id" },
      )
      .select("supabase_user_id, email, first_name, last_name, phone, role")
      .single()) as ProfileResult;

    const { data: updatedProfile, error: updateError } = updateResult;
    if (updateError || !updatedProfile) {
      return res.status(500).json({ error: "Failed to update user profile." });
    }

    return res.status(200).json(profileResponse(updatedProfile));
  } catch (err: unknown) {
    next(err);
  }
});

export default router;

import { type NextFunction, type Request, type Response, Router } from "express";

import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { supabaseAdmin, supabaseAuth } from "../lib/supabaseClients";

const router = Router();

type AuthUserResult = {
  data: { user: { id: string; email?: string | null } } | null;
  error: Error | null;
};

type UserRow = {
  supabase_user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
};

type AuthOk = { ok: true; userId: string; email: string | null };
type AuthFail = { ok: false; status: number; error: string };

function toNullableTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(value: string): boolean {
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domainWithTld] = parts;
  if (!local || /\s/.test(local) || !domainWithTld || /\s/.test(domainWithTld)) return false;
  const lastDot = domainWithTld.lastIndexOf(".");
  if (lastDot <= 0 || lastDot >= domainWithTld.length - 1) return false;
  return true;
}

function profileResponse(profile: UserRow) {
  return {
    id: profile.supabase_user_id,
    email: profile.email,
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    phone: profile.phone ?? "",
    role: profile.role,
  };
}

async function authenticate(req: Request): Promise<AuthOk | AuthFail> {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== "string") {
    return { ok: false, status: 401, error: "Missing Authorization header" };
  }
  const [scheme, token] = authHeader.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return { ok: false, status: 401, error: "Missing or invalid Authorization header" };
  }
  const { data, error } = (await supabaseAuth.auth.getUser(token)) as AuthUserResult;
  if (error || !data?.user) {
    return { ok: false, status: 401, error: "Invalid or expired token" };
  }
  const email = toNullableTrimmedString(data.user.email);
  return { ok: true, userId: data.user.id, email };
}

/** GET /api/users/profile */
router.get("/profile", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = await authenticate(req);
    if (!auth.ok) {
      return res.status(auth.status).json({ error: auth.error });
    }

    const existing = await prisma.user.findUnique({
      where: { supabase_user_id: auth.userId },
    });
    if (existing) {
      return res.status(200).json(profileResponse(existing));
    }

    if (!auth.email) {
      return res.status(404).json({ error: "User profile is missing and no email is available." });
    }

    const created = await prisma.user.create({
      data: {
        supabase_user_id: auth.userId,
        email: auth.email,
        role: "admin",
      },
    });
    return res.status(200).json(profileResponse(created));
  } catch (err: unknown) {
    next(err);
  }
});

/** PATCH /api/users/profile */
router.patch("/profile", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = await authenticate(req);
    if (!auth.ok) {
      return res.status(auth.status).json({ error: auth.error });
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

    if (auth.email !== email) {
      const authUpdate = await supabaseAdmin.auth.admin.updateUserById(auth.userId, { email });
      if (authUpdate.error) {
        return res.status(400).json({ error: authUpdate.error.message });
      }
    }

    const fullName = `${firstName} ${lastName}`;
    try {
      const updated = await prisma.user.upsert({
        where: { supabase_user_id: auth.userId },
        update: {
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          name: fullName,
        },
        create: {
          supabase_user_id: auth.userId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          name: fullName,
          role: "admin",
        },
      });
      return res.status(200).json(profileResponse(updated));
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return res.status(409).json({ error: "That email is already in use." });
      }
      throw err;
    }
  } catch (err: unknown) {
    next(err);
  }
});

export default router;

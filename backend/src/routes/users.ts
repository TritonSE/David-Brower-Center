import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { supabaseAdmin, supabaseAuth } from "../lib/supabaseClients";
import { getRequestAuthUser, requireAdmin } from "../middleware/requireAuth";

const router = Router();
const USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AuthUserResult = {
  data: { user: { id: string; email?: string | null } } | null;
  error: Error | null;
};

type UserRow = {
  supabase_user_id: string;
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  profile_picture: string | null;
  role: string;
  created_at: Date;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function userResponse(user: UserRow) {
  return {
    id: user.supabase_user_id,
    email: user.email,
    name: user.name ?? "",
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    phone: user.phone ?? "",
    profilePicture: user.profile_picture ?? "",
    role: user.role,
    createdAt: user.created_at.toISOString(),
  };
}

function profileResponse(profile: UserRow) {
  const displayName =
    [profile.first_name, profile.last_name]
      .map((namePart) => namePart?.trim())
      .filter(Boolean)
      .join(" ") ||
    profile.name ||
    "";

  return {
    id: profile.supabase_user_id,
    email: profile.email,
    name: displayName,
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

/** GET /api/users */
router.get("/", ...requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: "desc" },
    });

    return res.status(200).json({ users: users.map(userResponse) });
  } catch (err: unknown) {
    return next(err);
  }
});

/** POST /api/users */
router.post("/", ...requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isRecord(req.body)) {
      return next(createError(400, "Request body must be a JSON object."));
    }

    const email = toNullableTrimmedString(req.body.email);
    const password = toNullableTrimmedString(req.body.password);
    const firstName = toNullableTrimmedString(req.body.firstName);
    const lastName = toNullableTrimmedString(req.body.lastName);
    const phone = toNullableTrimmedString(req.body.phone);
    const role = toNullableTrimmedString(req.body.role) ?? "admin";

    if (!email) {
      return next(createError(400, "email is required."));
    }
    if (!isValidEmail(email)) {
      return next(createError(400, "email is invalid."));
    }
    if (password !== null && password.length < 6) {
      return next(createError(400, "password must be at least 6 characters."));
    }
    if (role.length === 0) {
      return next(createError(400, "role must be a non-empty string."));
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { supabase_user_id: true },
    });
    if (existing) {
      return next(createError(409, "A user with this email already exists."));
    }

    const authResult = password
      ? await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            firstName,
            lastName,
            phone,
          },
        })
      : await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: {
            firstName,
            lastName,
            phone,
          },
        });

    if (authResult.error) {
      return next(createError(400, authResult.error.message));
    }

    const authUserId = authResult.data.user?.id;
    if (!authUserId) {
      return next(createError(500, "Supabase did not return a created user."));
    }

    const name = [firstName, lastName].filter(Boolean).join(" ") || null;
    const user = await prisma.user.create({
      data: {
        supabase_user_id: authUserId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        name,
        role,
      },
    });

    return res.status(201).json({ user: userResponse(user) });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return next(createError(409, "A user with this email already exists."));
    }
    return next(err);
  }
});

/** DELETE /api/users/:id */
router.delete("/:id", ...requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId: unknown = req.params.id;
    if (typeof rawId !== "string" || !USER_ID_PATTERN.test(rawId)) {
      return next(createError(400, "A valid user id is required."));
    }

    const requester = getRequestAuthUser(req);
    if (rawId === requester.supabase_user_id) {
      return next(createError(403, "You cannot remove your own account."));
    }

    try {
      await prisma.user.delete({ where: { supabase_user_id: rawId } });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return next(createError(404, "User profile not found."));
      }
      throw err;
    }

    const authDelete = await supabaseAdmin.auth.admin.deleteUser(rawId);
    if (authDelete.error) {
      return next(createError(400, authDelete.error.message));
    }

    return res.status(204).send();
  } catch (err: unknown) {
    return next(err);
  }
});

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

/** GET /api/users/:id */
router.get("/:id", ...requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId: unknown = req.params.id;
    if (typeof rawId !== "string" || !USER_ID_PATTERN.test(rawId)) {
      return res.status(400).json({ error: "A valid user id is required." });
    }

    const requester = getRequestAuthUser(req);
    if (rawId === requester.supabase_user_id) {
      return res.status(403).json({ error: "Use /api/users/profile to view your own profile." });
    }

    const profile = await prisma.user.findUnique({
      where: { supabase_user_id: rawId },
    });

    if (!profile) {
      return res.status(404).json({ error: "User profile not found." });
    }

    return res.status(200).json(profileResponse(profile));
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

/** PATCH /api/users/:id */
router.patch("/:id", ...requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId: unknown = req.params.id;
    if (typeof rawId !== "string" || !USER_ID_PATTERN.test(rawId)) {
      return next(createError(400, "A valid user id is required."));
    }
    if (!isRecord(req.body)) {
      return next(createError(400, "Request body must be a JSON object."));
    }

    const existing = await prisma.user.findUnique({ where: { supabase_user_id: rawId } });
    if (!existing) {
      return next(createError(404, "User profile not found."));
    }

    const email = toNullableTrimmedString(req.body.email) ?? existing.email;
    const firstName = toNullableTrimmedString(req.body.firstName);
    const lastName = toNullableTrimmedString(req.body.lastName);
    const phone = toNullableTrimmedString(req.body.phone);
    const role = toNullableTrimmedString(req.body.role) ?? existing.role;

    if (!isValidEmail(email)) {
      return next(createError(400, "email is invalid."));
    }

    if (email !== existing.email) {
      const authUpdate = await supabaseAdmin.auth.admin.updateUserById(rawId, { email });
      if (authUpdate.error) {
        return next(createError(400, authUpdate.error.message));
      }
    }

    const name = [firstName, lastName].filter(Boolean).join(" ") || null;

    try {
      const updated = await prisma.user.update({
        where: { supabase_user_id: rawId },
        data: {
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          name,
          role,
        },
      });
      return res.status(200).json({ user: userResponse(updated) });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return next(createError(409, "A user with this email already exists."));
      }
      throw err;
    }
  } catch (err: unknown) {
    return next(err);
  }
});

export default router;

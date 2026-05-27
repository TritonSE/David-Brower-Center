import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabaseClients";
import { requireAdmin } from "../middleware/requireAuth";

const router = Router();

type AccountCreationRequestBody = {
  email?: unknown;
  name?: unknown;
};

type SupabaseInviteResult = {
  data: { user: { id: string; email?: string | null } | null };
  error: { message: string } | null;
};

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

function requestResponse(request: {
  id: string;
  email: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: request.id,
    email: request.email,
    name: request.name ?? "",
    createdAt: request.created_at.toISOString(),
    updatedAt: request.updated_at.toISOString(),
  };
}

function splitName(name: string | null): { firstName: string | null; lastName: string | null } {
  if (!name) return { firstName: null, lastName: null };
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  const firstName = parts[0] ?? null;
  const rest = parts.slice(1);
  return {
    firstName,
    lastName: rest.length > 0 ? rest.join(" ") : null,
  };
}

/** POST /api/account-creation-requests */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as AccountCreationRequestBody;
    const email = toNullableTrimmedString(body.email)?.toLowerCase() ?? null;
    const name = toNullableTrimmedString(body.name);

    if (!email) {
      throw createError(400, "email is required");
    }

    if (!isValidEmail(email)) {
      throw createError(400, "email is invalid");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { supabase_user_id: true },
    });

    if (existingUser) {
      throw createError(409, "An account already exists for this email");
    }

    const request = await prisma.accountCreationRequest.upsert({
      where: { email },
      update: { name },
      create: { email, name },
    });

    res.status(201).json({ request: requestResponse(request) });
  } catch (err: unknown) {
    next(err);
  }
});

/** GET /api/account-creation-requests */
router.get("/", ...requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.accountCreationRequest.findMany({
      orderBy: { created_at: "asc" },
    });

    res.status(200).json({ requests: requests.map(requestResponse) });
  } catch (err: unknown) {
    next(err);
  }
});

/** POST /api/account-creation-requests/:id/approve */
router.post(
  "/:id/approve",
  ...requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawId: unknown = req.params.id;
      if (typeof rawId !== "string" || rawId.length === 0) {
        throw createError(400, "request id is required");
      }

      const accountRequest = await prisma.accountCreationRequest.findUnique({
        where: { id: rawId },
      });

      if (!accountRequest) {
        throw createError(404, "Account creation request not found");
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: accountRequest.email },
        select: { supabase_user_id: true },
      });

      if (existingUser) {
        await prisma.accountCreationRequest.delete({ where: { id: rawId } });
        res.status(200).json({ approved: false, reason: "existing-user" });
        return;
      }

      const inviteResult = (await supabaseAdmin.auth.admin.inviteUserByEmail(
        accountRequest.email,
        accountRequest.name
          ? {
              data: {
                name: accountRequest.name,
              },
            }
          : undefined,
      )) as SupabaseInviteResult;

      if (inviteResult.error || !inviteResult.data.user) {
        throw createError(
          400,
          inviteResult.error?.message ?? "Failed to create invited user account",
        );
      }

      const { firstName, lastName } = splitName(accountRequest.name);
      const invitedUser = inviteResult.data.user;
      const invitedEmail = invitedUser.email ?? accountRequest.email;

      await prisma.$transaction([
        prisma.user.create({
          data: {
            supabase_user_id: invitedUser.id,
            email: invitedEmail,
            name: accountRequest.name,
            first_name: firstName,
            last_name: lastName,
            role: "admin",
          },
        }),
        prisma.accountCreationRequest.delete({ where: { id: rawId } }),
      ]);

      res.status(201).json({
        approved: true,
        user: {
          id: invitedUser.id,
          email: invitedEmail,
          name: accountRequest.name ?? "",
          role: "admin",
        },
      });
    } catch (err: unknown) {
      next(err);
    }
  },
);

/** DELETE /api/account-creation-requests/:id */
router.delete("/:id", ...requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId: unknown = req.params.id;
    if (typeof rawId !== "string" || rawId.length === 0) {
      throw createError(400, "request id is required");
    }

    await prisma.accountCreationRequest.delete({ where: { id: rawId } });
    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
});

export default router;

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config";
import { prisma } from "../lib/prisma";

const router = Router();

const supabaseAuthUnknown: unknown = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAuth = supabaseAuthUnknown as SupabaseClient;

type AuthUserResult = {
  data: { user: { id: string } } | null;
  error: Error | null;
};

type OrganizationBody = {
  name?: unknown;
  mission?: unknown;
  city?: unknown;
  state?: unknown;
  country?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  min_budget?: unknown;
  max_budget?: unknown;
  tags?: unknown;
};

async function requireAdminUser(req: Request): Promise<string> {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== "string") {
    throw createError(401, "Missing Authorization header");
  }

  const [scheme, token] = authHeader.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw createError(401, "Missing or invalid Authorization header");
  }

  const authResult = (await supabaseAuth.auth.getUser(token)) as AuthUserResult;
  const { data: authData, error: authError } = authResult;

  if (authError || !authData?.user) {
    throw createError(401, "Invalid or expired token");
  }

  const user = await prisma.user.findUnique({
    where: { supabase_user_id: authData.user.id },
    select: { supabase_user_id: true, role: true },
  });

  if (!user) {
    throw createError(404, "User does not exist");
  }

  if (user.role !== "admin") {
    throw createError(403, "Admin access required");
  }

  return user.supabase_user_id;
}

router.get("/organizations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizations = await prisma.organization.findMany();
    res.status(200).json({ organizations });
  } catch {
    next(createError(500, "Failed to fetch organizations"));
  }
});

router.post("/organizations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireAdminUser(req);

    const body = req.body as OrganizationBody;

    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      throw createError(400, "name is required");
    }

    const organization = await prisma.organization.create({
      data: {
        name: body.name.trim(),
        mission: typeof body.mission === "string" ? body.mission : null,
        city: typeof body.city === "string" ? body.city : null,
        state: typeof body.state === "string" ? body.state : null,
        country: typeof body.country === "string" ? body.country : undefined,
        latitude: typeof body.latitude === "number" ? body.latitude : null,
        longitude: typeof body.longitude === "number" ? body.longitude : null,
        min_budget: typeof body.min_budget === "number" ? Math.trunc(body.min_budget) : null,
        max_budget: typeof body.max_budget === "number" ? Math.trunc(body.max_budget) : null,
        tags:
          Array.isArray(body.tags) && body.tags.every((tag) => typeof tag === "string")
            ? body.tags
            : undefined,
      },
    });

    res.status(201).json({ organization });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;

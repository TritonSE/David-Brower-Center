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

// Flattens the Prisma `tags` relation (a pivot row that nests a `tag`) into a
// plain array of `{ id, name }` objects. Clients don't care about the join
// table; they just want to render and filter on the tag list itself.
type OrganizationTagJoin = { tag: { id: string; name: string } };
function flattenOrganizationTags<T extends { tags: OrganizationTagJoin[] }>(
  organization: T,
): Omit<T, "tags"> & { tags: { id: string; name: string }[] } {
  const { tags, ...rest } = organization;
  return {
    ...rest,
    tags: tags.map((entry) => ({ id: entry.tag.id, name: entry.tag.name })),
  };
}

router.get("/organizations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        tags: {
          select: {
            tag: { select: { id: true, name: true } },
          },
        },
      },
    });
    res.status(200).json({ organizations: organizations.map(flattenOrganizationTags) });
  } catch {
    next(createError(500, "Failed to fetch organizations"));
  }
});

router.get("/organizations/:id", async (req: Request, res: Response, next: NextFunction) => {
  // Express 5 types `req.params` values as `string | string[] | undefined`,
  // so narrow to a plain string before using it in queries or messages.
  const rawId: unknown = req.params.id;
  if (typeof rawId !== "string" || rawId.length === 0) {
    next(createError(400, "Organization id is required"));
    return;
  }
  const id: string = rawId;

  try {
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        tags: {
          select: {
            tag: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!organization) {
      next(createError(404, `Organization ${id} not found`));
      return;
    }

    res.status(200).json({ organization: flattenOrganizationTags(organization) });
  } catch {
    next(createError(500, `Failed to fetch organization ${id}`));
  }
});

router.post("/organizations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireAdminUser(req);

    const body = req.body as OrganizationBody;

    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      throw createError(400, "name is required");
    }

    // `tags` is a relation through the `OrganizationTag` join table, so we
    // can't assign a scalar array. Accept an array of Tag UUIDs from the
    // client and translate them into nested join-row creates that connect
    // to existing tags. `Tag.name` is not unique in the schema, so IDs are
    // the only safe lookup key.
    const tagIds: string[] =
      Array.isArray(body.tags) && body.tags.every((tag): tag is string => typeof tag === "string")
        ? body.tags
        : [];

    const organization = await prisma.organization.create({
      data: {
        name: body.name.trim(),
        mission: typeof body.mission === "string" ? body.mission : null,
        city: typeof body.city === "string" ? body.city : null,
        state: typeof body.state === "string" ? body.state : null,
        // Conditionally include `country` so that when it's absent the
        // schema default ("United States") applies. Under
        // `exactOptionalPropertyTypes: true` we can't pass `undefined` to a
        // non-optional field, and passing `null` would override the default.
        ...(typeof body.country === "string" && { country: body.country }),
        latitude: typeof body.latitude === "number" ? body.latitude : null,
        longitude: typeof body.longitude === "number" ? body.longitude : null,
        min_budget: typeof body.min_budget === "number" ? Math.trunc(body.min_budget) : null,
        max_budget: typeof body.max_budget === "number" ? Math.trunc(body.max_budget) : null,
        tags: {
          create: tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
      },
      include: {
        tags: {
          select: {
            tag: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.status(201).json({ organization: flattenOrganizationTags(organization) });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;

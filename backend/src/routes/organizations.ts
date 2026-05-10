import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { prisma } from "../lib/prisma";
import { supabaseAuth } from "../lib/supabaseClients";

const router = Router();

type AuthUserResult = {
  data: { user: { id: string } } | null;
  error: Error | null;
};

type OrganizationBody = {
  name?: unknown;
  projectId?: unknown;
  sizeCategory?: unknown;
  website?: unknown;
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

/** GET /api/organizations */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
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

/** GET /api/organizations/:id */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
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

/** POST /api/organizations */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireAdminUser(req);

    const body = req.body as OrganizationBody;

    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      throw createError(400, "name is required");
    }

    const tagIds: string[] =
      Array.isArray(body.tags) && body.tags.every((tag): tag is string => typeof tag === "string")
        ? body.tags
        : [];

    if (typeof body.projectId !== "string" || body.projectId.trim().length === 0) {
      throw createError(400, "projectId is required");
    }

    const sizeCategoryRaw = body.sizeCategory;
    const websiteRaw = body.website;

    const organization = await prisma.organization.create({
      data: {
        name: body.name.trim(),
        projectId: body.projectId.trim(),
        ...(typeof sizeCategoryRaw === "string"
          ? { sizeCategory: sizeCategoryRaw.trim() || null }
          : {}),
        ...(typeof websiteRaw === "string" ? { website: websiteRaw.trim() || null } : {}),
        ...(tagIds.length > 0
          ? {
              tags: {
                create: tagIds.map((tagId) => ({
                  tag: { connect: { id: tagId } },
                })),
              },
            }
          : {}),
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

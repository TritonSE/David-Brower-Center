import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/requireAuth";

const router = Router();

type OrganizationBody = {
  name?: unknown;
  projectId?: unknown;
  sizeCategory?: unknown;
  location?: unknown;
  budget?: unknown;
  website?: unknown;
  tags?: unknown;
  tagNames?: unknown;
};

type OrganizationTagJoin = { tag: { id: string; name: string; color: string } };
function flattenOrganizationTags<T extends { tags: OrganizationTagJoin[] }>(
  organization: T,
): Omit<T, "tags"> & { tags: { id: string; name: string; color: string }[] } {
  const { tags, ...rest } = organization;
  return {
    ...rest,
    tags: tags.map((entry) => ({
      id: entry.tag.id,
      name: entry.tag.name,
      color: entry.tag.color,
    })),
  };
}

function toOptionalTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toUniqueTrimmedStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const strings: string[] = [];

  for (const item of value) {
    const trimmed = toOptionalTrimmedString(item);
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    strings.push(trimmed);
  }

  return strings;
}

/** GET /api/organizations */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        tags: {
          orderBy: { tag: { name: "asc" } },
          select: {
            tag: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });
    res.status(200).json({ organizations: organizations.map(flattenOrganizationTags) });
  } catch (error) {
    console.error("GET /organizations failed:", error);
    next(createError(500, "Failed to fetch organizations"));
  }
});

/** GET /api/organizations/relationships */
router.get("/relationships", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const relationships = await prisma.organizationRelationship.findMany({
      select: {
        id: true,
        npo1Id: true,
        npo2Id: true,
        relationshipTier: true,
        relationshipType: true,
      },
    });
    res.status(200).json({ relationships });
  } catch {
    next(createError(500, "Failed to fetch organization relationships"));
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
          orderBy: { tag: { name: "asc" } },
          select: {
            tag: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    if (!organization) {
      next(createError(404, `Organization ${id} not found`));
      return;
    }

    res.status(200).json({ organization: flattenOrganizationTags(organization) });
  } catch (error) {
    console.error(`GET /organizations/${id} failed:`, error);
    next(createError(500, `Failed to fetch organization ${id}`));
  }
});

/** POST /api/organizations */
router.post("/", ...requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as OrganizationBody;

    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      throw createError(400, "name is required");
    }

    if (typeof body.projectId !== "string" || body.projectId.trim().length === 0) {
      throw createError(400, "projectId is required");
    }

    const tagIds = toUniqueTrimmedStrings(body.tags);
    const tagNames = toUniqueTrimmedStrings(body.tagNames);

    const tagsById = tagIds.length
      ? await prisma.tag.findMany({
          where: { id: { in: tagIds } },
          select: { id: true },
        })
      : [];

    const connectedTagIds = new Set(tagsById.map((tag) => tag.id));

    const tagsByName = await Promise.all(
      tagNames.map(
        async (tagName) =>
          await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
            select: { id: true },
          }),
      ),
    );

    for (const tag of tagsByName) {
      connectedTagIds.add(tag.id);
    }

    const sizeCategory = toOptionalTrimmedString(body.sizeCategory);
    const website = toOptionalTrimmedString(body.website);
    const location = toOptionalTrimmedString(body.location);
    const budget = toOptionalTrimmedString(body.budget);

    const organization = await prisma.organization.create({
      data: {
        name: body.name.trim(),
        projectId: body.projectId.trim(),
        sizeCategory,
        website,
        location,
        budget,
        ...(connectedTagIds.size > 0
          ? {
              tags: {
                create: [...connectedTagIds].map((tagId) => ({
                  tag: { connect: { id: tagId } },
                })),
              },
            }
          : {}),
      },
      include: {
        tags: {
          orderBy: { tag: { name: "asc" } },
          select: {
            tag: { select: { id: true, name: true, color: true } },
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

import { randomUUID } from "node:crypto";

import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabaseClients";
import { requireAdmin } from "../middleware/requireAuth";

const router = Router();

const IMAGES_BUCKET = "images";

type OrganizationBody = {
  images?: unknown;
  name?: unknown;
  projectId?: unknown;
  sizeCategory?: unknown;
  location?: unknown;
  budget?: unknown;
  description?: unknown;
  website?: unknown;
  tags?: unknown;
  tagNames?: unknown;
};

type CreateRelationshipEntry = {
  npo2Id?: unknown;
  relationshipTier?: unknown;
  relationshipType?: unknown;
};

type CreateRelationshipsBody = {
  npo1Id?: unknown;
  relationships?: unknown;
};

const RELATIONSHIP_TIERS = new Set(["PRIMARY", "SECONDARY", "TERTIARY"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseRelationshipTier(value: unknown): "PRIMARY" | "SECONDARY" | "TERTIARY" | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (RELATIONSHIP_TIERS.has(normalized)) {
    return normalized as "PRIMARY" | "SECONDARY" | "TERTIARY";
  }
  return null;
}

function parseCreateRelationshipEntries(value: unknown): CreateRelationshipEntry[] | null {
  if (!Array.isArray(value)) return null;
  return value as CreateRelationshipEntry[];
}

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

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function toImageUrlArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const urls: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (trimmed.length === 0) continue;
    if (!isHttpsUrl(trimmed)) continue;
    urls.push(trimmed);
  }
  return urls;
}

const orgTagsInclude = {
  tags: {
    orderBy: { tag: { name: "asc" } },
    select: {
      tag: { select: { id: true, name: true, color: true } },
    },
  },
} as const;

/** GET /api/organizations */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const organizations = await prisma.organization.findMany({
      include: orgTagsInclude,
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

/** POST /api/organizations/relationships */
router.post(
  "/relationships",
  ...requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as CreateRelationshipsBody;

      if (!isRecord(body) || typeof body.npo1Id !== "string" || body.npo1Id.trim().length === 0) {
        next(createError(400, "npo1Id is required"));
        return;
      }

      const npo1Id = body.npo1Id.trim();
      const rawRelationships = parseCreateRelationshipEntries(body.relationships);
      if (!rawRelationships) {
        next(createError(400, "relationships must be an array"));
        return;
      }

      const sourceOrg = await prisma.organization.findUnique({ where: { id: npo1Id } });
      if (!sourceOrg) {
        next(createError(404, `Organization ${npo1Id} not found`));
        return;
      }

      const createdRelationships: Array<{
        id: string;
        npo1Id: string;
        npo2Id: string;
        relationshipTier: string;
        relationshipType: string | null;
      }> = [];

      const parsedEntries: Array<{
        npo2Id: string;
        relationshipTier: "PRIMARY" | "SECONDARY" | "TERTIARY";
        relationshipType: string | null;
      }> = [];

      for (const entry of rawRelationships) {
        if (
          !isRecord(entry) ||
          typeof entry.npo2Id !== "string" ||
          entry.npo2Id.trim().length === 0
        ) {
          next(createError(400, "Each relationship must include npo2Id"));
          return;
        }

        const npo2Id = entry.npo2Id.trim();
        const relationshipTier = parseRelationshipTier(entry.relationshipTier);
        if (!relationshipTier) {
          next(
            createError(
              400,
              "Each relationship must include relationshipTier as PRIMARY, SECONDARY, or TERTIARY",
            ),
          );
          return;
        }

        if (npo1Id === npo2Id) {
          next(createError(400, "An organization cannot have a relationship with itself"));
          return;
        }

        const relationshipType =
          entry.relationshipType === undefined || entry.relationshipType === null
            ? null
            : typeof entry.relationshipType === "string"
              ? entry.relationshipType.trim() || null
              : null;

        parsedEntries.push({ npo2Id, relationshipTier, relationshipType });
      }

      const partnerIds = [...new Set(parsedEntries.map((entry) => entry.npo2Id))];
      const partnerOrgs = await prisma.organization.findMany({
        where: { id: { in: partnerIds } },
        select: { id: true },
      });
      const foundPartnerIds = new Set(partnerOrgs.map((org) => org.id));
      for (const partnerId of partnerIds) {
        if (!foundPartnerIds.has(partnerId)) {
          next(createError(404, `Partner organization ${partnerId} not found`));
          return;
        }
      }

      for (const entry of parsedEntries) {
        const { npo2Id, relationshipTier, relationshipType } = entry;

        // eslint-disable-next-line no-await-in-loop
        const relationship = await prisma.organizationRelationship.upsert({
          where: {
            npo1Id_npo2Id_relationshipTier: {
              npo1Id,
              npo2Id,
              relationshipTier,
            },
          },
          update: {
            ...(relationshipType !== null ? { relationshipType } : {}),
          },
          create: {
            npo1Id,
            npo2Id,
            relationshipTier,
            relationshipType,
          },
          select: {
            id: true,
            npo1Id: true,
            npo2Id: true,
            relationshipTier: true,
            relationshipType: true,
          },
        });

        createdRelationships.push(relationship);
      }

      res.status(201).json({ relationships: createdRelationships });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        next(createError(400, "Invalid organization id in relationship"));
        return;
      }
      next(err);
    }
  },
);

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
      include: orgTagsInclude,
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

    const images = toImageUrlArray(body.images);
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
    const description = toOptionalTrimmedString(body.description);

    const organization = await prisma.organization.create({
      data: {
        images,
        name: body.name.trim(),
        projectId: body.projectId.trim(),
        sizeCategory,
        website,
        location,
        budget,
        description,
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
      include: orgTagsInclude,
    });

    res.status(201).json({ organization: flattenOrganizationTags(organization) });
  } catch (err: unknown) {
    next(err);
  }
});

async function resolveTagIdSet(body: OrganizationBody): Promise<Set<string>> {
  const tagIds = toUniqueTrimmedStrings(body.tags);
  const tagNames = toUniqueTrimmedStrings(body.tagNames);

  const tagsById = tagIds.length
    ? await prisma.tag.findMany({
        where: { id: { in: tagIds } },
        select: { id: true },
      })
    : [];

  const resolved = new Set(tagsById.map((tag) => tag.id));

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
    resolved.add(tag.id);
  }

  return resolved;
}

/** PATCH /api/organizations/:id */
router.patch("/:id", ...requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  const rawId: unknown = req.params.id;
  if (typeof rawId !== "string" || rawId.length === 0) {
    next(createError(400, "Organization id is required"));
    return;
  }
  const id: string = rawId;

  try {
    const body = req.body as OrganizationBody;

    const data: {
      name?: string;
      sizeCategory?: string | null;
      website?: string | null;
      location?: string | null;
      budget?: string | null;
      description?: string | null;
    } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        throw createError(400, "name must be a non-empty string");
      }
      data.name = body.name.trim();
    }

    if ("sizeCategory" in body) data.sizeCategory = toOptionalTrimmedString(body.sizeCategory);
    if ("website" in body) data.website = toOptionalTrimmedString(body.website);
    if ("location" in body) data.location = toOptionalTrimmedString(body.location);
    if ("budget" in body) data.budget = toOptionalTrimmedString(body.budget);
    if ("description" in body) data.description = toOptionalTrimmedString(body.description);

    const replaceTags = body.tags !== undefined || body.tagNames !== undefined;
    const tagIds = replaceTags ? await resolveTagIdSet(body) : null;

    const organization = await prisma.$transaction(async (tx) => {
      const existing = await tx.organization.findUnique({ where: { id }, select: { id: true } });
      if (!existing) {
        throw createError(404, `Organization ${id} not found`);
      }

      if (tagIds) {
        await tx.organizationTag.deleteMany({ where: { organizationId: id } });
      }

      return tx.organization.update({
        where: { id },
        data: {
          ...data,
          ...(tagIds && tagIds.size > 0
            ? {
                tags: {
                  create: [...tagIds].map((tagId) => ({
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
    });

    res.status(200).json({ organization: flattenOrganizationTags(organization) });
  } catch (err: unknown) {
    next(err);
  }
});

router.delete("/:id", ...requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  const rawId: unknown = req.params.id;
  if (typeof rawId !== "string" || rawId.length === 0) {
    next(createError(400, "Organization id is required"));
    return;
  }
  const id: string = rawId;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.organization.findUnique({ where: { id }, select: { id: true } });
      if (!existing) {
        throw createError(404, `Organization ${id} not found`);
      }

      // Remove dependent rows first — these relations have no ON DELETE CASCADE.
      await tx.organizationTag.deleteMany({ where: { organizationId: id } });
      await tx.organizationRelationship.deleteMany({
        where: { OR: [{ npo1Id: id }, { npo2Id: id }] },
      });
      await tx.organization.delete({ where: { id } });
    });

    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
});

const EXT_PATTERN = /^[a-z0-9]{1,8}$/i;

function safeExtensionFromFilename(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot < 0 || lastDot === filename.length - 1) return "bin";
  const ext = filename.slice(lastDot + 1);
  return EXT_PATTERN.test(ext) ? ext.toLowerCase() : "bin";
}

/**
 * POST /api/organizations/:id/images/upload-url
 *
 * Returns a Supabase signed upload URL for a single image file.
 * The client PUTs the file directly to Supabase Storage using the returned URL,
 * then calls PATCH /api/organizations/:id/images to record the resulting public URL.
 *
 * Body: { filename: string }
 * Response: { uploadUrl: string; path: string; publicUrl: string }
 */
router.post(
  "/:id/images/upload-url",
  ...requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    const rawId: unknown = req.params.id;
    if (typeof rawId !== "string" || rawId.length === 0) {
      next(createError(400, "Organization id is required"));
      return;
    }
    const id: string = rawId;

    try {
      const org = await prisma.organization.findUnique({ where: { id }, select: { id: true } });
      if (!org) {
        next(createError(404, `Organization ${id} not found`));
        return;
      }

      const body = req.body as { filename?: unknown };
      if (typeof body.filename !== "string" || body.filename.trim().length === 0) {
        throw createError(400, "filename is required");
      }

      const ext = safeExtensionFromFilename(body.filename.trim());
      const storagePath = `${id}/${randomUUID()}.${ext}`;

      const { data, error } = await supabaseAdmin.storage
        .from(IMAGES_BUCKET)
        .createSignedUploadUrl(storagePath);

      if (error || !data) {
        console.error("Supabase signed URL error:", error);
        throw createError(500, "Failed to generate upload URL");
      }

      const { data: publicData } = supabaseAdmin.storage
        .from(IMAGES_BUCKET)
        .getPublicUrl(storagePath);

      res.status(200).json({
        uploadUrl: data.signedUrl,
        path: storagePath,
        publicUrl: publicData.publicUrl,
      });
    } catch (err: unknown) {
      next(err);
    }
  },
);

/**
 * PATCH /api/organizations/:id/images
 *
 * Appends one or more public image URLs to the organization's images array.
 * Called by the frontend after successfully uploading to Supabase Storage.
 *
 * Body: { urls: string[] }
 */
router.patch(
  "/:id/images",
  ...requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    const rawId: unknown = req.params.id;
    if (typeof rawId !== "string" || rawId.length === 0) {
      next(createError(400, "Organization id is required"));
      return;
    }
    const id: string = rawId;

    try {
      const body = req.body as { urls?: unknown };
      const urls = toImageUrlArray(body.urls);

      if (urls.length === 0) {
        throw createError(400, "urls array is required and must be non-empty");
      }

      const org = await prisma.organization.findUnique({
        where: { id },
        select: { id: true, images: true },
      });
      if (!org) {
        next(createError(404, `Organization ${id} not found`));
        return;
      }

      const updated = await prisma.organization.update({
        where: { id },
        data: { images: { push: urls } },
        include: orgTagsInclude,
      });

      res.status(200).json({ organization: flattenOrganizationTags(updated) });
    } catch (err: unknown) {
      next(err);
    }
  },
);

export default router;

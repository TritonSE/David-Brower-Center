import { randomUUID } from "node:crypto";

import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { SUPABASE_URL } from "../config";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabaseClients";
import { isAdminRequest, requireAdmin } from "../middleware/requireAuth";

import type { Prisma } from "../generated/prisma/client";

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
  mission?: unknown;
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
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reads a UUID route param, responding 404 for anything that cannot be a valid id. */
function parseIdParam(req: Request, param = "id"): string {
  const raw: unknown = req.params[param];
  if (typeof raw !== "string" || !UUID_PATTERN.test(raw)) {
    throw createError(404, "Not found");
  }
  return raw;
}

const PUBLIC_IMAGE_PREFIX = `/storage/v1/object/public/${IMAGES_BUCKET}/`;

/** Returns the bucket-relative path for a public URL in our images bucket, or null if it isn't one. */
function storagePathFromPublicUrl(url: string): string | null {
  try {
    const { origin, pathname } = new URL(url);
    if (origin !== new URL(SUPABASE_URL).origin) return null;
    if (!pathname.startsWith(PUBLIC_IMAGE_PREFIX)) return null;
    return decodeURIComponent(pathname.slice(PUBLIC_IMAGE_PREFIX.length));
  } catch {
    return null;
  }
}

/** Best-effort removal of storage objects; failures are logged, never surfaced to the client. */
async function removeStorageObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  try {
    const { error } = await supabaseAdmin.storage.from(IMAGES_BUCKET).remove(paths);
    if (error) console.error("Failed to remove storage objects:", error);
  } catch (error) {
    console.error("Failed to remove storage objects:", error);
  }
}

async function listOrganizationStoragePaths(organizationId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(IMAGES_BUCKET)
      .list(organizationId, { limit: 1000 });
    if (error || !data) {
      if (error) console.error("Failed to list organization images:", error);
      return [];
    }
    return data.map((file) => `${organizationId}/${file.name}`);
  } catch (error) {
    console.error("Failed to list organization images:", error);
    return [];
  }
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

// Private tags are admin-only; anonymous/non-admin readers only see public ones.
const publicOrgTagsInclude = {
  tags: {
    ...orgTagsInclude.tags,
    where: { tag: { visibility: "PUBLIC" } },
  },
} as const;

async function orgTagsIncludeFor(req: Request) {
  return (await isAdminRequest(req)) ? orgTagsInclude : publicOrgTagsInclude;
}

/** GET /api/organizations */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizations = await prisma.organization.findMany({
      include: await orgTagsIncludeFor(req),
    });
    res.status(200).json({ organizations: organizations.map(flattenOrganizationTags) });
  } catch (error) {
    console.error("GET /organizations failed:", error);
    next(createError(500, "Failed to fetch organizations"));
  }
});

const relationshipSelect = {
  id: true,
  npo1Id: true,
  npo2Id: true,
  relationshipTier: true,
  relationshipType: true,
} as const;

type ParsedRelationship = {
  npo2Id: string;
  relationshipTier: "PRIMARY" | "SECONDARY" | "TERTIARY";
  relationshipType: string | null;
};

/** Validates relationship entries for `npo1Id`, dropping exact duplicates. Throws 400 on bad input. */
function parseRelationshipEntries(
  npo1Id: string,
  rawRelationships: CreateRelationshipEntry[],
): ParsedRelationship[] {
  const parsed = new Map<string, ParsedRelationship>();

  for (const entry of rawRelationships) {
    if (!isRecord(entry) || typeof entry.npo2Id !== "string" || entry.npo2Id.trim().length === 0) {
      throw createError(400, "Each relationship must include npo2Id");
    }

    const npo2Id = entry.npo2Id.trim();
    if (!UUID_PATTERN.test(npo2Id)) {
      throw createError(404, `Partner organization ${npo2Id} not found`);
    }

    const relationshipTier = parseRelationshipTier(entry.relationshipTier);
    if (!relationshipTier) {
      throw createError(
        400,
        "Each relationship must include relationshipTier as PRIMARY, SECONDARY, or TERTIARY",
      );
    }

    if (npo1Id === npo2Id) {
      throw createError(400, "An organization cannot have a relationship with itself");
    }

    const relationshipType =
      typeof entry.relationshipType === "string" ? entry.relationshipType.trim() || null : null;

    parsed.set(`${npo2Id}:${relationshipTier}`, { npo2Id, relationshipTier, relationshipType });
  }

  return [...parsed.values()];
}

async function assertPartnersExist(
  db: Prisma.TransactionClient,
  partnerIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(partnerIds)];
  if (uniqueIds.length === 0) return;
  const found = await db.organization.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });
  const foundIds = new Set(found.map((org) => org.id));
  const missing = uniqueIds.find((partnerId) => !foundIds.has(partnerId));
  if (missing) {
    throw createError(404, `Partner organization ${missing} not found`);
  }
}

/** GET /api/organizations/relationships */
router.get("/relationships", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const relationships = await prisma.organizationRelationship.findMany({
      select: relationshipSelect,
    });
    res.status(200).json({ relationships });
  } catch {
    next(createError(500, "Failed to fetch organization relationships"));
  }
});

/** POST /api/organizations/relationships — adds (or updates) relationships without removing any. */
router.post(
  "/relationships",
  ...requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as CreateRelationshipsBody;

      if (!isRecord(body) || typeof body.npo1Id !== "string" || body.npo1Id.trim().length === 0) {
        throw createError(400, "npo1Id is required");
      }

      const npo1Id = body.npo1Id.trim();
      const rawRelationships = parseCreateRelationshipEntries(body.relationships);
      if (!rawRelationships) {
        throw createError(400, "relationships must be an array");
      }
      if (!UUID_PATTERN.test(npo1Id)) {
        throw createError(404, `Organization ${npo1Id} not found`);
      }

      const entries = parseRelationshipEntries(npo1Id, rawRelationships);

      const relationships = await prisma.$transaction(async (tx) => {
        const sourceOrg = await tx.organization.findUnique({
          where: { id: npo1Id },
          select: { id: true },
        });
        if (!sourceOrg) {
          throw createError(404, `Organization ${npo1Id} not found`);
        }
        await assertPartnersExist(
          tx,
          entries.map((entry) => entry.npo2Id),
        );

        const saved = [];
        for (const { npo2Id, relationshipTier, relationshipType } of entries) {
          // eslint-disable-next-line no-await-in-loop
          const relationship = await tx.organizationRelationship.upsert({
            where: { npo1Id_npo2Id_relationshipTier: { npo1Id, npo2Id, relationshipTier } },
            update: relationshipType !== null ? { relationshipType } : {},
            create: { npo1Id, npo2Id, relationshipTier, relationshipType },
            select: relationshipSelect,
          });
          saved.push(relationship);
        }
        return saved;
      });

      res.status(201).json({ relationships });
    } catch (err: unknown) {
      next(err);
    }
  },
);

/** DELETE /api/organizations/relationships/:relId */
router.delete(
  "/relationships/:relId",
  ...requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const relId = parseIdParam(req, "relId");
      const { count } = await prisma.organizationRelationship.deleteMany({ where: { id: relId } });
      if (count === 0) {
        throw createError(404, `Relationship ${relId} not found`);
      }
      res.status(204).send();
    } catch (err: unknown) {
      next(err);
    }
  },
);

/** GET /api/organizations/:id */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseIdParam(req);
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: await orgTagsIncludeFor(req),
    });

    if (!organization) {
      throw createError(404, `Organization ${id} not found`);
    }

    res.status(200).json({ organization: flattenOrganizationTags(organization) });
  } catch (err: unknown) {
    next(err);
  }
});

async function resolveTagIdSet(
  db: Prisma.TransactionClient,
  body: OrganizationBody,
): Promise<Set<string>> {
  const tagIds = toUniqueTrimmedStrings(body.tags).filter((tagId) => UUID_PATTERN.test(tagId));
  const tagNames = toUniqueTrimmedStrings(body.tagNames);

  const tagsById = tagIds.length
    ? await db.tag.findMany({
        where: { id: { in: tagIds } },
        select: { id: true },
      })
    : [];

  const resolved = new Set(tagsById.map((tag) => tag.id));

  // Sequential on purpose: interactive transactions run on a single connection.
  for (const tagName of tagNames) {
    // eslint-disable-next-line no-await-in-loop
    const tag = await db.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
      select: { id: true },
    });
    resolved.add(tag.id);
  }

  return resolved;
}

function tagCreateInput(tagIds: Set<string>) {
  return tagIds.size > 0
    ? { tags: { create: [...tagIds].map((tagId) => ({ tag: { connect: { id: tagId } } })) } }
    : {};
}

/** POST /api/organizations */
router.post("/", ...requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: unknown = req.body;
    if (!isRecord(body)) {
      throw createError(400, "Request body must be a JSON object");
    }
    const orgBody = body as OrganizationBody;

    if (typeof orgBody.name !== "string" || orgBody.name.trim().length === 0) {
      throw createError(400, "name is required");
    }
    const name = orgBody.name.trim();

    if (typeof orgBody.projectId !== "string" || orgBody.projectId.trim().length === 0) {
      throw createError(400, "projectId is required");
    }
    const projectId = orgBody.projectId.trim();

    const organization = await prisma.$transaction(async (tx) => {
      const tagIds = await resolveTagIdSet(tx, orgBody);
      return tx.organization.create({
        data: {
          images: toImageUrlArray(orgBody.images),
          name,
          projectId,
          sizeCategory: toOptionalTrimmedString(orgBody.sizeCategory),
          website: toOptionalTrimmedString(orgBody.website),
          location: toOptionalTrimmedString(orgBody.location),
          budget: toOptionalTrimmedString(orgBody.budget),
          description: toOptionalTrimmedString(orgBody.description),
          mission: toOptionalTrimmedString(orgBody.mission),
          ...tagCreateInput(tagIds),
        },
        include: orgTagsInclude,
      });
    });

    res.status(201).json({ organization: flattenOrganizationTags(organization) });
  } catch (err: unknown) {
    next(err);
  }
});

/**
 * PATCH /api/organizations/:id
 *
 * Only fields present in the body are changed. Tags are replaced only when `tags` or
 * `tagNames` is sent. `images` replaces the image list, but may only keep or reorder
 * images the organization already has; new images are added via the upload flow.
 */
router.patch("/:id", ...requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseIdParam(req);
    const body: unknown = req.body;
    if (!isRecord(body)) {
      throw createError(400, "Request body must be a JSON object");
    }
    const orgBody = body as OrganizationBody;

    const data: Prisma.OrganizationUpdateInput = {};

    if (orgBody.name !== undefined) {
      if (typeof orgBody.name !== "string" || orgBody.name.trim().length === 0) {
        throw createError(400, "name must be a non-empty string");
      }
      data.name = orgBody.name.trim();
    }

    const optionalStringFields = [
      "sizeCategory",
      "website",
      "location",
      "budget",
      "description",
      "mission",
    ] as const;
    for (const field of optionalStringFields) {
      if (field in orgBody) data[field] = toOptionalTrimmedString(orgBody[field]);
    }

    const replaceImages = orgBody.images !== undefined;
    if (replaceImages && !Array.isArray(orgBody.images)) {
      throw createError(400, "images must be an array of URLs");
    }
    const replaceTags = orgBody.tags !== undefined || orgBody.tagNames !== undefined;

    const { organization, removedImages } = await prisma.$transaction(async (tx) => {
      const existing = await tx.organization.findUnique({
        where: { id },
        select: { id: true, images: true },
      });
      if (!existing) {
        throw createError(404, `Organization ${id} not found`);
      }

      let removed: string[] = [];
      if (replaceImages) {
        const nextImages = toImageUrlArray(orgBody.images);
        const current = new Set(existing.images);
        if (nextImages.some((url) => !current.has(url))) {
          throw createError(400, "images may only contain the organization's existing images");
        }
        const kept = new Set(nextImages);
        removed = existing.images.filter((url) => !kept.has(url));
        data.images = { set: nextImages };
      }

      if (replaceTags) {
        const tagIds = await resolveTagIdSet(tx, orgBody);
        await tx.organizationTag.deleteMany({ where: { organizationId: id } });
        Object.assign(data, tagCreateInput(tagIds));
      }

      const updated = await tx.organization.update({
        where: { id },
        data,
        include: orgTagsInclude,
      });
      return { organization: updated, removedImages: removed };
    });

    await removeStorageObjects(
      removedImages
        .map(storagePathFromPublicUrl)
        .filter((path): path is string => path !== null && path.startsWith(`${id}/`)),
    );

    res.status(200).json({ organization: flattenOrganizationTags(organization) });
  } catch (err: unknown) {
    next(err);
  }
});

/** DELETE /api/organizations/:id */
router.delete("/:id", ...requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseIdParam(req);

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

    // Uploaded images live under `<orgId>/` in the bucket; clean them up once the row is gone.
    await removeStorageObjects(await listOrganizationStoragePaths(id));

    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
});

/**
 * PUT /api/organizations/:id/relationships
 *
 * Replaces every relationship involving the organization (in either direction) with the
 * given list. Relationships are undirected in the UI, so new rows are stored with this
 * organization as npo1. Idempotent, so clients can safely retry.
 *
 * Body: { relationships: Array<{ npo2Id, relationshipTier, relationshipType? }> }
 */
router.put(
  "/:id/relationships",
  ...requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseIdParam(req);
      const body: unknown = req.body;
      const rawRelationships = isRecord(body)
        ? parseCreateRelationshipEntries(body.relationships)
        : null;
      if (!rawRelationships) {
        throw createError(400, "relationships must be an array");
      }
      const entries = parseRelationshipEntries(id, rawRelationships);

      const relationships = await prisma.$transaction(async (tx) => {
        const existing = await tx.organization.findUnique({ where: { id }, select: { id: true } });
        if (!existing) {
          throw createError(404, `Organization ${id} not found`);
        }
        await assertPartnersExist(
          tx,
          entries.map((entry) => entry.npo2Id),
        );

        await tx.organizationRelationship.deleteMany({
          where: { OR: [{ npo1Id: id }, { npo2Id: id }] },
        });
        await tx.organizationRelationship.createMany({
          data: entries.map((entry) => ({ npo1Id: id, ...entry })),
        });
        return tx.organizationRelationship.findMany({
          where: { npo1Id: id },
          select: relationshipSelect,
        });
      });

      res.status(200).json({ relationships });
    } catch (err: unknown) {
      next(err);
    }
  },
);

const EXT_PATTERN = /^[a-z0-9]{1,8}$/i;
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "jp2", "gif", "webp"]);

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
    try {
      const id = parseIdParam(req);
      const org = await prisma.organization.findUnique({ where: { id }, select: { id: true } });
      if (!org) {
        throw createError(404, `Organization ${id} not found`);
      }

      const body = (isRecord(req.body) ? req.body : {}) as { filename?: unknown };
      if (typeof body.filename !== "string" || body.filename.trim().length === 0) {
        throw createError(400, "filename is required");
      }

      const ext = safeExtensionFromFilename(body.filename.trim());
      if (!IMAGE_EXTENSIONS.has(ext)) {
        throw createError(400, `Unsupported image type ".${ext}"`);
      }
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
 * Only URLs inside this organization's folder of the images bucket are accepted.
 *
 * Body: { urls: string[] }
 */
router.patch(
  "/:id/images",
  ...requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseIdParam(req);
      const body = (isRecord(req.body) ? req.body : {}) as { urls?: unknown };
      const urls = toImageUrlArray(body.urls);

      if (urls.length === 0) {
        throw createError(400, "urls array is required and must be non-empty");
      }
      if (urls.some((url) => !storagePathFromPublicUrl(url)?.startsWith(`${id}/`))) {
        throw createError(400, "urls must point to this organization's uploaded images");
      }

      const org = await prisma.organization.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!org) {
        throw createError(404, `Organization ${id} not found`);
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

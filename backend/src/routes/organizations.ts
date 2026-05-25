import { randomUUID } from "node:crypto";

import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

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
  tags?: unknown;
  website?: unknown;
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

    const tagIds: string[] =
      Array.isArray(body.tags) && body.tags.every((tag): tag is string => typeof tag === "string")
        ? body.tags
        : [];
    const images = toImageUrlArray(body.images);

    if (typeof body.projectId !== "string" || body.projectId.trim().length === 0) {
      throw createError(400, "projectId is required");
    }

    const sizeCategoryRaw = body.sizeCategory;
    const websiteRaw = body.website;

    const organization = await prisma.organization.create({
      data: {
        images,
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
      include: orgTagsInclude,
    });

    res.status(201).json({ organization: flattenOrganizationTags(organization) });
  } catch (err: unknown) {
    next(err);
  }
});

/**
 * POST /api/organizations/:id/images/upload-url
 *
 * Returns a Supabase signed upload URL for a single image file.
 * The client uploads the file directly to Supabase Storage using the returned URL,
 * then calls PATCH /api/organizations/:id/images to record the resulting public URL.
 *
 * Body: { filename: string; contentType: string }
 * Response: { uploadUrl: string; token: string; path: string; publicUrl: string }
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

      const body = req.body as { filename?: unknown; contentType?: unknown };
      if (typeof body.filename !== "string" || body.filename.trim().length === 0) {
        throw createError(400, "filename is required");
      }
      if (typeof body.contentType !== "string" || body.contentType.trim().length === 0) {
        throw createError(400, "contentType is required");
      }

      const ext = body.filename.split(".").pop() ?? "bin";
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
        token: data.token,
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

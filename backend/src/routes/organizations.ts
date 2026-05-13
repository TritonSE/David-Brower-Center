import { randomUUID } from "node:crypto";

import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabaseClients";
import { requireAdmin } from "../middleware/requireAuth";

const router = Router();

const IMAGES_BUCKET = "organization-images";

type OrganizationBody = {
  name?: unknown;
  projectId?: unknown;
  sizeCategory?: unknown;
  website?: unknown;
  tags?: unknown;
  images?: unknown;
};

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

const orgInclude = {
  tags: {
    select: {
      tag: { select: { id: true, name: true } },
    },
  },
} as const;

/** GET /api/organizations */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizations = await prisma.organization.findMany({ include: orgInclude });
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
      include: orgInclude,
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

    if (typeof body.projectId !== "string" || body.projectId.trim().length === 0) {
      throw createError(400, "projectId is required");
    }

    const sizeCategoryRaw = body.sizeCategory;
    const websiteRaw = body.website;

    const images: string[] =
      Array.isArray(body.images) &&
      body.images.every((img): img is string => typeof img === "string")
        ? body.images
        : [];

    const organization = await prisma.organization.create({
      data: {
        name: body.name.trim(),
        projectId: body.projectId.trim(),
        ...(typeof sizeCategoryRaw === "string"
          ? { sizeCategory: sizeCategoryRaw.trim() || null }
          : {}),
        ...(typeof websiteRaw === "string" ? { website: websiteRaw.trim() || null } : {}),
        images,
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
      include: orgInclude,
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
 * then calls PATCH /api/organizations/:id to record the resulting public URL.
 *
 * Body: { filename: string; contentType: string }
 * Response: { uploadUrl: string; publicUrl: string; path: string }
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
      const urls: string[] =
        Array.isArray(body.urls) &&
        body.urls.every((u): u is string => typeof u === "string" && u.trim().length > 0)
          ? body.urls.map((u) => u.trim())
          : [];

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
        include: orgInclude,
      });

      res.status(200).json({ organization: flattenOrganizationTags(updated) });
    } catch (err: unknown) {
      next(err);
    }
  },
);

export default router;

import { type NextFunction, type Request, type Response, Router } from "express";
import createError from "http-errors";

import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/requireAuth";

const router = Router();

type OrganizationBody = {
  name?: unknown;
  projectId?: unknown;
  sizeCategory?: unknown;
  website?: unknown;
  tags?: unknown;
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

/** GET /api/organizations */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
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

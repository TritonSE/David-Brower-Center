import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client.js";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");
const envBackendPath = path.join(cwd, ".env.backend");
const loadPath = fs.existsSync(envPath)
  ? envPath
  : fs.existsSync(envBackendPath)
    ? envBackendPath
    : envPath;
dotenv.config({ path: loadPath });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type OrgRelationship = {
  partnerProjectId: string;
  tier: "PRIMARY" | "SECONDARY" | "TERTIARY";
};

type OrgData = {
  projectId: string;
  name: string;
  sizeCategory?: string | null;
  focus?: string;
  website?: string | null;
  relationships?: OrgRelationship[];
};

const dataPath = path.join(cwd, "prisma", "data", "organizations.json");
const organizationsData = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as OrgData[];

const DEFAULT_TAG_COLOR = "#D9D9D9";

const TAG_COLORS: Record<string, string> = {
  "Climate Change Solutions": "#C2E5C0",
  "Community Resilience": "#F8DCC8",
  Conservation: "#D5E5C8",
  "Environmental Arts": "#D5C8F0",
  "Environmental Education": "#BFD8FB",
  "Environmental Justice": "#E2C8F0",
  "Indigenous Communities": "#F8C7B8",
  "International Initiatives": "#B6E5DC",
  "Oceans and Water": "#C8E8F0",
  "Pollution and Toxics": "#FCE8B2",
  "Sustainable Agriculture and Food Systems": "#FAD2B6",
  "Wildlife Protection": "#C8F0D8",
  "Women's Environmental Leadership": "#F8C8DC",
  "Youth Empowerment": "#FFE0B2",
};

const FALLBACK_PALETTE = [
  "#BFD8FB",
  "#FAD2B6",
  "#E2C8F0",
  "#C2E5C0",
  "#F8C8DC",
  "#FCE8B2",
  "#B6E5DC",
  "#F8C7B8",
  "#D5C8F0",
  "#C8F0D8",
  "#C8E8F0",
  "#F8DCC8",
  "#D5E5C8",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getColorFor(tagName: string): string {
  const explicit = TAG_COLORS[tagName];
  if (explicit) return explicit;
  if (FALLBACK_PALETTE.length === 0) return DEFAULT_TAG_COLOR;
  const palette = FALLBACK_PALETTE;
  return palette[hashString(tagName) % palette.length] ?? DEFAULT_TAG_COLOR;
}

async function main(): Promise<void> {
  console.info("Cleaning up existing data...");

  await prisma.organizationRelationship.deleteMany({});
  await prisma.organizationTag.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.tag.deleteMany({});

  console.info("Seeding organizations and tags...");

  const tagNamesSeen = new Set<string>();

  for (const org of organizationsData) {
    const focusAreas: string[] = org.focus
      ? org.focus
          .split("|")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    focusAreas.forEach((tagName) => tagNamesSeen.add(tagName));

    try {
      // eslint-disable-next-line no-await-in-loop
      await prisma.organization.upsert({
        where: { projectId: org.projectId },
        update: {
          name: org.name,
          sizeCategory: org.sizeCategory ?? null,
          website: org.website ?? null,
          tags: {
            deleteMany: {},
            create: focusAreas.map((tagName: string) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName, color: getColorFor(tagName) },
                },
              },
            })),
          },
        },
        create: {
          projectId: org.projectId,
          name: org.name,
          sizeCategory: org.sizeCategory ?? null,
          website: org.website ?? null,
          tags: {
            create: focusAreas.map((tagName: string) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName, color: getColorFor(tagName) },
                },
              },
            })),
          },
        },
      });
      console.info(`Seeded: ${org.name}`);
    } catch (error) {
      console.error(`Failed to seed ${org.name}:`, error);
    }
  }

  console.info("Seeding organization relationships...");

  // Build a lookup map from projectId -> database id
  const allOrgs = await prisma.organization.findMany({
    select: { id: true, projectId: true },
  });
  const projectIdToId = new Map<string, string>(
    allOrgs.map((o) => [o.projectId, o.id] as [string, string]),
  );

  let relationshipsCreated = 0;
  let relationshipsFailed = 0;

  for (const org of organizationsData) {
    if (!org.relationships || org.relationships.length === 0) continue;

    const npo1Id = projectIdToId.get(org.projectId);
    if (!npo1Id) {
      console.warn(
        `⚠️  Could not find seeded org for projectId "${org.projectId}", skipping relationships`,
      );
      continue;
    }

    for (const rel of org.relationships) {
      const npo2Id = projectIdToId.get(rel.partnerProjectId);
      if (!npo2Id) {
        console.warn(
          `⚠️  Could not find partner org "${rel.partnerProjectId}" for "${org.name}", skipping`,
        );
        relationshipsFailed++;
        continue;
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        await prisma.organizationRelationship.upsert({
          where: {
            npo1Id_npo2Id_relationshipTier: {
              npo1Id,
              npo2Id,
              relationshipTier: rel.tier,
            },
          },
          update: {},
          create: {
            npo1Id,
            npo2Id,
            relationshipTier: rel.tier,
          },
        });
        relationshipsCreated++;
      } catch (error) {
        console.error(
          `❌ Failed to seed relationship ${org.name} -> ${rel.partnerProjectId} (${rel.tier}):`,
          error,
        );
        relationshipsFailed++;
      }
    }
  }

  console.info(`Successfully seeded ${organizationsData.length} organizations.`);
  console.info(
    `Successfully seeded ${relationshipsCreated} relationships (${relationshipsFailed} failed).`,
  );
  console.info("Syncing tag colors with curated palette...");
  await Promise.all(
    [...tagNamesSeen].map(async (tagName) => {
      try {
        await prisma.tag.update({
          where: { name: tagName },
          data: { color: getColorFor(tagName) },
        });
      } catch (error) {
        console.error(`Failed to update color for tag ${tagName}:`, error);
      }
    }),
  );
  console.info(`Synced ${tagNamesSeen.size} tag colors.`);
}

void main()
  .then(async () => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });

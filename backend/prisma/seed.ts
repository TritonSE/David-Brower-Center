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

async function main(): Promise<void> {
  console.info("Cleaning up existing data...");

  await prisma.organizationRelationship.deleteMany({});
  await prisma.organizationTag.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.tag.deleteMany({});

  console.info("Seeding organizations and tags...");

  for (const org of organizationsData) {
    const focusAreas = org.focus ? org.focus.split("|").map((s: string) => s.trim()) : [];

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
                  create: { name: tagName },
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
                  create: { name: tagName },
                },
              },
            })),
          },
        },
      });
      console.info(`✅ Seeded: ${org.name}`);
    } catch (error) {
      console.error(`❌ Failed to seed ${org.name}:`, error);
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
}

void main()
  .then(async () => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });

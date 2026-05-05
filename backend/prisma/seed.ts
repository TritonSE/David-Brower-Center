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

const dataPath = path.join(cwd, "prisma", "data", "organizations.json");
const organizationsData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

async function main(): Promise<void> {
  console.info("Cleaning up existing data...");

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
          sizeCategory: org.sizeCategory,
          website: org.website,
          tags: {
            deleteMany: {}, // Optional: clears old tags so you don't get duplicates
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
          sizeCategory: org.sizeCategory,
          website: org.website,
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

  console.info(`Successfully seeded ${organizationsData.length} organizations.`);
}

void main()
  .then(async () => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });

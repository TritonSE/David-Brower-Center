import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

import { PrismaClient } from "../src/generated/prisma";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");
const envBackendPath = path.join(cwd, ".env.backend");
const loadPath = fs.existsSync(envPath)
  ? envPath
  : fs.existsSync(envBackendPath)
    ? envBackendPath
    : envPath;
dotenv.config({ path: loadPath });

type OrganizationData = {
  projectId: string;
  name: string;
  sizeCategory: string;
  focus: string;
  website: string;
};

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

  const orgPromises = organizationsData.map((org: OrganizationData) => {
    const focusAreas = org.focus ? org.focus.split("|").map((s: string) => s.trim()) : [];

    return prisma.organization.upsert({
      where: { projectId: org.projectId }, // Use the unique ID to find the record
      update: {
        name: org.name,
        sizeCategory: org.sizeCategory,
        website: org.website,
        // You can add logic to update tags here if needed
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
  });

  await Promise.all(orgPromises);

  console.info(`Successfully seeded ${organizationsData.length} organizations.`);
}

void main()
  .then(async () => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });

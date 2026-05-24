import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client.js";
import { getColorFor } from "../src/lib/tagColors.js";

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

async function main(): Promise<void> {
  const tags = await prisma.tag.findMany({ select: { id: true, name: true, color: true } });
  console.info(`Found ${tags.length} tags. Updating colors...`);

  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  await Promise.all(
    tags.map(async (tag) => {
      const target = getColorFor(tag.name);
      if (tag.color === target) {
        unchanged += 1;
        return;
      }
      try {
        await prisma.tag.update({ where: { id: tag.id }, data: { color: target } });
        updated += 1;
        console.info(`  ${tag.name}: ${tag.color} -> ${target}`);
      } catch (error) {
        failed += 1;
        console.error(`  Failed to update ${tag.name}:`, error);
      }
    }),
  );

  console.info(`Done. Updated ${updated}, unchanged ${unchanged}, failed ${failed}.`);
}

void main()
  .then(async () => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });

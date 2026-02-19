import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

import { PrismaClient } from "../src/generated/prisma/index.js";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");
const envBackendPath = path.join(cwd, ".env.backend");
const loadPath = fs.existsSync(envPath)
  ? envPath
  : fs.existsSync(envBackendPath)
    ? envBackendPath
    : envPath;
dotenv.config({ path: loadPath });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Set it in .env or .env.backend.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const tags = [
  {
    name: "Climate Action",
    description: "Environmental and climate focused work",
  },
  {
    name: "Housing Justice",
    description: "Housing access and affordability",
  },
  {
    name: "Youth Advocacy",
    description: "Youth led or youth focused initiatives",
  },
  {
    name: "Food Security",
    description: "Access to food and nutrition programs",
  },
  {
    name: "Policy Research",
    description: "Data driven policy work",
  },
];

const dummyOrganizations = [
  {
    name: "Bay Area Environmental Council",
    mission:
      "To protect and restore the San Francisco Bay and its watershed through advocacy, education, and community action.",
    city: "Oakland",
    state: "California",
    country: "United States",
    latitude: 37.8044,
    longitude: -122.2712,
    min_budget: 500_000,
    max_budget: 2_000_000,
  },
  {
    name: "Central Valley Food Bank",
    mission: "Fighting hunger by distributing food to families in need across the Central Valley.",
    city: "Fresno",
    state: "California",
    country: "United States",
    latitude: 36.7378,
    longitude: -119.7871,
    min_budget: 1_000_000,
    max_budget: 5_000_000,
  },
  {
    name: "Pacific Coast Marine Institute",
    mission: "Research and education focused on marine ecosystems and sustainable fisheries.",
    city: "San Diego",
    state: "California",
    country: "United States",
    latitude: 32.7157,
    longitude: -117.1611,
    min_budget: 250_000,
    max_budget: 1_500_000,
  },
  {
    name: "East Bay Arts Collective",
    mission: "Supporting local artists and making the arts accessible to underserved communities.",
    city: "Berkeley",
    state: "California",
    country: "United States",
    latitude: 37.8715,
    longitude: -122.273,
    min_budget: 100_000,
    max_budget: 750_000,
  },
  {
    name: "Sierra Nevada Land Trust",
    mission:
      "Conserving natural and working lands in the Sierra Nevada region for future generations.",
    city: "Truckee",
    state: "California",
    country: "United States",
    latitude: 39.328,
    longitude: -120.1836,
    min_budget: 300_000,
    max_budget: 1_200_000,
  },
];

async function main(): Promise<void> {
  // Seed tags first
  await prisma.tag.createMany({
    data: tags,
    skipDuplicates: true, // Don't error if tags already exist
  });
  console.info(`Seeded ${tags.length} tags.`);

  // Seed organizations
  const existing = await prisma.organization.findMany({ take: 1 });
  if (existing.length > 0) {
    console.info("Organizations table already has data; skipping seed.");
    return;
  }
  await prisma.organization.createMany({ data: dummyOrganizations });
  console.info(`Seeded ${dummyOrganizations.length} organizations.`);
}

void main()
  .then(async () => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });

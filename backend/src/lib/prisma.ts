import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/index.js";

/**
 * Single PrismaClient instance shared across the app.
 * Uses the pg driver adapter with DIRECT_URL preferred for runtime connectivity.
 */
const directUrl = process.env.DIRECT_URL;
const databaseUrl = process.env.DATABASE_URL;
const connectionString = directUrl ?? databaseUrl;
if (!connectionString) {
  throw new Error("No DB URL found. Set DIRECT_URL or DATABASE_URL in .env or .env.backend.");
}
const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

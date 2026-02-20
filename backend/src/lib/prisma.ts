import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/index.js";

/**
 * Single PrismaClient instance shared across the app.
 * Uses the pg driver adapter with DATABASE_URL from the environment (loaded by config.ts / dotenv).
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Set it in .env or .env.backend.");
}
const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

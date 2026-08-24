import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client.js";

/**
 * Single PrismaClient instance shared across the app.
 * On Vercel (serverless), use DATABASE_URL (transaction pooler).
 * Locally, prefer DIRECT_URL (session pooler) when available.
 */
const connectionString =
  process.env.VERCEL === "1"
    ? process.env.DATABASE_URL
    : (process.env.DIRECT_URL ?? process.env.DATABASE_URL);
if (!connectionString) {
  throw new Error("No DB URL found. Set DIRECT_URL or DATABASE_URL in .env or .env.backend.");
}
const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

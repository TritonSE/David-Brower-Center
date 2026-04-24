import fs from "node:fs";
import path from "node:path";

import * as dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");
const envBackendPath = path.join(cwd, ".env.backend");
const loadPath = fs.existsSync(envPath)
  ? envPath
  : fs.existsSync(envBackendPath)
    ? envBackendPath
    : envPath;
dotenv.config({ path: loadPath });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Use `tsx` (already a devDependency) instead of `ts-node`. Under
    // `"module": "nodenext"`, ts-node does strict ESM-style resolution and
    // won't remap the `.js` specifier used for the generated Prisma client
    // (e.g. `../src/generated/prisma/client.js`) to its `.ts` source file.
    // `tsx` handles that remapping out of the box.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});

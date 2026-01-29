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
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});

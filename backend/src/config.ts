import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";

import { InternalError } from "./errors/internal";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");
const envBackendPath = path.join(cwd, ".env.backend");
const loadPath = fs.existsSync(envPath)
  ? envPath
  : fs.existsSync(envBackendPath)
    ? envBackendPath
    : envPath;
dotenv.config({ path: loadPath });

function throwIfUndefined(envVar: string | undefined, error: InternalError): string {
  if (!envVar) throw error;
  return envVar;
}

const PORT = throwIfUndefined(process.env.APP_PORT, InternalError.NO_APP_PORT);
// const MONGO_URI = throwIfUndefined(process.env.MONGO_URI, InternalError.NO_MONGO_URI);
const FRONTEND_ORIGIN = throwIfUndefined(
  process.env.FRONTEND_ORIGIN,
  InternalError.NO_FRONTEND_ORIGIN,
);

const SUPABASE_URL = throwIfUndefined(process.env.SUPABASE_URL, InternalError.NO_SUPABASE_URL);
const SUPABASE_ANON_KEY = throwIfUndefined(
  process.env.SUPABASE_ANON_KEY,
  InternalError.NO_SUPABASE_ANON_KEY,
);
const SUPABASE_SERVICE_ROLE_KEY = throwIfUndefined(
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  InternalError.NO_SUPABASE_SERVICE_ROLE_KEY,
);

export { FRONTEND_ORIGIN, PORT, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL };

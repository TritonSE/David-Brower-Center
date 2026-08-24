import dotenv from "dotenv";

import { InternalError } from "./errors/internal";

dotenv.config();

function throwIfUndefined(envVar: string | undefined, error: InternalError): string {
  if (!envVar) throw error;
  return envVar;
}

const PORT =
  process.env.VERCEL === "1"
    ? (process.env.APP_PORT ?? "3000")
    : throwIfUndefined(process.env.APP_PORT, InternalError.NO_APP_PORT);

/** Comma-separated list of allowed frontend origins (no trailing slashes). */
const FRONTEND_ORIGINS = throwIfUndefined(
  process.env.FRONTEND_ORIGIN,
  InternalError.NO_FRONTEND_ORIGIN,
)
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

if (FRONTEND_ORIGINS.length === 0) {
  throw InternalError.NO_FRONTEND_ORIGIN;
}

/** Primary frontend origin (first entry). Kept for callers that need a single value. */
const FRONTEND_ORIGIN = FRONTEND_ORIGINS[0]!;
const SUPABASE_URL = throwIfUndefined(process.env.SUPABASE_URL, InternalError.NO_SUPABASE_URL);
const SUPABASE_ANON_KEY = throwIfUndefined(
  process.env.SUPABASE_ANON_KEY,
  InternalError.NO_SUPABASE_ANON_KEY,
);
const SUPABASE_SERVICE_ROLE_KEY = throwIfUndefined(
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  InternalError.NO_SUPABASE_SERVICE_ROLE_KEY,
);

export {
  FRONTEND_ORIGIN,
  FRONTEND_ORIGINS,
  PORT,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
};

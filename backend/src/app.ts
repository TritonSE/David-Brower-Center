import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import cors from "cors";
import express from "express";
import createError from "http-errors";

import apiRouter from "./api/whoami";
import {
  FRONTEND_ORIGIN,
  PORT,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "./config";
import { prisma } from "./lib/prisma";
import errorHandler from "./middleware/errorHandler";
import log from "./middleware/logger";

type AuthUserResult = {
  data: { user: { id: string } } | null;
  error: Error | null;
};

type PublicUserRow = {
  supabase_user_id: string;
  role: string;
};

type DbResult = {
  data: PublicUserRow | null;
  error: Error | null;
};

const supabaseAuthUnknown: unknown = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdminUnknown: unknown = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const supabaseAuth = supabaseAuthUnknown as SupabaseClient;
const supabaseAdmin = supabaseAdminUnknown as SupabaseClient;

async function requireAdminUser(req: express.Request): Promise<string> {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== "string") {
    throw createError(401, "Missing Authorization header");
  }

  const [scheme, token] = authHeader.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw createError(401, "Missing or invalid Authorization header");
  }

  const authResult = (await supabaseAuth.auth.getUser(token)) as AuthUserResult;
  const { data: authData, error: authError } = authResult;

  if (authError || !authData?.user) {
    throw createError(401, "Invalid or expired token");
  }

  const supabaseUserId = authData.user.id;

  const dbResult = (await supabaseAdmin
    .from("users")
    .select("supabase_user_id, role")
    .eq("supabase_user_id", supabaseUserId)
    .single()) as DbResult;

  const { data: userRow, error: dbError } = dbResult;

  if (dbError || !userRow) {
    throw createError(404, "User does not exist");
  }

  if (userRow.role !== "admin") {
    throw createError(403, "Admin access required");
  }

  return userRow.supabase_user_id;
}

const app = express();

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  }),
);

app.use(express.json());

app.use(log);

app.get("/", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Mount API routes
app.use("/api", apiRouter);
app.get("/organizations", async (req, res, next) => {
  try {
    const organizations = await prisma.organization.findMany();
    res.status(200).json({ organizations });
  } catch {
    next(createError(500, "Failed to fetch organizations"));
  }
});

// Admin-only: delete organization by id
app.delete("/organization/:id", async (req, res, next) => {
  try {
    await requireAdminUser(req);

    const { id } = req.params;

    if (typeof id !== "string" || id.trim().length === 0) {
      throw createError(400, "Organization id is required");
    }

    const existing = await prisma.organization.findUnique({ where: { id } });

    if (!existing) {
      throw createError(404, "Organization not found");
    }

    await prisma.organization.delete({ where: { id } });

    res.status(200).json({ message: "Organization deleted successfully" });
  } catch (err: unknown) {
    next(err);
  }
});

app.use(errorHandler);
app.listen(PORT, () => {
  console.info(`> Listening on port ${PORT}`);
});
// mongoose
//   .connect(MONGO_URI)
//   .then(() => {
//     console.info("Mongoose connected!");
//     app.listen(PORT, () => {
//       console.info(`> Listening on port ${PORT}`);
//     });
//   })
//   .catch(console.error);

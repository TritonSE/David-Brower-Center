import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import createError from "http-errors";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config";
import { prisma } from "../lib/prisma";

import type { NextFunction, Request, RequestHandler, Response } from "express";

export type AuthenticatedUser = {
  supabase_user_id: string;
  role: string;
};

type AuthUserResult = {
  data: { user: { id: string } } | null;
  error: Error | null;
};

const supabaseAuthUnknown: unknown = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAuth = supabaseAuthUnknown as SupabaseClient;

async function loadAuthenticatedUser(req: Request): Promise<AuthenticatedUser> {
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

  const user = await prisma.user.findUnique({
    where: { supabase_user_id: authData.user.id },
    select: { supabase_user_id: true, role: true },
  });

  if (!user) {
    throw createError(404, "User does not exist");
  }

  return user;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    req.authUser = await loadAuthenticatedUser(req);
    next();
  } catch (err: unknown) {
    next(err);
  }
}

const ensureAdmin: RequestHandler = (req, res, next) => {
  if (!req.authUser) {
    next(createError(500, "Authenticated user missing from request"));
    return;
  }

  if (req.authUser.role !== "admin") {
    next(createError(403, "Admin access required"));
    return;
  }

  next();
};

export const requireAdmin: RequestHandler[] = [requireAuth, ensureAdmin];

export function getRequestAuthUser(req: Request): AuthenticatedUser {
  if (!req.authUser) {
    throw createError(500, "Authenticated user missing from request");
  }

  return req.authUser;
}

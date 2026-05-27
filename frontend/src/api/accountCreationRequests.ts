import { del, get, post } from "./request";

import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/services/supabase";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function getAccessToken(): Promise<string> {
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const session = data.session as Session | null;
  const accessToken = session?.access_token;
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("You must be signed in as an admin to manage account requests.");
  }
  return accessToken;
}

function authHeaders(token: string): Record<string, string> {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export type AccountCreationRequest = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

function parseRequest(payload: unknown): AccountCreationRequest {
  if (!isRecord(payload)) {
    throw new Error("Unexpected account request response.");
  }

  const id = toString(payload.id);
  const email = toString(payload.email);
  const name = toString(payload.name);
  const createdAt = toString(payload.createdAt);
  const updatedAt = toString(payload.updatedAt);

  if (!id || !email || !createdAt || !updatedAt) {
    throw new Error("Account request response is missing required fields.");
  }

  return { id, email, name, createdAt, updatedAt };
}

export async function createAccountCreationRequest(input: {
  email: string;
  name: string;
}): Promise<AccountCreationRequest> {
  const response = await post("/api/account-creation-requests", input, {
    Accept: "application/json",
  });
  const payload: unknown = await response.json();

  if (!isRecord(payload)) {
    throw new Error("Unexpected account request response.");
  }

  return parseRequest(payload.request);
}

export async function getAccountCreationRequests(
  signal?: AbortSignal,
): Promise<AccountCreationRequest[]> {
  const token = await getAccessToken();
  const response = await get("/api/account-creation-requests", authHeaders(token), signal);
  const payload: unknown = await response.json();

  if (!isRecord(payload) || !Array.isArray(payload.requests)) {
    throw new Error("Unexpected account requests response.");
  }

  return payload.requests.map(parseRequest);
}

export async function approveAccountCreationRequest(
  id: string,
  signal?: AbortSignal,
): Promise<void> {
  const token = await getAccessToken();
  await post(`/api/account-creation-requests/${id}/approve`, {}, authHeaders(token), signal);
}

export async function rejectAccountCreationRequest(
  id: string,
  signal?: AbortSignal,
): Promise<void> {
  const token = await getAccessToken();
  await del(`/api/account-creation-requests/${id}`, authHeaders(token), undefined, signal);
}

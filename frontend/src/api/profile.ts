import { authHeaders, getAccessToken } from "./auth";
import { get, patch } from "./request";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type Profile = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
};

function parseProfilePayload(payload: unknown): Profile {
  if (!isRecord(payload)) {
    throw new Error("Unexpected profile response.");
  }

  const id = toOptionalString(payload.id);
  const email = toOptionalString(payload.email);
  const name = toOptionalString(payload.name) ?? "";
  const firstName = toOptionalString(payload.firstName) ?? "";
  const lastName = toOptionalString(payload.lastName) ?? "";
  const phone = toOptionalString(payload.phone) ?? "";
  const role = toOptionalString(payload.role) ?? "admin";

  if (!id || !email) {
    throw new Error("Profile response is missing required fields.");
  }

  return {
    id,
    email,
    name: name || [firstName, lastName].filter(Boolean).join(" "),
    firstName,
    lastName,
    phone,
    role,
  };
}

export async function getProfile(signal?: AbortSignal): Promise<Profile> {
  const token = await getAccessToken();
  const response = await get("/api/users/profile", authHeaders(token), signal);
  const payload: unknown = await response.json();
  return parseProfilePayload(payload);
}

export async function getUserProfileById(userId: string, signal?: AbortSignal): Promise<Profile> {
  const token = await getAccessToken();
  const response = await get(
    `/api/users/${encodeURIComponent(userId)}`,
    authHeaders(token),
    signal,
  );
  const payload: unknown = await response.json();
  return parseProfilePayload(payload);
}

export async function updateProfile(
  input: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  },
  signal?: AbortSignal,
): Promise<Profile> {
  const token = await getAccessToken();
  const response = await patch("/api/users/profile", input, authHeaders(token), signal);
  const payload: unknown = await response.json();
  return parseProfilePayload(payload);
}

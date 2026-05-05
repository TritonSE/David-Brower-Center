import { supabase } from "@/services/supabase";

const MISSING_BACKEND_URL_ERROR =
  "Missing NEXT_PUBLIC_BACKEND_URL. Set it in frontend/.env to call the backend APIs.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new Error(MISSING_BACKEND_URL_ERROR);
  }
  return backendUrl;
}

function toUrl(route: string): string {
  return new URL(route, getBackendUrl()).toString();
}

function toOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("You must be signed in to view or edit your profile.");
  }
  return token;
}

export type Profile = {
  id: string;
  email: string;
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
    firstName,
    lastName,
    phone,
    role,
  };
}

function parseErrorMessage(status: number, payload: unknown): string {
  if (isRecord(payload) && typeof payload.error === "string" && payload.error.trim().length > 0) {
    return payload.error;
  }
  return `Request failed with status ${status}`;
}

export async function getProfile(): Promise<Profile> {
  const token = await getAccessToken();
  const response = await fetch(toUrl("/api/profile"), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, payload));
  }

  return parseProfilePayload(payload);
}

export async function updateProfile(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<Profile> {
  const token = await getAccessToken();
  const response = await fetch(toUrl("/api/profile"), {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, payload));
  }

  return parseProfilePayload(payload);
}

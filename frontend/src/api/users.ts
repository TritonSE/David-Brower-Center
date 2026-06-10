import { authHeaders, getAccessToken } from "./auth";
import { del, get, handleAPIError, isAbortError, patch, post } from "./request";

import type { APIResult } from "./request";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export type UserAccount = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  profilePicture: string;
  role: string;
  createdAt: string;
};

export type CreateUserValues = {
  email: string;
  password?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role?: string | null;
};

export type UpdateUserValues = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role?: string | null;
};

function parseUser(payload: unknown): UserAccount {
  if (!isRecord(payload)) {
    throw new Error("[/api/users] Unexpected user response shape.");
  }

  const id = toString(payload.id);
  const email = toString(payload.email);
  if (!id || !email) {
    throw new Error("[/api/users] User response is missing required fields.");
  }

  return {
    id,
    email,
    name: toString(payload.name),
    firstName: toString(payload.firstName),
    lastName: toString(payload.lastName),
    phone: toString(payload.phone),
    profilePicture: toString(payload.profilePicture),
    role: toString(payload.role),
    createdAt: toString(payload.createdAt),
  };
}

export async function getUsers(signal?: AbortSignal): Promise<APIResult<UserAccount[]>> {
  try {
    const token = await getAccessToken();
    const response = await get("/api/users", authHeaders(token), signal);
    const payload: unknown = await response.json();
    if (!isRecord(payload) || !Array.isArray(payload.users)) {
      throw new Error("[/api/users] Unexpected response shape.");
    }
    return { success: true, data: payload.users.map(parseUser) };
  } catch (error) {
    if (isAbortError(error)) throw error;
    return handleAPIError(error);
  }
}

export async function createUser(
  input: CreateUserValues,
  signal?: AbortSignal,
): Promise<APIResult<UserAccount>> {
  try {
    const token = await getAccessToken();
    const response = await post(
      "/api/users",
      {
        email: input.email,
        ...(input.password ? { password: input.password } : {}),
        ...(input.firstName ? { firstName: input.firstName } : {}),
        ...(input.lastName ? { lastName: input.lastName } : {}),
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.role ? { role: input.role } : {}),
      },
      authHeaders(token),
      signal,
    );
    const payload: unknown = await response.json();
    if (!isRecord(payload)) {
      throw new Error("[/api/users] Unexpected response shape.");
    }
    return { success: true, data: parseUser(payload.user) };
  } catch (error) {
    if (isAbortError(error)) throw error;
    return handleAPIError(error);
  }
}

export async function updateUser(
  id: string,
  input: UpdateUserValues,
  signal?: AbortSignal,
): Promise<APIResult<UserAccount>> {
  try {
    const token = await getAccessToken();
    const response = await patch(
      `/api/users/${encodeURIComponent(id)}`,
      {
        email: input.email,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        phone: input.phone ?? null,
        ...(input.role ? { role: input.role } : {}),
      },
      authHeaders(token),
      signal,
    );
    const payload: unknown = await response.json();
    if (!isRecord(payload)) {
      throw new Error("[/api/users] Unexpected response shape.");
    }
    return { success: true, data: parseUser(payload.user) };
  } catch (error) {
    if (isAbortError(error)) throw error;
    return handleAPIError(error);
  }
}

export async function deleteUser(id: string, signal?: AbortSignal): Promise<APIResult<void>> {
  try {
    const token = await getAccessToken();
    await del(`/api/users/${encodeURIComponent(id)}`, authHeaders(token), undefined, signal);
    return { success: true, data: undefined };
  } catch (error) {
    if (isAbortError(error)) throw error;
    return handleAPIError(error);
  }
}

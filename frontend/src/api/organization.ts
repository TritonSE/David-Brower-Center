import { get, handleAPIError, isAbortError, post } from "./request";

import type { APIResult } from "./request";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/services/supabase";

const NOT_PROVIDED = "Not provided";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toFallbackString(value: unknown): string {
  return toOptionalString(value) ?? NOT_PROVIDED;
}

function parseOrganizationsPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  if (isRecord(payload)) {
    const candidates = [payload.organizations, payload.data, payload.items];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
  }

  throw new Error("[/api/organizations] Unexpected response shape.");
}

function parseRelationshipsPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  if (isRecord(payload) && Array.isArray(payload.relationships)) {
    return payload.relationships;
  }

  throw new Error("[/api/organizations/relationships] Unexpected response shape.");
}

function parseOrganizationPayload(payload: unknown): unknown {
  if (isRecord(payload)) {
    if (isRecord(payload.organization)) return payload.organization;
    if (isRecord(payload.data)) return payload.data;
    return payload;
  }

  throw new Error("[/api/organizations/:id] Unexpected response shape.");
}

function getRequiredString(value: unknown, route: string, field: string): string {
  const stringValue = toOptionalString(value);
  if (!stringValue) {
    throw new Error(`[${route}] Missing required field "${field}" in response.`);
  }
  return stringValue;
}

export type OrganizationTag = {
  id: string;
  name: string;
  color: string;
};

const DEFAULT_TAG_COLOR = "#D9D9D9";
const HEX_COLOR_PATTERN = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function parseTagColor(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_TAG_COLOR;
  const trimmed = value.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) return DEFAULT_TAG_COLOR;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export type OrganizationListItem = {
  id: string;
  name: string;
  focus: string;
  year: string;
  updatedAt: string;
  tags: OrganizationTag[];
};

export type OrganizationRelationshipTier = "PRIMARY" | "SECONDARY" | "TERTIARY";

export type OrganizationRelationship = {
  id: string;
  npo1Id: string;
  npo2Id: string;
  relationshipTier: OrganizationRelationshipTier;
  relationshipType: string | null;
};

export type CreateOrganizationInput = {
  name: string;
  projectId: string;
  website?: string;
  sizeCategory?: string;
  tagIds?: string[];
};

export type CreateRelationshipInput = {
  npo2Id: string;
  relationshipTier: OrganizationRelationshipTier;
  relationshipType?: string;
};

export type CreateOrganizationRelationshipsInput = {
  npo1Id: string;
  relationships: CreateRelationshipInput[];
};

export type OrganizationDetail = {
  id: string;
  name: string;
  focus: string;
  year: string;
  size: string;
  budget: string;
  location: string;
  description: string;
  mission: string;
  tags: OrganizationTag[];
};

function parseOrganizationTag(value: unknown): OrganizationTag | null {
  if (!isRecord(value)) return null;
  const id = toOptionalString(value.id);
  const name = toOptionalString(value.name);
  if (!id || !name) return null;
  return { id, name, color: parseTagColor(value.color) };
}

function parseOrganizationTagList(value: unknown): OrganizationTag[] {
  if (!Array.isArray(value)) return [];
  const tags: OrganizationTag[] = [];
  for (const entry of value) {
    const tag = parseOrganizationTag(entry);
    if (tag) tags.push(tag);
  }
  return tags;
}

function parseOrganizationListItem(value: unknown): OrganizationListItem {
  if (!isRecord(value)) {
    throw new Error("[/api/organizations] Expected each organization item to be an object.");
  }

  return {
    id: getRequiredString(value.id, "/api/organizations", "id"),
    name: getRequiredString(value.name, "/api/organizations", "name"),
    focus: toFallbackString(value.focus),
    year: toFallbackString(value.year),
    updatedAt: toFallbackString(value.updatedAt),
    tags: parseOrganizationTagList(value.tags),
  };
}

function parseOrganizationDetail(value: unknown): OrganizationDetail {
  if (!isRecord(value)) {
    throw new Error("[/api/organizations/:id] Expected organization detail to be an object.");
  }

  return {
    id: getRequiredString(value.id, "/api/organizations/:id", "id"),
    name: getRequiredString(value.name, "/api/organizations/:id", "name"),
    focus: toFallbackString(value.focus),
    year: toFallbackString(value.year),
    size: toFallbackString(value.size),
    budget: toFallbackString(value.budget),
    location: toFallbackString(value.location),
    description: toFallbackString(value.description),
    mission: toFallbackString(value.mission),
    tags: parseOrganizationTagList(value.tags),
  };
}

export async function getOrganizations(
  signal?: AbortSignal,
): Promise<APIResult<OrganizationListItem[]>> {
  try {
    const response = await get("/api/organizations", {}, signal);
    const payload: unknown = await response.json();
    const organizations = parseOrganizationsPayload(payload);
    return { success: true, data: organizations.map(parseOrganizationListItem) };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    return handleAPIError(error);
  }
}

function parseRelationshipTier(value: unknown): OrganizationRelationshipTier | null {
  if (value === "PRIMARY" || value === "SECONDARY" || value === "TERTIARY") {
    return value;
  }
  return null;
}

function parseOrganizationRelationship(value: unknown): OrganizationRelationship | null {
  if (!isRecord(value)) return null;

  const id = toOptionalString(value.id);
  const npo1Id = toOptionalString(value.npo1Id);
  const npo2Id = toOptionalString(value.npo2Id);
  const tier = parseRelationshipTier(value.relationshipTier);

  if (!id || !npo1Id || !npo2Id || !tier) return null;

  return {
    id,
    npo1Id,
    npo2Id,
    relationshipTier: tier,
    relationshipType: toOptionalString(value.relationshipType),
  };
}

export async function getOrganizationRelationships(
  signal?: AbortSignal,
): Promise<APIResult<OrganizationRelationship[]>> {
  try {
    const response = await get("/api/organizations/relationships", {}, signal);
    const payload: unknown = await response.json();
    const raw = parseRelationshipsPayload(payload);
    const relationships: OrganizationRelationship[] = [];
    for (const entry of raw) {
      const relationship = parseOrganizationRelationship(entry);
      if (relationship) relationships.push(relationship);
    }
    return { success: true, data: relationships };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    return handleAPIError(error);
  }
}

export async function getOrganizationById(
  id: string,
  signal?: AbortSignal,
): Promise<APIResult<OrganizationDetail>> {
  try {
    const response = await get(`/api/organizations/${encodeURIComponent(id)}`, {}, signal);
    const payload: unknown = await response.json();
    const organization = parseOrganizationPayload(payload);
    return { success: true, data: parseOrganizationDetail(organization) };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    return handleAPIError(error);
  }
}

async function getAccessToken(): Promise<string> {
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(sessionError.message);
  }
  const session = data.session as Session | null;
  const accessToken = session?.access_token;
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("You must be signed in to create organizations or relationships.");
  }
  return accessToken;
}

function authHeaders(token: string): Record<string, string> {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function parseCreatedOrganizationPayload(payload: unknown): OrganizationListItem {
  if (!isRecord(payload)) {
    throw new Error("[/api/organizations] Unexpected create response shape.");
  }
  const organization = isRecord(payload.organization) ? payload.organization : payload;
  return parseOrganizationListItem(organization);
}

export async function createOrganization(
  input: CreateOrganizationInput,
  signal?: AbortSignal,
): Promise<OrganizationListItem> {
  const token = await getAccessToken();
  const response = await post(
    "/api/organizations",
    {
      name: input.name.trim(),
      projectId: input.projectId.trim(),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.sizeCategory !== undefined ? { sizeCategory: input.sizeCategory } : {}),
      ...(input.tagIds && input.tagIds.length > 0 ? { tags: input.tagIds } : {}),
    },
    authHeaders(token),
    signal,
  );
  const payload: unknown = await response.json();
  return parseCreatedOrganizationPayload(payload);
}

export async function createOrganizationRelationships(
  input: CreateOrganizationRelationshipsInput,
  signal?: AbortSignal,
): Promise<OrganizationRelationship[]> {
  const token = await getAccessToken();
  const response = await post(
    "/api/organizations/relationships",
    {
      npo1Id: input.npo1Id,
      relationships: input.relationships.map((relationship) => ({
        npo2Id: relationship.npo2Id,
        relationshipTier: relationship.relationshipTier,
        ...(relationship.relationshipType !== undefined
          ? { relationshipType: relationship.relationshipType }
          : {}),
      })),
    },
    authHeaders(token),
    signal,
  );
  const payload: unknown = await response.json();
  const raw = parseRelationshipsPayload(payload);
  const relationships: OrganizationRelationship[] = [];
  for (const entry of raw) {
    const relationship = parseOrganizationRelationship(entry);
    if (relationship) relationships.push(relationship);
  }
  return relationships;
}

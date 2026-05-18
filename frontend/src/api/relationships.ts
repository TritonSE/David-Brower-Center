import { get } from "./request";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseRelationshipsPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  if (isRecord(payload)) {
    const candidates = [payload.relationships, payload.data, payload.items];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
  }

  throw new Error("[/api/relationships] Unexpected response shape.");
}

function getRequiredString(value: unknown, field: string): string {
  const stringValue = toOptionalString(value);
  if (!stringValue) {
    throw new Error(`[/api/relationships] Missing required field "${field}" in response.`);
  }
  return stringValue;
}

const RELATIONSHIP_TIERS = ["PRIMARY", "SECONDARY", "TERTIARY"] as const;

export type RelationshipTier = (typeof RELATIONSHIP_TIERS)[number];

function parseRelationshipTier(value: unknown): RelationshipTier {
  if (typeof value !== "string") {
    throw new TypeError(
      '[/api/relationships] Missing required field "relationshipTier" in response.',
    );
  }

  const tier = value.trim().toUpperCase();
  if ((RELATIONSHIP_TIERS as readonly string[]).includes(tier)) {
    return tier as RelationshipTier;
  }

  throw new Error(`[/api/relationships] Invalid relationshipTier "${value}".`);
}

export type OrganizationRelationship = {
  id: string;
  npo1Id: string;
  npo2Id: string;
  relationshipTier: RelationshipTier;
  relationshipType: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

function parseRelationship(value: unknown): OrganizationRelationship {
  if (!isRecord(value)) {
    throw new Error("[/api/relationships] Invalid relationship entry in response.");
  }

  return {
    id: getRequiredString(value.id, "id"),
    npo1Id: getRequiredString(value.npo1Id, "npo1Id"),
    npo2Id: getRequiredString(value.npo2Id, "npo2Id"),
    relationshipTier: parseRelationshipTier(value.relationshipTier),
    relationshipType: toOptionalString(value.relationshipType),
    description: toOptionalString(value.description),
    createdAt: getRequiredString(value.createdAt, "createdAt"),
    updatedAt: getRequiredString(value.updatedAt, "updatedAt"),
  };
}

export async function getRelationships(signal?: AbortSignal): Promise<OrganizationRelationship[]> {
  const response = await get(
    "/api/relationships",
    {
      Accept: "application/json",
    },
    signal,
  );
  const payload: unknown = await response.json();
  const rawRelationships = parseRelationshipsPayload(payload);
  return rawRelationships.map(parseRelationship);
}

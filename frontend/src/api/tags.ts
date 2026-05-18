import { get, post } from "./request";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type TagVisibility = "public" | "private";

export type TagRecord = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  visibility: TagVisibility;
};

export type CreateTagInput = {
  name: string;
  color: string;
  visibility: TagVisibility;
  description?: string;
};

function parseTagsPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  if (isRecord(payload)) {
    const candidates = [payload.tags, payload.data, payload.items];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
  }

  throw new Error("[/api/tags] Unexpected response shape.");
}

function parseTagName(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  if (isRecord(value)) {
    const name = toNonEmptyString(value.name);
    if (name) return name;
  }

  throw new Error('[/api/tags] Missing required field "name" in response.');
}

function parseTagVisibility(value: unknown): TagVisibility | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "public") return "public";
  if (normalized === "private") return "private";
  return null;
}

function parseTagRecord(value: unknown): TagRecord {
  if (!isRecord(value)) {
    throw new Error("[/api/tags] Invalid tag object in response.");
  }

  const id = toNonEmptyString(value.id);
  const name = toNonEmptyString(value.name);
  const color = toNonEmptyString(value.color);
  const visibility = parseTagVisibility(value.visibility);

  if (!id || !name || !color || !visibility) {
    throw new Error("[/api/tags] Tag response is missing required fields.");
  }

  const description =
    value.description === null || value.description === undefined
      ? null
      : typeof value.description === "string"
        ? value.description
        : null;

  return { id, name, description, color, visibility };
}

function parseCreateTagPayload(payload: unknown): TagRecord {
  if (!isRecord(payload)) {
    throw new Error("[/api/tags] Unexpected create response shape.");
  }

  if (isRecord(payload.tag)) {
    return parseTagRecord(payload.tag);
  }

  return parseTagRecord(payload);
}

export async function getTags(signal?: AbortSignal): Promise<string[]> {
  const response = await get(
    "/api/tags",
    {
      Accept: "application/json",
    },
    signal,
  );
  const payload: unknown = await response.json();
  const rawTags = parseTagsPayload(payload);
  const names = rawTags.map(parseTagName);

  return [...new Set(names)];
}

export async function createTag(input: CreateTagInput, signal?: AbortSignal): Promise<TagRecord> {
  const response = await post(
    "/api/tags",
    {
      name: input.name.trim(),
      color: input.color,
      visibility: input.visibility,
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
    { Accept: "application/json" },
    signal,
  );
  const payload: unknown = await response.json();
  return parseCreateTagPayload(payload);
}

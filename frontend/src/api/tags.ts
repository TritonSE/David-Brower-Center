import { get } from "./request";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

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

export type TagMeta = {
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

function parseTagMeta(value: unknown): TagMeta | null {
  if (!isRecord(value)) return null;
  const id = toNonEmptyString(value.id);
  const name = toNonEmptyString(value.name);
  if (!id || !name) return null;
  return { id, name, color: parseTagColor(value.color) };
}

export async function getTagsWithMeta(signal?: AbortSignal): Promise<TagMeta[]> {
  const response = await get(
    "/api/tags",
    {
      Accept: "application/json",
    },
    signal,
  );
  const payload: unknown = await response.json();
  const rawTags = parseTagsPayload(payload);

  const tags: TagMeta[] = [];
  const seenIds = new Set<string>();
  for (const entry of rawTags) {
    const tag = parseTagMeta(entry);
    if (!tag) continue;
    if (seenIds.has(tag.id)) continue;
    seenIds.add(tag.id);
    tags.push(tag);
  }
  return tags;
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

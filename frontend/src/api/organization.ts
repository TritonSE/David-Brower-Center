const MISSING_BACKEND_URL_ERROR =
  "Missing NEXT_PUBLIC_BACKEND_URL. Set it in frontend/.env to call the backend APIs.";
const NOT_PROVIDED = "Not provided";
const REQUEST_TIMEOUT_MS = 10_000;

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

function toFallbackString(value: unknown): string {
  return toOptionalString(value) ?? NOT_PROVIDED;
}

function parseErrorMessage(route: string, status: number, payload: unknown): string {
  if (isRecord(payload)) {
    const maybeMessage =
      typeof payload.message === "string"
        ? payload.message
        : typeof payload.error === "string"
          ? payload.error
          : null;

    if (maybeMessage && maybeMessage.trim().length > 0) {
      return `[${route}] Request failed with status ${status}: ${maybeMessage}`;
    }
  }

  return `[${route}] Request failed with status ${status}`;
}

async function requestJson(route: string, signal?: AbortSignal): Promise<unknown> {
  const timeoutController = new AbortController();
  const requestController = new AbortController();

  const forwardCallerAbort = () => requestController.abort(signal?.reason);
  const forwardTimeoutAbort = () => requestController.abort(timeoutController.signal.reason);

  if (signal) {
    if (signal.aborted) {
      requestController.abort(signal.reason);
    } else {
      signal.addEventListener("abort", forwardCallerAbort, { once: true });
    }
  }

  timeoutController.signal.addEventListener("abort", forwardTimeoutAbort, { once: true });

  const timeoutId = setTimeout(() => {
    timeoutController.abort(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`);
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(toUrl(route), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: requestController.signal,
    });

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(parseErrorMessage(route, response.status, payload));
    }
    return payload;
  } catch (error: unknown) {
    if (timeoutController.signal.aborted && !(signal?.aborted ?? false)) {
      throw new Error(`[${route}] Request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    timeoutController.signal.removeEventListener("abort", forwardTimeoutAbort);
    if (signal) {
      signal.removeEventListener("abort", forwardCallerAbort);
    }
  }
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

  throw new Error("[/organizations] Unexpected response shape.");
}

function parseOrganizationPayload(payload: unknown): unknown {
  if (isRecord(payload)) {
    if (isRecord(payload.organization)) return payload.organization;
    if (isRecord(payload.data)) return payload.data;
    return payload;
  }

  throw new Error("[/organizations/:id] Unexpected response shape.");
}

function getRequiredString(value: unknown, route: string, field: string): string {
  const stringValue = toOptionalString(value);
  if (!stringValue) {
    throw new Error(`[${route}] Missing required field "${field}" in response.`);
  }
  return stringValue;
}

export type OrganizationListItem = {
  id: string;
  name: string;
  focus: string;
  year: string;
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
};

function parseOrganizationListItem(value: unknown): OrganizationListItem {
  if (!isRecord(value)) {
    throw new Error("[/organizations] Expected each organization item to be an object.");
  }

  return {
    id: getRequiredString(value.id, "/organizations", "id"),
    name: getRequiredString(value.name, "/organizations", "name"),
    focus: toFallbackString(value.focus),
    year: toFallbackString(value.year),
  };
}

function parseOrganizationDetail(value: unknown): OrganizationDetail {
  if (!isRecord(value)) {
    throw new Error("[/organizations/:id] Expected organization detail to be an object.");
  }

  return {
    id: getRequiredString(value.id, "/organizations/:id", "id"),
    name: getRequiredString(value.name, "/organizations/:id", "name"),
    focus: toFallbackString(value.focus),
    year: toFallbackString(value.year),
    size: toFallbackString(value.size),
    budget: toFallbackString(value.budget),
    location: toFallbackString(value.location),
    description: toFallbackString(value.description),
    mission: toFallbackString(value.mission),
  };
}

export async function getOrganizations(signal?: AbortSignal): Promise<OrganizationListItem[]> {
  const payload = await requestJson("/organizations", signal);
  const organizations = parseOrganizationsPayload(payload);
  return organizations.map(parseOrganizationListItem);
}

export async function getOrganizationById(
  id: string,
  signal?: AbortSignal,
): Promise<OrganizationDetail> {
  const payload = await requestJson(`/organizations/${encodeURIComponent(id)}`, signal);
  const organization = parseOrganizationPayload(payload);
  return parseOrganizationDetail(organization);
}

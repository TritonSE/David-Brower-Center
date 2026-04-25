const MISSING_BACKEND_URL_ERROR =
  "Missing NEXT_PUBLIC_BACKEND_URL. Set it in frontend/.env to call the backend APIs.";
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

  throw new Error("[/tags] Unexpected response shape.");
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

  throw new Error('[/tags] Missing required field "name" in response.');
}

export async function getTags(signal?: AbortSignal): Promise<string[]> {
  const payload = await requestJson("/tags", signal);
  const rawTags = parseTagsPayload(payload);
  const names = rawTags.map(parseTagName);

  return [...new Set(names)];
}

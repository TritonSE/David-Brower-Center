type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const MISSING_BACKEND_URL_ERROR =
  "Missing NEXT_PUBLIC_BACKEND_URL. Set it in frontend/.env to call the backend APIs.";

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

async function fetchRequest(
  method: Method,
  url: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<Response> {
  const hasBody = body !== undefined;
  const nextHeaders = { ...headers };

  if (hasBody) {
    nextHeaders["Content-Type"] = "application/json";
  }

  return fetch(toUrl(url), {
    method,
    headers: nextHeaders,
    body: hasBody ? JSON.stringify(body) : undefined,
  });
}

async function assertOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  let message = `${response.status.toString()} ${response.statusText}`;

  try {
    const text = await response.text();
    if (text) {
      message += `: ${text}`;
    }
  } catch {
    // ignore response text parse errors
  }

  throw new Error(message);
}

export async function get(url: string, headers: Record<string, string> = {}): Promise<Response> {
  const response = await fetchRequest("GET", url, undefined, headers);
  await assertOk(response);
  return response;
}

export async function post(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  const response = await fetchRequest("POST", url, body, headers);
  await assertOk(response);
  return response;
}

export async function put(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  const response = await fetchRequest("PUT", url, body, headers);
  await assertOk(response);
  return response;
}

export async function patch(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  const response = await fetchRequest("PATCH", url, body, headers);
  await assertOk(response);
  return response;
}

export async function del(
  url: string,
  headers: Record<string, string> = {},
  body?: unknown,
): Promise<Response> {
  const response = await fetchRequest("DELETE", url, body, headers);
  await assertOk(response);
  return response;
}

export type APIData<T> = { success: true; data: T };
export type APIError = { success: false; error: string };
export type APIResult<T> = APIData<T> | APIError;

export function handleAPIError(error: unknown): APIError {
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }
  if (typeof error === "string") {
    return { success: false, error };
  }
  return { success: false, error: `Unknown error: ${String(error)}` };
}

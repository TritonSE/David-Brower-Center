import { supabase } from "@/services/supabase";

export async function getAccessToken(): Promise<string> {
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(sessionError.message);
  }
  // `getSession()` types `session` as `AuthSession`, which omits `access_token`;
  // the runtime value includes the JWT on the full `Session` shape.
  // @ts-expect-error access_token exists at runtime but not on AuthSession type
  const accessToken: unknown = data.session?.access_token;
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("You must be signed in to perform this action.");
  }
  return accessToken;
}

export function authHeaders(token: string): Record<string, string> {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

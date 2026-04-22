import { createClient } from "@supabase/supabase-js";

export type AuthErrorLike = {
  message: string;
};

export type AuthUser = {
  email?: string | null;
};

export type AuthSession = {
  user: AuthUser | null;
};

type AuthStateChangeSubscription = {
  unsubscribe: () => void;
};

type AuthSessionResult = {
  data: {
    session: AuthSession | null;
  };
  error: AuthErrorLike | null;
};

type AuthResponse = {
  data: {
    user: AuthUser | null;
  };
  error: AuthErrorLike | null;
};

type AuthSignOutResponse = {
  error: AuthErrorLike | null;
};

type AuthListenerResponse = {
  data: {
    subscription: AuthStateChangeSubscription;
  };
};

type AuthApi = {
  getSession: () => Promise<AuthSessionResult>;
  onAuthStateChange: (
    callback: (_event: string, session: AuthSession | null) => void,
  ) => AuthListenerResponse;
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  signOut: () => Promise<AuthSignOutResponse>;
  signUp: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
};

type RpcResponse<T> = {
  data: T | null;
  error: AuthErrorLike | null;
};

export type SupabaseClientLike = {
  auth: AuthApi;
  rpc: <T>(fn: string, args: Record<string, unknown>) => Promise<RpcResponse<T>>;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to frontend .env.",
  );
}

const supabaseUnknown: unknown = createClient(url, anonKey);

export const supabase = supabaseUnknown as SupabaseClientLike;

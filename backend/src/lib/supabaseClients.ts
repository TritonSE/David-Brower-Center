import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "../config";

const supabaseAuthUnknown: unknown = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdminUnknown: unknown = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const supabaseAuth = supabaseAuthUnknown as SupabaseClient;
export const supabaseAdmin = supabaseAdminUnknown as SupabaseClient;

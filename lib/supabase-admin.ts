import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { appEnv } from "@/lib/env";

let supabaseAdminClient: SupabaseClient | null = null;
let initialized = false;

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!appEnv.supabaseUrl || !appEnv.supabaseServiceRoleKey) {
    return null;
  }

  if (!initialized) {
    supabaseAdminClient = createClient(appEnv.supabaseUrl, appEnv.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    initialized = true;
  }

  return supabaseAdminClient;
}

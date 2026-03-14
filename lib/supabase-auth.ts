import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { appEnv } from "@/lib/env";

function requireSupabaseAuthEnv() {
  if (!appEnv.supabaseUrl || !appEnv.supabaseAnonKey) {
    throw new Error("Supabase auth configuration is missing.");
  }

  return {
    url: appEnv.supabaseUrl,
    anonKey: appEnv.supabaseAnonKey,
  };
}

export function normalizeAccountPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/")) {
    return "/account";
  }

  return value.startsWith("/account") ? value : "/account";
}

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, anonKey } = requireSupabaseAuthEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components cannot always write cookies; route handlers do that.
        }
      },
    },
  });
}

export function createSupabaseRouteHandlerClient(
  request: NextRequest,
  response: NextResponse,
): SupabaseClient {
  const { url, anonKey } = requireSupabaseAuthEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as CookieOptions);
        });
      },
    },
  });
}

export async function requireAuthenticatedUser(nextPath: string): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect(`/account/sign-in?next=${encodeURIComponent(normalizeAccountPath(nextPath))}`);
  }

  return {
    supabase,
    user: data.user,
  };
}

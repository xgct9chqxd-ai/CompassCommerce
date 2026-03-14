import { NextRequest, NextResponse } from "next/server";
import { appFlags, appEnv } from "@/lib/env";
import { createSupabaseRouteHandlerClient, normalizeAccountPath } from "@/lib/supabase-auth";

export const runtime = "nodejs";

function formField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formField(formData, "email");
  const next = normalizeAccountPath(formField(formData, "next"));

  if (!appFlags.supabaseAuthConfigured) {
    return NextResponse.redirect(
      new URL(`/account/sign-in?status=unavailable&next=${encodeURIComponent(next)}`, appEnv.siteUrl),
      303,
    );
  }

  if (!email.includes("@")) {
    return NextResponse.redirect(
      new URL(`/account/sign-in?status=auth-error&next=${encodeURIComponent(next)}`, appEnv.siteUrl),
      303,
    );
  }

  const response = NextResponse.redirect(
    new URL(`/account/sign-in?status=link-sent&next=${encodeURIComponent(next)}`, appEnv.siteUrl),
    303,
  );
  const supabase = createSupabaseRouteHandlerClient(request, response);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appEnv.siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/account/sign-in?status=auth-error&next=${encodeURIComponent(next)}`, appEnv.siteUrl),
      303,
    );
  }

  return response;
}

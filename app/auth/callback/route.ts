import { NextRequest, NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import { createSupabaseRouteHandlerClient, normalizeAccountPath } from "@/lib/supabase-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = normalizeAccountPath(url.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(next, appEnv.siteUrl), 303);

  if (!code) {
    return NextResponse.redirect(
      new URL(`/account/sign-in?status=auth-error&next=${encodeURIComponent(next)}`, appEnv.siteUrl),
      303,
    );
  }

  const supabase = createSupabaseRouteHandlerClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/account/sign-in?status=auth-error&next=${encodeURIComponent(next)}`, appEnv.siteUrl),
      303,
    );
  }

  return response;
}

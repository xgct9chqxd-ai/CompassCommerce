import { NextRequest, NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/account/sign-in?status=signed-out", appEnv.siteUrl),
    303,
  );
  const supabase = createSupabaseRouteHandlerClient(request, response);
  await supabase.auth.signOut();
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import {
  LicensingRequestError,
  revokeResolvedEntitlement,
} from "@/lib/licensing";
import { loadAccountLicenseByLicenseId } from "@/lib/portal-data";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase-auth";

export const runtime = "nodejs";

function jsonError(status: number, error: string, message: string) {
  return NextResponse.json({ error, message }, { status });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ licenseId: string; machineId: string }> },
) {
  const response = NextResponse.next();
  const supabase = createSupabaseRouteHandlerClient(request, response);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return jsonError(401, "unauthenticated", "Sign in to your Compass account to manage activations.");
  }

  const { licenseId, machineId } = await context.params;
  const ownedLicense = await loadAccountLicenseByLicenseId(supabase, user.email, licenseId);
  if (!ownedLicense) {
    return jsonError(404, "license_not_found", "No license in this account matches that device record.");
  }

  try {
    const result = await revokeResolvedEntitlement({
      entitlementId: ownedLicense.entitlementId,
      machineId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof LicensingRequestError) {
      if (error.code === "machine_revoked") {
        return jsonError(409, "machine_revoked", "That device is already revoked.");
      }

      if (error.status >= 500) {
        return jsonError(
          503,
          "backend_unavailable",
          "Licensing is temporarily unavailable. Try again in a moment.",
        );
      }

      return jsonError(error.status, error.code ?? "revoke_failed", error.message);
    }

    return jsonError(
      500,
      "revoke_failed",
      error instanceof Error ? error.message : "Device deactivation failed.",
    );
  }
}

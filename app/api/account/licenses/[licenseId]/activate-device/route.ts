import { NextRequest, NextResponse } from "next/server";
import {
  activateDevicePairing,
  DevicePairingError,
} from "@/lib/device-pairing";
import { LicensingRequestError } from "@/lib/licensing";
import { loadAccountLicenseByLicenseId } from "@/lib/portal-data";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase-auth";

export const runtime = "nodejs";

function jsonError(status: number, error: string, message: string) {
  return NextResponse.json({ error, message }, { status });
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ licenseId: string }> },
) {
  const response = NextResponse.next();
  const supabase = createSupabaseRouteHandlerClient(request, response);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return jsonError(401, "unauthenticated", "Sign in to your Compass account to activate devices.");
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return jsonError(400, "malformed_request", "Request body must be valid JSON.");
  }

  const deviceCode = readString(body.deviceCode);
  if (!deviceCode) {
    return jsonError(400, "malformed_request", "Enter the device code shown in the plugin.");
  }

  const { licenseId } = await context.params;
  const ownedLicense = await loadAccountLicenseByLicenseId(supabase, user.email, licenseId);
  if (!ownedLicense) {
    return jsonError(404, "license_not_found", "No license in this account matches that device request.");
  }

  try {
    const result = await activateDevicePairing({
      license: ownedLicense,
      customerEmail: user.email,
      deviceCode,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof DevicePairingError) {
      return jsonError(error.status, error.code, error.message);
    }

    if (error instanceof LicensingRequestError) {
      if (error.code === "machine_limit_exceeded") {
        return jsonError(
          409,
          "machine_limit_exceeded",
          "This license is already active on the maximum number of machines. Deactivate a device first.",
        );
      }

      if (error.status >= 500) {
        return jsonError(
          503,
          "backend_unavailable",
          "Licensing is temporarily unavailable. Try again in a moment.",
        );
      }

      return jsonError(error.status, error.code ?? "activation_failed", error.message);
    }

    return jsonError(
      500,
      "activation_failed",
      error instanceof Error ? error.message : "Device activation failed.",
    );
  }
}

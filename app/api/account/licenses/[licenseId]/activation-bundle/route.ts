import { NextRequest, NextResponse } from "next/server";
import {
  activateResolvedEntitlement,
  LicensingRequestError,
} from "@/lib/licensing";
import {
  buildActivationBundle,
  buildActivationBundleFileName,
  parseActivationRequestText,
} from "@/lib/plugin-activation-bundle";
import { loadAccountLicenseByLicenseId } from "@/lib/portal-data";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase-auth";

export const runtime = "nodejs";

function jsonError(status: number, error: string, message: string) {
  return NextResponse.json({ error, message }, { status });
}

async function readActivationRequestText(request: NextRequest): Promise<string> {
  const formData = await request.formData();
  const fileValue = formData.get("activationRequestFile");
  if (typeof File !== "undefined" && fileValue instanceof File) {
    return await fileValue.text();
  }

  const textValue = formData.get("activationRequestText");
  return typeof textValue === "string" ? textValue.trim() : "";
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
    return jsonError(401, "unauthenticated", "Sign in to your Compass account to activate this license.");
  }

  const { licenseId } = await context.params;
  const ownedLicense = await loadAccountLicenseByLicenseId(supabase, user.email, licenseId);
  if (!ownedLicense) {
    return jsonError(404, "license_not_found", "No license in this account matches that activation request.");
  }

  const activationRequestText = await readActivationRequestText(request);
  if (!activationRequestText) {
    return jsonError(
      400,
      "activation_request_missing",
      "Upload or paste a machine activation request from the plugin.",
    );
  }

  let activationRequest;
  try {
    activationRequest = parseActivationRequestText(activationRequestText);
  } catch {
    activationRequest = null;
  }

  if (!activationRequest) {
    return jsonError(
      400,
      "invalid_activation_request",
      "The uploaded activation request file could not be parsed.",
    );
  }

  if (activationRequest.productId !== ownedLicense.productId) {
    return jsonError(
      400,
      "product_mismatch",
      "That activation request does not match the selected product license.",
    );
  }

  try {
    const issue = await activateResolvedEntitlement({
      entitlementId: ownedLicense.entitlementId,
      productId: ownedLicense.productId,
      machineHash: activationRequest.machineHash,
    });

    const bundle = buildActivationBundle({
      email: user.email,
      licenseId: ownedLicense.licenseId,
      entitlementId: ownedLicense.entitlementId,
      productId: ownedLicense.productId,
      machineId: issue.machineId,
      machineHash: activationRequest.machineHash,
      offlineGraceUntilUtc: issue.offlineGraceUntil,
      licenseClic: issue.licenseClic,
    });

    return new NextResponse(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${buildActivationBundleFileName({
          productId: ownedLicense.productId,
          licenseId: ownedLicense.licenseId,
        })}"`,
      },
    });
  } catch (error) {
    if (error instanceof LicensingRequestError) {
      if (error.code === "machine_limit_exceeded") {
        return jsonError(
          409,
          "machine_limit_exceeded",
          "This license is already active on the maximum number of machines.",
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
      "activation_bundle_failed",
      error instanceof Error ? error.message : "License activation could not be completed.",
    );
  }
}

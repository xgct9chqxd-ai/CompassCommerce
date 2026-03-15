import { NextRequest, NextResponse } from "next/server";
import {
  activateResolvedEntitlement,
  LicensingRequestError,
} from "@/lib/licensing";
import {
  isValidMachineHash,
  normalizeEmail,
  PluginResolverError,
  resolveProvisionedEntitlement,
} from "@/lib/plugin-resolver";

export const runtime = "nodejs";

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json(
      {
        error: "malformed_request",
        message: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const email = normalizeEmail(readString(body.email));
  const licenseId = readString(body.licenseId);
  const machineHash = readString(body.machineHash);

  if (!email.includes("@") || !licenseId || !isValidMachineHash(machineHash)) {
    return NextResponse.json(
      {
        error: "malformed_request",
        message: "email, licenseId, and a valid machineHash are required.",
      },
      { status: 400 },
    );
  }

  try {
    const entitlement = await resolveProvisionedEntitlement({ email, licenseId });
    const result = await activateResolvedEntitlement({
      entitlementId: entitlement.entitlementId,
      productId: entitlement.productId,
      machineHash,
    });

    return NextResponse.json(result, {
      status: result.action.includes("appended") ? 201 : 200,
    });
  } catch (error) {
    if (error instanceof PluginResolverError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: error.status },
      );
    }

    if (error instanceof LicensingRequestError) {
      const message =
        error.code === "machine_limit_exceeded"
          ? "This license is already active on the maximum number of machines."
          : error.status >= 500
            ? "Licensing backend is currently unavailable."
            : error.message;

      return NextResponse.json(
        {
          error:
            error.status >= 500
              ? "backend_unavailable"
              : error.code ?? "activation_failed",
          message,
          details: error.body,
        },
        { status: error.status >= 500 ? 503 : error.status },
      );
    }

    return NextResponse.json(
      {
        error: "activation_failed",
        message: error instanceof Error ? error.message : "Activation failed.",
      },
      { status: 500 },
    );
  }
}

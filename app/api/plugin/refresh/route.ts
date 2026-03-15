import { NextRequest, NextResponse } from "next/server";
import {
  LicensingRequestError,
  refreshResolvedEntitlement,
} from "@/lib/licensing";
import {
  isValidMachineHash,
  PluginResolverError,
  verifyProvisionedEntitlement,
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

  const entitlementId = readString(body.entitlementId);
  const productId = readString(body.productId);
  const machineId = readString(body.machineId);
  const machineHash = readString(body.machineHash);

  if (!entitlementId || !productId || !machineId || !isValidMachineHash(machineHash)) {
    return NextResponse.json(
      {
        error: "malformed_request",
        message: "entitlementId, productId, machineId, and a valid machineHash are required.",
      },
      { status: 400 },
    );
  }

  try {
    await verifyProvisionedEntitlement({ entitlementId, productId });
    const result = await refreshResolvedEntitlement({
      entitlementId,
      productId,
      machineId,
      machineHash,
    });

    return NextResponse.json(result, { status: 200 });
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
        error.status >= 500
          ? "Licensing backend is currently unavailable."
          : error.message;

      return NextResponse.json(
        {
          error:
            error.status >= 500
              ? "backend_unavailable"
              : error.code ?? "refresh_failed",
          message,
          details: error.body,
        },
        { status: error.status >= 500 ? 503 : error.status },
      );
    }

    return NextResponse.json(
      {
        error: "refresh_failed",
        message: error instanceof Error ? error.message : "Refresh failed.",
      },
      { status: 500 },
    );
  }
}

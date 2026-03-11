import { NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/lib/catalog";
import { appEnv, appFlags } from "@/lib/env";
import { LicensingRequestError, provisionEntitlement } from "@/lib/licensing";

export const runtime = "nodejs";

function parsePositiveInteger(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  if (!appFlags.operatorProvisioningConfigured || !appEnv.operatorDashboardToken) {
    return NextResponse.json(
      {
        error: "operator_not_configured",
        message:
          "Operator provisioning requires LICENSING_ADMIN_API_TOKEN and OPERATOR_DASHBOARD_TOKEN.",
      },
      { status: 503 },
    );
  }

  if (request.headers.get("x-operator-token") !== appEnv.operatorDashboardToken) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "Operator dashboard token is missing or invalid.",
      },
      { status: 401 },
    );
  }

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

  const product = getProduct(parseString(body.productId));
  const customerEmail = parseString(body.customerEmail);
  const externalReference = parseString(body.externalReference);
  const licenseType = parseString(body.licenseType);
  const machineLimit = parsePositiveInteger(body.machineLimit);
  const offlineGraceDays = parsePositiveInteger(body.offlineGraceDays);

  if (!product || !customerEmail.includes("@") || !externalReference || !licenseType || !machineLimit || !offlineGraceDays) {
    return NextResponse.json(
      {
        error: "malformed_request",
        message:
          "productId, customerEmail, externalReference, licenseType, machineLimit, and offlineGraceDays are required.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await provisionEntitlement({
      productId: product.id,
      customerEmail,
      externalReference,
      licenseType,
      machineLimit,
      offlineGraceDays,
    });

    return NextResponse.json(
      {
        status: "ok",
        ...result,
        customerEmail,
        externalReference,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof LicensingRequestError) {
      return NextResponse.json(
        {
          error: error.code ?? "provision_failed",
          message: error.message,
          details: error.body,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error: "provision_failed",
        message: error instanceof Error ? error.message : "Provisioning failed.",
      },
      { status: 500 },
    );
  }
}

import type { ProductId } from "@/lib/catalog";
import { appEnv } from "@/lib/env";
import { buildProvisioningIds } from "@/lib/ids";

type JsonRecord = Record<string, unknown>;

async function parseResponseBody(response: Response): Promise<JsonRecord | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as JsonRecord;
  } catch {
    return { message: text };
  }
}

function buildLicensingUrl(path: string): string {
  return new URL(path, appEnv.licensingBaseUrl).toString();
}

export type HealthSnapshot = {
  ok: boolean;
  status: string;
  buildVersion: string | null;
  endpoint: string;
  checkedAt: string;
  note: string;
};

export class LicensingRequestError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly body: JsonRecord | null;

  constructor(status: number, code: string | undefined, message: string, body: JsonRecord | null) {
    super(message);
    this.name = "LicensingRequestError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

async function requestJson<T>(
  path: string,
  payload: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const response = await fetch(buildLicensingUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = await parseResponseBody(response);
  if (!response.ok) {
    const code =
      typeof body?.error === "string"
        ? body.error
        : typeof body?.code === "string"
          ? body.code
          : undefined;
    const message =
      typeof body?.message === "string"
        ? body.message
        : code
          ? `Licensing request failed: ${code}`
          : `Licensing request failed with status ${response.status}`;

    throw new LicensingRequestError(response.status, code, message, body);
  }

  return (body ?? {}) as T;
}

export async function forwardPublicLicensingRequest(path: string, payload: unknown) {
  const response = await fetch(buildLicensingUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = await parseResponseBody(response);
  return {
    status: response.status,
    body: body ?? { message: response.statusText || "No response body." },
  };
}

export async function fetchLicensingHealth(): Promise<HealthSnapshot> {
  const checkedAt = new Date().toISOString();
  const endpoint = buildLicensingUrl("/health/ready");

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    const body = await parseResponseBody(response);
    const status = typeof body?.status === "string" ? body.status : "unknown";
    const buildVersion = typeof body?.buildVersion === "string" ? body.buildVersion : null;

    if (!response.ok) {
      return {
        ok: false,
        status,
        buildVersion,
        endpoint,
        checkedAt,
        note:
          typeof body?.message === "string"
            ? body.message
            : "Licensing backend responded but did not report readiness.",
      };
    }

    return {
      ok: status === "ready",
      status,
      buildVersion,
      endpoint,
      checkedAt,
      note:
        status === "ready"
          ? "Licensing backend is reachable and ready."
          : "Licensing backend is reachable but not ready.",
    };
  } catch (error) {
    return {
      ok: false,
      status: "down",
      buildVersion: null,
      endpoint,
      checkedAt,
      note: error instanceof Error ? error.message : "Unable to reach licensing backend.",
    };
  }
}

export type ProvisioningInput = {
  productId: ProductId;
  customerEmail: string;
  externalReference: string;
  licenseType: string;
  machineLimit: number;
  expiresAt?: string | null;
  offlineGraceDays?: number | null;
};

type ProvisioningApiResponse = {
  action: string;
  entitlementId: string;
  licenseId: string;
  productId: string;
  licenseType: string;
  machineLimit: number;
  expiresAt: string | null;
  offlineGraceDays: number | null;
};

export type LicensingIssueResponse = {
  action: string;
  entitlementId: string;
  licenseId: string;
  productId: string;
  machineId: string;
  offlineGraceUntil: string | null;
  licenseClic: string;
};

export async function provisionEntitlement(input: ProvisioningInput): Promise<ProvisioningApiResponse> {
  if (!appEnv.licensingAdminApiToken) {
    throw new Error("LICENSING_ADMIN_API_TOKEN is not configured.");
  }

  const ids = buildProvisioningIds(input);

  return requestJson<ProvisioningApiResponse>(
    "/internal/v1/entitlements",
    {
      ...ids,
      productId: input.productId,
      licenseType: input.licenseType,
      machineLimit: input.machineLimit,
      expiresAt: input.expiresAt ?? null,
      offlineGraceDays: input.offlineGraceDays ?? null,
    },
    {
      Authorization: `Bearer ${appEnv.licensingAdminApiToken}`,
    },
  );
}

export async function activateResolvedEntitlement(input: {
  entitlementId: string;
  productId: string;
  machineHash: string;
}): Promise<LicensingIssueResponse> {
  return requestJson<LicensingIssueResponse>("/v1/activate", input);
}

export async function refreshResolvedEntitlement(input: {
  entitlementId: string;
  productId: string;
  machineId: string;
  machineHash: string;
}): Promise<LicensingIssueResponse> {
  return requestJson<LicensingIssueResponse>("/v1/refresh", input);
}

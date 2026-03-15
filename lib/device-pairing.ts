import crypto from "node:crypto";
import { appEnv } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { activateResolvedEntitlement } from "@/lib/licensing";
import type { AccountLicense } from "@/lib/portal-data";

const DEVICE_CODE_RAW_LENGTH = 8;
const DEVICE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEVICE_PAIRING_TTL_MINUTES = 15;

type DeviceActivationRequestRow = {
  id: string;
  device_code: string;
  poll_token_hash: string;
  product_id: string;
  machine_hash: string;
  platform: string | null;
  requested_at: string;
  expires_at: string;
  status: string;
  customer_email: string | null;
  license_id: string | null;
  entitlement_id: string | null;
  machine_id: string | null;
  offline_grace_until: string | null;
  license_clic: string | null;
  claimed_at: string | null;
};

export type DevicePairingSession = {
  requestId: string;
  deviceCode: string;
  pollToken: string;
  expiresAt: string;
  verificationUrl: string;
};

export type PendingPortalActivation = {
  requestId: string;
  productId: string;
  platform: string | null;
  requestedAt: string;
  expiresAt: string;
  verificationUrl: string;
};

export type DevicePairingStatusResponse =
  | {
      status: "pending";
      deviceCode: string;
      expiresAt: string;
      verificationUrl: string;
    }
  | {
      status: "activated";
      email: string;
      licenseId: string;
      entitlementId: string;
      productId: string;
      machineId: string;
      offlineGraceUntil: string | null;
      licenseClic: string;
    }
  | {
      status: "expired";
      reason: string;
    };

export type DevicePairingActivationResult = {
  deviceCode: string;
  machineId: string;
  entitlementId: string;
  licenseId: string;
  productId: string;
  offlineGraceUntil: string | null;
};

export class DevicePairingError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "DevicePairingError";
    this.status = status;
    this.code = code;
  }
}

function getSupabaseAdmin() {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new DevicePairingError(
      503,
      "pairing_not_configured",
      "Supabase service role configuration is missing.",
    );
  }

  return client;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(Date.parse(iso) + minutes * 60_000).toISOString();
}

function hashToken(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function makeDeviceCode(): string {
  let raw = "";
  while (raw.length < DEVICE_CODE_RAW_LENGTH) {
    const random = crypto.randomBytes(1)[0] ?? 0;
    raw += DEVICE_CODE_ALPHABET[random % DEVICE_CODE_ALPHABET.length];
  }

  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

export function normalizeDeviceCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length !== DEVICE_CODE_RAW_LENGTH) {
    return raw;
  }

  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

function buildVerificationUrl(productId: string, requestId: string): string {
  const url = new URL("/account/licenses", appEnv.siteUrl);
  url.searchParams.set("productId", productId);
  url.searchParams.set("activationRequest", requestId);
  return url.toString();
}

async function readPairingByCode(deviceCode: string): Promise<DeviceActivationRequestRow | null> {
  const supabase = getSupabaseAdmin();
  const result = await supabase
    .from("device_activation_requests")
    .select(
      "id, device_code, poll_token_hash, product_id, machine_hash, platform, requested_at, expires_at, status, customer_email, license_id, entitlement_id, machine_id, offline_grace_until, license_clic, claimed_at",
    )
    .eq("device_code", deviceCode)
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new DevicePairingError(500, "pairing_lookup_failed", result.error.message);
  }

  return (result.data as DeviceActivationRequestRow | null) ?? null;
}

async function readPairingById(requestId: string): Promise<DeviceActivationRequestRow | null> {
  const supabase = getSupabaseAdmin();
  const result = await supabase
    .from("device_activation_requests")
    .select(
      "id, device_code, poll_token_hash, product_id, machine_hash, platform, requested_at, expires_at, status, customer_email, license_id, entitlement_id, machine_id, offline_grace_until, license_clic, claimed_at",
    )
    .eq("id", requestId)
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new DevicePairingError(500, "pairing_lookup_failed", result.error.message);
  }

  return (result.data as DeviceActivationRequestRow | null) ?? null;
}

async function markPairingStatus(requestId: string, status: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("device_activation_requests")
    .update({ status })
    .eq("id", requestId);

  if (error) {
    throw new DevicePairingError(500, "pairing_update_failed", error.message);
  }
}

function isExpired(expiresAt: string): boolean {
  return Date.parse(expiresAt) <= Date.now();
}

export async function beginDevicePairing(input: {
  productId: string;
  machineHash: string;
  platform?: string | null;
}): Promise<DevicePairingSession> {
  const supabase = getSupabaseAdmin();
  const requestedAt = nowIso();
  const expiresAt = addMinutes(requestedAt, DEVICE_PAIRING_TTL_MINUTES);
  const pollToken = crypto.randomBytes(24).toString("base64url");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const deviceCode = makeDeviceCode();
    const insertResult = await supabase
      .from("device_activation_requests")
      .insert({
        device_code: deviceCode,
        poll_token_hash: hashToken(pollToken),
        product_id: input.productId,
        machine_hash: input.machineHash,
        platform: input.platform ?? null,
        requested_at: requestedAt,
        expires_at: expiresAt,
        status: "pending",
      })
      .select("id")
      .single();

    if (!insertResult.error && insertResult.data) {
      const requestId = String((insertResult.data as { id: string }).id);
      return {
        requestId,
        deviceCode,
        pollToken,
        expiresAt,
        verificationUrl: buildVerificationUrl(input.productId, requestId),
      };
    }

    if (insertResult.error && insertResult.error.code !== "23505") {
      throw new DevicePairingError(500, "pairing_create_failed", insertResult.error.message);
    }
  }

  throw new DevicePairingError(
    500,
    "pairing_create_failed",
    "Unable to allocate a device pairing code right now.",
  );
}

export async function pollDevicePairing(input: {
  requestId: string;
  pollToken: string;
}): Promise<DevicePairingStatusResponse> {
  const request = await readPairingById(input.requestId);
  if (!request) {
    throw new DevicePairingError(404, "pairing_not_found", "No activation request matches that device.");
  }

  if (request.poll_token_hash !== hashToken(input.pollToken)) {
    throw new DevicePairingError(403, "pairing_forbidden", "That device activation token is invalid.");
  }

  if (request.status === "claimed") {
    if (
      !request.customer_email
      || !request.license_id
      || !request.entitlement_id
      || !request.machine_id
      || !request.license_clic
    ) {
      throw new DevicePairingError(
        500,
        "pairing_incomplete",
        "Activation completed but the stored license payload is incomplete.",
      );
    }

    return {
      status: "activated",
      email: request.customer_email,
      licenseId: request.license_id,
      entitlementId: request.entitlement_id,
      productId: request.product_id,
      machineId: request.machine_id,
      offlineGraceUntil: request.offline_grace_until,
      licenseClic: request.license_clic,
    };
  }

  if (request.status === "expired" || isExpired(request.expires_at)) {
    if (request.status !== "expired") {
      await markPairingStatus(request.id, "expired");
    }

    return {
      status: "expired",
      reason: "device_code_expired",
    };
  }

  return {
    status: "pending",
    deviceCode: request.device_code,
    expiresAt: request.expires_at,
    verificationUrl: buildVerificationUrl(request.product_id, request.id),
  };
}

export async function activateDevicePairing(input: {
  license: AccountLicense;
  customerEmail: string;
  requestId?: string;
  deviceCode?: string;
}): Promise<DevicePairingActivationResult> {
  let request: DeviceActivationRequestRow | null = null;

  const requestId = input.requestId?.trim() ?? "";
  if (requestId) {
    request = await readPairingById(requestId);
  } else {
    const normalizedCode = normalizeDeviceCode(input.deviceCode ?? "");
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedCode)) {
      throw new DevicePairingError(
        400,
        "invalid_device_code",
        "Open the plugin on the target machine first, then try activating it again from your account.",
      );
    }

    request = await readPairingByCode(normalizedCode);
  }

  if (!request) {
    throw new DevicePairingError(
      404,
      "activation_request_not_found",
      "No pending device activation is waiting for this account right now.",
    );
  }

  if (request.product_id !== input.license.productId) {
    throw new DevicePairingError(
      409,
      "activation_request_product_mismatch",
      "That waiting device belongs to a different product.",
    );
  }

  if (request.status === "claimed") {
    if (
      request.license_id === input.license.licenseId
      && request.customer_email === input.customerEmail
      && request.machine_id
      && request.entitlement_id
    ) {
      return {
        deviceCode: request.device_code,
        machineId: request.machine_id,
        entitlementId: request.entitlement_id,
        licenseId: request.license_id,
        productId: request.product_id,
        offlineGraceUntil: request.offline_grace_until,
      };
    }

    throw new DevicePairingError(
      409,
      "activation_request_unavailable",
      "That device is no longer waiting for activation.",
    );
  }

  if (request.status === "expired" || isExpired(request.expires_at)) {
    if (request.status !== "expired") {
      await markPairingStatus(request.id, "expired");
    }

    throw new DevicePairingError(
      410,
      "activation_request_expired",
      "That pending activation expired. Reopen the plugin and try again.",
    );
  }

  const result = await activateResolvedEntitlement({
    entitlementId: input.license.entitlementId,
    productId: input.license.productId,
    machineHash: request.machine_hash,
  });

  const supabase = getSupabaseAdmin();
  const updateResult = await supabase
    .from("device_activation_requests")
    .update({
      status: "claimed",
      claimed_at: nowIso(),
      customer_email: input.customerEmail,
      license_id: input.license.licenseId,
      entitlement_id: input.license.entitlementId,
      machine_id: result.machineId,
      offline_grace_until: result.offlineGraceUntil,
      license_clic: result.licenseClic,
    })
    .eq("id", request.id);

  if (updateResult.error) {
    throw new DevicePairingError(500, "pairing_update_failed", updateResult.error.message);
  }

  return {
    deviceCode: request.device_code,
    machineId: result.machineId,
    entitlementId: input.license.entitlementId,
    licenseId: input.license.licenseId,
    productId: input.license.productId,
    offlineGraceUntil: result.offlineGraceUntil,
  };
}

export async function loadPendingPortalActivation(
  requestId: string,
): Promise<PendingPortalActivation | null> {
  const normalizedRequestId = requestId.trim();
  if (!normalizedRequestId) {
    return null;
  }

  const request = await readPairingById(normalizedRequestId);
  if (!request) {
    return null;
  }

  if (request.status === "expired" || isExpired(request.expires_at)) {
    if (request.status !== "expired") {
      await markPairingStatus(request.id, "expired");
    }
    return null;
  }

  if (request.status !== "pending") {
    return null;
  }

  return {
    requestId: request.id,
    productId: request.product_id,
    platform: request.platform,
    requestedAt: request.requested_at,
    expiresAt: request.expires_at,
    verificationUrl: buildVerificationUrl(request.product_id, request.id),
  };
}

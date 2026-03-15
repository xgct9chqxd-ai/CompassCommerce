type JsonRecord = Record<string, unknown>;

export type ActivationRequestPayload = {
  formatVersion: "1";
  requestType: "compass_activation_request_v1";
  productId: string;
  productName: string;
  machineHash: string;
  generatedAtUtc: string;
  platform: string;
};

export type ActivationBundlePayload = {
  formatVersion: "1";
  bundleType: "compass_activation_bundle_v1";
  email: string;
  licenseId: string;
  entitlementId: string;
  productId: string;
  machineId: string;
  machineHash: string;
  offlineGraceUntilUtc: string | null;
  licenseClic: string;
};

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeFileToken(value: string): string {
  const token = value.replace(/[^A-Za-z0-9_-]/g, "");
  return token.length > 0 ? token : "CompassActivation";
}

export function parseActivationRequestText(text: string): ActivationRequestPayload | null {
  const parsed = JSON.parse(text) as JsonRecord;

  const formatVersion = readString(parsed.formatVersion);
  const requestType = readString(parsed.requestType);
  const productId = readString(parsed.productId);
  const productName = readString(parsed.productName);
  const machineHash = readString(parsed.machineHash);
  const generatedAtUtc = readString(parsed.generatedAtUtc);
  const platform = readString(parsed.platform);

  if (
    formatVersion !== "1"
    || requestType !== "compass_activation_request_v1"
    || !productId
    || !productName
    || !/^[A-Za-z0-9_-]{43}$/.test(machineHash)
    || !generatedAtUtc
    || !platform
  ) {
    return null;
  }

  return {
    formatVersion: "1",
    requestType: "compass_activation_request_v1",
    productId,
    productName,
    machineHash,
    generatedAtUtc,
    platform,
  };
}

export function buildActivationBundle(input: {
  email: string;
  licenseId: string;
  entitlementId: string;
  productId: string;
  machineId: string;
  machineHash: string;
  offlineGraceUntilUtc: string | null;
  licenseClic: string;
}): ActivationBundlePayload {
  return {
    formatVersion: "1",
    bundleType: "compass_activation_bundle_v1",
    email: input.email.trim().toLowerCase(),
    licenseId: input.licenseId.trim(),
    entitlementId: input.entitlementId.trim(),
    productId: input.productId.trim(),
    machineId: input.machineId.trim(),
    machineHash: input.machineHash.trim(),
    offlineGraceUntilUtc: input.offlineGraceUntilUtc ?? null,
    licenseClic: input.licenseClic,
  };
}

export function buildActivationBundleFileName(input: {
  productId: string;
  licenseId: string;
}): string {
  return `${sanitizeFileToken(input.productId)}-${sanitizeFileToken(input.licenseId)}-ActivationBundle.json`;
}

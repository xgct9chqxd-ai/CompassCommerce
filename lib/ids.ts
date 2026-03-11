import { createHash } from "crypto";
import type { ProductId } from "@/lib/catalog";

type ProvisioningIdInput = {
  productId: ProductId;
  customerEmail: string;
  externalReference: string;
};

function normalizeSegment(value: string, fallback: string, maxLength: number): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!normalized) {
    return fallback;
  }

  return normalized.slice(0, maxLength);
}

function buildPrefixedId(prefix: "ent" | "lic", base: string): string {
  const normalized = normalizeSegment(base, prefix, 60);
  return `${prefix}_${normalized}`.slice(0, 64);
}

export function buildProvisioningIds(input: ProvisioningIdInput) {
  const productSegment = normalizeSegment(input.productId.replace("compass_", ""), "product", 18);
  const emailSegment = normalizeSegment(input.customerEmail.split("@")[0] ?? "", "customer", 18);
  const referenceSegment = normalizeSegment(input.externalReference, "order", 20);
  const digest = createHash("sha256")
    .update(`${input.productId}|${input.customerEmail}|${input.externalReference}`)
    .digest("hex")
    .slice(0, 10);

  const base = [productSegment, emailSegment, referenceSegment, digest].join("_");

  return {
    entitlementId: buildPrefixedId("ent", base),
    licenseId: buildPrefixedId("lic", base),
  };
}

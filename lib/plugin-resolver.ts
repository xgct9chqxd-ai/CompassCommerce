import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type CustomerRow = {
  id: string;
};

type ProvisionedEntitlementRow = {
  customer_id: string;
  entitlement_id: string;
  license_id: string;
  product_id: string;
  license_type: string;
};

export class PluginResolverError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "PluginResolverError";
    this.status = status;
    this.code = code;
  }
}

function requireSupabaseAdmin() {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new PluginResolverError(
      503,
      "resolver_not_configured",
      "Supabase service role configuration is missing.",
    );
  }

  return client;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidMachineHash(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value.trim());
}

export async function resolveProvisionedEntitlement(input: {
  email: string;
  licenseId: string;
}) {
  const supabase = requireSupabaseAdmin();
  const email = normalizeEmail(input.email);
  const licenseId = input.licenseId.trim();

  const customerResult = await supabase
    .from("customers")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (customerResult.error) {
    throw new PluginResolverError(500, "resolver_failed", customerResult.error.message);
  }

  const licenseResult = await supabase
    .from("provisioned_entitlements")
    .select("customer_id, entitlement_id, license_id, product_id, license_type")
    .eq("license_id", licenseId)
    .limit(1)
    .maybeSingle();

  if (licenseResult.error) {
    throw new PluginResolverError(500, "resolver_failed", licenseResult.error.message);
  }

  const license = licenseResult.data as ProvisionedEntitlementRow | null;
  if (!license) {
    throw new PluginResolverError(404, "license_not_found", "No license matches that license ID.");
  }

  const customer = customerResult.data as CustomerRow | null;
  if (!customer || license.customer_id !== customer.id) {
    throw new PluginResolverError(
      403,
      "email_license_mismatch",
      "That license ID does not belong to the provided email address.",
    );
  }

  return {
    customerId: customer.id,
    entitlementId: license.entitlement_id,
    licenseId: license.license_id,
    productId: license.product_id,
    licenseType: license.license_type,
  };
}

export async function verifyProvisionedEntitlement(input: {
  entitlementId: string;
  productId: string;
}) {
  const supabase = requireSupabaseAdmin();
  const entitlementId = input.entitlementId.trim();
  const productId = input.productId.trim();

  const result = await supabase
    .from("provisioned_entitlements")
    .select("customer_id, entitlement_id, license_id, product_id, license_type")
    .eq("entitlement_id", entitlementId)
    .eq("product_id", productId)
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new PluginResolverError(500, "resolver_failed", result.error.message);
  }

  const record = result.data as ProvisionedEntitlementRow | null;
  if (!record) {
    throw new PluginResolverError(
      404,
      "entitlement_not_found",
      "No active commerce record matches that entitlement.",
    );
  }

  return {
    customerId: record.customer_id,
    entitlementId: record.entitlement_id,
    licenseId: record.license_id,
    productId: record.product_id,
    licenseType: record.license_type,
  };
}

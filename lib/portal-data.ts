import type { SupabaseClient } from "@supabase/supabase-js";
import { getProduct } from "@/lib/catalog";

export type AccountDashboardSnapshot = {
  orderCount: number;
  licenseCount: number;
  ownedProductCount: number;
};

export type AccountOrder = {
  id: string;
  externalReference: string | null;
  totalAmountCents: number | null;
  currency: string | null;
  createdAt: string | null;
};

export type AccountLicense = {
  id: string;
  productId: string;
  entitlementId: string;
  licenseId: string;
  licenseType: string;
  createdAt: string | null;
};

export type AccountDownload = {
  id: string;
  productId: string;
  platform: string;
  version: string;
  downloadUrl: string;
};

type ProductGroup = {
  productId: string;
  productName: string;
  items: AccountDownload[];
};

function requireData<T>(label: string, data: T | null, error: { message: string } | null): T {
  if (error) {
    throw new Error(`Failed to load ${label}: ${error.message}`);
  }

  return data ?? ([] as T);
}

export async function loadAccountDashboard(
  supabase: SupabaseClient,
): Promise<AccountDashboardSnapshot> {
  const [ordersResult, licensesResult, productsResult] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("provisioned_entitlements").select("id", { count: "exact", head: true }),
    supabase.from("provisioned_entitlements").select("product_id"),
  ]);

  if (ordersResult.error) {
    throw new Error(`Failed to load order count: ${ordersResult.error.message}`);
  }

  if (licensesResult.error) {
    throw new Error(`Failed to load license count: ${licensesResult.error.message}`);
  }

  if (productsResult.error) {
    throw new Error(`Failed to load owned products: ${productsResult.error.message}`);
  }

  const ownedProducts = new Set(
    (productsResult.data ?? []).map((row) => String((row as { product_id: string }).product_id)),
  );

  return {
    orderCount: ordersResult.count ?? 0,
    licenseCount: licensesResult.count ?? 0,
    ownedProductCount: ownedProducts.size,
  };
}

export async function loadAccountOrders(supabase: SupabaseClient): Promise<AccountOrder[]> {
  const result = await supabase
    .from("orders")
    .select("id, external_reference, total_amount_cents, currency, created_at")
    .order("created_at", { ascending: false });

  const rows = requireData(
    "orders",
    result.data as Array<{
      id: string;
      external_reference: string | null;
      total_amount_cents: number | null;
      currency: string | null;
      created_at: string | null;
    }> | null,
    result.error,
  );

  return rows.map((row) => ({
    id: row.id,
    externalReference: row.external_reference,
    totalAmountCents: row.total_amount_cents,
    currency: row.currency,
    createdAt: row.created_at,
  }));
}

export async function loadAccountLicenses(supabase: SupabaseClient): Promise<AccountLicense[]> {
  const result = await supabase
    .from("provisioned_entitlements")
    .select("id, product_id, entitlement_id, license_id, license_type, created_at")
    .order("created_at", { ascending: false });

  const rows = requireData(
    "licenses",
    result.data as Array<{
      id: string;
      product_id: string;
      entitlement_id: string;
      license_id: string;
      license_type: string;
      created_at: string | null;
    }> | null,
    result.error,
  );

  return rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    entitlementId: row.entitlement_id,
    licenseId: row.license_id,
    licenseType: row.license_type,
    createdAt: row.created_at,
  }));
}

export async function loadAccountDownloads(
  supabase: SupabaseClient,
): Promise<ProductGroup[]> {
  const licenses = await loadAccountLicenses(supabase);
  const ownedProductIds = [...new Set(licenses.map((license) => license.productId))];
  if (ownedProductIds.length === 0) {
    return [];
  }

  const result = await supabase
    .from("product_downloads")
    .select("id, product_id, platform, version, download_url")
    .in("product_id", ownedProductIds)
    .order("product_id", { ascending: true });

  const rows = requireData(
    "downloads",
    result.data as Array<{
      id: string;
      product_id: string;
      platform: string;
      version: string;
      download_url: string;
    }> | null,
    result.error,
  );

  const grouped = new Map<string, ProductGroup>();
  for (const row of rows) {
    const existing = grouped.get(row.product_id);
    if (existing) {
      existing.items.push({
        id: row.id,
        productId: row.product_id,
        platform: row.platform,
        version: row.version,
        downloadUrl: row.download_url,
      });
      continue;
    }

    grouped.set(row.product_id, {
      productId: row.product_id,
      productName: getProduct(row.product_id)?.name ?? row.product_id,
      items: [
        {
          id: row.id,
          productId: row.product_id,
          platform: row.platform,
          version: row.version,
          downloadUrl: row.download_url,
        },
      ],
    });
  }

  return [...grouped.values()];
}

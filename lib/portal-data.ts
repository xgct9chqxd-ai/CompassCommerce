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

type CustomerRow = {
  id: string;
};

type OrderRow = {
  id: string;
  external_reference: string | null;
  total_amount_cents: number | null;
  currency: string | null;
  created_at: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  stripe_price_id: string | null;
  quantity: number | null;
};

type ProvisionedEntitlementRow = {
  id: string;
  product_id: string;
  entitlement_id: string;
  license_id: string;
  license_type: string;
  created_at: string | null;
};

type ProductDownloadRow = {
  id: string;
  product_id: string;
  platform: string;
  version: string;
  download_url: string;
};

type AccountCustomerContext = {
  customerId: string;
  orders: OrderRow[];
  orderItems: OrderItemRow[];
  licenses: ProvisionedEntitlementRow[];
};

function requireData<T>(label: string, data: T | null, error: { message: string } | null): T {
  if (error) {
    throw new Error(`Failed to load ${label}: ${error.message}`);
  }

  return data ?? ([] as T);
}

async function loadCustomerContext(
  supabase: SupabaseClient,
  customerEmail: string,
): Promise<AccountCustomerContext | null> {
  const customerResult = await supabase
    .from("customers")
    .select("id")
    .eq("email", customerEmail)
    .limit(1)
    .maybeSingle();

  const customer = requireData(
    "customer",
    customerResult.data as CustomerRow | null,
    customerResult.error,
  );

  if (!customer) {
    return null;
  }

  const ordersResult = await supabase
    .from("orders")
    .select("id, external_reference, total_amount_cents, currency, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  const orders = requireData(
    "orders",
    ordersResult.data as OrderRow[] | null,
    ordersResult.error,
  );

  const orderIds = orders.map((row) => row.id);
  const orderItemsResult = orderIds.length
    ? await supabase
        .from("order_items")
        .select("id, order_id, product_id, stripe_price_id, quantity")
        .in("order_id", orderIds)
    : { data: [], error: null };

  const orderItems = requireData(
    "order items",
    orderItemsResult.data as OrderItemRow[] | null,
    orderItemsResult.error,
  );

  const licensesResult = await supabase
    .from("provisioned_entitlements")
    .select("id, product_id, entitlement_id, license_id, license_type, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  const licenses = requireData(
    "licenses",
    licensesResult.data as ProvisionedEntitlementRow[] | null,
    licensesResult.error,
  );

  return {
    customerId: customer.id,
    orders,
    orderItems,
    licenses,
  };
}

export async function loadAccountDashboard(
  supabase: SupabaseClient,
  customerEmail: string,
): Promise<AccountDashboardSnapshot> {
  const context = await loadCustomerContext(supabase, customerEmail);
  if (!context) {
    return {
      orderCount: 0,
      licenseCount: 0,
      ownedProductCount: 0,
    };
  }

  const ownedProducts = new Set(
    [
      ...context.licenses.map((row) => row.product_id),
      ...context.orderItems.map((row) => row.product_id),
    ],
  );

  return {
    orderCount: context.orders.length,
    licenseCount: context.licenses.length,
    ownedProductCount: ownedProducts.size,
  };
}

export async function loadAccountOrders(
  supabase: SupabaseClient,
  customerEmail: string,
): Promise<AccountOrder[]> {
  const context = await loadCustomerContext(supabase, customerEmail);
  const rows = context?.orders ?? [];

  return rows.map((row) => ({
    id: row.id,
    externalReference: row.external_reference,
    totalAmountCents: row.total_amount_cents,
    currency: row.currency,
    createdAt: row.created_at,
  }));
}

export async function loadAccountLicenses(
  supabase: SupabaseClient,
  customerEmail: string,
): Promise<AccountLicense[]> {
  const context = await loadCustomerContext(supabase, customerEmail);
  const rows = context?.licenses ?? [];

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
  customerEmail: string,
): Promise<ProductGroup[]> {
  const context = await loadCustomerContext(supabase, customerEmail);
  if (!context) {
    return [];
  }

  const ownedProductIds = [
    ...new Set([
      ...context.licenses.map((license) => license.product_id),
      ...context.orderItems.map((item) => item.product_id),
    ]),
  ];

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
    result.data as ProductDownloadRow[] | null,
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

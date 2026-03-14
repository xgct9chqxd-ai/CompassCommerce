import type { ProductId } from "@/lib/catalog";

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const siteUrl = readEnv("NEXT_PUBLIC_SITE_URL") ?? "http://127.0.0.1:3000";
const licensingBaseUrl = readEnv("LICENSING_API_BASE_URL") ?? "http://127.0.0.1:8080";
const publicLicensingBaseUrl =
  readEnv("NEXT_PUBLIC_LICENSING_PUBLIC_BASE_URL")
  ?? readEnv("LICENSING_PUBLIC_BASE_URL")
  ?? licensingBaseUrl;

export const appEnv = {
  siteUrl,
  licensingBaseUrl,
  publicLicensingBaseUrl,
  licensingAdminApiToken: readEnv("LICENSING_ADMIN_API_TOKEN"),
  operatorDashboardToken: readEnv("OPERATOR_DASHBOARD_TOKEN"),
  supabaseUrl: readEnv("SUPABASE_URL"),
  supabaseAnonKey: readEnv("SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  stripeSecretKey: readEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: readEnv("STRIPE_WEBHOOK_SECRET"),
  stripePriceIds: {
    compass_tricomp: readEnv("STRIPE_PRICE_ID_TRICOMP"),
  } satisfies Record<ProductId, string | undefined>,
};

export const appFlags = {
  stripeConfigured: Boolean(appEnv.stripeSecretKey),
  supabaseAuthConfigured: Boolean(
    appEnv.supabaseUrl && appEnv.supabaseAnonKey,
  ),
  operatorProvisioningConfigured: Boolean(
    appEnv.operatorDashboardToken && appEnv.licensingAdminApiToken,
  ),
  webhookProvisioningConfigured: Boolean(
    appEnv.stripeSecretKey
      && appEnv.stripeWebhookSecret
      && appEnv.licensingAdminApiToken,
  ),
  supabaseConfigured: Boolean(
    appEnv.supabaseUrl && appEnv.supabaseServiceRoleKey,
  ),
  webhookPersistenceConfigured: Boolean(
    appEnv.stripeSecretKey
      && appEnv.stripeWebhookSecret
      && appEnv.licensingAdminApiToken
      && appEnv.supabaseUrl
      && appEnv.supabaseServiceRoleKey,
  ),
};

export function isStripeReadyForProduct(productId: ProductId): boolean {
  return Boolean(appEnv.stripeSecretKey && appEnv.stripePriceIds[productId]);
}

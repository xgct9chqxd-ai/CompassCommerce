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
  stripeSecretKey: readEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: readEnv("STRIPE_WEBHOOK_SECRET"),
  stripePriceIds: {
    compass_tricomp: readEnv("STRIPE_PRICE_ID_TRICOMP"),
  } satisfies Record<ProductId, string | undefined>,
};

export const appFlags = {
  stripeConfigured: Boolean(appEnv.stripeSecretKey),
  operatorProvisioningConfigured: Boolean(
    appEnv.operatorDashboardToken && appEnv.licensingAdminApiToken,
  ),
  webhookProvisioningConfigured: Boolean(
    appEnv.stripeSecretKey
      && appEnv.stripeWebhookSecret
      && appEnv.licensingAdminApiToken,
  ),
};

export function isStripeReadyForProduct(productId: ProductId): boolean {
  return Boolean(appEnv.stripeSecretKey && appEnv.stripePriceIds[productId]);
}

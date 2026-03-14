import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getProduct } from "@/lib/catalog";
import { buildProvisioningIds } from "@/lib/ids";
import { appEnv, appFlags } from "@/lib/env";
import { LicensingRequestError, provisionEntitlement } from "@/lib/licensing";
import { persistProvisionedPurchase } from "@/lib/purchase-records";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function extractStripeId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

type PersistedProvisioningResult = {
  action: string;
  entitlementId: string;
  licenseId: string;
  productId: string;
  licenseType: string;
  machineLimit: number;
  expiresAt: string | null;
  offlineGraceDays: number | null;
};

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!appFlags.webhookPersistenceConfigured || !stripe || !appEnv.stripeWebhookSecret) {
    return NextResponse.json(
      {
        error: "webhook_not_configured",
        message:
          "Stripe webhook handling requires STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, LICENSING_ADMIN_API_TOKEN, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  if (!signature) {
    return NextResponse.json(
      {
        error: "missing_signature",
        message: "Stripe signature header is required.",
      },
      { status: 400 },
    );
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, appEnv.stripeWebhookSecret);
  } catch (error) {
    return NextResponse.json(
      {
        error: "invalid_signature",
        message: error instanceof Error ? error.message : "Webhook signature verification failed.",
      },
      { status: 400 },
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, skipped: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};
  const product = getProduct(metadata.productId ?? "");
  const customerEmail =
    session.customer_details?.email
    ?? session.customer_email
    ?? metadata.customerEmail
    ?? "";
  const externalReference = session.client_reference_id ?? metadata.externalReference ?? session.id;

  if (!product || !customerEmail) {
    return NextResponse.json(
      {
        error: "malformed_checkout_session",
        message: "Webhook session is missing productId or customer email metadata.",
      },
      { status: 400 },
    );
  }

  const expectedIds = buildProvisioningIds({
    productId: product.id,
    customerEmail,
    externalReference,
  });
  const licenseType = metadata.licenseType ?? product.licenseType;
  let persistedResult: PersistedProvisioningResult = {
    action: "already_provisioned",
    entitlementId: expectedIds.entitlementId,
    licenseId: expectedIds.licenseId,
    productId: product.id,
    licenseType,
    machineLimit: parsePositiveInteger(metadata.machineLimit, product.machineLimit),
    expiresAt: null as string | null,
    offlineGraceDays: parsePositiveInteger(metadata.offlineGraceDays, product.offlineGraceDays),
  };

  try {
    persistedResult = await provisionEntitlement({
      productId: product.id,
      customerEmail,
      externalReference,
      licenseType,
      machineLimit: parsePositiveInteger(metadata.machineLimit, product.machineLimit),
      offlineGraceDays: parsePositiveInteger(
        metadata.offlineGraceDays,
        product.offlineGraceDays,
      ),
    });
  } catch (error) {
    if (
      error instanceof LicensingRequestError
      && (error.status === 409
        || error.code === "entitlement_exists"
        || error.code === "license_exists")
    ) {
      persistedResult = {
        ...persistedResult,
        action: "already_provisioned",
      };
    } else {
      return NextResponse.json(
        {
          error: "provision_failed",
          message: error instanceof Error ? error.message : "Webhook provisioning failed.",
        },
        { status: 500 },
      );
    }
  }

  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
    const lineItem = lineItems.data[0];
    const stripePriceId = lineItem?.price?.id ?? null;
    const quantity = lineItem?.quantity ?? 1;

    await persistProvisionedPurchase({
      customerEmail,
      stripeCustomerId: extractStripeId(session.customer),
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: extractStripeId(session.payment_intent),
      externalReference,
      totalAmountCents: session.amount_total ?? null,
      currency: session.currency ?? null,
      productId: product.id,
      stripePriceId,
      quantity,
      entitlementId: persistedResult.entitlementId,
      licenseId: persistedResult.licenseId,
      licenseType: persistedResult.licenseType,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "persistence_failed",
        message: error instanceof Error ? error.message : "Supabase persistence failed.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true, ...persistedResult });
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getProduct } from "@/lib/catalog";
import { appEnv, appFlags } from "@/lib/env";
import { LicensingRequestError, provisionEntitlement } from "@/lib/licensing";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!appFlags.webhookProvisioningConfigured || !stripe || !appEnv.stripeWebhookSecret) {
    return NextResponse.json(
      {
        error: "webhook_not_configured",
        message:
          "Stripe webhook handling requires STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and LICENSING_ADMIN_API_TOKEN.",
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

  try {
    const result = await provisionEntitlement({
      productId: product.id,
      customerEmail,
      externalReference,
      licenseType: metadata.licenseType ?? product.licenseType,
      machineLimit: parsePositiveInteger(metadata.machineLimit, product.machineLimit),
      offlineGraceDays: parsePositiveInteger(
        metadata.offlineGraceDays,
        product.offlineGraceDays,
      ),
    });

    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    if (
      error instanceof LicensingRequestError
      && (error.status === 409
        || error.code === "entitlement_exists"
        || error.code === "license_exists")
    ) {
      return NextResponse.json({
        received: true,
        action: "already_provisioned",
        code: error.code,
      });
    }

    return NextResponse.json(
      {
        error: "provision_failed",
        message: error instanceof Error ? error.message : "Webhook provisioning failed.",
      },
      { status: 500 },
    );
  }
}

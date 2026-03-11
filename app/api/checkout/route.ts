import { NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/lib/catalog";
import { appEnv, isStripeReadyForProduct } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

function formField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const productId = formField(formData, "productId");
  const customerEmail = formField(formData, "customerEmail");
  const externalReference = formField(formData, "externalReference");
  const product = getProduct(productId);

  if (!product) {
    return NextResponse.redirect(new URL("/checkout?status=unknown_product", appEnv.siteUrl));
  }

  const stripe = getStripeClient();
  if (!stripe || !isStripeReadyForProduct(product.id)) {
    return NextResponse.redirect(
      new URL(`/checkout?status=unconfigured&productId=${product.id}`, appEnv.siteUrl),
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appEnv.siteUrl}/checkout?status=success&productId=${product.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appEnv.siteUrl}/checkout?status=cancelled&productId=${product.id}`,
      customer_email: customerEmail || undefined,
      client_reference_id: externalReference || undefined,
      line_items: [
        {
          price: appEnv.stripePriceIds[product.id],
          quantity: 1,
        },
      ],
      metadata: {
        productId: product.id,
        productName: product.name,
        customerEmail,
        externalReference,
        licenseType: product.licenseType,
        machineLimit: String(product.machineLimit),
        offlineGraceDays: String(product.offlineGraceDays),
      },
    });

    if (!session.url) {
      return NextResponse.redirect(
        new URL(`/checkout?status=error&productId=${product.id}`, appEnv.siteUrl),
      );
    }

    return NextResponse.redirect(session.url);
  } catch {
    return NextResponse.redirect(
      new URL(`/checkout?status=error&productId=${product.id}`, appEnv.siteUrl),
    );
  }
}

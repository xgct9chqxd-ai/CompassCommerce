import Stripe from "stripe";
import { appEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;
let initialized = false;

export function getStripeClient(): Stripe | null {
  if (!appEnv.stripeSecretKey) {
    return null;
  }

  if (!initialized) {
    stripeClient = new Stripe(appEnv.stripeSecretKey);
    initialized = true;
  }

  return stripeClient;
}

import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RowId = string | number;

type CustomerRow = {
  id: RowId;
  stripe_customer_id: string | null;
};

type OrderRow = {
  id: RowId;
};

type OrderItemRow = {
  id: RowId;
};

type ProvisionedEntitlementRow = {
  id: RowId;
};

export type PersistProvisionedPurchaseInput = {
  customerEmail: string;
  stripeCustomerId: string | null;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
  externalReference: string;
  totalAmountCents: number | null;
  currency: string | null;
  productId: string;
  stripePriceId: string | null;
  quantity: number;
  entitlementId: string;
  licenseId: string;
  licenseType: string;
};

function requireSupabaseAdmin() {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase service role configuration is missing.");
  }

  return client;
}

async function ensureCustomer(
  email: string,
  stripeCustomerId: string | null,
): Promise<RowId> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("customers")
    .select("id, stripe_customer_id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read customer record: ${error.message}`);
  }

  const customer = data as CustomerRow | null;
  if (customer) {
    if (stripeCustomerId && customer.stripe_customer_id !== stripeCustomerId) {
      const { error: updateError } = await supabase
        .from("customers")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", customer.id);

      if (updateError) {
        throw new Error(`Failed to update customer record: ${updateError.message}`);
      }
    }

    return customer.id;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("customers")
    .insert({
      email,
      stripe_customer_id: stripeCustomerId,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Failed to insert customer record: ${insertError.message}`);
  }

  return (inserted as CustomerRow).id;
}

async function ensureOrder(
  input: PersistProvisionedPurchaseInput,
  customerId: RowId,
): Promise<RowId> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_checkout_session_id", input.stripeCheckoutSessionId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read order record: ${error.message}`);
  }

  const payload = {
    customer_id: customerId,
    stripe_checkout_session_id: input.stripeCheckoutSessionId,
    stripe_payment_intent_id: input.stripePaymentIntentId,
    external_reference: input.externalReference,
    total_amount_cents: input.totalAmountCents,
    currency: input.currency,
  };

  const order = data as OrderRow | null;
  if (order) {
    const { error: updateError } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", order.id);

    if (updateError) {
      throw new Error(`Failed to update order record: ${updateError.message}`);
    }

    return order.id;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("orders")
    .insert(payload)
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Failed to insert order record: ${insertError.message}`);
  }

  return (inserted as OrderRow).id;
}

async function ensureOrderItem(
  orderId: RowId,
  productId: string,
  stripePriceId: string | null,
  quantity: number,
): Promise<void> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("order_items")
    .select("id")
    .eq("order_id", orderId)
    .eq("product_id", productId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read order item record: ${error.message}`);
  }

  const payload = {
    order_id: orderId,
    product_id: productId,
    stripe_price_id: stripePriceId,
    quantity,
  };

  const orderItem = data as OrderItemRow | null;
  if (orderItem) {
    const { error: updateError } = await supabase
      .from("order_items")
      .update(payload)
      .eq("id", orderItem.id);

    if (updateError) {
      throw new Error(`Failed to update order item record: ${updateError.message}`);
    }

    return;
  }

  const { error: insertError } = await supabase
    .from("order_items")
    .insert(payload);

  if (insertError) {
    throw new Error(`Failed to insert order item record: ${insertError.message}`);
  }
}

async function ensureProvisionedEntitlement(
  customerId: RowId,
  orderId: RowId,
  input: PersistProvisionedPurchaseInput,
): Promise<void> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("provisioned_entitlements")
    .select("id")
    .eq("entitlement_id", input.entitlementId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read provisioned entitlement record: ${error.message}`);
  }

  const payload = {
    customer_id: customerId,
    order_id: orderId,
    product_id: input.productId,
    entitlement_id: input.entitlementId,
    license_id: input.licenseId,
    license_type: input.licenseType,
  };

  const provisionedEntitlement = data as ProvisionedEntitlementRow | null;
  if (provisionedEntitlement) {
    const { error: updateError } = await supabase
      .from("provisioned_entitlements")
      .update(payload)
      .eq("id", provisionedEntitlement.id);

    if (updateError) {
      throw new Error(`Failed to update provisioned entitlement record: ${updateError.message}`);
    }

    return;
  }

  const { error: insertError } = await supabase
    .from("provisioned_entitlements")
    .insert(payload);

  if (insertError) {
    throw new Error(`Failed to insert provisioned entitlement record: ${insertError.message}`);
  }
}

export async function persistProvisionedPurchase(
  input: PersistProvisionedPurchaseInput,
): Promise<void> {
  const customerId = await ensureCustomer(input.customerEmail, input.stripeCustomerId);
  const orderId = await ensureOrder(input, customerId);
  await ensureOrderItem(orderId, input.productId, input.stripePriceId, input.quantity);
  await ensureProvisionedEntitlement(customerId, orderId, input);
}

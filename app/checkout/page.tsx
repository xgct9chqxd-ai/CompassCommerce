import Link from "next/link";
import { getProduct } from "@/lib/catalog";
import { appFlags, isStripeReadyForProduct } from "@/lib/env";

type SearchParams = Record<string, string | string[] | undefined>;

function getFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const statusMessages: Record<string, string> = {
  cancelled: "Checkout was cancelled before payment confirmation.",
  error: "Stripe checkout could not be created.",
  success: "Stripe returned successfully. Wait for webhook provisioning before handing the product to a customer.",
  unconfigured: "Stripe is not configured yet, so checkout is still running in placeholder mode.",
  unknown_product: "The selected product is not configured in the catalog.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const productId = getFirst(params.productId) ?? "compass_tricomp";
  const status = getFirst(params.status);
  const product = getProduct(productId) ?? getProduct("compass_tricomp");

  if (!product) {
    return null;
  }

  return (
    <main className="space-y-8 pb-8 pt-6">
      <section className="panel grid gap-8 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <p className="eyebrow">Checkout lane</p>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)]">
            Payment handoff is wired, even before the public domain exists.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--muted)]">
            This page creates Stripe Checkout sessions when the secret key and
            price id exist. Until then, it stays honest and routes you toward
            manual entitlement provisioning.
          </p>

          {status ? (
            <p className="rounded-[22px] bg-amber-100 px-4 py-3 text-sm text-amber-950">
              {statusMessages[status] ?? "Checkout returned with an unknown status."}
            </p>
          ) : null}
        </div>

        <aside className="rounded-[28px] border border-black/8 bg-white/72 p-6">
          <p className="eyebrow">Current product</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            {product.name}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {product.tagline}
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <p className="rounded-[18px] border border-black/8 bg-white/80 px-4 py-3 text-[var(--foreground)]">
              Stripe secret loaded: {appFlags.stripeConfigured ? "yes" : "no"}
            </p>
            <p className="rounded-[18px] border border-black/8 bg-white/80 px-4 py-3 text-[var(--foreground)]">
              Product price id loaded: {isStripeReadyForProduct(product.id) ? "yes" : "no"}
            </p>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <form className="panel space-y-5 px-6 py-8" action="/api/checkout" method="post">
          <p className="eyebrow">Create Stripe session</p>
          <input type="hidden" name="productId" value={product.id} />

          <label className="space-y-2">
            <span className="label">Customer email</span>
            <input
              className="field"
              type="email"
              name="customerEmail"
              placeholder="customer@example.com"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="label">External reference</span>
            <input
              className="field"
              name="externalReference"
              placeholder="order_1001"
              required
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button className="button-primary" type="submit">
              Create checkout session
            </button>
            <Link className="button-secondary" href="/operator/provision">
              Use manual provisioning instead
            </Link>
          </div>
        </form>

        <article className="panel px-6 py-8">
          <p className="eyebrow">What still needs user input</p>
          <div className="mt-5 space-y-3 text-sm leading-6 text-[var(--foreground)]">
            <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3">
              Real Stripe price id for {product.name}
            </p>
            <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3">
              Stripe webhook signing secret
            </p>
            <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3">
              Production site URL once you pick the public hostname
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}

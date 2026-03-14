import { formatDate, formatMoney } from "@/lib/format";
import { loadAccountOrders } from "@/lib/portal-data";
import { requireAuthenticatedUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const { supabase } = await requireAuthenticatedUser("/account/orders");
  const orders = await loadAccountOrders(supabase);

  return (
    <section className="panel px-6 py-8">
      <p className="eyebrow">Orders</p>
      <div className="mt-5 space-y-4">
        {orders.length === 0 ? (
          <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--muted)]">
            No orders are visible for this account yet.
          </p>
        ) : (
          orders.map((order) => (
            <article
              key={order.id}
              className="grid gap-4 rounded-[22px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--foreground)] lg:grid-cols-4"
            >
              <div>
                <p className="label">Reference</p>
                <p className="mt-2">{order.externalReference ?? "Unavailable"}</p>
              </div>
              <div>
                <p className="label">Amount</p>
                <p className="mt-2">{formatMoney(order.totalAmountCents, order.currency)}</p>
              </div>
              <div>
                <p className="label">Currency</p>
                <p className="mt-2">{order.currency?.toUpperCase() ?? "Unavailable"}</p>
              </div>
              <div>
                <p className="label">Created</p>
                <p className="mt-2">{formatDate(order.createdAt)}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

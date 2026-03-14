import { loadAccountDashboard } from "@/lib/portal-data";
import { requireAuthenticatedUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  const { supabase, user } = await requireAuthenticatedUser("/account");
  const dashboard = await loadAccountDashboard(supabase);

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <article className="panel px-6 py-8">
        <p className="eyebrow">Customer email</p>
        <p className="mt-4 break-all text-lg font-semibold text-[var(--foreground)]">
          {user.email ?? "Unknown"}
        </p>
      </article>

      <article className="panel px-6 py-8">
        <p className="eyebrow">Orders</p>
        <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
          {dashboard.orderCount}
        </p>
      </article>

      <article className="panel px-6 py-8">
        <p className="eyebrow">Licenses</p>
        <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
          {dashboard.licenseCount}
        </p>
      </article>

      <article className="panel px-6 py-8 lg:col-span-3">
        <p className="eyebrow">Owned products</p>
        <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
          {dashboard.ownedProductCount}
        </p>
      </article>
    </section>
  );
}

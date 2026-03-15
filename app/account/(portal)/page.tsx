import Link from "next/link";
import { formatProductName } from "@/lib/format";
import { loadAccountDashboard, loadAccountLicenses } from "@/lib/portal-data";
import { requireAuthenticatedUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  const { supabase, user } = await requireAuthenticatedUser("/account");
  const dashboard = await loadAccountDashboard(supabase, user.email ?? "");
  const licenses = await loadAccountLicenses(supabase, user.email ?? "");
  const starterLicense = licenses[0] ?? null;

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

      <article className="panel px-6 py-8 lg:col-span-2">
        <p className="eyebrow">Getting started</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Download, install, then manage activation from your Compass account.
        </h2>
        {starterLicense ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 rounded-[22px] border border-black/8 bg-white/80 px-5 py-5 lg:grid-cols-2">
              <div>
                <p className="label">Product</p>
                <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
                  {formatProductName(starterLicense.productId)}
                </p>
              </div>
              <div>
                <p className="label">License ID</p>
                <p className="mt-2 break-all font-mono text-sm text-[var(--foreground)]">
                  {starterLicense.licenseId}
                </p>
              </div>
            </div>

            <ol className="space-y-3 text-sm leading-7 text-[var(--foreground)]">
              <li className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3">
                1. Open <Link className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline" href="/account/downloads">Downloads</Link> and install the current build for your platform.
              </li>
              <li className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3">
                2. Open the plugin on the target machine and start website activation to get its device code.
              </li>
              <li className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3">
                3. Open the matching license page here, enter that device code, and activate the machine from the site.
              </li>
              <li className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3">
                4. Return to the plugin and check activation. If you need to free a seat later, deactivate a device from the license page and then activate again when needed.
              </li>
            </ol>
          </div>
        ) : (
          <p className="mt-5 rounded-[20px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--muted)]">
            Your account does not have a provisioned license yet. Once a purchase finishes, the
            license ID and download steps will appear here automatically.
          </p>
        )}
      </article>

      <article className="panel px-6 py-8">
        <p className="eyebrow">Next actions</p>
        <div className="mt-5 space-y-3">
          <Link className="button-primary w-full" href="/account/downloads">
            Open downloads
          </Link>
          <Link className="button-secondary w-full" href="/account/licenses">
            View license details
          </Link>
        </div>
        <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
          The primary experience is website-managed seats and website-approved device activation,
          while the plugin keeps the local signed license and offline grace state.
        </p>
      </article>
    </section>
  );
}

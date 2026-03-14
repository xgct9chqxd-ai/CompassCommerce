import { formatDate } from "@/lib/format";
import { loadAccountLicenses } from "@/lib/portal-data";
import { requireAuthenticatedUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AccountLicensesPage() {
  const { supabase } = await requireAuthenticatedUser("/account/licenses");
  const licenses = await loadAccountLicenses(supabase);

  return (
    <section className="panel px-6 py-8">
      <p className="eyebrow">Licenses</p>
      <div className="mt-5 space-y-4">
        {licenses.length === 0 ? (
          <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--muted)]">
            No licenses are visible for this account yet.
          </p>
        ) : (
          licenses.map((license) => (
            <article
              key={license.id}
              className="grid gap-4 rounded-[22px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--foreground)] lg:grid-cols-5"
            >
              <div>
                <p className="label">Product</p>
                <p className="mt-2 break-all">{license.productId}</p>
              </div>
              <div>
                <p className="label">Entitlement</p>
                <p className="mt-2 break-all font-mono">{license.entitlementId}</p>
              </div>
              <div>
                <p className="label">License</p>
                <p className="mt-2 break-all font-mono">{license.licenseId}</p>
              </div>
              <div>
                <p className="label">Type</p>
                <p className="mt-2">{license.licenseType}</p>
              </div>
              <div>
                <p className="label">Created</p>
                <p className="mt-2">{formatDate(license.createdAt)}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

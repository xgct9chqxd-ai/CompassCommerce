import Link from "next/link";
import { formatDate, formatProductName } from "@/lib/format";
import {
  loadAccountLicenses,
  loadSeatSnapshotsForLicenses,
} from "@/lib/portal-data";
import { requireAuthenticatedUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AccountLicensesPage() {
  const { supabase, user } = await requireAuthenticatedUser("/account/licenses");
  const licenses = await loadAccountLicenses(supabase, user.email ?? "");
  const seatSnapshots = await loadSeatSnapshotsForLicenses(licenses).catch(() => new Map());

  return (
    <section className="panel px-6 py-8">
      <p className="eyebrow">Licenses</p>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
        Licenses now double as your activation management surface. Open a license to see seat
        usage, active devices, and deactivate controls. Activation happens from the plugin, and
        this page reflects those device claims live.
      </p>
      <div className="mt-5 space-y-4">
        {licenses.length === 0 ? (
          <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--muted)]">
            No licenses are visible for this account yet.
          </p>
        ) : (
          licenses.map((license) => {
            const seatSnapshot = seatSnapshots.get(license.licenseId);
            const usageLabel = seatSnapshot
              ? `${seatSnapshot.activeMachines.length} of ${seatSnapshot.machineLimit} activations used`
              : "Usage unavailable";

            return (
              <article
                key={license.id}
                className="grid gap-4 rounded-[22px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--foreground)] lg:grid-cols-5"
              >
                <div>
                  <p className="label">Product</p>
                  <p className="mt-2 break-all">{formatProductName(license.productId)}</p>
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
                <div className="lg:col-span-3">
                  <p className="label">Activations</p>
                  <p className="mt-2">{usageLabel}</p>
                </div>
                <div className="lg:col-span-2 flex flex-wrap items-center gap-3 lg:justify-end">
                  <Link
                    className="button-primary inline-flex"
                    href={`/account/licenses/${encodeURIComponent(license.licenseId)}`}
                  >
                    Manage activations
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

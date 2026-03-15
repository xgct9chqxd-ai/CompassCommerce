import { LicenseManagerRow } from "@/components/license-manager-row";
import { getProduct } from "@/lib/catalog";
import { loadPendingPortalActivation } from "@/lib/device-pairing";
import { formatProductName } from "@/lib/format";
import {
  loadAccountLicenses,
  loadSeatSnapshotsForLicenses,
} from "@/lib/portal-data";
import { requireAuthenticatedUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AccountLicensesPage({
  searchParams,
}: {
  searchParams: Promise<{ activationRequest?: string; productId?: string }>;
}) {
  const { activationRequest = "", productId = "" } = await searchParams;
  const { supabase, user } = await requireAuthenticatedUser("/account/licenses");
  const licenses = await loadAccountLicenses(supabase, user.email ?? "");
  const seatSnapshots = await loadSeatSnapshotsForLicenses(licenses).catch(() => new Map());
  const pendingActivation = activationRequest
    ? await loadPendingPortalActivation(activationRequest).catch(() => null)
    : null;
  const requestedProductId = pendingActivation?.productId ?? productId;

  return (
    <section className="panel px-6 py-8">
      <p className="eyebrow">Licenses</p>
      <div className="mt-5 space-y-3">
        {licenses.length === 0 ? (
          <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--muted)]">
            No licenses are visible for this account yet.
          </p>
        ) : (
          licenses.map((license) => {
            const seatSnapshot = seatSnapshots.get(license.licenseId);
            const machineLimit = seatSnapshot?.machineLimit ?? getProduct(license.productId)?.machineLimit ?? 0;
            const canActivatePendingDevice = Boolean(
              pendingActivation && (!requestedProductId || requestedProductId === license.productId),
            );
            const activeMachines = seatSnapshot?.activeMachines ?? [];

            return (
              <LicenseManagerRow
                key={license.id}
                activeMachines={activeMachines}
                activationRequest={canActivatePendingDevice ? pendingActivation!.requestId : undefined}
                licenseId={license.licenseId}
                machineLimit={machineLimit}
                productName={formatProductName(license.productId)}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

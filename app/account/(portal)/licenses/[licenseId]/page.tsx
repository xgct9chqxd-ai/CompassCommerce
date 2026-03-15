import Link from "next/link";
import { notFound } from "next/navigation";
import { LicenseSeatManager } from "@/components/license-seat-manager";
import { getProduct } from "@/lib/catalog";
import { formatDate, formatProductName } from "@/lib/format";
import {
  loadAccountLicenseByLicenseId,
  loadSeatSnapshotsForLicenses,
} from "@/lib/portal-data";
import { requireAuthenticatedUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AccountLicenseDetailPage({
  params,
}: {
  params: Promise<{ licenseId: string }>;
}) {
  const { licenseId } = await params;
  const { supabase, user } = await requireAuthenticatedUser(`/account/licenses/${licenseId}`);
  const license = await loadAccountLicenseByLicenseId(supabase, user.email ?? "", licenseId);

  if (!license) {
    notFound();
  }

  const seatSnapshots = await loadSeatSnapshotsForLicenses([license]).catch(() => new Map());
  const seatSnapshot = seatSnapshots.get(license.licenseId) ?? null;
  const defaultMachineLimit = getProduct(license.productId)?.machineLimit ?? 0;
  const machineLimit = seatSnapshot?.machineLimit ?? defaultMachineLimit;
  const activeMachineCount = seatSnapshot?.activeMachines.length ?? 0;

  return (
    <section className="space-y-6">
      <article className="panel px-6 py-8">
        <p className="eyebrow">License management</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {formatProductName(license.productId)}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          This page is the management plane for the license. The plugin still stores local signed
          license state, refreshes offline grace, and unlocks processing locally, but this account
          page shows seat usage, active devices, and lets you deactivate devices when you need to
          free a seat.
        </p>

        <div className="mt-5 grid gap-4 rounded-[22px] border border-black/8 bg-white/75 px-5 py-5 text-sm lg:grid-cols-4">
          <div>
            <p className="label">License ID</p>
            <p className="mt-2 break-all font-mono">{license.licenseId}</p>
          </div>
          <div>
            <p className="label">Entitlement</p>
            <p className="mt-2 break-all font-mono">{license.entitlementId}</p>
          </div>
          <div>
            <p className="label">Type</p>
            <p className="mt-2">{license.licenseType}</p>
          </div>
          <div>
            <p className="label">Created</p>
            <p className="mt-2">{formatDate(license.createdAt)}</p>
          </div>
        </div>
      </article>

      <article className="panel px-6 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Activation usage</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              {activeMachineCount} of {machineLimit} activations used
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              Active devices come from the licensing backend&apos;s current machine state. Deactivating
              here frees a seat for another machine, and the plugin can claim that seat again on
              the next activation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="button-primary" href="/account/downloads">
              Open downloads
            </Link>
            <Link className="button-secondary" href="/account/licenses">
              Back to licenses
            </Link>
          </div>
        </div>

        <div className="mt-6">
          {seatSnapshot ? (
            <LicenseSeatManager
              activeMachines={seatSnapshot.activeMachines}
              licenseId={license.licenseId}
              machineLimit={seatSnapshot.machineLimit}
              revokedMachineCount={seatSnapshot.revokedMachineCount}
            />
          ) : (
            <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--muted)]">
              Activation usage is temporarily unavailable. The license record exists, but the
              current machine state could not be loaded from licensing right now.
            </p>
          )}
        </div>
      </article>

      <article className="panel px-6 py-8">
        <p className="eyebrow">Activate from the plugin</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          Download the plugin, open it on the target machine, and activate with your purchase email
          and license ID. Once the device claims a seat, it appears here automatically. If you
          deactivate a device here, you can activate again later within the seat limit.
        </p>
      </article>
    </section>
  );
}

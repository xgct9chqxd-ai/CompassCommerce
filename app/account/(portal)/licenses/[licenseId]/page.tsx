import Link from "next/link";
import { notFound } from "next/navigation";
import { LicenseActivateDeviceButton } from "@/components/license-activate-device-button";
import { LicenseSeatManager } from "@/components/license-seat-manager";
import { getProduct } from "@/lib/catalog";
import { loadPendingPortalActivation } from "@/lib/device-pairing";
import { formatDate, formatProductName } from "@/lib/format";
import {
  loadAccountLicenseByLicenseId,
  loadSeatSnapshotsForLicenses,
} from "@/lib/portal-data";
import { requireAuthenticatedUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AccountLicenseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ licenseId: string }>;
  searchParams: Promise<{ activationRequest?: string }>;
}) {
  const { licenseId } = await params;
  const { activationRequest = "" } = await searchParams;
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
  const pendingActivation = activationRequest
    ? await loadPendingPortalActivation(activationRequest).catch(() => null)
    : null;
  const canActivatePendingDevice = pendingActivation?.productId === license.productId;

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
          page shows seat usage, active devices, and lets you activate or deactivate machines
          whenever you need to manage a seat.
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
              here frees a seat for another machine. When Tri-Comp opens on a new machine, this
              page can approve that waiting device with one click.
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
        <p className="eyebrow">Activate from this site</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {canActivatePendingDevice ? "This device is ready to activate." : "Open the plugin on the target machine first."}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          {canActivatePendingDevice
            ? "The plugin has already registered this machine with your account. Click Activate to claim a seat and finish activation from the website."
            : "When Tri-Comp is opened on a machine that is not yet activated, your account can approve it here with a single Activate button."}
        </p>

        <div className="mt-6">
          {canActivatePendingDevice ? (
            <div className="rounded-[22px] border border-black/8 bg-white/78 px-5 py-5">
              <p className="label">Pending device</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Approve this waiting {formatProductName(license.productId)} machine from your
                account. The plugin will finish activation after it checks in again.
              </p>
              <div className="mt-4">
                <LicenseActivateDeviceButton
                  activationRequest={pendingActivation.requestId}
                  label="Activate"
                  licenseId={license.licenseId}
                  redirectHref={`/account/licenses/${encodeURIComponent(license.licenseId)}`}
                />
              </div>
            </div>
          ) : (
            <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--muted)]">
              No waiting device is asking to activate this license right now. Open Tri-Comp on the
              machine you want to use, then return here to approve it.
            </p>
          )}
        </div>
      </article>

      <article className="panel px-6 py-8">
        <p className="eyebrow">What happens next</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          The plugin now starts the machine handshake and this page approves it. Once this site
          activates the waiting device, the plugin checks in, stores the signed local license, and
          unlocks processing on that machine.
        </p>
      </article>
    </section>
  );
}

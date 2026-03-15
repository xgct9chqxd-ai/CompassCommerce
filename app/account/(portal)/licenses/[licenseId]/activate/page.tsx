import Link from "next/link";
import { notFound } from "next/navigation";
import { LicenseActivationRequestForm } from "@/components/license-activation-request-form";
import { formatDate, formatProductName } from "@/lib/format";
import { loadAccountLicenseByLicenseId } from "@/lib/portal-data";
import { requireAuthenticatedUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AccountLicenseActivationPage({
  params,
}: {
  params: Promise<{ licenseId: string }>;
}) {
  const { licenseId } = await params;
  const { supabase, user } = await requireAuthenticatedUser(`/account/licenses/${licenseId}/activate`);
  const license = await loadAccountLicenseByLicenseId(supabase, user.email ?? "", licenseId);

  if (!license) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <article className="panel px-6 py-8">
        <p className="eyebrow">Portal activation</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Finish activation for {formatProductName(license.productId)}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          This machine-bound flow keeps the primary activation journey in your account. Export the
          activation request from the plugin on the target machine, upload or paste it here, then
          import the downloaded license file back into the plugin.
        </p>

        <div className="mt-5 grid gap-4 rounded-[22px] border border-black/8 bg-white/75 px-5 py-5 text-sm lg:grid-cols-4">
          <div>
            <p className="label">Product</p>
            <p className="mt-2">{formatProductName(license.productId)}</p>
          </div>
          <div>
            <p className="label">License ID</p>
            <p className="mt-2 break-all font-mono">{license.licenseId}</p>
          </div>
          <div>
            <p className="label">Entitlement</p>
            <p className="mt-2 break-all font-mono">{license.entitlementId}</p>
          </div>
          <div>
            <p className="label">Issued</p>
            <p className="mt-2">{formatDate(license.createdAt)}</p>
          </div>
        </div>
      </article>

      <article className="panel px-6 py-8">
        <p className="eyebrow">Activation steps</p>
        <ol className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
          <li className="rounded-[18px] border border-black/8 bg-white/75 px-4 py-3">
            1. Open the plugin on the machine you want to activate and choose{" "}
            <span className="font-semibold">Export Request</span> or{" "}
            <span className="font-semibold">Copy Request</span>.
          </li>
          <li className="rounded-[18px] border border-black/8 bg-white/75 px-4 py-3">
            2. Upload that request file here or paste the request JSON below.
          </li>
          <li className="rounded-[18px] border border-black/8 bg-white/75 px-4 py-3">
            3. Download the generated activation bundle and import it into the plugin with{" "}
            <span className="font-semibold">Import License File</span>.
          </li>
        </ol>

        <div className="mt-6">
          <LicenseActivationRequestForm
            actionUrl={`/api/account/licenses/${encodeURIComponent(license.licenseId)}/activation-bundle`}
            licenseId={license.licenseId}
            productName={formatProductName(license.productId)}
          />
        </div>
      </article>

      <article className="panel px-6 py-8">
        <p className="eyebrow">Fallback</p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          The plugin still supports the earlier manual email + license ID activation flow for
          support and testing, but this portal-driven request/import path is now the recommended
          customer journey.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="button-secondary" href="/account/licenses">
            Back to licenses
          </Link>
          <Link className="button-secondary" href="/account/downloads">
            Open downloads
          </Link>
        </div>
      </article>
    </section>
  );
}

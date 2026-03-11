import { ManualPortalConsole } from "@/components/manual-portal-console";

export default function PortalPage() {
  return (
    <main className="space-y-8 pb-8 pt-6">
      <section className="panel grid gap-8 px-6 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <p className="eyebrow">Manual portal lane</p>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)]">
            Drive activate, refresh, and revoke from the website before customer
            auth exists.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--muted)]">
            This page is intentionally operator-friendly. It exercises the live
            licensing backend through same-origin Next routes without exposing the
            raw VM endpoints to browser code.
          </p>
        </div>

        <div className="rounded-[28px] border border-black/8 bg-white/72 p-6">
          <p className="eyebrow">Use it for</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--foreground)]">
            <p className="rounded-[18px] border border-black/8 bg-white/80 px-4 py-3">
              smoke-testing activate and refresh after provisioning an entitlement
            </p>
            <p className="rounded-[18px] border border-black/8 bg-white/80 px-4 py-3">
              support workflows where you need to revoke a stale machine quickly
            </p>
            <p className="rounded-[18px] border border-black/8 bg-white/80 px-4 py-3">
              validating the public licensing routes while the customer portal is
              still pre-auth
            </p>
          </div>
        </div>
      </section>

      <section className="panel px-6 py-8">
        <p className="eyebrow">Licensing console</p>
        <div className="mt-5">
          <ManualPortalConsole defaultProductId="compass_tricomp" />
        </div>
      </section>
    </main>
  );
}

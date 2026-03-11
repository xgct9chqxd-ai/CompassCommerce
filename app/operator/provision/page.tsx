import { OperatorProvisionForm } from "@/components/operator-provision-form";
import { appFlags } from "@/lib/env";

export default function OperatorProvisionPage() {
  return (
    <main className="space-y-8 pb-8 pt-6">
      <section className="panel grid gap-8 px-6 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <p className="eyebrow">Operator provisioning</p>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)]">
            Create entitlements from the website without touching the licensing
            SQLite file directly.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--muted)]">
            This form calls the private backend route we added:
            <span className="ml-2 font-mono text-sm text-[var(--foreground)]">
              POST /internal/v1/entitlements
            </span>
          </p>
        </div>

        <div className="rounded-[28px] border border-black/8 bg-white/72 p-6">
          <p className="eyebrow">Configuration state</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--foreground)]">
            <p className="rounded-[18px] border border-black/8 bg-white/80 px-4 py-3">
              Operator provisioning route armed:{" "}
              {appFlags.operatorProvisioningConfigured ? "yes" : "not yet"}
            </p>
            <p className="rounded-[18px] border border-black/8 bg-white/80 px-4 py-3">
              This page stays locked until both the website and backend share the
              right admin secrets.
            </p>
            <p className="rounded-[18px] border border-black/8 bg-white/80 px-4 py-3">
              IDs are generated deterministically from product, customer email,
              and external order reference.
            </p>
          </div>
        </div>
      </section>

      <section className="panel px-6 py-8">
        <p className="eyebrow">Provisioning form</p>
        <div className="mt-5">
          <OperatorProvisionForm enabled={appFlags.operatorProvisioningConfigured} />
        </div>
      </section>
    </main>
  );
}

import { formatDownloadAction, formatPlatformLabel } from "@/lib/format";
import { loadAccountDownloads } from "@/lib/portal-data";
import { requireAuthenticatedUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AccountDownloadsPage() {
  const { supabase, user } = await requireAuthenticatedUser("/account/downloads");
  const groups = await loadAccountDownloads(supabase, user.email ?? "");

  return (
    <section className="panel px-6 py-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Downloads</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Ready-to-install product builds.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            Use the latest build for your platform, then activate in the plugin with your purchase
            email and license ID from the portal.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {groups.length === 0 ? (
          <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--muted)]">
            No downloads are visible for this account yet.
          </p>
        ) : (
          groups.map((group) => (
            <section
              key={group.productId}
              className="rounded-[28px] border border-black/8 bg-white/72 p-6 shadow-[0_18px_60px_var(--shadow)]"
            >
              <div className="flex flex-col gap-3 border-b border-black/8 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="eyebrow">Owned product</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                    {group.productName}
                  </h3>
                </div>
                <p className="rounded-full border border-black/8 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {group.items.length} download{group.items.length === 1 ? "" : "s"} available
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {group.items.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-4 rounded-[22px] border border-black/8 bg-white/80 px-5 py-5 text-sm text-[var(--foreground)] lg:grid-cols-[0.8fr_0.8fr_1.4fr]"
                  >
                    <div>
                      <p className="label">Platform</p>
                      <p className="mt-2 text-base font-semibold">
                        {formatPlatformLabel(item.platform)}
                      </p>
                    </div>
                    <div>
                      <p className="label">Version</p>
                      <p className="mt-2 text-base font-semibold">{item.version}</p>
                    </div>
                    <div className="flex flex-col gap-3 lg:items-end lg:justify-between">
                      <div className="lg:text-right">
                        <p className="label">Delivery</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          Installer download hosted from your current product delivery record.
                        </p>
                      </div>
                      <a
                        className="button-primary w-full lg:w-auto"
                        href={item.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {formatDownloadAction(item.platform)}
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </section>
  );
}

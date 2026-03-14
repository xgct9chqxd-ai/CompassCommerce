import { loadAccountDownloads } from "@/lib/portal-data";
import { requireAuthenticatedUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AccountDownloadsPage() {
  const { supabase } = await requireAuthenticatedUser("/account/downloads");
  const groups = await loadAccountDownloads(supabase);

  return (
    <section className="panel px-6 py-8">
      <p className="eyebrow">Downloads</p>
      <div className="mt-5 space-y-6">
        {groups.length === 0 ? (
          <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--muted)]">
            No downloads are visible for this account yet.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.productId} className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                {group.productName}
              </h2>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-4 rounded-[22px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--foreground)] lg:grid-cols-4"
                  >
                    <div>
                      <p className="label">Platform</p>
                      <p className="mt-2">{item.platform}</p>
                    </div>
                    <div>
                      <p className="label">Version</p>
                      <p className="mt-2">{item.version}</p>
                    </div>
                    <div className="lg:col-span-2">
                      <p className="label">Download</p>
                      <a
                        className="mt-2 inline-flex break-all text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                        href={item.downloadUrl}
                      >
                        {item.downloadUrl}
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

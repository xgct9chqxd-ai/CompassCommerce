import { redirect } from "next/navigation";
import { appFlags } from "@/lib/env";
import { createSupabaseServerClient, normalizeAccountPath } from "@/lib/supabase-auth";

type SearchParams = Record<string, string | string[] | undefined>;

function getFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const statusMessages: Record<string, string> = {
  "auth-error": "The sign-in link could not be completed. Request a new one and try again.",
  "link-sent": "Check your email for the sign-in link.",
  "signed-out": "You have been signed out.",
  unavailable: "Supabase email sign-in is not configured in this environment yet.",
};

export const dynamic = "force-dynamic";

export default async function AccountSignInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const next = normalizeAccountPath(getFirst(params.next));
  const status = getFirst(params.status);

  if (appFlags.supabaseAuthConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      redirect(next);
    }
  }

  return (
    <main className="space-y-8 pb-8 pt-6">
      <section className="panel grid gap-8 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <p className="eyebrow">Account sign-in</p>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)]">
            Sign in with a magic link.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--muted)]">
            Use the same email address you purchased with. The portal reads your account data
            directly through Supabase row-level security.
          </p>
          {status ? (
            <p className="rounded-[22px] bg-amber-100 px-4 py-3 text-sm text-amber-950">
              {statusMessages[status] ?? "Sign-in returned an unknown status."}
            </p>
          ) : null}
        </div>

        <form className="panel space-y-5 px-6 py-8" action="/auth/sign-in" method="post">
          <p className="eyebrow">Email link</p>
          <input type="hidden" name="next" value={next} />
          <label className="space-y-2">
            <span className="label">Email address</span>
            <input
              className="field"
              type="email"
              name="email"
              placeholder="customer@example.com"
              required
            />
          </label>
          <button className="button-primary" type="submit" disabled={!appFlags.supabaseAuthConfigured}>
            Send sign-in link
          </button>
        </form>
      </section>
    </main>
  );
}

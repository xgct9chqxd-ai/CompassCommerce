export function SiteFooter() {
  return (
    <footer className="px-4 pb-8 sm:px-6 lg:px-8">
      <div className="panel mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
            Current build lane
          </p>
          <p className="text-sm text-[var(--foreground)]">
            Website shell is local-first while the licensing backend stays on the
            validated Ubuntu VM. Real domain, Stripe secrets, and customer auth
            can plug in without changing the licensing contract.
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
          Compass Commerce MVP
        </p>
      </div>
    </footer>
  );
}

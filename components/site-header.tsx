import Link from "next/link";

const links = [
  { href: "/products/tri-comp", label: "Product" },
  { href: "/checkout", label: "Checkout" },
  { href: "/portal", label: "Portal" },
  { href: "/operator/provision", label: "Operator" },
];

export function SiteHeader() {
  return (
    <header className="px-4 pb-4 pt-6 sm:px-6 lg:px-8">
      <div className="panel mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent)] text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_10px_30px_rgba(15,122,102,0.35)]">
              CC
            </span>
            <span>
              <span className="block text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                Compass
              </span>
              <span className="block text-lg font-semibold tracking-tight text-[var(--foreground)]">
                Commerce
              </span>
            </span>
          </Link>
          <span className="hidden rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-[var(--muted)] sm:inline-flex">
            Hostname pending
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-white/80 hover:text-[var(--foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/licenses", label: "Licenses" },
  { href: "/account/downloads", label: "Downloads" },
];

export function AccountShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="space-y-8 pb-8 pt-6">
      <section className="panel grid gap-8 px-6 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <p className="eyebrow">Customer portal</p>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)]">
            Your purchases, licenses, and downloads in one place.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--muted)]">
            This first pass keeps the portal focused: purchase visibility, license tracking,
            and current downloads only.
          </p>
          <p className="rounded-[18px] border border-black/8 bg-white/80 px-4 py-3 text-sm text-[var(--foreground)]">
            Signed in as {email}
          </p>
        </div>

        <div className="space-y-4 rounded-[28px] border border-black/8 bg-white/72 p-6">
          <p className="eyebrow">Account navigation</p>
          <nav className="grid gap-2">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-[18px] px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                      : "border border-black/8 bg-white/80 text-[var(--foreground)] hover:bg-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <form action="/auth/sign-out" method="post">
            <button className="button-secondary w-full" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </section>

      {children}
    </main>
  );
}

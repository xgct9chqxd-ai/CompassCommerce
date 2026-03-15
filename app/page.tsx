import Link from "next/link";

export default function Home() {
  return (
    <main className="space-y-6">
      <section className="panel px-6 py-10">
        <p className="eyebrow">Compass Commerce</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
          Downloads, licenses, and activation in one place.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          Use the license manager to activate or deactivate your plugins, or open downloads to get
          the latest installer.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="button-primary" href="/account/licenses">
            Open licenses
          </Link>
          <Link className="button-secondary" href="/account/downloads">
            Open downloads
          </Link>
          <Link className="button-secondary" href="/products/tri-comp">
            View product
          </Link>
        </div>
      </section>
    </main>
  );
}

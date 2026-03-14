import Link from "next/link";
import { getProduct } from "@/lib/catalog";

const product = getProduct("compass_tricomp");

export default function TriCompProductPage() {
  if (!product) {
    return null;
  }

  return (
    <main className="space-y-8 pb-8 pt-6">
      <section className="panel grid gap-8 px-6 py-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <p className="eyebrow">{product.releaseStage}</p>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
            {product.name}
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--muted)]">
            {product.summary}
          </p>
          <p className="max-w-3xl text-base leading-7 text-[var(--foreground)]">
            {product.hero}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="button-primary" href="/checkout">
              Continue to checkout
            </Link>
            <Link className="button-secondary" href="/account">
              Access your account
            </Link>
          </div>
        </div>

        <aside className="rounded-[28px] border border-black/8 bg-white/72 p-6">
          <p className="eyebrow">License profile</p>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="eyebrow">Product id</dt>
              <dd className="mt-1 font-mono text-[var(--foreground)]">{product.id}</dd>
            </div>
            <div>
              <dt className="eyebrow">License type</dt>
              <dd className="mt-1 text-[var(--foreground)]">{product.licenseType}</dd>
            </div>
            <div>
              <dt className="eyebrow">Machine limit</dt>
              <dd className="mt-1 text-[var(--foreground)]">{product.machineLimit}</dd>
            </div>
            <div>
              <dt className="eyebrow">Offline grace days</dt>
              <dd className="mt-1 text-[var(--foreground)]">
                {product.offlineGraceDays}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Portal delivery</dt>
              <dd className="mt-1 text-[var(--foreground)]">
                Downloads and license details appear in the customer account immediately after
                successful provisioning.
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="panel px-6 py-8">
          <p className="eyebrow">What the customer gets</p>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--foreground)]">
            {product.whatYouGet.map((item) => (
              <li
                key={item}
                className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="panel px-6 py-8">
          <p className="eyebrow">Activation path</p>
          <ol className="mt-5 space-y-3 text-sm leading-7 text-[var(--foreground)]">
            {product.activationFlow.map((item, index) => (
              <li
                key={item}
                className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3"
              >
                <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[var(--accent-contrast)]">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="panel px-6 py-8">
          <p className="eyebrow">After checkout</p>
          <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--foreground)]">
            <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3">
              1. Sign in to your account with the same purchase email used at checkout.
            </p>
            <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3">
              2. Open Downloads to grab the current build for your platform.
            </p>
            <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3">
              3. Open Licenses to find the license ID you will enter during activation.
            </p>
          </div>
        </article>

        <article className="panel px-6 py-8">
          <p className="eyebrow">Activation handoff</p>
          <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--foreground)]">
            <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3">
              Customer-facing inputs should stay simple: purchase email plus license ID.
            </p>
            <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3">
              The installed product can resolve the matching entitlement and then activate against
              the licensing API without exposing internal IDs in the storefront UI.
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="panel px-6 py-8">
          <p className="eyebrow">Storefront notes</p>
          <div className="mt-5 space-y-3">
            {product.storefrontNotes.map((item) => (
              <p
                key={item}
                className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-3 text-sm leading-6 text-[var(--foreground)]"
              >
                {item}
              </p>
            ))}
          </div>
        </article>

        <article className="panel px-6 py-8">
          <p className="eyebrow">Activation request example</p>
          <pre className="mt-5 overflow-x-auto rounded-[24px] bg-[#13231f] p-5 text-sm text-[#f5f1e8]">
{`POST /v1/activate
{
  "entitlementId": "ent_store_demo",
  "productId": "${product.id}",
  "machineHash": "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC"
}`}
          </pre>
        </article>
      </section>
    </main>
  );
}

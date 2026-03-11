"use client";

import { useState, useTransition } from "react";
import { catalog, getProduct, type ProductId } from "@/lib/catalog";

type ProvisionFormState = {
  productId: ProductId;
  customerEmail: string;
  externalReference: string;
  operatorToken: string;
  licenseType: string;
  machineLimit: string;
  offlineGraceDays: string;
};

const defaultProduct = getProduct("compass_tricomp");

function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function OperatorProvisionForm({ enabled }: { enabled: boolean }) {
  const [form, setForm] = useState<ProvisionFormState>({
    productId: defaultProduct?.id ?? "compass_tricomp",
    customerEmail: "",
    externalReference: "",
    operatorToken: "",
    licenseType: defaultProduct?.licenseType ?? "perpetual",
    machineLimit: String(defaultProduct?.machineLimit ?? 2),
    offlineGraceDays: String(defaultProduct?.offlineGraceDays ?? 30),
  });
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function patchForm<Key extends keyof ProvisionFormState>(key: Key, value: ProvisionFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyProductDefaults(productId: ProductId) {
    const product = getProduct(productId);
    if (!product) {
      return;
    }

    setForm((current) => ({
      ...current,
      productId,
      licenseType: product.licenseType,
      machineLimit: String(product.machineLimit),
      offlineGraceDays: String(product.offlineGraceDays),
    }));
  }

  async function submitProvision() {
    setError(null);
    setResult("");

    const response = await fetch("/api/operator/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-operator-token": form.operatorToken,
      },
      body: JSON.stringify({
        productId: form.productId,
        customerEmail: form.customerEmail,
        externalReference: form.externalReference,
        licenseType: form.licenseType,
        machineLimit: form.machineLimit,
        offlineGraceDays: form.offlineGraceDays,
      }),
    });

    const payload = (await response.json().catch(() => ({
      error: "request_failed",
      message: "Operator provision route did not return JSON.",
    }))) as Record<string, unknown>;

    if (!response.ok) {
      setError(
        typeof payload.message === "string"
          ? payload.message
          : `Provisioning failed with status ${response.status}.`,
      );
    }

    setResult(toPrettyJson(payload));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      void submitProvision();
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="label">Operator token</span>
          <input
            className="field"
            type="password"
            value={form.operatorToken}
            onChange={(event) => patchForm("operatorToken", event.target.value)}
            placeholder="Matches OPERATOR_DASHBOARD_TOKEN"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="label">Product</span>
          <select
            className="field"
            value={form.productId}
            onChange={(event) => applyProductDefaults(event.target.value as ProductId)}
          >
            {catalog.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="label">Customer email</span>
          <input
            className="field"
            type="email"
            value={form.customerEmail}
            onChange={(event) => patchForm("customerEmail", event.target.value)}
            placeholder="customer@example.com"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="label">External reference</span>
          <input
            className="field"
            value={form.externalReference}
            onChange={(event) => patchForm("externalReference", event.target.value)}
            placeholder="order_1001"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="label">License type</span>
          <input
            className="field"
            value={form.licenseType}
            onChange={(event) => patchForm("licenseType", event.target.value)}
            required
          />
        </label>
        <label className="space-y-2">
          <span className="label">Machine limit</span>
          <input
            className="field"
            type="number"
            min="1"
            value={form.machineLimit}
            onChange={(event) => patchForm("machineLimit", event.target.value)}
            required
          />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="label">Offline grace days</span>
          <input
            className="field"
            type="number"
            min="1"
            value={form.offlineGraceDays}
            onChange={(event) => patchForm("offlineGraceDays", event.target.value)}
            required
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="button-primary" type="submit" disabled={!enabled || isPending}>
          {isPending ? "Provisioning..." : "Provision entitlement"}
        </button>
        <span className="text-sm text-[var(--muted)]">
          IDs are generated deterministically from product, email, and external reference.
        </span>
      </div>

      {error ? <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900">{error}</p> : null}
      {result ? (
        <pre className="panel overflow-x-auto px-4 py-4 text-sm text-[var(--foreground)]">
          {result}
        </pre>
      ) : null}
    </form>
  );
}

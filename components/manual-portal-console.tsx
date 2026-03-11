"use client";

import { useState, useTransition } from "react";
import type { ProductId } from "@/lib/catalog";

type PortalFormState = {
  productId: ProductId;
  entitlementId: string;
  machineId: string;
  machineHash: string;
};

type Operation = "activate" | "refresh" | "revoke";

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function ManualPortalConsole({ defaultProductId }: { defaultProductId: ProductId }) {
  const [form, setForm] = useState<PortalFormState>({
    productId: defaultProductId,
    entitlementId: "",
    machineId: "",
    machineHash: "",
  });
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<Operation | null>(null);
  const [isPending, startTransition] = useTransition();

  function patchForm<Key extends keyof PortalFormState>(key: Key, value: PortalFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function run(operation: Operation) {
    setLastAction(operation);
    setError(null);
    setResult("");

    const payload =
      operation === "activate"
        ? {
            entitlementId: form.entitlementId,
            productId: form.productId,
            machineHash: form.machineHash,
          }
        : operation === "refresh"
          ? {
              entitlementId: form.entitlementId,
              productId: form.productId,
              machineId: form.machineId,
              machineHash: form.machineHash,
            }
          : {
              entitlementId: form.entitlementId,
              machineId: form.machineId,
            };

    const response = await fetch(`/api/licensing/${operation}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => ({
      error: "request_failed",
      message: "Licensing route did not return JSON.",
    }))) as Record<string, unknown>;

    if (!response.ok) {
      setError(
        typeof body.message === "string"
          ? body.message
          : `The ${operation} request failed with status ${response.status}.`,
      );
      setResult(pretty(body));
      return;
    }

    const returnedMachineId = typeof body.machineId === "string" ? body.machineId : null;
    if (returnedMachineId) {
      setForm((current) => ({ ...current, machineId: returnedMachineId }));
    }

    setResult(pretty(body));
  }

  function handleOperation(operation: Operation) {
    startTransition(() => {
      void run(operation);
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="label">Product id</span>
          <input
            className="field"
            value={form.productId}
            onChange={(event) => patchForm("productId", event.target.value as ProductId)}
          />
        </label>
        <label className="space-y-2">
          <span className="label">Entitlement id</span>
          <input
            className="field"
            value={form.entitlementId}
            onChange={(event) => patchForm("entitlementId", event.target.value)}
            placeholder="ent_..."
          />
        </label>
        <label className="space-y-2">
          <span className="label">Machine id</span>
          <input
            className="field"
            value={form.machineId}
            onChange={(event) => patchForm("machineId", event.target.value)}
            placeholder="mach_..."
          />
        </label>
        <label className="space-y-2">
          <span className="label">Machine hash</span>
          <input
            className="field"
            value={form.machineHash}
            onChange={(event) => patchForm("machineHash", event.target.value)}
            placeholder="CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="button-primary"
          type="button"
          onClick={() => handleOperation("activate")}
          disabled={isPending}
        >
          {isPending && lastAction === "activate" ? "Activating..." : "Activate"}
        </button>
        <button
          className="button-secondary"
          type="button"
          onClick={() => handleOperation("refresh")}
          disabled={isPending}
        >
          {isPending && lastAction === "refresh" ? "Refreshing..." : "Refresh"}
        </button>
        <button
          className="button-secondary"
          type="button"
          onClick={() => handleOperation("revoke")}
          disabled={isPending}
        >
          {isPending && lastAction === "revoke" ? "Revoking..." : "Revoke"}
        </button>
      </div>

      {error ? <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900">{error}</p> : null}
      {result ? (
        <pre className="panel overflow-x-auto px-4 py-4 text-sm text-[var(--foreground)]">
          {result}
        </pre>
      ) : null}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ActiveMachine = {
  machineId: string;
  machineHash: string;
  activatedAt: string;
};

export function LicenseManagerRow({
  activeMachines,
  activationRequest,
  licenseId,
  machineLimit,
  productName,
}: {
  activeMachines: ActiveMachine[];
  activationRequest?: string;
  licenseId: string;
  machineLimit: number;
  productName: string;
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingKey, setPendingKey] = useState("");
  const [isPending, startTransition] = useTransition();

  function runActivate() {
    setErrorMessage("");

    if (!activationRequest) {
      window.alert(`Open ${productName} once on the target machine, then come back here and click Activate.`);
      return;
    }

    setPendingKey("activate");
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/account/licenses/${encodeURIComponent(licenseId)}/activate-device`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              activationRequest,
            }),
          },
        );

        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        if (!response.ok) {
          throw new Error(body?.message ?? "Activation failed.");
        }

        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Activation failed.");
      } finally {
        setPendingKey("");
      }
    });
  }

  function runDeactivate(machineId: string) {
    setErrorMessage("");
    setPendingKey(machineId);

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/account/licenses/${encodeURIComponent(licenseId)}/machines/${encodeURIComponent(machineId)}/deactivate`,
          {
            method: "POST",
          },
        );

        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        if (!response.ok) {
          throw new Error(body?.message ?? "Deactivation failed.");
        }

        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Deactivation failed.");
      } finally {
        setPendingKey("");
      }
    });
  }

  return (
    <article className="rounded-[20px] border border-black/8 bg-white/78 px-5 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-[var(--foreground)]">{productName}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {activeMachines.length} / {machineLimit} active
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="button-primary"
            disabled={isPending}
            onClick={runActivate}
            type="button"
          >
            {isPending && pendingKey === "activate" ? "Activating..." : "Activate"}
          </button>
        </div>
      </div>

      {activeMachines.length > 0 ? (
        <div className="mt-4 space-y-2 border-t border-black/8 pt-4">
          {activeMachines.map((machine) => (
            <div
              key={machine.machineId}
              className="flex flex-col gap-3 rounded-[16px] bg-[rgba(255,255,255,0.72)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm text-[var(--foreground)]">{machine.machineId}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Activated {new Date(machine.activatedAt).toLocaleString()}
                </p>
              </div>
              <button
                className="button-secondary"
                disabled={isPending}
                onClick={() => runDeactivate(machine.machineId)}
                type="button"
              >
                {isPending && pendingKey === machine.machineId ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </article>
  );
}

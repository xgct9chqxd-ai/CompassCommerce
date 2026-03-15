"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ActiveMachine = {
  machineId: string;
  machineHash: string;
  activatedAt: string;
};

export function LicenseSeatManager({
  licenseId,
  machineLimit,
  activeMachines,
  revokedMachineCount,
}: {
  licenseId: string;
  machineLimit: number;
  activeMachines: ActiveMachine[];
  revokedMachineCount: number;
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingMachineId, setPendingMachineId] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDeactivate(machineId: string) {
    setErrorMessage("");
    setSuccessMessage("");
    setPendingMachineId(machineId);

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/account/licenses/${encodeURIComponent(licenseId)}/machines/${encodeURIComponent(machineId)}/deactivate`,
          {
            method: "POST",
          },
        );

        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        if (!response.ok) {
          throw new Error(body?.message ?? "Device deactivation failed.");
        }

        setSuccessMessage(`Device ${machineId} was deactivated.`);
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Device deactivation failed.");
      } finally {
        setPendingMachineId("");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="rounded-full border border-black/8 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          {activeMachines.length} of {machineLimit} activations used
        </p>
        <p className="rounded-full border border-black/8 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          {revokedMachineCount} revoked
        </p>
      </div>

      {activeMachines.length === 0 ? (
        <p className="rounded-[20px] border border-black/8 bg-white/70 px-4 py-4 text-sm text-[var(--muted)]">
          No active devices are using this license right now.
        </p>
      ) : (
        <div className="space-y-3">
          {activeMachines.map((machine) => {
            const shortHash = `${machine.machineHash.slice(0, 8)}...${machine.machineHash.slice(-6)}`;
            const isBusy = isPending && pendingMachineId === machine.machineId;
            return (
              <article
                key={machine.machineId}
                className="grid gap-4 rounded-[22px] border border-black/8 bg-white/78 px-5 py-5 text-sm text-[var(--foreground)] lg:grid-cols-[1fr_1fr_auto]"
              >
                <div>
                  <p className="label">Device</p>
                  <p className="mt-2 font-mono text-sm">{machine.machineId}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">Hash {shortHash}</p>
                </div>
                <div>
                  <p className="label">Activated</p>
                  <p className="mt-2">{new Date(machine.activatedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center lg:justify-end">
                  <button
                    className="button-secondary w-full lg:w-auto"
                    disabled={isBusy}
                    onClick={() => handleDeactivate(machine.machineId)}
                    type="button"
                  >
                    {isBusy ? "Deactivating..." : "Deactivate"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {errorMessage ? (
        <p className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}
    </div>
  );
}

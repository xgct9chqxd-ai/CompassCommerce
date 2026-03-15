"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

function normalizeDeviceCode(value: string): string {
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  if (raw.length <= 4) {
    return raw;
  }

  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function LicenseDeviceActivationForm({
  licenseId,
  initialDeviceCode = "",
}: {
  licenseId: string;
  initialDeviceCode?: string;
}) {
  const router = useRouter();
  const [deviceCode, setDeviceCode] = useState(normalizeDeviceCode(initialDeviceCode));
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setErrorMessage("");
    setSuccessMessage("");

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
              deviceCode: normalizeDeviceCode(deviceCode),
            }),
          },
        );

        const body = (await response.json().catch(() => null)) as
          | { message?: string; machineId?: string }
          | null;
        if (!response.ok) {
          throw new Error(body?.message ?? "Device activation failed.");
        }

        setSuccessMessage(
          body?.machineId
            ? `Device activated. Return to the plugin and click Check Activation. Machine ID ${body.machineId}.`
            : "Device activated. Return to the plugin and click Check Activation.",
        );
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Device activation failed.");
      }
    });
  }

  return (
    <div className="rounded-[22px] border border-black/8 bg-white/78 px-5 py-5">
      <p className="label">Device code</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Open the plugin on the target machine, choose website activation, then enter the displayed
        8-character device code here.
      </p>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row">
        <input
          className="min-h-12 flex-1 rounded-[18px] border border-black/10 bg-white px-4 py-3 font-mono text-base tracking-[0.18em] text-[var(--foreground)] outline-none transition focus:border-black/30"
          inputMode="text"
          onChange={(event) => {
            setDeviceCode(normalizeDeviceCode(event.target.value));
          }}
          placeholder="ABCD-EFGH"
          value={deviceCode}
        />
        <button
          className="button-primary lg:min-w-48"
          disabled={isPending || normalizeDeviceCode(deviceCode).length !== 9}
          onClick={handleSubmit}
          type="button"
        >
          {isPending ? "Activating..." : "Activate this device"}
        </button>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}
    </div>
  );
}

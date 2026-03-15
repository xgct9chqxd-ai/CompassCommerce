"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function LicenseActivateDeviceButton({
  activationRequest,
  licenseId,
  label = "Activate",
  redirectHref,
}: {
  activationRequest: string;
  licenseId: string;
  label?: string;
  redirectHref?: string;
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleActivate() {
    setErrorMessage("");

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

        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        if (!response.ok) {
          throw new Error(body?.message ?? "Activation failed.");
        }

        if (redirectHref) {
          router.push(redirectHref);
          return;
        }

        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Activation failed.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        className="button-primary w-full lg:w-auto"
        disabled={isPending}
        onClick={handleActivate}
        type="button"
      >
        {isPending ? "Activating..." : label}
      </button>

      {errorMessage ? (
        <p className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

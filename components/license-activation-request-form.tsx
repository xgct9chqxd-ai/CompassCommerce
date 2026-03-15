"use client";

import { useMemo, useState } from "react";

type Props = {
  actionUrl: string;
  productName: string;
  licenseId: string;
};

function fileNameFromDisposition(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const match = /filename="([^"]+)"/i.exec(value);
  return match?.[1] ?? null;
}

export function LicenseActivationRequestForm({
  actionUrl,
  productName,
  licenseId,
}: Props) {
  const [activationRequestText, setActivationRequestText] = useState("");
  const [activationRequestFile, setActivationRequestFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => !submitting && (activationRequestText.trim().length > 0 || activationRequestFile !== null),
    [activationRequestFile, activationRequestText, submitting],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      if (activationRequestFile) {
        formData.set("activationRequestFile", activationRequestFile);
      }
      if (activationRequestText.trim()) {
        formData.set("activationRequestText", activationRequestText.trim());
      }

      const response = await fetch(actionUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? "Activation bundle download failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        fileNameFromDisposition(response.headers.get("Content-Disposition"))
        ?? `${licenseId}-ActivationBundle.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setSuccessMessage(
        `Activation bundle downloaded for ${productName}. Import it in the plugin to finish activation on this machine.`,
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Activation bundle download failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="label block" htmlFor="activationRequestFile">
          Upload activation request file
        </label>
        <input
          id="activationRequestFile"
          accept=".json,application/json,text/plain"
          className="block w-full rounded-[16px] border border-black/10 bg-white/85 px-4 py-3 text-sm text-[var(--foreground)] file:mr-4 file:rounded-[12px] file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--accent-contrast)]"
          onChange={(event) => setActivationRequestFile(event.target.files?.[0] ?? null)}
          type="file"
        />
      </div>

      <div className="space-y-2">
        <label className="label block" htmlFor="activationRequestText">
          Or paste activation request JSON
        </label>
        <textarea
          id="activationRequestText"
          className="min-h-48 w-full rounded-[18px] border border-black/10 bg-white/85 px-4 py-3 font-mono text-xs leading-6 text-[var(--foreground)] outline-none transition focus:border-black/30"
          onChange={(event) => setActivationRequestText(event.target.value)}
          placeholder='{"formatVersion":"1","requestType":"compass_activation_request_v1",...}'
          value={activationRequestText}
        />
      </div>

      <button className="button-primary" disabled={!canSubmit} type="submit">
        {submitting ? "Generating license file..." : "Download machine license"}
      </button>

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
    </form>
  );
}

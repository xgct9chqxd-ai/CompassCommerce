"use client";

import { useEffect, useState } from "react";

type HostnameStatus = "pending" | "verified";

type HealthPayload = {
  ok?: boolean;
  status?: string;
};

const pendingClassName =
  "hidden rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-[var(--muted)] sm:inline-flex";

const verifiedClassName =
  "hidden rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-emerald-950 sm:inline-flex";

async function readJson(response: Response): Promise<HealthPayload | null> {
  try {
    return (await response.json()) as HealthPayload;
  } catch {
    return null;
  }
}

async function checkPublicHostname(signal: AbortSignal): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_LICENSING_PUBLIC_BASE_URL?.trim();
  if (!baseUrl) {
    return false;
  }

  const response = await fetch(`${baseUrl}/health/ready`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    return false;
  }

  const payload = await readJson(response);
  return payload?.status === "ready";
}

async function checkSameOriginProxy(signal: AbortSignal): Promise<boolean> {
  const response = await fetch("/api/licensing/health", {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    return false;
  }

  const payload = await readJson(response);
  return payload?.ok === true || payload?.status === "ready";
}

export function HostnameBadge() {
  const [status, setStatus] = useState<HostnameStatus>("pending");

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 3000);
    let active = true;

    async function verifyHostname() {
      try {
        const publicResult = await checkPublicHostname(controller.signal);
        if (!active) {
          return;
        }

        if (publicResult) {
          setStatus("verified");
          return;
        }
      } catch {
        // Fall through to the same-origin proxy check.
      }

      try {
        const proxyResult = await checkSameOriginProxy(controller.signal);
        if (!active) {
          return;
        }

        setStatus(proxyResult ? "verified" : "pending");
      } catch {
        if (!active) {
          return;
        }

        setStatus("pending");
      }
    }

    void verifyHostname();

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return (
    <span className={status === "verified" ? verifiedClassName : pendingClassName}>
      {status === "verified" ? "Hostname verified" : "Hostname pending"}
    </span>
  );
}

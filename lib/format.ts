import { getProduct } from "@/lib/catalog";

export function formatMoney(amountCents: number | null, currency: string | null): string {
  if (amountCents == null || !currency) {
    return "Unavailable";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export function formatDate(value: string | null): string {
  if (!value) {
    return "Unavailable";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatProductName(productId: string): string {
  return getProduct(productId)?.name ?? productId;
}

export function formatPlatformLabel(platform: string): string {
  const normalized = platform.trim().toLowerCase();
  switch (normalized) {
    case "mac":
    case "macos":
    case "osx":
      return "macOS";
    case "win":
    case "windows":
      return "Windows";
    case "linux":
      return "Linux";
    default:
      return platform;
  }
}

export function formatDownloadAction(platform: string): string {
  return `Download for ${formatPlatformLabel(platform)}`;
}

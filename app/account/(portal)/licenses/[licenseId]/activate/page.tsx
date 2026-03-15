import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountLicenseActivationRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ licenseId: string }>;
  searchParams: Promise<{ deviceCode?: string }>;
}) {
  const { licenseId } = await params;
  const { deviceCode = "" } = await searchParams;
  const target = deviceCode
    ? `/account/licenses/${encodeURIComponent(licenseId)}?deviceCode=${encodeURIComponent(deviceCode)}`
    : `/account/licenses/${encodeURIComponent(licenseId)}`;

  redirect(target);
}

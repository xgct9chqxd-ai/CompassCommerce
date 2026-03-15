import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountLicenseActivationRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ licenseId: string }>;
  searchParams: Promise<{ activationRequest?: string }>;
}) {
  const { licenseId } = await params;
  const { activationRequest = "" } = await searchParams;
  const target = activationRequest
    ? `/account/licenses/${encodeURIComponent(licenseId)}?activationRequest=${encodeURIComponent(activationRequest)}`
    : `/account/licenses/${encodeURIComponent(licenseId)}`;

  redirect(target);
}

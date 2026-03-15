import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountLicenseDetailRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ activationRequest?: string }>;
}) {
  const { activationRequest = "" } = await searchParams;
  const target = activationRequest
    ? `/account/licenses?activationRequest=${encodeURIComponent(activationRequest)}`
    : "/account/licenses";

  redirect(target);
}

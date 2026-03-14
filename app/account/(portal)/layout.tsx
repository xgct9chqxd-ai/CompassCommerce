import { AccountShell } from "@/components/account-shell";
import { requireAuthenticatedUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default async function AccountPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuthenticatedUser("/account");

  return (
    <AccountShell email={user.email ?? "unknown"}>
      {children}
    </AccountShell>
  );
}

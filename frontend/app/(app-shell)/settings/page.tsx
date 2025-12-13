import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/session";
import { AccountSettings } from "@/components/settings/account-settings";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirect=/settings");

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" subtitle="Atualize seu email e senha com segurança." />
      <AccountSettings user={{ email: user.email, name: user.name ?? "" }} />
    </div>
  );
}

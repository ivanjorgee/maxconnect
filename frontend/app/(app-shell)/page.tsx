import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "@/lib/data";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { requirePageAuth } from "@/lib/requirePageAuth";

export default async function DashboardPage() {
  await requirePageAuth("/");
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão geral"
        subtitle="O que fazer hoje, leads quentes e progresso de fechamentos."
        actions={
          <Link
            href="/leads?filter=session"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/60 bg-primary px-3 py-2 text-sm font-semibold text-foreground shadow-glow-primary transition hover:bg-primary/90"
          >
            Iniciar sessão de prospecção
            <ArrowUpRight size={16} />
          </Link>
        }
      />

      <DashboardClient data={data} />
    </div>
  );
}

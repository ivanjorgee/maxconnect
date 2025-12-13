import { getEmpresas } from "@/lib/data";
import { PageHeader } from "@/components/layout/page-header";
import LeadsClient from "@/components/leads/leads-client";
import { requirePageAuth } from "@/lib/requirePageAuth";

export default async function LeadsPage({ searchParams }: { searchParams?: { filter?: string } }) {
  await requirePageAuth("/leads");
  const empresas = await getEmpresas();

  return (
    <div className="space-y-6">
      <PageHeader title="Leads" subtitle="Pipeline de empresas em prospecção." />
      <LeadsClient empresas={empresas} startSession={searchParams?.filter === "session"} filter={searchParams?.filter} />
    </div>
  );
}

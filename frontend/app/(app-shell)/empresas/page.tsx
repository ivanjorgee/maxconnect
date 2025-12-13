import { OrigemLead, StatusFunil, TipoSite } from "@prisma/client";
import { PageHeader } from "@/components/layout/page-header";
import { CompaniesTable } from "@/components/companies/companies-table";
import { CompaniesControls } from "@/components/companies/companies-controls";
import { getEmpresas } from "@/lib/data";
import { requirePageAuth } from "@/lib/requirePageAuth";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: {
    status?: StatusFunil;
    cidade?: string;
    origemLead?: OrigemLead;
    tipoSite?: TipoSite;
    temSite?: string;
    q?: string;
    action?: string;
    followup1Pending?: string;
  };
}) {
  await requirePageAuth("/empresas");
  const temSite =
    typeof searchParams.temSite === "string" ? (searchParams.temSite === "true" ? true : searchParams.temSite === "false" ? false : null) : null;

  const companies = await getEmpresas({
    status: searchParams.status ?? null,
    cidade: searchParams.cidade ?? null,
    origemLead: searchParams.origemLead ?? null,
    tipoSite: searchParams.tipoSite ?? null,
    temSite,
    busca: searchParams.q ?? null,
    action: searchParams.action ?? null,
    followup1Pending: searchParams.followup1Pending === "true",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        subtitle="Base completa de clínicas, studios e leads captados. Use esta tela para cadastrar, filtrar e revisar contexto."
        actions={
          <CompaniesControls
            initialFilters={{
              q: searchParams.q,
              status: searchParams.status ?? "",
              cidade: searchParams.cidade,
              origemLead: searchParams.origemLead ?? "",
              tipoSite: searchParams.tipoSite ?? "",
              temSite: searchParams.temSite,
              followup1Pending: searchParams.followup1Pending,
              action: searchParams.action,
            }}
          />
        }
      />

      <CompaniesTable companies={companies} />
    </div>
  );
}

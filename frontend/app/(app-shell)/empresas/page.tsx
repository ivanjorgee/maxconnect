import { OrigemLead, StatusFunil, TipoSite } from "@prisma/client";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { CompaniesTable } from "@/components/companies/companies-table";
import { CompaniesControls } from "@/components/companies/companies-controls";
import { getEmpresasPage } from "@/lib/data";
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
    contato?: string;
    q?: string;
    action?: string;
    followup1Pending?: string;
    page?: string;
    pageSize?: string;
  };
}) {
  await requirePageAuth("/empresas");
  const temSite =
    typeof searchParams.temSite === "string" ? (searchParams.temSite === "true" ? true : searchParams.temSite === "false" ? false : null) : null;

  const normalizedAction: "none" | "today" | "overdue" | null =
    searchParams.action === "none" || searchParams.action === "today" || searchParams.action === "overdue"
      ? searchParams.action
      : null;

  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSize = Math.min(200, Math.max(10, Number(searchParams.pageSize) || 50));

  const companies = await getEmpresasPage(
    {
      status: searchParams.status ?? null,
      cidade: searchParams.cidade ?? null,
      origemLead: searchParams.origemLead ?? null,
      tipoSite: searchParams.tipoSite ?? null,
      temSite,
      contato: searchParams.contato ?? null,
      busca: searchParams.q ?? null,
      action: normalizedAction,
      followup1Pending: searchParams.followup1Pending === "true",
    },
    { page, pageSize },
  );

  const totalPages = companies.pageCount || 1;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const baseParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (!value || key === "page" || key === "pageSize") return;
    baseParams.set(key, value);
  });
  baseParams.set("pageSize", pageSize.toString());

  const pageHref = (target: number) => {
    const params = new URLSearchParams(baseParams);
    params.set("page", target.toString());
    return `/empresas?${params.toString()}`;
  };

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
              contato: searchParams.contato,
              origemLead: searchParams.origemLead ?? "",
              tipoSite: searchParams.tipoSite ?? "",
              temSite: searchParams.temSite,
              followup1Pending: searchParams.followup1Pending,
              action: searchParams.action,
            }}
          />
        }
      />

      <CompaniesTable companies={companies.items} />
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span>
          Mostrando {companies.items.length} de {companies.total} empresas
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={pageHref(Math.max(1, page - 1))}
            aria-disabled={!hasPrev}
            className={`rounded-md border px-3 py-1 ${hasPrev ? "border-stroke/60 hover:text-foreground" : "border-stroke/30 text-muted/50 pointer-events-none"}`}
          >
            Anterior
          </Link>
          <span>
            Página {page} de {totalPages || 1}
          </span>
          <Link
            href={pageHref(Math.min(totalPages, page + 1))}
            aria-disabled={!hasNext}
            className={`rounded-md border px-3 py-1 ${hasNext ? "border-stroke/60 hover:text-foreground" : "border-stroke/30 text-muted/50 pointer-events-none"}`}
          >
            Próxima
          </Link>
        </div>
      </div>
    </div>
  );
}

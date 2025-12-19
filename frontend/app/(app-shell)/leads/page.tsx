import { OrigemLead, StatusFunil, TipoSite } from "@prisma/client";
import Link from "next/link";
import { getEmpresasPage, getStatusCounts } from "@/lib/data";
import { PageHeader } from "@/components/layout/page-header";
import LeadsClient from "@/components/leads/leads-client";
import { requirePageAuth } from "@/lib/requirePageAuth";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: {
    filter?: string;
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
  await requirePageAuth("/leads");
  const params = searchParams ?? {};
  const temSite =
    typeof params.temSite === "string" ? (params.temSite === "true" ? true : params.temSite === "false" ? false : null) : null;
  const normalizedAction: "none" | "today" | "overdue" | null =
    params.action === "none" || params.action === "today" || params.action === "overdue" ? params.action : null;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(200, Math.max(10, Number(params.pageSize) || 50));

  const [empresas, statusCounts] = await Promise.all([
    getEmpresasPage(
      {
        status: params.status ?? null,
        cidade: params.cidade ?? null,
        origemLead: params.origemLead ?? null,
        tipoSite: params.tipoSite ?? null,
        temSite,
        contato: params.contato ?? null,
        busca: params.q ?? null,
        action: normalizedAction,
        followup1Pending: params.followup1Pending === "true",
      },
      { page, pageSize },
    ),
    getStatusCounts(),
  ]);

  const totalPages = empresas.pageCount || 1;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const baseParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (!value || key === "page" || key === "pageSize") return;
    baseParams.set(key, value);
  });
  baseParams.set("pageSize", pageSize.toString());

  const pageHref = (target: number) => {
    const query = new URLSearchParams(baseParams);
    query.set("page", target.toString());
    return `/leads?${query.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Leads" subtitle="Pipeline de empresas em prospecção." />
      <LeadsClient
        empresas={empresas.items}
        statusCounts={statusCounts}
        startSession={params.filter === "session"}
        filter={params.filter}
      />
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span>
          Mostrando {empresas.items.length} de {empresas.total} leads
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

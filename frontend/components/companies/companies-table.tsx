import { Building2, Link as LinkIcon, MapPin } from "lucide-react";
import Link from "next/link";
import { EmpresaWithInteracoes } from "@/lib/data";
import { canalLabels, tipoSiteLabels } from "@/lib/dictionaries";
import { formatDate, formatRelative } from "@/lib/utils";
import { LeadStatusBadge } from "../leads/lead-status-badge";
import { DataTable } from "../table/data-table";

export function CompaniesTable({ companies }: { companies: EmpresaWithInteracoes[] }) {
  return (
    <>
      <div className="hidden md:block">
        <DataTable
          data={companies}
          emptyState={<p className="text-sm text-muted">Cadastre empresas para organizar contatos.</p>}
          columns={[
            {
              header: "Empresa",
              cell: (company) => (
                <Link href={`/empresas/${company.id}`} className="flex items-center gap-3 hover:text-primary">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{company.nome}</p>
                    <p className="text-xs text-muted">{company.especialidadePrincipal ?? "Segmento não informado"}</p>
                  </div>
                </Link>
              ),
            },
            {
              header: "Cidade",
              cell: (company) => (
                <p className="flex items-center gap-1 text-xs text-muted">
                  <MapPin size={14} />
                  {company.cidade ?? "—"}
                </p>
              ),
            },
            {
              header: "Canal",
              cell: (company) => <span className="text-sm text-muted">{canalLabels[company.canalPrincipal]}</span>,
            },
            {
              header: "Status",
              cell: (company) => <LeadStatusBadge status={company.statusFunil} />,
            },
            {
              header: "Modelo",
              cell: (company) => <span className="text-sm text-muted">{company.modeloAbertura ?? "—"}</span>,
            },
            {
              header: "Site",
              cell: (company) =>
                company.temSite && company.website ? (
                  <div className="space-y-1">
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <LinkIcon size={14} /> {company.website.replace(/^https?:\/\//, "")}
                    </a>
                    <p className="text-[10px] text-muted">{tipoSiteLabels[company.tipoSite]}</p>
                  </div>
                ) : (
                  <span className="rounded-full bg-background-elevated px-2 py-1 text-[11px] text-muted">Sem site</span>
                ),
            },
            {
              header: "Última interação",
              cell: (company) => (
                <span className="text-xs text-muted">
                  {company.interacoes.length ? formatRelative(company.interacoes[0].data) : formatDate(company.updatedAt)}
                </span>
              ),
            },
            {
              header: "Próxima ação",
              cell: (company) => (
                <span className="flex items-center gap-1 text-xs text-muted">
                  {nextAction(company)}
                  {isFollowup1Pending(company) ? (
                    <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] text-amber-100">F1 pendente</span>
                  ) : null}
                </span>
              ),
            },
            {
              header: "Criada",
              align: "right",
              cell: (company) => <span className="text-xs text-muted">{formatDate(company.createdAt)}</span>,
            },
          ]}
        />
      </div>

      <div className="space-y-3 md:hidden">
        {companies.length === 0 ? (
          <div className="card p-6 text-center text-muted">Cadastre empresas para organizar contatos.</div>
        ) : (
          companies.map((company) => (
            <div key={company.id} className="card card-hover flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/empresas/${company.id}`} className="text-base font-semibold text-foreground hover:text-primary break-words">
                    {company.nome}
                  </Link>
                  <p className="text-xs text-muted break-words">{company.especialidadePrincipal ?? "Segmento não informado"}</p>
                </div>
                <LeadStatusBadge status={company.statusFunil} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {company.cidade ?? "Sem cidade"}
                </span>
                <span className="rounded-full bg-background-elevated px-2 py-1 text-[11px]">{canalLabels[company.canalPrincipal]}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                <span>Última: {company.interacoes.length ? formatRelative(company.interacoes[0].data) : formatDate(company.updatedAt)}</span>
                <span>Próxima: {nextAction(company)}</span>
              </div>
              <Link
                href={`/empresas/${company.id}`}
                className="inline-flex w-full items-center justify-center rounded-lg border border-primary/60 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
              >
                Abrir
              </Link>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function nextAction(company: EmpresaWithInteracoes) {
  if (company.statusFunil === "NOVO") {
    return company.proximaAcao || "Fazer primeiro contato";
  }
  if (company.proximaAcao && company.proximaAcaoData) {
    return `${company.proximaAcao} • ${formatRelative(company.proximaAcaoData)}`;
  }
  const entries: Array<{ label: string; date: Date }> = [];
  if (company.dataFollowup1) entries.push({ label: "Follow-up 1", date: new Date(company.dataFollowup1) });
  if (company.dataFollowup2) entries.push({ label: "Follow-up 2", date: new Date(company.dataFollowup2) });
  if (company.dataReuniao) entries.push({ label: "Reunião", date: new Date(company.dataReuniao) });
  if (!entries.length) return "Sem ação definida";
  const nearest = entries.sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  return `${nearest.label} • ${formatRelative(nearest.date)}`;
}

function isFollowup1Pending(company: EmpresaWithInteracoes) {
  const limit = Date.now() - 24 * 60 * 60 * 1000;
  const lastInteraction = company.interacoes[0];
  const lastIsM1 = lastInteraction?.tipo === "MENSAGEM_1";
  const lastIsOlder = lastInteraction ? new Date(lastInteraction.data).getTime() <= limit : false;
  const noAction = !company.proximaAcao;
  return company.statusFunil === "MENSAGEM_1_ENVIADA" && lastIsM1 && lastIsOlder && noAction;
}

import Link from "next/link";
import { EmpresaWithInteracoes } from "@/lib/data";
import { canalLabels, origemLabels, statusLabels } from "@/lib/dictionaries";
import { formatDate } from "@/lib/utils";
import { LeadStatusBadge } from "./lead-status-badge";
import { DataTable } from "../table/data-table";

export function LeadsTable({ leads, onSelect }: { leads: EmpresaWithInteracoes[]; onSelect?: (lead: EmpresaWithInteracoes) => void }) {
  return (
    <DataTable
      data={leads}
      emptyState={<p className="text-sm text-muted">Cadastre empresas para acompanhar a prospecção.</p>}
      columns={[
        {
          header: "Empresa",
          cell: (lead) => (
            <div className="flex flex-col gap-1" onClick={() => onSelect?.(lead)}>
              <Link href={`/empresas/${lead.id}`} className="text-sm font-semibold text-primary hover:underline">
                {lead.nome}
              </Link>
              <span className="text-xs text-muted">{lead.cidade}</span>
            </div>
          ),
        },
        {
          header: "Status",
          cell: (lead) => (
            <div className="flex flex-col gap-1">
              <LeadStatusBadge status={lead.statusFunil} />
              <span className="text-xs text-muted">{statusLabels[lead.statusFunil]}</span>
            </div>
          ),
        },
        {
          header: "Origem / Canal",
          cell: (lead) => (
            <div className="text-sm text-muted">
              {origemLabels[lead.origemLead]} • {canalLabels[lead.canalPrincipal]}
            </div>
          ),
        },
        {
          header: "Modelo",
          cell: (lead) => <span className="text-sm text-muted">{lead.modeloAbertura ?? "—"}</span>,
        },
        {
          header: "Atualizado",
          align: "right",
          cell: (lead) => <span className="text-xs text-muted">{formatDate(lead.updatedAt)}</span>,
        },
      ]}
    />
  );
}

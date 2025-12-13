'use client';

import Link from "next/link";
import { MapPin } from "lucide-react";
import { EmpresaWithInteracoes } from "@/lib/data";
import { canalLabels } from "@/lib/dictionaries";
import { formatRelative } from "@/lib/utils";
import { LeadsTable } from "./leads-table";
import { LeadStatusBadge } from "./lead-status-badge";

export function LeadsList({ leads, onSelect }: { leads: EmpresaWithInteracoes[]; onSelect: (lead: EmpresaWithInteracoes) => void }) {
  if (!leads.length) {
    return <div className="card p-6 text-center text-muted">Nenhum lead encontrado.</div>;
  }

  return (
    <>
      <div className="hidden md:block card card-hover p-4">
        <div className="max-h-[70vh] overflow-auto">
          <LeadsTable leads={leads} onSelect={onSelect} />
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {leads.map((lead) => (
          <Link
            href={`/empresas/${lead.id}`}
            key={lead.id}
            className="card card-hover flex flex-col gap-2 p-3"
            onClick={() => onSelect(lead)}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-foreground break-words">{lead.nome}</p>
                <p className="text-xs text-muted break-words">{lead.especialidadePrincipal ?? "Segmento não informado"}</p>
              </div>
              <LeadStatusBadge status={lead.statusFunil} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {lead.cidade ?? "Sem cidade"}
              </span>
              <span className="rounded-full bg-background-elevated px-2 py-1 text-[10px]">{canalLabels[lead.canalPrincipal]}</span>
              {lead.modeloAbertura ? (
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">{lead.modeloAbertura}</span>
              ) : null}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>Última: {lead.interacoes[0] ? formatRelative(lead.interacoes[0].data) : formatRelative(lead.updatedAt)}</span>
              <span className="text-right">Próxima: {lead.proximaAcao ?? "—"}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

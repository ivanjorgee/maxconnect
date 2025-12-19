'use client';

import Link from "next/link";
import { MapPin } from "lucide-react";
import type { EmpresaWithInteracoes } from "@/lib/data";
import { canalLabels, origemLabels, statusLabels } from "@/lib/dictionaries";
import { formatDate, formatRelative } from "@/lib/utils";
import { LeadsTable } from "./leads-table";
import { LeadStatusBadge } from "./lead-status-badge";
import { VirtualList } from "@/components/ui/virtual-list";

export function LeadsList({ leads, onSelect }: { leads: EmpresaWithInteracoes[]; onSelect: (lead: EmpresaWithInteracoes) => void }) {
  if (!leads.length) {
    return <div className="card p-6 text-center text-muted">Nenhum lead encontrado.</div>;
  }

  const useVirtual = leads.length > 200;

  return (
    <>
      <div className="hidden md:block card card-hover p-4">
        {useVirtual ? (
          <div className="rounded-lg border border-stroke/60 overflow-hidden">
            <div className="grid grid-cols-[2.2fr_1.1fr_1.3fr_0.7fr_0.7fr] gap-4 bg-background-elevated px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
              <span>Empresa</span>
              <span>Status</span>
              <span>Origem / Canal</span>
              <span>Modelo</span>
              <span className="text-right">Atualizado</span>
            </div>
            <VirtualList
              items={leads}
              height="70vh"
              itemHeight={72}
              getKey={(lead) => lead.id}
              className="bg-background"
              renderItem={(lead) => <LeadRow lead={lead} onSelect={onSelect} />}
            />
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-auto">
            <LeadsTable leads={leads} onSelect={onSelect} />
          </div>
        )}
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

function LeadRow({ lead, onSelect }: { lead: EmpresaWithInteracoes; onSelect: (lead: EmpresaWithInteracoes) => void }) {
  return (
    <div
      className="grid h-full grid-cols-[2.2fr_1.1fr_1.3fr_0.7fr_0.7fr] items-center gap-4 border-b border-stroke/60 px-4 py-3 text-sm text-foreground/90 hover:bg-background-elevated/60"
      onClick={() => onSelect(lead)}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <Link href={`/empresas/${lead.id}`} className="truncate text-sm font-semibold text-primary hover:underline">
          {lead.nome}
        </Link>
        <span className="truncate text-xs text-muted">{lead.cidade}</span>
      </div>
      <div className="flex flex-col gap-1">
        <LeadStatusBadge status={lead.statusFunil} />
        <span className="text-xs text-muted">{statusLabels[lead.statusFunil]}</span>
      </div>
      <div className="truncate text-sm text-muted">
        {origemLabels[lead.origemLead]} • {canalLabels[lead.canalPrincipal]}
      </div>
      <span className="text-sm text-muted">{lead.modeloAbertura ?? "—"}</span>
      <span className="text-xs text-muted text-right">{formatDate(lead.updatedAt)}</span>
    </div>
  );
}

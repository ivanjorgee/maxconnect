'use client';

import Link from "next/link";
import { MapPin } from "lucide-react";
import { StatusFunil } from "@prisma/client";
import { EmpresaWithInteracoes } from "@/lib/data";
import { canalLabels, statusLabels } from "@/lib/dictionaries";
import { formatRelative } from "@/lib/utils";
import { LeadStatusBadge } from "./lead-status-badge";

type Props = {
  leads: EmpresaWithInteracoes[];
};

const order: StatusFunil[] = [
  StatusFunil.NOVO,
  StatusFunil.MENSAGEM_1_ENVIADA,
  StatusFunil.RESPONDEU,
  StatusFunil.EM_CONVERSA,
  StatusFunil.REUNIAO_AGENDADA,
  StatusFunil.REUNIAO_REALIZADA,
  StatusFunil.PROPOSTA_ENVIADA,
  StatusFunil.FOLLOWUP_LONGO,
  StatusFunil.FECHADO,
  StatusFunil.PERDIDO,
];

export function LeadsMobile({ leads }: Props) {
  const grouped = order.map((status) => ({
    status,
    items: leads.filter((lead) => lead.statusFunil === status),
  }));

  return (
    <div className="space-y-3">
      {grouped.map(({ status, items }) => {
        if (!items.length) return null;
        return (
          <details key={status} className="overflow-hidden rounded-xl border border-stroke/60 bg-background-elevated/60">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-foreground">
              <span className="flex items-center gap-2">
                {statusLabels[status]}
                <span className="rounded-full bg-background px-2 py-1 text-xs text-muted">{items.length}</span>
              </span>
              <LeadStatusBadge status={status} />
            </summary>
            <div className="divide-y divide-stroke/60">
              {items.map((lead) => (
                <Link
                  href={`/empresas/${lead.id}`}
                  key={lead.id}
                  className="block p-3 hover:bg-background/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-foreground break-words">{lead.nome}</p>
                      <p className="text-[11px] text-muted break-words">{lead.especialidadePrincipal ?? "Segmento não informado"}</p>
                    </div>
                    {lead.modeloAbertura ? (
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">{lead.modeloAbertura}</span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {lead.cidade ?? "Sem cidade"}
                    </span>
                    <span className="rounded-full bg-background px-2 py-1 text-[10px]">{canalLabels[lead.canalPrincipal]}</span>
                    <span className="rounded-full bg-background px-2 py-1 text-[10px]">{statusLabels[lead.statusFunil]}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
                    <span>Última: {lead.interacoes[0] ? formatRelative(lead.interacoes[0].data) : formatRelative(lead.updatedAt)}</span>
                    <span>Próxima: {lead.proximaAcao ?? "—"}</span>
                  </div>
                </Link>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

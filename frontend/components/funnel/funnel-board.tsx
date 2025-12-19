'use client';

import { useMemo } from "react";
import { StatusFunil } from "@prisma/client";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { cn, formatRelative, isToday } from "@/lib/utils";
import type { EmpresaWithInteracoes } from "@/lib/data";
import { canalLabels, statusLabels } from "@/lib/dictionaries";
import { Button } from "../ui/button";

type Props = {
  empresas: EmpresaWithInteracoes[];
  statusFilter: StatusFunil | null;
  onAddInteracao: (empresaId: string) => void;
  onAvancar: (empresaId: string) => void;
  onSelectLead?: (empresa: EmpresaWithInteracoes) => void;
};

const stages: StatusFunil[] = [
  StatusFunil.NOVO,
  StatusFunil.MENSAGEM_1_ENVIADA,
  StatusFunil.EM_CONVERSA,
  StatusFunil.REUNIAO_AGENDADA,
  StatusFunil.PROPOSTA_ENVIADA,
  StatusFunil.FOLLOWUP_LONGO,
  StatusFunil.FECHADO,
  StatusFunil.PERDIDO,
];

export function FunnelBoard({ empresas, statusFilter, onAddInteracao, onAvancar, onSelectLead }: Props) {
  const grouped = useMemo(() => {
    const base: Record<StatusFunil, EmpresaWithInteracoes[]> = stages.reduce(
      (acc, status) => ({ ...acc, [status]: [] }),
      {} as Record<StatusFunil, EmpresaWithInteracoes[]>,
    );
    empresas.forEach((empresa) => {
      if (statusFilter && empresa.statusFunil !== statusFilter) return;
      base[empresa.statusFunil].push(empresa);
    });
    stages.forEach((status) => {
      base[status] = base[status].sort((a, b) => {
        const lastA = a.interacoes[0]?.data ? new Date(a.interacoes[0].data) : new Date(a.updatedAt);
        const lastB = b.interacoes[0]?.data ? new Date(b.interacoes[0].data) : new Date(b.updatedAt);
        return lastA.getTime() - lastB.getTime(); // mais tempo sem contato primeiro
      });
    });
    return base;
  }, [empresas, statusFilter]);

  return (
    <div className="grid auto-cols-[88vw] grid-flow-col gap-3 overflow-x-auto snap-x snap-mandatory sm:auto-cols-[320px]">
      {stages.map((stage) => {
        const faded = statusFilter && stage !== statusFilter;
        const items = grouped[stage] ?? [];
        return (
          <div
            key={stage}
            className={cn(
              "card card-hover flex min-w-[260px] flex-col gap-3 p-3 transition snap-start",
              faded && "opacity-60",
              statusFilter === stage && "border-primary/60 shadow-glow-primary",
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">{statusLabels[stage]}</p>
                <p className="text-xs text-muted">{items.length} empresa(s)</p>
              </div>
              <LeadStatusBadge status={stage} />
            </div>

            <div className="thin-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto max-h-[70vh]">
              {items.length ? (
                items.map((empresa) => (
                  <div
                    key={empresa.id}
                    className="rounded-lg border border-stroke/60 bg-background-elevated p-3"
                    onClick={() => onSelectLead?.(empresa)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground break-words">{empresa.nome}</p>
                        <p className="text-xs text-muted">
                          {empresa.cidade ?? "Sem cidade"} • {canalLabels[empresa.canalPrincipal]}
                        </p>
                      </div>
                      {empresa.modeloAbertura ? (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                          {empresa.modeloAbertura}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                      <span className="flex items-center gap-1">
                        Última: {formatRelative(empresa.interacoes[0]?.data ?? empresa.updatedAt)}
                        {renderAgendaBadge(empresa)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="h-9 px-2 py-1 text-[11px]" onClick={() => onAddInteracao(empresa.id)}>
                          + Interação
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 px-2 py-1 text-[11px]" onClick={() => onAvancar(empresa.id)}>
                          Avançar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted">Sem empresas neste estágio.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderAgendaBadge(empresa: EmpresaWithInteracoes) {
  const dates = (empresa.proximaAcaoData
    ? [empresa.proximaAcaoData]
    : [empresa.dataFollowup1, empresa.dataFollowup2, empresa.dataReuniao]
  ).filter(Boolean) as Date[];
  if (!dates.length) return null;
  const nearest = dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
  const overdue = nearest.getTime() < Date.now() && !isToday(nearest);
  const today = isToday(nearest);
  const limit = Date.now() - 24 * 60 * 60 * 1000;
  const last = empresa.interacoes[0];
  const conversaPending =
    empresa.statusFunil === StatusFunil.EM_CONVERSA && last && new Date(last.data).getTime() <= limit && !empresa.dataReuniao && !empresa.proximaAcao;
  if (conversaPending) {
    return <span className="ml-1 rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] text-amber-100">24h+ sem contato</span>;
  }
  if (overdue) {
    return <span className="ml-1 rounded-full bg-red-900/50 px-2 py-0.5 text-[10px] text-red-100">Atrasado</span>;
  }
  if (today) {
    return <span className="ml-1 rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] text-amber-100">Hoje</span>;
  }
  return null;
}

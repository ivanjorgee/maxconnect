"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusFunil } from "@prisma/client";
import { FunnelBoard } from "@/components/funnel/funnel-board";
import { StatusFilterBar } from "@/components/dashboard/status-filter-bar";
import type { EmpresaWithInteracoes } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { isToday, isPast } from "@/lib/utils";
import { ProspeccaoSession } from "./prospeccao-session";
import { LeadsList } from "./leads-list";
import { LeadDetailPanel } from "./lead-detail-panel";
import { LeadsMobile } from "./leads-mobile";
import { isConversaPending, isFollowup1Pending } from "@/lib/followup-rules";

type QuickFilter = "all" | "today" | "overdue";

export default function LeadsClient({
  empresas,
  statusCounts,
  startSession = false,
  filter,
}: {
  empresas: EmpresaWithInteracoes[];
  statusCounts?: Record<StatusFunil, number>;
  startSession?: boolean;
  filter?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFunil | null>(null);
  const [quick, setQuick] = useState<QuickFilter>("all");
  const [sessionOpen, setSessionOpen] = useState(startSession);
  const [view, setView] = useState<"funnel" | "list">("funnel");
  const [followupPending, setFollowupPending] = useState(false);
  const [conversaPending, setConversaPending] = useState(filter === "conversa");
  const [selectedLead, setSelectedLead] = useState<EmpresaWithInteracoes | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = () => {
      setIsMobile(mq.matches);
      if (mq.matches) {
        setView("list");
      }
    };
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const filtered = useMemo(() => {
    return empresas.filter((empresa) => {
      if (statusFilter && empresa.statusFunil !== statusFilter) return false;
      if (quick === "today") {
        const dates = (empresa.proximaAcaoData
          ? [empresa.proximaAcaoData]
          : [empresa.dataFollowup1, empresa.dataFollowup2, empresa.dataReuniao]
        ).filter(Boolean) as Date[];
        return dates.some((d) => isToday(d));
      }
      if (quick === "overdue") {
        const dates = (empresa.proximaAcaoData
          ? [empresa.proximaAcaoData]
          : [empresa.dataFollowup1, empresa.dataFollowup2, empresa.dataReuniao]
        ).filter(Boolean) as Date[];
        return dates.some((d) => isPast(d) && !isToday(d));
      }
      if (followupPending) {
        if (!isFollowup1Pending(empresa)) {
          return false;
        }
      }
      if (conversaPending) {
        if (!isConversaPending(empresa)) {
          return false;
        }
      }
      return true;
    });
  }, [empresas, quick, statusFilter, followupPending, conversaPending]);

  const counts =
    statusCounts ??
    empresas.reduce((acc, empresa) => {
      acc[empresa.statusFunil] = (acc[empresa.statusFunil] ?? 0) + 1;
      return acc;
    }, {} as Record<StatusFunil, number>);

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[2fr_1fr] lg:gap-4">
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <StatusFilterBar counts={counts} selected={statusFilter} onSelect={setStatusFilter} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-nowrap gap-2 overflow-x-auto">
              <Button
                variant={quick === "today" ? "primary" : "outline"}
                size="sm"
                onClick={() => setQuick(quick === "today" ? "all" : "today")}
              >
                Hoje
              </Button>
              <Button
                variant={quick === "overdue" ? "primary" : "outline"}
                size="sm"
                onClick={() => setQuick(quick === "overdue" ? "all" : "overdue")}
              >
                Atrasados
              </Button>
              <Button variant={sessionOpen ? "primary" : "outline"} size="sm" onClick={() => setSessionOpen(true)}>
                Iniciar sessão
              </Button>
              <Button
                variant={followupPending ? "primary" : "outline"}
                size="sm"
                onClick={() => setFollowupPending((prev) => !prev)}
              >
                F1 pendentes
              </Button>
              <Button
                variant={conversaPending ? "primary" : "outline"}
                size="sm"
                onClick={() => setConversaPending((prev) => !prev)}
              >
                Em conversa 24h+
              </Button>
            </div>
            {!isMobile ? (
              <div className="flex rounded-lg border border-stroke/60 bg-background-elevated p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setView("funnel")}
                  className={`px-3 py-1 rounded-md ${view === "funnel" ? "bg-primary text-background" : "text-muted hover:text-foreground"}`}
                >
                  Kanban
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`px-3 py-1 rounded-md ${view === "list" ? "bg-primary text-background" : "text-muted hover:text-foreground"}`}
                >
                  Lista
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {isMobile ? (
          <LeadsMobile leads={filtered} />
        ) : view === "funnel" ? (
          <div className="card card-hover overflow-hidden p-2">
            <div className="overflow-x-auto pb-2">
              <FunnelBoard
                empresas={filtered}
                statusFilter={statusFilter}
                onAddInteracao={(id) => (window.location.href = `/empresas/${id}`)}
                onAvancar={(id) => (window.location.href = `/empresas/${id}`)}
                onSelectLead={(lead) => setSelectedLead(lead)}
              />
            </div>
          </div>
        ) : (
          <LeadsList
            leads={filtered}
            onSelect={(lead) => setSelectedLead(lead)}
          />
        )}
      </div>

      <div className="hidden lg:block">
        {selectedLead ? <LeadDetailPanel lead={selectedLead} /> : null}
      </div>

      <ProspeccaoSession empresas={empresas} open={sessionOpen} onClose={() => setSessionOpen(false)} />
    </div>
  );
}

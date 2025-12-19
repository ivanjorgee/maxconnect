"use client";

import React, { useMemo, useState } from "react";
import { Building2, CalendarClock, Flame, MessageCircle, Trophy, ArrowRight } from "lucide-react";
import type { getDashboardData } from "@/lib/data";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RecentInteractions } from "@/components/interactions/recent-interactions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRelative } from "@/lib/utils";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export function DashboardClient({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4 md:space-y-5">
      <KpiGrid data={data} />
      <TrendChart data={data.trend30d} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ReplyRateCard data={data.replyRateByTemplate} />
        <StepUpCard data={data.stepUp} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <NextActionsList items={data.prioritizedActions.slice(0, 8)} />
        <RecentInteractions data={data.interacoesRecentes.slice(0, 5)} />
      </div>

      <QuickActions />
    </div>
  );
}

function KpiGrid({ data }: { data: DashboardData }) {
  const router = useRouter();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Empresas em prospecção"
        value={String(data.empresasEmProspeccao)}
        hint="Base ativa (exceto fechado/perdido)"
        icon={<Building2 size={18} />}
        onClick={() => router.push("/empresas")}
      />
      <KpiCard
        title="Mensagens 1 hoje"
        value={String(data.mensagens1Hoje)}
        hint="Interações tipo MENSAGEM_1 enviadas hoje"
        icon={<MessageCircle size={18} />}
      />
      <KpiCard
        title="Respostas hoje"
        value={String(data.respostasHoje)}
        hint="Avanços além de M1 com atualização hoje"
        icon={<Flame size={18} />}
      />
      <KpiCard
        title="Em conversa"
        value={String(data.emConversa)}
        hint="Status EM_CONVERSA"
        icon={<CalendarClock size={18} />}
        onClick={() => router.push("/empresas?status=EM_CONVERSA")}
      />
      <KpiCard
        title="Follow-up 1 pendente"
        value={String(data.followUps1PendentesCount)}
        hint="24h após Mensagem 1 sem resposta"
        icon={<MessageCircle size={18} />}
        tone={data.followUps1PendentesCount ? "warning" : "default"}
        onClick={() => router.push("/empresas?followup1Pending=true")}
      />
      <KpiCard
        title="Reuniões agendadas"
        value={String(data.reunioesAgendadas)}
        hint="Status REUNIAO_AGENDADA"
        icon={<Trophy size={18} />}
        onClick={() => router.push("/empresas?status=REUNIAO_AGENDADA")}
      />
    </div>
  );
}

function TrendChart({ data }: { data: DashboardData["trend7d"] }) {
  const [period, setPeriod] = useState<7 | 14 | 30>(7);
  const [showM1, setShowM1] = useState(true);
  const [showResp, setShowResp] = useState(true);
  const [hovered, setHovered] = useState<number | null>(null);

  const display = useMemo(() => data.slice(-period), [data, period]);
  const max = Math.max(
    1,
    ...display.map((d) => Math.max(showM1 ? d.mensagens1 : 0, showResp ? d.respostas : 0)),
  );
  return (
    <div className="card card-hover p-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Tendência</p>
          <p className="text-xs text-muted">Mensagens 1 vs respostas por dia</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowM1((v) => !v)}
              className={`flex items-center gap-1 rounded-full px-2 py-1 ${showM1 ? "bg-primary/10 text-primary" : "bg-background-elevated/80"}`}
            >
              <span className="h-2 w-2 rounded-full bg-primary" /> M1
            </button>
            <button
              type="button"
              onClick={() => setShowResp((v) => !v)}
              className={`flex items-center gap-1 rounded-full px-2 py-1 ${showResp ? "bg-emerald-400/10 text-emerald-300" : "bg-background-elevated/80"}`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Resp
            </button>
          </div>
          <div className="flex items-center gap-1">
            {[7, 14, 30].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p as 7 | 14 | 30)}
                className={`rounded-full px-2 py-1 ${period === p ? "bg-primary/20 text-primary" : "bg-background-elevated/80 text-muted"}`}
              >
                {p}d
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex min-w-[520px] items-end gap-2 px-1 pb-2">
          {display.map((d, idx) => (
            <div
              key={d.label}
              className="relative flex w-full min-w-[50px] flex-col items-center gap-1"
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex w-full items-end gap-1 rounded-md bg-background-elevated/60 px-2 pb-1 pt-3">
                {showM1 ? (
                  <div
                    className="w-1/2 rounded-t bg-primary"
                    style={{ height: `${(d.mensagens1 / max) * 110 + 10}px` }}
                    title={`Mensagens 1: ${d.mensagens1}`}
                  />
                ) : null}
                {showResp ? (
                  <div
                    className="w-1/2 rounded-t bg-emerald-400/80"
                    style={{ height: `${(d.respostas / max) * 110 + 10}px` }}
                    title={`Respostas: ${d.respostas}`}
                  />
                ) : null}
              </div>
              <p className="text-[11px] text-muted">{d.label}</p>
              {hovered === idx ? (
                <div className="absolute -top-2 left-1/2 z-10 w-48 -translate-x-1/2 rounded-lg border border-stroke/60 bg-background-elevated p-2 text-[11px] shadow-lg">
                  <p className="font-semibold text-foreground">{d.label}</p>
                  {showM1 ? <p className="text-muted">M1: {d.mensagens1}</p> : null}
                  {showResp ? <p className="text-muted">Resp: {d.respostas}</p> : null}
                  {d.mensagens1 > 0 && showResp ? (
                    <p className="text-muted">
                      Taxa: {Math.round((d.respostas / d.mensagens1) * 100)}%
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReplyRateCard({ data }: { data: DashboardData["replyRateByTemplate"] }) {
  return (
    <div className="card card-hover p-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Reply rate por template</p>
          <p className="text-xs text-muted">Respostas atribuídas por variante M1</p>
        </div>
      </div>
      <div className="space-y-2">
        {data.length ? (
          data.map((item) => (
            <div key={item.templateId} className="flex items-center justify-between rounded-lg border border-stroke/60 bg-background-elevated px-3 py-2 text-xs">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.templateId}</p>
                <p className="text-[11px] text-muted">
                  {item.inbound} respostas • {item.outbound} envios
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-primary">{Math.round(item.rate)}%</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted">Sem dados suficientes ainda.</p>
        )}
      </div>
    </div>
  );
}

function StepUpCard({ data }: { data: DashboardData["stepUp"] }) {
  return (
    <div className="card card-hover p-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Step-up rate</p>
          <p className="text-xs text-muted">Respondeu → Em conversa → Proposta → Fechado</p>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between rounded-lg border border-stroke/60 bg-background-elevated px-3 py-2">
          <span className="text-muted">Respondeu → Em conversa</span>
          <span className="font-semibold text-foreground">{Math.round(data.rateConversa)}%</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-stroke/60 bg-background-elevated px-3 py-2">
          <span className="text-muted">Em conversa → Proposta</span>
          <span className="font-semibold text-foreground">{Math.round(data.rateProposta)}%</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-stroke/60 bg-background-elevated px-3 py-2">
          <span className="text-muted">Proposta → Fechado</span>
          <span className="font-semibold text-foreground">{Math.round(data.rateFechado)}%</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-background-elevated px-3 py-2">
          <span className="text-muted">Fechado / Respondeu</span>
          <span className="font-semibold text-primary">{Math.round(data.rateFechadoSobreResposta)}%</span>
        </div>
        <p className="text-[11px] text-muted">
          Base: {data.respondeu} respondeu • {data.emConversa} em conversa • {data.proposta} propostas • {data.fechado} fechados
        </p>
      </div>
    </div>
  );
}

function NextActionsList({ items }: { items: DashboardData["prioritizedActions"] }) {
  const limited = items.slice(0, 8);
  return (
    <div className="card card-hover p-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Próximas ações</p>
          <p className="text-xs text-muted">Follow-ups, reuniões e contatos prioritários</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Link href="/empresas?action=today" className="text-primary hover:underline">
            Ver agenda
          </Link>
          <span className="text-muted">|</span>
          <Link href="/empresas" className="text-primary hover:underline">
            Ver empresas
          </Link>
        </div>
      </div>
      <div className="space-y-2">
        {limited.length === 0 ? (
          <p className="text-xs text-muted">Sem ações agendadas.</p>
        ) : (
          limited.map((item) => (
            <div key={`${item.empresa.id}-${item.label}-${item.date.toISOString()}`} className="flex items-center justify-between rounded-lg border border-stroke/60 bg-background-elevated px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.empresa.nome}</p>
                <p className="text-[11px] text-muted">
                  {item.label} • {item.empresa.cidade}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <span>{formatRelative(item.date)}</span>
                <Link href={`/empresas/${item.empresa.id}`} className="inline-flex items-center gap-1 rounded-md border border-stroke/60 px-2 py-1 text-[11px] text-foreground hover:border-primary/60">
                  <ArrowRight size={12} /> Abrir
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="card card-hover flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">Ações rápidas</p>
        <p className="text-xs text-muted">Visão resumida. Use as telas dedicadas para o detalhe.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/leads"
          className="rounded-lg border border-stroke/60 bg-background-elevated px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:text-primary"
        >
          Ver leads e funil
        </Link>
        <Link
          href="/empresas"
          className="rounded-lg border border-primary/60 bg-primary px-3 py-2 text-sm font-semibold text-background shadow-glow-primary transition hover:bg-primary/90"
        >
          Ver empresas
        </Link>
      </div>
    </div>
  );
}

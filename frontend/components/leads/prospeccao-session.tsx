'use client';

import { useMemo, useState } from "react";
import { Empresa, ModeloAbertura, StatusFunil } from "@prisma/client";
import { ArrowLeft, ArrowRight, CheckCircle2, Link as LinkIcon, MessageCircle, X } from "lucide-react";
import type { EmpresaWithInteracoes } from "@/lib/data";
import { modelosAbertura } from "@/lib/modelosAbertura";
import { formatRelative } from "@/lib/utils";
import { MacroTipo } from "@/lib/proximaAcao";
import { CADENCE_TEMPLATES, resolveM1TemplateId, type CadenceTemplateId } from "@/lib/cadence";
import { Button } from "../ui/button";

type Props = {
  empresas: EmpresaWithInteracoes[];
  open?: boolean;
  onClose?: () => void;
};

type CadenceTemplateView = { id: CadenceTemplateId; title: string; text: string };

export function ProspeccaoSession({ empresas, open = false, onClose }: Props) {
  const queue = useMemo(() => buildQueue(empresas), [empresas]);
  const [index, setIndex] = useState(0);
  const [modelo, setModelo] = useState<ModeloAbertura | "">(queue[0]?.modeloAbertura ?? "M1");
  const [processing, setProcessing] = useState(false);

  const currentQueue = queue;
  const atual = currentQueue[index];

  if (!open || !atual) return null;

  const contato = buildContato(atual);
  const modeloAtivo = modelosAbertura.find((m) => m.codigo === (modelo || atual.modeloAbertura)) ?? modelosAbertura[0];
  const modeloCodigo = modeloAtivo?.codigo as ModeloAbertura;
  const macro = inferMacro(atual);
  const template = getTemplateForMacro(macro, atual);
  const templateIdLabel = template?.id ?? "—";

  async function concluir() {
    setProcessing(true);
    const payload: Record<string, unknown> = { macro, modeloAbertura: modeloCodigo || null };
    const response = await fetch(`/api/companies/${atual.id}/macro`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setProcessing(false);
    if (!response.ok) return;
    const nextIndex = index + 1;
    if (nextIndex >= currentQueue.length) {
      onClose?.();
      return;
    }
    setIndex(nextIndex);
    setModelo(currentQueue[nextIndex]?.modeloAbertura ?? "M1");
  }

  function pular() {
    const nextIndex = index + 1;
    if (nextIndex >= currentQueue.length) {
      onClose?.();
      return;
    }
    setIndex(nextIndex);
    setModelo(currentQueue[nextIndex]?.modeloAbertura ?? "M1");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="mx-auto flex h-full max-w-5xl flex-col gap-4 rounded-2xl border border-primary/40 bg-background p-4 shadow-2xl shadow-black/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary">Sessão de prospecção</p>
            <p className="text-sm text-muted">
              {index + 1} de {currentQueue.length} • Prioridade: atrasados e novos
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X />
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-xl border border-stroke/60 bg-background-elevated p-4 space-y-3">
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold text-foreground">{atual.nome}</p>
              <p className="text-sm text-muted">
                {atual.cidade} • {atual.canalPrincipal} • {atual.origemLead}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                {atual.modeloAbertura ? (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{atual.modeloAbertura}</span>
                ) : (
                  <span className="rounded-full bg-background-soft px-2 py-1 text-[10px]">M1 (padrão)</span>
                )}
                {modeloCodigo ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">Usando {modeloCodigo}</span> : null}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <InfoRow label="Site" value={atual.website ?? "Sem site"} />
              <InfoRow label="WhatsApp" value={atual.whatsapp ?? atual.telefonePrincipal ?? "—"} />
              <InfoRow label="Canal" value={atual.canalPrincipal} />
              <InfoRow
                label="Próxima ação"
                value={
                  atual.proximaAcao && atual.proximaAcaoData
                    ? `${atual.proximaAcao} • ${formatRelative(toDate(atual.proximaAcaoData))}`
                    : "Defina ao concluir"
                }
              />
            </div>

            <div className="mt-2 rounded-lg border border-stroke/60 bg-background-soft p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted">Mensagem ({templateIdLabel})</p>
              <p className="font-semibold text-foreground">{template?.title ?? "Mensagem pronta"}</p>
              <p className="mt-2 whitespace-pre-line text-muted leading-relaxed">{template?.text ?? "Sem mensagem configurada."}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => template?.text && navigator.clipboard.writeText(template.text)}
                className="w-full border-primary/60 text-primary hover:bg-primary/10"
              >
                Copiar mensagem
              </Button>
              {contato?.url ? (
                <a
                  href={`${contato.url}?text=${encodeURIComponent(template?.text ?? "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-background shadow-glow-primary"
                >
                  <MessageCircle size={16} /> Abrir WhatsApp
                </a>
              ) : (
                <Button variant="ghost" disabled className="w-full text-muted">
                  Sem contato válido
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={atual.linkGoogleMaps}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-stroke/60 px-3 py-2 text-sm text-foreground hover:border-primary/60"
              >
                <LinkIcon size={16} /> Google Maps
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-stroke/60 bg-background-elevated p-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-muted">Modelo de abertura</label>
              <select
                value={modelo || modeloAtivo.codigo}
                onChange={(e) => setModelo(e.target.value as ModeloAbertura | "")}
                className="w-full rounded-lg border border-stroke/60 bg-background-soft p-2 text-sm"
              >
                {modelosAbertura.map((m) => (
                  <option key={m.codigo} value={m.codigo}>
                    {m.codigo} — {m.titulo}
                  </option>
                ))}
              </select>
              {modeloAtivo ? (
                <div className="rounded-lg border border-stroke/60 bg-background p-3 text-sm text-muted">
                  <p className="font-semibold text-foreground">{modeloAtivo.titulo}</p>
                  <p className="mt-1 whitespace-pre-line">{modeloAtivo.texto}</p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button variant="primary" onClick={concluir} disabled={processing} className="flex-1">
                <CheckCircle2 size={16} />
                {processing ? "Processando..." : "Concluir ação"}
              </Button>
              <Button variant="outline" onClick={pular} className="border-stroke/60 text-muted flex-1 sm:flex-none">
                <ArrowRight size={16} /> Próximo
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-stroke/60 px-2 py-1 text-foreground hover:border-primary/60"
                onClick={() => setIndex((prev) => (prev > 0 ? prev - 1 : 0))}
                disabled={index === 0}
              >
                <ArrowLeft size={14} /> Anterior
              </button>
              <span>
                {index + 1} / {currentQueue.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildQueue(empresas: EmpresaWithInteracoes[]) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  return empresas
    .filter((empresa) => {
      const blockedUntil = empresa.noResponseUntil ? toDate(empresa.noResponseUntil) : null;
      if (blockedUntil && blockedUntil > end) return false;
      if (
        [
          StatusFunil.FECHADO,
          StatusFunil.PERDIDO,
          StatusFunil.SEM_RESPOSTA_30D,
          StatusFunil.NURTURE,
          StatusFunil.FOLLOWUP_LONGO,
        ].includes(empresa.statusFunil)
      ) {
        return false;
      }
      const proxima = empresa.proximaAcaoData ? toDate(empresa.proximaAcaoData) : null;
      if (proxima && proxima <= end) return true;
      if (proxima && proxima < start) return true;
      return empresa.statusFunil === StatusFunil.NOVO;
    })
    .sort((a, b) => {
      const aDate = toDate(a.proximaAcaoData ?? a.createdAt);
      const bDate = toDate(b.proximaAcaoData ?? b.createdAt);
      return aDate.getTime() - bDate.getTime();
    });
}

function buildContato(empresa: Empresa) {
  const phone = empresa.whatsapp || empresa.telefonePrincipal;
  if (phone) {
    const digits = phone.replace(/[^\d]/g, "");
    if (digits) return { url: `https://wa.me/${digits}`, label: "WhatsApp" };
  }
  return null;
}

function inferMacro(empresa: EmpresaWithInteracoes): MacroTipo {
  if (empresa.statusFunil === StatusFunil.NOVO) return "MENSAGEM_1";
  if (empresa.proximaAcao === "FOLLOW_UP_1") return "FOLLOWUP_1";
  if (empresa.proximaAcao === "BREAKUP") return "BREAKUP";
  if (empresa.proximaAcao === "FOLLOW_UP_2" || empresa.statusFunil === StatusFunil.FOLLOWUP_LONGO) return "FOLLOWUP_2";
  if (empresa.statusFunil === StatusFunil.REUNIAO_AGENDADA) return "REUNIAO_REALIZADA";
  if (empresa.statusFunil === StatusFunil.REUNIAO_REALIZADA) return "PROPOSTA_ENVIADA";
  if (empresa.statusFunil === StatusFunil.PROPOSTA_ENVIADA) return "FOLLOWUP_1";
  return "FOLLOWUP_1";
}

function getTemplateForMacro(macro: MacroTipo, empresa: EmpresaWithInteracoes): CadenceTemplateView | null {
  if (macro === "FOLLOWUP_1") {
    return { id: "FU1", ...CADENCE_TEMPLATES.FU1 };
  }
  if (macro === "FOLLOWUP_2") {
    return { id: "FU2", ...CADENCE_TEMPLATES.FU2 };
  }
  if (macro === "BREAKUP") {
    return { id: "BREAKUP", ...CADENCE_TEMPLATES.BREAKUP };
  }
  if (macro === "MENSAGEM_1") {
    const id = resolveM1TemplateId(empresa.currentTemplate, empresa.id);
    return { id, ...CADENCE_TEMPLATES[id] };
  }
  return null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stroke/60 bg-background-soft px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

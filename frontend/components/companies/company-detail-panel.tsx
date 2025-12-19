'use client';

import { useMemo, useState, useTransition, FormEvent } from "react";
import { ModeloAbertura, StatusFunil } from "@prisma/client";
import { Copy, Clock3, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { EmpresaWithInteracoes } from "@/lib/data";
import { statusLabels } from "@/lib/dictionaries";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { TagList } from "@/components/ui/tag-list";
import { modelosAbertura } from "@/lib/modelosAbertura";
import { formatRelative } from "@/lib/utils";
import type { MacroTipo } from "@/lib/proximaAcao";
import { CADENCE_TEMPLATES, resolveM1TemplateId } from "@/lib/cadence";
import { isConversaPending, isFollowup1Pending } from "@/lib/followup-rules";
import { FollowupConversaAction } from "./followup-conversa-action";

type Props = {
  company: EmpresaWithInteracoes;
  lastInteractionAt?: Date | string | null;
  nextActionLabel?: string | null;
};

export function CompanyDetailPanel({ company, lastInteractionAt, nextActionLabel }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFunil>(company.statusFunil);
  const [modeloAbertura, setModeloAbertura] = useState<ModeloAbertura | "">(company.modeloAbertura ?? "");
  const [observacoes, setObservacoes] = useState(company.observacoes ?? "");
  const [tags, setTags] = useState<string[]>(company.tags ?? []);
  const [reuniaoDate, setReuniaoDate] = useState(
    company.dataReuniao ? new Date(company.dataReuniao).toISOString().slice(0, 16) : "",
  );
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<MacroTipo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const modeloSelecionado = useMemo(() => modelosAbertura.find((m) => m.codigo === modeloAbertura), [modeloAbertura]);
  const followupModelTemplate = useMemo(() => CADENCE_TEMPLATES.FU1, []);
  const m1TemplateId = resolveM1TemplateId(company.currentTemplate, company.id);
  const m1Template = CADENCE_TEMPLATES[m1TemplateId];

  const followup1Pending = useMemo(() => isFollowup1Pending(company), [company]);
  const conversaPending = useMemo(() => isConversaPending(company), [company]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        statusFunil: status,
        modeloAbertura: modeloAbertura || null,
        observacoes,
        tags,
        dataReuniao: reuniaoDate ? new Date(reuniaoDate) : null,
      }),
    });
    startTransition(() => router.refresh());
    setMessage("Alterações salvas.");
  }

  async function runMacro(macro: MacroTipo) {
    setMessage(null);
    setPendingAction(macro);
    const payload: Record<string, unknown> = {
      macro,
      modeloAbertura: modeloAbertura || company.modeloAbertura || null,
    };
    if (macro === "REUNIAO_AGENDADA") {
      const chosen = reuniaoDate ? new Date(reuniaoDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
      payload.data = chosen;
    }
    const response = await fetch(`/api/companies/${company.id}/macro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setMessage("Não foi possível aplicar macro.");
      setPendingAction(null);
      return;
    }
    startTransition(() => router.refresh());
    setPendingAction(null);
    setScheduleOpen(false);
    setMessage("Atualizado.");
  }

  async function handleDelete() {
    const confirmed = window.confirm("Deseja apagar esta empresa e suas interações?");
    if (!confirmed) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
      if (!response.ok) {
        setMessage("Não foi possível apagar.");
        setDeleting(false);
        return;
      }
      startTransition(() => router.push("/empresas"));
    } catch {
      setMessage("Erro ao apagar empresa.");
      setDeleting(false);
    }
  }

  async function handleCopyModelo() {
    if (!modeloSelecionado?.texto) return;
    await navigator.clipboard.writeText(modeloSelecionado.texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <form onSubmit={save} className="card card-hover space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Editar empresa</p>
          <p className="text-xs text-muted">Status, modelo, tags e observações.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-red-600/50 bg-red-900/40 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-900/60 disabled:opacity-60"
            disabled={deleting}
          >
            <span className="inline-flex items-center gap-1">
              <Trash2 size={14} />
              {deleting ? "Apagando..." : "Apagar"}
            </span>
          </button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs text-muted md:grid-cols-2">
        <InfoPill
          label="Última interação"
          value={lastInteractionAt ? formatRelative(lastInteractionAt) : "Sem registro"}
        />
        <InfoPill
          label="Próxima ação"
          value={
            company.proximaAcao && company.proximaAcaoData
              ? `${company.proximaAcao} • ${formatRelative(company.proximaAcaoData)}`
              : nextActionLabel ?? "Não definida"
          }
          highlight={Boolean(company.proximaAcao && company.proximaAcaoData)}
        />
      </div>

      {followup1Pending ? (
        <div className="rounded-lg border border-amber-700/60 bg-amber-900/20 px-3 py-2 text-xs text-amber-100">
          Follow-up 1 recomendado (24h sem resposta). Use o botão abaixo para copiar o texto.
        </div>
      ) : null}
      {conversaPending ? (
        <div className="rounded-lg border border-amber-700/60 bg-amber-900/20 px-3 py-2 text-xs text-amber-100">
          Follow-up de conversa recomendado (24h sem avanço).
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs text-muted">Status do funil</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFunil)}>
            {Object.values(StatusFunil).map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <label>Modelo de abertura</label>
            {modeloSelecionado ? (
              <button
                type="button"
                onClick={handleCopyModelo}
                className="flex items-center gap-1 rounded-md border border-primary/40 px-2 py-1 text-[11px] text-primary transition hover:bg-primary/10"
              >
                <Copy size={14} />
                {copied ? "Copiado!" : "Copiar texto"}
              </button>
            ) : null}
          </div>
          <Select value={modeloAbertura} onChange={(e) => setModeloAbertura(e.target.value as ModeloAbertura | "")}>
            <option value="">—</option>
            {Object.values(ModeloAbertura).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          {modeloSelecionado ? (
            <div className="rounded-lg border border-stroke/60 bg-background-elevated px-3 py-2 text-xs text-muted">
              <p className="font-semibold text-foreground">{modeloSelecionado.titulo}</p>
              <p className="mt-1 leading-relaxed whitespace-pre-line">{modeloSelecionado.texto}</p>
            </div>
          ) : null}
        </div>
      </div>

      {m1Template ? (
        <div className="space-y-1 rounded-lg border border-primary/30 bg-background-elevated px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Mensagem 1 ({m1TemplateId})</p>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(m1Template.text);
                setMessage("Mensagem 1 copiada.");
              }}
              className="text-[11px] text-primary underline"
            >
              Copiar texto
            </button>
          </div>
          <p className="whitespace-pre-line text-xs text-muted leading-relaxed">{m1Template.text}</p>
        </div>
      ) : null}

      {followupModelTemplate ? (
        <div className="space-y-1 rounded-lg border border-primary/30 bg-background-elevated px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">{followupModelTemplate.title}</p>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(followupModelTemplate.text);
                setMessage("Texto de follow-up copiado.");
              }}
              className="text-[11px] text-primary underline"
            >
              Copiar texto
            </button>
          </div>
          <p className="whitespace-pre-line text-xs text-muted leading-relaxed">{followupModelTemplate.text}</p>
        </div>
      ) : null}

      {conversaPending && followupModelTemplate ? (
        <FollowupConversaAction empresaId={company.id} template={followupModelTemplate.text} />
      ) : null}

      <div className="space-y-2">
        <label className="text-xs text-muted">Tags</label>
        <TagList value={tags} onChange={setTags} />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted">Observações</label>
        <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Contexto, próximos passos, objeções." />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted">Data de reunião</label>
        <Input type="datetime-local" value={reuniaoDate} onChange={(e) => setReuniaoDate(e.target.value)} />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <QuickButton label="Marcar Mensagem 1" loading={pendingAction === "MENSAGEM_1"} onClick={() => runMacro("MENSAGEM_1")} />
        <QuickButton label="Recebi resposta" loading={pendingAction === "RESPONDEU"} onClick={() => runMacro("RESPONDEU")} />
        <QuickButton label="Follow-up 1 enviado" loading={pendingAction === "FOLLOWUP_1"} onClick={() => runMacro("FOLLOWUP_1")} />
        <QuickButton label="Follow-up 2 enviado" loading={pendingAction === "FOLLOWUP_2"} onClick={() => runMacro("FOLLOWUP_2")} />
        <QuickButton label="Break-up enviado" loading={pendingAction === "BREAKUP"} onClick={() => runMacro("BREAKUP")} />
        <QuickButton label="Agendar reunião" loading={pendingAction === "REUNIAO_AGENDADA"} onClick={() => setScheduleOpen(true)} />
        <QuickButton label="Reunião realizada" loading={pendingAction === "REUNIAO_REALIZADA"} onClick={() => runMacro("REUNIAO_REALIZADA")} />
        <QuickButton label="Proposta enviada" loading={pendingAction === "PROPOSTA_ENVIADA"} onClick={() => runMacro("PROPOSTA_ENVIADA")} />
      </div>

      {scheduleOpen ? (
        <div className="rounded-lg border border-primary/30 bg-background-elevated/80 p-3 shadow-glow-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Clock3 size={16} className="text-primary" />
              <span>Agendar reunião</span>
            </div>
            <button className="text-xs text-muted underline" type="button" onClick={() => setScheduleOpen(false)}>
              Cancelar
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Input type="datetime-local" value={reuniaoDate} onChange={(e) => setReuniaoDate(e.target.value)} className="flex-1" />
            <Button type="button" onClick={() => runMacro("REUNIAO_AGENDADA")} disabled={!reuniaoDate}>
              Confirmar
            </Button>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </form>
  );
}

function QuickButton({ label, onClick, loading }: { label: string; onClick: () => void; loading?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary shadow-glow-primary transition hover:bg-primary/20 disabled:opacity-60"
      disabled={loading}
    >
      {loading ? "Processando..." : label}
    </button>
  );
}

function InfoPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        highlight ? "border-primary/50 bg-primary/5 text-primary" : "border-stroke/60 bg-background-elevated text-foreground"
      }`}
    >
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

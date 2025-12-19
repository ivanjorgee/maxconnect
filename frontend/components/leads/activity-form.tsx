'use client';

import { FormEvent, useEffect, useState, useTransition } from "react";
import { Canal, ModeloAbertura as ModeloAberturaEnum, TipoInteracao } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { canalLabels } from "@/lib/dictionaries";
import type { EmpresaWithInteracoes } from "@/lib/data";
import { MacroTipo } from "@/lib/proximaAcao";
import { modelosAbertura } from "@/lib/modelosAbertura";
import { CADENCE_TEMPLATES, type CadenceTemplateId, resolveM1TemplateId } from "@/lib/cadence";
import { formatDate, formatRelative } from "@/lib/utils";

const canais = Object.values(Canal);

type Props = {
  empresa: EmpresaWithInteracoes;
};

export function ActivityForm({ empresa }: Props) {
  const router = useRouter();
  const lastCanal = empresa.interacoes[0]?.canal ?? empresa.canalPrincipal;

  const [canal, setCanal] = useState<Canal>(lastCanal);
  const [modeloAbertura, setModeloAbertura] = useState<ModeloAberturaEnum>((empresa.modeloAbertura as ModeloAberturaEnum) ?? ModeloAberturaEnum.M1);
  const m1TemplateId = resolveM1TemplateId(empresa.currentTemplate, empresa.id);
  const [descricao, setDescricao] = useState(defaultDescricao(TipoInteracao.MENSAGEM_1, m1TemplateId));
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<MacroTipo | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [reuniaoDate, setReuniaoDate] = useState(
    empresa.dataReuniao ? new Date(empresa.dataReuniao).toISOString().slice(0, 16) : "",
  );
  const nextActionLabel = useNextActionLabel(empresa);

  useEffect(() => {
    setDescricao(defaultDescricao(TipoInteracao.MENSAGEM_1, m1TemplateId));
  }, [m1TemplateId]);

  useEffect(() => {
    setCanal(lastCanal);
  }, [lastCanal]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const response = await fetch(`/api/companies/${empresa.id}/macro`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        macro: "MENSAGEM_1",
        canal,
        descricao,
        modeloAbertura,
      }),
    });

    if (!response.ok) {
      setMessage("Não foi possível registrar a interação.");
      return;
    }

    setDescricao(defaultDescricao(TipoInteracao.MENSAGEM_1, m1TemplateId));
    startTransition(() => router.refresh());
    setMessage("Interação registrada.");
  }

  function getPhoneNumber() {
    const phone = empresa.whatsapp || empresa.telefonePrincipal;
    return phone ? phone.replace(/\D/g, "") : "";
  }

  function getMacroText(macro: MacroTipo) {
    if (macro === "MENSAGEM_1") {
      return CADENCE_TEMPLATES[m1TemplateId]?.text ?? null;
    }
    if (macro === "FOLLOWUP_1") {
      return CADENCE_TEMPLATES.FU1.text;
    }
    if (macro === "FOLLOWUP_2") {
      return CADENCE_TEMPLATES.FU2.text;
    }
    if (macro === "BREAKUP") {
      return CADENCE_TEMPLATES.BREAKUP.text;
    }
    if (macro === "CONVERSA_INICIADA") {
      return "Oi! Obrigado por responder. Vamos seguir por aqui para alinhar os próximos passos? Posso te mandar um resumo rápido agora.";
    }
    if (macro === "RESPONDEU") {
      return null;
    }
    if (macro === "PERDIDO") {
      return "Registro atualizado como perdido. Encerrando follow-up para este lead.";
    }
    return null;
  }

  async function runMacro(macro: MacroTipo) {
    setMessage(null);
    setPendingAction(macro);
    const payload: Record<string, unknown> = {
      macro,
      modeloAbertura,
    };
    if (macro === "REUNIAO_AGENDADA") {
      const chosen = reuniaoDate ? new Date(reuniaoDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
      payload.data = chosen;
    }
    const response = await fetch(`/api/companies/${empresa.id}/macro`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const errorPayload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setMessage(errorPayload?.error || "Não foi possível aplicar o atalho.");
      setPendingAction(null);
      return;
    }
    startTransition(() => router.refresh());
    setPendingAction(null);
    setScheduleOpen(false);
    setMessage("Interação atualizada.");

    // abre WhatsApp com a mensagem pronta, se houver telefone e texto
    const phone = getPhoneNumber();
    const text = getMacroText(macro);
    if (typeof window !== "undefined" && text) {
      if (phone) {
        const encoded = encodeURIComponent(text);
        window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank", "noopener,noreferrer");
        setMessage("Atalho aplicado e WhatsApp aberto com o follow-up.");
      } else {
        await navigator.clipboard.writeText(text);
        setMessage("Atalho aplicado. Texto de follow-up copiado para a área de transferência.");
      }
    } else {
      setMessage("Atalho aplicado. Texto de follow-up pronto.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card card-hover space-y-4 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Registrar interação</p>
        <p className="text-xs text-muted">Mensagem enviada, follow-up, reunião ou qualquer contato relevante.</p>
      </div>

      <div className="space-y-2">
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto]">
          <div className="space-y-1">
            <label className="text-xs text-muted">Canal</label>
            <Select value={canal} onChange={(e) => setCanal(e.target.value as Canal)} className="w-full">
              {canais.map((option) => (
                <option key={option} value={option}>
                  {canalLabels[option]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted">Próxima interação</label>
            <div>
              <span
                className={`inline-flex h-11 items-center rounded-md border px-4 text-[11px] ${
                  nextActionLabel.highlight ? "border-primary/40 text-primary" : "border-stroke/60 text-muted"
                }`}
                title="Próxima ação sugerida"
              >
                {nextActionLabel.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted">Modelo da primeira mensagem</label>
        <Select value={modeloAbertura} onChange={(e) => setModeloAbertura(e.target.value as ModeloAberturaEnum)}>
          {modelosAbertura.map((modelo) => (
            <option key={modelo.codigo} value={modelo.codigo}>
              {modelo.codigo} — {modelo.titulo}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted">Descrição</label>
        <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Resumo curto do contato" required rows={2} />
      </div>

      <div className="flex items-center justify-between">
        {message ? <p className="text-xs text-muted">{message}</p> : <span />}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar interação"}
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-stroke/70 bg-background-elevated/60 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">Atalhos de prospecção</p>
          {pendingAction ? <span className="text-[11px] text-muted">Processando {pendingAction}...</span> : null}
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <QuickButton label="Marcar Mensagem 1" loading={pendingAction === "MENSAGEM_1"} onClick={() => runMacro("MENSAGEM_1")} />
          <QuickButton label="Recebi resposta" loading={pendingAction === "RESPONDEU"} onClick={() => runMacro("RESPONDEU")} />
          <QuickButton label="Conversa iniciada" loading={pendingAction === "CONVERSA_INICIADA"} onClick={() => runMacro("CONVERSA_INICIADA")} />
          <QuickButton label="Follow-up 1 enviado" loading={pendingAction === "FOLLOWUP_1"} onClick={() => runMacro("FOLLOWUP_1")} />
          <QuickButton label="Follow-up 2 enviado" loading={pendingAction === "FOLLOWUP_2"} onClick={() => runMacro("FOLLOWUP_2")} />
          <QuickButton label="Break-up enviado" loading={pendingAction === "BREAKUP"} onClick={() => runMacro("BREAKUP")} />
          <QuickButton label="Agendar reunião" loading={pendingAction === "REUNIAO_AGENDADA"} onClick={() => setScheduleOpen(true)} />
          <QuickButton label="Reunião realizada" loading={pendingAction === "REUNIAO_REALIZADA"} onClick={() => runMacro("REUNIAO_REALIZADA")} />
          <QuickButton label="Proposta enviada" loading={pendingAction === "PROPOSTA_ENVIADA"} onClick={() => runMacro("PROPOSTA_ENVIADA")} />
          <QuickButton label="Marcar como perdido" loading={pendingAction === "PERDIDO"} onClick={() => runMacro("PERDIDO")} />
        </div>

        {scheduleOpen ? (
          <div className="rounded-lg border border-primary/30 bg-background px-3 py-2 shadow-glow-primary">
            <div className="flex items-center justify-between text-sm text-foreground">
              <span>Agendar reunião</span>
              <button type="button" className="text-[11px] text-muted underline" onClick={() => setScheduleOpen(false)}>
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
      </div>
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

function defaultDescricao(tipo: TipoInteracao, templateId?: CadenceTemplateId | null) {
  if (tipo === TipoInteracao.MENSAGEM_1) return `Mensagem 1 enviada${templateId ? ` (${templateId})` : ""}.`;
  if (tipo === TipoInteracao.FOLLOWUP_1) return "Follow-up 1 enviado.";
  if (tipo === TipoInteracao.FOLLOWUP_2) return "Follow-up 2 enviado.";
  if (tipo === TipoInteracao.BREAKUP) return "Break-up enviado.";
  if (tipo === TipoInteracao.FOLLOWUP_CONVERSA) return "Follow-up de conversa enviado.";
  if (tipo === TipoInteracao.REUNIAO) return "Reunião agendada.";
  return "Interação registrada.";
}

function useNextActionLabel(empresa: EmpresaWithInteracoes) {
  const { proximaAcao } = empresa;

  if (empresa.statusFunil === "NOVO" && !proximaAcao) {
    return { label: "FAZER_PRIMEIRO_CONTATO", highlight: true };
  }
  const fallbackFollowup =
    proximaAcao === "FOLLOW_UP_1"
      ? getNextActionFromMensagem1(empresa)
      : null;

  const targetDate = (() => {
    if (proximaAcao && empresa.proximaAcaoData) {
      const explicit = new Date(empresa.proximaAcaoData);
      if (fallbackFollowup && explicit.getTime() < fallbackFollowup.getTime()) {
        return fallbackFollowup;
      }
      return explicit;
    }
    return fallbackFollowup;
  })();

  if (!proximaAcao || !targetDate) {
    return { label: "Sem próxima ação", highlight: false };
  }

  const dateObj = targetDate;
  const relative = formatRelative(dateObj);
  const today = new Date();
  const sameDay =
    dateObj.getFullYear() === today.getFullYear() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getDate() === today.getDate();
  const label = sameDay ? `${proximaAcao} hoje (${formatDate(dateObj)})` : `${proximaAcao} • ${relative}`;
  return { label, highlight: true };
}

function getNextActionFromMensagem1(empresa: EmpresaWithInteracoes) {
  const lastM1 = empresa.interacoes?.find((i) => i.tipo === "MENSAGEM_1");
  if (!lastM1) return null;
  return addHours(new Date(lastM1.data), 24);
}

function addHours(base: Date, hours: number) {
  const next = new Date(base);
  next.setHours(base.getHours() + hours);
  return next;
}

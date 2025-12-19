'use client';

import Link from "next/link";
import { Phone, ExternalLink, Copy } from "lucide-react";
import type { EmpresaWithInteracoes } from "@/lib/data";
import { canalLabels, origemLabels } from "@/lib/dictionaries";
import { formatRelative } from "@/lib/utils";
import { modelosFollowUp1 } from "@/lib/modelosFollowup";
import { modelosAbertura } from "@/lib/modelosAbertura";
import { Button } from "../ui/button";

export function LeadDetailPanel({ lead }: { lead: EmpresaWithInteracoes | null }) {
  if (!lead) {
    return <div className="card p-4 text-sm text-muted">Selecione um lead para ver os detalhes.</div>;
  }

  const modeloFollow = lead.modeloAbertura ? modelosFollowUp1[lead.modeloAbertura] : null;
  const modeloAbertura = lead.modeloAbertura ? modelosAbertura.find((m) => m.codigo === lead.modeloAbertura) : null;

  return (
    <div className="card card-hover sticky top-24 flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-foreground break-words">{lead.nome}</p>
          <p className="text-xs text-muted">
            {lead.cidade ?? "—"} • {canalLabels[lead.canalPrincipal]} • {origemLabels[lead.origemLead]}
          </p>
        </div>
        {lead.modeloAbertura ? (
          <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{lead.modeloAbertura}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
        {lead.whatsapp ? (
          <Link
            href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-md border border-primary/40 px-2 py-1 text-primary"
          >
            <Phone size={12} /> WhatsApp
          </Link>
        ) : null}
        {lead.linkGoogleMaps ? (
          <Link href={lead.linkGoogleMaps} target="_blank" className="inline-flex items-center gap-1 rounded-md border border-stroke/60 px-2 py-1 text-foreground">
            <ExternalLink size={12} /> Maps
          </Link>
        ) : null}
        {lead.instagram ? (
          <Link
            href={normalizeUrl(lead.instagram)}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-md border border-stroke/60 px-2 py-1 text-foreground"
          >
            <ExternalLink size={12} /> Instagram
          </Link>
        ) : null}
      </div>

      <div className="rounded-lg border border-stroke/60 bg-background-elevated p-3 text-[11px] text-muted">
        <p>Status: {lead.statusFunil}</p>
        <p>Próxima ação: {lead.proximaAcao ?? "—"}</p>
        <p>Última: {lead.interacoes[0] ? formatRelative(lead.interacoes[0].data) : formatRelative(lead.updatedAt)}</p>
      </div>

      {modeloFollow ? (
        <div className="space-y-2 rounded-lg border border-primary/30 bg-background-elevated/70 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">{modeloFollow.titulo}</p>
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-2 py-1 text-[11px]"
              onClick={async () => {
                await navigator.clipboard.writeText(modeloFollow.texto);
              }}
            >
              <Copy size={14} /> Copiar
            </Button>
          </div>
          <p className="whitespace-pre-line text-xs text-muted leading-relaxed">{modeloFollow.texto}</p>
        </div>
      ) : modeloAbertura ? (
        <div className="space-y-2 rounded-lg border border-stroke/60 bg-background-elevated p-3">
          <p className="text-xs font-semibold text-foreground">{modeloAbertura.titulo}</p>
          <p className="whitespace-pre-line text-xs text-muted leading-relaxed">{modeloAbertura.texto}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => {
            window.location.href = `/empresas/${lead.id}`;
          }}
        >
          Ver lead completo
        </Button>
      </div>
    </div>
  );
}

function normalizeUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

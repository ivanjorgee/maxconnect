'use client';

import { FormEvent, useState } from "react";
import { OrigemLead, StatusFunil, TipoSite } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Props = {
  initial: {
    q?: string;
    status?: StatusFunil | "";
    cidade?: string;
    origemLead?: OrigemLead | "";
    tipoSite?: TipoSite | "";
    temSite?: string;
    followup1Pending?: string;
    action?: string;
  };
  onApplied?: () => void;
  onCleared?: () => void;
};

export function CompaniesFilters({ initial, onApplied, onCleared }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFunil | "">(initial.status ?? "");
  const [cidade, setCidade] = useState(initial.cidade ?? "");
  const [origemLead, setOrigemLead] = useState<OrigemLead | "">(initial.origemLead ?? "");
  const [tipoSite, setTipoSite] = useState<TipoSite | "">(initial.tipoSite ?? "");
  const [temSite, setTemSite] = useState(initial.temSite ?? "");
  const [q, setQ] = useState(initial.q ?? "");
  const [action, setAction] = useState(initial.action ?? "");
  const [followup1Pending, setFollowup1Pending] = useState(initial.followup1Pending ?? "");

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (cidade) params.set("cidade", cidade);
    if (origemLead) params.set("origemLead", origemLead);
    if (tipoSite) params.set("tipoSite", tipoSite);
    if (temSite) params.set("temSite", temSite);
    if (action) params.set("action", action);
    if (followup1Pending) params.set("followup1Pending", followup1Pending);
    router.push(`/empresas?${params.toString()}`);
    onApplied?.();
  }

  function clearFilters() {
    router.push("/empresas");
    onCleared?.();
  }

  return (
    <form onSubmit={applyFilters} className="card card-hover space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Filtros</p>
          <p className="text-xs text-muted">Filtre por status, origem, cidade e site.</p>
        </div>
        <button type="button" onClick={clearFilters} className="text-xs text-primary hover:underline">
          Limpar
        </button>
      </div>

      <Input
        placeholder="Buscar por nome"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full"
      />

      <div className="grid gap-3 md:grid-cols-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFunil | "")}>
          <option value="">Status do funil</option>
          {Object.values(StatusFunil).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>

        <Select value={origemLead} onChange={(e) => setOrigemLead(e.target.value as OrigemLead | "")}>
          <option value="">Origem do lead</option>
          {Object.values(OrigemLead).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Input placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />

        <Select value={tipoSite} onChange={(e) => setTipoSite(e.target.value as TipoSite | "")}>
          <option value="">Tipo de site</option>
          {Object.values(TipoSite).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>

        <Select value={temSite} onChange={(e) => setTemSite(e.target.value)}>
          <option value="">Tem site?</option>
          <option value="true">Sim</option>
          <option value="false">Não</option>
        </Select>
      </div>

      <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-full">
        <option value="">Próxima ação</option>
        <option value="none">Sem próxima ação</option>
        <option value="today">Para hoje</option>
        <option value="overdue">Atrasadas</option>
      </Select>

      <Select value={followup1Pending} onChange={(e) => setFollowup1Pending(e.target.value)} className="w-full">
        <option value="">Follow-up 1</option>
        <option value="true">Pendentes (24h)</option>
      </Select>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-foreground shadow-glow-primary transition hover:bg-primary/90"
        >
          Aplicar filtros
        </button>
      </div>
    </form>
  );
}

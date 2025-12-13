'use client';

import Link from "next/link";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { cn, formatRelative, isToday, isPast } from "@/lib/utils";
import { Button } from "../ui/button";

type AgendaItem = {
  label: string;
  date: Date;
  empresa: { id: string; nome: string; cidade: string };
};

type Props = {
  hoje: AgendaItem[];
  proximos: AgendaItem[];
  onConcluir: (item: AgendaItem) => void;
};

export function AgendaList({ hoje, proximos, onConcluir }: Props) {
  const renderItem = (item: AgendaItem) => (
    <div
      key={`${item.label}-${item.empresa.id}-${item.date.toISOString()}`}
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-stroke/60 bg-background-elevated p-3",
        isPast(item.date) && !isToday(item.date) && "border-amber-700/60",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <CalendarClock size={16} />
        </div>
        <div>
          <Link href={`/empresas/${item.empresa.id}`} className="text-sm font-semibold text-foreground hover:underline">
            {item.empresa.nome}
          </Link>
          <p className="text-xs text-muted">
            {item.label} • {item.empresa.cidade}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted">{formatRelative(item.date)}</span>
        <Button size="sm" variant="outline" className="px-2 py-1 text-[11px]" onClick={() => onConcluir(item)}>
          <CheckCircle2 size={14} /> Concluir
        </Button>
      </div>
    </div>
  );

  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between p-4 pb-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Agenda próxima</p>
          <p className="text-xs text-muted">Follow-ups, reuniões e fechamento</p>
        </div>
      </div>
      <div className="divide-y divide-stroke/60">
        <div className="p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Hoje</p>
          {hoje.length ? hoje.map(renderItem) : <p className="text-xs text-muted">Sem itens para hoje.</p>}
        </div>
        <div className="p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Próximos 3 dias</p>
          {proximos.length ? proximos.map(renderItem) : <p className="text-xs text-muted">Sem itens próximos.</p>}
        </div>
      </div>
    </div>
  );
}

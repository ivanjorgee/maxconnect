import { StatusFunil } from "@prisma/client";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { statusLabels } from "@/lib/dictionaries";
import { cn } from "@/lib/utils";

type Props = {
  counts: Record<StatusFunil, number>;
  selected?: StatusFunil | null;
  onSelect: (status: StatusFunil | null) => void;
};

export function StatusFilterBar({ counts, selected, onSelect }: Props) {
  return (
    <div className="flex w-full gap-2 overflow-x-auto rounded-xl border border-stroke/60 bg-background-elevated p-2">
      <button
        type="button"
        className={cn(
          "whitespace-nowrap rounded-full border border-stroke/60 px-3 py-1 text-xs text-muted transition hover:border-primary/50 hover:text-primary",
          selected === null && "border-primary/60 text-primary",
        )}
        onClick={() => onSelect(null)}
      >
        Todos
      </button>
      {Object.entries(counts).map(([status, count]) => (
        <button
          key={status}
          type="button"
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-full border border-stroke/60 px-3 py-1 text-xs text-muted transition hover:border-primary/60 hover:text-primary",
            selected === status && "border-primary/70 bg-primary/10 text-primary",
          )}
          onClick={() => onSelect(status as StatusFunil)}
        >
          <LeadStatusBadge status={status as StatusFunil} />
          <span className="text-xs text-muted">{statusLabels[status as StatusFunil]}</span>
          <span className="rounded-full bg-background-soft px-2 py-0.5 text-[10px] text-foreground">{count}</span>
        </button>
      ))}
    </div>
  );
}

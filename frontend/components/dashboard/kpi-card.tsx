import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string;
  hint?: string;
  secondary?: { label: string; tone?: "warning" | "danger" | "info" };
  icon?: ReactNode;
  tone?: "default" | "success" | "warning";
  onClick?: () => void;
  progress?: number;
};

export function KpiCard({ title, value, hint, secondary, icon, tone = "default", onClick, progress }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "card card-hover flex flex-col gap-3 p-4 text-left transition hover:border-primary/60",
        tone === "success" && "border-emerald-700/60",
        tone === "warning" && "border-amber-700/60",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted">{title}</p>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      {secondary ? (
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
            secondary.tone === "warning" && "bg-amber-900/40 text-amber-100 border border-amber-800/70",
            secondary.tone === "danger" && "bg-red-900/40 text-red-100 border border-red-800/70",
            secondary.tone === "info" && "bg-background-elevated text-muted border border-stroke/60",
            !secondary.tone && "bg-background-elevated text-muted border border-stroke/60",
          )}
        >
          {secondary.label}
        </span>
      ) : null}
      {typeof progress === "number" ? (
        <div className="mt-1 h-2 w-full rounded-full bg-background-elevated">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-primary/80 to-primary"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </button>
  );
}

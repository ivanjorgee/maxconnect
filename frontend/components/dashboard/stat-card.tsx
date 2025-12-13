import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning";
};

export function StatCard({ title, value, hint, icon, tone = "default" }: Props) {
  return (
    <div className={cn("card card-hover flex flex-col gap-3 p-4", tone === "success" && "border-emerald-700/60")}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted">{title}</p>
        {icon ? <div className="text-primary">{icon}</div> : null}
      </div>
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

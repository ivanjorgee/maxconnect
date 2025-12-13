import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "success" | "warning" | "danger";

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
  default: "bg-background-elevated text-foreground border border-stroke/60",
  outline: "border border-stroke/60 text-muted",
  success: "bg-emerald-900/40 text-emerald-200 border border-emerald-800/80",
  warning: "bg-amber-900/30 text-amber-200 border border-amber-800/70",
  danger: "bg-red-900/30 text-red-200 border border-red-800/70",
};

export function Badge({ className, variant = "default", ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

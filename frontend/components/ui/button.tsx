import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-foreground shadow-glow-primary border border-primary/60 hover:bg-primary/90 active:translate-y-0.5",
  secondary:
    "bg-background-elevated text-foreground border border-stroke/70 hover:border-primary/50 hover:text-primary",
  ghost: "text-muted hover:text-foreground hover:bg-background-elevated border border-transparent",
  outline: "border border-stroke/70 text-foreground hover:border-primary/60",
  destructive: "bg-red-900/60 text-red-50 border border-red-800/70 hover:bg-red-900",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-2 rounded-lg",
  md: "text-sm px-4 py-2.5 rounded-lg",
  lg: "text-base px-5 py-3 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});

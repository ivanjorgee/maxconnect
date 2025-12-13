'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Building2, Users2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/empresas", label: "Empresas", icon: Building2 },
    { href: "/leads", label: "Leads", icon: Users2 },
    { href: "/settings", label: "Configurações", icon: Settings },
  ];

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-stroke/60 bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <span className="text-sm font-semibold">MC</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">MaximosConnect</p>
            <p className="text-[11px] text-muted">CRM B2B</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-stroke/60 bg-background-elevated p-2 text-foreground"
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden">
          <div className="absolute right-0 top-0 h-full w-72 max-w-full bg-background p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Menu</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-stroke/60 bg-background-elevated p-2 text-foreground"
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {links.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition",
                      active
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-stroke/60 bg-background-elevated text-foreground hover:border-primary/40 hover:text-primary",
                    )}
                  >
                    <Icon size={16} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

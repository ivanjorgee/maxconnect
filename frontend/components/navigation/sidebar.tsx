'use client';

import { LayoutDashboard, Building2, Users2, Sparkles, Settings } from "lucide-react";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5 text-primary" /> },
  { href: "/empresas", label: "Empresas", icon: <Building2 className="h-5 w-5 text-primary" /> },
  { href: "/leads", label: "Leads", icon: <Users2 className="h-5 w-5 text-primary" /> },
  { href: "/settings", label: "Configurações", icon: <Settings className="h-5 w-5 text-primary" /> },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-6 h-screen sticky top-0">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo />
          <div className="mt-6 flex flex-col gap-1">{links.map((link) => <SidebarLink key={link.href} link={link} />)}</div>
        </div>
        <SessionCard />
      </SidebarBody>
    </Sidebar>
  );
}

function Logo() {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-primary shadow-glow-primary transition-all",
        "overflow-hidden",
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary flex-shrink-0">
        <Sparkles size={18} />
      </div>
      <div className="leading-tight hidden md:block">
        <p className="text-sm font-semibold text-foreground">MaximosConect</p>
        <p className="text-[11px] text-muted">CRM B2B Estética</p>
      </div>
    </div>
  );
}

function SessionCard() {
  const { open } = useSidebar();
  return (
    <div
      className={cn(
        "rounded-lg border border-primary/40 bg-primary/10 px-3 py-3 text-xs text-muted transition-all duration-200",
        open ? "w-full" : "w-12 flex items-center justify-center",
      )}
    >
      {open ? (
        <>
          Sessão: <span className="text-foreground font-semibold">Dev Ivan</span>
        </>
      ) : (
        <span className="text-foreground font-semibold">DI</span>
      )}
    </div>
  );
}

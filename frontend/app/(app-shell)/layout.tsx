import { ReactNode } from "react";
import { AppSidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import "../globals.css";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space",
});

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${spaceGrotesk.variable} min-h-screen bg-background text-foreground font-sans`}>
      <div className="fixed inset-0 pointer-events-none bg-spotlight opacity-60" aria-hidden />
      <MobileNav />
      <div className="relative z-10 flex min-h-screen">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <main className="flex-1 px-4 pb-8 pt-16 md:pt-6 md:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

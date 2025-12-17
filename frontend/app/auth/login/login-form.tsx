"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(payload.error || "Falha ao autenticar.");
      return;
    }

    const redirectParam = searchParams.get("redirect") || redirectTo || "/";
    startTransition(() => router.push(redirectParam));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md rounded-xl border border-stroke/60 bg-background-elevated p-6 shadow-xl">
        <div className="mb-6 space-y-1 text-center">
          <p className="text-sm font-semibold text-primary">Maxconect Crm</p>
          <h1 className="text-xl font-semibold">Acessar painel</h1>
          <p className="text-xs text-muted">Informe suas credenciais para prosseguir.</p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs text-muted">Email</label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted">Senha</label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha de acesso"
              required
            />
          </div>

          {message ? <p className="text-xs text-red-400">{message}</p> : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

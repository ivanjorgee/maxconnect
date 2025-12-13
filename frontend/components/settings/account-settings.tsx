"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  user: { email: string; name?: string };
};

export function AccountSettings({ user }: Props) {
  const [email, setEmail] = useState(user.email);
  const [name, setName] = useState(user.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    email.trim() !== user.email.trim() ||
    name.trim() !== (user.name ?? "").trim() ||
    newPassword.length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!hasChanges) {
      setError("Nenhuma alteração para salvar.");
      return;
    }

    if (!currentPassword) {
      setError("Informe a senha atual para confirmar as alterações.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("A confirmação da nova senha não confere.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          currentPassword,
          newPassword: newPassword || undefined,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(payload.error || "Não foi possível salvar as alterações.");
        return;
      }

      setMessage("Dados atualizados com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card card-hover space-y-4 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Conta</p>
        <p className="text-xs text-muted">Mantenha seu login protegido. Alterações exigem a senha atual.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted">Nome</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted">Email (login)</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs text-muted">Senha atual</label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted">Nova senha</label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 caracteres"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted">Confirmar nova senha</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted">
          {error ? <span className="text-red-400">{error}</span> : message ? <span className="text-emerald-300">{message}</span> : null}
        </div>
        <Button type="submit" disabled={isPending || !hasChanges}>
          {isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

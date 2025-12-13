'use client';

import { FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Result = {
  imported?: number;
  empresas?: string[];
  error?: string;
};

export function ImportModal({ onImported }: { onImported?: () => void }) {
  const [text, setText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setResult(null);

    startTransition(async () => {
      const response = await fetch("/api/import/empresas-google-maps", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const payload = (await response.json().catch(() => ({}))) as Result;
      if (!response.ok) {
        setMessage(payload.error || "Não foi possível importar.");
        return;
      }
      setResult(payload);
      setMessage(`Importadas ${payload.imported ?? 0} empresas.`);
      setText("");
      onImported?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Importar lista do Google Maps</p>
        <p className="text-xs text-muted">Cole a lista de empresas (nome, endereço, telefone, linhas de cidade). Cada lead receberá um modelo M1–M5 aleatório.</p>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder="Cole aqui toda a lista..."
        required
      />

      {message ? <p className="text-xs text-muted">{message}</p> : null}
      {result?.empresas?.length ? (
        <div className="rounded-lg border border-stroke/60 bg-background-elevated p-2 text-xs text-muted">
          <p className="font-semibold text-foreground">Importadas (amostra):</p>
          <ul className="mt-1 space-y-1">
            {result.empresas.slice(0, 8).map((nome) => (
              <li key={nome}>• {nome}</li>
            ))}
            {result.imported && result.imported > 8 ? <li>... +{result.imported - 8} outras</li> : null}
          </ul>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted">Status: NOVO • Canal: WHATSAPP • Origem: GOOGLE_MAPS • Próxima: MENSAGEM_1 (hoje)</span>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Importando..." : "Importar lista"}
        </Button>
      </div>
    </form>
  );
}

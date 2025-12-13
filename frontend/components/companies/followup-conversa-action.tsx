import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function FollowupConversaAction({ empresaId, template }: { empresaId: string; template: string }) {
  const [pending, startTransition] = useTransition();

  async function handleSend() {
    await navigator.clipboard.writeText(template);
    startTransition(async () => {
      await fetch(`/api/companies/${empresaId}/followup-conversa`, { method: "POST" });
      window.location.reload();
    });
  }

  return (
    <Button variant="primary" size="sm" onClick={handleSend} disabled={pending}>
      {pending ? "Enviando..." : "Marcar follow-up de conversa"}
    </Button>
  );
}

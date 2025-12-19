export const CADENCE_TEMPLATES = {
  M1A: {
    title: "M1A — Permissão rápida",
    text: "Oi! Posso te mandar uma ideia rápida para aumentar os agendamentos pelo WhatsApp?",
  },
  M1B: {
    title: "M1B — Ponto comum",
    text: "Oi! Vi um ponto comum em clínicas do seu segmento no Google/Instagram que costuma travar respostas. Posso explicar em 1 minuto?",
  },
  FU1: {
    title: "Follow-up 1 — Permissão direta",
    text: "Passando rápido: quer que eu te envie o ajuste que costuma destravar respostas no WhatsApp? Se não fizer sentido, me avisa.",
  },
  FU2: {
    title: "Follow-up 2 — Última tentativa",
    text: "Última tentativa por aqui: posso te mandar um resumo objetivo em 2 linhas? Se preferir, encerro.",
  },
  BREAKUP: {
    title: "Break-up — Encerramento gentil",
    text: "Para não insistir, vou encerrar por aqui. Se quiser retomar no futuro, é só responder com ok.",
  },
} as const;

export type CadenceTemplateId = keyof typeof CADENCE_TEMPLATES;
export type CadenceStep = "M1" | "FU1" | "FU2" | "BREAKUP";

export function getCadenceStepForTemplate(templateId: CadenceTemplateId): CadenceStep {
  if (templateId === "FU1") return "FU1";
  if (templateId === "FU2") return "FU2";
  if (templateId === "BREAKUP") return "BREAKUP";
  return "M1";
}

export function resolveM1TemplateId(currentTemplate: string | null | undefined, empresaId: string): "M1A" | "M1B" {
  if (currentTemplate === "M1A" || currentTemplate === "M1B") return currentTemplate;
  return pickM1TemplateId(empresaId);
}

export function pickM1TemplateId(empresaId: string): "M1A" | "M1B" {
  const seed = empresaId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return seed % 2 === 0 ? "M1A" : "M1B";
}

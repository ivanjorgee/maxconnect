import { env } from "./env";

export const CADENCE_TEMPLATES = {
  M1A: {
    title: "M1A — Permissão rápida",
    text: "Oi! Posso te enviar uma ideia rápida para gerar mais agendamentos pelo WhatsApp? É bem curto.",
  },
  M1B: {
    title: "M1B — Ponto específico",
    text: "Oi! Vi um ponto simples no Google/Instagram da clínica. Quer que eu te explique em 1 minuto?",
  },
  FU1: {
    title: "Follow-up 1 — Permissão direta",
    text: "Passando rápido: quer que eu te mande o ajuste que costuma aumentar respostas no WhatsApp? Se não fizer sentido, me avisa.",
  },
  FU2: {
    title: "Follow-up 2 — Última tentativa",
    text: "Última tentativa por aqui: posso te enviar um resumo objetivo em 2 linhas?",
  },
  BREAKUP: {
    title: "Break-up — Encerramento gentil",
    text: "Para não insistir, vou encerrar o contato por enquanto. Se quiser retomar no futuro, é só responder por aqui.",
  },
} as const;

export type CadenceTemplateId = keyof typeof CADENCE_TEMPLATES;
export type CadenceStep = "M1" | "FU1" | "FU2" | "BREAKUP";

const DEFAULT_MAX_ATTEMPTS = 4;
const DEFAULT_NO_RESPONSE_DAYS = 30;

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getCadenceConfig() {
  const maxAttempts = parsePositiveInt(env.CADENCE_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS);
  const noResponseDays = parsePositiveInt(env.CADENCE_NO_RESPONSE_DAYS, DEFAULT_NO_RESPONSE_DAYS);
  return { maxAttempts, noResponseDays };
}

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

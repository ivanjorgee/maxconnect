import {
  Canal,
  ModeloAbertura,
  OrigemLead,
  Prioridade,
  StatusFunil,
  TicketMedioEstimado,
  TipoInteracao,
  TipoSite,
} from "@prisma/client";

export const statusLabels: Record<StatusFunil, string> = {
  NOVO: "Novo",
  MENSAGEM_1_ENVIADA: "Mensagem 1 enviada",
  RESPONDEU: "Respondeu",
  OBJ_CONFIANCA: "Objeção de confiança",
  GATEKEEPER: "Gatekeeper",
  PREVIEW_ENVIADO: "Preview enviado",
  EM_CONVERSA: "Em conversa",
  REUNIAO_AGENDADA: "Reunião agendada",
  REUNIAO_REALIZADA: "Reunião realizada",
  PROPOSTA_ENVIADA: "Proposta enviada",
  SEM_RESPOSTA_30D: "Sem resposta (30d)",
  NURTURE: "Nurture",
  FECHADO: "Fechado",
  PERDIDO: "Perdido",
  FOLLOWUP_LONGO: "Follow-up longo",
};

export const statusTone: Record<StatusFunil, "info" | "warning" | "success" | "danger"> = {
  NOVO: "info",
  MENSAGEM_1_ENVIADA: "info",
  RESPONDEU: "info",
  OBJ_CONFIANCA: "warning",
  GATEKEEPER: "warning",
  PREVIEW_ENVIADO: "info",
  EM_CONVERSA: "info",
  REUNIAO_AGENDADA: "warning",
  REUNIAO_REALIZADA: "warning",
  PROPOSTA_ENVIADA: "warning",
  SEM_RESPOSTA_30D: "warning",
  NURTURE: "info",
  FECHADO: "success",
  PERDIDO: "danger",
  FOLLOWUP_LONGO: "warning",
};

export const tipoSiteLabels: Record<TipoSite, string> = {
  NENHUM: "Nenhum",
  FRACO: "Fraco",
  RAZOAVEL: "Razoável",
  BOM: "Bom",
};

export const origemLabels: Record<OrigemLead, string> = {
  GOOGLE_MAPS: "Google Maps",
  INSTAGRAM: "Instagram",
  INDICACAO: "Indicação",
  OUTRO: "Outro",
};

export const canalLabels: Record<Canal, string> = {
  WHATSAPP: "WhatsApp",
  INSTAGRAM_DM: "Instagram DM",
  LIGACAO: "Ligação",
  EMAIL: "E-mail",
};

export const ticketLabels: Record<TicketMedioEstimado, string> = {
  BAIXO: "Baixo",
  MEDIO: "Médio",
  ALTO: "Alto",
};

export const prioridadeLabels: Record<Prioridade, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

export const modeloAberturaLabels: Record<ModeloAbertura, string> = {
  M1: "Modelo 1",
  M2: "Modelo 2",
  M3: "Modelo 3",
  M4: "Modelo 4",
  M5: "Modelo 5",
};

export const interacaoLabels: Record<TipoInteracao, string> = {
  MENSAGEM_1: "Mensagem 1",
  FOLLOWUP_1: "Follow-up 1",
  FOLLOWUP_2: "Follow-up 2",
  FOLLOWUP_CONVERSA: "Follow-up conversa",
  MENSAGEM_WHATSAPP: "Mensagem WhatsApp",
  MENSAGEM_INSTAGRAM: "Mensagem Instagram",
  LIGACAO: "Ligação",
  REUNIAO: "Reunião",
  BREAKUP: "Break-up",
  OUTRO: "Outro",
};

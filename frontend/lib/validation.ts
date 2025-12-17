import { z } from "zod";
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
import { validatePassword } from "./password";

const trimmedString = z.string().trim();
const nonEmptyString = trimmedString.min(1);

const optionalString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string(),
).optional();

const optionalNullableString = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }
    return value;
  },
  z.union([z.string(), z.null()]),
).optional();

const optionalNumber = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") return undefined;
    if (typeof value === "string") return Number(value);
    return value;
  },
  z.number().finite(),
).optional();

const optionalNullableNumber = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "string") return Number(value);
    return value;
  },
  z.union([z.number().finite(), z.null()]),
).optional();

const optionalBoolean = z.preprocess(
  (value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  },
  z.boolean(),
).optional();

const optionalDate = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") return null;
    return value;
  },
  z.union([z.coerce.date(), z.null()]),
).optional();

const macroValues = [
  "MENSAGEM_1",
  "FOLLOWUP_1",
  "FOLLOWUP_2",
  "REUNIAO_AGENDADA",
  "REUNIAO_REALIZADA",
  "PROPOSTA_ENVIADA",
  "CONVERSA_INICIADA",
  "PERDIDO",
] as const;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const profileUpdateSchema = z
  .object({
    email: z.string().trim().email().optional(),
    name: z.string().trim().min(2).max(80).optional(),
    currentPassword: z.string().min(1),
    newPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword) {
      const validation = validatePassword(data.newPassword);
      if (!validation.ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newPassword"],
          message: validation.message ?? "Senha invalida.",
        });
      }
    }
  });

export const companyCreateSchema = z.object({
  nome: nonEmptyString.max(140),
  endereco: nonEmptyString.max(200),
  cidade: nonEmptyString.max(80),
  linkGoogleMaps: nonEmptyString.max(400),
  canalPrincipal: z.nativeEnum(Canal),
  origemLead: z.nativeEnum(OrigemLead),
  temSite: optionalBoolean,
  tipoSite: z.nativeEnum(TipoSite).optional(),
  telefonePrincipal: optionalString,
  whatsapp: optionalString,
  website: optionalString,
  instagram: optionalString,
  avaliacaoGoogle: optionalNumber,
  qtdAvaliacoes: optionalNumber,
  especialidadePrincipal: optionalString,
  ticketMedioEstimado: z.nativeEnum(TicketMedioEstimado).optional(),
  prioridade: z.nativeEnum(Prioridade).optional(),
  modeloAbertura: z.nativeEnum(ModeloAbertura).optional(),
  tags: z.array(nonEmptyString.max(50)).optional(),
  observacoes: optionalString,
});

export const companyUpdateSchema = z.object({
  nome: optionalNullableString,
  endereco: optionalNullableString,
  cidade: optionalNullableString,
  telefonePrincipal: optionalNullableString,
  whatsapp: optionalNullableString,
  website: optionalNullableString,
  instagram: optionalNullableString,
  linkGoogleMaps: optionalNullableString,
  origemLead: z.nativeEnum(OrigemLead).optional(),
  canalPrincipal: z.nativeEnum(Canal).optional(),
  especialidadePrincipal: optionalNullableString,
  statusFunil: z.nativeEnum(StatusFunil).optional(),
  modeloAbertura: z.nativeEnum(ModeloAbertura).nullable().optional(),
  prioridade: z.nativeEnum(Prioridade).optional(),
  temSite: optionalBoolean,
  tipoSite: z.nativeEnum(TipoSite).nullable().optional(),
  dataFollowup1: optionalDate,
  dataFollowup2: optionalDate,
  dataReuniao: optionalDate,
  dataFechamento: optionalDate,
  tags: z.array(nonEmptyString.max(50)).optional(),
  observacoes: optionalNullableString,
  proximaAcao: nonEmptyString.max(60).nullable().optional(),
  proximaAcaoData: optionalDate,
  dataMensagem1: optionalDate,
  avaliacaoGoogle: optionalNullableNumber,
  qtdAvaliacoes: optionalNullableNumber,
});

export const interacaoSchema = z.object({
  tipo: z.nativeEnum(TipoInteracao),
  canal: z.nativeEnum(Canal),
  data: z.coerce.date(),
  descricao: nonEmptyString.max(500),
});

export const macroSchema = z.object({
  macro: z.enum(macroValues),
  canal: z.nativeEnum(Canal).optional(),
  data: z.coerce.date().optional(),
  modeloAbertura: z.nativeEnum(ModeloAbertura).optional(),
  descricao: trimmedString.max(500).optional(),
});

export const companyIdSchema = z.string().cuid();

export const companyListQuerySchema = z.object({
  cidade: optionalString,
  canal: z.nativeEnum(Canal).optional(),
  status: z.nativeEnum(StatusFunil).optional(),
  origemLead: z.nativeEnum(OrigemLead).optional(),
  tipoSite: z.nativeEnum(TipoSite).optional(),
  q: optionalString,
  temSite: optionalBoolean,
  action: z.enum(["none", "today", "overdue"]).optional(),
  followup1Pending: optionalBoolean,
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
});

export const importEmpresasSchema = z.object({
  text: trimmedString.min(1).max(20000),
});

export function formatZodError(error: z.ZodError) {
  return error.flatten();
}

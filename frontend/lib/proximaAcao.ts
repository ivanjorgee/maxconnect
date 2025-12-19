import { Prisma, StatusFunil, TipoInteracao, Canal, ModeloAbertura } from "@prisma/client";
import { prisma } from "./prisma";
import { ProximaAcao } from "./proxima-acao";

export type { ProximaAcao } from "./proxima-acao";

type ContextoProximaAcao = {
  statusFunil: StatusFunil;
  dataReuniao?: Date | null;
  proximaAcao?: ProximaAcao | null;
  proximaAcaoData?: Date | null;
};

export function getProximaAcaoSugerida(ctx: ContextoProximaAcao): { proximaAcao: ProximaAcao | null; proximaAcaoData: Date | null } {
  const agora = new Date();
  const hoje = startOfDay(agora);

  if (ctx.statusFunil === StatusFunil.MENSAGEM_1_ENVIADA) {
    // follow-up 1 exatamente 24h depois da mensagem enviada
    return { proximaAcao: "FOLLOW_UP_1", proximaAcaoData: addHours(agora, 24) };
  }

  if (ctx.proximaAcao === "FOLLOW_UP_1" || ctx.statusFunil === StatusFunil.RESPONDEU) {
    return { proximaAcao: "FOLLOW_UP_2", proximaAcaoData: addDays(hoje, 3) };
  }

  if (ctx.statusFunil === StatusFunil.EM_CONVERSA) {
    // manter ação atual se existir; caso contrário sugerir follow-up curto
    return ctx.proximaAcao
      ? { proximaAcao: ctx.proximaAcao, proximaAcaoData: ctx.proximaAcaoData ?? addDays(hoje, 2) }
      : { proximaAcao: "FOLLOW_UP_1", proximaAcaoData: addDays(hoje, 2) };
  }

  if (ctx.statusFunil === StatusFunil.REUNIAO_AGENDADA) {
    return { proximaAcao: "REALIZAR_REUNIAO", proximaAcaoData: ctx.dataReuniao ?? hoje };
  }

  if (ctx.statusFunil === StatusFunil.REUNIAO_REALIZADA) {
    return { proximaAcao: "ENVIAR_PROPOSTA", proximaAcaoData: addDays(hoje, 1) };
  }

  if (ctx.statusFunil === StatusFunil.PROPOSTA_ENVIADA) {
    return { proximaAcao: "FOLLOW_UP_1", proximaAcaoData: addDays(hoje, 2) };
  }

  if (
    ctx.statusFunil === StatusFunil.FECHADO ||
    ctx.statusFunil === StatusFunil.PERDIDO ||
    ctx.statusFunil === StatusFunil.FOLLOWUP_LONGO
  ) {
    return { proximaAcao: null, proximaAcaoData: null };
  }

  return { proximaAcao: ctx.proximaAcao ?? null, proximaAcaoData: ctx.proximaAcaoData ?? null };
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(base.getDate() + days);
  return next;
}

function addHours(base: Date, hours: number) {
  const next = new Date(base);
  next.setHours(base.getHours() + hours);
  return next;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export type MacroTipo =
  | "MENSAGEM_1"
  | "FOLLOWUP_1"
  | "FOLLOWUP_2"
  | "REUNIAO_AGENDADA"
  | "REUNIAO_REALIZADA"
  | "PROPOSTA_ENVIADA"
  | "CONVERSA_INICIADA"
  | "PERDIDO";

const macroConfig: Record<
  MacroTipo,
  {
    tipoInteracao: TipoInteracao;
    novoStatus: StatusFunil;
    descricao: (input: { modeloAbertura?: ModeloAbertura | null }) => string;
    proximaAcao?: ProximaAcao | null;
    proximaAcaoOffsetDays?: number;
    proximaAcaoOffsetHours?: number;
    proximaAcaoData?: Date | null;
  }
> = {
  MENSAGEM_1: {
    tipoInteracao: TipoInteracao.MENSAGEM_1,
    novoStatus: StatusFunil.MENSAGEM_1_ENVIADA,
    descricao: ({ modeloAbertura }) => `Mensagem 1 enviada${modeloAbertura ? ` (modelo ${modeloAbertura})` : ""}.`,
    proximaAcao: "FOLLOW_UP_1",
    proximaAcaoOffsetHours: 24,
  },
  FOLLOWUP_1: {
    tipoInteracao: TipoInteracao.FOLLOWUP_1,
    novoStatus: StatusFunil.MENSAGEM_1_ENVIADA,
    descricao: () => "Follow-up 1 enviado.",
    proximaAcao: "FOLLOW_UP_2",
    proximaAcaoOffsetDays: 3,
  },
  FOLLOWUP_2: {
    tipoInteracao: TipoInteracao.FOLLOWUP_2,
    novoStatus: StatusFunil.FOLLOWUP_LONGO,
    descricao: () => "Follow-up 2 enviado.",
    proximaAcao: "FOLLOW_UP_LONGO",
    proximaAcaoOffsetDays: 90, // follow-up longo em ~3 meses
  },
  REUNIAO_AGENDADA: {
    tipoInteracao: TipoInteracao.REUNIAO,
    novoStatus: StatusFunil.REUNIAO_AGENDADA,
    descricao: () => "Reunião agendada.",
    proximaAcao: "REALIZAR_REUNIAO",
  },
  REUNIAO_REALIZADA: {
    tipoInteracao: TipoInteracao.REUNIAO,
    novoStatus: StatusFunil.REUNIAO_REALIZADA,
    descricao: () => "Reunião realizada.",
    proximaAcao: "ENVIAR_PROPOSTA",
    proximaAcaoOffsetDays: 1,
  },
  PROPOSTA_ENVIADA: {
    tipoInteracao: TipoInteracao.OUTRO,
    novoStatus: StatusFunil.PROPOSTA_ENVIADA,
    descricao: () => "Proposta enviada.",
    proximaAcao: "FOLLOW_UP_1",
    proximaAcaoOffsetDays: 2,
  },
  CONVERSA_INICIADA: {
    tipoInteracao: TipoInteracao.FOLLOWUP_CONVERSA,
    novoStatus: StatusFunil.EM_CONVERSA,
    descricao: () => "Conversa iniciada com o lead.",
    proximaAcao: null,
  },
  PERDIDO: {
    tipoInteracao: TipoInteracao.OUTRO,
    novoStatus: StatusFunil.PERDIDO,
    descricao: () => "Lead marcado como perdido.",
    proximaAcao: null,
    proximaAcaoData: null,
  },
};

export async function registrarInteracaoMacro(params: {
  empresaId: string;
  macro: MacroTipo;
  canal?: Canal | null;
  data?: Date | string | null;
  modeloAbertura?: ModeloAbertura | null;
  descricaoExtra?: string | null;
}) {
  const empresa = await prisma.empresa.findUnique({ where: { id: params.empresaId } });
  if (!empresa) {
    throw new Error("Empresa não encontrada");
  }

  const cfg = macroConfig[params.macro];
  const agora = new Date();
  const dataInteracao = params.data ? new Date(params.data) : agora;
  const dataReuniaoEscolhida =
    params.macro === "REUNIAO_AGENDADA" && params.data ? new Date(params.data) : empresa.dataReuniao ?? null;
  const baseTime = dataInteracao;

  const proximaData =
    cfg.proximaAcao === "REALIZAR_REUNIAO" && dataReuniaoEscolhida
      ? dataReuniaoEscolhida
      : cfg.proximaAcaoData !== undefined
        ? cfg.proximaAcaoData
        : cfg.proximaAcaoOffsetHours
          ? addHours(baseTime, cfg.proximaAcaoOffsetHours)
          : cfg.proximaAcaoOffsetDays
            ? addDays(startOfDay(baseTime), cfg.proximaAcaoOffsetDays)
            : null;

  const descricao = `${cfg.descricao({ modeloAbertura: params.modeloAbertura ?? empresa.modeloAbertura })}${
    params.descricaoExtra ? ` ${params.descricaoExtra}` : ""
  }`;

  return prisma.$transaction(async (tx) => {
    await tx.interacao.create({
      data: {
        empresaId: empresa.id,
        tipo: cfg.tipoInteracao,
        canal: params.canal ?? empresa.canalPrincipal,
        data: dataInteracao,
        descricao,
      },
    });

    const updateData: Prisma.EmpresaUpdateInput = {
      statusFunil: cfg.novoStatus,
      proximaAcao: cfg.proximaAcao !== undefined ? cfg.proximaAcao : empresa.proximaAcao,
      proximaAcaoData:
        cfg.proximaAcaoData !== undefined ? cfg.proximaAcaoData : proximaData ?? empresa.proximaAcaoData ?? null,
      dataMensagem1: cfg.novoStatus === StatusFunil.MENSAGEM_1_ENVIADA ? dataInteracao : empresa.dataMensagem1,
      dataFollowup1: params.macro === "FOLLOWUP_1" ? dataInteracao : empresa.dataFollowup1,
      dataFollowup2: params.macro === "FOLLOWUP_2" ? dataInteracao : empresa.dataFollowup2,
      dataReuniao: cfg.novoStatus === StatusFunil.REUNIAO_AGENDADA ? dataReuniaoEscolhida : empresa.dataReuniao,
      modeloAbertura: params.modeloAbertura ?? empresa.modeloAbertura ?? undefined,
    };

    const updated = await tx.empresa.update({
      where: { id: empresa.id },
      data: updateData,
      include: {
        interacoes: {
          orderBy: { data: "desc" },
          take: 5,
          select: { id: true, tipo: true, canal: true, data: true, descricao: true, createdAt: true },
        },
      },
    });

    return updated;
  });
}

export async function registerFollowupConversa(empresaId: string) {
  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
  if (!empresa) throw new Error("Empresa não encontrada");
  const agora = new Date();
  return prisma.$transaction(async (tx) => {
    await tx.interacao.create({
      data: {
        empresaId: empresa.id,
        tipo: TipoInteracao.FOLLOWUP_CONVERSA,
        canal: empresa.canalPrincipal,
        data: agora,
        descricao: "Follow-up de conversa enviado após 24h sem avanço.",
      },
    });

    const updated = await tx.empresa.update({
      where: { id: empresa.id },
      data: {
        statusFunil: StatusFunil.EM_CONVERSA,
        proximaAcao: "AGUARDANDO_RESPOSTA_CONVERSA",
        proximaAcaoData: new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000),
        updatedAt: agora,
      },
      include: {
        interacoes: {
          orderBy: { data: "desc" },
          take: 5,
          select: { id: true, tipo: true, canal: true, data: true, descricao: true, createdAt: true },
        },
      },
    });
    return updated;
  });
}

import {
  Canal,
  ModeloAbertura,
  OrigemLead,
  Prisma,
  Prioridade,
  StatusFunil,
  TicketMedioEstimado,
  TipoInteracao,
  TipoSite,
  InteracaoDirection,
  InteracaoOutcome,
} from "@prisma/client";
import { prisma } from "./prisma";
import { getCadenceConfig } from "./cadence-config";

const interacoesSelect = {
  id: true,
  tipo: true,
  canal: true,
  data: true,
  descricao: true,
  direction: true,
  templateId: true,
  outcome: true,
  createdAt: true,
};

export type EmpresaWithInteracoes = Prisma.EmpresaGetPayload<{
  include: { interacoes: { select: typeof interacoesSelect } };
}>;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type DashboardData = {
  totalEmpresas: number;
  porStatus: Record<StatusFunil, number>;
  fechados7: number;
  fechados30: number;
  fechadosMes: number;
  metaMes: number;
  leadsQuentes: number;
  tarefasHoje: number;
  followupsHoje: number;
  atrasadas: number;
  semProximaAcao: number;
  empresasEmProspeccao: number;
  mensagens1Hoje: number;
  respostasHoje: number;
  taxaRespostaHoje: number;
  emConversa: number;
  reunioesAgendadas: number;
  followUps1PendentesCount: number;
  followUpsConversaPendentesCount: number;
  proximasDatas: Array<{ label: string; date: Date; empresa: Pick<EmpresaWithInteracoes, "id" | "nome" | "cidade"> }>;
  proximasInteracoes: Prisma.InteracaoGetPayload<{ include: { empresa: true } }>[];
  interacoesRecentes: Prisma.InteracaoGetPayload<{ include: { empresa: true } }>[];
  trend7d: Array<{ date: Date; label: string; mensagens1: number; respostas: number }>;
  trend30d: Array<{ date: Date; label: string; mensagens1: number; respostas: number }>;
  replyRateByTemplate: Array<{ templateId: string; outbound: number; inbound: number; rate: number }>;
  stepUp: {
    respondeu: number;
    emConversa: number;
    proposta: number;
    fechado: number;
    rateConversa: number;
    rateProposta: number;
    rateFechado: number;
    rateFechadoSobreResposta: number;
  };
  prioritizedActions: Array<{
    empresa: { id: string; nome: string; cidade: string };
    label: string;
    tipo: "FOLLOWUP_1" | "FOLLOWUP_CONVERSA" | "REUNIAO" | "PROXIMA_ACAO";
    date: Date;
  }>;
};

type EmpresaFilters = {
  cidade?: string | null;
  canal?: Canal | null;
  status?: StatusFunil | null;
  temSite?: boolean | null;
  origemLead?: OrigemLead | null;
  tipoSite?: TipoSite | null;
  busca?: string | null;
  contato?: string | null;
  action?: "none" | "today" | "overdue" | null;
  followup1Pending?: boolean;
  followupConversaPending?: boolean;
};

const DEFAULT_PAGE_SIZE = 50;
const DASHBOARD_CACHE_TTL_MS = 30 * 1000;
let dashboardCache: { data: DashboardData; expiresAt: number } | null = null;

async function resolvePendingIds(filters?: EmpresaFilters): Promise<string[] | null> {
  let pendingIds: string[] | null = null;
  if (filters?.followup1Pending) {
    const pendentes = await getEmpresasPendentesFollowUp1();
    pendingIds = pendentes.map((e) => e.id);
    if (!pendingIds.length) return [];
  }
  if (filters?.followupConversaPending) {
    const pendentes = await getEmpresasPendentesFollowUpConversa();
    pendingIds = pendentes.map((e) => e.id);
    if (!pendingIds.length) return [];
  }
  return pendingIds;
}

function buildEmpresaWhere(filters: EmpresaFilters | undefined, pendingIds: string[] | null): Prisma.EmpresaWhereInput {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  const where: Prisma.EmpresaWhereInput = {
    cidade: filters?.cidade || undefined,
    origemLead: filters?.origemLead || undefined,
    tipoSite: filters?.tipoSite || undefined,
    canalPrincipal: filters?.canal || undefined,
    statusFunil: filters?.status || undefined,
    temSite: typeof filters?.temSite === "boolean" ? filters.temSite : undefined,
    proximaAcao: filters?.action === "none" ? null : undefined,
    proximaAcaoData:
      filters?.action === "today"
        ? { gte: start, lte: end }
        : filters?.action === "overdue"
          ? { lt: start }
      : undefined,
    nome: filters?.busca
      ? {
          contains: filters.busca,
          mode: "insensitive",
        }
      : undefined,
    id: pendingIds ? { in: pendingIds } : undefined,
  };

  if (filters?.contato) {
    const contact = filters.contato.trim();
    where.AND = [
      ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
      {
        OR: [
          { telefonePrincipal: { contains: contact, mode: "insensitive" } },
          { whatsapp: { contains: contact, mode: "insensitive" } },
        ],
      },
    ];
  }

  return where;
}

export async function getEmpresas(filters?: EmpresaFilters): Promise<EmpresaWithInteracoes[]> {
  const pendingIds = await resolvePendingIds(filters);
  if (pendingIds && pendingIds.length === 0) return [];

  return prisma.empresa.findMany({
    where: buildEmpresaWhere(filters, pendingIds),
    include: {
      interacoes: {
        orderBy: { data: "desc" },
        take: 5,
        select: interacoesSelect,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getEmpresasPage(
  filters?: EmpresaFilters,
  pagination?: { page?: number; pageSize?: number },
): Promise<PaginatedResult<EmpresaWithInteracoes>> {
  const pendingIds = await resolvePendingIds(filters);
  if (pendingIds && pendingIds.length === 0) {
    return { items: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE, pageCount: 0 };
  }

  const page = pagination?.page && pagination.page > 0 ? pagination.page : 1;
  const pageSize = pagination?.pageSize && pagination.pageSize > 0 ? pagination.pageSize : DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;
  const where = buildEmpresaWhere(filters, pendingIds);

  const [items, total] = await prisma.$transaction([
    prisma.empresa.findMany({
      where,
      include: {
        interacoes: {
          orderBy: { data: "desc" },
          take: 5,
          select: interacoesSelect,
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.empresa.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function getStatusCounts(): Promise<Record<StatusFunil, number>> {
  const grouped = await prisma.empresa.groupBy({
    by: ["statusFunil"],
    _count: { _all: true },
  });

  return Object.values(StatusFunil).reduce((acc, status) => {
    const entry = grouped.find((item) => item.statusFunil === status);
    acc[status] = entry?._count._all ?? 0;
    return acc;
  }, {} as Record<StatusFunil, number>);
}

export async function getEmpresaById(id: string): Promise<EmpresaWithInteracoes | null> {
  return prisma.empresa.findUnique({
    where: { id },
    include: { interacoes: { orderBy: { data: "desc" }, select: interacoesSelect } },
  });
}

export async function createEmpresa(data: {
  nome: string;
  endereco: string;
  cidade: string;
  linkGoogleMaps: string;
  canalPrincipal: Canal;
  origemLead: OrigemLead;
  temSite?: boolean;
  tipoSite?: TipoSite;
  telefonePrincipal?: string;
  whatsapp?: string;
  website?: string;
  instagram?: string;
  avaliacaoGoogle?: number;
  qtdAvaliacoes?: number;
  especialidadePrincipal?: string;
  ticketMedioEstimado?: TicketMedioEstimado;
  prioridade?: Prioridade;
  modeloAbertura?: ModeloAbertura;
  tags?: string[];
  observacoes?: string;
  proximaAcao?: string | null;
  proximaAcaoData?: Date | string | null;
}) {
  return prisma.empresa.create({
    data: {
      ...data,
      statusFunil: StatusFunil.NOVO,
      tags: data.tags ?? [],
    },
  });
}

export async function updateEmpresa(
  id: string,
  data: Partial<
    Pick<
      EmpresaWithInteracoes,
      | "nome"
      | "endereco"
      | "cidade"
      | "telefonePrincipal"
      | "whatsapp"
      | "website"
      | "instagram"
      | "linkGoogleMaps"
      | "origemLead"
      | "canalPrincipal"
      | "especialidadePrincipal"
      | "statusFunil"
      | "modeloAbertura"
      | "prioridade"
      | "temSite"
      | "tipoSite"
      | "dataFollowup1"
      | "dataFollowup2"
      | "dataReuniao"
      | "dataFechamento"
      | "tags"
      | "observacoes"
      | "proximaAcao"
      | "proximaAcaoData"
    > & { dataMensagem1?: Date | string | null }
  >,
) {
  return prisma.empresa.update({
    where: { id },
    data,
  });
}

export async function createInteracao(input: {
  empresaId: string;
  tipo: TipoInteracao;
  canal: Canal;
  data: Date | string;
  descricao: string;
  direction?: InteracaoDirection | null;
  templateId?: string | null;
  outcome?: InteracaoOutcome | null;
}) {
  return prisma.interacao.create({
    data: {
      empresaId: input.empresaId,
      tipo: input.tipo,
      canal: input.canal,
      data: new Date(input.data),
      descricao: input.descricao,
      direction: input.direction ?? undefined,
      templateId: input.templateId ?? undefined,
      outcome: input.outcome ?? undefined,
    },
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = Date.now();
  if (dashboardCache && dashboardCache.expiresAt > now) {
    return dashboardCache.data;
  }

  const { start, end } = getTodayRange();
  const followUps1PendentesPromise = getEmpresasPendentesFollowUp1();
  const followUpsConversaPendentesPromise = getEmpresasPendentesFollowUpConversa();

  const responseStatuses = [
    StatusFunil.RESPONDEU,
    StatusFunil.OBJ_CONFIANCA,
    StatusFunil.GATEKEEPER,
    StatusFunil.PREVIEW_ENVIADO,
    StatusFunil.EM_CONVERSA,
    StatusFunil.REUNIAO_AGENDADA,
    StatusFunil.REUNIAO_REALIZADA,
    StatusFunil.PROPOSTA_ENVIADA,
    StatusFunil.FECHADO,
  ];

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000);

  const [
    totalEmpresas,
    empresasEmProspeccao,
    mensagens1Hoje,
    respostasHoje,
    emConversaCount,
    reunioesAgendadasCount,
    leadsQuentes,
    tarefasHoje,
    tarefasAtrasadas,
    semProximaAcao,
    porStatus,
    replyRateByTemplate,
    fechados7,
    fechados30,
    fechadosMes,
  ] = await Promise.all([
    prisma.empresa.count(),
    prisma.empresa.count({ where: { statusFunil: { notIn: [StatusFunil.FECHADO, StatusFunil.PERDIDO] } } }),
    prisma.interacao.count({ where: { tipo: TipoInteracao.MENSAGEM_1, data: { gte: start, lte: end } } }),
    prisma.empresa.count({ where: { statusFunil: { in: responseStatuses }, updatedAt: { gte: start, lte: end } } }),
    prisma.empresa.count({ where: { statusFunil: StatusFunil.EM_CONVERSA } }),
    prisma.empresa.count({
      where: {
        statusFunil: StatusFunil.REUNIAO_AGENDADA,
        OR: [{ dataReuniao: null }, { dataReuniao: { gte: start } }],
      },
    }),
    prisma.empresa.count({ where: { statusFunil: { in: [StatusFunil.EM_CONVERSA, StatusFunil.REUNIAO_AGENDADA] } } }),
    prisma.empresa.count({ where: { proximaAcaoData: { gte: start, lte: end } } }),
    prisma.empresa.count({ where: { proximaAcaoData: { lt: start } } }),
    prisma.empresa.count({
      where: {
        proximaAcaoData: null,
        OR: [{ proximaAcao: null }, { proximaAcao: "" }],
      },
    }),
    getStatusCounts(),
    getReplyRateByTemplate(["M1A", "M1B"]),
    prisma.empresa.count({
      where: {
        statusFunil: StatusFunil.FECHADO,
        OR: [
          { dataFechamento: { gte: daysAgo(7) } },
          { dataFechamento: null, updatedAt: { gte: daysAgo(7) } },
        ],
      },
    }),
    prisma.empresa.count({
      where: {
        statusFunil: StatusFunil.FECHADO,
        OR: [
          { dataFechamento: { gte: daysAgo(30) } },
          { dataFechamento: null, updatedAt: { gte: daysAgo(30) } },
        ],
      },
    }),
    prisma.empresa.count({
      where: {
        statusFunil: StatusFunil.FECHADO,
        OR: [
          { dataFechamento: { gte: startOfMonth } },
          { dataFechamento: null, updatedAt: { gte: startOfMonth } },
        ],
      },
    }),
  ]);

  const [followUps1Pendentes, followUpsConversaPendentes, proximasDatas, trend30d, proximasInteracoes, interacoesRecentes, reunioesHoje] =
    await Promise.all([
      followUps1PendentesPromise,
      followUpsConversaPendentesPromise,
      getProximasDatas(),
      getTrendData(30, responseStatuses),
      prisma.interacao.findMany({ include: { empresa: true }, orderBy: { data: "asc" }, take: 5 }),
      prisma.interacao.findMany({ include: { empresa: true }, orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.empresa.findMany({
        where: { dataReuniao: { gte: start, lte: end } },
        select: { id: true, nome: true, cidade: true, dataReuniao: true },
      }),
    ]);

  const taxaRespostaHoje = mensagens1Hoje ? (respostasHoje / mensagens1Hoje) * 100 : 0;
  const trend7d = trend30d.slice(-7);
  const metaMes = 30;
  const respondeuCount = porStatus[StatusFunil.RESPONDEU] ?? 0;
  const emConversaCountTotal =
    (porStatus[StatusFunil.EM_CONVERSA] ?? 0) +
    (porStatus[StatusFunil.OBJ_CONFIANCA] ?? 0) +
    (porStatus[StatusFunil.GATEKEEPER] ?? 0) +
    (porStatus[StatusFunil.PREVIEW_ENVIADO] ?? 0) +
    (porStatus[StatusFunil.REUNIAO_AGENDADA] ?? 0) +
    (porStatus[StatusFunil.REUNIAO_REALIZADA] ?? 0) +
    (porStatus[StatusFunil.PROPOSTA_ENVIADA] ?? 0) +
    (porStatus[StatusFunil.FECHADO] ?? 0);
  const propostaCount =
    (porStatus[StatusFunil.PROPOSTA_ENVIADA] ?? 0) + (porStatus[StatusFunil.FECHADO] ?? 0);
  const fechadoCount = porStatus[StatusFunil.FECHADO] ?? 0;
  const stepUp = {
    respondeu: respondeuCount,
    emConversa: emConversaCountTotal,
    proposta: propostaCount,
    fechado: fechadoCount,
    rateConversa: respondeuCount ? (emConversaCountTotal / respondeuCount) * 100 : 0,
    rateProposta: emConversaCountTotal ? (propostaCount / emConversaCountTotal) * 100 : 0,
    rateFechado: propostaCount ? (fechadoCount / propostaCount) * 100 : 0,
    rateFechadoSobreResposta: respondeuCount ? (fechadoCount / respondeuCount) * 100 : 0,
  };

  const urgentFollowup1 = followUps1Pendentes.map((empresa) => ({
    empresa: { id: empresa.id, nome: empresa.nome, cidade: empresa.cidade },
    label: "Follow-up 1",
    tipo: "FOLLOWUP_1" as const,
    date: empresa.dataMensagem1 ?? empresa.updatedAt,
  }));
  const urgentConversa = followUpsConversaPendentes.map((empresa) => ({
    empresa: { id: empresa.id, nome: empresa.nome, cidade: empresa.cidade },
    label: "Follow-up de conversa",
    tipo: "FOLLOWUP_CONVERSA" as const,
    date: empresa.updatedAt,
  }));
  const reunioesHojeList = reunioesHoje
    .filter((empresa) => empresa.dataReuniao)
    .map((empresa) => ({
      empresa: { id: empresa.id, nome: empresa.nome, cidade: empresa.cidade },
      label: "Reunião hoje",
      tipo: "REUNIAO" as const,
      date: empresa.dataReuniao as Date,
    }));

  const prioritizedActions = [...urgentFollowup1, ...urgentConversa, ...reunioesHojeList]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 8);

  const data = {
    totalEmpresas,
    porStatus,
    fechados7,
    fechados30,
    fechadosMes,
    metaMes,
    leadsQuentes,
    tarefasHoje,
    followupsHoje: proximasDatas.filter((item) => item.label.toLowerCase().includes("follow") && isSameDay(item.date, new Date())).length,
    atrasadas: tarefasAtrasadas,
    semProximaAcao,
    empresasEmProspeccao,
    mensagens1Hoje,
    respostasHoje,
    taxaRespostaHoje,
    emConversa: emConversaCount,
    reunioesAgendadas: reunioesAgendadasCount,
    followUps1PendentesCount: followUps1Pendentes.length,
    followUpsConversaPendentesCount: followUpsConversaPendentes.length,
    proximasDatas,
    proximasInteracoes,
    interacoesRecentes,
    trend30d,
    trend7d,
    replyRateByTemplate,
    stepUp,
    prioritizedActions,
  };

  dashboardCache = { data, expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS };
  return data;
}

async function getProximasDatas(): Promise<DashboardData["proximasDatas"]> {
  const [proximaAcaoRows, followup1Rows, followup2Rows, reuniaoRows, fechamentoRows] = await Promise.all([
    prisma.empresa.findMany({
      where: {
        proximaAcaoData: { not: null },
        proximaAcao: { not: null },
        NOT: { proximaAcao: "" },
      },
      orderBy: { proximaAcaoData: "asc" },
      take: 5,
      select: { id: true, nome: true, cidade: true, proximaAcao: true, proximaAcaoData: true },
    }),
    prisma.empresa.findMany({
      where: { dataFollowup1: { not: null } },
      orderBy: { dataFollowup1: "asc" },
      take: 5,
      select: { id: true, nome: true, cidade: true, dataFollowup1: true },
    }),
    prisma.empresa.findMany({
      where: { dataFollowup2: { not: null } },
      orderBy: { dataFollowup2: "asc" },
      take: 5,
      select: { id: true, nome: true, cidade: true, dataFollowup2: true },
    }),
    prisma.empresa.findMany({
      where: { dataReuniao: { not: null } },
      orderBy: { dataReuniao: "asc" },
      take: 5,
      select: { id: true, nome: true, cidade: true, dataReuniao: true },
    }),
    prisma.empresa.findMany({
      where: { dataFechamento: { not: null } },
      orderBy: { dataFechamento: "asc" },
      take: 5,
      select: { id: true, nome: true, cidade: true, dataFechamento: true },
    }),
  ]);

  const entries: Array<{ label: string; date: Date; empresa: { id: string; nome: string; cidade: string } }> = [];

  for (const row of proximaAcaoRows) {
    if (!row.proximaAcao || !row.proximaAcaoData) continue;
    entries.push({
      label: row.proximaAcao,
      date: row.proximaAcaoData,
      empresa: { id: row.id, nome: row.nome, cidade: row.cidade },
    });
  }
  for (const row of followup1Rows) {
    if (!row.dataFollowup1) continue;
    entries.push({
      label: "Follow-up 1",
      date: row.dataFollowup1,
      empresa: { id: row.id, nome: row.nome, cidade: row.cidade },
    });
  }
  for (const row of followup2Rows) {
    if (!row.dataFollowup2) continue;
    entries.push({
      label: "Follow-up 2",
      date: row.dataFollowup2,
      empresa: { id: row.id, nome: row.nome, cidade: row.cidade },
    });
  }
  for (const row of reuniaoRows) {
    if (!row.dataReuniao) continue;
    entries.push({
      label: "Reunião",
      date: row.dataReuniao,
      empresa: { id: row.id, nome: row.nome, cidade: row.cidade },
    });
  }
  for (const row of fechamentoRows) {
    if (!row.dataFechamento) continue;
    entries.push({
      label: "Fechamento",
      date: row.dataFechamento,
      empresa: { id: row.id, nome: row.nome, cidade: row.cidade },
    });
  }

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
}

async function getTrendData(days: number, responseStatuses: StatusFunil[]) {
  const end = new Date();
  const start = startOfDay(addDays(end, -(days - 1)));
  const dateKey = (value: Date) => value.toISOString().slice(0, 10);
  const mensagemTipo = Prisma.sql`${TipoInteracao.MENSAGEM_1}::"TipoInteracao"`;
  const responseStatusesSql = Prisma.join(
    responseStatuses.map((status) => Prisma.sql`${status}::"StatusFunil"`)
  );

  const mensagensRows = await prisma.$queryRaw<{ day: Date; count: number }[]>(Prisma.sql`
    SELECT date_trunc('day', "data") AS day, COUNT(*)::int AS count
    FROM "Interacao"
    WHERE "tipo" = ${mensagemTipo}
      AND "data" >= ${start}
    GROUP BY day
  `);

  const respostasRows = await prisma.$queryRaw<{ day: Date; count: number }[]>(Prisma.sql`
    SELECT date_trunc('day', "updatedAt") AS day, COUNT(*)::int AS count
    FROM "Empresa"
    WHERE "statusFunil" IN (${responseStatusesSql})
      AND "updatedAt" >= ${start}
    GROUP BY day
  `);

  const mensagensMap = new Map(mensagensRows.map((row) => [dateKey(row.day), row.count]));
  const respostasMap = new Map(respostasRows.map((row) => [dateKey(row.day), row.count]));

  return Array.from({ length: days }).map((_, idx) => {
    const day = addDays(start, idx);
    const key = dateKey(day);
    return {
      date: day,
      label: day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      mensagens1: mensagensMap.get(key) ?? 0,
      respostas: respostasMap.get(key) ?? 0,
    };
  });
}

async function getReplyRateByTemplate(templateIds: string[]) {
  if (!templateIds.length) return [];
  const [outboundRows, inboundRows] = await Promise.all([
    prisma.interacao.groupBy({
      by: ["templateId"],
      where: {
        direction: InteracaoDirection.OUTBOUND,
        templateId: { in: templateIds },
      },
      _count: { _all: true },
    }),
    prisma.interacao.groupBy({
      by: ["templateId"],
      where: {
        direction: InteracaoDirection.INBOUND,
        templateId: { in: templateIds },
      },
      _count: { _all: true },
    }),
  ]);

  const outboundMap = new Map(outboundRows.map((row) => [row.templateId ?? "", row._count._all]));
  const inboundMap = new Map(inboundRows.map((row) => [row.templateId ?? "", row._count._all]));

  return templateIds.map((templateId) => {
    const outbound = outboundMap.get(templateId) ?? 0;
    const inbound = inboundMap.get(templateId) ?? 0;
    const rate = outbound ? (inbound / outbound) * 100 : 0;
    return { templateId, outbound, inbound, rate };
  });
}

export async function ensureFollowup2Consistency() {
  // Garantir que follow-up 2 mova o status para FOLLOWUP_LONGO (casos antigos em EM_CONVERSA)
  await prisma.empresa.updateMany({
    where: {
      statusFunil: StatusFunil.EM_CONVERSA,
      proximaAcao: "FOLLOW_UP_LONGO",
    },
    data: {
      statusFunil: StatusFunil.FOLLOWUP_LONGO,
    },
  });
}

export async function applyNoResponseCadenceStop() {
  const { maxAttempts, noResponseDays } = getCadenceConfig();
  const now = new Date();
  const noResponseUntil = addDays(startOfDay(now), noResponseDays);

  const result = await prisma.empresa.updateMany({
    where: {
      attemptCount: { gte: maxAttempts },
      lastInboundAt: null,
      statusFunil: {
        notIn: [StatusFunil.FECHADO, StatusFunil.PERDIDO, StatusFunil.SEM_RESPOSTA_30D],
      },
    },
    data: {
      statusFunil: StatusFunil.SEM_RESPOSTA_30D,
      noResponseUntil,
      proximaAcao: null,
      proximaAcaoData: null,
    },
  });

  return { updated: result.count };
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getTodayRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  return { start, end };
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(base.getDate() + days);
  return next;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Agenda Follow-up 1 para empresas que receberam Mensagem 1 hoje e não têm próxima ação definida.
 * Define proximaAcao="FOLLOW_UP_1" e proximaAcaoData=amanhã às 09:00 (horário local).
 */
export async function scheduleFollowup1ForTodayLeads() {
  const { start, end } = getTodayRange();
  const tomorrow = new Date(start);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const now = new Date();

  const empresas = await prisma.empresa.findMany({
    where: {
      statusFunil: StatusFunil.MENSAGEM_1_ENVIADA,
      OR: [{ proximaAcao: null }, { proximaAcao: "" }],
      AND: [{ OR: [{ noResponseUntil: null }, { noResponseUntil: { lte: now } }] }],
      interacoes: {
        some: {
          tipo: TipoInteracao.MENSAGEM_1,
          data: { gte: start, lte: end },
        },
      },
    },
    select: { id: true },
  });

  if (!empresas.length) return { updated: 0 };

  await prisma.$transaction(
    empresas.map((empresa) =>
      prisma.empresa.update({
        where: { id: empresa.id },
        data: { proximaAcao: "FOLLOW_UP_1", proximaAcaoData: tomorrow },
      }),
    ),
  );

  return { updated: empresas.length };
}

/**
 * Empresas em MENSAGEM_1_ENVIADA há 24h sem resposta/avanço, sem próxima ação.
 */
export async function getEmpresasPendentesFollowUp1() {
  const limit = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const now = new Date();

  return prisma.empresa.findMany({
    where: {
      statusFunil: StatusFunil.MENSAGEM_1_ENVIADA,
      OR: [{ proximaAcao: null }, { proximaAcao: "" }],
      AND: [{ OR: [{ noResponseUntil: null }, { noResponseUntil: { lte: now } }] }],
      interacoes: {
        some: {
          tipo: TipoInteracao.MENSAGEM_1,
          data: { lte: limit },
        },
      },
      NOT: {
        interacoes: {
          some: {
            data: { gt: limit },
            NOT: { tipo: TipoInteracao.MENSAGEM_1 },
          },
        },
      },
    },
    include: { interacoes: { orderBy: { data: "desc" }, take: 3, select: interacoesSelect } },
  });
}

/**
 * Define proximaAcao=FOLLOW_UP_1 e proximaAcaoData=agora para pendentes identificados.
 */
export async function marcarFollowUp1ComoProximaAcaoParaPendentes() {
  const empresas = await getEmpresasPendentesFollowUp1();
  if (!empresas.length) return { updated: 0 };
  const now = new Date();
  await prisma.$transaction(
    empresas.map((empresa) =>
      prisma.empresa.update({
        where: { id: empresa.id },
        data: { proximaAcao: "FOLLOW_UP_1", proximaAcaoData: now },
      }),
    ),
  );
  return { updated: empresas.length };
}

/**
 * Após 24h da Mensagem 1, se ainda estiver em MENSAGEM_1_ENVIADA e sem próxima ação, agenda Follow-up 1 para agora.
 */
export async function autoScheduleFollowup1After24h() {
  const limit = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const now = new Date();

  const empresas = await prisma.empresa.findMany({
    where: {
      statusFunil: StatusFunil.MENSAGEM_1_ENVIADA,
      AND: [
        { OR: [{ proximaAcao: null }, { proximaAcao: "" }] },
        { OR: [{ noResponseUntil: null }, { noResponseUntil: { lte: now } }] },
        {
          OR: [
            { dataMensagem1: { lte: limit } },
            {
              interacoes: {
                some: {
                  tipo: TipoInteracao.MENSAGEM_1,
                  data: { lte: limit },
                },
              },
            },
          ],
        },
      ],
    },
    select: { id: true },
  });

  if (!empresas.length) return { updated: 0 };

  await prisma.$transaction(
    empresas.map((empresa) =>
      prisma.empresa.update({
        where: { id: empresa.id },
        data: { proximaAcao: "FOLLOW_UP_1", proximaAcaoData: now },
      }),
    ),
  );

  return { updated: empresas.length };
}

/**
 * Empresas em EM_CONVERSA há 24h sem avanço, sem reunião e sem próxima ação.
 */
export async function getEmpresasPendentesFollowUpConversa() {
  const limit = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const now = new Date();

  return prisma.empresa.findMany({
    where: {
      statusFunil: StatusFunil.EM_CONVERSA,
      dataReuniao: null,
      OR: [{ proximaAcao: null }, { proximaAcao: "" }],
      AND: [{ OR: [{ noResponseUntil: null }, { noResponseUntil: { lte: now } }] }],
      interacoes: {
        some: {
          data: { lte: limit },
        },
      },
      NOT: {
        interacoes: {
          some: {
            data: { gt: limit },
          },
        },
      },
    },
    include: { interacoes: { orderBy: { data: "desc" }, take: 3, select: interacoesSelect } },
  });
}

/**
 * Marca follow-up de conversa como próxima ação agora.
 */
export async function marcarFollowUpConversaComoProximaAcao() {
  const empresas = await getEmpresasPendentesFollowUpConversa();
  if (!empresas.length) return { updated: 0 };
  const now = new Date();
  await prisma.$transaction(
    empresas.map((empresa) =>
      prisma.empresa.update({
        where: { id: empresa.id },
        data: { proximaAcao: "FOLLOW_UP_CONVERSA", proximaAcaoData: now },
      }),
    ),
  );
  return { updated: empresas.length };
}

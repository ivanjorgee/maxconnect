import { Canal, ModeloAbertura, OrigemLead, Prisma, Prioridade, StatusFunil, TicketMedioEstimado, TipoInteracao, TipoSite } from "@prisma/client";
import { prisma } from "./prisma";

const interacoesSelect = {
  id: true,
  tipo: true,
  canal: true,
  data: true,
  descricao: true,
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

export async function createInteracao(input: { empresaId: string; tipo: TipoInteracao; canal: Canal; data: Date | string; descricao: string }) {
  return prisma.interacao.create({
    data: {
      empresaId: input.empresaId,
      tipo: input.tipo,
      canal: input.canal,
      data: new Date(input.data),
      descricao: input.descricao,
    },
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  await ensureFollowup2Consistency();
  const { start, end } = getTodayRange();
  const followUps1Pendentes = await getEmpresasPendentesFollowUp1();
  const followUpsConversaPendentes = await getEmpresasPendentesFollowUpConversa();
  const today = new Date();

  const [
    mensagens1Hoje,
    respostasHoje,
    emConversaCount,
    reunioesAgendadasCount,
    empresasEmProspeccao,
  ] = await Promise.all([
    prisma.interacao.count({
      where: { tipo: TipoInteracao.MENSAGEM_1, data: { gte: start, lte: end } },
    }),
    // Não há tipo específico de "resposta" no enum; usamos heurística: empresas que avançaram além de MENSAGEM_1_ENVIADA e foram atualizadas hoje.
    prisma.empresa.count({
      where: {
        statusFunil: {
          in: [
            StatusFunil.RESPONDEU,
            StatusFunil.EM_CONVERSA,
            StatusFunil.REUNIAO_AGENDADA,
            StatusFunil.REUNIAO_REALIZADA,
            StatusFunil.PROPOSTA_ENVIADA,
            StatusFunil.FECHADO,
          ],
        },
        updatedAt: { gte: start, lte: end },
      },
    }),
    prisma.empresa.count({ where: { statusFunil: StatusFunil.EM_CONVERSA } }),
    prisma.empresa.count({
      where: {
        statusFunil: StatusFunil.REUNIAO_AGENDADA,
        OR: [{ dataReuniao: null }, { dataReuniao: { gte: start } }],
      },
    }),
    prisma.empresa.count({ where: { statusFunil: { notIn: [StatusFunil.FECHADO, StatusFunil.PERDIDO] } } }),
  ]);

  const taxaRespostaHoje = mensagens1Hoje ? (respostasHoje / mensagens1Hoje) * 100 : 0;

  // carregamos apenas campos usados no dashboard para reduzir payload
  const empresas = await prisma.empresa.findMany({
    select: {
      id: true,
      nome: true,
      cidade: true,
      statusFunil: true,
      dataFollowup1: true,
      dataFollowup2: true,
      dataReuniao: true,
      dataFechamento: true,
      proximaAcao: true,
      proximaAcaoData: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const porStatus = Object.values(StatusFunil).reduce((acc, status) => {
    acc[status] = empresas.filter((empresa) => empresa.statusFunil === status).length;
    return acc;
  }, {} as Record<StatusFunil, number>);

  const now = Date.now();
  const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000);

  const fechados7 = empresas.filter((empresa) => {
    if (empresa.statusFunil !== StatusFunil.FECHADO) return false;
    const reference = empresa.dataFechamento ?? empresa.updatedAt;
    return reference >= daysAgo(7);
  }).length;

  const fechados30 = empresas.filter((empresa) => {
    if (empresa.statusFunil !== StatusFunil.FECHADO) return false;
    const reference = empresa.dataFechamento ?? empresa.updatedAt;
    return reference >= daysAgo(30);
  }).length;

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const fechadosMes = empresas.filter((empresa) => {
    if (empresa.statusFunil !== StatusFunil.FECHADO) return false;
    const reference = empresa.dataFechamento ?? empresa.updatedAt;
    return reference >= startOfMonth;
  }).length;
  const metaMes = 30;

  const leadsQuentes = empresas.filter(
    (empresa) =>
      empresa.statusFunil === StatusFunil.EM_CONVERSA || empresa.statusFunil === StatusFunil.REUNIAO_AGENDADA,
  ).length;

  const tarefasHoje = empresas.filter(
    (empresa) => empresa.proximaAcaoData && isSameDay(empresa.proximaAcaoData, new Date()),
  ).length;
  const tarefasAtrasadas = empresas.filter(
    (empresa) => empresa.proximaAcaoData && empresa.proximaAcaoData.getTime() < new Date().setHours(0, 0, 0, 0),
  ).length;
  const semProximaAcao = empresas.filter((empresa) => !empresa.proximaAcao && !empresa.proximaAcaoData).length;

  const proximasInteracoes = await prisma.interacao.findMany({
    include: { empresa: true },
    orderBy: { data: "asc" },
    take: 5,
  });

  const interacoesRecentes = await prisma.interacao.findMany({
    include: { empresa: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  // tendência últimos 30 dias (mensagens1 vs respostas)
  const makeTrend = (days: number) =>
    Array.from({ length: days }).map((_, idx) => {
      const day = addDays(today, idx - (days - 1)); // oldest to newest
      const s = startOfDay(day);
      const e = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 23, 59, 59, 999);
      return { start: s, end: e };
    });

  const trendDays30 = makeTrend(30);

  const trendMensagens = await Promise.all(
    trendDays30.map((range) =>
      prisma.interacao.count({
        where: { tipo: TipoInteracao.MENSAGEM_1, data: { gte: range.start, lte: range.end } },
      }),
    ),
  );

  const trendRespostas = await Promise.all(
    trendDays30.map((range) =>
      prisma.empresa.count({
        where: {
          statusFunil: {
            in: [
              StatusFunil.RESPONDEU,
              StatusFunil.EM_CONVERSA,
              StatusFunil.REUNIAO_AGENDADA,
              StatusFunil.REUNIAO_REALIZADA,
              StatusFunil.PROPOSTA_ENVIADA,
              StatusFunil.FECHADO,
            ],
          },
          updatedAt: { gte: range.start, lte: range.end },
        },
      }),
    ),
  );

  const trend30d = trendDays30.map((range, idx) => ({
    date: range.start,
    label: range.start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    mensagens1: trendMensagens[idx],
    respostas: trendRespostas[idx],
  }));
  const trend7d = trend30d.slice(-7);

  const proximasDatas = empresas
    .flatMap((empresa) => {
      const entries: Array<{ label: string; date: Date; empresa: typeof empresa }> = [];
      if (empresa.proximaAcao && empresa.proximaAcaoData) {
        entries.push({ label: empresa.proximaAcao, date: empresa.proximaAcaoData, empresa });
      }
      if (empresa.dataFollowup1) entries.push({ label: "Follow-up 1", date: empresa.dataFollowup1, empresa });
      if (empresa.dataFollowup2) entries.push({ label: "Follow-up 2", date: empresa.dataFollowup2, empresa });
      if (empresa.dataReuniao) entries.push({ label: "Reunião", date: empresa.dataReuniao, empresa });
      if (empresa.dataFechamento) entries.push({ label: "Fechamento", date: empresa.dataFechamento, empresa });
      return entries;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  // ações priorizadas: F1 pendente, follow-up conversa, reuniões de hoje/atrasadas
  const nowStart = startOfDay(new Date());
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
  const reunioesHoje = empresas
    .filter((e) => e.dataReuniao && isSameDay(e.dataReuniao, nowStart))
    .map((e) => ({
      empresa: { id: e.id, nome: e.nome, cidade: e.cidade },
      label: "Reunião hoje",
      tipo: "REUNIAO" as const,
      date: e.dataReuniao as Date,
    }));

  const prioritizedActions = [...urgentFollowup1, ...urgentConversa, ...reunioesHoje]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 8);

  return {
    totalEmpresas: empresas.length,
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
    proximasDatas: proximasDatas.map((item) => ({
      label: item.label,
      date: item.date,
      empresa: { id: item.empresa.id, nome: item.empresa.nome, cidade: item.empresa.cidade },
    })),
    proximasInteracoes,
    interacoesRecentes,
    trend30d,
    trend7d,
    prioritizedActions,
  };
}

async function ensureFollowup2Consistency() {
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

  const empresas = await prisma.empresa.findMany({
    where: {
      statusFunil: StatusFunil.MENSAGEM_1_ENVIADA,
      OR: [{ proximaAcao: null }, { proximaAcao: "" }],
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

  return prisma.empresa.findMany({
    where: {
      statusFunil: StatusFunil.MENSAGEM_1_ENVIADA,
      OR: [{ proximaAcao: null }, { proximaAcao: "" }],
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

  return prisma.empresa.findMany({
    where: {
      statusFunil: StatusFunil.EM_CONVERSA,
      dataReuniao: null,
      OR: [{ proximaAcao: null }, { proximaAcao: "" }],
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

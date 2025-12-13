import { Canal, OrigemLead, StatusFunil, TipoSite } from "@prisma/client";
import { NextResponse } from "next/server";
import { createEmpresa, getEmpresas } from "@/lib/data";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const url = new URL(request.url);
    const cidade = url.searchParams.get("cidade");
    const canal = url.searchParams.get("canal") as Canal | null;
    const status = url.searchParams.get("status");
    const origemLead = url.searchParams.get("origemLead") as OrigemLead | null;
    const tipoSite = url.searchParams.get("tipoSite") as TipoSite | null;
    const busca = url.searchParams.get("q");
    const temSiteParam = url.searchParams.get("temSite");
    const temSite = temSiteParam === null ? null : temSiteParam === "true";
    const action = url.searchParams.get("action") as "none" | "today" | "overdue" | null;

    const companies = await getEmpresas({
      cidade: cidade || null,
      canal,
      status: (status as StatusFunil | null) ?? null,
      origemLead,
      tipoSite,
      temSite,
      busca: busca || null,
      action: action ?? null,
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies", error);
    return NextResponse.json({ error: "Erro ao buscar empresas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const payload = await request.json();
    if (!payload.nome || !payload.endereco || !payload.cidade || !payload.linkGoogleMaps) {
      return NextResponse.json({ error: "Nome, endereço, cidade e link do Maps são obrigatórios" }, { status: 400 });
    }
    if (!payload.canalPrincipal || !payload.origemLead) {
      return NextResponse.json({ error: "Canal principal e origem são obrigatórios" }, { status: 400 });
    }

    const company = await createEmpresa({
      nome: payload.nome,
      endereco: payload.endereco,
      cidade: payload.cidade,
      telefonePrincipal: payload.telefonePrincipal,
      whatsapp: payload.whatsapp,
      website: payload.website,
      instagram: payload.instagram,
      avaliacaoGoogle: payload.avaliacaoGoogle ? Number(payload.avaliacaoGoogle) : undefined,
      qtdAvaliacoes: payload.qtdAvaliacoes ? Number(payload.qtdAvaliacoes) : undefined,
      linkGoogleMaps: payload.linkGoogleMaps,
      temSite: !!payload.temSite,
      tipoSite: payload.tipoSite as TipoSite,
      origemLead: payload.origemLead as OrigemLead,
      canalPrincipal: payload.canalPrincipal as Canal,
      especialidadePrincipal: payload.especialidadePrincipal,
      ticketMedioEstimado: payload.ticketMedioEstimado,
      prioridade: payload.prioridade,
      modeloAbertura: payload.modeloAbertura,
      tags: payload.tags,
      observacoes: payload.observacoes,
      statusFunil: StatusFunil.NOVO,
      proximaAcao: "FAZER_PRIMEIRO_CONTATO",
      proximaAcaoData: new Date(),
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error creating company", error);
    return NextResponse.json({ error: "Erro ao criar empresa" }, { status: 500 });
  }
}

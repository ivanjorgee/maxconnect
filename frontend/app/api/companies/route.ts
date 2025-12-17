import { NextResponse } from "next/server";
import { createEmpresa, getEmpresasPage } from "@/lib/data";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";
import { companyCreateSchema, companyListQuerySchema, formatZodError } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsed = companyListQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parametros invalidos.", details: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const { cidade, canal, status, origemLead, tipoSite, q, temSite, action, followup1Pending, page, pageSize } = parsed.data;
    const companies = await getEmpresasPage(
      {
        cidade: cidade || null,
        canal: canal ?? null,
        status: status ?? null,
        origemLead: origemLead ?? null,
        tipoSite: tipoSite ?? null,
        temSite: typeof temSite === "boolean" ? temSite : null,
        busca: q || null,
        action: action ?? null,
        followup1Pending,
      },
      { page, pageSize },
    );
    return NextResponse.json(companies);
  } catch (error) {
    logger.error("Error fetching companies", { error });
    return NextResponse.json({ error: "Erro ao buscar empresas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const body = await request.json().catch(() => null);
    const parsed = companyCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados invalidos.", details: formatZodError(parsed.error) },
        { status: 400 },
      );
    }
    const payload = parsed.data;

    const company = await createEmpresa({
      nome: payload.nome,
      endereco: payload.endereco,
      cidade: payload.cidade,
      telefonePrincipal: payload.telefonePrincipal,
      whatsapp: payload.whatsapp,
      website: payload.website,
      instagram: payload.instagram,
      avaliacaoGoogle: payload.avaliacaoGoogle ?? undefined,
      qtdAvaliacoes: payload.qtdAvaliacoes ?? undefined,
      linkGoogleMaps: payload.linkGoogleMaps,
      temSite: !!payload.temSite,
      tipoSite: payload.tipoSite,
      origemLead: payload.origemLead,
      canalPrincipal: payload.canalPrincipal,
      especialidadePrincipal: payload.especialidadePrincipal,
      ticketMedioEstimado: payload.ticketMedioEstimado,
      prioridade: payload.prioridade,
      modeloAbertura: payload.modeloAbertura,
      tags: payload.tags ?? [],
      observacoes: payload.observacoes,
      proximaAcao: "FAZER_PRIMEIRO_CONTATO",
      proximaAcaoData: new Date(),
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    logger.error("Error creating company", { error });
    return NextResponse.json({ error: "Erro ao criar empresa" }, { status: 500 });
  }
}

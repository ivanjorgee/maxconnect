import { NextResponse } from "next/server";
import { getEmpresasPendentesFollowUpConversa, marcarFollowUpConversaComoProximaAcao } from "@/lib/data";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const empresas = await getEmpresasPendentesFollowUpConversa();
    return NextResponse.json(empresas);
  } catch (error) {
    console.error("Error fetching follow-up conversa pendentes", error);
    return NextResponse.json({ error: "Erro ao buscar follow-up conversa" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const result = await marcarFollowUpConversaComoProximaAcao();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error marking follow-up conversa", error);
    return NextResponse.json({ error: "Erro ao marcar follow-up conversa" }, { status: 500 });
  }
}

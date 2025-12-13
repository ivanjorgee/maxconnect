import { NextResponse } from "next/server";
import { getEmpresasPendentesFollowUp1 } from "@/lib/data";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const empresas = await getEmpresasPendentesFollowUp1();
    return NextResponse.json(empresas);
  } catch (error) {
    console.error("Error fetching follow-up pendentes", error);
    return NextResponse.json({ error: "Erro ao buscar follow-up pendentes" }, { status: 500 });
  }
}

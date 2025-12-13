import { NextResponse } from "next/server";
import { registrarInteracaoMacro, MacroTipo } from "@/lib/proximaAcao";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const payload = await request.json();
    const macro = payload.macro as MacroTipo;

    if (!macro) {
      return NextResponse.json({ error: "Macro é obrigatória" }, { status: 400 });
    }

    const empresa = await registrarInteracaoMacro({
      empresaId: params.id,
      macro,
      canal: payload.canal,
      data: payload.data,
      modeloAbertura: payload.modeloAbertura,
      descricaoExtra: payload.descricao,
    });

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Error running macro", error);
    return NextResponse.json({ error: "Erro ao executar macro" }, { status: 500 });
  }
}

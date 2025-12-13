import { NextResponse } from "next/server";
import { createInteracao } from "@/lib/data";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const payload = await request.json();
    if (!payload.tipo || !payload.canal || !payload.data || !payload.descricao) {
      return NextResponse.json({ error: "Tipo, canal, data e descrição são obrigatórios" }, { status: 400 });
    }

    const interacao = await createInteracao({
      empresaId: params.id,
      tipo: payload.tipo,
      canal: payload.canal,
      data: payload.data,
      descricao: payload.descricao,
    });

    return NextResponse.json(interacao, { status: 201 });
  } catch (error) {
    console.error("Error creating interação", error);
    return NextResponse.json({ error: "Erro ao criar interação" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createInteracao } from "@/lib/data";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";
import { companyIdSchema, formatZodError, interacaoSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const idParsed = companyIdSchema.safeParse(params.id);
    if (!idParsed.success) {
      return NextResponse.json(
        { error: "ID invalido.", details: formatZodError(idParsed.error) },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = interacaoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados invalidos.", details: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const interacao = await createInteracao({
      empresaId: idParsed.data,
      tipo: parsed.data.tipo,
      canal: parsed.data.canal,
      data: parsed.data.data,
      descricao: parsed.data.descricao,
    });

    return NextResponse.json(interacao, { status: 201 });
  } catch (error) {
    logger.error("Error creating interacao", { error });
    return NextResponse.json({ error: "Erro ao criar interação" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { registrarInteracaoMacro } from "@/lib/proximaAcao";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";
import { companyIdSchema, formatZodError, macroSchema } from "@/lib/validation";
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
    const parsed = macroSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados invalidos.", details: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const empresa = await registrarInteracaoMacro({
      empresaId: idParsed.data,
      macro: parsed.data.macro,
      canal: parsed.data.canal,
      data: parsed.data.data,
      modeloAbertura: parsed.data.modeloAbertura,
      descricaoExtra: parsed.data.descricao,
    });

    return NextResponse.json(empresa);
  } catch (error) {
    logger.error("Error running macro", { error });
    return NextResponse.json({ error: "Erro ao executar macro" }, { status: 500 });
  }
}

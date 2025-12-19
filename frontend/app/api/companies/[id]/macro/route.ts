import { registrarInteracaoMacro } from "@/lib/proximaAcao";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";
import { companyIdSchema, formatZodError, macroSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { createApiLogger, respondJson } from "@/lib/api-logger";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const apiLogger = createApiLogger(request, "/api/companies/[id]/macro");
  try {
    const auth = await requireApiAuth(request);
    if (!auth) {
      apiLogger.log(401);
      return apiLogger.withRequestId(unauthorizedResponse());
    }

    const idParsed = companyIdSchema.safeParse(params.id);
    if (!idParsed.success) {
      return respondJson(
        apiLogger,
        { error: "ID invalido.", details: formatZodError(idParsed.error) },
        { status: 400 },
        { userId: auth.userId },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = macroSchema.safeParse(body);
    if (!parsed.success) {
      return respondJson(
        apiLogger,
        { error: "Dados invalidos.", details: formatZodError(parsed.error) },
        { status: 400 },
        { userId: auth.userId },
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

    return respondJson(apiLogger, empresa, undefined, { userId: auth.userId });
  } catch (error) {
    logger.error("Error running macro", { error, requestId: apiLogger.requestId });
    return respondJson(apiLogger, { error: "Erro ao executar macro" }, { status: 500 });
  }
}

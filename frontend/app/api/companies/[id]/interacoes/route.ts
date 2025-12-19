import { createInteracao } from "@/lib/data";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";
import { companyIdSchema, formatZodError, interacaoSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { createApiLogger, respondJson } from "@/lib/api-logger";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const apiLogger = createApiLogger(request, "/api/companies/[id]/interacoes");
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
    const parsed = interacaoSchema.safeParse(body);
    if (!parsed.success) {
      return respondJson(
        apiLogger,
        { error: "Dados invalidos.", details: formatZodError(parsed.error) },
        { status: 400 },
        { userId: auth.userId },
      );
    }

    const interacao = await createInteracao({
      empresaId: idParsed.data,
      tipo: parsed.data.tipo,
      canal: parsed.data.canal,
      data: parsed.data.data,
      descricao: parsed.data.descricao,
    });

    return respondJson(apiLogger, interacao, { status: 201 }, { userId: auth.userId });
  } catch (error) {
    logger.error("Error creating interacao", { error, requestId: apiLogger.requestId });
    return respondJson(apiLogger, { error: "Erro ao criar interação" }, { status: 500 });
  }
}

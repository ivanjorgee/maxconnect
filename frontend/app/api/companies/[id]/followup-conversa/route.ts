import { registerFollowupConversa } from "@/lib/proximaAcao";
import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";
import { companyIdSchema, formatZodError } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { createApiLogger, respondJson } from "@/lib/api-logger";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const apiLogger = createApiLogger(request, "/api/companies/[id]/followup-conversa");
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

    const result = await registerFollowupConversa(idParsed.data);
    return respondJson(apiLogger, result, undefined, { userId: auth.userId });
  } catch (error) {
    logger.error("Error registering follow-up conversa", { error, requestId: apiLogger.requestId });
    return respondJson(apiLogger, { error: "Erro ao registrar follow-up de conversa" }, { status: 500 });
  }
}

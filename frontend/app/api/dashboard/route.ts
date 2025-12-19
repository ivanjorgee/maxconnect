import { requireApiAuth, unauthorizedResponse } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { logger } from "@/lib/logger";
import { createApiLogger, respondJson } from "@/lib/api-logger";

export async function GET(request: Request) {
  const apiLogger = createApiLogger(request, "/api/dashboard");
  try {
    const auth = await requireApiAuth(request);
    if (!auth) {
      apiLogger.log(401);
      return apiLogger.withRequestId(unauthorizedResponse());
    }

    const data = await getDashboardData();
    return respondJson(apiLogger, data, undefined, { userId: auth.userId });
  } catch (error) {
    logger.error("Error fetching dashboard", { error, requestId: apiLogger.requestId });
    return respondJson(apiLogger, { error: "Erro ao carregar dashboard" }, { status: 500 });
  }
}

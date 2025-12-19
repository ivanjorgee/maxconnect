import {
  autoScheduleFollowup1After24h,
  ensureFollowup2Consistency,
  marcarFollowUpConversaComoProximaAcao,
  scheduleFollowup1ForTodayLeads,
} from "@/lib/data";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createApiLogger, respondJson } from "@/lib/api-logger";

export async function POST(request: Request) {
  const apiLogger = createApiLogger(request, "/api/cron/followups");
  const secret = env.CRON_SECRET;
  const header = request.headers.get("x-cron-secret");
  if (!secret || header !== secret) {
    return respondJson(apiLogger, { error: "Nao autorizado" }, { status: 401 });
  }

  try {
    await ensureFollowup2Consistency();
    const scheduledToday = await scheduleFollowup1ForTodayLeads();
    const autoAfter24h = await autoScheduleFollowup1After24h();
    const conversa = await marcarFollowUpConversaComoProximaAcao();

    logger.info("Cron followups executado", {
      scheduledToday: scheduledToday.updated,
      autoAfter24h: autoAfter24h.updated,
      conversa: conversa.updated,
      requestId: apiLogger.requestId,
    });

    return respondJson(apiLogger, {
      ok: true,
      scheduledToday,
      autoAfter24h,
      conversa,
    });
  } catch (error) {
    logger.error("Erro ao executar cron de followups", { error, requestId: apiLogger.requestId });
    return respondJson(apiLogger, { error: "Erro ao executar cron" }, { status: 500 });
  }
}

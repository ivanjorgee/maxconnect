import { NextResponse } from "next/server";
import { autoScheduleFollowup1After24h, marcarFollowUpConversaComoProximaAcao, scheduleFollowup1ForTodayLeads } from "@/lib/data";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const secret = env.CRON_SECRET;
  const header = request.headers.get("x-cron-secret");
  if (!secret || header !== secret) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const scheduledToday = await scheduleFollowup1ForTodayLeads();
    const autoAfter24h = await autoScheduleFollowup1After24h();
    const conversa = await marcarFollowUpConversaComoProximaAcao();

    logger.info("Cron followups executado", {
      scheduledToday: scheduledToday.updated,
      autoAfter24h: autoAfter24h.updated,
      conversa: conversa.updated,
    });

    return NextResponse.json({
      ok: true,
      scheduledToday,
      autoAfter24h,
      conversa,
    });
  } catch (error) {
    logger.error("Erro ao executar cron de followups", { error });
    return NextResponse.json({ error: "Erro ao executar cron" }, { status: 500 });
  }
}

import { createApiLogger, respondJson } from "@/lib/api-logger";

export async function GET(request: Request) {
  const apiLogger = createApiLogger(request, "/api/health");
  return respondJson(apiLogger, { ok: true, time: new Date().toISOString() });
}

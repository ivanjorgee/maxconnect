import { clearAuthCookie } from "@/lib/auth";
import { createApiLogger, respondJson } from "@/lib/api-logger";

export async function POST(request: Request) {
  const apiLogger = createApiLogger(request, "/api/auth/logout");
  const response = respondJson(apiLogger, { ok: true });
  clearAuthCookie(response);
  return response;
}

import { NextResponse } from "next/server";
import { logger } from "./logger";

type ApiLogger = {
  requestId: string;
  log: (status: number, extra?: Record<string, unknown>) => void;
  withRequestId: <T>(response: NextResponse<T>) => NextResponse<T>;
};

export function createApiLogger(request: Request, route: string, userId?: string | null): ApiLogger {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();

  return {
    requestId,
    log: (status, extra) => {
      logger.info("api_request", {
        route,
        method: request.method,
        status,
        durationMs: Date.now() - startedAt,
        userId: userId ?? undefined,
        requestId,
        ...extra,
      });
    },
    withRequestId: (response) => {
      response.headers.set("x-request-id", requestId);
      return response;
    },
  };
}

export function respondJson<T>(api: ApiLogger, body: T, init?: ResponseInit, extra?: Record<string, unknown>) {
  const response = NextResponse.json(body, init);
  api.log(response.status, extra);
  return api.withRequestId(response);
}

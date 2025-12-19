import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { CRON_SECRET: "secret" },
}));

vi.mock("@/lib/data", () => ({
  ensureFollowup2Consistency: vi.fn().mockResolvedValue(undefined),
  applyNoResponseCadenceStop: vi.fn().mockResolvedValue({ updated: 0 }),
  scheduleFollowup1ForTodayLeads: vi.fn().mockResolvedValue({ updated: 1 }),
  autoScheduleFollowup1After24h: vi.fn().mockResolvedValue({ updated: 0 }),
  marcarFollowUpConversaComoProximaAcao: vi.fn().mockResolvedValue({ updated: 2 }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("cron followups route", () => {
  it("rejeita quando o segredo nao confere", async () => {
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/cron/followups", { method: "POST" }));
    expect(response.status).toBe(401);
  });

  it("executa quando o segredo esta correto", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/cron/followups", {
        method: "POST",
        headers: { "x-cron-secret": "secret" },
      }),
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok?: boolean };
    expect(payload.ok).toBe(true);
  });
});

import { describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth", () => ({
  requireApiAuth: vi.fn().mockResolvedValue(null),
  unauthorizedResponse: () => NextResponse.json({ error: "Não autorizado" }, { status: 401 }),
}));

vi.mock("@/lib/data", () => ({
  getDashboardData: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("dashboard route", () => {
  it("exige autenticacao", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/dashboard"));
    expect(response.status).toBe(401);
  });
});

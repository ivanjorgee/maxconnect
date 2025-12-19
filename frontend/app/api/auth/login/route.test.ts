import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ ok: false, retryAfter: 10 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { count: vi.fn() } },
}));

vi.mock("@/lib/env", () => ({
  env: {
    AUTH_ALLOWED_EMAILS: "",
    AUTH_DEFAULT_EMAIL: "",
    AUTH_DEFAULT_USER: "",
    AUTH_PASSWORD: "",
    AUTH_PASSWORD_HASH: "",
    AUTH_JWT_SECRET: "secret-secret-secret",
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("auth login route", () => {
  it("bloqueia quando rate limit estoura", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.com", password: "12345678" }),
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("10");
  });
});

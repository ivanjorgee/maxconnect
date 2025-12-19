import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { loginSchema, formatZodError } from "@/lib/validation";
import { validatePassword } from "@/lib/password";
import { createApiLogger, respondJson } from "@/lib/api-logger";

const allowedEmails = env.AUTH_ALLOWED_EMAILS.split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function ensureBootstrapUser() {
  const totalUsers = await prisma.user.count();
  if (totalUsers > 0) return;

  const bootstrapEmail = normalizeEmail(env.AUTH_DEFAULT_EMAIL || allowedEmails[0] || "");
  const plainPassword = env.AUTH_PASSWORD;
  const hashFromEnv = env.AUTH_PASSWORD_HASH;

  if (!bootstrapEmail || (!plainPassword && !hashFromEnv)) {
    throw new Error("Configure AUTH_DEFAULT_EMAIL e AUTH_PASSWORD ou AUTH_PASSWORD_HASH para criar o usuário inicial.");
  }

  if (plainPassword) {
    const validation = validatePassword(plainPassword);
    if (!validation.ok) {
      throw new Error(validation.message || "Senha inicial invalida. Ajuste AUTH_PASSWORD.");
    }
  }

  const passwordHash = hashFromEnv || (await bcrypt.hash(plainPassword ?? "", 10));
  const name = env.AUTH_DEFAULT_USER || bootstrapEmail.split("@")[0] || "Administrador";

  await prisma.user.create({
    data: { email: bootstrapEmail, name: name || bootstrapEmail, passwordHash },
  });
}

export async function POST(request: Request) {
  const apiLogger = createApiLogger(request, "/api/auth/login");
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(`login:${ip}`, { windowMs: 15 * 60 * 1000, max: 10 });
    if (!rate.ok) {
      logger.warn("Login rate limit atingido", { ip, requestId: apiLogger.requestId });
      return respondJson(
        apiLogger,
        { error: "Muitas tentativas. Tente novamente em alguns minutos." },
        { status: 429, headers: rate.retryAfter ? { "Retry-After": rate.retryAfter.toString() } : undefined },
      );
    }

    await ensureBootstrapUser();

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return respondJson(
        apiLogger,
        { error: "Dados invalidos.", details: formatZodError(parsed.error) },
        { status: 400 },
      );
    }
    const { email, password } = parsed.data;

    const normalizedEmail = normalizeEmail(email);
    if (allowedEmails.length && !allowedEmails.includes(normalizedEmail)) {
      return respondJson(apiLogger, { error: "Credenciais inválidas." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordHash) {
      return respondJson(apiLogger, { error: "Credenciais inválidas." }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return respondJson(apiLogger, { error: "Credenciais inválidas." }, { status: 401 });
    }

    const token = await signAuthToken({ userId: user.id, email: user.email, name: user.name });
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
    setAuthCookie(response, token);
    apiLogger.log(response.status);
    return apiLogger.withRequestId(response);
  } catch (error) {
    logger.error("Erro ao autenticar", { error, requestId: apiLogger.requestId });
    return respondJson(
      apiLogger,
      {
        error:
          "Configuração de login incompleta ou banco desatualizado. Verifique AUTH_DEFAULT_EMAIL, AUTH_PASSWORD_HASH/ AUTH_PASSWORD, AUTH_JWT_SECRET e se as migrações foram aplicadas.",
      },
      { status: 500 },
    );
  }
}

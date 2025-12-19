import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth, setAuthCookie, signAuthToken, unauthorizedResponse } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { formatZodError, profileUpdateSchema } from "@/lib/validation";
import { createApiLogger, respondJson } from "@/lib/api-logger";

export async function GET(request: Request) {
  const apiLogger = createApiLogger(request, "/api/auth/profile");
  const auth = await requireApiAuth(request);
  if (!auth) {
    apiLogger.log(401);
    return apiLogger.withRequestId(unauthorizedResponse());
  }

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) {
    apiLogger.log(401, { userId: auth.userId });
    return apiLogger.withRequestId(unauthorizedResponse());
  }

  return respondJson(apiLogger, { user: { id: user.id, email: user.email, name: user.name } }, undefined, {
    userId: auth.userId,
  });
}

export async function PATCH(request: Request) {
  const apiLogger = createApiLogger(request, "/api/auth/profile");
  try {
    const auth = await requireApiAuth(request);
    if (!auth) {
      apiLogger.log(401);
      return apiLogger.withRequestId(unauthorizedResponse());
    }

    const body = await request.json().catch(() => null);
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return respondJson(
        apiLogger,
        { error: "Dados invalidos.", details: formatZodError(parsed.error) },
        { status: 400 },
        { userId: auth.userId },
      );
    }

    const { currentPassword, newPassword, email, name } = parsed.data;
    const normalizedEmail = email ? email.trim().toLowerCase() : null;

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user || !user.passwordHash) {
      apiLogger.log(401, { userId: auth.userId });
      return apiLogger.withRequestId(unauthorizedResponse());
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return respondJson(apiLogger, { error: "Senha atual incorreta." }, { status: 400 }, { userId: auth.userId });
    }

    const updates: Record<string, unknown> = {};
    if (normalizedEmail) updates.email = normalizedEmail;
    if (name) updates.name = name.trim();
    if (newPassword) updates.passwordHash = await bcrypt.hash(newPassword, 10);

    if (!Object.keys(updates).length) {
      return respondJson(apiLogger, { error: "Nenhuma alteração enviada." }, { status: 400 }, { userId: auth.userId });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updates,
    });

    const token = await signAuthToken({ userId: updated.id, email: updated.email, name: updated.name });
    const response = NextResponse.json({ user: { id: updated.id, email: updated.email, name: updated.name } });
    setAuthCookie(response, token);
    apiLogger.log(response.status, { userId: auth.userId });
    return apiLogger.withRequestId(response);
  } catch (error) {
    logger.error("Erro ao atualizar perfil", { error, requestId: apiLogger.requestId });
    return respondJson(apiLogger, { error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}

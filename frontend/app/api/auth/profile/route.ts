import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth, setAuthCookie, signAuthToken, unauthorizedResponse } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { formatZodError, profileUpdateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth) return unauthorizedResponse();

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) return unauthorizedResponse();

  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    if (!auth) return unauthorizedResponse();

    const body = await request.json().catch(() => null);
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados invalidos.", details: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword, email, name } = parsed.data;
    const normalizedEmail = email ? email.trim().toLowerCase() : null;

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user || !user.passwordHash) return unauthorizedResponse();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (normalizedEmail) updates.email = normalizedEmail;
    if (name) updates.name = name.trim();
    if (newPassword) updates.passwordHash = await bcrypt.hash(newPassword, 10);

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Nenhuma alteração enviada." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updates,
    });

    const token = await signAuthToken({ userId: updated.id, email: updated.email, name: updated.name });
    const response = NextResponse.json({ user: { id: updated.id, email: updated.email, name: updated.name } });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    logger.error("Erro ao atualizar perfil", { error });
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}

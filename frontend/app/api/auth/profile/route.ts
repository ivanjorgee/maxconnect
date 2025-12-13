import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth, setAuthCookie, signAuthToken, unauthorizedResponse } from "@/lib/auth";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const payload = (await request.json()) as {
      email?: string;
      name?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword = (payload.currentPassword || "").toString();
    const newPassword = payload.newPassword ? payload.newPassword.toString() : "";
    const normalizedEmail = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
    const name = typeof payload.name === "string" ? payload.name.trim() : null;

    if (!currentPassword) {
      return NextResponse.json({ error: "Informe a senha atual para atualizar os dados." }, { status: 400 });
    }

    if (newPassword && newPassword.length < 8) {
      return NextResponse.json({ error: "A nova senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }

    if (normalizedEmail && !emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "Formato de email inválido." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user || !user.passwordHash) return unauthorizedResponse();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (normalizedEmail) updates.email = normalizedEmail;
    if (name) updates.name = name;
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
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}

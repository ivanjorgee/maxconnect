import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAuthToken, setAuthCookie } from "@/lib/auth";

const allowedEmails =
  (process.env.AUTH_ALLOWED_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function ensurePasswordColumn() {
  // Garante que a coluna passwordHash existe mesmo se a migração não foi aplicada no banco
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;`);
  } catch (error) {
    console.error("Erro ao garantir coluna passwordHash:", error);
  }
}

async function ensureBootstrapUser() {
  await ensurePasswordColumn();

  const bootstrapEmail = normalizeEmail(process.env.AUTH_DEFAULT_EMAIL || allowedEmails[0] || "");
  const plainPassword = process.env.AUTH_PASSWORD;
  const hashFromEnv = process.env.AUTH_PASSWORD_HASH;

  if (!bootstrapEmail || (!plainPassword && !hashFromEnv)) {
    throw new Error("Configure AUTH_DEFAULT_EMAIL e AUTH_PASSWORD ou AUTH_PASSWORD_HASH para criar o usuário inicial.");
  }

  const passwordHash = hashFromEnv || (await bcrypt.hash(plainPassword, 10));
  const name = process.env.AUTH_DEFAULT_USER || bootstrapEmail.split("@")[0] || "Administrador";

  const existing = await prisma.user.findUnique({ where: { email: bootstrapEmail } });
  if (existing) {
    // atualiza sempre para garantir que hash e nome estão alinhados com .env
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, name: name || existing.name || bootstrapEmail },
    });
  } else {
    await prisma.user.create({
      data: { email: bootstrapEmail, name: name || bootstrapEmail, passwordHash },
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureBootstrapUser();

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Formato de email inválido." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const token = await signAuthToken({ userId: user.id, email: user.email, name: user.name });
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error("Erro ao autenticar:", error);
    return NextResponse.json(
      {
        error:
          "Configuração de login incompleta ou banco desatualizado. Verifique AUTH_DEFAULT_EMAIL, AUTH_PASSWORD_HASH/ AUTH_PASSWORD, AUTH_JWT_SECRET e se as migrações foram aplicadas.",
      },
      { status: 500 },
    );
  }
}

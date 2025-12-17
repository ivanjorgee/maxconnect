import { PrismaClient } from "@prisma/client";
import { env } from "./env";

if (!env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL nao definida. Crie um arquivo ".env.local" na pasta frontend com DATABASE_URL do Postgres (veja .env.example) e reinicie o servidor.',
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

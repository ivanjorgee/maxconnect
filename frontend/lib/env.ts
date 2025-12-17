import { z } from "zod";
import { logger } from "./logger";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  DATABASE_URL: z.string().min(1, "DATABASE_URL obrigatorio"),
  AUTH_ALLOWED_EMAILS: z.string().optional().default(""),
  AUTH_PASSWORD: z.string().optional(),
  AUTH_PASSWORD_HASH: z.string().optional(),
  AUTH_DEFAULT_EMAIL: z.string().email().optional(),
  AUTH_DEFAULT_USER: z.string().optional(),
  AUTH_JWT_SECRET: z.string().min(16).optional(),
  AUTH_DEV_BYPASS: z.enum(["true", "false"]).optional().default("false"),
  CRON_SECRET: z.string().min(16).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = "Falha ao validar variaveis de ambiente.";
  const issues = parsed.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  logger.error(message, { issues });
  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }
}

export const env = parsed.success
  ? parsed.data
  : {
      NODE_ENV: process.env.NODE_ENV as "development" | "test" | "production" | undefined,
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      AUTH_ALLOWED_EMAILS: process.env.AUTH_ALLOWED_EMAILS ?? "",
      AUTH_PASSWORD: process.env.AUTH_PASSWORD,
      AUTH_PASSWORD_HASH: process.env.AUTH_PASSWORD_HASH,
      AUTH_DEFAULT_EMAIL: process.env.AUTH_DEFAULT_EMAIL,
      AUTH_DEFAULT_USER: process.env.AUTH_DEFAULT_USER,
      AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET,
      AUTH_DEV_BYPASS: (process.env.AUTH_DEV_BYPASS as "true" | "false" | undefined) ?? "false",
      CRON_SECRET: process.env.CRON_SECRET,
    };

export const isProd = env.NODE_ENV === "production";
export const isDev = env.NODE_ENV !== "production";

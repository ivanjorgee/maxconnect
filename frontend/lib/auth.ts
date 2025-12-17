import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { env, isDev } from "./env";
import { logger } from "./logger";

export type AuthPayload = { userId: string; email: string; name?: string };

export const AUTH_COOKIE = "mc_auth_token";
const devBypassEnabled = env.AUTH_DEV_BYPASS === "true" && isDev;
const devUserEmail = env.AUTH_DEFAULT_EMAIL || "dev@maxconect.local";
const devUserName = env.AUTH_DEFAULT_USER || "Dev User";
const devUserId = "dev-user";

function getJwtSecret() {
  const secret = env.AUTH_JWT_SECRET || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (devBypassEnabled) {
      const fallback = "dev-secret-maxconect";
      logger.warn("AUTH_JWT_SECRET nao definido; usando chave padrao apenas para desenvolvimento local.");
      return new TextEncoder().encode(fallback);
    }
    throw new Error("AUTH_JWT_SECRET nao definido. Configure uma chave segura no ambiente.");
  }
  return new TextEncoder().encode(secret);
}

let secretKey: Uint8Array | null = null;
let secretError: Error | null = null;
try {
  secretKey = getJwtSecret();
} catch (error) {
  secretError = error instanceof Error ? error : new Error("AUTH_JWT_SECRET não definido.");
  secretKey = null;
}

export async function signAuthToken(payload: AuthPayload) {
  if (!secretKey) throw secretError ?? new Error("AUTH_JWT_SECRET não definido.");
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secretKey);
}

export async function verifyAuthToken(token: string): Promise<AuthPayload | null> {
  if (!secretKey) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const email = typeof payload.email === "string" ? payload.email : null;
    const name = typeof payload.name === "string" ? payload.name : undefined;
    const userId = typeof payload.userId === "string" ? payload.userId : null;
    if (!email || !userId) return null;
    return { userId, email, name };
  } catch {
    return null;
  }
}

export async function getAuthPayload(req?: Request): Promise<AuthPayload | null> {
  if (devBypassEnabled) {
    return { userId: devUserId, email: devUserEmail, name: devUserName };
  }
  const headerToken =
    req?.headers.get("authorization")?.replace("Bearer ", "") || headers().get("authorization")?.replace("Bearer ", "");
  const cookieToken = cookies().get(AUTH_COOKIE)?.value;
  const token = cookieToken || headerToken;
  if (!token) return null;
  return verifyAuthToken(token);
}

export function unauthorizedResponse(message = "Não autorizado") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function requireApiAuth(req?: Request): Promise<AuthPayload | null> {
  return getAuthPayload(req);
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

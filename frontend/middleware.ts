import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { env, isDev } from "./lib/env";
import { logger } from "./lib/logger";

const AUTH_COOKIE = "mc_auth_token";
const PUBLIC_PATHS = [
  "/auth/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/cron/followups",
  "/api/health",
  "/favicon.ico",
];
const devBypassEnabled = env.AUTH_DEV_BYPASS === "true" && isDev;

const secretValue = env.AUTH_JWT_SECRET || process.env.JWT_SECRET || "";
const secretKey = secretValue ? new TextEncoder().encode(secretValue) : null;

async function isValidToken(token: string) {
  if (!secretKey) return false;
  try {
    await jwtVerify(token, secretKey);
    return true;
  } catch {
    return false;
  }
}

function isPublicPath(pathname: string) {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/public")) return true;
  if (/\.[^/]+$/.test(pathname)) return true; // arquivos estáticos (svg, png, etc)
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

function handleUnauthorized(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const loginUrl = new URL("/auth/login", req.url);
  loginUrl.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (devBypassEnabled) return NextResponse.next(); // desativa auth em dev
  if (isPublicPath(pathname)) return NextResponse.next();

  if (!secretKey) {
    logger.error("AUTH_JWT_SECRET nao configurado; bloqueando acesso.");
    return handleUnauthorized(req);
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token || !(await isValidToken(token))) {
    return handleUnauthorized(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

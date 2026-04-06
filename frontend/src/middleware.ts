import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

type Locale = (typeof routing.locales)[number];
const DEFAULT_LOCALE = routing.defaultLocale as Locale;
const LOCALES_SET: ReadonlySet<string> = new Set(routing.locales);

function getLocale(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  if (!segment) return null;
  if (!LOCALES_SET.has(segment)) return null;
  return segment as Locale;
}

function stripLocale(pathname: string) {
  const locale = getLocale(pathname);
  if (!locale) return pathname.replace(/\/$/, "") || "/";
  return pathname
    .replace(new RegExp(`^/${locale}(?:/|$)`), "/")
    .replace(/\/$/, "") || "/";
}

function isAuthPage(p: string) {
  return p === "/login" || p === "/forgot-password" || p === "/reset-password";
}

function isProtected(p: string) {
  return (
    p === "/" ||
    p === "/dashboard" ||
    p.startsWith("/patients") ||
    p.startsWith("/appointments") ||
    p.startsWith("/clinical-histories") ||
    p.startsWith("/messages")
  );
}

function withLocale(pathNoLocale: string, locale: Locale) {
  const normalized = pathNoLocale.startsWith("/")
    ? pathNoLocale
    : `/${pathNoLocale}`;
  return `/${locale}${normalized === "/" ? "" : normalized}`;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API/static
  if (pathname.startsWith("/api")) return NextResponse.next();
  if (pathname.includes(".")) return NextResponse.next();

  // Locale must exist because app is /[locale]/*
  const locale = getLocale(pathname);
  if (!locale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const pathNoLocale = stripLocale(pathname);

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const hasToken = Boolean(token);

  // logged in -> auth pages => dashboard
  if (hasToken && isAuthPage(pathNoLocale)) {
    const url = request.nextUrl.clone();
    url.pathname = withLocale("/dashboard", locale);
    return NextResponse.redirect(url);
  }

  // not logged in -> protected => login
  if (!hasToken && isProtected(pathNoLocale)) {
    const url = request.nextUrl.clone();
    url.pathname = withLocale("/login", locale);
    return NextResponse.redirect(url);
  }

  // optional: /{locale} -> /{locale}/dashboard when logged in
  if (hasToken && pathNoLocale === "/") {
    const url = request.nextUrl.clone();
    url.pathname = withLocale("/dashboard", locale);
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

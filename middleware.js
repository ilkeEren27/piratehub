import createMiddleware from "next-intl/middleware";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

// Create next-intl middleware
const intlMiddleware = createMiddleware(routing);

// First path segment (after the locale) of all *public* routes (no auth required)
const PUBLIC_SEGMENTS = new Set([
  "map",
  "events", // Allow all events routes including editor
  "campus-guide", // Campus guide pages
  "social", // Social/Instagram feed pages
  "log-in",
  "sign-up",
  "forgot-password",
  "reset-password",
  "verify-email",
]);

const localePattern = new RegExp(`^/(${routing.locales.join("|")})(/.*)?$`);

function isPublicRoute(pathname) {
  // Strip the locale prefix if present, e.g. "/en/map/x" -> "/map/x"
  const match = pathname.match(localePattern);
  const path = match ? match[2] || "/" : pathname;

  if (path === "/") return true;
  const firstSegment = path.split("/")[1];
  return PUBLIC_SEGMENTS.has(firstSegment);
}

export default function middleware(req) {
  const { pathname } = req.nextUrl;

  if (!isPublicRoute(pathname)) {
    // Optimistic check: only verifies the session cookie exists. Pages and
    // server actions still validate the session against the DB themselves.
    const sessionCookie = getSessionCookie(req);
    if (!sessionCookie) {
      const localeMatch = pathname.match(localePattern);
      const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}/log-in`, req.url));
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // Run middleware for everything except static files, _next, and API routes
    "/((?!api|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};

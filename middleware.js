import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Create next-intl middleware
const intlMiddleware = createMiddleware(routing);

// Add all *public* routes here (no auth required)
// Note: Include locale prefix patterns
const isPublicRoute = createRouteMatcher([
  "/:locale/map(.*)",
  "/:locale/events(.*)", // Allow all events routes including editor
  "/:locale/campus-guide(.*)", // Campus guide pages
  "/:locale/social(.*)", // Social/Instagram feed pages
  "/:locale/log-in(.*)",
  "/:locale/sign-up(.*)",
  "/:locale/forgot-password(.*)",
  "/:locale/reset-password(.*)",
  "/:locale/verify-email(.*)",
  "/api/(.*)", // All API routes are public (auth handled per-route if needed)
  "/:locale",
  "/",
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip intl middleware for API routes - they should not go through locale handling
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  
  if (!isApiRoute) {
    // Run next-intl middleware only for non-API routes
    const intlResponse = intlMiddleware(req);
    
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
    
    return intlResponse;
  }
  
  // For API routes, just check authentication if needed
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run middleware for everything except static files, _next, and API routes
    "/((?!api|_next|sign-in|sign-up|forgot-password|reset-password|verify-email|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};

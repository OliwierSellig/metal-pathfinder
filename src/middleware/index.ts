import { createSupabaseServerInstance, createTestSupabaseInstance } from "../db/supabase.server.ts";
import { defineMiddleware } from "astro:middleware";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/login",
  "/register",
  "/forgot-password",
  "/update-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/update-password",
  "/api/auth/callback",
  // Static assets and other public paths
  "/favicon.png",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(url.pathname) || url.pathname.startsWith("/_")) {
    return next();
  }

  // Test environment handling - check for test headers or user agent
  const userAgent = request.headers.get("user-agent") || "";
  const testMode = request.headers.get("x-test-mode");
  const testUserId = request.headers.get("x-test-user-id");
  const testUserEmail = request.headers.get("x-test-user-email");

  const isPlaywrightTest = userAgent.includes("Playwright") || testMode === "true" || process.env.NODE_ENV === "test";

  if (isPlaywrightTest) {
    // Use real test Supabase client for E2E tests
    const testSupabase = createTestSupabaseInstance({
      cookies,
      headers: request.headers,
    });

    // Set test user data from headers (more reliable than env vars in server context)
    const finalTestUserId = testUserId || "ff5f16c8-d72b-4078-a946-4ab3cffba27e";
    const finalTestUserEmail = testUserEmail || "oliwier@kryptonum.eu";

    locals.user = {
      email: finalTestUserEmail,
      id: finalTestUserId,
    };

    // Use real Supabase client for database operations
    locals.supabase = testSupabase;

    return next();
  }

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Add supabase to locals for backward compatibility
  locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.email) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
  } else if (!PUBLIC_PATHS.includes(url.pathname)) {
    // Redirect to login for protected routes
    return redirect("/login");
  }

  // If user is logged in and tries to access login/register, redirect to discover
  if (user && (url.pathname === "/login" || url.pathname === "/register")) {
    return redirect("/discover");
  }

  return next();
});

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.server";
import { logError } from "../../../lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/auth/callback
 * Handles Supabase auth callbacks (PKCE flow) for password reset and other auth flows
 * This endpoint processes the authentication tokens and redirects users appropriately
 */
export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const next = url.searchParams.get("next") || "/update-password";
    const error_description = url.searchParams.get("error_description");

    // Handle auth errors from Supabase
    if (error_description) {
      logError(new Error(`Supabase auth callback error: ${error_description}`), {
        operation: "supabase_auth_callback",
        error_description,
      });
      return redirect("/login?error=auth_callback_error");
    }

    // Handle missing auth code
    if (!code) {
      logError(new Error("Missing auth code in callback"), {
        operation: "supabase_auth_callback",
        url: url.toString(),
      });
      return redirect("/login?error=missing_auth_code");
    }

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Exchange the auth code for a session (PKCE flow)
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      logError(new Error(`Failed to exchange code for session: ${exchangeError.message}`), {
        operation: "supabase_exchange_code",
        error_code: exchangeError.status,
      });
      return redirect("/login?error=session_exchange_failed");
    }

    // Verify we have a valid session
    if (!data.session || !data.user) {
      logError(new Error("No session or user after code exchange"), {
        operation: "supabase_exchange_code",
      });
      return redirect("/login?error=invalid_session");
    }

    // Log successful authentication
    console.info("User authenticated via auth callback", {
      operation: "auth_callback",
      user_id: data.user.id,
      email: data.user.email,
      timestamp: new Date().toISOString(),
    });

    // Redirect to the appropriate page (usually /update-password for password reset)
    return redirect(next);
  } catch (error) {
    // Handle unexpected errors
    logError(new Error("Unexpected error in auth callback"), {
      operation: "auth_callback_endpoint",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return redirect("/login?error=unexpected_error");
  }
};

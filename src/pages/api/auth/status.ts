import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.server.ts";
import { AuthenticationError, createErrorResponse, logError } from "../../../lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/auth/status
 * Returns current authentication status and user info
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new AuthenticationError("Failed to get user session");
    }

    // Return user data if authenticated, null if not
    const userData = user
      ? {
          id: user.id,
          email: user.email || "",
          email_confirmed_at: user.email_confirmed_at || null,
          created_at: user.created_at || "",
          updated_at: user.updated_at || "",
        }
      : null;

    return new Response(
      JSON.stringify({
        authenticated: !!user,
        user: userData,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle authentication errors (user not logged in)
    if (error instanceof AuthenticationError) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          user: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    logError(new Error("Unexpected error in GET /api/auth/status"), {
      operation: "get_auth_status_endpoint",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify(createErrorResponse("Internal Server Error", "An unexpected error occurred", 500)),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

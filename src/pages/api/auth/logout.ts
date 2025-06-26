import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.server.ts";
import { AuthService } from "../../../lib/services/auth.service.ts";
import { AuthenticationError, DatabaseError, createErrorResponse, logError } from "../../../lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST /api/auth/logout
 * Logs out the current user by ending their session
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Create AuthService instance
    const authService = new AuthService(supabase);

    // Perform logout operation
    const logoutResult = await authService.logoutUser();

    // Return success response
    return new Response(JSON.stringify(logoutResult), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthenticationError) {
      return new Response(JSON.stringify(createErrorResponse("Unauthorized", error.message, 401)), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle database errors
    if (error instanceof DatabaseError) {
      return new Response(
        JSON.stringify(createErrorResponse("Internal Server Error", "An unexpected error occurred", 500)),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    logError(new Error("Unexpected error in POST /api/auth/logout"), {
      operation: "post_auth_logout_endpoint",
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

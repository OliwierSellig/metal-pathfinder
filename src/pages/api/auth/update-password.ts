import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.server";
import { AuthService } from "../../../lib/services/auth.service";
import {
  ValidationError,
  DatabaseError,
  AuthenticationError,
  createErrorResponse,
  createValidationErrorResponse,
  logError,
} from "../../../lib/utils/errors";
import { updatePasswordRequestSchema, formatZodErrors } from "../../../lib/utils/validation";

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST /api/auth/update-password
 * Updates user password for authenticated user (PKCE flow)
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      logError(new Error("Invalid JSON in request body"), {
        operation: "parse_request_body",
        error: error instanceof Error ? error.message : "Unknown parsing error",
      });

      return new Response(JSON.stringify(createErrorResponse("Bad Request", "Invalid JSON in request body", 400)), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body structure with Zod
    const validationResult = updatePasswordRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const validationErrors = formatZodErrors(validationResult.error);

      logError(new ValidationError("Update password request validation failed", validationErrors), {
        operation: "validate_update_password_request",
        request_body: requestBody,
      });

      return new Response(JSON.stringify(createValidationErrorResponse("Validation failed", validationErrors)), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { password } = validationResult.data;

    // Create Supabase server instance and AuthService
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });
    const authService = new AuthService(supabase);

    // Update password using AuthService (PKCE flow - user is already authenticated)
    const updateResult = await authService.updatePassword(password);

    // Return success response
    return new Response(JSON.stringify(updateResult), {
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
    logError(new Error("Unexpected error in POST /api/auth/update-password"), {
      operation: "post_auth_update_password_endpoint",
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

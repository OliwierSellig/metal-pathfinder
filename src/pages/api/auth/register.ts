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
import { registerRequestSchema, formatZodErrors } from "../../../lib/utils/validation";

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST /api/auth/register
 * Registers a new user with email and password
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
    const validationResult = registerRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const validationErrors = formatZodErrors(validationResult.error);

      logError(new ValidationError("Register request validation failed", validationErrors), {
        operation: "validate_register_request",
        request_body: requestBody,
      });

      return new Response(JSON.stringify(createValidationErrorResponse("Validation failed", validationErrors)), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = validationResult.data;

    // Create Supabase server instance and AuthService
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });
    const authService = new AuthService(supabase);

    // Attempt to register user using AuthService
    const registerResult = await authService.registerUser(email, password);

    // Return success response with user data
    return new Response(
      JSON.stringify({
        user: registerResult.user,
        message: "Account created successfully!",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle authentication errors (email already exists, weak password, etc.)
    if (error instanceof AuthenticationError) {
      // Return specific status codes for different auth errors
      const status = error.message.includes("already exists") ? 409 : 400;

      return new Response(JSON.stringify(createErrorResponse("Registration failed", error.message, status)), {
        status,
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
    logError(new Error("Unexpected error in POST /api/auth/register"), {
      operation: "post_auth_register_endpoint",
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

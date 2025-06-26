import type { APIRoute } from "astro";
import type { BlockTrackCommand } from "../../../types";
import { BlockedTracksService } from "../../../lib/services/blocked-tracks.service";
import { blockedTracksQueryParamsSchema, blockTrackCommandSchema } from "../../../lib/utils/validation";
import { formatZodErrors } from "../../../lib/utils/validation";
import { TEST_USER_ID } from "../../../db/supabase.server";
import {
  DatabaseError,
  DuplicateTrackError,
  TrackInLibraryError,
  createErrorResponse,
  createValidationErrorResponse,
  logError,
} from "../../../lib/utils/errors";
import { ZodError } from "zod";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/blocked-tracks
 * Retrieves user's blocked tracks with optional filtering and pagination
 *
 * @param request - Request object
 * @param locals - Astro locals containing Supabase client
 * @returns JSON response with blocked tracks list or error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Use test user ID for development (no authentication required yet)
    const userId = TEST_USER_ID;

    // Extract and validate query parameters
    const url = new URL(request.url);
    const rawParams = {
      active_only: url.searchParams.get("active_only") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      offset: url.searchParams.get("offset") || undefined,
    };

    // Validate query parameters using Zod schema
    let validatedParams;
    try {
      validatedParams = blockedTracksQueryParamsSchema.parse(rawParams);
    } catch (zodError) {
      const validationErrors = formatZodErrors(zodError as ZodError);
      return new Response(JSON.stringify(createValidationErrorResponse("Invalid query parameters", validationErrors)), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      logError(new DatabaseError("Supabase client not available"), {
        operation: "get_blocked_tracks",
        user_id: userId,
      });
      return new Response(
        JSON.stringify(createErrorResponse("Internal Server Error", "An unexpected error occurred", 500)),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create service instance
    const blockedTracksService = new BlockedTracksService(supabase);

    // Fetch blocked tracks with validated parameters
    const serviceOptions = {
      active_only: validatedParams.active_only ?? true,
      limit: validatedParams.limit ?? 50,
      offset: validatedParams.offset ?? 0,
    };

    const response = await blockedTracksService.getBlockedTracks(userId, serviceOptions);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known database errors
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
    logError(new DatabaseError("Unexpected error in GET /api/blocked-tracks", error as Error), {
      operation: "get_blocked_tracks",
      endpoint: "GET /api/blocked-tracks",
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

/**
 * POST /api/blocked-tracks
 * Blocks a track from recommendations for specified duration
 *
 * @param request - Request object
 * @param locals - Astro locals containing Supabase client
 * @returns JSON response with created block details or error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Use test user ID for development (no authentication required yet)
    const userId = TEST_USER_ID;

    // Check Content-Type header
    const contentType = request.headers.get("content-type")?.toLowerCase();
    if (!contentType || !contentType.includes("application/json")) {
      return new Response(
        JSON.stringify(createErrorResponse("Bad Request", "Content-Type must be application/json", 400)),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(JSON.stringify(createErrorResponse("Bad Request", "Invalid JSON in request body", 400)), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body using Zod schema
    let validatedCommand: BlockTrackCommand;
    try {
      validatedCommand = blockTrackCommandSchema.parse(requestBody);
    } catch (zodError) {
      const validationErrors = formatZodErrors(zodError as ZodError);
      return new Response(
        JSON.stringify(createValidationErrorResponse("Request validation failed", validationErrors)),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      logError(new DatabaseError("Supabase client not available"), {
        operation: "block_track",
        user_id: userId,
      });
      return new Response(
        JSON.stringify(createErrorResponse("Internal Server Error", "An unexpected error occurred", 500)),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create service instance
    const blockedTracksService = new BlockedTracksService(supabase);

    // Block the track
    const response = await blockedTracksService.blockTrack(userId, validatedCommand);

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known business logic errors
    if (error instanceof TrackInLibraryError) {
      return new Response(JSON.stringify(createErrorResponse("Bad Request", error.message, 400)), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof DuplicateTrackError) {
      return new Response(JSON.stringify(createErrorResponse("Conflict", error.message, 409)), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

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
    logError(new DatabaseError("Unexpected error in POST /api/blocked-tracks", error as Error), {
      operation: "block_track",
      endpoint: "POST /api/blocked-tracks",
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

import type { APIRoute } from "astro";
import { LibraryService } from "../../../lib/services/library.service";
import {
  addTrackToLibraryCommandSchema,
  validateSpotifyTrackId,
  formatZodErrors,
  libraryQueryParamsSchema,
} from "../../../lib/utils/validation";
import {
  ValidationError,
  DuplicateTrackError,
  TrackBlockedError,
  DatabaseError,
  createErrorResponse,
  createValidationErrorResponse,
  logError,
} from "../../../lib/utils/errors";
import { TEST_USER_ID } from "../../../db/supabase.server";

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST /api/library
 * Adds a Spotify track to the user's personal library
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const libraryService = new LibraryService(locals.supabase);

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
    const validationResult = addTrackToLibraryCommandSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const validationErrors = formatZodErrors(validationResult.error);

      logError(new ValidationError("Request validation failed", validationErrors), {
        operation: "validate_request_body",
        request_body: requestBody,
      });

      return new Response(JSON.stringify(createValidationErrorResponse("Validation failed", validationErrors)), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { spotify_track_id } = validationResult.data;

    // Create validated Spotify track ID
    let validatedSpotifyTrackId;
    try {
      validatedSpotifyTrackId = validateSpotifyTrackId(spotify_track_id);
    } catch (error) {
      logError(
        new ValidationError("Spotify track ID validation failed", [
          {
            field: "spotify_track_id",
            message: error instanceof Error ? error.message : "Invalid format",
          },
        ]),
        {
          operation: "validate_spotify_track_id",
          spotify_track_id,
        }
      );

      return new Response(
        JSON.stringify(
          createValidationErrorResponse("Validation failed", [
            {
              field: "spotify_track_id",
              message: "Must be exactly 22 alphanumeric characters",
            },
          ])
        ),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add track to library using service
    const newTrack = await libraryService.addTrackToLibrary(TEST_USER_ID, validatedSpotifyTrackId);

    // Return success response with 201 Created
    return new Response(JSON.stringify(newTrack), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known business logic errors
    if (error instanceof TrackBlockedError) {
      return new Response(JSON.stringify(createErrorResponse("Bad Request", error.message, 400)), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof DuplicateTrackError) {
      return new Response(JSON.stringify(createErrorResponse("Bad Request", error.message, 400)), {
        status: 400,
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
    logError(new Error("Unexpected error in POST /api/library"), {
      operation: "post_library_endpoint",
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

/**
 * GET /api/library
 * Retrieves user's music library with pagination and sorting
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const libraryService = new LibraryService(locals.supabase);

  try {
    // Extract and validate query parameters
    const searchParams = url.searchParams;
    const queryParams = {
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
      sort: searchParams.get("sort") || undefined,
    };

    // Validate query parameters with Zod schema
    const validationResult = libraryQueryParamsSchema.safeParse(queryParams);

    if (!validationResult.success) {
      const validationErrors = formatZodErrors(validationResult.error);

      logError(new ValidationError("Query parameters validation failed", validationErrors), {
        operation: "validate_query_params",
        query_params: queryParams,
      });

      return new Response(JSON.stringify(createValidationErrorResponse("Validation failed", validationErrors)), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract validated data with proper defaults applied by Zod
    const validatedParams = validationResult.data;

    // Get user library using service
    const libraryResponse = await libraryService.getUserLibrary(TEST_USER_ID, {
      limit: validatedParams.limit ?? 50,
      offset: validatedParams.offset ?? 0,
      sort: validatedParams.sort ?? "created_at_desc",
    });

    // Return success response with 200 OK
    return new Response(JSON.stringify(libraryResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
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
    logError(new Error("Unexpected error in GET /api/library"), {
      operation: "get_library_endpoint",
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

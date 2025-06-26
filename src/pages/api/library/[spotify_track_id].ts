import type { APIContext } from "astro";
import type { SuccessMessageDTO, SpotifyTrackId } from "../../../types";
import { LibraryService } from "../../../lib/services/library.service";
import { validateSpotifyTrackId } from "../../../lib/utils/validation";
import { getAuthenticatedUserId } from "../../../lib/utils/auth";
import {
  LastTrackError,
  TrackNotFoundError,
  DatabaseError,
  createErrorResponse,
  logError,
} from "../../../lib/utils/errors";

// Disable prerendering for API routes
export const prerender = false;

/**
 * DELETE /api/library/{spotify_track_id}
 * Removes a track from user's library
 *
 * @param context - Astro API context containing request and response objects
 * @returns JSON response with success message or error
 */
export async function DELETE(context: APIContext): Promise<Response> {
  try {
    // Get authenticated user ID from locals
    const userId = getAuthenticatedUserId(context.locals);

    // Extract spotify_track_id from URL params
    const { spotify_track_id } = context.params;
    if (!spotify_track_id) {
      return new Response(
        JSON.stringify(createErrorResponse("Bad Request", "Missing spotify_track_id parameter", 400)),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate spotify_track_id format
    let validatedTrackId: SpotifyTrackId;
    try {
      validatedTrackId = validateSpotifyTrackId(spotify_track_id);
    } catch {
      return new Response(JSON.stringify(createErrorResponse("Bad Request", "Invalid spotify_track_id format", 400)), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get Supabase client from context.locals
    const supabase = context.locals.supabase;
    if (!supabase) {
      logError(new DatabaseError("Supabase client not available"), {
        operation: "delete_library_track",
        user_id: userId,
        spotify_track_id: validatedTrackId,
      });
      return new Response(
        JSON.stringify(createErrorResponse("Internal Server Error", "An unexpected error occurred", 500)),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create library service instance
    const libraryService = new LibraryService(supabase);

    // Remove track from library
    await libraryService.removeTrackFromLibrary(userId, validatedTrackId);

    // Return success response
    const response: SuccessMessageDTO = {
      message: "Track removed from library successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known business logic errors
    if (error instanceof LastTrackError) {
      return new Response(JSON.stringify(createErrorResponse("Bad Request", error.message, 400)), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof TrackNotFoundError) {
      return new Response(JSON.stringify(createErrorResponse("Not Found", error.message, 404)), {
        status: 404,
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
    logError(new DatabaseError("Unexpected error in DELETE /api/library/[spotify_track_id]", error as Error), {
      operation: "delete_library_track",
      endpoint: "DELETE /api/library/[spotify_track_id]",
    });

    return new Response(
      JSON.stringify(createErrorResponse("Internal Server Error", "An unexpected error occurred", 500)),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

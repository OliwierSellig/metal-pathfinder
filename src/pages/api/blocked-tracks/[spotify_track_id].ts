import type { APIRoute } from "astro";
import type { SuccessMessageDTO, SpotifyTrackId } from "../../../types";
import { BlockedTracksService } from "../../../lib/services/blocked-tracks.service";
import { validateSpotifyTrackId } from "../../../lib/utils/validation";
import { TEST_USER_ID } from "../../../db/supabase.server";
import { TrackNotFoundError, DatabaseError, createErrorResponse, logError } from "../../../lib/utils/errors";

// Disable prerendering for API routes
export const prerender = false;

/**
 * DELETE /api/blocked-tracks/{spotify_track_id}
 * Removes a block from a track (unblocks it)
 *
 * @param params - URL parameters containing spotify_track_id
 * @param locals - Astro locals containing Supabase client
 * @returns JSON response with success message or error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Use test user ID for development (no authentication required yet)
    const userId = TEST_USER_ID;

    // Extract spotify_track_id from URL params
    const { spotify_track_id } = params;
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

    // Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      logError(new DatabaseError("Supabase client not available"), {
        operation: "unblock_track",
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

    // Create service instance
    const blockedTracksService = new BlockedTracksService(supabase);

    // Unblock the track
    await blockedTracksService.unblockTrack(userId, validatedTrackId);

    // Return success response
    const response: SuccessMessageDTO = {
      message: "Track unblocked successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known business logic errors
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
    logError(new DatabaseError("Unexpected error in DELETE /api/blocked-tracks/[spotify_track_id]", error as Error), {
      operation: "unblock_track",
      endpoint: "DELETE /api/blocked-tracks/[spotify_track_id]",
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

import type { APIRoute } from "astro";
import { SpotifyService } from "../../../lib/services/spotify.service";
import { createErrorResponse, logError } from "../../../lib/utils/errors";
import { TEST_USER_ID } from "../../../db/supabase.client";

// Disable prerendering for API routes
export const prerender = false;

/**
 * POST /api/spotify/tracks
 * Get details for multiple tracks by IDs
 */
export const POST: APIRoute = async ({ request }) => {
  const spotifyService = new SpotifyService();

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Request body must be valid JSON",
          status: 400,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { track_ids } = requestBody;

    // Validate track_ids
    if (!Array.isArray(track_ids) || track_ids.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "track_ids must be a non-empty array",
          status: 400,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (track_ids.length > 50) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Cannot request more than 50 tracks at once",
          status: 400,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get track details in batches
    const trackDetails = await spotifyService.getMultipleTrackDetails(track_ids);

    return new Response(JSON.stringify(trackDetails), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logError(new Error("Unexpected error in tracks endpoint", { cause: error }), {
      operation: "spotify_tracks_endpoint",
      user_id: TEST_USER_ID,
    });

    return new Response(
      JSON.stringify(createErrorResponse("Internal Server Error", "An unexpected error occurred.", 500)),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

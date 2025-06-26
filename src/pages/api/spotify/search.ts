import type { APIRoute } from "astro";
import { SpotifyService } from "../../../lib/services/spotify.service";
import { searchTrackQueryParamsSchema } from "../../../lib/utils/validation";
import { createErrorResponse, logError, ValidationError, SpotifyAPIError } from "../../../lib/utils/errors";
import { formatZodErrors } from "../../../lib/utils/validation";
import { TEST_USER_ID } from "../../../db/supabase.server";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/spotify/search
 * Searches for tracks in Spotify catalog
 */
export const GET: APIRoute = async ({ url }) => {
  const spotifyService = new SpotifyService();

  try {
    // Extract and validate query parameters
    const searchParams = url.searchParams;
    const rawParams = {
      q: searchParams.get("q"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
      market: searchParams.get("market"),
    };

    // Remove null values for Zod validation
    const cleanedParams = Object.fromEntries(Object.entries(rawParams).filter(([, value]) => value !== null));

    // Validate query parameters with Zod
    const validationResult = searchTrackQueryParamsSchema.safeParse(cleanedParams);

    if (!validationResult.success) {
      const validationErrors = formatZodErrors(validationResult.error);

      logError(new ValidationError("Search parameter validation failed", validationErrors), {
        operation: "validate_search_params",
        raw_params: rawParams,
        user_id: TEST_USER_ID,
      });

      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid search parameters",
          status: 400,
          errors: validationErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedParams = validationResult.data;

    // Perform Spotify search
    const searchResults = await spotifyService.searchTracks(validatedParams);

    // Log successful operation
    console.info("Spotify search completed successfully", {
      operation: "spotify_search_endpoint",
      user_id: TEST_USER_ID,
      query: validatedParams.q,
      total_results: searchResults.total,
      returned_tracks: searchResults.tracks.length,
      timestamp: new Date().toISOString(),
    });

    return new Response(JSON.stringify(searchResults), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle Spotify API specific errors
    if (error instanceof SpotifyAPIError) {
      logError(error, {
        operation: "spotify_search_endpoint",
        user_id: TEST_USER_ID,
        url: url.toString(),
      });

      // Map Spotify error codes to appropriate HTTP responses
      if (error.statusCode === 429) {
        return new Response(
          JSON.stringify(createErrorResponse("Too Many Requests", "Rate limit exceeded. Please try again later.", 429)),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.statusCode >= 500) {
        return new Response(
          JSON.stringify(createErrorResponse("Service Unavailable", "Spotify API is temporarily unavailable.", 503)),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Other Spotify API errors (400-499)
      return new Response(JSON.stringify(createErrorResponse("Bad Request", error.message, 400)), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    logError(new Error("Unexpected error in Spotify search endpoint", { cause: error }), {
      operation: "spotify_search_endpoint",
      user_id: TEST_USER_ID,
      url: url.toString(),
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

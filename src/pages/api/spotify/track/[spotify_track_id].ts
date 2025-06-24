import type { APIRoute } from "astro";
import { SpotifyService } from "../../../../lib/services/spotify.service";
import {
  trackDetailsPathParamsSchema,
  trackDetailsQueryParamsSchema,
  formatZodErrors,
} from "../../../../lib/utils/validation";
import { createErrorResponse, logError, ValidationError, SpotifyAPIError } from "../../../../lib/utils/errors";
import { TEST_USER_ID } from "../../../../db/supabase.client";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/spotify/track/{spotify_track_id}
 * Gets detailed information about a specific Spotify track
 */
export const GET: APIRoute = async ({ params, url }) => {
  const spotifyService = new SpotifyService();

  try {
    // Validate path parameters
    const pathValidationResult = trackDetailsPathParamsSchema.safeParse(params);

    if (!pathValidationResult.success) {
      const validationErrors = formatZodErrors(pathValidationResult.error);

      logError(new ValidationError("Path parameter validation failed", validationErrors), {
        operation: "validate_track_details_path",
        raw_params: params,
        user_id: TEST_USER_ID,
      });

      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid spotify_track_id parameter",
          status: 400,
          errors: validationErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { spotify_track_id } = pathValidationResult.data;

    // Extract and validate query parameters
    const searchParams = url.searchParams;
    const rawQueryParams = {
      market: searchParams.get("market"),
    };

    // Remove null values for Zod validation
    const cleanedQueryParams = Object.fromEntries(Object.entries(rawQueryParams).filter(([, value]) => value !== null));

    // Validate query parameters with Zod
    const queryValidationResult = trackDetailsQueryParamsSchema.safeParse(cleanedQueryParams);

    if (!queryValidationResult.success) {
      const validationErrors = formatZodErrors(queryValidationResult.error);

      logError(new ValidationError("Query parameter validation failed", validationErrors), {
        operation: "validate_track_details_query",
        raw_params: rawQueryParams,
        user_id: TEST_USER_ID,
      });

      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid query parameters",
          status: 400,
          errors: validationErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedQueryParams = queryValidationResult.data;

    // Get track details from Spotify
    const trackDetails = await spotifyService.getTrackDetails(spotify_track_id, validatedQueryParams);

    // Log successful operation
    console.info("Track details retrieved successfully", {
      operation: "track_details_endpoint",
      user_id: TEST_USER_ID,
      spotify_track_id,
      market: validatedQueryParams.market || "US",
      track_name: trackDetails.name,
      timestamp: new Date().toISOString(),
    });

    return new Response(JSON.stringify(trackDetails), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle Spotify API specific errors
    if (error instanceof SpotifyAPIError) {
      logError(error, {
        operation: "track_details_endpoint",
        user_id: TEST_USER_ID,
        spotify_track_id: params?.spotify_track_id,
        url: url.toString(),
      });

      // Map Spotify error codes to appropriate HTTP responses
      if (error.statusCode === 404) {
        return new Response(
          JSON.stringify(createErrorResponse("Not Found", "Track not found or not available in market", 404)),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

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
    logError(new Error("Unexpected error in track details endpoint", { cause: error }), {
      operation: "track_details_endpoint",
      user_id: TEST_USER_ID,
      spotify_track_id: params?.spotify_track_id,
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

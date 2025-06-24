import type { APIRoute } from "astro";
import { SpotifyService } from "../../../lib/services/spotify.service";
import { OpenAIService } from "../../../lib/services/openai.service";
import { LibraryService } from "../../../lib/services/library.service";
import { BlockedTracksService } from "../../../lib/services/blocked-tracks.service";
import { aiRecommendationsCommandSchema, formatZodErrors } from "../../../lib/utils/validation";
import {
  createErrorResponse,
  logError,
  ValidationError,
  SpotifyAPIError,
  OpenAIAPIError,
  AIGenerationError,
  TrackNotFoundError,
} from "../../../lib/utils/errors";
import { TEST_USER_ID } from "../../../db/supabase.client";
import type {
  AIRecommendationsResponseDTO,
  AIRecommendationDTO,
  BaseTrackInfoDTO,
  GenerationMetadataDTO,
  OpenAIRecommendationParams,
} from "../../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * POST /api/spotify/recommendations
 * Generates AI-powered track recommendations based on a base track and user preferences
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();
  const spotifyService = new SpotifyService();
  const openAIService = new OpenAIService();
  const libraryService = new LibraryService(locals.supabase);
  const blockedTracksService = new BlockedTracksService(locals.supabase);

  try {
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      logError(new ValidationError("Invalid JSON in request body", []), {
        operation: "ai_recommendations_endpoint",
        user_id: TEST_USER_ID,
      });

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

    // Validate request parameters with Zod
    const validationResult = aiRecommendationsCommandSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const validationErrors = formatZodErrors(validationResult.error);

      logError(new ValidationError("Request parameter validation failed", validationErrors), {
        operation: "ai_recommendations_endpoint",
        raw_body: requestBody,
        user_id: TEST_USER_ID,
      });

      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid request parameters",
          status: 400,
          errors: validationErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { base_track_id, description, temperature, count = 10 } = validationResult.data;

    // Step 1: Validate base track exists in user's library
    const isTrackInLibrary = await libraryService.isTrackInLibrary(TEST_USER_ID, base_track_id);

    if (!isTrackInLibrary) {
      logError(new TrackNotFoundError("Base track not found in user's library", base_track_id), {
        operation: "ai_recommendations_endpoint",
        user_id: TEST_USER_ID,
        base_track_id,
      });

      return new Response(
        JSON.stringify(createErrorResponse("Not Found", "Base track not found in your library", 404)),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Get base track details from Spotify
    const baseTrackDetails = await spotifyService.getTrackDetails(base_track_id);

    // Step 3: Get exclusion lists (library + blocked tracks) in parallel
    const [libraryTracks, blockedTracks] = await Promise.all([
      libraryService.getUserLibrary(TEST_USER_ID, { limit: 1000, offset: 0, sort: "created_at_desc" }),
      blockedTracksService.getActiveBlockedTracks(TEST_USER_ID),
    ]);

    // Combine exclusion lists
    const excludedTrackIds = [
      ...libraryTracks.tracks.map((track) => track.spotify_track_id),
      ...blockedTracks.blocked_tracks.map((track) => track.spotify_track_id),
    ];

    // Step 4: Prepare parameters for AI generation
    const openAIParams: OpenAIRecommendationParams = {
      base_track: {
        name: baseTrackDetails.name,
        artists: baseTrackDetails.artists.map((artist) => artist.name),
        genres: baseTrackDetails.artists.flatMap((artist) => artist.genres),
      },
      description: description.trim(),
      temperature,
      count: count * 2, // Request more to account for filtering
      excluded_track_ids: excludedTrackIds,
    };

    // Step 5: Generate AI recommendations (song/artist pairs)
    const aiRecommendations = await openAIService.generateRecommendations(openAIParams);

    // Step 6: Search for track IDs using Spotify Search
    const trackSearchResults = await Promise.all(
      aiRecommendations.recommendations.map((rec) =>
        spotifyService.searchTrackByNameAndArtist(rec.song_title, rec.artist_name)
      )
    );

    // Step 7: Filter out not found tracks
    const foundTrackIds = trackSearchResults
      .filter((result) => result.found && result.spotify_track_id !== null)
      .map((result) => result.spotify_track_id as string);

    // Check if we found enough tracks
    if (foundTrackIds.length === 0) {
      logError(new AIGenerationError("No tracks found in Spotify for AI recommendations"), {
        operation: "ai_recommendations_endpoint",
        user_id: TEST_USER_ID,
        base_track_id,
        ai_generated: aiRecommendations.recommendations.length,
        spotify_found: 0,
      });

      return new Response(
        JSON.stringify(
          createErrorResponse("Unprocessable Entity", "No matching tracks found in Spotify for AI recommendations", 422)
        ),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log search results for debugging
    console.info("Track search completed", {
      operation: "ai_recommendations_track_search",
      user_id: TEST_USER_ID,
      ai_generated: aiRecommendations.recommendations.length,
      spotify_found: foundTrackIds.length,
      not_found: trackSearchResults.filter((r) => !r.found).length,
      success_rate: `${Math.round((foundTrackIds.length / aiRecommendations.recommendations.length) * 100)}%`,
      timestamp: new Date().toISOString(),
    });

    // Log not found tracks for debugging
    const notFoundTracks = trackSearchResults.filter((r) => !r.found);
    if (notFoundTracks.length > 0) {
      console.warn("Some AI recommendations not found in Spotify", {
        operation: "ai_recommendations_track_search",
        user_id: TEST_USER_ID,
        not_found_tracks: notFoundTracks.map((t) => ({ song: t.song_title, artist: t.artist_name })),
        timestamp: new Date().toISOString(),
      });
    }

    // Step 8: Get detailed track info (batch)
    const recommendedTrackDetails = await spotifyService.getMultipleTrackDetails(foundTrackIds);

    // Step 7: Generate artist biographies in parallel
    const bioPromises = recommendedTrackDetails.map(async (track) => {
      const primaryArtist = track.artists[0];
      if (!primaryArtist) return "Artist biography not available.";

      try {
        const bioResponse = await openAIService.generateArtistBio({
          artist_name: primaryArtist.name,
          genres: primaryArtist.genres,
          focus_area: "metal_music",
        });
        return bioResponse.biography;
      } catch (error) {
        console.warn(`Failed to generate biography for ${primaryArtist.name}`, error);
        return "Artist biography not available.";
      }
    });

    const artistBios = await Promise.all(bioPromises);

    // Step 9: Transform to final DTO format with proper AI data mapping
    const recommendations: AIRecommendationDTO[] = recommendedTrackDetails
      .slice(0, count) // Limit to requested count
      .map((track, index) => {
        // Find the matching AI recommendation for this track
        const matchingSearchResult = trackSearchResults.find((sr) => sr.spotify_track_id === track.spotify_track_id);

        const matchingAIRec = matchingSearchResult
          ? aiRecommendations.recommendations.find(
              (rec) =>
                rec.song_title === matchingSearchResult.song_title &&
                rec.artist_name === matchingSearchResult.artist_name
            )
          : null;

        return {
          spotify_track_id: track.spotify_track_id,
          name: track.name,
          artists: track.artists.map((artist) => ({
            name: artist.name,
            spotify_artist_id: artist.spotify_artist_id,
          })),
          album: {
            name: track.album.name,
            spotify_album_id: track.album.spotify_album_id,
            release_date: track.album.release_date,
            images: track.album.images,
          },
          duration_ms: track.duration_ms,
          preview_url: track.preview_url,
          ai_reasoning: matchingAIRec?.reasoning || "No reasoning provided",
          artist_bio: artistBios[index] || "Artist biography not available.",
          popularity_score: track.popularity,
          recommendation_confidence: matchingAIRec?.confidence || 0.5,
        };
      });

    // Prepare base track info
    const baseTrack: BaseTrackInfoDTO = {
      spotify_track_id: baseTrackDetails.spotify_track_id,
      name: baseTrackDetails.name,
      artists: baseTrackDetails.artists.map((artist) => ({ name: artist.name })),
    };

    // Prepare generation metadata
    const generationMetadata: GenerationMetadataDTO = {
      ai_model: "gpt-4o-mini",
      temperature_used: temperature,
      description_processed: description.trim().substring(0, 100) + (description.length > 100 ? "..." : ""),
      excluded_tracks_count: excludedTrackIds.length,
      generation_time_ms: Date.now() - startTime,
    };

    // Final response
    const response: AIRecommendationsResponseDTO = {
      recommendations,
      base_track: baseTrack,
      generation_metadata: generationMetadata,
    };

    // Log successful operation
    console.info("AI recommendations generated successfully", {
      operation: "ai_recommendations_endpoint",
      user_id: TEST_USER_ID,
      base_track_id,
      generated_count: recommendations.length,
      temperature,
      generation_time_ms: generationMetadata.generation_time_ms,
      timestamp: new Date().toISOString(),
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const generationTime = Date.now() - startTime;

    // Handle specific error types with appropriate responses
    if (error instanceof ValidationError) {
      logError(error, {
        operation: "ai_recommendations_endpoint",
        user_id: TEST_USER_ID,
        generation_time_ms: generationTime,
      });

      return new Response(
        JSON.stringify({
          error: "Unprocessable Entity",
          message: error.message,
          status: 422,
          errors: error.errors,
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof TrackNotFoundError) {
      return new Response(JSON.stringify(createErrorResponse("Not Found", error.message, 404)), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof AIGenerationError) {
      logError(error, {
        operation: "ai_recommendations_endpoint",
        user_id: TEST_USER_ID,
        generation_time_ms: generationTime,
      });

      return new Response(
        JSON.stringify(createErrorResponse("Unprocessable Entity", "AI generation failed. Please try again.", 422)),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof OpenAIAPIError) {
      logError(error, {
        operation: "ai_recommendations_endpoint",
        user_id: TEST_USER_ID,
        generation_time_ms: generationTime,
      });

      if (error.statusCode === 429) {
        return new Response(
          JSON.stringify(
            createErrorResponse("Too Many Requests", "AI service rate limit exceeded. Please try again later.", 429)
          ),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify(createErrorResponse("Service Unavailable", "AI service temporarily unavailable.", 503)),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof SpotifyAPIError) {
      logError(error, {
        operation: "ai_recommendations_endpoint",
        user_id: TEST_USER_ID,
        generation_time_ms: generationTime,
      });

      if (error.statusCode === 429) {
        return new Response(
          JSON.stringify(
            createErrorResponse("Too Many Requests", "Music service rate limit exceeded. Please try again later.", 429)
          ),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify(createErrorResponse("Service Unavailable", "Music service temporarily unavailable.", 503)),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    logError(new Error("Unexpected error in AI recommendations endpoint", { cause: error }), {
      operation: "ai_recommendations_endpoint",
      user_id: TEST_USER_ID,
      generation_time_ms: generationTime,
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

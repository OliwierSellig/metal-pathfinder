import type {
  SearchTrackQueryParams,
  SearchTrackResponseDTO,
  SpotifyTrackSearchDTO,
  SpotifyArtistSearchDTO,
  SpotifyImageDTO,
  TrackDetailsQueryParams,
  TrackDetailsResponseDTO,
  SpotifyArtistDetailsDTO,
  TrackSearchResult,
} from "../../types";
import { logError, SpotifyAPIError } from "../utils/errors";
import type {
  SpotifySearchResponse,
  SpotifyTokenResponse,
  SpotifyTrackDetailsItem,
} from "../integrations/spotify/types";

/**
 * Service class for Spotify Web API integration
 * Handles authentication via Client Credentials Flow and search operations
 */
export class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseURL = "https://api.spotify.com/v1";
  private readonly authURL = "https://accounts.spotify.com/api/token";

  constructor() {
    this.clientId = import.meta.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;

    if (!this.clientId || !this.clientSecret) {
      throw new Error("Spotify Client ID and Client Secret must be provided in environment variables");
    }
  }

  /**
   * Authenticates with Spotify using Client Credentials Flow
   * Caches the token until expiration
   * @returns Access token for API requests
   * @throws SpotifyAPIError for authentication failures
   */
  private async authenticate(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

      const response = await fetch(this.authURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        throw new SpotifyAPIError(
          `Spotify authentication failed: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const tokenData: SpotifyTokenResponse = await response.json();

      this.accessToken = tokenData.access_token;
      // Set expiration 5 minutes before actual expiry for safety
      this.tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in - 300) * 1000);

      console.info("Spotify authentication successful", {
        operation: "spotify_authenticate",
        expires_at: this.tokenExpiresAt.toISOString(),
        timestamp: new Date().toISOString(),
      });

      return this.accessToken;
    } catch (error) {
      const spotifyError =
        error instanceof SpotifyAPIError
          ? error
          : new SpotifyAPIError("Failed to authenticate with Spotify", 503, error as Error);

      logError(spotifyError, {
        operation: "spotify_authenticate",
      });

      throw spotifyError;
    }
  }

  /**
   * Searches for tracks using Spotify Web API
   * @param params Search parameters including query, pagination, and market
   * @returns Search results with tracks and pagination metadata
   * @throws SpotifyAPIError for API failures
   */
  async searchTracks(params: SearchTrackQueryParams): Promise<SearchTrackResponseDTO> {
    try {
      const accessToken = await this.authenticate();

      // Build search URL with parameters
      const searchParams = new URLSearchParams({
        q: params.q,
        type: "track",
        limit: params.limit?.toString() || "20",
        offset: params.offset?.toString() || "0",
        market: params.market || "US",
      });

      const url = `${this.baseURL}/search?${searchParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new SpotifyAPIError("Rate limit exceeded", 429);
        }

        throw new SpotifyAPIError(
          `Spotify search failed: ${response.status} ${response.statusText}`,
          response.status >= 500 ? 503 : response.status
        );
      }

      const searchData: SpotifySearchResponse = await response.json();

      // Transform Spotify response to our DTO format
      const tracks: SpotifyTrackSearchDTO[] = searchData.tracks.items.map((track) => ({
        spotify_track_id: track.id,
        name: track.name,
        artists: track.artists.map(
          (artist): SpotifyArtistSearchDTO => ({
            name: artist.name,
            spotify_artist_id: artist.id,
          })
        ),
        album: {
          name: track.album.name,
          spotify_album_id: track.album.id,
          release_date: track.album.release_date,
          images: track.album.images.map(
            (image): SpotifyImageDTO => ({
              url: image.url,
              height: image.height,
              width: image.width,
            })
          ),
        },
        duration_ms: track.duration_ms,
      }));

      const result: SearchTrackResponseDTO = {
        tracks,
        total: searchData.tracks.total,
        limit: searchData.tracks.limit,
        offset: searchData.tracks.offset,
        has_more: searchData.tracks.offset + searchData.tracks.limit < searchData.tracks.total,
      };

      console.info("Spotify search completed successfully", {
        operation: "spotify_search_tracks",
        query: params.q,
        total_results: result.total,
        returned_tracks: tracks.length,
        market: params.market || "US",
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      if (error instanceof SpotifyAPIError) {
        throw error;
      }

      const spotifyError = new SpotifyAPIError("Unexpected error during Spotify search", 503, error as Error);

      logError(spotifyError, {
        operation: "spotify_search_tracks",
        params,
      });

      throw spotifyError;
    }
  }

  /**
   * Gets detailed information about a specific track using Spotify Web API
   * @param spotifyTrackId Spotify track ID (22 characters)
   * @param params Query parameters including optional market
   * @returns Detailed track information
   * @throws SpotifyAPIError for API failures
   */
  async getTrackDetails(
    spotifyTrackId: string,
    params: TrackDetailsQueryParams = {}
  ): Promise<TrackDetailsResponseDTO> {
    try {
      const accessToken = await this.authenticate();

      // Build track details URL with parameters
      const queryParams = new URLSearchParams();
      if (params.market) {
        queryParams.set("market", params.market);
      } else {
        queryParams.set("market", "US");
      }

      const url = `${this.baseURL}/tracks/${spotifyTrackId}?${queryParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new SpotifyAPIError("Track not found or not available in market", 404);
        }

        if (response.status === 429) {
          throw new SpotifyAPIError("Rate limit exceeded", 429);
        }

        throw new SpotifyAPIError(
          `Spotify track details failed: ${response.status} ${response.statusText}`,
          response.status >= 500 ? 503 : response.status
        );
      }

      const trackData: SpotifyTrackDetailsItem = await response.json();

      // Transform Spotify response to our DTO format
      const result: TrackDetailsResponseDTO = {
        spotify_track_id: trackData.id,
        name: trackData.name,
        artists: trackData.artists.map(
          (artist): SpotifyArtistDetailsDTO => ({
            name: artist.name,
            spotify_artist_id: artist.id,
            genres: artist.genres || [], // Handle undefined/null genres
          })
        ),
        album: {
          name: trackData.album.name,
          spotify_album_id: trackData.album.id,
          release_date: trackData.album.release_date,
          total_tracks: trackData.album.total_tracks,
          images: trackData.album.images.map(
            (image): SpotifyImageDTO => ({
              url: image.url,
              height: image.height,
              width: image.width,
            })
          ),
        },
        duration_ms: trackData.duration_ms,
        explicit: trackData.explicit,
        popularity: trackData.popularity,
      };

      console.info("Spotify track details retrieved successfully", {
        operation: "spotify_get_track_details",
        spotify_track_id: spotifyTrackId,
        market: params.market || "US",
        popularity: result.popularity,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      if (error instanceof SpotifyAPIError) {
        throw error;
      }

      const spotifyError = new SpotifyAPIError("Unexpected error during Spotify track details", 503, error as Error);

      logError(spotifyError, {
        operation: "spotify_get_track_details",
        spotify_track_id: spotifyTrackId,
        params,
      });

      throw spotifyError;
    }
  }

  /**
   * Gets detailed information about multiple tracks using Spotify Web API
   * Uses batch processing for optimal performance
   * @param spotifyTrackIds Array of Spotify track IDs (max 50)
   * @param params Query parameters including optional market
   * @returns Array of detailed track information
   * @throws SpotifyAPIError for API failures
   */
  async getMultipleTrackDetails(
    spotifyTrackIds: string[],
    params: TrackDetailsQueryParams = {}
  ): Promise<TrackDetailsResponseDTO[]> {
    if (spotifyTrackIds.length === 0) {
      return [];
    }

    if (spotifyTrackIds.length > 50) {
      throw new SpotifyAPIError("Cannot fetch more than 50 tracks at once", 400);
    }

    try {
      const accessToken = await this.authenticate();

      // Build tracks URL with parameters
      const queryParams = new URLSearchParams();
      queryParams.set("ids", spotifyTrackIds.join(","));
      if (params.market) {
        queryParams.set("market", params.market);
      } else {
        queryParams.set("market", "US");
      }

      const url = `${this.baseURL}/tracks?${queryParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new SpotifyAPIError("Rate limit exceeded", 429);
        }

        throw new SpotifyAPIError(
          `Spotify multiple tracks failed: ${response.status} ${response.statusText}`,
          response.status >= 500 ? 503 : response.status
        );
      }

      const data = await response.json();

      if (!data.tracks || !Array.isArray(data.tracks)) {
        throw new SpotifyAPIError("Invalid response format from Spotify tracks endpoint", 503);
      }

      // Transform Spotify response to our DTO format, filtering out null tracks
      const results: TrackDetailsResponseDTO[] = data.tracks
        .filter((trackData: SpotifyTrackDetailsItem | null) => trackData !== null)
        .map(
          (trackData: SpotifyTrackDetailsItem): TrackDetailsResponseDTO => ({
            spotify_track_id: trackData.id,
            name: trackData.name,
            artists: trackData.artists.map(
              (artist): SpotifyArtistDetailsDTO => ({
                name: artist.name,
                spotify_artist_id: artist.id,
                genres: artist.genres || [], // Handle undefined/null genres
              })
            ),
            album: {
              name: trackData.album.name,
              spotify_album_id: trackData.album.id,
              release_date: trackData.album.release_date,
              total_tracks: trackData.album.total_tracks,
              images: trackData.album.images.map(
                (image): SpotifyImageDTO => ({
                  url: image.url,
                  height: image.height,
                  width: image.width,
                })
              ),
            },
            duration_ms: trackData.duration_ms,
            explicit: trackData.explicit,
            popularity: trackData.popularity,
          })
        );

      console.info("Spotify multiple track details retrieved successfully", {
        operation: "spotify_get_multiple_track_details",
        requested_count: spotifyTrackIds.length,
        returned_count: results.length,
        market: params.market || "US",
        timestamp: new Date().toISOString(),
      });

      return results;
    } catch (error) {
      if (error instanceof SpotifyAPIError) {
        throw error;
      }

      const spotifyError = new SpotifyAPIError("Unexpected error during multiple track details", 503, error as Error);

      logError(spotifyError, {
        operation: "spotify_get_multiple_track_details",
        track_ids: spotifyTrackIds,
        params,
      });

      throw spotifyError;
    }
  }

  /**
   * Validates if a track exists and is available in the specified market
   * @param spotifyTrackId Spotify track ID to validate
   * @param market Market for track availability (default: "US")
   * @returns True if track exists and is available
   * @throws SpotifyAPIError for API failures or track not found
   */
  async validateTrackExists(spotifyTrackId: string, market = "US"): Promise<boolean> {
    try {
      await this.getTrackDetails(spotifyTrackId, { market });
      return true;
    } catch (error) {
      if (error instanceof SpotifyAPIError && error.statusCode === 404) {
        return false;
      }
      // Re-throw other errors (API errors, rate limits, etc.)
      throw error;
    }
  }

  /**
   * Searches for a track by song title and artist name, returns the most popular match
   * @param songTitle Song title to search for
   * @param artistName Artist name to search for
   * @param market Market for track availability (default: "US")
   * @returns Track search result with Spotify ID if found
   * @throws SpotifyAPIError for API failures
   */
  async searchTrackByNameAndArtist(songTitle: string, artistName: string, market = "US"): Promise<TrackSearchResult> {
    try {
      // Build search query: "song title" artist:"artist name"
      const searchQuery = `"${songTitle.trim()}" artist:"${artistName.trim()}"`;

      // DETAILED LOGGING: Log the search query we're about to send
      console.info("DETAILED: Spotify search query", {
        operation: "spotify_search_track_detailed",
        original_song_title: songTitle,
        original_artist_name: artistName,
        formatted_search_query: searchQuery,
        market,
        timestamp: new Date().toISOString(),
      });

      const searchResults = await this.searchTracks({
        q: searchQuery,
        limit: 1, // Only need the most popular result
        offset: 0,
        market,
      });

      // DETAILED LOGGING: Log the raw search results from Spotify
      console.info("DETAILED: Spotify search raw results", {
        operation: "spotify_search_track_raw_results",
        search_query: searchQuery,
        total_results_found: searchResults.total,
        tracks_returned: searchResults.tracks.length,
        raw_tracks: searchResults.tracks.map((track) => ({
          spotify_id: track.spotify_track_id,
          name: track.name,
          artists: track.artists.map((a) => a.name),
        })),
        timestamp: new Date().toISOString(),
      });

      // Check if we found any results
      if (searchResults.tracks.length === 0) {
        console.info("No tracks found for search query", {
          operation: "spotify_search_track_by_name_artist",
          song_title: songTitle,
          artist_name: artistName,
          search_query: searchQuery,
          market,
          timestamp: new Date().toISOString(),
        });

        return {
          spotify_track_id: null,
          song_title: songTitle,
          artist_name: artistName,
          found: false,
        };
      }

      // Get the first (most popular) result
      const foundTrack = searchResults.tracks[0];
      const foundArtist = foundTrack.artists[0];

      console.info("Track found via search", {
        operation: "spotify_search_track_by_name_artist",
        song_title: songTitle,
        artist_name: artistName,
        found_track_id: foundTrack.spotify_track_id,
        found_track_name: foundTrack.name,
        found_artist_name: foundArtist?.name,
        search_query: searchQuery,
        market,
        timestamp: new Date().toISOString(),
      });

      return {
        spotify_track_id: foundTrack.spotify_track_id,
        song_title: songTitle,
        artist_name: artistName,
        found: true,
        actual_song_title: foundTrack.name,
        actual_artist_name: foundArtist?.name,
      };
    } catch (error) {
      if (error instanceof SpotifyAPIError) {
        throw error;
      }

      const spotifyError = new SpotifyAPIError(
        "Unexpected error during track search by name and artist",
        503,
        error as Error
      );

      logError(spotifyError, {
        operation: "spotify_search_track_by_name_artist",
        song_title: songTitle,
        artist_name: artistName,
        market,
      });

      throw spotifyError;
    }
  }
}

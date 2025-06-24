import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LibraryTrackDTO,
  UserLibraryInsert,
  SpotifyTrackId,
  LibraryResponseDTO,
  LibrarySortOption,
} from "../../types";
import type { Database } from "../../db/database.types";
import {
  DuplicateTrackError,
  DatabaseError,
  LastTrackError,
  TrackNotFoundError,
  TrackBlockedError,
  logError,
} from "../utils/errors";

/**
 * Options for getUserLibrary method
 */
interface LibraryServiceOptions {
  limit: number;
  offset: number;
  sort: LibrarySortOption;
}

/**
 * Service class for managing user library operations
 */
export class LibraryService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves user's library with pagination and sorting
   * @param userId - User ID (UUID)
   * @param options - Pagination and sorting options
   * @returns Library response with tracks, total count, and pagination info
   * @throws DatabaseError for database-related errors
   */
  async getUserLibrary(userId: string, options: LibraryServiceOptions): Promise<LibraryResponseDTO> {
    try {
      const { limit, offset, sort } = options;

      // Determine sort order for SQL query
      const orderBy =
        sort === "created_at_asc"
          ? { column: "created_at", ascending: true }
          : { column: "created_at", ascending: false };

      // Fetch tracks with pagination and sorting
      const { data: tracks, error: tracksError } = await this.supabase
        .from("user_library")
        .select("spotify_track_id, created_at")
        .eq("user_id", userId)
        .order(orderBy.column, { ascending: orderBy.ascending })
        .range(offset, offset + limit - 1);

      if (tracksError) {
        logError(new DatabaseError("Failed to fetch user library", tracksError), {
          operation: "get_user_library_tracks",
          user_id: userId,
          options,
        });
        throw new DatabaseError("Failed to fetch user library");
      }

      // Fetch total count for pagination metadata
      const { count: totalCount, error: countError } = await this.supabase
        .from("user_library")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) {
        logError(new DatabaseError("Failed to get library count", countError), {
          operation: "get_user_library_count",
          user_id: userId,
        });
        throw new DatabaseError("Failed to get library count");
      }

      // Calculate pagination metadata
      const total_count = totalCount || 0;
      const has_more = offset + limit < total_count;

      // Log successful operation
      console.info("Library retrieved successfully", {
        operation: "get_user_library",
        user_id: userId,
        total_count,
        returned_tracks: tracks?.length || 0,
        has_more,
        timestamp: new Date().toISOString(),
      });

      return {
        tracks: tracks || [],
        total_count,
        has_more,
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof DatabaseError) {
        throw error;
      }

      // Handle unexpected errors
      logError(new DatabaseError("Unexpected error in getUserLibrary", error as Error), {
        operation: "get_user_library",
        user_id: userId,
        options,
      });
      throw new DatabaseError("An unexpected error occurred while retrieving library");
    }
  }

  /**
   * Adds a track to user's library
   * @param userId - User ID (UUID)
   * @param spotifyTrackId - Validated Spotify track ID
   * @returns Created library track DTO
   * @throws TrackBlockedError if track is currently blocked
   * @throws DuplicateTrackError if track already exists
   * @throws DatabaseError for database-related errors
   */
  async addTrackToLibrary(userId: string, spotifyTrackId: SpotifyTrackId): Promise<LibraryTrackDTO> {
    try {
      // First check if track is currently blocked
      const { data: blockedTrack, error: blockedCheckError } = await this.supabase
        .from("blocked_tracks")
        .select("expires_at")
        .eq("user_id", userId)
        .eq("spotify_track_id", spotifyTrackId)
        .maybeSingle();

      if (blockedCheckError) {
        logError(new DatabaseError("Failed to check blocked tracks", blockedCheckError), {
          operation: "check_blocked_track",
          user_id: userId,
          spotify_track_id: spotifyTrackId,
        });
        throw new DatabaseError("Failed to check blocked tracks");
      }

      // Check if track is actively blocked (permanent or not yet expired)
      if (blockedTrack) {
        const isActiveBlock = blockedTrack.expires_at === null || new Date(blockedTrack.expires_at) > new Date();

        if (isActiveBlock) {
          logError(new TrackBlockedError("Cannot add blocked track to your library", spotifyTrackId), {
            operation: "add_track_to_library",
            user_id: userId,
            spotify_track_id: spotifyTrackId,
            violation: "track_blocked",
            expires_at: blockedTrack.expires_at,
          });
          throw new TrackBlockedError("Cannot add blocked track to your library");
        }
      }

      // Then check if track already exists in user's library
      const { data: existingTrack, error: checkError } = await this.supabase
        .from("user_library")
        .select("id")
        .eq("user_id", userId)
        .eq("spotify_track_id", spotifyTrackId)
        .maybeSingle();

      if (checkError) {
        logError(new DatabaseError("Failed to check for existing track", checkError), {
          operation: "check_duplicate_track",
          user_id: userId,
          spotify_track_id: spotifyTrackId,
        });
        throw new DatabaseError("Failed to check for existing track");
      }

      if (existingTrack) {
        logError(new DuplicateTrackError(), {
          operation: "add_track_to_library",
          user_id: userId,
          spotify_track_id: spotifyTrackId,
        });
        throw new DuplicateTrackError();
      }

      // Insert new track into library
      const insertData: UserLibraryInsert = {
        user_id: userId,
        spotify_track_id: spotifyTrackId,
      };

      const { data: newTrack, error: insertError } = await this.supabase
        .from("user_library")
        .insert(insertData)
        .select("spotify_track_id, created_at")
        .single();

      if (insertError) {
        // Handle unique constraint violation (duplicate track)
        if (insertError.code === "23505") {
          logError(new DuplicateTrackError(), {
            operation: "add_track_to_library",
            user_id: userId,
            spotify_track_id: spotifyTrackId,
            constraint_violation: true,
          });
          throw new DuplicateTrackError();
        }

        logError(new DatabaseError("Failed to insert track", insertError), {
          operation: "add_track_to_library",
          user_id: userId,
          spotify_track_id: spotifyTrackId,
        });
        throw new DatabaseError("Failed to insert track");
      }

      // Log successful operation
      console.info("Track added to library successfully", {
        operation: "add_track_to_library",
        user_id: userId,
        spotify_track_id: spotifyTrackId,
        timestamp: new Date().toISOString(),
      });

      return newTrack;
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof TrackBlockedError ||
        error instanceof DuplicateTrackError ||
        error instanceof DatabaseError
      ) {
        throw error;
      }

      // Handle unexpected errors
      logError(new DatabaseError("Unexpected error in addTrackToLibrary", error as Error), {
        operation: "add_track_to_library",
        user_id: userId,
        spotify_track_id: spotifyTrackId,
      });
      throw new DatabaseError("An unexpected error occurred");
    }
  }

  /**
   * Removes a track from user's library
   * @param userId - User ID (UUID)
   * @param spotifyTrackId - Validated Spotify track ID
   * @throws TrackNotFoundError if track doesn't exist in library
   * @throws LastTrackError if attempting to remove the last track
   * @throws DatabaseError for database-related errors
   */
  async removeTrackFromLibrary(userId: string, spotifyTrackId: SpotifyTrackId): Promise<void> {
    try {
      // First check if track exists in user's library
      const { data: existingTrack, error: checkError } = await this.supabase
        .from("user_library")
        .select("id")
        .eq("user_id", userId)
        .eq("spotify_track_id", spotifyTrackId)
        .maybeSingle();

      if (checkError) {
        logError(new DatabaseError("Failed to check for existing track", checkError), {
          operation: "check_track_exists",
          user_id: userId,
          spotify_track_id: spotifyTrackId,
        });
        throw new DatabaseError("Failed to check for existing track");
      }

      if (!existingTrack) {
        logError(new TrackNotFoundError("Track not found in user's library", spotifyTrackId), {
          operation: "remove_track_from_library",
          user_id: userId,
          spotify_track_id: spotifyTrackId,
        });
        throw new TrackNotFoundError("Track not found in user's library");
      }

      // Check total number of tracks to enforce minimum library size
      const { count: totalTracks, error: countError } = await this.supabase
        .from("user_library")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) {
        logError(new DatabaseError("Failed to get library count", countError), {
          operation: "check_library_count",
          user_id: userId,
        });
        throw new DatabaseError("Failed to get library count");
      }

      // Business rule: User must have at least one track in library
      if (totalTracks === 1) {
        logError(new LastTrackError("Cannot remove last track from library", totalTracks), {
          operation: "remove_track_from_library",
          user_id: userId,
          spotify_track_id: spotifyTrackId,
          violation: "last_track_protection",
          current_count: totalTracks,
        });
        throw new LastTrackError("Cannot remove last track from library");
      }

      // Remove track from library
      const { error: deleteError } = await this.supabase
        .from("user_library")
        .delete()
        .eq("user_id", userId)
        .eq("spotify_track_id", spotifyTrackId);

      if (deleteError) {
        logError(new DatabaseError("Failed to remove track from library", deleteError), {
          operation: "remove_track_from_library",
          user_id: userId,
          spotify_track_id: spotifyTrackId,
        });
        throw new DatabaseError("Failed to remove track from library");
      }

      // Log successful operation
      console.info("Track removed from library successfully", {
        operation: "remove_track_from_library",
        user_id: userId,
        spotify_track_id: spotifyTrackId,
        remaining_tracks: (totalTracks || 1) - 1,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Re-throw known errors
      if (error instanceof TrackNotFoundError || error instanceof LastTrackError || error instanceof DatabaseError) {
        throw error;
      }

      // Handle unexpected errors
      logError(new DatabaseError("Unexpected error in removeTrackFromLibrary", error as Error), {
        operation: "remove_track_from_library",
        user_id: userId,
        spotify_track_id: spotifyTrackId,
      });
      throw new DatabaseError("An unexpected error occurred while removing track from library");
    }
  }

  /**
   * Checks if a track exists in user's library
   * @param userId - User ID (UUID)
   * @param spotifyTrackId - Spotify track ID to check
   * @returns True if track exists in library, false otherwise
   * @throws DatabaseError for database-related errors
   */
  async isTrackInLibrary(userId: string, spotifyTrackId: string): Promise<boolean> {
    try {
      const { data: existingTrack, error: checkError } = await this.supabase
        .from("user_library")
        .select("id")
        .eq("user_id", userId)
        .eq("spotify_track_id", spotifyTrackId)
        .maybeSingle();

      if (checkError) {
        logError(new DatabaseError("Failed to check if track exists in library", checkError), {
          operation: "is_track_in_library",
          user_id: userId,
          spotify_track_id: spotifyTrackId,
        });
        throw new DatabaseError("Failed to check if track exists in library");
      }

      return existingTrack !== null;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof DatabaseError) {
        throw error;
      }

      // Handle unexpected errors
      logError(new DatabaseError("Unexpected error in isTrackInLibrary", error as Error), {
        operation: "is_track_in_library",
        user_id: userId,
        spotify_track_id: spotifyTrackId,
      });
      throw new DatabaseError("An unexpected error occurred while checking track in library");
    }
  }
}

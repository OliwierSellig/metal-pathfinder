import type { SupabaseClient } from "@supabase/supabase-js";
import type { LibraryTrackDTO, UserLibraryInsert, SpotifyTrackId } from "../../types";
import type { Database } from "../../db/database.types";
import { DuplicateTrackError, DatabaseError, logError } from "../utils/errors";

/**
 * Service class for managing user library operations
 */
export class LibraryService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Adds a track to user's library
   * @param userId - User ID (UUID)
   * @param spotifyTrackId - Validated Spotify track ID
   * @returns Created library track DTO
   * @throws DuplicateTrackError if track already exists
   * @throws DatabaseError for database-related errors
   */
  async addTrackToLibrary(userId: string, spotifyTrackId: SpotifyTrackId): Promise<LibraryTrackDTO> {
    try {
      // First check if track already exists in user's library
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
      if (error instanceof DuplicateTrackError || error instanceof DatabaseError) {
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
}

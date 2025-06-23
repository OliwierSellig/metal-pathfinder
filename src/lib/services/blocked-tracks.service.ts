import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BlockedTracksResponseDTO,
  BlockedTrackDTO,
  BlockTrackCommand,
  BlockTrackResponseDTO,
  SpotifyTrackId,
  BlockDuration,
  BlockedTrackInsert,
} from "../../types";
import type { Database } from "../../db/database.types";
import { DatabaseError, TrackNotFoundError, DuplicateTrackError, TrackInLibraryError, logError } from "../utils/errors";

/**
 * Options for getBlockedTracks method
 */
interface BlockedTracksServiceOptions {
  active_only: boolean;
  limit: number;
  offset: number;
}

/**
 * Service class for managing blocked tracks operations
 */
export class BlockedTracksService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves user's blocked tracks with filtering and pagination
   * @param userId - User ID (UUID)
   * @param options - Filtering and pagination options
   * @returns Blocked tracks response with tracks and total count
   * @throws DatabaseError for database-related errors
   */
  async getBlockedTracks(userId: string, options: BlockedTracksServiceOptions): Promise<BlockedTracksResponseDTO> {
    try {
      const { active_only, limit, offset } = options;

      // Build query with conditional active filter
      let query = this.supabase
        .from("blocked_tracks")
        .select("spotify_track_id, expires_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Apply active filter if requested
      if (active_only) {
        query = query.or("expires_at.is.null,expires_at.gt.now()");
      }

      // Apply pagination
      const { data: tracks, error: tracksError } = await query.range(offset, offset + limit - 1);

      if (tracksError) {
        logError(new DatabaseError("Failed to fetch blocked tracks", tracksError), {
          operation: "get_blocked_tracks",
          user_id: userId,
          options,
        });
        throw new DatabaseError("Failed to fetch blocked tracks");
      }

      // Get total count with same filters
      let countQuery = this.supabase
        .from("blocked_tracks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (active_only) {
        countQuery = countQuery.or("expires_at.is.null,expires_at.gt.now()");
      }

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        logError(new DatabaseError("Failed to get blocked tracks count", countError), {
          operation: "get_blocked_tracks_count",
          user_id: userId,
        });
        throw new DatabaseError("Failed to get blocked tracks count");
      }

      // Transform entities to DTOs with computed is_active field
      const blockedTracksDTO: BlockedTrackDTO[] = (tracks || []).map((track) => ({
        spotify_track_id: track.spotify_track_id,
        expires_at: track.expires_at,
        created_at: track.created_at,
        is_active: this.isTrackActiveFromPartial(track),
      }));

      // Log successful operation
      console.info("Blocked tracks retrieved successfully", {
        operation: "get_blocked_tracks",
        user_id: userId,
        total_count: totalCount || 0,
        returned_tracks: blockedTracksDTO.length,
        active_only,
        timestamp: new Date().toISOString(),
      });

      return {
        blocked_tracks: blockedTracksDTO,
        total_count: totalCount || 0,
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof DatabaseError) {
        throw error;
      }

      // Handle unexpected errors
      logError(new DatabaseError("Unexpected error in getBlockedTracks", error as Error), {
        operation: "get_blocked_tracks",
        user_id: userId,
        options,
      });
      throw new DatabaseError("An unexpected error occurred while retrieving blocked tracks");
    }
  }

  /**
   * Determines if a blocked track is currently active (not expired)
   * @param track - Partial blocked track data from database query
   * @returns true if block is active (permanent or not yet expired)
   */
  private isTrackActiveFromPartial(track: { expires_at: string | null }): boolean {
    // Permanent blocks (expires_at is null) are always active
    if (track.expires_at === null) {
      return true;
    }

    // Check if expiry date is in the future
    const expiryDate = new Date(track.expires_at);
    const now = new Date();
    return expiryDate > now;
  }

  /**
   * Removes a block from a track (unblocks it)
   * @param userId - User ID (UUID)
   * @param spotifyTrackId - Validated Spotify track ID
   * @throws TrackNotFoundError if track is not blocked by user
   * @throws DatabaseError for database-related errors
   */
  async unblockTrack(userId: string, spotifyTrackId: SpotifyTrackId): Promise<void> {
    try {
      // Attempt to delete the blocked track
      const { count: deletedCount, error: deleteError } = await this.supabase
        .from("blocked_tracks")
        .delete({ count: "exact" })
        .eq("user_id", userId)
        .eq("spotify_track_id", spotifyTrackId);

      if (deleteError) {
        logError(new DatabaseError("Failed to unblock track", deleteError), {
          operation: "unblock_track",
          user_id: userId,
          spotify_track_id: spotifyTrackId,
        });
        throw new DatabaseError("Failed to unblock track");
      }

      // Check if track was actually found and deleted
      if (deletedCount === 0) {
        logError(new TrackNotFoundError("Track not blocked by user"), {
          operation: "unblock_track",
          user_id: userId,
          spotify_track_id: spotifyTrackId,
        });
        throw new TrackNotFoundError("Track not blocked by user");
      }

      // Log successful operation
      console.info("Track unblocked successfully", {
        operation: "unblock_track",
        user_id: userId,
        spotify_track_id: spotifyTrackId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Re-throw known errors
      if (error instanceof TrackNotFoundError || error instanceof DatabaseError) {
        throw error;
      }

      // Handle unexpected errors
      logError(new DatabaseError("Unexpected error in unblockTrack", error as Error), {
        operation: "unblock_track",
        user_id: userId,
        spotify_track_id: spotifyTrackId,
      });
      throw new DatabaseError("An unexpected error occurred");
    }
  }

  /**
   * Blocks a track from recommendations for specified duration
   * @param userId - User ID (UUID)
   * @param command - Block track command with spotify_track_id and duration
   * @returns Created block details with computed duration
   * @throws TrackInLibraryError if track exists in user's library
   * @throws DuplicateTrackError if track is already blocked
   * @throws DatabaseError for database-related errors
   */
  async blockTrack(userId: string, command: BlockTrackCommand): Promise<BlockTrackResponseDTO> {
    try {
      const { spotify_track_id, duration } = command;

      // Calculate expires_at based on duration
      const expires_at = this.calculateExpiryDate(duration);

      // First check if track exists in user's library
      const { data: libraryTrack, error: libraryCheckError } = await this.supabase
        .from("user_library")
        .select("id")
        .eq("user_id", userId)
        .eq("spotify_track_id", spotify_track_id)
        .maybeSingle();

      if (libraryCheckError) {
        logError(new DatabaseError("Failed to check user library", libraryCheckError), {
          operation: "check_library_track",
          user_id: userId,
          spotify_track_id,
        });
        throw new DatabaseError("Failed to check user library");
      }

      if (libraryTrack) {
        logError(new TrackInLibraryError("Cannot block track that exists in your library", spotify_track_id), {
          operation: "block_track",
          user_id: userId,
          spotify_track_id,
          violation: "track_in_library",
        });
        throw new TrackInLibraryError("Cannot block track that exists in your library");
      }

      // Then check if track is already blocked
      const { data: existingBlock, error: checkError } = await this.supabase
        .from("blocked_tracks")
        .select("id")
        .eq("user_id", userId)
        .eq("spotify_track_id", spotify_track_id)
        .maybeSingle();

      if (checkError) {
        logError(new DatabaseError("Failed to check for existing block", checkError), {
          operation: "check_duplicate_block",
          user_id: userId,
          spotify_track_id,
        });
        throw new DatabaseError("Failed to check for existing block");
      }

      if (existingBlock) {
        logError(new DuplicateTrackError("Track already blocked"), {
          operation: "block_track",
          user_id: userId,
          spotify_track_id,
        });
        throw new DuplicateTrackError("Track already blocked");
      }

      // Insert new block
      const insertData: BlockedTrackInsert = {
        user_id: userId,
        spotify_track_id,
        expires_at,
      };

      const { data: newBlock, error: insertError } = await this.supabase
        .from("blocked_tracks")
        .insert(insertData)
        .select("spotify_track_id, expires_at, created_at")
        .single();

      if (insertError) {
        // Handle unique constraint violation (duplicate block)
        if (insertError.code === "23505") {
          logError(new DuplicateTrackError("Track already blocked"), {
            operation: "block_track",
            user_id: userId,
            spotify_track_id,
            constraint_violation: true,
          });
          throw new DuplicateTrackError("Track already blocked");
        }

        logError(new DatabaseError("Failed to block track", insertError), {
          operation: "block_track",
          user_id: userId,
          spotify_track_id,
        });
        throw new DatabaseError("Failed to block track");
      }

      // Log successful operation
      console.info("Track blocked successfully", {
        operation: "block_track",
        user_id: userId,
        spotify_track_id,
        duration,
        expires_at,
        timestamp: new Date().toISOString(),
      });

      return {
        spotify_track_id: newBlock.spotify_track_id,
        expires_at: newBlock.expires_at,
        created_at: newBlock.created_at,
        duration,
      };
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof TrackInLibraryError ||
        error instanceof DuplicateTrackError ||
        error instanceof DatabaseError
      ) {
        throw error;
      }

      // Handle unexpected errors
      logError(new DatabaseError("Unexpected error in blockTrack", error as Error), {
        operation: "block_track",
        user_id: userId,
        command,
      });
      throw new DatabaseError("An unexpected error occurred");
    }
  }

  /**
   * Calculates expiry date based on block duration
   * @param duration - Block duration type
   * @returns Date for expiry or null for permanent blocks
   */
  private calculateExpiryDate(duration: BlockDuration): string | null {
    if (duration === "permanent") {
      return null;
    }

    const now = new Date();
    const durationMs = {
      "1d": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };

    const expiryDate = new Date(now.getTime() + durationMs[duration]);
    return expiryDate.toISOString();
  }
}

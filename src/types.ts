import type { Tables, TablesInsert } from "./db/database.types";

// =============================================================================
// DOMAIN ENUMS
// =============================================================================

/** Block duration options for blocked tracks */
export type BlockDuration = "1d" | "7d" | "permanent";

/** Sort options for library tracks */
export type LibrarySortOption = "created_at_desc" | "created_at_asc";

// =============================================================================
// LIBRARY MANAGEMENT DTOs
// =============================================================================

/**
 * Library track DTO for API responses
 * Omits user_id as it's implicit in authenticated context
 * Uses spotify_track_id as the natural business key, not database UUID
 */
export type LibraryTrackDTO = Pick<Tables<"user_library">, "spotify_track_id" | "created_at">;

/** Response DTO for GET /api/library */
export interface LibraryResponseDTO {
  tracks: LibraryTrackDTO[];
  total_count: number;
  has_more: boolean;
}

/** Query parameters for GET /api/library */
export interface LibraryQueryParams {
  limit?: number;
  offset?: number;
  sort?: LibrarySortOption;
}

/** Command for POST /api/library - Add track to user's library */
export interface AddTrackToLibraryCommand {
  /** Spotify track ID - exactly 22 characters, alphanumeric */
  spotify_track_id: string;
}

// =============================================================================
// BLOCKED TRACKS DTOs
// =============================================================================

/**
 * Blocked track DTO for API responses
 * Extends database row with computed is_active field, omits user_id and database id
 * Uses spotify_track_id as the natural business key
 */
export type BlockedTrackDTO = Pick<Tables<"blocked_tracks">, "spotify_track_id" | "expires_at" | "created_at"> & {
  /** Computed field indicating if the block is currently active (not expired) */
  is_active: boolean;
};

/** Response DTO for GET /api/blocked-tracks */
export interface BlockedTracksResponseDTO {
  blocked_tracks: BlockedTrackDTO[];
  total_count: number;
}

/** Query parameters for GET /api/blocked-tracks */
export interface BlockedTracksQueryParams {
  /** Only return non-expired blocks */
  active_only?: boolean;
  limit?: number;
  offset?: number;
}

/** Command for POST /api/blocked-tracks - Block track from recommendations */
export interface BlockTrackCommand {
  /** Spotify track ID - exactly 22 characters, alphanumeric */
  spotify_track_id: string;
  /** Duration for which the track should be blocked */
  duration: BlockDuration;
}

/**
 * Response DTO for POST /api/blocked-tracks
 * Includes the original duration for confirmation along with computed expires_at
 * Uses spotify_track_id as the natural business key, omits database id
 */
export type BlockTrackResponseDTO = Pick<Tables<"blocked_tracks">, "spotify_track_id" | "expires_at" | "created_at"> & {
  /** Original duration specified in the request */
  duration: BlockDuration;
};

// =============================================================================
// COMMON RESPONSE DTOs
// =============================================================================

/** Generic success message response */
export interface SuccessMessageDTO {
  message: string;
}

// =============================================================================
// ERROR DTOs
// =============================================================================

/** Standard error response structure */
export interface ErrorResponseDTO {
  error: string;
  message: string;
  status: number;
}

/** Validation error response with field-specific errors */
export interface ValidationErrorResponseDTO extends ErrorResponseDTO {
  errors: {
    field: string;
    message: string;
  }[];
}

// =============================================================================
// DATABASE ENTITY TYPES (Re-exported for convenience)
// =============================================================================

/** User library table row type */
export type UserLibraryEntity = Tables<"user_library">;

/** User library insert type */
export type UserLibraryInsert = TablesInsert<"user_library">;

/** Blocked tracks table row type */
export type BlockedTrackEntity = Tables<"blocked_tracks">;

/** Blocked tracks insert type */
export type BlockedTrackInsert = TablesInsert<"blocked_tracks">;

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Pagination metadata */
export interface PaginationMeta {
  total_count: number;
  has_more?: boolean;
  limit: number;
  offset: number;
}

/** Spotify track ID validation type */
export type SpotifyTrackId = string & { readonly __brand: "SpotifyTrackId" };

/** Helper type for creating branded Spotify track IDs */
export const createSpotifyTrackId = (id: string): SpotifyTrackId => {
  if (!/^[a-zA-Z0-9]{22}$/.test(id)) {
    throw new Error("Invalid Spotify track ID: must be exactly 22 alphanumeric characters");
  }
  return id as SpotifyTrackId;
};

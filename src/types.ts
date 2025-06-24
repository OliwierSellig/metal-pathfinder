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

// =============================================================================
// SPOTIFY BASE DTOs
// =============================================================================

/** Base Spotify entity with ID and name - common pattern */
export interface SpotifyBaseEntity {
  name: string;
}

/** Base Spotify artist structure */
export interface SpotifyArtistBase extends SpotifyBaseEntity {
  spotify_artist_id: string;
}

/** Base Spotify album structure */
export interface SpotifyAlbumBase extends SpotifyBaseEntity {
  spotify_album_id: string;
  release_date: string;
}

// =============================================================================
// SPOTIFY SEARCH DTOs
// =============================================================================

/** Query parameters for GET /api/spotify/search */
export interface SearchTrackQueryParams {
  /** Search query for tracks, artists, or albums (1-100 characters) */
  q: string;
  /** Number of results to return (1-50, default: 20) */
  limit?: number;
  /** Pagination offset (min: 0, default: 0) */
  offset?: number;
  /** Market for track availability (ISO 3166-1 alpha-2, default: "US") */
  market?: string;
}

/** Spotify artist information in search results */
export type SpotifyArtistSearchDTO = SpotifyArtistBase;

/** Spotify album information in search results */
export interface SpotifyAlbumSearchDTO extends SpotifyAlbumBase {
  // Inherits: name, spotify_album_id, release_date
  images: SpotifyImageDTO[];
}

/** Spotify image metadata */
export interface SpotifyImageDTO {
  url: string;
  height: number;
  width: number;
}

/** Base track structure with common fields */
export interface SpotifyTrackBase extends SpotifyBaseEntity {
  spotify_track_id: string;
  artists: SpotifyArtistSearchDTO[];
  album: SpotifyAlbumSearchDTO;
  duration_ms: number;
  /** Optional preview URL for 30-second clip */
  preview_url: string | null;
}

/** Individual track in search results */
export type SpotifyTrackSearchDTO = SpotifyTrackBase;

/** Response DTO for GET /api/spotify/search */
export interface SearchTrackResponseDTO {
  tracks: SpotifyTrackSearchDTO[];
  /** Total number of results available */
  total: number;
  /** Number of results returned in this response */
  limit: number;
  /** Pagination offset used */
  offset: number;
  /** Whether more results are available */
  has_more: boolean;
}

// =============================================================================
// SPOTIFY TRACK DETAILS DTOs
// =============================================================================

/** Query parameters for GET /api/spotify/track/{spotify_track_id} */
export interface TrackDetailsQueryParams {
  /** Market for track availability (ISO 3166-1 alpha-2, default: "US") */
  market?: string;
}

/** Artist information with genres in track details - extends search DTO */
export interface SpotifyArtistDetailsDTO extends SpotifyArtistSearchDTO {
  /** Artist genres from Spotify API */
  genres: string[];
}

/** Album information with total tracks in track details - extends search DTO */
export interface SpotifyAlbumDetailsDTO extends SpotifyAlbumSearchDTO {
  /** Total number of tracks in the album */
  total_tracks: number;
}

/** Response DTO for GET /api/spotify/track/{spotify_track_id} */
export interface TrackDetailsResponseDTO extends SpotifyTrackBase {
  // Inherits: spotify_track_id, name, duration_ms, preview_url from SpotifyTrackBase
  // Override with more detailed types:
  artists: SpotifyArtistDetailsDTO[];
  album: SpotifyAlbumDetailsDTO;
  /** Whether the track contains explicit content */
  explicit: boolean;
  /** Popularity score from 0-100 */
  popularity: number;
}

// =============================================================================
// AI RECOMMENDATIONS DTOs
// =============================================================================

/** Command for POST /api/spotify/recommendations - Generate AI-powered track recommendations */
export interface AIRecommendationsCommand {
  /** Spotify track ID from user's library - exactly 22 characters, alphanumeric */
  base_track_id: string;
  /** User's preference description - 30-500 characters */
  description: string;
  /** Temperature for popularity vs. niche recommendations - 0.0 (popular) to 1.0 (niche) */
  temperature: number;
  /** Number of recommendations to generate - 1-10, default: 10 */
  count?: number;
}

/** Individual AI recommendation with reasoning and metadata */
export interface AIRecommendationDTO extends SpotifyTrackBase {
  // Inherits: spotify_track_id, name, artists, album, duration_ms, preview_url
  /** AI-generated reasoning for this recommendation */
  ai_reasoning: string;
  /** AI-generated artist biography focusing on metal music contribution */
  artist_bio: string;
  /** Popularity score 0-100, influenced by temperature parameter */
  popularity_score: number;
  /** AI confidence in this recommendation (0.0-1.0) */
  recommendation_confidence: number;
}

/** Base track information for context in recommendations response */
export interface BaseTrackInfoDTO {
  spotify_track_id: string;
  name: string;
  artists: Pick<SpotifyArtistSearchDTO, "name">[];
}

/** Metadata about the AI generation process */
export interface GenerationMetadataDTO {
  /** AI model used for generation */
  ai_model: string;
  /** Temperature value used in generation */
  temperature_used: number;
  /** Processed/truncated version of user description */
  description_processed: string;
  /** Number of tracks excluded due to library/blocks */
  excluded_tracks_count: number;
  /** Total generation time in milliseconds */
  generation_time_ms: number;
}

/** Response DTO for POST /api/spotify/recommendations */
export interface AIRecommendationsResponseDTO {
  /** Array of AI-generated recommendations */
  recommendations: AIRecommendationDTO[];
  /** Base track used for generating recommendations */
  base_track: BaseTrackInfoDTO;
  /** Metadata about the generation process */
  generation_metadata: GenerationMetadataDTO;
}

// =============================================================================
// OPENAI INTEGRATION DTOs
// =============================================================================

/** Individual track recommendation from AI with song/artist info */
export interface AITrackRecommendation {
  /** Song title as recommended by AI */
  song_title: string;
  /** Artist name as recommended by AI */
  artist_name: string;
  /** AI reasoning for this recommendation */
  reasoning: string;
  /** AI confidence in this recommendation (0.0-1.0) */
  confidence: number;
}

/** Result of searching for a track by name and artist in Spotify */
export interface TrackSearchResult {
  /** Spotify track ID if found, null if not found */
  spotify_track_id: string | null;
  /** Original song title searched for */
  song_title: string;
  /** Original artist name searched for */
  artist_name: string;
  /** Whether the track was found in Spotify */
  found: boolean;
  /** Actual track name from Spotify (may differ from search query) */
  actual_song_title?: string;
  /** Actual artist name from Spotify (may differ from search query) */
  actual_artist_name?: string;
}

/** OpenAI API response structure for track recommendations */
export interface OpenAIRecommendationResponse {
  /** Array of track recommendations with song/artist info */
  recommendations: AITrackRecommendation[];
}

/** Parameters for OpenAI recommendation generation */
export interface OpenAIRecommendationParams {
  /** Base track metadata for context */
  base_track: {
    name: string;
    artists: string[];
    genres?: string[];
  };
  /** User's preference description */
  description: string;
  /** Temperature for randomness/creativity */
  temperature: number;
  /** Number of recommendations to generate */
  count: number;
  /** Track IDs to exclude from recommendations */
  excluded_track_ids: string[];
}

/** OpenAI API response for artist biography generation */
export interface OpenAIArtistBioResponse {
  /** Generated artist biography */
  biography: string;
}

/** Parameters for OpenAI artist biography generation */
export interface OpenAIArtistBioParams {
  /** Artist name */
  artist_name: string;
  /** Artist genres for context */
  genres: string[];
  /** Focus on metal music contribution */
  focus_area: "metal_music";
}

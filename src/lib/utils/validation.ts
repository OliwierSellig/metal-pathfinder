import { z } from "zod";
import type {
  AddTrackToLibraryCommand,
  SpotifyTrackId,
  LibraryQueryParams,
  AIRecommendationsCommand,
} from "../../types";

/**
 * Zod schema for validating Spotify track ID
 * Must be exactly 22 alphanumeric characters
 */
export const spotifyTrackIdSchema = z
  .string()
  .length(22, "Spotify track ID must be exactly 22 characters")
  .regex(/^[a-zA-Z0-9]{22}$/, "Spotify track ID must contain only alphanumeric characters");

/**
 * Zod schema for login request validation
 */
export const loginRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Zod schema for forgot password request validation
 */
export const forgotPasswordRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

/**
 * Zod schema for register request validation
 */
export const registerRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

/**
 * Zod schema for update password request validation
 */
export const updatePasswordRequestSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

/**
 * Zod schema for LibraryQueryParams (GET /api/library)
 * Supports pagination and sorting with sensible defaults
 */
export const libraryQueryParamsSchema = z
  .object({
    limit: z.coerce.number().min(1, "Limit must be at least 1").max(100, "Limit must not exceed 100").default(50),
    offset: z.coerce.number().min(0, "Offset must be non-negative").default(0),
    sort: z
      .enum(["created_at_desc", "created_at_asc"], {
        errorMap: () => ({ message: "Sort must be either 'created_at_desc' or 'created_at_asc'" }),
      })
      .default("created_at_desc"),
  })
  .partial() satisfies z.ZodType<Partial<LibraryQueryParams>>;

/**
 * Zod schema for AddTrackToLibraryCommand
 */
export const addTrackToLibraryCommandSchema = z.object({
  spotify_track_id: spotifyTrackIdSchema,
}) satisfies z.ZodType<AddTrackToLibraryCommand>;

/**
 * Validates and creates a branded SpotifyTrackId
 */
export function validateSpotifyTrackId(id: string): SpotifyTrackId {
  const result = spotifyTrackIdSchema.safeParse(id);

  if (!result.success) {
    throw new Error("Invalid Spotify track ID: must be exactly 22 alphanumeric characters");
  }

  return id as SpotifyTrackId;
}

/**
 * Validation error type for consistent error handling
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Converts Zod errors to our validation error format
 */
export function formatZodErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

/**
 * Zod schema for BlockedTracksQueryParams (GET /api/blocked-tracks)
 * Supports filtering by active status and pagination
 */
export const blockedTracksQueryParamsSchema = z
  .object({
    active_only: z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined) return true; // default to true
        if (val === "true") return true;
        if (val === "false") return false;
        throw new Error("active_only must be 'true' or 'false'");
      }),
    limit: z.coerce.number().min(1, "Limit must be at least 1").max(100, "Limit must not exceed 100").default(50),
    offset: z.coerce.number().min(0, "Offset must be non-negative").default(0),
  })
  .partial();

/**
 * Zod schema for BlockTrackCommand (POST /api/blocked-tracks)
 * Validates spotify_track_id and duration for blocking tracks
 */
export const blockTrackCommandSchema = z.object({
  spotify_track_id: spotifyTrackIdSchema,
  duration: z
    .enum(["1d", "7d", "permanent"], {
      errorMap: () => ({ message: "Duration must be one of: 1d, 7d, permanent" }),
    })
    .default("permanent"),
});

/**
 * Zod schema for market code validation (ISO 3166-1 alpha-2)
 * Common market codes for Spotify
 */
const marketCodeSchema = z
  .string()
  .length(2, "Market code must be exactly 2 characters")
  .regex(/^[A-Z]{2}$/, "Market code must be uppercase letters")
  .default("US");

/**
 * Zod schema for SearchTrackQueryParams (GET /api/spotify/search)
 * Validates search query parameters with appropriate limits and defaults
 */
export const searchTrackQueryParamsSchema = z.object({
  q: z
    .string()
    .min(1, "Search query must be at least 1 character")
    .max(100, "Search query must not exceed 100 characters")
    .transform((val) => val.trim()),
  limit: z.coerce.number().min(1, "Limit must be at least 1").max(50, "Limit must not exceed 50").default(20),
  offset: z.coerce.number().min(0, "Offset must be non-negative").default(0),
  market: marketCodeSchema,
});

/**
 * Zod schema for Track Details path parameter validation
 * Validates Spotify track ID in URL path
 */
export const trackDetailsPathParamsSchema = z.object({
  spotify_track_id: spotifyTrackIdSchema,
});

/**
 * Zod schema for Track Details query parameters
 * Validates optional market parameter
 */
export const trackDetailsQueryParamsSchema = z.object({
  market: marketCodeSchema.optional(),
});

/**
 * Zod schema for AI Recommendations Command (POST /api/spotify/recommendations)
 * Validates all parameters for AI-powered track recommendations
 */
export const aiRecommendationsCommandSchema = z.object({
  base_track_id: spotifyTrackIdSchema,
  description: z
    .string()
    .min(30, "Description must be at least 30 characters")
    .max(500, "Description must not exceed 500 characters")
    .transform((val) => val.trim()),
  temperature: z
    .number()
    .min(0.0, "Temperature must be between 0.0 and 1.0")
    .max(1.0, "Temperature must be between 0.0 and 1.0"),
  count: z
    .number()
    .int("Count must be an integer")
    .min(1, "Count must be at least 1")
    .max(10, "Count must not exceed 10")
    .default(10)
    .optional(),
}) satisfies z.ZodType<AIRecommendationsCommand>;

import { z } from "zod";
import type { AddTrackToLibraryCommand, SpotifyTrackId, LibraryQueryParams } from "../../types";

/**
 * Zod schema for validating Spotify track ID
 * Must be exactly 22 alphanumeric characters
 */
export const spotifyTrackIdSchema = z
  .string()
  .length(22, "Spotify track ID must be exactly 22 characters")
  .regex(/^[a-zA-Z0-9]{22}$/, "Spotify track ID must contain only alphanumeric characters");

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

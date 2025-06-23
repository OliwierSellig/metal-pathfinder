import { z } from "zod";
import type { AddTrackToLibraryCommand, SpotifyTrackId } from "../../types";

/**
 * Zod schema for validating Spotify track ID
 * Must be exactly 22 alphanumeric characters
 */
export const spotifyTrackIdSchema = z
  .string()
  .length(22, "Spotify track ID must be exactly 22 characters")
  .regex(/^[a-zA-Z0-9]{22}$/, "Spotify track ID must contain only alphanumeric characters");

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

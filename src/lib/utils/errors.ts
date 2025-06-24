import type { ErrorResponseDTO, ValidationErrorResponseDTO } from "../../types";
import type { ValidationError as ValidationErrorType } from "./validation";

/**
 * Custom error classes for different error scenarios
 */

/**
 * Base class for business rule violations (400 Bad Request)
 */
export abstract class BusinessRuleError extends Error {
  public readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Base class for resource not found errors (404 Not Found)
 */
export abstract class NotFoundError extends Error {
  public readonly statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Base class for validation errors (422 Unprocessable Entity)
 */
export class ValidationError extends Error {
  public readonly statusCode = 422;
  constructor(
    message: string,
    public errors: ValidationErrorType[]
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when AI generation fails
 */
export class AIGenerationError extends Error {
  public readonly statusCode = 422;
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "AIGenerationError";
  }
}

/**
 * Error thrown when OpenAI API is unavailable
 */
export class OpenAIAPIError extends Error {
  public readonly statusCode: number;
  constructor(
    message: string,
    statusCode = 503,
    public originalError?: Error
  ) {
    super(message);
    this.name = "OpenAIAPIError";
    this.statusCode = statusCode;
  }
}

/**
 * Error thrown when trying to add duplicate track to library
 */
export class DuplicateTrackError extends BusinessRuleError {
  constructor(message = "Track already exists in your library") {
    super(message);
  }
}

/**
 * Error thrown when trying to remove the last track from library
 * Business rule: User must have at least one track in library
 */
export class LastTrackError extends BusinessRuleError {
  constructor(
    message = "Cannot remove last track from library",
    public currentTrackCount = 1
  ) {
    super(message);
  }
}

/**
 * Error thrown when trying to block a track that's already in user's library
 * Business rule: User cannot block tracks that are in their library
 */
export class TrackInLibraryError extends BusinessRuleError {
  constructor(
    message = "Cannot block track that exists in your library",
    public spotifyTrackId?: string
  ) {
    super(message);
  }
}

/**
 * Error thrown when trying to add a blocked track to user's library
 * Business rule: User cannot add blocked tracks to their library
 */
export class TrackBlockedError extends BusinessRuleError {
  constructor(
    message = "Cannot add blocked track to your library",
    public spotifyTrackId?: string
  ) {
    super(message);
  }
}

/**
 * Error thrown when requested track is not found in user's library
 */
export class TrackNotFoundError extends NotFoundError {
  constructor(
    message = "Track not found in user's library",
    public requestedTrackId?: string
  ) {
    super(message);
  }
}

/**
 * Error thrown for database/infrastructure problems (500 Internal Server Error)
 */
export class DatabaseError extends Error {
  public readonly statusCode = 500;
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

/**
 * Error thrown for Spotify API integration issues
 * Used for external service failures and API communication problems
 */
export class SpotifyAPIError extends Error {
  public readonly statusCode: number;

  constructor(
    message: string,
    statusCode = 503,
    public originalError?: Error
  ) {
    super(message);
    this.name = "SpotifyAPIError";
    this.statusCode = statusCode;
  }
}

/**
 * Creates a standardized error response DTO
 */
export function createErrorResponse(error: string, message: string, status: number): ErrorResponseDTO {
  return {
    error,
    message,
    status,
  };
}

/**
 * Creates a validation error response DTO
 */
export function createValidationErrorResponse(
  message: string,
  errors: ValidationErrorType[]
): ValidationErrorResponseDTO {
  return {
    error: "Unprocessable Entity",
    message,
    status: 422,
    errors,
  };
}

/**
 * Logs error with appropriate level based on error type
 */
export function logError(error: Error, context?: Record<string, unknown>) {
  const logData = {
    error: error.name,
    message: error.message,
    context,
    timestamp: new Date().toISOString(),
  };

  if (
    error instanceof ValidationError ||
    error instanceof DuplicateTrackError ||
    error instanceof LastTrackError ||
    error instanceof TrackNotFoundError ||
    error instanceof TrackInLibraryError ||
    error instanceof TrackBlockedError
  ) {
    console.info("API Error:", logData);
  } else if (error instanceof DatabaseError) {
    console.error("Database Error:", logData, error.originalError);
  } else {
    console.error("Unexpected Error:", logData);
  }
}

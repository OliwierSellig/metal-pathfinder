import type { ErrorResponseDTO, ValidationErrorResponseDTO } from "../../types";
import type { ValidationError as ValidationErrorType } from "./validation";

/**
 * Custom error classes for different error scenarios
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: ValidationErrorType[]
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class DuplicateTrackError extends Error {
  constructor(message: string = "Track already exists in your library") {
    super(message);
    this.name = "DuplicateTrackError";
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "DatabaseError";
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
export function logError(error: Error, context?: Record<string, any>) {
  const logData = {
    error: error.name,
    message: error.message,
    context,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof ValidationError || error instanceof DuplicateTrackError) {
    console.info("API Error:", logData);
  } else if (error instanceof DatabaseError) {
    console.error("Database Error:", logData, error.originalError);
  } else {
    console.error("Unexpected Error:", logData);
  }
}

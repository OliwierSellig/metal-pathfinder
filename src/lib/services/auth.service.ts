import type { SupabaseClient } from "@supabase/supabase-js";
import type { LogoutResponseDTO } from "../../types";
import type { Database } from "../../db/database.types";
import { AuthenticationError, DatabaseError, logError } from "../utils/errors";

/**
 * Service class for authentication operations
 */
export class AuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Logs out the current user by ending their session
   * @returns LogoutResponseDTO with success status
   * @throws AuthenticationError for authentication-related errors
   * @throws DatabaseError for unexpected Supabase errors
   */
  async logoutUser(): Promise<LogoutResponseDTO> {
    try {
      // Sign out user through Supabase Auth
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        logError(new AuthenticationError("Failed to sign out user"), {
          operation: "supabase_signout",
          error_code: error.status,
          error_message: error.message,
        });
        throw new AuthenticationError("Failed to sign out user");
      }

      // Log successful operation
      console.info("User logged out successfully", {
        operation: "logout",
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: "Successfully logged out",
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof AuthenticationError) {
        throw error;
      }

      // Handle unexpected errors
      logError(new DatabaseError("Unexpected error during logout", error as Error), {
        operation: "logout_user",
      });
      throw new DatabaseError("An unexpected error occurred during logout");
    }
  }
}

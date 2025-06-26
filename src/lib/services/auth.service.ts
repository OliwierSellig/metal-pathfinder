import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LogoutResponseDTO,
  LoginServiceResponse,
  RegisterServiceResponse,
  ForgotPasswordServiceResponse,
  UpdatePasswordServiceResponse,
} from "../../types";
import type { Database } from "../../db/database.types";
import { AuthenticationError, DatabaseError, logError } from "../utils/errors";

/**
 * Service class for authentication operations
 */
export class AuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Logs in a user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns LoginServiceResponse with user data
   * @throws AuthenticationError for invalid credentials
   * @throws DatabaseError for unexpected Supabase errors
   */
  async loginUser(email: string, password: string): Promise<LoginServiceResponse> {
    try {
      // Attempt to sign in user
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logError(new AuthenticationError(error.message), {
          operation: "supabase_signin",
          email,
          error_code: error.status,
        });
        throw new AuthenticationError("Invalid email or password");
      }

      if (!data.user || !data.user.email) {
        throw new AuthenticationError("Invalid email or password");
      }

      // Log successful operation
      console.info("User logged in successfully", {
        operation: "login",
        user_id: data.user.id,
        email: data.user.email,
        timestamp: new Date().toISOString(),
      });

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof AuthenticationError) {
        throw error;
      }

      // Handle unexpected errors
      logError(new DatabaseError("Unexpected error during login", error as Error), {
        operation: "login_user",
      });
      throw new DatabaseError("An unexpected error occurred during login");
    }
  }

  /**
   * Registers a new user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns RegisterServiceResponse with user data
   * @throws AuthenticationError for registration errors (email already exists, weak password, etc.)
   * @throws DatabaseError for unexpected Supabase errors
   */
  async registerUser(email: string, password: string): Promise<RegisterServiceResponse> {
    try {
      // Attempt to sign up user
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // Log and map specific Supabase auth errors
        logError(new AuthenticationError(error.message), {
          operation: "supabase_signup",
          email,
          error_code: error.status,
        });

        // Map common Supabase errors to user-friendly messages
        if (error.message.includes("User already registered")) {
          throw new AuthenticationError("An account with this email already exists");
        }
        if (error.message.includes("Password should be")) {
          throw new AuthenticationError("Password does not meet requirements");
        }
        if (error.message.includes("Invalid email")) {
          throw new AuthenticationError("Please enter a valid email address");
        }

        // Generic fallback for other auth errors
        throw new AuthenticationError("Failed to create account");
      }

      if (!data.user || !data.user.email) {
        throw new AuthenticationError("Failed to create account");
      }

      // With email confirmation disabled, user should be immediately available
      if (!data.session) {
        logError(new AuthenticationError("User created but no session established"), {
          operation: "supabase_signup",
          email,
          user_id: data.user.id,
        });
        throw new AuthenticationError("Account created but login failed. Please try logging in.");
      }

      // Log successful operation
      console.info("User registered successfully", {
        operation: "register",
        user_id: data.user.id,
        email: data.user.email,
        timestamp: new Date().toISOString(),
      });

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof AuthenticationError) {
        throw error;
      }

      // Handle unexpected errors
      logError(new DatabaseError("Unexpected error during registration", error as Error), {
        operation: "register_user",
      });
      throw new DatabaseError("An unexpected error occurred during registration");
    }
  }

  /**
   * Sends password reset email to user
   * @param email - User's email address
   * @param redirectUrl - URL to redirect after clicking reset link
   * @returns ForgotPasswordServiceResponse with success status
   * @throws AuthenticationError for Supabase auth errors
   * @throws DatabaseError for unexpected errors
   */
  async forgotPassword(email: string, redirectUrl: string): Promise<ForgotPasswordServiceResponse> {
    try {
      // Send password reset email
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        logError(new AuthenticationError(error.message), {
          operation: "supabase_reset_password",
          email,
          error_code: error.status,
        });
        throw new AuthenticationError("Failed to send reset email");
      }

      // Log successful operation (but don't log email for privacy)
      console.info("Password reset email requested", {
        operation: "forgot_password",
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: "If an account with that email exists, we've sent password reset instructions.",
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof AuthenticationError) {
        throw error;
      }

      // Handle unexpected errors
      logError(new DatabaseError("Unexpected error during password reset", error as Error), {
        operation: "forgot_password",
      });
      throw new DatabaseError("An unexpected error occurred during password reset");
    }
  }

  /**
   * Updates user password - for PKCE flow (SSR)
   * User should already be authenticated after clicking reset link
   * @param newPassword - New password to set
   * @returns UpdatePasswordServiceResponse with success status
   * @throws AuthenticationError for authentication errors
   * @throws DatabaseError for unexpected errors
   */
  async updatePassword(newPassword: string): Promise<UpdatePasswordServiceResponse> {
    try {
      // Check if user is authenticated
      const {
        data: { user },
        error: getUserError,
      } = await this.supabase.auth.getUser();

      if (getUserError || !user) {
        logError(new AuthenticationError("User not authenticated for password update"), {
          operation: "supabase_get_user",
          error: getUserError?.message,
        });
        throw new AuthenticationError("Invalid or expired reset link. Please request a new one.");
      }

      // Update the user's password
      const { error: updateError } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        logError(new AuthenticationError(updateError.message), {
          operation: "supabase_update_password",
          user_id: user.id,
          error_code: updateError.status,
        });
        throw new AuthenticationError("Failed to update password");
      }

      // Log successful operation
      console.info("Password updated successfully", {
        operation: "update_password",
        user_id: user.id,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: "Password updated successfully",
      };
    } catch (error) {
      // Re-throw known errors
      if (error instanceof AuthenticationError) {
        throw error;
      }

      // Handle unexpected errors
      logError(new DatabaseError("Unexpected error during password update", error as Error), {
        operation: "update_password",
      });
      throw new DatabaseError("An unexpected error occurred during password update");
    }
  }

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

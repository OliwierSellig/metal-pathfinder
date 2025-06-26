import { useState, useEffect, useCallback } from "react";
import type { User, AuthStatusResponseDTO, LogoutResponseDTO, UseAuthAPIReturn } from "../types";
import { toast } from "sonner";

/**
 * Hook useAuthAPI - zarządza stanem autentykacji przez API calls
 * Nie używa bezpośrednio Supabase client po stronie przeglądarki
 */
export function useAuthAPI(): UseAuthAPIReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.info("useAuthAPI: Hook initialized, loading:", loading);

  // =============================================================================
  // AUTH STATUS CHECK
  // =============================================================================

  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      console.info("useAuthAPI: Checking auth status...");

      const response = await fetch("/api/auth/status", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Auth status check failed: ${response.status}`);
      }

      const authData: AuthStatusResponseDTO = await response.json();
      console.info("useAuthAPI: Auth status result:", {
        authenticated: authData.authenticated,
        hasUser: !!authData.user,
      });

      setUser(authData.user);
      setError(null);
      setLoading(false);
      console.info("useAuthAPI: Loading set to false");
    } catch (err) {
      console.error("Auth status check error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";

      setError(errorMessage);
      setUser(null);
      setLoading(false);

      // Show user-friendly error messages
      if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        toast.error("No internet connection. Please check your connection.");
      } else {
        console.error("Auth status check failed:", errorMessage);
      }
    }
  }, []);

  // =============================================================================
  // INITIAL AUTH CHECK
  // =============================================================================

  useEffect(() => {
    console.info("useAuthAPI: Effect started, checking initial auth status");
    checkAuthStatus();
  }, [checkAuthStatus]);

  // =============================================================================
  // LOGOUT FUNCTION
  // =============================================================================

  const logout = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      console.info("useAuthAPI: Starting logout...");

      // Call our API endpoint for logout (handles server-side cleanup)
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Logout failed: ${response.status}`);
      }

      const logoutData: LogoutResponseDTO = await response.json();

      if (!logoutData.success) {
        throw new Error(logoutData.message || "Logout failed");
      }

      console.info("useAuthAPI: Logout successful");

      // Clear local state
      setUser(null);
      setError(null);

      // Success message
      toast.success("Successfully logged out");

      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";

      console.error("Logout error:", err);
      setError(errorMessage);

      // Show user-friendly error messages
      if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        toast.error("No internet connection. Please check your connection.");
      } else if (errorMessage.includes("500")) {
        toast.error("Server error. Please try again later.");
      } else if (errorMessage.includes("timeout")) {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error(errorMessage || "An unexpected error occurred during logout");
      }

      throw err; // Re-throw for component handling
    }
  }, []);

  // =============================================================================
  // REFRESH AUTH (for manual refresh if needed)
  // =============================================================================

  const refreshAuth = useCallback(async (): Promise<void> => {
    setLoading(true);
    await checkAuthStatus();
  }, [checkAuthStatus]);

  console.info("useAuthAPI: Returning state - loading:", loading, "user:", !!user);

  return {
    user,
    loading,
    logout,
    error,
    refreshAuth,
  };
}

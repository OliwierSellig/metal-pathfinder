import React from "react";

interface LogoutButtonProps {
  onLogout: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Logout button component with loading state and error handling
 * Handles click logout with loading state during API call
 */
export const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout, isLoading = false }) => {
  const handleLogout = async () => {
    try {
      await onLogout();
    } catch (error) {
      // Error handling is done in the parent component (useAuthAPI hook)
      console.error("Logout error:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className={`
        inline-flex items-center px-3 py-2 text-sm font-medium rounded-md
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900
        ${isLoading ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"}
      `}
      aria-label={isLoading ? "Logging out..." : "Logout"}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
};

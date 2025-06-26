import { useState, useEffect, useCallback } from "react";
import type { UseNavigationMobileReturn } from "../types";

/**
 * Hook useNavigationMobile - zarządza stanem mobilnego menu nawigacji
 * Obsługuje otwieranie/zamykanie menu, ESC key handling i body scroll lock
 */
export function useNavigationMobile(): UseNavigationMobileReturn {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // =============================================================================
  // MENU STATE FUNCTIONS
  // =============================================================================

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // =============================================================================
  // ESC KEY HANDLING
  // =============================================================================

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMenuOpen) {
        closeMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isMenuOpen, closeMenu]);

  // =============================================================================
  // BODY SCROLL LOCK
  // =============================================================================

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isMenuOpen) {
      // Prevent body scroll when menu is open
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      return () => {
        // Restore original overflow when menu closes or component unmounts
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isMenuOpen]);

  // =============================================================================
  // CLEANUP ON UNMOUNT
  // =============================================================================

  useEffect(() => {
    // Cleanup function to ensure body scroll is restored on unmount
    return () => {
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, []);

  return {
    isMenuOpen,
    toggleMenu,
    closeMenu,
  };
}

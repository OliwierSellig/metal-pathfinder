import React from "react";

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  ariaLabel?: string;
}

/**
 * Hamburger menu button with animated icon (3 lines → X)
 * Includes keyboard activation and accessibility features
 */
export const HamburgerButton: React.FC<HamburgerButtonProps> = ({
  isOpen,
  onClick,
  ariaLabel = "Toggle navigation menu",
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 transition-colors duration-200"
      aria-expanded={isOpen}
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>

      {/* Animated hamburger icon */}
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden="true"
      >
        {/* Top line */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={isOpen ? "M6 6l12 12" : "M3.75 6.75h16.5"}
          className="transition-all duration-200 ease-in-out"
        />

        {/* Middle line - disappears when open */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 12h16.5"
          className={`transition-all duration-200 ease-in-out ${isOpen ? "opacity-0" : "opacity-100"}`}
        />

        {/* Bottom line */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={isOpen ? "M6 18l12-12" : "M3.75 17.25h16.5"}
          className="transition-all duration-200 ease-in-out"
        />
      </svg>
    </button>
  );
};

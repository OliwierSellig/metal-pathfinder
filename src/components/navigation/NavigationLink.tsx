import React from "react";
import type { NavigationItem } from "../../types";

interface NavigationLinkProps {
  item: NavigationItem;
  isActive: boolean;
  onClick?: () => void;
  isMobile?: boolean;
}

/**
 * Reusable navigation link component with active state
 * Handles click navigation, hover states, and focus management
 */
export const NavigationLink = React.forwardRef<HTMLAnchorElement, NavigationLinkProps>(
  ({ item, isActive, onClick, isMobile = false }, ref) => {
    const handleClick = () => {
      if (onClick) {
        onClick();
      }
    };

    const baseClasses =
      "rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500";
    const desktopClasses = "px-3 py-2 text-sm focus:ring-offset-2 focus:ring-offset-gray-900";
    const mobileClasses = "px-4 py-3 text-base w-full block focus:ring-offset-1";

    const activeClasses = isActive ? "bg-red-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white";

    return (
      <a
        ref={ref}
        href={item.href}
        onClick={handleClick}
        className={`
          ${baseClasses}
          ${isMobile ? mobileClasses : desktopClasses}
          ${activeClasses}
        `}
        aria-current={isActive ? "page" : undefined}
        aria-label={item.ariaLabel || `Navigate to ${item.label}`}
      >
        {item.label}
      </a>
    );
  }
);

NavigationLink.displayName = "NavigationLink";

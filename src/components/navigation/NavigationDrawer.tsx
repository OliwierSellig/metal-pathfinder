import React, { useEffect, useRef } from "react";
import type { NavigationItem, User } from "../../types";
import { NavigationLink } from "./NavigationLink";
import { UserMenu } from "./UserMenu";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  user: User;
  currentPath: string;
  onLogout: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Overlay drawer for mobile containing navigation and user menu
 * Includes backdrop click, focus trapping and slide animations
 */
export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  navigationItems,
  user,
  currentPath,
  onLogout,
  isLoading = false,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);

  // =============================================================================
  // FOCUS TRAPPING
  // =============================================================================

  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      // Focus first link when drawer opens
      firstFocusableRef.current.focus();
    }
  }, [isOpen]);

  // =============================================================================
  // BACKDROP CLICK HANDLING
  // =============================================================================

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // =============================================================================
  // LINK CLICK HANDLING
  // =============================================================================

  const handleLinkClick = () => {
    // Close drawer when navigation link is clicked
    onClose();
  };

  return (
    <div className="md:hidden">
      {/* Backdrop overlay with blur */}
      <div
        className={`
          fixed inset-0 z-40 backdrop-blur-sm bg-black/30
          transition-all duration-300 ease-in-out
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer container */}
      <div
        ref={drawerRef}
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 shadow-xl
          transform transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer content */}
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Menu</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
              aria-label="Close navigation menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-4 py-6">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item, index) => (
                <NavigationLink
                  key={item.id}
                  item={item}
                  isActive={currentPath === item.href}
                  onClick={handleLinkClick}
                  isMobile={true}
                  ref={index === 0 ? firstFocusableRef : undefined}
                />
              ))}
            </div>
          </nav>

          {/* User menu at bottom */}
          <div className="border-t border-gray-700 p-4">
            <UserMenu user={user} onLogout={onLogout} isLoading={isLoading} isMobile={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

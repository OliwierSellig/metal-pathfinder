import React from "react";
import type { NavigationProps } from "../../types";
import { NAVIGATION_ITEMS } from "../../lib/navigation";
import { Logo } from "./Logo";
import { NavigationDesktop } from "./NavigationDesktop";
import { NavigationMobile } from "./NavigationMobile";

/**
 * Main Navigation component responsible for rendering appropriate version (desktop/mobile)
 * Based on breakpoints and managing overall navigation state
 */
export const Navigation: React.FC<NavigationProps> = ({ user, currentPath, onLogout, isLoading = false }) => {
  // Early return if no user (should not happen on protected pages)
  if (!user) {
    return null;
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-700" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <NavigationDesktop
            navigationItems={NAVIGATION_ITEMS}
            user={user}
            currentPath={currentPath}
            onLogout={onLogout}
            isLoading={isLoading}
          />

          {/* Mobile Navigation - positioned at the right */}
          <div className="md:hidden">
            <NavigationMobile
              navigationItems={NAVIGATION_ITEMS}
              user={user}
              currentPath={currentPath}
              onLogout={onLogout}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

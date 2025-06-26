import React from "react";
import type { NavigationItem, User } from "../../types";
import { HamburgerButton } from "./HamburgerButton";
import { NavigationDrawer } from "./NavigationDrawer";
import { useNavigationMobile } from "../../hooks/useNavigationMobile";

interface NavigationMobileProps {
  navigationItems: NavigationItem[];
  user: User;
  currentPath: string;
  onLogout: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Mobile navigation component (320-767px) with hamburger menu and drawer
 * Combines HamburgerButton and NavigationDrawer with mobile-specific interactions
 */
export const NavigationMobile: React.FC<NavigationMobileProps> = ({
  navigationItems,
  user,
  currentPath,
  onLogout,
  isLoading = false,
}) => {
  const { isMenuOpen, toggleMenu, closeMenu } = useNavigationMobile();

  return (
    <>
      {/* Hamburger button */}
      <HamburgerButton isOpen={isMenuOpen} onClick={toggleMenu} />

      {/* Mobile drawer */}
      <NavigationDrawer
        isOpen={isMenuOpen}
        onClose={closeMenu}
        navigationItems={navigationItems}
        user={user}
        currentPath={currentPath}
        onLogout={onLogout}
        isLoading={isLoading}
      />
    </>
  );
};

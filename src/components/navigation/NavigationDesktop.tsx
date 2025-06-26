import React from "react";
import type { NavigationItem, User } from "../../types";
import { NavigationLink } from "./NavigationLink";
import { UserMenu } from "./UserMenu";

interface NavigationDesktopProps {
  navigationItems: NavigationItem[];
  user: User;
  currentPath: string;
  onLogout: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Desktop navigation component (768px+) with horizontal layout
 * Displays navigation links and user menu in a flex container
 */
export const NavigationDesktop: React.FC<NavigationDesktopProps> = ({
  navigationItems,
  user,
  currentPath,
  onLogout,
  isLoading = false,
}) => {
  return (
    <div className="hidden md:flex md:items-center md:justify-between md:flex-1">
      {/* Centered Navigation Links */}
      <div className="flex items-center space-x-4">
        {navigationItems.map((item) => (
          <NavigationLink key={item.id} item={item} isActive={currentPath === item.href} />
        ))}
      </div>

      {/* User Menu */}
      <UserMenu user={user} onLogout={onLogout} isLoading={isLoading} />
    </div>
  );
};

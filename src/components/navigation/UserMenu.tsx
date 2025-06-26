import React from "react";
import type { User } from "../../types";
import { LogoutButton } from "./LogoutButton";

interface UserMenuProps {
  user: User;
  onLogout: () => Promise<void>;
  isLoading?: boolean;
  isMobile?: boolean;
}

/**
 * User menu component for desktop navigation
 * Displays user email and logout button
 */
export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, isLoading = false, isMobile = false }) => {
  return (
    <div className={isMobile ? "flex flex-col space-y-3" : "flex items-center space-x-4"}>
      {/* User email display */}
      <div className="text-sm text-gray-300">
        <span className="hidden sm:inline">Welcome, </span>
        <span className="font-medium text-white">{user.email}</span>
      </div>

      {/* Logout button */}
      <LogoutButton onLogout={onLogout} isLoading={isLoading} />
    </div>
  );
};

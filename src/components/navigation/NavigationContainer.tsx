import React from "react";
import type { User } from "../../types";
import { useAuthAPI } from "../../hooks/useAuthAPI";
import { Navigation } from "./Navigation";

interface NavigationContainerProps {
  user: User;
  currentPath: string;
}

/**
 * Container component that handles auth state via API and passes it to Navigation
 * Uses server-side auth checking instead of client-side Supabase
 */
export const NavigationContainer: React.FC<NavigationContainerProps> = ({ user, currentPath }) => {
  const { logout, loading } = useAuthAPI();

  console.info("NavigationContainer: loading state:", loading);

  return <Navigation user={user} currentPath={currentPath} onLogout={logout} isLoading={loading} />;
};

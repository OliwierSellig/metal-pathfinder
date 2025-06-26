import type { NavigationItem } from "../types";

/**
 * Navigation items configuration for MetalPathfinder application
 * Centralized definition of main navigation links
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: "discover",
    label: "Discover",
    href: "/discover",
    ariaLabel: "Navigate to Discover - Find new music recommendations",
  },
  {
    id: "library",
    label: "Library",
    href: "/library",
    ariaLabel: "Navigate to Library - View your saved tracks",
  },
  {
    id: "blocked-tracks",
    label: "Blocked Tracks",
    href: "/blocked-tracks",
    ariaLabel: "Navigate to Blocked Tracks - Manage blocked songs",
  },
];

/**
 * Check if a given path matches any navigation item
 * Useful for determining active navigation state
 */
export function isNavigationPath(pathname: string): boolean {
  return NAVIGATION_ITEMS.some((item) => item.href === pathname);
}

/**
 * Get navigation item by href
 * Useful for finding specific navigation metadata
 */
export function getNavigationItem(href: string): NavigationItem | undefined {
  return NAVIGATION_ITEMS.find((item) => item.href === href);
}

/**
 * List of protected paths that require navigation
 * These paths should use ProtectedLayout with navigation
 */
export const PROTECTED_PATHS = NAVIGATION_ITEMS.map((item) => item.href);

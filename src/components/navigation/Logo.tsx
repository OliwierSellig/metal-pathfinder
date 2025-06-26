import React from "react";

/**
 * Logo component for MetalPathfinder application
 * Displays the brand/logo with a link to the main page
 */
export const Logo: React.FC = () => {
  return (
    <a
      href="/discover"
      className="flex items-center text-xl font-bold text-white hover:text-gray-300 transition-colors duration-200"
      aria-label="MetalPathfinder - Go to discover page"
    >
      {/* For now using text logo - can be replaced with image later */}
      <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">MetalPathfinder</span>
    </a>
  );
};

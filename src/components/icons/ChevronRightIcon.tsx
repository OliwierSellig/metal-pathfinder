import React from "react";

interface IconProps {
  className?: string;
}

// eslint-disable-next-line react/prop-types
export const ChevronRightIcon = React.memo<IconProps>(({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
));

ChevronRightIcon.displayName = "ChevronRightIcon";

/* eslint-disable react/prop-types */
import React from "react";
import { Button } from "./button";
import type { RecommendationCardViewModel } from "../discover/RecommendationCard";

interface TrackActionButtonProps {
  variant: "add" | "block";
  uiState: RecommendationCardViewModel["uiState"];
  disabled: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const TrackActionButton = React.memo<TrackActionButtonProps>(
  ({ variant, uiState, disabled, children, onClick, className = "" }) => {
    const getButtonStyles = (variant: string, uiState: string) => {
      if (variant === "add") {
        switch (uiState) {
          case "added":
            return "bg-green-600 hover:bg-green-600";
          case "blocked":
          case "blocking":
            return "bg-gray-400 cursor-not-allowed";
          default:
            return "bg-purple-600 hover:bg-purple-700";
        }
      } else {
        switch (uiState) {
          case "blocked":
            return "border-red-400 text-red-600 bg-red-50";
          case "added":
          case "adding":
            return "border-gray-300 text-gray-500 bg-gray-50 cursor-not-allowed";
          default:
            return "border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400";
        }
      }
    };

    return (
      <Button
        onClick={onClick}
        disabled={disabled}
        variant={variant === "block" ? "outline" : "default"}
        className={`w-full sm:w-auto ${getButtonStyles(variant, uiState)} ${className}`}
      >
        {children}
      </Button>
    );
  }
);

TrackActionButton.displayName = "TrackActionButton";

export default TrackActionButton;

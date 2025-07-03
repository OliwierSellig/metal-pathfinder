/* eslint-disable react/prop-types */
import React from "react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { formatDuration } from "../../lib/utils/track.utils";
import { useTrackActions } from "../../hooks/useTrackActions";
import type { AIRecommendationDTO, BlockDuration } from "../../types";

// Rozszerzenie DTO rekomendacji o stan UI
export interface RecommendationCardViewModel extends AIRecommendationDTO {
  uiState: "idle" | "adding" | "blocking" | "added" | "blocked";
}

interface RecommendationCardProps {
  track: RecommendationCardViewModel;
  onAddToLibrary: (trackId: string) => void;
  onBlockTrack: (trackId: string, duration: BlockDuration) => void;
  onViewDetails: (track: RecommendationCardViewModel) => void;
  index?: number; // Add index for test identification
}

const RecommendationCard = React.memo<RecommendationCardProps>(
  ({ track, onAddToLibrary, onBlockTrack, onViewDetails, index }) => {
    const { addButton, blockButton } = useTrackActions(track, "card");

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex gap-4">
          {/* Album Art */}
          <div className="flex-shrink-0">
            {track.album.images.length > 0 ? (
              <img
                src={track.album.images[0].url}
                alt={`${track.name} album art`}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-400">No Art</span>
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-grow min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">{track.name}</h3>
            <p className="text-sm text-gray-600 truncate mb-1">
              by {track.artists.map((artist) => artist.name).join(", ")}
            </p>
            <p className="text-xs text-gray-500 truncate mb-2">from {track.album.name}</p>

            {/* Track Metadata */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
              <span>Duration: {formatDuration(track.duration_ms)}</span>
              <span>Popularity: {track.popularity_score}/100</span>
              <span>AI: {(track.recommendation_confidence * 100).toFixed(0)}%</span>
            </div>

            {/* AI Reasoning Preview */}
            <p className="text-xs text-gray-600 line-clamp-2 mb-3">{track.ai_reasoning}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex flex-col gap-2 min-w-[80px]">
            {/* Add to Library Button */}
            <Button
              size="sm"
              onClick={() => onAddToLibrary(track.spotify_track_id)}
              disabled={addButton.disabled}
              className={`w-full text-xs ${
                track.uiState === "added"
                  ? "bg-green-600 hover:bg-green-600"
                  : track.uiState === "blocked" || track.uiState === "blocking"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
              }`}
              data-testid={index !== undefined ? `add-button-${index}` : undefined}
            >
              {addButton.text}
            </Button>

            {/* Block Track Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={blockButton.disabled}
                  className={`w-full text-xs ${
                    track.uiState === "blocked"
                      ? "border-red-400 text-red-600 bg-red-50"
                      : track.uiState === "added" || track.uiState === "adding"
                        ? "border-gray-300 text-gray-500 bg-gray-50 cursor-not-allowed"
                        : "border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                  }`}
                  data-testid={index !== undefined ? `block-button-${index}` : undefined}
                >
                  {blockButton.text}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onBlockTrack(track.spotify_track_id, "1d")}>
                  Block for 1 day
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBlockTrack(track.spotify_track_id, "7d")}>
                  Block for 7 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBlockTrack(track.spotify_track_id, "permanent")}>
                  Block permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Details Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(track)}
              className="w-full text-xs"
              data-testid={index !== undefined ? `details-button-${index}` : undefined}
            >
              Details
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

RecommendationCard.displayName = "RecommendationCard";

export default RecommendationCard;

import React from "react";
import { Button } from "../ui/button";
import { useAudioPlayer } from "../contexts/AudioPlayerContext.tsx";
import type { AIRecommendationDTO } from "../../types";

// Rozszerzenie DTO rekomendacji o stan UI
export interface RecommendationCardViewModel extends AIRecommendationDTO {
  uiState: "idle" | "adding" | "blocking" | "added" | "blocked";
}

interface RecommendationCardProps {
  track: RecommendationCardViewModel;
  onAddToLibrary: (trackId: string) => void;
  onBlockTrack: (trackId: string) => void;
  onViewDetails: (track: AIRecommendationDTO) => void;
  onPlayPreview?: (previewUrl: string) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  track,
  onAddToLibrary,
  onBlockTrack,
  onViewDetails,
  onPlayPreview,
}) => {
  const audioPlayer = useAudioPlayer();
  const formatDuration = (durationMs: number): string => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getActionButtonState = (action: "add" | "block") => {
    if (action === "add") {
      switch (track.uiState) {
        case "adding":
          return { disabled: true, text: "Adding..." };
        case "added":
          return { disabled: true, text: "Added" };
        default:
          return { disabled: false, text: "Add" };
      }
    } else {
      switch (track.uiState) {
        case "blocking":
          return { disabled: true, text: "Blocking..." };
        case "blocked":
          return { disabled: true, text: "Blocked" };
        default:
          return { disabled: false, text: "Block" };
      }
    }
  };

  const addButtonState = getActionButtonState("add");
  const blockButtonState = getActionButtonState("block");

  // Check if this track is currently being played
  const isCurrentTrack = Boolean(track.preview_url && audioPlayer.state.currentTrackUrl === track.preview_url);
  const isPlaying = isCurrentTrack && audioPlayer.state.isPlaying;
  const isLoading = isCurrentTrack && audioPlayer.state.isLoading;

  const getPlayButtonContent = () => {
    if (isLoading) return "Loading...";
    if (isPlaying) return "Pause";
    return "Play";
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Track Art */}
        <div className="flex-shrink-0">
          {track.album.images.length > 0 ? (
            <img
              src={track.album.images[0].url}
              alt={`${track.name} album art`}
              className="w-16 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Art</span>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{track.name}</h3>
          <p className="text-sm text-gray-600 truncate">{track.artists.map((artist) => artist.name).join(", ")}</p>
          <p className="text-xs text-gray-500 mb-2">
            {track.album.name} • {formatDuration(track.duration_ms)} • Popularity: {track.popularity_score}/100
          </p>
          <p className="text-sm text-gray-700 line-clamp-3 mb-2">{track.ai_reasoning}</p>
          <button onClick={() => onViewDetails(track)} className="text-xs text-blue-600 hover:text-blue-800 underline">
            View full details & artist bio
          </button>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col gap-2 min-w-[80px]">
          {/* Play Preview Button */}
          {track.preview_url && onPlayPreview && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPlayPreview(track.preview_url as string)}
              disabled={isLoading}
              className={`w-full text-xs ${
                isPlaying ? "bg-green-50 border-green-500 text-green-700 hover:bg-green-100" : "hover:bg-gray-50"
              }`}
            >
              {getPlayButtonContent()}
            </Button>
          )}

          {/* Add to Library Button */}
          <Button
            size="sm"
            onClick={() => onAddToLibrary(track.spotify_track_id)}
            disabled={addButtonState.disabled}
            className={`w-full text-xs ${
              track.uiState === "added" ? "bg-green-600 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {addButtonState.text}
          </Button>

          {/* Block Track Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBlockTrack(track.spotify_track_id)}
            disabled={blockButtonState.disabled}
            className={`w-full text-xs ${
              track.uiState === "blocked"
                ? "border-red-500 text-red-500"
                : "border-gray-300 hover:border-red-500 hover:text-red-600"
            }`}
          >
            {blockButtonState.text}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;

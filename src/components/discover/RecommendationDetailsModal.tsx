import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import type { BlockDuration } from "../../types";
import type { RecommendationCardViewModel } from "./RecommendationCard";

interface RecommendationDetailsModalProps {
  isOpen: boolean;
  track: RecommendationCardViewModel | null;
  onClose: () => void;
  onAddToLibrary: (trackId: string) => void;
  onBlockTrack: (trackId: string, duration: BlockDuration) => void;
}

const RecommendationDetailsModal: React.FC<RecommendationDetailsModalProps> = ({
  isOpen,
  track,
  onClose,
  onAddToLibrary,
  onBlockTrack,
}) => {
  if (!track) return null;

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
        case "blocking":
        case "blocked":
          // Disable add button when track is being blocked or already blocked
          return { disabled: true, text: "Add to Library" };
        default:
          return { disabled: false, text: "Add to Library" };
      }
    } else {
      switch (track.uiState) {
        case "blocking":
          return { disabled: true, text: "Blocking..." };
        case "blocked":
          return { disabled: true, text: "Blocked" };
        case "adding":
        case "added":
          // Disable block button when track is being added or already added
          return { disabled: true, text: "Block Track (7 days)" };
        default:
          return { disabled: false, text: "Block Track (7 days)" };
      }
    }
  };

  const addButtonState = getActionButtonState("add");
  const blockButtonState = getActionButtonState("block");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-bold">Track Details</DialogTitle>
          <DialogDescription>Complete information about this recommendation and artist</DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Track Header Info */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Album Art */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              {track.album.images.length > 0 ? (
                <img
                  src={track.album.images[0].url}
                  alt={`${track.name} album art`}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-gray-400 text-sm">No Artwork</span>
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-grow min-w-0 text-center sm:text-left">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 break-words">{track.name}</h2>
              <p className="text-base md:text-lg text-gray-700 mb-1 break-words">
                by {track.artists.map((artist) => artist.name).join(", ")}
              </p>
              <p className="text-sm md:text-md text-gray-600 mb-3 break-words">
                from <span className="font-medium">{track.album.name}</span>
              </p>

              {/* Track Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Duration:</span> {formatDuration(track.duration_ms)}
                </div>
                <div>
                  <span className="font-medium">Popularity:</span> {track.popularity_score}/100
                </div>
                <div>
                  <span className="font-medium">AI Confidence:</span>{" "}
                  {(track.recommendation_confidence * 100).toFixed(1)}%
                </div>
                <div>
                  <span className="font-medium">Release Date:</span> {track.album.release_date}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => onAddToLibrary(track.spotify_track_id)}
              disabled={addButtonState.disabled}
              className={`w-full sm:w-auto ${
                track.uiState === "added"
                  ? "bg-green-600 hover:bg-green-600"
                  : track.uiState === "blocked" || track.uiState === "blocking"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {addButtonState.text}
            </Button>

            <Button
              variant="outline"
              onClick={() => onBlockTrack(track.spotify_track_id, "7d")}
              disabled={blockButtonState.disabled}
              className={`w-full sm:w-auto ${
                track.uiState === "blocked"
                  ? "border-red-400 text-red-600 bg-red-50"
                  : track.uiState === "added" || track.uiState === "adding"
                    ? "border-gray-300 text-gray-500 bg-gray-50 cursor-not-allowed"
                    : "border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
              }`}
            >
              {blockButtonState.text}
            </Button>
          </div>

          {/* AI Reasoning Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Why This Was Recommended
            </h3>
            <div className="text-blue-800 leading-relaxed">{track.ai_reasoning}</div>
          </div>

          {/* Artist Biography Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              About the Artist
            </h3>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto pr-2">
              {track.artist_bio}
            </div>
          </div>

          {/* Technical Details */}
          <div className="border-t border-gray-200 pt-4">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 transform group-open:rotate-90 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Technical Details
              </summary>
              <div className="mt-3 ml-6 text-sm text-gray-600 space-y-1">
                <div>
                  <span className="font-medium">Spotify Track ID:</span> {track.spotify_track_id}
                </div>
                <div>
                  <span className="font-medium">Genre:</span> Metal
                </div>
                <div>
                  <span className="font-medium">Album Type:</span> Album
                </div>
                <div>
                  <span className="font-medium">Available Markets:</span> Global
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecommendationDetailsModal;

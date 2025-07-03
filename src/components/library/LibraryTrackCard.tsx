import * as React from "react";
import { Button } from "../ui/button";
import { formatDuration, getAlbumCoverUrl } from "../../lib/utils/track.utils";
import type { LibraryTrackViewModel } from "../../types";

// =============================================================================
// TYPES
// =============================================================================

interface LibraryTrackCardProps {
  /** Track data to display */
  track: LibraryTrackViewModel;
  /** Whether the delete button should be disabled */
  isDeleteDisabled: boolean;
  /** Handler for delete button click */
  onDelete: (track: LibraryTrackViewModel) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Card component for displaying a single library track with delete functionality
 */
const LibraryTrackCard: React.FC<LibraryTrackCardProps> = ({ track, isDeleteDisabled, onDelete }) => {
  const albumCoverUrl = getAlbumCoverUrl(track.album.images);
  const artistNames = track.artists.map((artist) => artist.name).join(", ");
  const formattedDuration = formatDuration(track.duration_ms);
  const addedDate = new Date(track.created_at).toLocaleDateString();

  const handleDeleteClick = React.useCallback(() => {
    onDelete(track);
  }, [track, onDelete]);

  const isDeleting = track.uiState === "deleting";

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      {/* Album Cover */}
      <div className="mb-3">
        {albumCoverUrl ? (
          <img
            src={albumCoverUrl}
            alt={`${track.album.name} cover`}
            className="w-full aspect-square object-cover rounded-md mb-3"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-square bg-gray-200 rounded-md mb-3 flex items-center justify-center">
            <div className="text-gray-400 text-sm">No Cover</div>
          </div>
        )}

        {/* Track Info */}
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900 truncate" title={track.name}>
            {track.name}
          </h3>

          <p className="text-gray-600 text-sm truncate" title={artistNames}>
            {artistNames}
          </p>

          <p className="text-gray-500 text-xs truncate" title={track.album.name}>
            {track.album.name}
          </p>

          <div className="flex justify-between items-center text-gray-400 text-xs">
            <span>{formattedDuration}</span>
            <span title={`Added ${addedDate}`}>Added {addedDate}</span>
          </div>
        </div>
      </div>

      {/* Delete Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDeleteClick}
        disabled={isDeleteDisabled || isDeleting}
        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
      >
        {isDeleting ? (
          <>
            <span className="animate-spin mr-2">⭮</span>
            Removing...
          </>
        ) : (
          "Remove"
        )}
      </Button>
    </div>
  );
};

export default LibraryTrackCard;

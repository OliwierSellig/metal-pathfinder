import * as React from "react";
import type { LibraryTrackViewModel } from "../../types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

// =============================================================================
// TYPES
// =============================================================================

interface DeleteConfirmationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Track to be deleted (null when modal is closed) */
  track: LibraryTrackViewModel | null;
  /** Handler for confirming deletion */
  onConfirm: () => void;
  /** Handler for canceling deletion */
  onCancel: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Modal component for confirming track deletion from library
 */
const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, track, onConfirm, onCancel }) => {
  // Handle dialog close (ESC key, backdrop click)
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        onCancel();
      }
    },
    [onCancel]
  );

  const handleConfirmClick = React.useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const handleCancelClick = React.useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Don't render anything if no track
  if (!track) {
    return null;
  }

  const artistNames = track.artists.map((artist) => artist.name).join(", ");

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Remove Track from Library</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The track will be permanently removed from your personal library.
          </DialogDescription>
        </DialogHeader>

        {/* Track Info */}
        <div className="py-4">
          <div className="flex items-center gap-3">
            {/* Album Cover */}
            {track.album.images && track.album.images.length > 0 ? (
              <img
                src={track.album.images[0].url}
                alt={`${track.album.name} cover`}
                className="w-16 h-16 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-gray-400 text-xs">No Cover</span>
              </div>
            )}

            {/* Track Details */}
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-gray-900 truncate" title={track.name}>
                {track.name}
              </h4>
              <p className="text-sm text-gray-600 truncate" title={artistNames}>
                {artistNames}
              </p>
              <p className="text-xs text-gray-500 truncate" title={track.album.name}>
                {track.album.name}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancelClick}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirmClick} className="bg-red-600 hover:bg-red-700">
            Remove Track
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationModal;

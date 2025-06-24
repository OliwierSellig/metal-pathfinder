import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import SpotifyTrackSearch from "./SpotifyTrackSearch.tsx";
import type { SpotifyTrackSearchDTO } from "../../types";

interface EmptyLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackAdded: () => void;
}

const EmptyLibraryModal: React.FC<EmptyLibraryModalProps> = ({ isOpen, onClose, onTrackAdded }) => {
  const [isAdding, setIsAdding] = React.useState(false);

  const handleTrackSelect = async (track: SpotifyTrackSearchDTO) => {
    try {
      setIsAdding(true);

      const response = await fetch("/api/library", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spotify_track_id: track.spotify_track_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add track to library");
      }

      // Success - close modal and refresh library
      onTrackAdded();
      onClose();
    } catch (error) {
      console.error("Failed to add track:", error);
      // TODO: Show toast notification with error message
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Your First Track</DialogTitle>
          <DialogDescription>
            Search and add a metal track to your library to start getting personalized recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <SpotifyTrackSearch
            onTrackSelect={handleTrackSelect}
            isDisabled={isAdding}
            placeholder="Search for your favorite metal song..."
          />
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose} disabled={isAdding}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmptyLibraryModal;

/* eslint-disable react/prop-types */
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import TrackHeader from "./details-modal/TrackHeader";
import ActionButtons from "./details-modal/ActionButtons";
import AIReasoningSection from "./details-modal/AIReasoningSection";
import ArtistBioSection from "./details-modal/ArtistBioSection";
import TechnicalDetailsSection from "./details-modal/TechnicalDetailsSection";
import type { BlockDuration } from "../../types";
import type { RecommendationCardViewModel } from "./RecommendationCard";

interface RecommendationDetailsModalProps {
  isOpen: boolean;
  track: RecommendationCardViewModel | null;
  onClose: () => void;
  onAddToLibrary: (trackId: string) => void;
  onBlockTrack: (trackId: string, duration: BlockDuration) => void;
}

const RecommendationDetailsModal = React.memo<RecommendationDetailsModalProps>(
  ({ isOpen, track, onClose, onAddToLibrary, onBlockTrack }) => {
    if (!track) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold">Track Details</DialogTitle>
            <DialogDescription>Complete information about this recommendation and artist</DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <TrackHeader track={track} />

            <ActionButtons track={track} onAddToLibrary={onAddToLibrary} onBlockTrack={onBlockTrack} />

            <AIReasoningSection reasoning={track.ai_reasoning} />

            <ArtistBioSection bio={track.artist_bio} />

            <TechnicalDetailsSection track={track} />
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

RecommendationDetailsModal.displayName = "RecommendationDetailsModal";

export default RecommendationDetailsModal;

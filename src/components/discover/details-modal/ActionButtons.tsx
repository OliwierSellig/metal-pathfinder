/* eslint-disable react/prop-types */
import React from "react";
import TrackActionButton from "../../ui/TrackActionButton";
import { useTrackActions } from "../../../hooks/useTrackActions";
import type { RecommendationCardViewModel } from "../RecommendationCard";
import type { BlockDuration } from "../../../types";

interface ActionButtonsProps {
  track: RecommendationCardViewModel;
  onAddToLibrary: (trackId: string) => void;
  onBlockTrack: (trackId: string, duration: BlockDuration) => void;
}

const ActionButtons = React.memo<ActionButtonsProps>(({ track, onAddToLibrary, onBlockTrack }) => {
  const { addButton, blockButton } = useTrackActions(track);

  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
      <TrackActionButton
        variant="add"
        uiState={track.uiState}
        disabled={addButton.disabled}
        onClick={() => onAddToLibrary(track.spotify_track_id)}
      >
        {addButton.text}
      </TrackActionButton>

      <TrackActionButton
        variant="block"
        uiState={track.uiState}
        disabled={blockButton.disabled}
        onClick={() => onBlockTrack(track.spotify_track_id, "7d")}
      >
        {blockButton.text}
      </TrackActionButton>
    </div>
  );
});

ActionButtons.displayName = "ActionButtons";

export default ActionButtons;

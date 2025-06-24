import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { LibraryTrackDTO } from "../../types";

interface TrackSelectorProps {
  tracks: LibraryTrackDTO[];
  onSelect: (trackId: string) => void;
  disabled: boolean;
  selectedTrackId?: string;
}

const TrackSelector: React.FC<TrackSelectorProps> = ({ tracks, onSelect, disabled, selectedTrackId }) => {
  // For now, we'll display basic info since LibraryTrackDTO only has spotify_track_id and created_at
  // In a real implementation, we'd fetch additional track details or store them in the library

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Select base track ({tracks.length} tracks in library)</label>
      <Select value={selectedTrackId || ""} onValueChange={onSelect} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a track from your library..." />
        </SelectTrigger>
        <SelectContent>
          {tracks.map((track) => (
            <SelectItem key={track.spotify_track_id} value={track.spotify_track_id}>
              <div className="flex flex-col">
                <span className="font-medium">Track {track.spotify_track_id.slice(0, 8)}...</span>
                <span className="text-xs text-gray-500">Added {new Date(track.created_at).toLocaleDateString()}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TrackSelector;

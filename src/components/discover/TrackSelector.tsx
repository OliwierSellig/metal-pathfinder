import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { LibraryTrackWithDetailsDTO } from "../../types";

interface TrackSelectorProps {
  tracks: LibraryTrackWithDetailsDTO[];
  onSelect: (trackId: string) => void;
  disabled: boolean;
  selectedTrackId?: string;
}

const TrackSelector: React.FC<TrackSelectorProps> = ({ tracks, onSelect, disabled, selectedTrackId }) => {
  const formatDuration = (durationMs: number): string => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div data-testid="track-selector-container">
      <label className="block text-sm font-medium mb-2">Select base track ({tracks.length} tracks in library)</label>
      <Select value={selectedTrackId || ""} onValueChange={onSelect} disabled={disabled}>
        <SelectTrigger className="w-full" data-testid="track-selector-trigger">
          <SelectValue placeholder="Choose a track from your library..." />
        </SelectTrigger>
        <SelectContent className="max-h-60 w-[400px]" data-testid="track-selector-dropdown">
          {tracks.map((track) => (
            <SelectItem
              key={track.spotify_track_id}
              value={track.spotify_track_id}
              className="p-2"
              data-testid={`track-option-${track.spotify_track_id}`}
            >
              <div className="flex items-center gap-2 w-full min-w-0">
                {/* Album Art */}
                <div className="flex-shrink-0">
                  {track.album.images.length > 0 ? (
                    <img
                      src={track.album.images[track.album.images.length - 1].url} // Use smallest image
                      alt={`${track.name} album art`}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-400">♪</span>
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-sm truncate" title={track.name}>
                    {track.name}
                  </div>
                  <div
                    className="text-xs text-gray-500 truncate"
                    title={track.artists.map((artist) => artist.name).join(", ")}
                  >
                    {track.artists.map((artist) => artist.name).join(", ")}
                  </div>
                </div>

                {/* Duration */}
                <div className="flex-shrink-0 text-xs text-gray-400">{formatDuration(track.duration_ms)}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TrackSelector;

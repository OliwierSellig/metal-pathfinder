import * as React from "react";
import type { BlockedTrackViewModel } from "../../types";
import BlockedTrackCard from "./BlockedTrackCard";

// =============================================================================
// TYPES
// =============================================================================

interface BlockedTracksListProps {
  /** Lista zablokowanych utworów do wyświetlenia */
  tracks: BlockedTrackViewModel[];
  /** Callback wywoływany po kliknięciu przycisku "Unblock" */
  onUnblockClick: (trackId: string) => void;
  /** Callback wywoływany gdy timer utworu wygaśnie */
  onTimerExpire: (trackId: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Komponent prezentacyjny, który renderuje listę zablokowanych utworów
 * Zgodnie z planem implementacji:
 * - Mapuje tablicę BlockedTrackViewModel i renderuje BlockedTrackCard dla każdego elementu
 * - Nie ma bezpośrednich interakcji - przekazuje funkcje obsługi zdarzeń do BlockedTrackCard
 */
const BlockedTracksList: React.FC<BlockedTracksListProps> = ({ tracks, onUnblockClick, onTimerExpire }) => {
  return (
    <div className="space-y-4">
      {/* Nagłówek z liczbą utworów */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Blocked Tracks ({tracks.length})</h2>
      </div>

      {/* Lista utworów */}
      <div className="grid gap-4">
        {tracks.map((track) => (
          <BlockedTrackCard
            key={track.spotify_track_id}
            track={track}
            onUnblockClick={onUnblockClick}
            onTimerExpire={onTimerExpire}
          />
        ))}
      </div>
    </div>
  );
};

export default BlockedTracksList;

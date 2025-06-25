import * as React from "react";
import type { BlockedTrackViewModel } from "../../types";
import CountdownTimer from "./CountdownTimer";

// =============================================================================
// TYPES
// =============================================================================

interface BlockedTrackCardProps {
  /** Pojedynczy zablokowany utwór do wyświetlenia */
  track: BlockedTrackViewModel;
  /** Callback wywoływany po kliknięciu przycisku "Unblock" */
  onUnblockClick: (trackId: string) => void;
  /** Callback wywoływany gdy timer utworu wygaśnie */
  onTimerExpire: (trackId: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Wyświetla pojedynczy zablokowany utwór, zawierający:
 * - okładkę, tytuł, wykonawcę
 * - timer odliczający czas do odblokowania
 * - przycisk do natychmiastowego odblokowania
 *
 * Zgodnie z planem implementacji obsługuje onClick na przycisku "Unblock",
 * który wywołuje onUnblockClick z spotify_track_id utworu
 */
const BlockedTrackCard: React.FC<BlockedTrackCardProps> = ({ track, onUnblockClick, onTimerExpire }) => {
  // Handler dla wygaśnięcia timera tego konkretnego utworu
  const handleTimerExpire = React.useCallback(() => {
    onTimerExpire(track.spotify_track_id);
  }, [onTimerExpire, track.spotify_track_id]);

  // Handler dla kliknięcia przycisku Unblock
  const handleUnblockClick = React.useCallback(() => {
    onUnblockClick(track.spotify_track_id);
  }, [onUnblockClick, track.spotify_track_id]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Okładka albumu */}
          <div className="flex-shrink-0">
            {track.album.images.length > 0 ? (
              <img
                src={track.album.images[0].url}
                alt={track.album.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Informacje o utworze */}
          <div className="flex-1 min-w-0">
            <div className="text-lg font-medium text-gray-900 truncate">{track.name}</div>
            <div className="text-sm text-gray-600 truncate">
              {track.artists.map((artist) => artist.name).join(", ")}
            </div>
            <div className="text-sm text-gray-500 truncate">{track.album.name}</div>

            {/* Dodatkowe informacje - data zablokowania */}
            <div className="text-xs text-gray-400 mt-1">
              Blocked: {new Date(track.block_info.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* CountdownTimer */}
          <div className="flex-shrink-0">
            <CountdownTimer expiresAt={track.block_info.expires_at} onTimerExpire={handleTimerExpire} />
          </div>

          {/* Przycisk Unblock */}
          <button
            onClick={handleUnblockClick}
            disabled={track.uiState === "deleting"}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {track.uiState === "deleting" ? "Unblocking..." : "Unblock"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockedTrackCard;

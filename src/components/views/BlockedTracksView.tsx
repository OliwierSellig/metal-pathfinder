import * as React from "react";
import { useBlockedTracksView } from "../../hooks/useBlockedTracksView";
import { Toaster } from "../ui/sonner";
import BlockedTracksList from "../blocked-tracks/BlockedTracksList";
import UnblockConfirmationModal from "../blocked-tracks/UnblockConfirmationModal";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Główny komponent widoku Blocked Tracks
 * Zarządza stanem całego widoku, w tym ładowaniem danych, obsługą błędów
 * oraz logiką odblokowywania utworów zgodnie z planem implementacji
 */
const BlockedTracksViewContent: React.FC = () => {
  const { state, handlers } = useBlockedTracksView();

  // =============================================================================
  // RENDER STATES
  // =============================================================================

  // Stan ładowania
  if (state.isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">Loading your blocked tracks...</div>
      </div>
    );
  }

  // Stan błędu
  if (state.error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load blocked tracks</div>
        <p className="text-gray-600 mb-4">{state.error.message}</p>
        <button
          onClick={handlers.loadBlockedTracks}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Stan pusty
  if (state.tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">You haven&apos;t blocked any tracks yet.</div>
        <p className="text-gray-500 mb-6">
          When you block tracks from recommendations, they&apos;ll appear here with their expiration timers.
        </p>
        <a
          href="/discover"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Discover
        </a>
      </div>
    );
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Nagłówek z informacjami */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Blocked Tracks</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                These tracks won&apos;t appear in your AI recommendations until their timer expires or you unblock them
                manually. Tracks blocked &quot;permanently&quot; won&apos;t automatically expire.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista zablokowanych utworów */}
      <BlockedTracksList
        tracks={state.tracks}
        onUnblockClick={handlers.handleUnblockClick}
        onTimerExpire={handlers.handleTimerExpire}
      />

      {/* Modal potwierdzający */}
      <UnblockConfirmationModal
        isOpen={state.trackToUnblock !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handlers.handleCloseModal();
          }
        }}
        onConfirm={handlers.handleConfirmUnblock}
        track={state.trackToUnblock}
      />
    </div>
  );
};

// Main component with Toaster
const BlockedTracksView: React.FC = () => {
  return (
    <>
      <BlockedTracksViewContent />
      <Toaster />
    </>
  );
};

export default BlockedTracksView;

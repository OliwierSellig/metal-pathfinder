import * as React from "react";
import { useLibraryView } from "../../hooks/useLibraryView";
import { Toaster } from "../ui/sonner";
import LibraryTrackCard from "../library/LibraryTrackCard";
import PaginationControls from "../library/PaginationControls";
import DeleteConfirmationModal from "../library/DeleteConfirmationModal";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Główny komponent widoku Library
 * Zarządza stanem całego widoku, w tym ładowaniem danych, obsługą błędów
 * oraz logiką paginacji zgodnie z planem implementacji
 */
const LibraryViewContent: React.FC = () => {
  const { state, handlers } = useLibraryView();

  const { handlePageChange, handleDeleteTrack, handleConfirmDelete, handleCancelDelete, handleRetryLoad } = handlers;

  // Określenie czy można usuwać utwory (nie ostatni utwór)
  const isDeleteDisabled = state.pagination.totalCount <= 1;

  // =============================================================================
  // RENDER CONDITIONS
  // =============================================================================

  if (state.isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">Loading your library...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load your library</div>
        <button onClick={handleRetryLoad} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Try Again
        </button>
      </div>
    );
  }

  if (state.pagination.totalCount === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">Your library is empty</div>
        <p className="text-gray-500 mb-6">Start building your metal collection by discovering new tracks.</p>
        <a href="/discover" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Discover Music
        </a>
      </div>
    );
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <>
      {/* Track count info */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm">{state.pagination.totalCount} tracks in your library</p>
      </div>

      {/* Grid utworów */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {state.tracks.map((track) => (
          <LibraryTrackCard
            key={track.spotify_track_id}
            track={track}
            isDeleteDisabled={isDeleteDisabled}
            onDelete={handleDeleteTrack}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      <PaginationControls pagination={state.pagination} onPageChange={handlePageChange} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!state.trackToDelete}
        track={state.trackToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};

// Main component
const LibraryView: React.FC = () => {
  return (
    <>
      <LibraryViewContent />
      <Toaster />
    </>
  );
};

export default LibraryView;

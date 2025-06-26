import * as React from "react";
import { useDiscoverView } from "../../hooks/useDiscoverView";
import EmptyLibraryModal from "../discover/EmptyLibraryModal";
import RecommendationForm from "../discover/RecommendationForm";
import RecommendationsList from "../discover/RecommendationsList";
import RecommendationDetailsModal from "../discover/RecommendationDetailsModal";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Główny komponent widoku Discover
 * Zarządza stanem całego widoku, w tym ładowaniem danych, obsługą błędów
 * oraz logiką rekomendacji zgodnie z planem implementacji
 */
export default function DiscoverView() {
  const { state, handlers } = useDiscoverView();

  const {
    generateRecommendations,
    handleOpenDetailsModal,
    handleCloseModal,
    handleClearRecommendationsError,
    handleTrackAddedFromModal,
    addTrackToLibrary,
    blockTrack,
  } = handlers;

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <>
      {/* Conditional rendering based on library state */}
      {state.library.isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading your library...</div>
        </div>
      ) : state.library.error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Failed to load your library</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : !state.isLibraryEmpty ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Form */}
          <div>
            <RecommendationForm
              libraryTracks={state.library.tracks}
              isLoading={state.recommendations.isLoading}
              onSubmit={generateRecommendations}
            />
          </div>

          {/* Right Column: Results */}
          <div>
            <RecommendationsList
              recommendations={state.recommendations.list}
              isLoading={state.recommendations.isLoading}
              error={state.recommendations.error}
              metadata={state.recommendations.metadata}
              onAddToLibrary={addTrackToLibrary}
              onBlockTrack={blockTrack}
              onViewDetails={handleOpenDetailsModal}
              onClearError={handleClearRecommendationsError}
            />
          </div>
        </div>
      ) : null}

      {/* Modal for empty library */}
      <EmptyLibraryModal
        isOpen={state.activeModal.type === "empty-library"}
        onClose={handleCloseModal}
        onTrackAdded={handleTrackAddedFromModal}
      />

      {/* Modal for recommendation details */}
      <RecommendationDetailsModal
        isOpen={state.activeModal.type === "details"}
        track={
          state.activeModal.type === "details" && state.activeModal.data
            ? state.recommendations.list.find(
                (rec) => rec.spotify_track_id === state.activeModal.data?.spotify_track_id
              ) || null
            : null
        }
        onClose={handleCloseModal}
        onAddToLibrary={addTrackToLibrary}
        onBlockTrack={blockTrack}
      />
    </>
  );
}

import React from "react";
import type {
  LibraryTrackDTO,
  AIRecommendationDTO,
  GenerationMetadataDTO,
  LibraryResponseDTO,
  AIRecommendationsCommand,
  AIRecommendationsResponseDTO,
} from "../../types";
import EmptyLibraryModal from "../discover/EmptyLibraryModal";
import RecommendationForm from "../discover/RecommendationForm.tsx";
import RecommendationsList from "../discover/RecommendationsList.tsx";
import { type RecommendationCardViewModel } from "../discover/RecommendationCard.tsx";
import { AudioPlayerProvider, useAudioPlayer } from "../contexts/AudioPlayerContext.tsx";

// =============================================================================
// INTERNAL TYPES FOR DISCOVER VIEW
// =============================================================================

/** Główny stan widoku Discover */
interface DiscoverViewState {
  library: {
    tracks: LibraryTrackDTO[];
    isLoading: boolean;
    error: Error | null;
  };
  form: {
    base_track_id: string;
    description: string;
    temperature: number;
  };
  recommendations: {
    list: RecommendationCardViewModel[];
    isLoading: boolean;
    error: Error | null;
    metadata: GenerationMetadataDTO | null;
  };
  activeModal: {
    type: "details" | "empty-library" | null;
    data: AIRecommendationDTO | null;
  };
  isLibraryEmpty: boolean;
}

// RecommendationCardViewModel is now imported from RecommendationCard.tsx

// =============================================================================
// CUSTOM HOOK FOR DISCOVER VIEW LOGIC
// =============================================================================

const useDiscoverView = () => {
  const [viewState, setViewState] = React.useState<DiscoverViewState>({
    library: {
      tracks: [],
      isLoading: true,
      error: null,
    },
    form: {
      base_track_id: "",
      description: "",
      temperature: 0.5,
    },
    recommendations: {
      list: [],
      isLoading: false,
      error: null,
      metadata: null,
    },
    activeModal: {
      type: null,
      data: null,
    },
    isLibraryEmpty: false,
  });

  // =============================================================================
  // LIBRARY FETCHING LOGIC
  // =============================================================================

  const fetchLibrary = React.useCallback(async () => {
    try {
      setViewState((prev) => ({
        ...prev,
        library: { ...prev.library, isLoading: true, error: null },
      }));

      const response = await fetch("/api/library");

      if (!response.ok) {
        throw new Error(`Failed to fetch library: ${response.status}`);
      }

      const data: LibraryResponseDTO = await response.json();

      setViewState((prev) => ({
        ...prev,
        library: {
          tracks: data.tracks,
          isLoading: false,
          error: null,
        },
        isLibraryEmpty: data.tracks.length === 0,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error("Unknown error occurred");

      setViewState((prev) => ({
        ...prev,
        library: {
          ...prev.library,
          isLoading: false,
          error: errorMessage,
        },
      }));
    }
  }, []);

  // Fetch library on component mount
  React.useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  // =============================================================================
  // RECOMMENDATIONS LOGIC
  // =============================================================================

  const generateRecommendations = React.useCallback(async (command: AIRecommendationsCommand) => {
    try {
      setViewState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          isLoading: true,
          error: null,
        },
      }));

      const response = await fetch("/api/spotify/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate recommendations");
      }

      const data: AIRecommendationsResponseDTO = await response.json();

      // Convert to RecommendationCardViewModel with UI state
      const recommendationsWithUIState: RecommendationCardViewModel[] = data.recommendations.map((rec) => ({
        ...rec,
        uiState: "idle" as const,
      }));

      setViewState((prev) => ({
        ...prev,
        recommendations: {
          list: recommendationsWithUIState,
          isLoading: false,
          error: null,
          metadata: data.generation_metadata,
        },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error("Unknown error occurred");

      setViewState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          isLoading: false,
          error: errorMessage,
        },
      }));
    }
  }, []);

  // =============================================================================
  // HANDLERS FOR USER INTERACTIONS
  // =============================================================================

  const clearRecommendationsError = React.useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      recommendations: { ...prev.recommendations, error: null },
    }));
  }, []);

  const openDetailsModal = React.useCallback((track: AIRecommendationDTO) => {
    setViewState((prev) => ({
      ...prev,
      activeModal: { type: "details", data: track },
    }));
  }, []);

  const closeModal = React.useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      activeModal: { type: null, data: null },
    }));
  }, []);

  const openEmptyLibraryModal = React.useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      activeModal: { type: "empty-library", data: null },
    }));
  }, []);

  const onTrackAddedToLibrary = React.useCallback(() => {
    // Refresh library after adding track
    fetchLibrary();
  }, [fetchLibrary]);

  // =============================================================================
  // RECOMMENDATION ACTIONS
  // =============================================================================

  const addToLibrary = React.useCallback(async (trackId: string) => {
    try {
      // Update UI state to "adding"
      setViewState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          list: prev.recommendations.list.map((track) =>
            track.spotify_track_id === trackId ? { ...track, uiState: "adding" } : track
          ),
        },
      }));

      const response = await fetch("/api/library", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spotify_track_id: trackId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add track to library");
      }

      // Success - update UI state to "added"
      setViewState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          list: prev.recommendations.list.map((track) =>
            track.spotify_track_id === trackId ? { ...track, uiState: "added" } : track
          ),
        },
      }));

      // TODO: Show success toast
    } catch (error) {
      console.error("Failed to add track to library:", error);

      // Reset UI state to "idle"
      setViewState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          list: prev.recommendations.list.map((track) =>
            track.spotify_track_id === trackId ? { ...track, uiState: "idle" } : track
          ),
        },
      }));

      // TODO: Show error toast
    }
  }, []);

  const blockTrack = React.useCallback(async (trackId: string) => {
    try {
      // Update UI state to "blocking"
      setViewState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          list: prev.recommendations.list.map((track) =>
            track.spotify_track_id === trackId ? { ...track, uiState: "blocking" } : track
          ),
        },
      }));

      const response = await fetch("/api/blocked-tracks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spotify_track_id: trackId,
          duration: "7d", // Default block duration
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to block track");
      }

      // Success - update UI state to "blocked"
      setViewState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          list: prev.recommendations.list.map((track) =>
            track.spotify_track_id === trackId ? { ...track, uiState: "blocked" } : track
          ),
        },
      }));

      // TODO: Show success toast
    } catch (error) {
      console.error("Failed to block track:", error);

      // Reset UI state to "idle"
      setViewState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          list: prev.recommendations.list.map((track) =>
            track.spotify_track_id === trackId ? { ...track, uiState: "idle" } : track
          ),
        },
      }));

      // TODO: Show error toast
    }
  }, []);

  const handlers = React.useMemo(
    () => ({
      // Library handlers
      retryFetchLibrary: fetchLibrary,

      // Recommendations handlers
      generateRecommendations,
      clearRecommendationsError,
      addToLibrary,
      blockTrack,

      // Modal handlers
      openDetailsModal,
      closeModal,
      openEmptyLibraryModal,
      onTrackAddedToLibrary,
    }),
    [
      fetchLibrary,
      generateRecommendations,
      clearRecommendationsError,
      addToLibrary,
      blockTrack,
      openDetailsModal,
      closeModal,
      openEmptyLibraryModal,
      onTrackAddedToLibrary,
    ]
  );

  return { viewState, handlers };
};

// =============================================================================
// MAIN DISCOVER VIEW COMPONENT
// =============================================================================

const DiscoverViewContent: React.FC = () => {
  const { viewState, handlers } = useDiscoverView();
  const audioPlayer = useAudioPlayer();

  // Update playPreview to use global audio player
  const playPreviewWithAudioPlayer = React.useCallback(
    (previewUrl: string) => {
      audioPlayer.play(previewUrl);
    },
    [audioPlayer]
  );

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Discover New Metal Music</h1>

        {/* Handle library loading states */}
        {viewState.library.isLoading && (
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        )}

        {/* Handle library error state */}
        {viewState.library.error && (
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Failed to load your library</h2>
              <p className="text-red-600 mb-4">{viewState.library.error.message}</p>
              <button
                onClick={handlers.retryFetchLibrary}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Handle empty library state */}
        {viewState.isLibraryEmpty && (
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">Your library is empty</h2>
              <p className="text-yellow-600 mb-4">
                You need to add some tracks to your library before you can get recommendations.
              </p>
              <button
                onClick={handlers.openEmptyLibraryModal}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
              >
                Add Your First Track
              </button>
            </div>
          </div>
        )}

        {/* Main discover view with library loaded */}
        {!viewState.library.isLoading && !viewState.library.error && !viewState.isLibraryEmpty && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Recommendation Form */}
            <div className="lg:col-span-1">
              <RecommendationForm
                libraryTracks={viewState.library.tracks}
                isLoading={viewState.recommendations.isLoading}
                onSubmit={handlers.generateRecommendations}
              />
            </div>

            {/* Right Column - Recommendations */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Recommendations</h2>

                <RecommendationsList
                  recommendations={viewState.recommendations.list}
                  isLoading={viewState.recommendations.isLoading}
                  error={viewState.recommendations.error}
                  metadata={viewState.recommendations.metadata}
                  onAddToLibrary={handlers.addToLibrary}
                  onBlockTrack={handlers.blockTrack}
                  onViewDetails={handlers.openDetailsModal}
                  onPlayPreview={playPreviewWithAudioPlayer}
                  onClearError={handlers.clearRecommendationsError}
                />
              </div>
            </div>
          </div>
        )}

        {/* Empty Library Modal */}
        <EmptyLibraryModal
          isOpen={viewState.activeModal.type === "empty-library"}
          onClose={handlers.closeModal}
          onTrackAdded={handlers.onTrackAddedToLibrary}
        />

        {/* TODO: Add RecommendationDetailsModal in next steps */}
      </div>
    </div>
  );
};

// Main component with AudioPlayerProvider wrapper
const DiscoverView: React.FC = () => {
  return (
    <AudioPlayerProvider>
      <DiscoverViewContent />
    </AudioPlayerProvider>
  );
};

export default DiscoverView;

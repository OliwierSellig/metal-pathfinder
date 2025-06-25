import * as React from "react";
import type {
  LibraryTrackWithDetailsDTO,
  GenerationMetadataDTO,
  LibraryResponseDTO,
  AIRecommendationsCommand,
  AIRecommendationsResponseDTO,
  BlockDuration,
} from "../types";
import { type RecommendationCardViewModel } from "../components/discover/RecommendationCard";
import { toast } from "sonner";

// =============================================================================
// INTERNAL TYPES FOR DISCOVER VIEW
// =============================================================================

/** Główny stan widoku Discover */
interface DiscoverViewState {
  library: {
    tracks: LibraryTrackWithDetailsDTO[];
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
    data: { spotify_track_id: string } | null;
  };
  isLibraryEmpty: boolean;
}

/**
 * Custom hook zarządzający stanem i logiką widoku Discover
 * Zgodnie z planem implementacji, hermetyzuje całą logikę biznesową
 */
export function useDiscoverView() {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const [state, setState] = React.useState<DiscoverViewState>({
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
  // API CALL FUNCTIONS
  // =============================================================================

  /** Ładowanie biblioteki użytkownika */
  const loadLibrary = React.useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        library: { ...prev.library, isLoading: true, error: null },
      }));

      const response = await fetch("/api/library");
      if (!response.ok) {
        throw new Error(`Failed to load library: ${response.status}`);
      }

      const libraryData: LibraryResponseDTO = await response.json();

      // If library is empty, handle it immediately
      if (libraryData.tracks.length === 0) {
        setState((prev) => ({
          ...prev,
          library: {
            tracks: [],
            isLoading: false,
            error: null,
          },
          isLibraryEmpty: true,
          activeModal: { type: "empty-library", data: null },
        }));
        return;
      }

      // Fetch Spotify details for all tracks
      const trackIds = libraryData.tracks.map((track) => track.spotify_track_id);
      const spotifyResponse = await fetch("/api/spotify/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_ids: trackIds }),
      });

      if (!spotifyResponse.ok) {
        throw new Error(`Failed to load track details: ${spotifyResponse.status}`);
      }

      const spotifyDetails = await spotifyResponse.json();

      // Combine library data with Spotify details
      const tracksWithDetails: LibraryTrackWithDetailsDTO[] = libraryData.tracks.map((libraryTrack) => {
        const spotifyDetail = spotifyDetails.find(
          (track: { spotify_track_id: string }) => track.spotify_track_id === libraryTrack.spotify_track_id
        );

        if (!spotifyDetail) {
          // Fallback if Spotify details not found
          return {
            ...libraryTrack,
            name: `Track ${libraryTrack.spotify_track_id.slice(0, 8)}...`,
            artists: [{ name: "Unknown Artist" }],
            album: { name: "Unknown Album", images: [] },
            duration_ms: 0,
          };
        }

        return {
          ...libraryTrack,
          name: spotifyDetail.name,
          artists: spotifyDetail.artists.map((artist: { name: string }) => ({ name: artist.name })),
          album: {
            name: spotifyDetail.album.name,
            images: spotifyDetail.album.images,
          },
          duration_ms: spotifyDetail.duration_ms,
        };
      });

      setState((prev) => ({
        ...prev,
        library: {
          tracks: tracksWithDetails,
          isLoading: false,
          error: null,
        },
        isLibraryEmpty: false,
        form: {
          ...prev.form,
          // Auto-select first track if available
          base_track_id: tracksWithDetails.length > 0 ? tracksWithDetails[0].spotify_track_id : "",
        },
      }));

      // Otwórz modal pustej biblioteki jeśli trzeba
      if (libraryData.tracks.length === 0) {
        setState((prev) => ({
          ...prev,
          activeModal: { type: "empty-library", data: null },
        }));
      }
    } catch (_err) {
      setState((prev) => ({
        ...prev,
        library: {
          ...prev.library,
          isLoading: false,
          error: _err instanceof Error ? _err : new Error("Unknown error"),
        },
      }));
      toast.error("Failed to load your library. Please try again.");
    }
  }, []);

  /** Generowanie rekomendacji AI */
  const generateRecommendations = React.useCallback(async (command: AIRecommendationsCommand) => {
    try {
      setState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          isLoading: true,
          error: null,
        },
      }));

      const response = await fetch("/api/spotify/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      const responseData: AIRecommendationsResponseDTO = await response.json();

      // Konwersja na RecommendationCardViewModel (dodanie stanu UI)
      const recommendationsWithUIState: RecommendationCardViewModel[] = responseData.recommendations.map((rec) => ({
        ...rec,
        uiState: "idle" as const,
      }));

      setState((prev) => ({
        ...prev,
        recommendations: {
          list: recommendationsWithUIState,
          isLoading: false,
          error: null,
          metadata: responseData.generation_metadata,
        },
      }));

      toast.success(`Generated ${responseData.recommendations.length} recommendations!`);
    } catch (_err) {
      setState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          isLoading: false,
          error: _err instanceof Error ? _err : new Error("Unknown error"),
        },
      }));
      toast.error("Failed to generate recommendations. Please try again.");
    }
  }, []);

  /** Dodawanie utworu do biblioteki */
  const addTrackToLibrary = React.useCallback(async (spotifyTrackId: string) => {
    try {
      // Optymistyczne UI - ustawienie stanu "adding"
      setState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          list: prev.recommendations.list.map((rec) =>
            rec.spotify_track_id === spotifyTrackId ? { ...rec, uiState: "adding" } : rec
          ),
        },
      }));

      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotify_track_id: spotifyTrackId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add track: ${response.status}`);
      }

      // Sukces - ustawienie stanu "added"
      setState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          list: prev.recommendations.list.map((rec) =>
            rec.spotify_track_id === spotifyTrackId ? { ...rec, uiState: "added" } : rec
          ),
        },
      }));

      toast.success("Track added to your library!");

      // Optymistyczne dodanie utworu do biblioteki z detalami z rekomendacji
      const recommendationData = state.recommendations.list.find((rec) => rec.spotify_track_id === spotifyTrackId);
      if (recommendationData) {
        const newLibraryTrack: LibraryTrackWithDetailsDTO = {
          spotify_track_id: spotifyTrackId,
          created_at: new Date().toISOString(),
          name: recommendationData.name,
          artists: recommendationData.artists.map((artist) => ({ name: artist.name })),
          album: {
            name: recommendationData.album.name,
            images: recommendationData.album.images,
          },
          duration_ms: recommendationData.duration_ms,
        };

        setState((prev) => ({
          ...prev,
          library: {
            ...prev.library,
            tracks: [newLibraryTrack, ...prev.library.tracks],
          },
          isLibraryEmpty: false,
        }));
      }
    } catch {
      // Rollback UI state
      setState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          list: prev.recommendations.list.map((rec) =>
            rec.spotify_track_id === spotifyTrackId ? { ...rec, uiState: "idle" } : rec
          ),
        },
      }));
      toast.error("Failed to add track to library. Please try again.");
    }
  }, []);

  /** Blokowanie utworu */
  const blockTrack = React.useCallback(async (spotifyTrackId: string, duration: BlockDuration) => {
    try {
      // Optymistyczne UI - ustawienie stanu "blocking"
      setState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          list: prev.recommendations.list.map((rec) =>
            rec.spotify_track_id === spotifyTrackId ? { ...rec, uiState: "blocking" } : rec
          ),
        },
      }));

      const response = await fetch(`/api/blocked-tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotify_track_id: spotifyTrackId, duration }),
      });

      if (!response.ok) {
        throw new Error(`Failed to block track: ${response.status}`);
      }

      // Sukces - usuń z listy (zastąp stanem "blocked")
      setState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          list: prev.recommendations.list.map((rec) =>
            rec.spotify_track_id === spotifyTrackId ? { ...rec, uiState: "blocked" } : rec
          ),
        },
      }));

      const durationText = duration === "1d" ? "1 day" : duration === "7d" ? "7 days" : "permanently";
      toast.success(`Track blocked for ${durationText}`);
    } catch {
      // Rollback UI state
      setState((prev) => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          list: prev.recommendations.list.map((rec) =>
            rec.spotify_track_id === spotifyTrackId ? { ...rec, uiState: "idle" } : rec
          ),
        },
      }));
      toast.error("Failed to block track. Please try again.");
    }
  }, []);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleOpenDetailsModal = React.useCallback((track: RecommendationCardViewModel) => {
    setState((prev) => ({
      ...prev,
      activeModal: { type: "details", data: { spotify_track_id: track.spotify_track_id } },
    }));
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeModal: { type: null, data: null },
    }));
  }, []);

  const handleClearRecommendationsError = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      recommendations: {
        ...prev.recommendations,
        error: null,
      },
    }));
  }, []);

  const handleTrackAddedFromModal = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeModal: { type: null, data: null },
    }));
    // Nie potrzebujemy odświeżać biblioteki - addTrackToLibrary już to zrobiło optymistycznie
  }, []);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Ładowanie biblioteki przy mount
  React.useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // =============================================================================
  // RETURN HOOK DATA
  // =============================================================================

  return {
    state,
    handlers: {
      generateRecommendations,
      handleOpenDetailsModal,
      handleCloseModal,
      handleClearRecommendationsError,
      handleTrackAddedFromModal,
      addTrackToLibrary,
      blockTrack,
      loadLibrary, // Do retry w przypadku błędu
    },
  };
}

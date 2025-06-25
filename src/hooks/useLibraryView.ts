import * as React from "react";
import type {
  LibraryTrackViewModel,
  LibraryViewState,
  PaginationMeta,
  LibraryResponseDTO,
  LibraryTrackWithDetailsDTO,
  SuccessMessageDTO,
} from "../types";
import { toast } from "sonner";

// =============================================================================
// CONSTANTS
// =============================================================================

const TRACKS_PER_PAGE = 20;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Parsuje parametr page z URL
 */
function getPageFromURL(): number {
  if (typeof window === "undefined") return 1;
  const urlParams = new URLSearchParams(window.location.search);
  const page = parseInt(urlParams.get("page") || "1", 10);
  return page > 0 ? page : 1;
}

/**
 * Aktualizuje parametr page w URL
 */
function updateURLPage(page: number): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (page === 1) {
    url.searchParams.delete("page");
  } else {
    url.searchParams.set("page", page.toString());
  }
  window.history.pushState({}, "", url.toString());
}

/**
 * Oblicza metadane paginacji na podstawie odpowiedzi API
 */
function calculatePaginationMeta(
  currentPage: number,
  totalCount: number,
  limit: number,
  hasMore: boolean
): PaginationMeta {
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (currentPage - 1) * limit;
  return {
    currentPage,
    totalPages,
    totalCount,
    limit,
    hasMore,
    total_count: totalCount,
    offset,
  };
}

/**
 * Custom hook zarządzający stanem i logiką widoku Library
 * Zgodnie z planem implementacji, hermetyzuje całą logikę biznesową
 */
export function useLibraryView() {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const [state, setState] = React.useState<LibraryViewState>({
    tracks: [],
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalCount: 0,
      limit: TRACKS_PER_PAGE,
      hasMore: false,
      total_count: 0,
      offset: 0,
    },
    isLoading: true,
    error: null,
    trackToDelete: null,
  });

  // =============================================================================
  // API CALL FUNCTIONS
  // =============================================================================

  /** Ładowanie biblioteki dla określonej strony */
  const loadLibraryPage = React.useCallback(async (page: number) => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const offset = (page - 1) * TRACKS_PER_PAGE;
      const response = await fetch(`/api/library?limit=${TRACKS_PER_PAGE}&offset=${offset}`);

      if (!response.ok) {
        throw new Error(`Failed to load library: ${response.status}`);
      }

      const libraryData: LibraryResponseDTO = await response.json();

      // Jeśli brak utworów, ustaw pusty stan
      if (libraryData.tracks.length === 0) {
        const paginationMeta = calculatePaginationMeta(
          page,
          libraryData.total_count,
          TRACKS_PER_PAGE,
          libraryData.has_more
        );
        setState((prev) => ({
          ...prev,
          tracks: [],
          pagination: paginationMeta,
          isLoading: false,
          error: null,
        }));
        return;
      }

      // Pobierz szczegóły utworów z Spotify
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

      // Połącz dane biblioteki ze szczegółami Spotify
      const tracksWithDetails: LibraryTrackWithDetailsDTO[] = libraryData.tracks.map((libraryTrack) => {
        const spotifyDetail = spotifyDetails.find(
          (track: { spotify_track_id: string }) => track.spotify_track_id === libraryTrack.spotify_track_id
        );

        if (!spotifyDetail) {
          // Fallback jeśli nie znaleziono szczegółów Spotify
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

      // Konwersja na LibraryTrackViewModel (dodanie stanu UI)
      const tracksWithUIState: LibraryTrackViewModel[] = tracksWithDetails.map((track) => ({
        ...track,
        uiState: "idle" as const,
      }));

      // Oblicz metadane paginacji
      const paginationMeta = calculatePaginationMeta(
        page,
        libraryData.total_count,
        TRACKS_PER_PAGE,
        libraryData.has_more
      );

      setState((prev) => ({
        ...prev,
        tracks: tracksWithUIState,
        pagination: paginationMeta,
        isLoading: false,
        error: null,
      }));

      // Aktualizuj URL
      updateURLPage(page);
    } catch (_err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: _err instanceof Error ? _err : new Error("Unknown error"),
      }));
      toast.error("Failed to load your library. Please try again.");
    }
  }, []);

  /** Usuwanie utworu z biblioteki */
  const removeTrackFromLibrary = React.useCallback(
    async (track: LibraryTrackViewModel) => {
      try {
        // Optymistyczne UI - ustawienie stanu "deleting"
        setState((prev) => ({
          ...prev,
          tracks: prev.tracks.map((t) =>
            t.spotify_track_id === track.spotify_track_id ? { ...t, uiState: "deleting" } : t
          ),
          trackToDelete: null,
        }));

        const response = await fetch(`/api/library/${track.spotify_track_id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Failed to remove track: ${response.status}`);
        }

        const result: SuccessMessageDTO = await response.json();

        // Sukces - usuń z listy i przeładuj stronę jeśli trzeba
        const newTracks = state.tracks.filter((t) => t.spotify_track_id !== track.spotify_track_id);
        const newTotalCount = state.pagination.totalCount - 1;

        // Sprawdź czy trzeba przeładować poprzednią stronę (jeśli aktualna jest pusta)
        const currentPage = state.pagination.currentPage;
        const isCurrentPageEmpty = newTracks.length === 0 && currentPage > 1;

        if (isCurrentPageEmpty) {
          // Przeładuj poprzednią stronę
          loadLibraryPage(currentPage - 1);
        } else {
          // Aktualizuj stan lokalnie
          const newPaginationMeta = calculatePaginationMeta(
            currentPage,
            newTotalCount,
            TRACKS_PER_PAGE,
            state.pagination.hasMore
          );

          setState((prev) => ({
            ...prev,
            tracks: newTracks,
            pagination: newPaginationMeta,
          }));
        }

        toast.success(result.message || "Track removed from library!");
      } catch {
        // Rollback UI state
        setState((prev) => ({
          ...prev,
          tracks: prev.tracks.map((t) =>
            t.spotify_track_id === track.spotify_track_id ? { ...t, uiState: "idle" } : t
          ),
          trackToDelete: null,
        }));
        toast.error("Failed to remove track from library. Please try again.");
      }
    },
    [state.tracks, state.pagination, loadLibraryPage]
  );

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handlePageChange = React.useCallback(
    (newPage: number) => {
      loadLibraryPage(newPage);
    },
    [loadLibraryPage]
  );

  const handleDeleteTrack = React.useCallback((track: LibraryTrackViewModel) => {
    setState((prev) => ({
      ...prev,
      trackToDelete: track,
    }));
  }, []);

  const handleConfirmDelete = React.useCallback(() => {
    if (state.trackToDelete) {
      removeTrackFromLibrary(state.trackToDelete);
    }
  }, [state.trackToDelete, removeTrackFromLibrary]);

  const handleCancelDelete = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      trackToDelete: null,
    }));
  }, []);

  const handleRetryLoad = React.useCallback(() => {
    loadLibraryPage(state.pagination.currentPage);
  }, [loadLibraryPage, state.pagination.currentPage]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Ładowanie biblioteki przy mount
  React.useEffect(() => {
    const initialPage = getPageFromURL();
    loadLibraryPage(initialPage);
  }, [loadLibraryPage]);

  // =============================================================================
  // RETURN HOOK DATA
  // =============================================================================

  return {
    state,
    handlers: {
      handlePageChange,
      handleDeleteTrack,
      handleConfirmDelete,
      handleCancelDelete,
      handleRetryLoad,
    },
  };
}

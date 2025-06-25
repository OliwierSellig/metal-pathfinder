import * as React from "react";
import type {
  BlockedTracksResponseDTO,
  TrackDetailsResponseDTO,
  BlockedTrackViewModel,
  BlockedTracksViewState,
  SuccessMessageDTO,
} from "../types";
import { toast } from "sonner";

/**
 * Custom hook zarządzający stanem i logiką widoku Blocked Tracks
 * Zgodnie z planem implementacji, hermetyzuje całą logikę biznesową
 */
export function useBlockedTracksView() {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const [state, setState] = React.useState<BlockedTracksViewState>({
    tracks: [],
    isLoading: true,
    error: null,
    trackToUnblock: null,
  });

  // =============================================================================
  // API CALL FUNCTIONS
  // =============================================================================

  /** Ładowanie zablokowanych utworów z kombinacją danych z API */
  const loadBlockedTracks = React.useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      // 1. Pobierz listę zablokowanych utworów
      const blockedResponse = await fetch("/api/blocked-tracks");
      if (!blockedResponse.ok) {
        const errorText = await blockedResponse.text();
        console.error("Blocked tracks API error:", errorText);
        throw new Error(`Failed to load blocked tracks: ${blockedResponse.status} - ${errorText}`);
      }

      const blockedData: BlockedTracksResponseDTO = await blockedResponse.json();

      // Jeśli lista jest pusta, ustaw stan natychmiast
      if (blockedData.blocked_tracks.length === 0) {
        setState((prev) => ({
          ...prev,
          tracks: [],
          isLoading: false,
          error: null,
        }));
        return;
      }

      // 2. Pobierz szczegóły utworów z Spotify dla każdego zablokowanego utworu
      const trackDetailsPromises = blockedData.blocked_tracks.map(async (blockedTrack) => {
        const detailsResponse = await fetch(`/api/spotify/track/${blockedTrack.spotify_track_id}`);
        if (!detailsResponse.ok) {
          // Jeśli nie można pobrać szczegółów, zwróć podstawowe dane
          return null;
        }
        const details: TrackDetailsResponseDTO = await detailsResponse.json();
        return { blockedTrack, details };
      });

      const trackDetailsResults = await Promise.all(trackDetailsPromises);

      // 3. Połącz dane w modele widoku
      const tracksWithDetails: BlockedTrackViewModel[] = trackDetailsResults
        .filter((result): result is NonNullable<typeof result> => result !== null)
        .map((result) => ({
          // Szczegóły z Spotify
          ...result.details,
          // Informacje o blokadzie
          block_info: {
            expires_at: result.blockedTrack.expires_at,
            created_at: result.blockedTrack.created_at,
          },
          // Stan UI
          uiState: "idle" as const,
        }));

      setState((prev) => ({
        ...prev,
        tracks: tracksWithDetails,
        isLoading: false,
        error: null,
      }));
    } catch (_err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: _err instanceof Error ? _err : new Error("Unknown error"),
      }));
      toast.error("Failed to load blocked tracks. Please try again.");
    }
  }, []);

  /** Odblokowywanie utworu */
  const unblockTrack = React.useCallback(async (trackId: string) => {
    try {
      // Optymistyczna aktualizacja UI
      setState((prev) => ({
        ...prev,
        tracks: prev.tracks.map((track) =>
          track.spotify_track_id === trackId ? { ...track, uiState: "deleting" } : track
        ),
        trackToUnblock: null, // Zamknij modal
      }));

      const response = await fetch(`/api/blocked-tracks/${trackId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to unblock track: ${response.status}`);
      }

      const result: SuccessMessageDTO = await response.json();

      // Usuń utwór z listy po pomyślnym odblokowaniu
      setState((prev) => ({
        ...prev,
        tracks: prev.tracks.filter((track) => track.spotify_track_id !== trackId),
      }));

      toast.success(result.message || "Track unblocked successfully!");
    } catch {
      // Rollback optymistycznej aktualizacji
      setState((prev) => ({
        ...prev,
        tracks: prev.tracks.map((track) =>
          track.spotify_track_id === trackId ? { ...track, uiState: "idle" } : track
        ),
      }));
      toast.error("Failed to unblock track. Please try again.");
    }
  }, []);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleUnblockClick = React.useCallback(
    (trackId: string) => {
      const track = state.tracks.find((t) => t.spotify_track_id === trackId);
      if (track) {
        setState((prev) => ({
          ...prev,
          trackToUnblock: track,
        }));
      }
    },
    [state.tracks]
  );

  const handleConfirmUnblock = React.useCallback(() => {
    if (state.trackToUnblock) {
      unblockTrack(state.trackToUnblock.spotify_track_id);
    }
  }, [state.trackToUnblock, unblockTrack]);

  const handleCloseModal = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      trackToUnblock: null,
    }));
  }, []);

  const handleTimerExpire = React.useCallback((trackId: string) => {
    // Usuń utwór z listy po wygaśnięciu timera
    setState((prev) => ({
      ...prev,
      tracks: prev.tracks.filter((track) => track.spotify_track_id !== trackId),
    }));
    toast.info("Track block has expired and was automatically removed.");
  }, []);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Ładowanie danych przy montowaniu komponentu
  React.useEffect(() => {
    loadBlockedTracks();
  }, [loadBlockedTracks]);

  // =============================================================================
  // RETURN HOOK DATA
  // =============================================================================

  return {
    state,
    handlers: {
      handleUnblockClick,
      handleConfirmUnblock,
      handleCloseModal,
      handleTimerExpire,
      loadBlockedTracks, // Do retry w przypadku błędu
    },
  };
}

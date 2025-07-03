import React from "react";
import { Button } from "../ui/button";
import { formatDuration } from "../../lib/utils/track.utils";
import type { SpotifyTrackSearchDTO, SearchTrackResponseDTO } from "../../types";

interface SpotifyTrackSearchProps {
  onTrackSelect: (track: SpotifyTrackSearchDTO) => void;
  isDisabled?: boolean;
  placeholder?: string;
}

const SpotifyTrackSearch: React.FC<SpotifyTrackSearchProps> = ({
  onTrackSelect,
  isDisabled = false,
  placeholder = "Search for tracks...",
}) => {
  const [query, setQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SpotifyTrackSearchDTO[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Debounced search
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const searchTracks = React.useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);

      const params = new URLSearchParams({
        q: searchQuery.trim(),
        limit: "10",
      });

      const response = await fetch(`/api/spotify/search?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Search failed");
      }

      const data: SearchTrackResponseDTO = await response.json();
      setSearchResults(data.tracks);
    } catch (error) {
      console.error("Search error:", error);
      setError(error instanceof Error ? error.message : "Search failed");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchTracks(newQuery);
    }, 500);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={isDisabled}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query.length > 0 && query.length < 3 && (
          <p className="text-sm text-gray-500 mt-1">Type at least 3 characters to search</p>
        )}
      </div>

      {/* Loading State */}
      {isSearching && (
        <div className="text-center py-4">
          <div className="animate-pulse text-gray-500">Searching...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <h3 className="font-medium text-gray-900">Search Results</h3>

          {searchResults.map((track) => (
            <div
              key={track.spotify_track_id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Track Art */}
              <div className="flex-shrink-0">
                {track.album.images.length > 0 ? (
                  <img
                    src={track.album.images[0].url}
                    alt={`${track.name} album art`}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Art</span>
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="flex-grow min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{track.name}</h4>
                <p className="text-sm text-gray-600 truncate">
                  {track.artists.map((artist) => artist.name).join(", ")}
                </p>
                <p className="text-xs text-gray-500">
                  {track.album.name} • {formatDuration(track.duration_ms)}
                </p>
              </div>

              {/* Add Button */}
              <div className="flex-shrink-0">
                <Button size="sm" onClick={() => onTrackSelect(track)} disabled={isDisabled}>
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {query.length >= 3 && !isSearching && searchResults.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          <p>No tracks found for &quot;{query}&quot;</p>
          <p className="text-sm">Try different search terms</p>
        </div>
      )}
    </div>
  );
};

export default SpotifyTrackSearch;

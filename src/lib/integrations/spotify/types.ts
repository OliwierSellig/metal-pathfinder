/**
 * Raw Spotify API response types
 * These types match the exact structure returned by Spotify Web API
 */

/**
 * Spotify API response structure for search endpoint
 */
export interface SpotifySearchResponse {
  tracks: {
    href: string;
    items: SpotifyTrackItem[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  };
}

/**
 * Individual track item from Spotify API
 */
export interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: SpotifyArtistItem[];
  album: SpotifyAlbumItem;
  duration_ms: number;
}

/**
 * Artist information from Spotify API
 */
export interface SpotifyArtistItem {
  id: string;
  name: string;
}

/**
 * Album information from Spotify API
 */
export interface SpotifyAlbumItem {
  id: string;
  name: string;
  release_date: string;
  images: SpotifyImageItem[];
}

/**
 * Image metadata from Spotify API
 */
export interface SpotifyImageItem {
  url: string;
  height: number;
  width: number;
}

/**
 * Spotify API token response from authentication endpoint
 */
export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Extended track item from Spotify API for track details endpoint
 * Includes additional fields not present in search results
 */
export interface SpotifyTrackDetailsItem {
  id: string;
  name: string;
  artists: SpotifyArtistDetailsItem[];
  album: SpotifyAlbumDetailsItem;
  duration_ms: number;
  explicit: boolean;
  popularity: number;
}

/**
 * Extended artist information from Spotify API with genres
 */
export interface SpotifyArtistDetailsItem {
  id: string;
  name: string;
  genres?: string[]; // Genres can be undefined for some artists
}

/**
 * Extended album information from Spotify API with total tracks
 */
export interface SpotifyAlbumDetailsItem {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  images: SpotifyImageItem[];
}

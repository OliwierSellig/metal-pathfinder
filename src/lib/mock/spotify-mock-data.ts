import type { TrackDetailsResponseDTO, SpotifyImageDTO, TrackSearchResult } from "../../types";

/**
 * Mock data for Spotify API responses
 * Contains realistic metal track data for development and testing
 */

// Common album artwork
const mockAlbumImages: SpotifyImageDTO[] = [
  { url: "https://i.scdn.co/image/ab67616d0000b273mock640x640", height: 640, width: 640 },
  { url: "https://i.scdn.co/image/ab67616d00001e02mock300x300", height: 300, width: 300 },
  { url: "https://i.scdn.co/image/ab67616d00004851mock64x64", height: 64, width: 64 },
];

// Mock track details data
export const MOCK_TRACK_DETAILS: Record<string, TrackDetailsResponseDTO> = {
  // Base track examples - these would typically come from user's library
  "4uLU6hMCjMI75M1A2tKUQC": {
    spotify_track_id: "4uLU6hMCjMI75M1A2tKUQC",
    name: "Master of Puppets",
    artists: [
      {
        name: "Metallica",
        spotify_artist_id: "2ye2Wgw4gimLv2eAKyk1NB",
        genres: ["metal", "thrash metal", "heavy metal"],
      },
    ],
    album: {
      name: "Master of Puppets",
      spotify_album_id: "1YielV60KYUz6V0nQb7CtZ",
      release_date: "1986-03-03",
      images: mockAlbumImages,
      total_tracks: 8,
    },
    duration_ms: 515333,
    preview_url: "https://p.scdn.co/mp3-preview/mock-master-of-puppets",
    explicit: false,
    popularity: 85,
  },

  "1t2qKa8K72IBC8yQlhD9bU": {
    spotify_track_id: "1t2qKa8K72IBC8yQlhD9bU",
    name: "Paranoid",
    artists: [
      {
        name: "Black Sabbath",
        spotify_artist_id: "5M52tdBnJaKSvOpJGz8mfZ",
        genres: ["metal", "heavy metal", "doom metal"],
      },
    ],
    album: {
      name: "Paranoid",
      spotify_album_id: "0OcmuOzJdBHdLYgCWCF3Bk",
      release_date: "1970-09-18",
      images: mockAlbumImages,
      total_tracks: 8,
    },
    duration_ms: 170333,
    preview_url: "https://p.scdn.co/mp3-preview/mock-paranoid",
    explicit: false,
    popularity: 82,
  },

  // Recommendation examples
  "5CQ30WqJwcep0pYcV4AMNc": {
    spotify_track_id: "5CQ30WqJwcep0pYcV4AMNc",
    name: "Stairway to Heaven",
    artists: [
      {
        name: "Led Zeppelin",
        spotify_artist_id: "36QJpDe2go2KgaRleHCDTp",
        genres: ["hard rock", "classic rock", "heavy metal"],
      },
    ],
    album: {
      name: "Led Zeppelin IV",
      spotify_album_id: "1Dm5Hn0LuqwWWYqBYdKJBk",
      release_date: "1971-11-08",
      images: mockAlbumImages,
      total_tracks: 8,
    },
    duration_ms: 482956,
    preview_url: "https://p.scdn.co/mp3-preview/mock-stairway",
    explicit: false,
    popularity: 88,
  },

  "3qU8bPg8ASE2LKYL3R3eeP": {
    spotify_track_id: "3qU8bPg8ASE2LKYL3R3eeP",
    name: "Iron Man",
    artists: [
      {
        name: "Black Sabbath",
        spotify_artist_id: "5M52tdBnJaKSvOpJGz8mfZ",
        genres: ["metal", "heavy metal", "doom metal"],
      },
    ],
    album: {
      name: "Paranoid",
      spotify_album_id: "0OcmuOzJdBHdLYgCWCF3Bk",
      release_date: "1970-09-18",
      images: mockAlbumImages,
      total_tracks: 8,
    },
    duration_ms: 354000,
    preview_url: "https://p.scdn.co/mp3-preview/mock-iron-man",
    explicit: false,
    popularity: 79,
  },

  "6QgjcU0zLnzq5OrUoSZ3OK": {
    spotify_track_id: "6QgjcU0zLnzq5OrUoSZ3OK",
    name: "Breaking the Law",
    artists: [
      {
        name: "Judas Priest",
        spotify_artist_id: "2eSfJWE3AGYCKRgEJHGSdq",
        genres: ["metal", "heavy metal", "speed metal"],
      },
    ],
    album: {
      name: "British Steel",
      spotify_album_id: "4TQ3bAv5hpvyXJTQN0xGqE",
      release_date: "1980-04-14",
      images: mockAlbumImages,
      total_tracks: 10,
    },
    duration_ms: 156000,
    preview_url: "https://p.scdn.co/mp3-preview/mock-breaking-law",
    explicit: false,
    popularity: 76,
  },

  "4EPOC5qaRYIkEi7gwcz6A3": {
    spotify_track_id: "4EPOC5qaRYIkEi7gwcz6A3",
    name: "Angel of Death",
    artists: [
      {
        name: "Slayer",
        spotify_artist_id: "1IQ2e1buppatiN1bxUVkrk",
        genres: ["thrash metal", "metal", "speed metal"],
      },
    ],
    album: {
      name: "Reign in Blood",
      spotify_album_id: "3OJ1Gfr9V7LHJMnXh6E8Kg",
      release_date: "1986-10-07",
      images: mockAlbumImages,
      total_tracks: 10,
    },
    duration_ms: 291000,
    preview_url: "https://p.scdn.co/mp3-preview/mock-angel-death",
    explicit: true,
    popularity: 74,
  },

  "1YZf1bLKIKwZdIVfDw3GCL": {
    spotify_track_id: "1YZf1bLKIKwZdIVfDw3GCL",
    name: "War Pigs",
    artists: [
      {
        name: "Black Sabbath",
        spotify_artist_id: "5M52tdBnJaKSvOpJGz8mfZ",
        genres: ["metal", "heavy metal", "doom metal"],
      },
    ],
    album: {
      name: "Paranoid",
      spotify_album_id: "0OcmuOzJdBHdLYgCWCF3Bk",
      release_date: "1970-09-18",
      images: mockAlbumImages,
      total_tracks: 8,
    },
    duration_ms: 467000,
    preview_url: "https://p.scdn.co/mp3-preview/mock-war-pigs",
    explicit: false,
    popularity: 78,
  },

  "7KjF5cPG2Sy0xpKhJ0OWPE": {
    spotify_track_id: "7KjF5cPG2Sy0xpKhJ0OWPE",
    name: "Crazy Train",
    artists: [
      {
        name: "Ozzy Osbourne",
        spotify_artist_id: "6ZLTlhejhndI4Rh53vYhrY",
        genres: ["metal", "heavy metal", "hard rock"],
      },
    ],
    album: {
      name: "Blizzard of Ozz",
      spotify_album_id: "2XboWEFEi4OZeFpLemKZVG",
      release_date: "1980-09-20",
      images: mockAlbumImages,
      total_tracks: 9,
    },
    duration_ms: 294000,
    preview_url: "https://p.scdn.co/mp3-preview/mock-crazy-train",
    explicit: false,
    popularity: 81,
  },

  "4FjS2A1IXOdTpJJ7eBYGWo": {
    spotify_track_id: "4FjS2A1IXOdTpJJ7eBYGWo",
    name: "Ace of Spades",
    artists: [
      {
        name: "Motörhead",
        spotify_artist_id: "1WTPKhUdEwkVdTdlKlFNW2",
        genres: ["metal", "speed metal", "hard rock"],
      },
    ],
    album: {
      name: "Ace of Spades",
      spotify_album_id: "3t2K8VG0TrOa0H3RsEr04h",
      release_date: "1980-11-08",
      images: mockAlbumImages,
      total_tracks: 12,
    },
    duration_ms: 169000,
    preview_url: "https://p.scdn.co/mp3-preview/mock-ace-spades",
    explicit: false,
    popularity: 77,
  },

  "5Kf5lEGpGUV8Dd5xgU9oTE": {
    spotify_track_id: "5Kf5lEGpGUV8Dd5xgU9oTE",
    name: "Cemetery Gates",
    artists: [
      {
        name: "Pantera",
        spotify_artist_id: "14pVkFUHDL207LzLHtSR4V",
        genres: ["groove metal", "thrash metal", "metal"],
      },
    ],
    album: {
      name: "Cowboys from Hell",
      spotify_album_id: "1iRz3u5Rq32k6Bx9FShzpF",
      release_date: "1990-07-24",
      images: mockAlbumImages,
      total_tracks: 12,
    },
    duration_ms: 307000,
    preview_url: "https://p.scdn.co/mp3-preview/mock-cemetery-gates",
    explicit: false,
    popularity: 73,
  },

  "2OB8VQOA8rRjNHXvg9gPWU": {
    spotify_track_id: "2OB8VQOA8rRjNHXvg9gPWU",
    name: "Holy Wars... The Punishment Due",
    artists: [
      {
        name: "Megadeth",
        spotify_artist_id: "1Yox196W1pAZz4hSJLdL9Z",
        genres: ["thrash metal", "metal", "speed metal"],
      },
    ],
    album: {
      name: "Rust in Peace",
      spotify_album_id: "2V0oOm9Vfke1xXPJF9qJXQ",
      release_date: "1990-09-24",
      images: mockAlbumImages,
      total_tracks: 9,
    },
    duration_ms: 392000,
    preview_url: "https://p.scdn.co/mp3-preview/mock-holy-wars",
    explicit: false,
    popularity: 72,
  },
};

// Mock search results mapping (AI recommendation -> Spotify track)
export const MOCK_SEARCH_RESULTS: Record<string, TrackSearchResult> = {
  "Stairway to Heaven|Led Zeppelin": {
    spotify_track_id: "5CQ30WqJwcep0pYcV4AMNc",
    song_title: "Stairway to Heaven",
    artist_name: "Led Zeppelin",
    found: true,
    actual_song_title: "Stairway to Heaven",
    actual_artist_name: "Led Zeppelin",
  },
  "Iron Man|Black Sabbath": {
    spotify_track_id: "3qU8bPg8ASE2LKYL3R3eeP",
    song_title: "Iron Man",
    artist_name: "Black Sabbath",
    found: true,
    actual_song_title: "Iron Man",
    actual_artist_name: "Black Sabbath",
  },
  "Breaking the Law|Judas Priest": {
    spotify_track_id: "6QgjcU0zLnzq5OrUoSZ3OK",
    song_title: "Breaking the Law",
    artist_name: "Judas Priest",
    found: true,
    actual_song_title: "Breaking the Law",
    actual_artist_name: "Judas Priest",
  },
  "Angel of Death|Slayer": {
    spotify_track_id: "4EPOC5qaRYIkEi7gwcz6A3",
    song_title: "Angel of Death",
    artist_name: "Slayer",
    found: true,
    actual_song_title: "Angel of Death",
    actual_artist_name: "Slayer",
  },
  "War Pigs|Black Sabbath": {
    spotify_track_id: "1YZf1bLKIKwZdIVfDw3GCL",
    song_title: "War Pigs",
    artist_name: "Black Sabbath",
    found: true,
    actual_song_title: "War Pigs",
    actual_artist_name: "Black Sabbath",
  },
  "Crazy Train|Ozzy Osbourne": {
    spotify_track_id: "7KjF5cPG2Sy0xpKhJ0OWPE",
    song_title: "Crazy Train",
    artist_name: "Ozzy Osbourne",
    found: true,
    actual_song_title: "Crazy Train",
    actual_artist_name: "Ozzy Osbourne",
  },
  "Ace of Spades|Motörhead": {
    spotify_track_id: "4FjS2A1IXOdTpJJ7eBYGWo",
    song_title: "Ace of Spades",
    artist_name: "Motörhead",
    found: true,
    actual_song_title: "Ace of Spades",
    actual_artist_name: "Motörhead",
  },
  "Cemetery Gates|Pantera": {
    spotify_track_id: "5Kf5lEGpGUV8Dd5xgU9oTE",
    song_title: "Cemetery Gates",
    artist_name: "Pantera",
    found: true,
    actual_song_title: "Cemetery Gates",
    actual_artist_name: "Pantera",
  },
  "Holy Wars... The Punishment Due|Megadeth": {
    spotify_track_id: "2OB8VQOA8rRjNHXvg9gPWU",
    song_title: "Holy Wars... The Punishment Due",
    artist_name: "Megadeth",
    found: true,
    actual_song_title: "Holy Wars... The Punishment Due",
    actual_artist_name: "Megadeth",
  },
  // Example of not found track
  "Some Unknown Song|Unknown Band": {
    spotify_track_id: null,
    song_title: "Some Unknown Song",
    artist_name: "Unknown Band",
    found: false,
  },
};

/**
 * Generate a fallback track ID for tracks not in our mock data
 */
export function generateMockTrackId(songTitle: string, artistName: string): string {
  const hash = songTitle.toLowerCase() + artistName.toLowerCase();
  return hash
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 22)
    .padEnd(22, "0");
}

/**
 * Generate fallback mock track details for unknown tracks
 */
export function generateFallbackTrackDetails(
  spotifyTrackId: string,
  songTitle: string,
  artistName: string
): TrackDetailsResponseDTO {
  return {
    spotify_track_id: spotifyTrackId,
    name: songTitle,
    artists: [
      {
        name: artistName,
        spotify_artist_id: `artist_${spotifyTrackId.substring(0, 18)}`,
        genres: ["metal", "heavy metal"],
      },
    ],
    album: {
      name: `${songTitle} Album`,
      spotify_album_id: `album_${spotifyTrackId.substring(0, 18)}`,
      release_date: "2023-01-01",
      images: mockAlbumImages,
      total_tracks: 10,
    },
    duration_ms: 240000, // 4 minutes default
    preview_url: `https://p.scdn.co/mp3-preview/mock-${spotifyTrackId}`,
    explicit: false,
    popularity: 50,
  };
}

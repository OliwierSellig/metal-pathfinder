import { http, HttpResponse } from "msw";

// Mock handlers for API endpoints
export const handlers = [
  // Auth API mocks
  http.post("/api/auth/login", () => {
    return HttpResponse.json({ success: true, user: { id: "1", email: "test@example.com" } });
  }),

  http.post("/api/auth/register", () => {
    return HttpResponse.json({ success: true, user: { id: "1", email: "test@example.com" } });
  }),

  http.post("/api/auth/logout", () => {
    return HttpResponse.json({ success: true });
  }),

  // Spotify API mocks
  http.get("/api/spotify/search", () => {
    return HttpResponse.json({
      tracks: {
        items: [
          {
            id: "test-track-id",
            name: "Test Track",
            artists: [{ name: "Test Artist" }],
            album: { name: "Test Album" },
          },
        ],
      },
    });
  }),

  // Library API mocks
  http.get("/api/library", () => {
    return HttpResponse.json([]);
  }),

  http.post("/api/library/:spotify_track_id", () => {
    return HttpResponse.json({ success: true });
  }),

  // Blocked tracks API mocks
  http.get("/api/blocked-tracks", () => {
    return HttpResponse.json([]);
  }),

  http.post("/api/blocked-tracks/:spotify_track_id", () => {
    return HttpResponse.json({ success: true });
  }),
];

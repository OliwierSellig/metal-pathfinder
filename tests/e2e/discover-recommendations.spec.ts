import { test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";
import { DiscoverPage } from "../page-objects";

// Extend Window interface for test user
declare global {
  interface Window {
    __TEST_USER__?: {
      id: string;
      email: string;
    };
  }
}

// Test authentication helper for UI-only tests (with mocked API)
async function setupTestAuthentication(page: Page) {
  // Set custom header to indicate test mode
  await page.setExtraHTTPHeaders({
    "x-test-mode": "true",
    "x-test-user-id": "ff5f16c8-d72b-4078-a946-4ab3cffba27e",
    "x-test-user-email": "oliwier@kryptonum.eu",
  });

  // Mock authenticated user session
  await page.addInitScript(() => {
    // Mock localStorage for authenticated state
    localStorage.setItem("test-authenticated", "true");

    // Mock user session that middleware will recognize
    window.__TEST_USER__ = {
      id: "ff5f16c8-d72b-4078-a946-4ab3cffba27e",
      email: "oliwier@kryptonum.eu",
    };
  });

  // Mock ALL API responses for UI testing (no real database calls)
  await page.route("**/api/library**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        tracks: [
          {
            spotify_track_id: "4iV5W9uYEdYUVa79Axb7Rh",
            added_at: "2024-01-01T00:00:00Z",
          },
          {
            spotify_track_id: "1fDsHaiUHL7w3wJwldy4SZ",
            added_at: "2024-01-01T00:00:00Z",
          },
        ],
      }),
    });
  });

  // Mock blocked tracks API
  await page.route("**/api/blocked-tracks**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  // Mock Spotify tracks API - handle both GET and POST
  await page.route("**/api/spotify/tracks", async (route: Route) => {
    if (route.request().method() === "POST") {
      // POST request from loadLibrary() hook - expects array of tracks
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            spotify_track_id: "4iV5W9uYEdYUVa79Axb7Rh",
            name: "Master of Puppets",
            artists: [{ name: "Metallica" }],
            album: {
              name: "Master of Puppets",
              images: [{ url: "https://example.com/image.jpg" }],
            },
            duration_ms: 515000,
          },
          {
            spotify_track_id: "1fDsHaiUHL7w3wJwldy4SZ",
            name: "Raining Blood",
            artists: [{ name: "Slayer" }],
            album: {
              name: "Reign in Blood",
              images: [{ url: "https://example.com/image2.jpg" }],
            },
            duration_ms: 257000,
          },
        ]),
      });
    } else {
      // GET request (if any) - same response format
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            spotify_track_id: "4iV5W9uYEdYUVa79Axb7Rh",
            name: "Master of Puppets",
            artists: [{ name: "Metallica" }],
            album: {
              name: "Master of Puppets",
              images: [{ url: "https://example.com/image.jpg" }],
            },
            duration_ms: 515000,
          },
          {
            spotify_track_id: "1fDsHaiUHL7w3wJwldy4SZ",
            name: "Raining Blood",
            artists: [{ name: "Slayer" }],
            album: {
              name: "Reign in Blood",
              images: [{ url: "https://example.com/image2.jpg" }],
            },
            duration_ms: 257000,
          },
        ]),
      });
    }
  });

  // Mock recommendations API with delay to simulate real API behavior
  await page.route("**/api/spotify/recommendations", async (route: Route) => {
    // Add 1 second delay to simulate API processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        recommendations: Array.from({ length: 10 }, (_, i) => ({
          spotify_track_id: `test-track-${i}`,
          name: `Test Track ${i + 1}`,
          artists: [{ name: `Test Artist ${i + 1}` }],
          album: {
            name: `Test Album ${i + 1}`,
            images: [{ url: "https://example.com/test-image.jpg" }],
          },
          duration_ms: 200000 + i * 10000,
          preview_url: `https://example.com/preview-${i}.mp3`,
          external_urls: { spotify: `https://open.spotify.com/track/test-track-${i}` },
          ai_reasoning: `This track was recommended because ${i + 1}...`,
          artist_bio: `Biography for Test Artist ${i + 1}`,
          popularity_score: 70 + i,
          recommendation_confidence: 0.9 - i * 0.05,
        })),
        base_track: {
          spotify_track_id: "4iV5W9uYEdYUVa79Axb7Rh",
          name: "Master of Puppets",
          artists: [{ name: "Metallica" }],
        },
        generation_metadata: {
          ai_model: "gpt-4",
          temperature_used: 0.5,
          description_processed: "Test description processed",
          excluded_tracks_count: 2,
          generation_time_ms: 1500,
        },
      }),
    });
  });
}

test.describe("Discover - UI and Recommendations (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setupTestAuthentication(page);
  });

  test("should generate recommendations based on user preferences", async ({ page }) => {
    const discoverPage = new DiscoverPage(page);

    // Navigate to discover page
    await discoverPage.navigate();
    await discoverPage.expectPageLoaded();

    // Wait for library to load (should not be in loading state due to mocks)
    await discoverPage.expectMainLayoutVisible();

    // Verify form is visible and ready
    await discoverPage.form.expectFormVisible();

    // Fill out the form
    const descriptionText =
      "I love the guitar solos in this track so much! I want something with similar energy and technical prowess.";

    await discoverPage.form.selectTrack(); // Should select first mocked track
    await discoverPage.form.fillDescription(descriptionText);

    // Check character counter
    await discoverPage.form.expectDescriptionCharacterCount(descriptionText.length);

    // Set temperature
    await discoverPage.form.setTemperature(0.5);

    // Submit form
    await discoverPage.form.expectGenerateButtonEnabled();
    await discoverPage.form.generateRecommendations();

    // Verify loading state (now should work with API delay)
    await discoverPage.form.expectFormInLoadingState();
    await discoverPage.recommendations.expectLoadingState();

    // Wait for and verify results
    await discoverPage.recommendations.waitForSuccessfulGeneration(10);
    await discoverPage.recommendations.expectRecommendationsCount(10);
    await discoverPage.recommendations.expectGenerationStats(10);
    await discoverPage.recommendations.expectGenerationConfig(0.5);

    // Verify form returns to idle state
    await discoverPage.form.expectFormInIdleState();
  });

  test("should show error when recommendation generation fails", async ({ page }) => {
    await setupTestAuthentication(page);

    // Override recommendations API to return error with delay
    await page.route("**/api/spotify/recommendations", async (route: Route) => {
      // Add delay even for errors to test loading state
      await new Promise((resolve) => setTimeout(resolve, 500));

      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Failed to generate recommendations" }),
      });
    });

    const discoverPage = new DiscoverPage(page);
    await discoverPage.navigate();
    await discoverPage.expectMainLayoutVisible();

    // Fill form and submit
    await discoverPage.form.selectTrack();
    await discoverPage.form.fillDescription("I want something heavy and aggressive with great guitar work.");
    await discoverPage.form.generateRecommendations();

    // Verify loading state during error scenario
    await discoverPage.form.expectFormInLoadingState();

    // Verify error state
    await discoverPage.recommendations.expectErrorState();
    await discoverPage.recommendations.expectRetryButtonVisible();

    // Test retry functionality by resetting the mock to success
    await page.route("**/api/spotify/recommendations", async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          recommendations: [],
          base_track: {
            spotify_track_id: "4iV5W9uYEdYUVa79Axb7Rh",
            name: "Master of Puppets",
            artists: [{ name: "Metallica" }],
          },
          generation_metadata: {
            ai_model: "gpt-4",
            temperature_used: 0.5,
            description_processed: "Test description",
            excluded_tracks_count: 0,
            generation_time_ms: 1000,
          },
        }),
      });
    });

    await discoverPage.recommendations.retryGeneration();
    await discoverPage.recommendations.expectEmptyState();
  });

  test("should validate form inputs correctly", async ({ page }) => {
    await setupTestAuthentication(page);

    const discoverPage = new DiscoverPage(page);
    await discoverPage.navigate();
    await discoverPage.expectMainLayoutVisible();

    // Test validation - initial state (no track selected, no description)
    // Button should be disabled initially
    await discoverPage.form.expectGenerateButtonDisabled();

    // Test validation - short description (still no track selected)
    await discoverPage.form.fillDescription("Short");
    await discoverPage.form.expectDescriptionError("Description must be at least 30 characters");
    // Button should still be disabled due to validation error and no track
    await discoverPage.form.expectGenerateButtonDisabled();

    // Test validation - valid description but no track selected
    const validDescription =
      "I love the guitar solos and heavy riffs in this song, something similar would be perfect for my playlist";
    await discoverPage.form.fillDescription(validDescription);
    // Button should still be disabled - no track selected
    await discoverPage.form.expectGenerateButtonDisabled();

    // Test validation - select track, now button should be enabled
    await discoverPage.form.selectTrack();
    // Now button should be enabled
    await discoverPage.form.expectGenerateButtonEnabled();
  });

  test("should handle temperature slider interactions", async ({ page }) => {
    await setupTestAuthentication(page);

    const discoverPage = new DiscoverPage(page);
    await discoverPage.navigate();
    await discoverPage.expectMainLayoutVisible();

    // Test different temperature settings
    await discoverPage.form.setTemperature(0.3);
    await discoverPage.form.setTemperature(0.5);
    await discoverPage.form.setTemperature(0.8);
  });

  test("should use complete workflow with POM", async ({ page }) => {
    await setupTestAuthentication(page);

    const discoverPage = new DiscoverPage(page);

    await discoverPage.navigate();
    await discoverPage.expectSuccessfulRecommendationFlow({
      description:
        "I want heavy metal tracks with complex guitar solos and powerful drums, something that showcases technical skill.",
      temperature: 0.6,
      expectedCount: 10,
    });
  });
});

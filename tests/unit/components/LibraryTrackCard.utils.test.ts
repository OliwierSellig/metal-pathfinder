import { describe, it, expect } from "vitest";
import { formatDuration, getAlbumCoverUrl } from "../../../src/lib/utils/library-track.utils";

// =============================================================================
// TESTS FOR formatDuration()
// =============================================================================

describe("formatDuration", () => {
  it("should format short tracks (< 1 min) correctly", () => {
    // Arrange
    const durationMs = 30000; // 30 seconds

    // Act
    const result = formatDuration(durationMs);

    // Assert
    expect(result).toBe("0:30");
  });

  it("should format standard tracks correctly", () => {
    // Arrange
    const durationMs = 240000; // 4 minutes

    // Act
    const result = formatDuration(durationMs);

    // Assert
    expect(result).toBe("4:00");
  });

  it("should format long tracks correctly", () => {
    // Arrange
    const durationMs = 600000; // 10 minutes

    // Act
    const result = formatDuration(durationMs);

    // Assert
    expect(result).toBe("10:00");
  });

  it("should pad seconds with leading zero when needed", () => {
    // Arrange
    const durationMs = 67000; // 1 minute 7 seconds

    // Act
    const result = formatDuration(durationMs);

    // Assert
    expect(result).toBe("1:07");
  });

  it("should handle zero duration", () => {
    // Arrange
    const durationMs = 0;

    // Act
    const result = formatDuration(durationMs);

    // Assert
    expect(result).toBe("0:00");
  });

  it("should handle durations with fractional seconds", () => {
    // Arrange
    const durationMs = 125500; // 2 minutes 5.5 seconds (should floor to 2:05)

    // Act
    const result = formatDuration(durationMs);

    // Assert
    expect(result).toBe("2:05");
  });

  it("should format very long tracks correctly", () => {
    // Arrange
    const durationMs = 3661000; // 61 minutes 1 second

    // Act
    const result = formatDuration(durationMs);

    // Assert
    expect(result).toBe("61:01");
  });

  it("should handle single-digit minutes without padding", () => {
    // Arrange
    const durationMs = 543000; // 9 minutes 3 seconds

    // Act
    const result = formatDuration(durationMs);

    // Assert
    expect(result).toBe("9:03");
  });

  it("should handle exact minute durations", () => {
    // Arrange
    const durationMs = 180000; // exactly 3 minutes

    // Act
    const result = formatDuration(durationMs);

    // Assert
    expect(result).toBe("3:00");
  });
});

// =============================================================================
// TESTS FOR getAlbumCoverUrl()
// =============================================================================

describe("getAlbumCoverUrl", () => {
  it("should return null for empty images array", () => {
    // Arrange
    const images: { url: string; height: number; width: number }[] = [];

    // Act
    const result = getAlbumCoverUrl(images);

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for null images", () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const images = null as any;

    // Act
    const result = getAlbumCoverUrl(images);

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for undefined images", () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const images = undefined as any;

    // Act
    const result = getAlbumCoverUrl(images);

    // Assert
    expect(result).toBeNull();
  });

  it("should prefer medium-sized images (200-400px)", () => {
    // Arrange
    const images = [
      { url: "small.jpg", height: 100, width: 100 },
      { url: "medium.jpg", height: 300, width: 300 }, // Should be selected
      { url: "large.jpg", height: 500, width: 500 },
    ];

    // Act
    const result = getAlbumCoverUrl(images);

    // Assert
    expect(result).toBe("medium.jpg");
  });

  it("should return first medium-sized image when multiple exist", () => {
    // Arrange
    const images = [
      { url: "small.jpg", height: 100, width: 100 },
      { url: "medium1.jpg", height: 250, width: 250 }, // Should be selected (first medium)
      { url: "medium2.jpg", height: 300, width: 300 },
      { url: "large.jpg", height: 500, width: 500 },
    ];

    // Act
    const result = getAlbumCoverUrl(images);

    // Assert
    expect(result).toBe("medium1.jpg");
  });

  it("should fallback to first image when no medium-sized images exist", () => {
    // Arrange
    const images = [
      { url: "small1.jpg", height: 100, width: 100 }, // Should be selected (first)
      { url: "small2.jpg", height: 150, width: 150 },
      { url: "large.jpg", height: 500, width: 500 },
    ];

    // Act
    const result = getAlbumCoverUrl(images);

    // Assert
    expect(result).toBe("small1.jpg");
  });

  it("should handle single image array", () => {
    // Arrange
    const images = [{ url: "only.jpg", height: 320, width: 320 }];

    // Act
    const result = getAlbumCoverUrl(images);

    // Assert
    expect(result).toBe("only.jpg");
  });

  it("should handle single small image", () => {
    // Arrange
    const images = [{ url: "tiny.jpg", height: 64, width: 64 }];

    // Act
    const result = getAlbumCoverUrl(images);

    // Assert
    expect(result).toBe("tiny.jpg");
  });

  it("should handle boundary cases for medium image detection", () => {
    // Test exact boundaries (200 and 400 pixels)
    const testCases = [
      {
        name: "exactly 200px height (should be medium)",
        images: [{ url: "boundary200.jpg", height: 200, width: 200 }],
        expected: "boundary200.jpg",
      },
      {
        name: "exactly 400px height (should be medium)",
        images: [{ url: "boundary400.jpg", height: 400, width: 400 }],
        expected: "boundary400.jpg",
      },
      {
        name: "199px height (should fallback to first)",
        images: [{ url: "just-under.jpg", height: 199, width: 199 }],
        expected: "just-under.jpg",
      },
      {
        name: "401px height (should fallback to first)",
        images: [{ url: "just-over.jpg", height: 401, width: 401 }],
        expected: "just-over.jpg",
      },
    ];

    testCases.forEach(({ images, expected }) => {
      // Act
      const result = getAlbumCoverUrl(images);

      // Assert
      expect(result).toBe(expected);
    });
  });

  it("should handle mixed size images and select appropriate medium one", () => {
    // Arrange
    const images = [
      { url: "tiny.jpg", height: 50, width: 50 },
      { url: "small.jpg", height: 150, width: 150 },
      { url: "perfect-medium.jpg", height: 300, width: 300 }, // Should be selected
      { url: "large.jpg", height: 600, width: 600 },
      { url: "huge.jpg", height: 1000, width: 1000 },
    ];

    // Act
    const result = getAlbumCoverUrl(images);

    // Assert
    expect(result).toBe("perfect-medium.jpg");
  });

  it("should handle array with undefined URL in first image", () => {
    // Arrange - first image is not medium-sized so it falls back to first image logic
    const images = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { url: undefined as any, height: 100, width: 100 }, // Small image, not medium
      { url: "backup.jpg", height: 250, width: 250 }, // Medium image, should be selected
    ];

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getAlbumCoverUrl(images as any);

    // Assert
    expect(result).toBe("backup.jpg");
  });

  it("should return null when first image has no URL and no medium images exist", () => {
    // Arrange
    const images = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { url: undefined as any, height: 100, width: 100 },
      { url: "", height: 150, width: 150 },
    ];

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getAlbumCoverUrl(images as any);

    // Assert
    expect(result).toBeNull();
  });
});

/**
 * Utility functions for LibraryTrackCard component
 */

/**
 * Formats duration from milliseconds to mm:ss format
 */
export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Gets the best album cover image URL
 */
export function getAlbumCoverUrl(images: { url: string; height: number; width: number }[]): string | null {
  if (!images || images.length === 0) return null;

  // Prefer medium-sized images (around 300px), fallback to largest available
  const mediumImage = images.find((img) => img.height >= 200 && img.height <= 400);
  if (mediumImage) return mediumImage.url;

  // Fallback to first image
  return images[0]?.url || null;
}

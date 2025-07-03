/**
 * Utility functions for track handling across the application
 */

/**
 * Formats duration from milliseconds to mm:ss format
 */
export const formatDuration = (durationMs: number): string => {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Gets the best album cover image URL
 */
export const getAlbumCoverUrl = (images: { url: string; height: number; width: number }[]): string | null => {
  if (!images || images.length === 0) return null;

  // Prefer medium-sized images (around 300px), fallback to largest available
  const mediumImage = images.find((img) => img.height >= 200 && img.height <= 400);
  if (mediumImage) return mediumImage.url;

  // Fallback to first image
  return images[0]?.url || null;
};

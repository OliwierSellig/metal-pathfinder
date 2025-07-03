import * as React from "react";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import RecommendationCard, { type RecommendationCardViewModel } from "./RecommendationCard";
import type { GenerationMetadataDTO, BlockDuration } from "../../types";

interface RecommendationsListProps {
  recommendations: RecommendationCardViewModel[];
  isLoading: boolean;
  error: Error | null;
  metadata: GenerationMetadataDTO | null;
  onAddToLibrary: (trackId: string) => void;
  onBlockTrack: (trackId: string, duration: BlockDuration) => void;
  onViewDetails: (track: RecommendationCardViewModel) => void;
  onClearError: () => void;
}

const RecommendationsList: React.FC<RecommendationsListProps> = ({
  recommendations,
  isLoading,
  error,
  metadata,
  onAddToLibrary,
  onBlockTrack,
  onViewDetails,
  onClearError,
}) => {
  // Loading State with Skeletons
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="recommendations-loading">
        <div className="text-center text-gray-500 mb-6">
          <p>Generating your personalized recommendations...</p>
        </div>

        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4" data-testid={`recommendation-skeleton-${i}`}>
            <div className="flex items-start gap-4">
              <Skeleton className="w-16 h-16 rounded" />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-16 w-full" />
              </div>
              <div className="flex-shrink-0 space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" data-testid="recommendations-error">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to generate recommendations</h3>
        <p className="text-red-600 mb-4" data-testid="error-message">
          {error.message}
        </p>
        <div className="text-sm text-red-600 mb-4">
          This might be due to:
          <ul className="list-disc list-inside mt-2">
            <li>Network connectivity issues</li>
            <li>Spotify API rate limits</li>
            <li>OpenAI API issues</li>
            <li>Invalid base track selection</li>
          </ul>
        </div>
        <Button
          onClick={onClearError}
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50"
          data-testid="retry-button"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Empty State (no recommendations generated yet)
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12" data-testid="recommendations-empty">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to discover new music?</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Use the form on the left to generate personalized metal recommendations based on a track from your library and
          your mood preferences.
        </p>
      </div>
    );
  }

  // Success State - Display Recommendations
  return (
    <div className="space-y-4" data-testid="recommendations-list">
      {/* Generation Metadata */}
      {metadata && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3" data-testid="generation-metadata">
          <div className="text-xs text-blue-800">
            <div className="flex justify-between items-center">
              <span data-testid="generation-stats">
                Generated {recommendations.length} recommendations in {metadata.generation_time_ms}ms
              </span>
              <span className="text-blue-600" data-testid="generation-config">
                Using {metadata.ai_model} • Temperature: {metadata.temperature_used}
              </span>
            </div>
            {metadata.excluded_tracks_count > 0 && (
              <div className="mt-1 text-blue-700" data-testid="excluded-tracks-info">
                {metadata.excluded_tracks_count} tracks were excluded (already in library or blocked)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((track, index) => (
          <div key={track.spotify_track_id} className="relative" data-testid={`recommendation-item-${index}`}>
            {/* Recommendation Number Badge */}
            <div className="absolute -left-2 -top-2 z-10">
              <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {index + 1}
              </div>
            </div>

            <RecommendationCard
              track={track}
              onAddToLibrary={onAddToLibrary}
              onBlockTrack={onBlockTrack}
              onViewDetails={onViewDetails}
              index={index}
            />
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Recommendations are personalized using AI and based on your preferences. Results may vary based on
          Spotify&apos;s catalog and availability.
        </p>
      </div>
    </div>
  );
};

export default RecommendationsList;

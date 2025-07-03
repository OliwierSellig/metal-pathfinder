/* eslint-disable react/prop-types */
import React from "react";
import { formatDuration } from "../../../lib/utils/track.utils";
import type { RecommendationCardViewModel } from "../RecommendationCard";

interface TrackMetadataProps {
  track: RecommendationCardViewModel;
}

const TrackMetadata = React.memo<TrackMetadataProps>(({ track }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm text-gray-600">
    <div>
      <span className="font-medium">Duration:</span> {formatDuration(track.duration_ms)}
    </div>
    <div>
      <span className="font-medium">Popularity:</span> {track.popularity_score}/100
    </div>
    <div>
      <span className="font-medium">AI Confidence:</span> {(track.recommendation_confidence * 100).toFixed(1)}%
    </div>
    <div>
      <span className="font-medium">Release Date:</span> {track.album.release_date}
    </div>
  </div>
));

TrackMetadata.displayName = "TrackMetadata";

export default TrackMetadata;

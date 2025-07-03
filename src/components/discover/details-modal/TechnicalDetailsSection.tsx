/* eslint-disable react/prop-types */
import React from "react";
import { ChevronRightIcon } from "../../icons/ChevronRightIcon";
import type { RecommendationCardViewModel } from "../RecommendationCard";

interface TechnicalDetailsSectionProps {
  track: RecommendationCardViewModel;
}

const TechnicalDetailsSection = React.memo<TechnicalDetailsSectionProps>(({ track }) => (
  <div className="border-t border-gray-200 pt-4">
    <details className="group">
      <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center">
        <ChevronRightIcon className="w-4 h-4 mr-2 transform group-open:rotate-90 transition-transform" />
        Technical Details
      </summary>
      <div className="mt-3 ml-6 text-sm text-gray-600 space-y-1">
        <div>
          <span className="font-medium">Spotify Track ID:</span> {track.spotify_track_id}
        </div>
        <div>
          <span className="font-medium">Genre:</span> Metal
        </div>
        <div>
          <span className="font-medium">Album Type:</span> Album
        </div>
        <div>
          <span className="font-medium">Available Markets:</span> Global
        </div>
      </div>
    </details>
  </div>
));

TechnicalDetailsSection.displayName = "TechnicalDetailsSection";

export default TechnicalDetailsSection;

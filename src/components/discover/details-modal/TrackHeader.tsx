/* eslint-disable react/prop-types */
import React from "react";
import AlbumArt from "./AlbumArt";
import TrackMetadata from "./TrackMetadata";
import type { RecommendationCardViewModel } from "../RecommendationCard";

interface TrackHeaderProps {
  track: RecommendationCardViewModel;
}

const TrackHeader = React.memo<TrackHeaderProps>(({ track }) => (
  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
    <AlbumArt track={track} />

    <div className="flex-grow min-w-0 text-center sm:text-left">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 break-words">{track.name}</h2>
      <p className="text-base md:text-lg text-gray-700 mb-1 break-words">
        by {track.artists.map((artist) => artist.name).join(", ")}
      </p>
      <p className="text-sm md:text-md text-gray-600 mb-3 break-words">
        from <span className="font-medium">{track.album.name}</span>
      </p>

      <TrackMetadata track={track} />
    </div>
  </div>
));

TrackHeader.displayName = "TrackHeader";

export default TrackHeader;

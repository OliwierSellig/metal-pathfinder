/* eslint-disable react/prop-types */
import React from "react";
import type { RecommendationCardViewModel } from "../RecommendationCard";

interface AlbumArtProps {
  track: RecommendationCardViewModel;
}

const AlbumArt = React.memo<AlbumArtProps>(({ track }) => (
  <div className="flex-shrink-0 mx-auto sm:mx-0">
    {track.album.images.length > 0 ? (
      <img
        src={track.album.images[0].url}
        alt={`${track.name} album art`}
        className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover shadow-lg"
      />
    ) : (
      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-lg flex items-center justify-center shadow-lg">
        <span className="text-gray-400 text-sm">No Artwork</span>
      </div>
    )}
  </div>
));

AlbumArt.displayName = "AlbumArt";

export default AlbumArt;

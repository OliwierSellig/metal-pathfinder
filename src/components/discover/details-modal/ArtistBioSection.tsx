/* eslint-disable react/prop-types */
import React from "react";
import { UserIcon } from "../../icons/UserIcon";

interface ArtistBioSectionProps {
  bio: string;
}

const ArtistBioSection = React.memo<ArtistBioSectionProps>(({ bio }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
      <UserIcon className="w-5 h-5 mr-2" />
      About the Artist
    </h3>
    <div className="text-gray-700 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto pr-2">{bio}</div>
  </div>
));

ArtistBioSection.displayName = "ArtistBioSection";

export default ArtistBioSection;

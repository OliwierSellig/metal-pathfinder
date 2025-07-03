/* eslint-disable react/prop-types */
import React from "react";
import { LightbulbIcon } from "../../icons/LightbulbIcon";

interface AIReasoningSectionProps {
  reasoning: string;
}

const AIReasoningSection = React.memo<AIReasoningSectionProps>(({ reasoning }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
      <LightbulbIcon className="w-5 h-5 mr-2" />
      Why This Was Recommended
    </h3>
    <div className="text-blue-800 leading-relaxed">{reasoning}</div>
  </div>
));

AIReasoningSection.displayName = "AIReasoningSection";

export default AIReasoningSection;

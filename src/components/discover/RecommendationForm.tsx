import React from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import TrackSelector from "./TrackSelector.tsx";
import TemperatureSlider from "./TemperatureSlider.tsx";
import type { LibraryTrackWithDetailsDTO, AIRecommendationsCommand } from "../../types";

interface RecommendationFormProps {
  libraryTracks: LibraryTrackWithDetailsDTO[];
  isLoading: boolean;
  onSubmit: (command: AIRecommendationsCommand) => void;
}

const RecommendationForm: React.FC<RecommendationFormProps> = ({ libraryTracks, isLoading, onSubmit }) => {
  const [formData, setFormData] = React.useState({
    base_track_id: "",
    description: "",
    temperature: 0.5,
  });

  const [validationErrors, setValidationErrors] = React.useState<{
    base_track_id?: string;
    description?: string;
  }>({});

  // Validate form data
  const validateForm = React.useCallback(() => {
    const errors: typeof validationErrors = {};

    if (!formData.base_track_id) {
      errors.base_track_id = "Please select a base track";
    }

    if (!formData.description.trim()) {
      errors.description = "Please describe your preferences";
    } else if (formData.description.trim().length < 30) {
      errors.description = `Description must be at least 30 characters (${formData.description.trim().length}/30)`;
    } else if (formData.description.trim().length > 500) {
      errors.description = `Description must be no more than 500 characters (${formData.description.trim().length}/500)`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Validate on form data change
  React.useEffect(() => {
    validateForm();
  }, [validateForm]);

  const isFormValid = React.useMemo(() => {
    return (
      formData.base_track_id.length > 0 &&
      formData.description.trim().length >= 30 &&
      formData.description.trim().length <= 500 &&
      Object.keys(validationErrors).length === 0
    );
  }, [formData, validationErrors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isLoading) {
      return;
    }

    const command: AIRecommendationsCommand = {
      base_track_id: formData.base_track_id,
      description: formData.description.trim(),
      temperature: formData.temperature,
      count: 10, // Default count
    };

    onSubmit(command);
  };

  const handleTrackSelect = (trackId: string) => {
    setFormData((prev) => ({ ...prev, base_track_id: trackId }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, description: e.target.value }));
  };

  const handleTemperatureChange = (value: number) => {
    setFormData((prev) => ({ ...prev, temperature: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6" data-testid="recommendation-form-container">
      <h2 className="text-xl font-semibold mb-4">Generate Recommendations</h2>

      <form onSubmit={handleSubmit} className="space-y-4" data-testid="recommendation-form">
        {/* Track Selector */}
        <div>
          <TrackSelector
            tracks={libraryTracks}
            onSelect={handleTrackSelect}
            disabled={isLoading}
            selectedTrackId={formData.base_track_id}
          />
          {validationErrors.base_track_id && (
            <p className="text-red-500 text-sm mt-1" data-testid="track-selector-error">
              {validationErrors.base_track_id}
            </p>
          )}
        </div>

        {/* Description Textarea */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Describe your preferences
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder="Tell us what kind of metal you're in the mood for... (e.g., 'I want something heavy and aggressive with blast beats and growling vocals, similar to death metal but maybe with some progressive elements')"
            disabled={isLoading}
            rows={4}
            className="resize-none"
            data-testid="description-textarea"
          />
          <div className="flex justify-between items-center mt-1">
            <div className="text-xs text-gray-500" data-testid="description-character-counter">
              {formData.description.trim().length}/500 characters
              {formData.description.trim().length < 30 && (
                <span className="text-amber-600 ml-1">(minimum 30 characters)</span>
              )}
            </div>
            {validationErrors.description && (
              <p className="text-red-500 text-xs" data-testid="description-error">
                {validationErrors.description}
              </p>
            )}
          </div>
        </div>

        {/* Temperature Slider */}
        <div>
          <TemperatureSlider
            value={formData.temperature}
            onValueChange={handleTemperatureChange}
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full"
          data-testid="generate-recommendations-button"
        >
          {isLoading ? "Generating..." : "Generate Recommendations"}
        </Button>
      </form>
    </div>
  );
};

export default RecommendationForm;

import React from "react";
import { Slider } from "../ui/slider";

interface TemperatureSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  disabled: boolean;
}

const TemperatureSlider: React.FC<TemperatureSliderProps> = ({ value, onValueChange, disabled }) => {
  const handleValueChange = (values: number[]) => {
    // Slider returns array, we take the first value
    onValueChange(values[0]);
  };

  const getTemperatureLabel = (temp: number): string => {
    if (temp <= 0.3) return "Popular";
    if (temp <= 0.7) return "Balanced";
    return "Niche";
  };

  const getTemperatureDescription = (temp: number): string => {
    if (temp <= 0.3) return "Mainstream and well-known tracks";
    if (temp <= 0.7) return "Mix of popular and underground tracks";
    return "Obscure and underground tracks";
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Temperature: {getTemperatureLabel(value)} ({value.toFixed(1)})
      </label>

      <div className="px-3">
        <Slider
          value={[value]}
          onValueChange={handleValueChange}
          min={0.1}
          max={1.0}
          step={0.1}
          disabled={disabled}
          className="w-full"
        />

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Popular</span>
          <span>Niche</span>
        </div>
      </div>

      <p className="text-xs text-gray-600 mt-2">{getTemperatureDescription(value)}</p>
    </div>
  );
};

export default TemperatureSlider;

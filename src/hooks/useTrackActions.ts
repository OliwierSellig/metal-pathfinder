import { useMemo } from "react";
import type { RecommendationCardViewModel } from "../components/discover/RecommendationCard";

interface ActionButtonState {
  disabled: boolean;
  text: string;
}

interface TrackActions {
  addButton: ActionButtonState;
  blockButton: ActionButtonState;
}

type Variant = "card" | "modal";

export const useTrackActions = (track: RecommendationCardViewModel, variant: Variant = "modal"): TrackActions => {
  return useMemo(() => {
    const getActionButtonState = (action: "add" | "block"): ActionButtonState => {
      if (action === "add") {
        switch (track.uiState) {
          case "adding":
            return { disabled: true, text: "Adding..." };
          case "added":
            return { disabled: true, text: "Added" };
          case "blocking":
          case "blocked":
            return {
              disabled: true,
              text: variant === "card" ? "Add" : "Add to Library",
            };
          default:
            return {
              disabled: false,
              text: variant === "card" ? "Add" : "Add to Library",
            };
        }
      } else {
        switch (track.uiState) {
          case "blocking":
            return { disabled: true, text: "Blocking..." };
          case "blocked":
            return { disabled: true, text: "Blocked" };
          case "adding":
          case "added":
            return {
              disabled: true,
              text: variant === "card" ? "Block" : "Block Track (7 days)",
            };
          default:
            return {
              disabled: false,
              text: variant === "card" ? "Block" : "Block Track (7 days)",
            };
        }
      }
    };

    return {
      addButton: getActionButtonState("add"),
      blockButton: getActionButtonState("block"),
    };
  }, [track.uiState, variant]);
};

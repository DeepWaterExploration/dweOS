import type React from "react";
import { createContext, useContext } from "react";

export interface TourStep {
  id?: string;
  selectorId?: string;
  nextStepId?: string;
  prevStepId?: string;
  content: React.ReactNode;
  route?: string;
  width?: number;
  height?: number;
  position?: "top" | "bottom" | "left" | "right";
  highlightPadding?: number;
  popoverWidth?: number;
  disableNext?: boolean;
  disablePrev?: boolean;
  hideNext?: boolean;
  hidePrev?: boolean;
  advanceOnClick?: boolean | string[] | string;
  retreatOnClick?: boolean | string[] | string;
  disableScroll?: boolean;
  disableInteraction?: boolean;
}

export interface TourSegment {
  startStepId: string;
  steps: Record<string, TourStep>;
}

export interface TourContextType {
  steps: Record<string, TourStep>;
  setSteps: (steps: Record<string, TourStep>) => void;
  currentStepId: string | null;
  isActive: boolean;
  isTourCompleted: boolean;

  startTour: (isPageOnly?: boolean) => void;
  completeTour: () => void;
  cancelTour: () => void;
  resetTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStepById: (id: string) => void;
}

export const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}

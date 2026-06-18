import type React from "react";
import { useCallback, useMemo, useState } from "react";

import { TourContext, TourStep } from "@/components/tour/tour-context";
import TourOverlay from "@/components/tour/tour-overlay";
import { TOUR_STEPS } from "@/components/tour/tour-steps";
import { useLocation } from "react-router-dom";

interface TourProviderProps {
  children: React.ReactNode;
  onComplete?: () => void;
  className?: string;
  isTourCompleted?: boolean;
  storageKey?: string;
}

export function TourProvider({
  children,
  isTourCompleted = false,
  storageKey = "tourCompleted",
}: TourProviderProps) {
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [activeSegmentPath, setActiveSegmentPath] = useState<string | null>(
    null,
  );
  const [isCompleted, setIsCompleted] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === "true";
      }
    }
    return isTourCompleted;
  });

  const location = useLocation();

  const steps = useMemo(() => {
    const flatPool: Record<string, TourStep> = {};
    Object.values(TOUR_STEPS).forEach((segment) => {
      Object.assign(flatPool, segment.steps);
    });
    return flatPool;
  }, []);

  const saveTourState = useCallback(
    (completed: boolean) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, String(completed));
      }
    },
    [storageKey],
  );

  // ACTIONS
  const startTour = useCallback(
    (isPageOnly: boolean = false) => {
      setIsCompleted(false);
      saveTourState(false);

      const activeSegment = TOUR_STEPS[location.pathname];
      if (activeSegment) {
        setActiveSegmentPath(isPageOnly ? location.pathname : null);
        setCurrentStepId(activeSegment.startStepId);
      } else {
        setActiveSegmentPath(null);
      }
    },
    [saveTourState, location.pathname],
  );

  const completeTour = useCallback(() => {
    setIsCompleted(true);
    saveTourState(true);
    setCurrentStepId(null);
  }, [saveTourState]);

  const resetTour = useCallback(() => {
    setIsCompleted(false);
    saveTourState(false);
    setCurrentStepId(null);
    window.location.href = "/";
  }, [saveTourState]);

  const cancelTour = useCallback(() => {
    setCurrentStepId(null);
  }, []);

  const nextStep = useCallback(() => {
    if (!currentStepId || !steps[currentStepId]) return;

    const step = steps[currentStepId];

    if (step.nextStepId && steps[step.nextStepId]) {
      if (activeSegmentPath && TOUR_STEPS[activeSegmentPath]) {
        const isNextStepInSegment =
          !!TOUR_STEPS[activeSegmentPath].steps[step.nextStepId];
        if (!isNextStepInSegment) {
          completeTour();
          return;
        }
      }
      setCurrentStepId(step.nextStepId);
    } else {
      completeTour();
    }
  }, [steps, currentStepId, completeTour, activeSegmentPath]);

  const prevStep = useCallback(() => {
    if (!currentStepId || !steps[currentStepId]) return;

    const step = steps[currentStepId];

    if (step.prevStepId && steps[step.prevStepId]) {
      if (activeSegmentPath && TOUR_STEPS[activeSegmentPath]) {
        const isPrevStepInSegment =
          !!TOUR_STEPS[activeSegmentPath].steps[step.prevStepId];

        if (!isPrevStepInSegment) {
          return;
        }
      }
      setCurrentStepId(step.prevStepId);
    }
  }, [steps, currentStepId, activeSegmentPath]);

  const goToStepById = useCallback(
    (id: string) => {
      if (steps[id]) {
        setCurrentStepId(id);
      } else {
        console.warn(`Attempted to go to non-existent step: ${id}`);
      }
    },
    [steps],
  );

  const isFirstStep = useMemo(() => {
    if (!currentStepId || !steps[currentStepId]) return true;
    const step = steps[currentStepId];

    // step has no prev
    if (!step.prevStepId || !steps[step.prevStepId]) return true;

    // check prev step stays on page
    if (activeSegmentPath && TOUR_STEPS[activeSegmentPath]) {
      const isPrevStepInSegment =
        !!TOUR_STEPS[activeSegmentPath].steps[step.prevStepId];
      if (!isPrevStepInSegment) return true;
    }

    return false;
  }, [currentStepId, steps, activeSegmentPath]);

  const isLastStep = useMemo(() => {
    if (!currentStepId || !steps[currentStepId]) return true;
    const step = steps[currentStepId];

    // step has no next
    if (!step.nextStepId || !steps[step.nextStepId]) return true;

    // check next stays on page
    if (activeSegmentPath && TOUR_STEPS[activeSegmentPath]) {
      const isNextStepInSegment =
        !!TOUR_STEPS[activeSegmentPath].steps[step.nextStepId];
      if (!isNextStepInSegment) return true;
    }

    return false;
  }, [currentStepId, steps, activeSegmentPath]);

  const contextValue = useMemo(
    () => ({
      steps,
      currentStepId,
      activeSegmentPath,
      isActive: currentStepId !== null,
      isTourCompleted: isCompleted,
      isFirstStep,
      isLastStep,
      startTour,
      completeTour,
      resetTour,
      cancelTour,
      nextStep,
      prevStep,
      goToStepById,
    }),
    [
      steps,
      currentStepId,
      activeSegmentPath,
      isCompleted,
      isFirstStep,
      isLastStep,
      startTour,
      completeTour,
      resetTour,
      cancelTour,
      nextStep,
      prevStep,
      goToStepById,
    ],
  );

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      <TourOverlay />
    </TourContext.Provider>
  );
}

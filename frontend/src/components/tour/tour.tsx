import {
  animate,
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
} from "motion/react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AnimatedWaves } from "@/assets/animated-waves";
import { TourContext, TourStep, useTour } from "@/components/tour/tour-context";
import { useTourSteps } from "@/components/tour/tour-lib/tour-steps";
import { X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Separator } from "../ui/separator";

interface TourProviderProps {
  children: React.ReactNode;
  onComplete?: () => void;
  className?: string;
  isTourCompleted?: boolean;
  storageKey?: string;
}

const PADDING = 16;
const CONTENT_WIDTH = 300;
const CONTENT_HEIGHT = 200;

function getElementPosition(id: string, highlightPadding: number = 0) {
  const element = document.querySelector<HTMLElement>(`[data-tour-id="${id}"]`);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY - highlightPadding,
    left: rect.left + window.scrollX - highlightPadding,
    width: rect.width + highlightPadding * 2,
    height: rect.height + highlightPadding * 2,
  };
}

function calculateContentPosition(
  elementPos: { top: number; left: number; width: number; height: number },
  position: "top" | "bottom" | "left" | "right" = "bottom",
  popoverWidth: number = CONTENT_WIDTH,
  popoverHeight: number = CONTENT_HEIGHT,
) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = elementPos.left;
  let top = elementPos.top;

  switch (position) {
    case "top":
      top = elementPos.top - popoverHeight - PADDING;
      left = elementPos.left + elementPos.width / 2 - popoverWidth / 2;
      break;
    case "bottom":
      top = elementPos.top + elementPos.height + PADDING;
      left = elementPos.left + elementPos.width / 2 - popoverWidth / 2;
      break;
    case "left":
      left = elementPos.left - popoverWidth - PADDING;
      top = elementPos.top + elementPos.height / 2 - popoverHeight / 2;
      break;
    case "right":
      left = elementPos.left + elementPos.width + PADDING;
      top = elementPos.top + elementPos.height / 2 - popoverHeight / 2;
      break;
  }

  return {
    top: Math.max(
      PADDING,
      Math.min(top, viewportHeight - popoverHeight - PADDING),
    ),
    left: Math.max(
      PADDING,
      Math.min(left, viewportWidth - popoverWidth - PADDING),
    ),
    width: popoverWidth,
    height: popoverHeight,
  };
}

export function TourProvider({
  children,
  className,
  isTourCompleted = false,
  storageKey = "tourCompleted",
}: TourProviderProps) {
  const [steps, setSteps] = useState<Record<string, TourStep>>({});
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [activeSegmentPath, setActiveSegmentPath] = useState<string | null>(
    null,
  );
  const [elementPosition, setElementPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dynamicSegments = useTourSteps();

  const allFlattenedSteps = useMemo(() => {
    const flatPool: Record<string, TourStep> = {};
    Object.values(dynamicSegments).forEach((segment) => {
      Object.assign(flatPool, segment.steps);
    });
    return flatPool;
  }, [dynamicSegments]);

  useEffect(() => {
    setSteps(allFlattenedSteps);
  }, [allFlattenedSteps]);

  const stepsRef = useRef(steps);
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const [isCompleted, setIsCompleted] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === "true";
      }
    }
    return isTourCompleted;
  });

  const observerRef = useRef<{
    disconnect: () => void;
  } | null>(null);
  const prevStepRef = useRef<string | null>(currentStepId);
  const directionRef = useRef<"forward" | "backward">("forward");

  // for the highlight box
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const w = useMotionValue(0);
  const h = useMotionValue(0);

  // for the content popover
  const popoverX = useMotionValue(0);
  const popoverY = useMotionValue(0);

  const transitionConfig = useMemo(
    () =>
      ({
        type: "spring",
        mass: 0.2,
        stiffness: 100,
        damping: 15,
      }) as const,
    [],
  );

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

      const activeSegment = dynamicSegments[location.pathname];
      if (activeSegment) {
        setActiveSegmentPath(isPageOnly ? location.pathname : null);
        setCurrentStepId(activeSegment.startStepId);
      } else {
        setActiveSegmentPath(null);
      }
    },
    [saveTourState, dynamicSegments, location.pathname],
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
    if (!currentStepId || !stepsRef.current[currentStepId]) return;

    directionRef.current = "forward";
    const step = stepsRef.current[currentStepId];

    if (step.nextStepId && stepsRef.current[step.nextStepId]) {
      if (activeSegmentPath && dynamicSegments[activeSegmentPath]) {
        const isNextStepInSegment =
          !!dynamicSegments[activeSegmentPath].steps[step.nextStepId];
        if (!isNextStepInSegment) {
          completeTour();
          return;
        }
      }
      setCurrentStepId(step.nextStepId);
    } else {
      completeTour();
    }
  }, [currentStepId, completeTour, dynamicSegments, activeSegmentPath]);

  const prevStep = useCallback(() => {
    if (!currentStepId || !stepsRef.current[currentStepId]) return;

    directionRef.current = "backward";
    const step = stepsRef.current[currentStepId];

    if (step.prevStepId && stepsRef.current[step.prevStepId]) {
      setCurrentStepId(step.prevStepId);
    }
  }, [currentStepId]);

  const goToStepById = useCallback((id: string) => {
    if (stepsRef.current[id]) {
      setCurrentStepId(id);
    } else {
      console.warn(`Attempted to go to non-existent step: ${id}`);
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (!currentStepId || !steps[currentStepId]) return;
    const step = steps[currentStepId];
    const targetId = step.selectorId || currentStepId;
    const pos = getElementPosition(targetId, step.highlightPadding ?? 0);

    if (pos) {
      setIsLocating(false);
      setElementPosition((prev) => {
        if (
          prev &&
          Math.abs(prev.top - pos.top) < 1 &&
          Math.abs(prev.left - pos.left) < 1 &&
          Math.abs(prev.width - pos.width) < 1 &&
          Math.abs(prev.height - pos.height) < 1
        ) {
          return prev;
        }
        return pos;
      });
    } else {
      setIsLocating(true);
      console.warn(
        `Tour element [data-tour-id="${targetId}"] removed from DOM. Auto-skipping backward.`,
      );
      if (step.prevStepId) {
        prevStep();
      } else {
        cancelTour();
      }
    }
  }, [currentStepId, steps, cancelTour, prevStep]);

  // Sync MotionValues
  useEffect(() => {
    if (
      (elementPosition || isLocating) &&
      currentStepId &&
      steps[currentStepId]
    ) {
      const step = steps[currentStepId];
      const isStarting = prevStepRef.current === null;

      const popoverEl = document.getElementById("tour-popover");
      const actualHeight = popoverEl ? popoverEl.offsetHeight : CONTENT_HEIGHT;

      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      let targetW = 0;
      let targetH = 0;

      let contentLeft =
        window.innerWidth / 2 - (step.popoverWidth || CONTENT_WIDTH) / 2;
      let contentTop = window.innerHeight / 2 - actualHeight / 2;

      if (!isLocating && elementPosition) {
        targetW = step.width || elementPosition.width;
        targetH = step.height || elementPosition.height;
        targetX = elementPosition.left;
        targetY = elementPosition.top;

        const contentPos = calculateContentPosition(
          { ...elementPosition, width: targetW, height: targetH },
          step.position,
          step.popoverWidth,
          actualHeight,
        );
        contentLeft = contentPos.left;
        contentTop = contentPos.top;
      }

      if (isStarting) {
        x.set(targetX);
        y.set(targetY);
        w.set(targetW);
        h.set(targetH);
        popoverX.set(contentLeft);
        popoverY.set(contentTop);
      } else {
        animate(x, targetX, transitionConfig);
        animate(y, targetY, transitionConfig);
        animate(w, targetW, transitionConfig);
        animate(h, targetH, transitionConfig);
        animate(popoverX, contentLeft, transitionConfig);
        animate(popoverY, contentTop, transitionConfig);
      }
      prevStepRef.current = currentStepId;
    }
  }, [
    elementPosition,
    currentStepId,
    steps,
    isLocating,
    h,
    w,
    x,
    y,
    popoverX,
    popoverY,
    transitionConfig,
  ]);

  const clipPath = useMotionTemplate`polygon(
    0% 0%, 0% 100%, 100% 100%, 100% 0%,
    ${x}px 0%, ${x}px ${y}px, calc(${x}px + ${w}px) ${y}px,
    calc(${x}px + ${w}px) calc(${y}px + ${h}px), ${x}px calc(${y}px + ${h}px), ${x}px 0%
  )`;

  useEffect(() => {
    if (currentStepId && steps[currentStepId]) {
      const step = steps[currentStepId];
      const targetId = step.selectorId || currentStepId;

      if (step.route && location.pathname !== step.route) {
        navigate(step.route);
        return;
      }

      const instantElement = document.querySelector<HTMLElement>(
        `[data-tour-id="${targetId}"]`,
      );
      setIsLocating(!instantElement);

      const attachObserver = () => {
        const element = document.querySelector<HTMLElement>(
          `[data-tour-id="${targetId}"]`,
        );
        if (observerRef.current) observerRef.current.disconnect();

        if (element) {
          setIsLocating(false);
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          updatePosition();

          const handleShift = () =>
            window.requestAnimationFrame(updatePosition);
          const resizeObs = new ResizeObserver(handleShift);
          const mutationObs = new MutationObserver(handleShift);

          resizeObs.observe(element);
          resizeObs.observe(document.body);
          mutationObs.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "style"],
          });

          observerRef.current = {
            disconnect: () => {
              resizeObs.disconnect();
              mutationObs.disconnect();
            },
          };
        } else {
          // auto-skip missing elements
          console.warn(
            `Tour element #${targetId} not found. Skipping ${directionRef.current}.`,
          );
          if (directionRef.current === "forward") {
            if (step.nextStepId && steps[step.nextStepId]) {
              setCurrentStepId(step.nextStepId);
            } else {
              completeTour();
            }
          } else {
            if (step.prevStepId && steps[step.prevStepId]) {
              setCurrentStepId(step.prevStepId);
            } else {
              cancelTour();
            }
          }
        }
      };

      const timer = setTimeout(attachObserver, 150);
      return () => {
        clearTimeout(timer);
        if (observerRef.current) observerRef.current.disconnect();
      };
    } else {
      setElementPosition(null);
    }
  }, [
    currentStepId,
    steps,
    location.pathname,
    navigate,
    updatePosition,
    cancelTour,
    completeTour,
  ]);

  useEffect(() => {
    let ticking = false;
    const handleScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updatePosition();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, {
      passive: true,
      capture: true,
    });
    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, {
        capture: true,
      });
    };
  }, [updatePosition]);

  // observe for specific clicks to advance/retreat the tour
  useEffect(() => {
    if (!currentStepId || !steps[currentStepId]) return;
    const step = steps[currentStepId];
    if (!step.advanceOnClick && !step.retreatOnClick) return;
    const targetId = step.selectorId || currentStepId;

    const handleTargetClick = (e: MouseEvent) => {
      if (!e.isTrusted) return;
      const target = e.target as HTMLElement;

      // advance
      if (step.advanceOnClick) {
        const ids = Array.isArray(step.advanceOnClick)
          ? step.advanceOnClick
          : // if string, target is that id, otherwise it's the steps id
            typeof step.advanceOnClick === "string"
            ? [step.advanceOnClick]
            : [targetId];

        // advance if any of these ids are clicked
        if (ids.some((id) => target.closest(`[data-tour-id="${id}"]`))) {
          nextStep();
          return;
        }
      }

      // retreat
      if (step.retreatOnClick) {
        const ids = Array.isArray(step.retreatOnClick)
          ? step.retreatOnClick
          : // if string, target is that id, otherwise it's the steps id
            typeof step.retreatOnClick === "string"
            ? [step.retreatOnClick]
            : [targetId];

        // retreat if any of these ids are clicked
        if (ids.some((id) => target.closest(`[data-tour-id="${id}"]`))) {
          prevStep();
        }
      }
    };

    window.addEventListener("click", handleTargetClick, true);
    return () => {
      window.removeEventListener("click", handleTargetClick, true);
    };
  }, [currentStepId, steps, nextStep, prevStep]);

  // for blocking scrolls if needed within border box
  useEffect(() => {
    if (!currentStepId || !steps[currentStepId]) return;
    const step = steps[currentStepId];
    if (!step.disableScroll) return;

    const preventScroll = (e: Event) => {
      e.preventDefault();
    };

    const options = { passive: false, capture: true };

    window.addEventListener("wheel", preventScroll, options);
    window.addEventListener("touchmove", preventScroll, options);

    return () => {
      window.removeEventListener("wheel", preventScroll, options);
      window.removeEventListener("touchmove", preventScroll, options);
    };
  }, [currentStepId, steps]);

  const contextValue = useMemo(
    () => ({
      steps,
      setSteps,
      currentStepId,
      isActive: currentStepId !== null,
      isTourCompleted: isCompleted,
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
      isCompleted,
      startTour,
      completeTour,
      resetTour,
      cancelTour,
      nextStep,
      prevStep,
      goToStepById,
    ],
  );

  const currentStepData = currentStepId ? steps[currentStepId] : null;

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      <AnimatePresence>
        {currentStepId &&
          currentStepData &&
          (elementPosition || isLocating) && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-[40] overflow-hidden"
                style={{ clipPath }}
              />

              {/* Border Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute",
                  top: y,
                  left: x,
                  width: w,
                  height: h,
                }}
                className={cn(
                  "z-[45] border-2 rounded-sm shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]",
                  isLocating ? "border-transparent" : "border-muted-foreground",
                  currentStepData.disableInteraction
                    ? "pointer-events-auto cursor-not-allowed"
                    : "pointer-events-none",
                  className,
                )}
                onClick={(e) =>
                  currentStepData.disableInteraction && e.stopPropagation()
                }
                onMouseDown={(e) =>
                  currentStepData.disableInteraction && e.stopPropagation()
                }
                onMouseUp={(e) =>
                  currentStepData.disableInteraction && e.stopPropagation()
                }
              />

              {/* Content Popover */}
              <motion.div
                id="tour-popover"
                layout="size"
                initial={{ opacity: 0, y: 10, width: CONTENT_WIDTH }}
                animate={{
                  opacity: 1,
                  y: 0,
                  width: currentStepData.popoverWidth || CONTENT_WIDTH,
                }}
                exit={{ opacity: 0, y: 10 }}
                transition={{
                  ...transitionConfig,
                  opacity: { duration: 0.2 },
                  layout: transitionConfig,
                  width: transitionConfig,
                }}
                style={{
                  position: "absolute",
                  top: popoverY,
                  left: popoverX,
                }}
                className="overflow-hidden bg-popover/30 backdrop-blur relative z-[45] rounded-lg border p-4 shadow-lg select-none"
              >
                <motion.div
                  layout="position"
                  className="absolute top-4 right-2 z-10"
                >
                  <Button
                    variant="svg"
                    className="w-5 h-5 cursor-pointer text-muted-foreground p-0"
                    onClick={completeTour}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={`tour-content-${currentStepId}`}
                    layout="position"
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      filter: isLocating ? "blur(4px)" : "blur(0px)",
                    }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    className="overflow-hidden"
                    transition={{ duration: 0.2 }}
                  >
                    {currentStepData.content}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-auto pt-4 flex items-center justify-end gap-2 transition-all">
                  <div className="flex items-center gap-2">
                    {/* Prev Button */}
                    {currentStepData.prevStepId &&
                      !currentStepData.hidePrev && (
                        <button
                          onClick={() => {
                            if (currentStepData.retreatOnClick) {
                              const ids = Array.isArray(
                                currentStepData.retreatOnClick,
                              )
                                ? currentStepData.retreatOnClick
                                : typeof currentStepData.retreatOnClick ===
                                    "string"
                                  ? [currentStepData.retreatOnClick]
                                  : [
                                      currentStepData.selectorId ||
                                        currentStepId,
                                    ];
                              ids.forEach((id, index) => {
                                if (typeof id === "string") {
                                  setTimeout(() => {
                                    document
                                      .querySelector<HTMLElement>(
                                        `[data-tour-id="${id}"]`,
                                      )
                                      ?.click();
                                  }, index * 150);
                                }
                              });
                            }
                            prevStep();
                          }}
                          disabled={currentStepData.disablePrev}
                          className="text-sm text-muted-foreground enabled:hover:text-foreground disabled:opacity-20 disabled:animate-pulse"
                        >
                          Previous
                        </button>
                      )}
                    {/* Separator */}
                    {currentStepData.prevStepId &&
                      !currentStepData.hideNext &&
                      !currentStepData.hidePrev && (
                        <Separator
                          orientation="vertical"
                          className="h-auto self-stretch"
                        />
                      )}
                    {/* Next Button */}
                    {!currentStepData.hideNext && (
                      <button
                        onClick={nextStep}
                        disabled={currentStepData.disableNext}
                        className="text-sm font-medium text-primary enabled:hover:text-accent disabled:opacity-20 disabled:animate-pulse"
                      >
                        {currentStepData.nextStepId ? "Next" : "Finish"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
      </AnimatePresence>
    </TourContext.Provider>
  );
}

export function TourAlertDialog() {
  const { startTour, completeTour, isTourCompleted, currentStepId } = useTour();
  const dynamicSegments = useTourSteps();
  const location = useLocation();

  const activeSegment = dynamicSegments[location.pathname];
  const isOpen =
    !isTourCompleted &&
    currentStepId === null &&
    !!activeSegment &&
    Object.keys(activeSegment.steps).length > 0;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md p-6">
        <AlertDialogHeader className="flex flex-col items-center justify-center">
          <div className="relative mb-4 p-4">
            <AnimatedWaves className="h-32 text-primary w-32" />
          </div>
          <AlertDialogTitle className="text-center text-xl font-medium">
            Welcome to DWE OS
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-muted-foreground mt-2 text-center text-sm">
              Take a quick tour to learn about the key features and
              functionality of DWE OS.
              <br />
              <br />
              <div className="text-foreground">
                You can restart this tour anytime in{" "}
                <span className="font-bold text-accent">Preferences</span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-6 space-y-3 flex flex-col">
          <Button onClick={() => startTour(false)} className="w-full">
            Start Tour
          </Button>
          <Button
            onClick={completeTour}
            variant="svg"
            className="mx-auto hover:bg-primary/10 hover:text-foreground"
          >
            Skip Tour
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

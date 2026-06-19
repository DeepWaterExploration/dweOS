import { AnimatedWaves } from "@/assets/animated-waves";
import { useTour } from "@/components/tour/tour-context";
import { TOUR_STEPS } from "@/components/tour/tour-steps";
import {
  calculateContentPosition,
  CONTENT_HEIGHT,
  CONTENT_WIDTH,
  getElementPosition,
} from "@/components/tour/tour-utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Separator } from "@radix-ui/react-separator";
import { X } from "lucide-react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
} from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function TourOverlay() {
  const {
    currentStepId,
    steps,
    completeTour,
    cancelTour,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
  } = useTour();

  const [elementPosition, setElementPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSegmentLoading, setIsSegmentLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const activeSegment = TOUR_STEPS[location.pathname];

  const observerRef = useRef<{ disconnect: () => void } | null>(null);
  const prevStepRef = useRef<string | null>(currentStepId);
  const directionRef = useRef<"forward" | "backward">("forward");
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleNext = useCallback(() => {
    directionRef.current = "forward";
    nextStep();
  }, [nextStep]);

  const handlePrev = useCallback(() => {
    directionRef.current = "backward";
    prevStep();
  }, [prevStep]);

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

  const clipPath = useMotionTemplate`polygon(
    0% 0%, 0% 100%, 100% 100%, 100% 0%,
    ${x}px 0%, ${x}px ${y}px, calc(${x}px + ${w}px) ${y}px,
    calc(${x}px + ${w}px) calc(${y}px + ${h}px), ${x}px calc(${y}px + ${h}px), ${x}px 0%
  )`;

  // segment loaded?
  useEffect(() => {
    const targetSelectors = activeSegment?.waitForSelector;

    // no element to search for, exit
    if (!targetSelectors) {
      setIsSegmentLoading(false);
      return;
    }

    const selectors = Array.isArray(targetSelectors)
      ? targetSelectors
      : [targetSelectors];

    const checkIsLoading = () =>
      !selectors.some((selector) => {
        try {
          return !!document.querySelector(selector);
        } catch {
          console.warn("Invalid Tour Selector:", selector);
          return false;
        }
      });

    setIsSegmentLoading(checkIsLoading());

    const observer = new MutationObserver(() => {
      setIsSegmentLoading(checkIsLoading());
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [activeSegment, location.pathname]);

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
    }
  }, [currentStepId, steps]);

  // Sync MotionValues
  useEffect(() => {
    if (
      (elementPosition || isLocating || isSegmentLoading) &&
      currentStepId &&
      steps[currentStepId]
    ) {
      const step = steps[currentStepId];
      const isStarting = prevStepRef.current === null;

      const actualHeight = popoverRef.current
        ? popoverRef.current.offsetHeight
        : CONTENT_HEIGHT;

      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      let targetW = 0;
      let targetH = 0;

      let contentLeft =
        window.innerWidth / 2 - (step.popoverWidth || CONTENT_WIDTH) / 2;
      let contentTop = window.innerHeight / 2 - actualHeight / 2;

      if (!isLocating && !isSegmentLoading && elementPosition) {
        targetW = elementPosition.width;
        targetH = elementPosition.height;
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
    isSegmentLoading,
    h,
    w,
    x,
    y,
    popoverX,
    popoverY,
    transitionConfig,
  ]);

  // on DOM change
  useEffect(() => {
    if (isSegmentLoading) return;

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
          // element disappeared, prev until safe step
          const mutationObs = new MutationObserver(() => {
            if (!document.body.contains(element)) {
              console.warn(
                `Element #${targetId} destroyed. Auto-skipping backward.`,
              );
              if (observerRef.current) observerRef.current.disconnect();
              handlePrev();
            } else {
              handleShift();
            }
          });

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
            if (step.nextStepId && steps[step.nextStepId]) handleNext();
            else completeTour();
          } else {
            if (step.prevStepId && steps[step.prevStepId]) handlePrev();
            else cancelTour();
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
    isSegmentLoading,
    currentStepId,
    steps,
    location.pathname,
    navigate,
    updatePosition,
    cancelTour,
    completeTour,
    handleNext,
    handlePrev,
  ]);

  // watch resize/scroll
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

  const currentStepData = currentStepId ? steps[currentStepId] : null;

  return (
    <AnimatePresence>
      {currentStepId && currentStepData && (elementPosition || isLocating) && (
        <>
          {/* Overlay to block mouse events */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[40] overflow-hidden"
            style={{ clipPath }}
          />

          {/* Highlight Box */}
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
              isLocating || isSegmentLoading
                ? "border-transparent"
                : "border-muted-foreground",
              currentStepData.disableInteraction
                ? "pointer-events-auto cursor-not-allowed"
                : "pointer-events-none",
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
            ref={popoverRef}
            layout="size"
            initial={{ opacity: 0, y: 10, width: CONTENT_WIDTH }}
            animate={{
              opacity: 1,
              y: 0,
              width: isSegmentLoading
                ? CONTENT_WIDTH
                : currentStepData.popoverWidth || CONTENT_WIDTH,
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
            {isSegmentLoading ? (
              <AnimatePresence mode="popLayout">
                <motion.div
                  key="loading-segment"
                  layout="position"
                  initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                  className="flex flex-col items-center justify-center gap-2 p-2"
                  transition={{ duration: 0.2 }}
                >
                  <Spinner className="size-8" />
                  <div className="text-sm font-medium text-muted-foreground animate-pulse">
                    Waiting for page to load...
                  </div>
                  <Button variant="outline" size="sm" onClick={completeTour}>
                    Quit Tour
                  </Button>
                </motion.div>
              </AnimatePresence>
            ) : (
              <>
                <motion.div
                  layout="position"
                  className="absolute top-3 right-3 z-10 cursor-pointer text-muted-foreground"
                >
                  <Button
                    variant="svg"
                    className="p-0 h-auto"
                    onClick={completeTour}
                  >
                    <X className="size-4" />
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
                    {currentStepData.prevStepId && !isFirstStep && (
                      <button
                        onClick={handlePrev}
                        className="text-sm text-muted-foreground enabled:hover:text-foreground disabled:opacity-20 disabled:animate-pulse"
                      >
                        Previous
                      </button>
                    )}
                    {currentStepData.prevStepId && !isFirstStep && (
                      <Separator
                        orientation="vertical"
                        className="h-auto self-stretch"
                      />
                    )}
                    <button
                      onClick={handleNext}
                      className="text-sm font-medium text-primary enabled:hover:text-accent disabled:opacity-20 disabled:animate-pulse"
                    >
                      {isLastStep ? "Finish" : "Next"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function TourDialog() {
  const { startTour, completeTour, isTourCompleted, currentStepId } = useTour();
  const location = useLocation();

  const activeSegment = TOUR_STEPS[location.pathname];
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

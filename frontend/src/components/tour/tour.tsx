"use client";

import {
  AnimatePresence,
  motion,
  animate,
  useMotionValue,
  useMotionTemplate,
} from "motion/react";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Separator } from "../ui/separator";
import { AnimatedWaves } from "@/assets/animated-waves";

export interface TourStep {
  content: React.ReactNode;
  selectorId: string;
  route?: string;
  width?: number;
  height?: number;
  onClickWithinArea?: () => void;
  position?: "top" | "bottom" | "left" | "right";
}

interface TourContextType {
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  previousStep: () => void;
  endTour: () => void;
  isActive: boolean;
  startTour: () => void;
  setSteps: (steps: TourStep[]) => void;
  steps: TourStep[];
  isTourCompleted: boolean;
  setIsTourCompleted: (completed: boolean) => void;
}

interface TourProviderProps {
  children: React.ReactNode;
  onComplete?: () => void;
  className?: string;
  isTourCompleted?: boolean;
  storageKey?: string;
}

const TourContext = createContext<TourContextType | null>(null);

const PADDING = 16;
const CONTENT_WIDTH = 300;
const CONTENT_HEIGHT = 200;

function getElementPosition(id: string) {
  const element = document.getElementById(id);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  };
}

function calculateContentPosition(
  elementPos: { top: number; left: number; width: number; height: number },
  position: "top" | "bottom" | "left" | "right" = "bottom"
) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = elementPos.left;
  let top = elementPos.top;

  switch (position) {
    case "top":
      top = elementPos.top - CONTENT_HEIGHT - PADDING;
      left = elementPos.left + elementPos.width / 2 - CONTENT_WIDTH / 2;
      break;
    case "bottom":
      top = elementPos.top + elementPos.height + PADDING;
      left = elementPos.left + elementPos.width / 2 - CONTENT_WIDTH / 2;
      break;
    case "left":
      left = elementPos.left - CONTENT_WIDTH - PADDING;
      top = elementPos.top + elementPos.height / 2 - CONTENT_HEIGHT / 2;
      break;
    case "right":
      left = elementPos.left + elementPos.width + PADDING;
      top = elementPos.top + elementPos.height / 2 - CONTENT_HEIGHT / 2;
      break;
  }

  return {
    top: Math.max(
      PADDING,
      Math.min(top, viewportHeight - CONTENT_HEIGHT - PADDING)
    ),
    left: Math.max(
      PADDING,
      Math.min(left, viewportWidth - CONTENT_WIDTH - PADDING)
    ),
    width: CONTENT_WIDTH,
    height: CONTENT_HEIGHT,
  };
}

export function TourProvider({
  children,
  onComplete,
  className,
  isTourCompleted = false,
  storageKey = "tourCompleted",
}: TourProviderProps) {
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [elementPosition, setElementPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const [isCompleted, setIsCompleted] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === "true";
      }
    }
    return isTourCompleted;
  });
  const observerRef = useRef<ResizeObserver | null>(null);
  const prevStepRef = useRef(currentStep);

  // for the highlight box
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const w = useMotionValue(0);
  const h = useMotionValue(0);

  // for the content popover
  const popoverX = useMotionValue(0);
  const popoverY = useMotionValue(0);

  const transitionConfig = {
    type: "spring",
    mass: 0.2,
    stiffness: 100,
    damping: 15,
  } as const;

  // Sync MotionValues
  useEffect(() => {
    if (elementPosition && currentStep >= 0) {
      const step = steps[currentStep];
      const targetWidth = step?.width || elementPosition.width;
      const targetHeight = step?.height || elementPosition.height;
      const isStarting = prevStepRef.current === -1;

      const contentPos = calculateContentPosition(
        { ...elementPosition, width: targetWidth, height: targetHeight },
        step?.position
      );

      if (isStarting) {
        // for highlight box
        x.set(elementPosition.left);
        y.set(elementPosition.top);
        w.set(targetWidth);
        h.set(targetHeight);

        // for content box
        popoverX.set(contentPos.left);
        popoverY.set(contentPos.top);
      } else {
        // for highlight box
        animate(x, elementPosition.left, transitionConfig);
        animate(y, elementPosition.top, transitionConfig);
        animate(w, targetWidth, transitionConfig);
        animate(h, targetHeight, transitionConfig);

        // for content box
        animate(popoverX, contentPos.left, transitionConfig);
        animate(popoverY, contentPos.top, transitionConfig);
      }

      prevStepRef.current = currentStep;
    }
  }, [elementPosition, currentStep, steps]);

  // For Overlay Cutout
  const clipPath = useMotionTemplate`polygon(
    0% 0%,
    0% 100%,
    100% 100%,
    100% 0%,
    ${x}px 0%,
    ${x}px ${y}px,
    calc(${x}px + ${w}px) ${y}px,
    calc(${x}px + ${w}px) calc(${y}px + ${h}px),
    ${x}px calc(${y}px + ${h}px),
    ${x}px 0%
  )`;

  const updatePosition = useCallback(() => {
    if (currentStep < 0 || !steps[currentStep]) return;

    const pos = getElementPosition(steps[currentStep].selectorId);
    if (pos) {
      setElementPosition((prev) => {
        if (
          prev &&
          prev.top === pos.top &&
          prev.left === pos.left &&
          prev.width === pos.width &&
          prev.height === pos.height
        ) {
          return prev;
        }
        return pos;
      });
    }
  }, [currentStep, steps]);

  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];

      if (step.route && location.pathname !== step.route) {
        navigate(step.route);
        return;
      }

      const attachObserver = () => {
        const element = document.getElementById(step.selectorId);
        if (observerRef.current) observerRef.current.disconnect();

        if (element) {
          updatePosition();
          observerRef.current = new ResizeObserver(() => {
            requestAnimationFrame(updatePosition);
          });
          observerRef.current.observe(element);
          observerRef.current.observe(document.body);
        } else {
          console.warn(`Tour element #${step.selectorId} not found`);
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
  }, [currentStep, steps, location.pathname, navigate, updatePosition]);

  useEffect(() => {
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [updatePosition]);

  const nextStep = useCallback(async () => {
    setCurrentStep((prev) => {
      if (prev >= steps.length - 1) return -1;
      return prev + 1;
    });

    if (currentStep === steps.length - 1) {
      setIsTourCompleted(true);
      onComplete?.();
    }
  }, [steps.length, onComplete, currentStep]);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const endTour = useCallback(() => setCurrentStep(-1), []);

  const startTour = useCallback(() => {
    if (isTourCompleted) return;
    setCurrentStep(0);
  }, [isTourCompleted]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (
        currentStep >= 0 &&
        elementPosition &&
        steps[currentStep]?.onClickWithinArea
      ) {
        const clickX = e.clientX + window.scrollX;
        const clickY = e.clientY + window.scrollY;

        const currentWidth = steps[currentStep]?.width || elementPosition.width;
        const currentHeight =
          steps[currentStep]?.height || elementPosition.height;

        const isWithinBounds =
          clickX >= elementPosition.left &&
          clickX <= elementPosition.left + currentWidth &&
          clickY >= elementPosition.top &&
          clickY <= elementPosition.top + currentHeight;

        if (isWithinBounds) {
          steps[currentStep].onClickWithinArea?.();
        }
      }
    },
    [currentStep, elementPosition, steps]
  );

  useEffect(() => {
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [handleClick]);

  const setIsTourCompleted = useCallback((completed: boolean) => {
    setIsCompleted(completed);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, String(completed));
    }
  }, []);

  return (
    <TourContext.Provider
      value={{
        currentStep,
        totalSteps: steps.length,
        nextStep,
        previousStep,
        endTour,
        isActive: currentStep >= 0,
        startTour,
        setSteps,
        steps,
        isTourCompleted: isCompleted,
        setIsTourCompleted,
      }}
    >
      {children}
      <AnimatePresence>
        {currentStep >= 0 && elementPosition && (
          <>
            {/* Overlay to block mouse events */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-[90] overflow-hidden"
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
                "z-[100] border-2 border-muted-foreground rounded-sm shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]",
                className
              )}
            />

            {/* Content Popover */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ ...transitionConfig, opacity: { duration: 0.2 } }}
              style={{
                position: "absolute",
                top: popoverY,
                left: popoverX,
                width: calculateContentPosition(
                  elementPosition,
                  steps[currentStep]?.position
                ).width,
              }}
              className="bg-popover/30 backdrop-blur relative z-[100] rounded-lg border p-4 shadow-lg"
            >
              <AnimatePresence mode="wait">
                <div>
                  <Button
                    variant="svg"
                    className="absolute top-4 right-2 w-5 h-5 z-10 cursor-pointer"
                    onClick={() => {
                      setIsTourCompleted(true);
                      endTour();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <motion.div
                    key={`tour-content-${currentStep}`}
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    className="overflow-hidden"
                    transition={{ duration: 0.2 }}
                  >
                    {steps[currentStep]?.content}
                  </motion.div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="text-muted-foreground text-xs">
                      {currentStep + 1} / {steps.length}
                    </div>
                    {currentStep > 0 && (
                      <>
                        <button
                          onClick={previousStep}
                          disabled={currentStep === 0}
                          className="text-sm ml-auto text-muted-foreground hover:text-foreground"
                        >
                          Previous
                        </button>
                        <Separator
                          orientation="vertical"
                          className="h-auto self-stretch"
                        />
                      </>
                    )}
                    <button
                      onClick={nextStep}
                      className="text-sm font-medium text-primary hover:text-accent"
                    >
                      {currentStep === steps.length - 1 ? "Finish" : "Next"}
                    </button>
                  </div>
                </div>
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}

export function TourAlertDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const { startTour, steps, isTourCompleted, setIsTourCompleted, currentStep } =
    useTour();

  if (isTourCompleted || steps.length === 0 || currentStep > -1) {
    return null;
  }
  const handleSkip = async () => {
    setIsOpen(false);
    setIsTourCompleted(true);
  };

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
          <AlertDialogDescription className="text-muted-foreground mt-2 text-center text-sm">
            Take a quick tour to learn about the key features and functionality
            of DWE OS.
            <br />
            <br />
            <div className="text-foreground">
              You can restart this tour anytime in{" "}
              <span className="font-bold text-accent">Preferences</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-6 space-y-3 flex flex-col">
          <Button onClick={startTour} className="w-full">
            Start Tour
          </Button>
          <Button
            onClick={handleSkip}
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

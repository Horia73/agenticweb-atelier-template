"use client";

import * as React from "react";
import {
  motion,
  type MotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";
import {
  type ProgressPlayback,
  useCommittedProgress,
} from "@/components/experience/use-committed-progress";

const subscribeToHydration = () => () => undefined;

function useHydrated() {
  return React.useSyncExternalStore(subscribeToHydration, () => true, () => false);
}

type MaskRevealProps = Omit<React.ComponentProps<"section">, "children"> & {
  after: React.ReactNode;
  before: React.ReactNode;
  direction?: "left" | "right" | "top" | "bottom" | "circle";
  label: string;
  overlay?: React.ReactNode;
  playback?: ProgressPlayback;
  progress?: MotionValue<number>;
  range?: [number, number];
  reducedMotionState?: "before" | "after";
  resetKey?: React.Key;
  scrollScreens?: number;
  stageClassName?: string;
};

function maskValues(direction: NonNullable<MaskRevealProps["direction"]>) {
  switch (direction) {
    case "right": return ["inset(0% 0% 0% 100%)", "inset(0% 0% 0% 0%)"];
    case "top": return ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"];
    case "bottom": return ["inset(0% 0% 100% 0%)", "inset(0% 0% 0% 0%)"];
    case "circle": return ["circle(0% at 50% 50%)", "circle(75% at 50% 50%)"];
    default: return ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"];
  }
}

/** Reveals one complete React visual over another with a scroll-driven mask. */
export function MaskReveal({
  after,
  before,
  className,
  direction = "left",
  label,
  overlay,
  playback = "scrub",
  progress: controlledProgress,
  range = [0.15, 0.85],
  reducedMotionState = "after",
  resetKey,
  scrollScreens = 2.5,
  stageClassName,
  style,
  ...props
}: MaskRevealProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const mounted = useHydrated();
  const reducedMotionPreference = useReducedMotion();
  const reducedMotion = mounted && Boolean(reducedMotionPreference);
  const localProgress = useElementScrollProgress(rootRef);
  const sourceProgress = controlledProgress ?? localProgress;
  const progress = useCommittedProgress(sourceProgress, playback, resetKey);
  const [from, to] = maskValues(direction);
  const clipPath = useTransform(progress, range, [from, to], { clamp: true });

  if (reducedMotion) {
    return (
      <section ref={rootRef} aria-label={label} className={cn("relative isolate min-h-svh overflow-hidden", className)} style={style} {...props}>
        {reducedMotionState === "after" ? after : before}
        {overlay}
      </section>
    );
  }

  return (
    <section ref={rootRef} aria-label={label} data-mask-reveal data-playback={playback} className={cn("relative isolate", className)} style={{ minHeight: `${Math.max(1.5, scrollScreens) * 100}svh`, ...style }} {...props}>
      <div className={cn("sticky top-0 h-svh overflow-hidden", stageClassName)}>
        <div className="absolute inset-0">{before}</div>
        <motion.div aria-hidden className="absolute inset-0 will-change-[clip-path]" style={{ clipPath }}>
          {after}
        </motion.div>
        {overlay ? <div className="absolute inset-0 z-10">{overlay}</div> : null}
      </div>
    </section>
  );
}

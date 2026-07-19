"use client";

import * as React from "react";
import {
  motion,
  type MotionValue,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";
import { useExperienceViewport, usePrefersReducedMotion } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";
import {
  type ProgressPlayback,
  useCommittedProgress,
} from "@/components/experience/use-committed-progress";

type ExpandingMediaProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  media: React.ReactNode;
  overlay?: React.ReactNode;
  overlayClassName?: string;
  playback?: ProgressPlayback;
  progress?: MotionValue<number>;
  range?: [number, number];
  scrollScreens?: number;
  scrimClassName?: string;
  stageClassName?: string;
  startInset?: string;
  mobileStartInset?: string;
  tabletStartInset?: string;
  resetKey?: React.Key;
};

/** Expands an image or video from an editorial frame into a full-viewport beat. */
export function ExpandingMedia({
  className,
  label,
  media,
  mobileStartInset,
  overlay,
  overlayClassName,
  playback = "scrub",
  progress: controlledProgress,
  range = [0.12, 0.72],
  scrollScreens = 2.5,
  scrimClassName = "bg-gradient-to-t from-black/70 via-black/10 to-transparent",
  stageClassName,
  startInset = "12% 10% 12% 10%",
  resetKey,
  style,
  tabletStartInset,
  ...props
}: ExpandingMediaProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const viewport = useExperienceViewport();
  const localProgress = useElementScrollProgress(rootRef);
  const sourceProgress = controlledProgress ?? localProgress;
  const progress = useCommittedProgress(sourceProgress, playback, resetKey);
  const activeStartInset = viewport === "mobile"
    ? mobileStartInset ?? "18% 5% 14% 5%"
    : viewport === "tablet"
      ? tabletStartInset ?? "14% 8% 12% 8%"
      : startInset;
  const clipPath = useTransform(progress, range, [`inset(${activeStartInset} round 2rem)`, "inset(0% 0% 0% 0% round 0rem)"], { clamp: true });
  const scale = useTransform(progress, range, [0.96, 1], { clamp: true });

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-expanding-media
      data-experience-viewport={viewport}
      data-playback={playback}
      className={cn("relative isolate", className)}
      style={{ minHeight: reducedMotion ? "100svh" : `${Math.max(1.5, scrollScreens) * 100}svh`, ...style }}
      {...props}
    >
      <div className={cn(reducedMotion ? "relative min-h-svh" : "sticky top-0 h-svh overflow-hidden", stageClassName)}>
        <motion.div className="absolute inset-0 overflow-hidden will-change-[clip-path,transform]" style={reducedMotion ? undefined : { clipPath, scale }}>
          {media}
        </motion.div>
        {overlay ? (
          <div className={cn("pointer-events-none absolute inset-0 z-10", scrimClassName, overlayClassName)}>
            {overlay}
          </div>
        ) : null}
      </div>
    </section>
  );
}

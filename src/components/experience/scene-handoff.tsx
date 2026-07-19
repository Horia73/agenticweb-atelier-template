"use client";

import * as React from "react";
import {
  motion,
  type MotionValue,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";
import { useExperienceViewport } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type SceneHandoffProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  from: React.ReactNode;
  to: React.ReactNode;
  fromLabel: string;
  toLabel: string;
  /** Screen-reader description of the handoff. Defaults to `Transition from ${fromLabel} to ${toLabel}.` */
  announcement?: string;
  variant?: "depth" | "shutter" | "iris" | "organic-rise";
  progress?: MotionValue<number>;
  progressMode?: "pinned" | "entry";
  scrollScreens?: number;
  overlay?: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  stageClassName?: string;
  fallback?: React.ReactNode;
};

function HandoffLayers({
  from,
  progress,
  to,
  variant,
}: Pick<SceneHandoffProps, "from" | "to" | "variant"> & { progress: MotionValue<number> }) {
  const fromScale = useTransform(progress, [0, 0.55, 1], [1, 1.04, 1.22]);
  const fromOpacity = useTransform(progress, [0, 0.52, 0.82], [1, 1, 0]);
  const fromFilter = useTransform(progress, [0, 0.58, 1], ["blur(0px)", "blur(0px)", "blur(14px)"]);
  const toScale = useTransform(progress, [0, 0.34, 0.82, 1], [0.82, 0.86, 1, 1]);
  const toOpacity = useTransform(progress, [0, 0.28, 0.52], [0, 0, 1]);
  const depthClip = useTransform(progress, [0, 0.25, 0.82, 1], [
    "inset(50% 48% 50% 48% round 999px)",
    "inset(38% 35% 38% 35% round 999px)",
    "inset(0% 0% 0% 0% round 0px)",
    "inset(0% 0% 0% 0% round 0px)",
  ]);
  const shutterClip = useTransform(progress, [0, 0.25, 0.82, 1], [
    "inset(50% 0% 50% 0%)",
    "inset(42% 0% 42% 0%)",
    "inset(0% 0% 0% 0%)",
    "inset(0% 0% 0% 0%)",
  ]);
  const irisClip = useTransform(progress, [0, 0.22, 0.82, 1], [
    "circle(0% at 50% 50%)",
    "circle(8% at 50% 50%)",
    "circle(72% at 50% 50%)",
    "circle(100% at 50% 50%)",
  ]);
  const organicClip = useTransform(progress, [0, 0.12, 0.28, 0.44, 0.58, 0.64, 1], [
    "polygon(0 112%, 9% 110%, 19% 113%, 31% 109%, 43% 112%, 57% 108%, 69% 111%, 82% 109%, 92% 113%, 100% 110%, 100% 120%, 0 120%)",
    "polygon(0 96%, 9% 93%, 19% 97%, 31% 92%, 43% 95%, 57% 91%, 69% 94%, 82% 92%, 92% 96%, 100% 93%, 100% 120%, 0 120%)",
    "polygon(0 68%, 9% 64%, 19% 69%, 31% 65%, 43% 67%, 57% 63%, 69% 66%, 82% 64%, 92% 68%, 100% 65%, 100% 120%, 0 120%)",
    "polygon(0 34%, 9% 30%, 19% 35%, 31% 31%, 43% 33%, 57% 29%, 69% 32%, 82% 30%, 92% 34%, 100% 31%, 100% 120%, 0 120%)",
    "polygon(0 5%, 9% 1%, 19% 6%, 31% 2%, 43% 4%, 57% 0%, 69% 3%, 82% 1%, 92% 5%, 100% 2%, 100% 120%, 0 120%)",
    "polygon(0 -10%, 9% -14%, 19% -9%, 31% -13%, 43% -11%, 57% -15%, 69% -12%, 82% -14%, 92% -10%, 100% -13%, 100% 120%, 0 120%)",
    "polygon(0 -10%, 9% -14%, 19% -9%, 31% -13%, 43% -11%, 57% -15%, 69% -12%, 82% -14%, 92% -10%, 100% -13%, 100% 120%, 0 120%)",
  ]);
  const organicEdgeY = useTransform(progress, [0, 0.12, 0.28, 0.44, 0.58, 0.64, 1], [
    "98svh",
    "82svh",
    "54svh",
    "22svh",
    "-8svh",
    "-24svh",
    "-24svh",
  ]);
  const organicEdgeOpacity = useTransform(progress, [0, 0.06, 0.58, 0.66], [0, 1, 1, 0]);
  const organicFromScale = useTransform(progress, [0, 0.64, 1], [1, 1.015, 1.02]);
  const organicFromOpacity = useTransform(progress, [0, 0.58, 0.66], [1, 1, 0]);
  const organicToBlur = useTransform(progress, [0, 0.56, 0.64], [16, 12, 0]);
  const organicToFilter = useTransform(organicToBlur, (value) => `blur(${value}px)`);
  const organicToScale = useTransform(progress, [0, 0.64, 1], [1.025, 1, 1]);
  const clipPath = variant === "shutter" ? shutterClip : variant === "iris" ? irisClip : depthClip;

  if (variant === "organic-rise") {
    return (
      <>
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{ scale: organicFromScale, opacity: organicFromOpacity }}
        >
          {from}
        </motion.div>
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{ clipPath: organicClip, filter: organicToFilter, scale: organicToScale }}
        >
          {to}
        </motion.div>
        <motion.div
          aria-hidden
          className="organic-handoff-edge absolute left-[-5%] top-0 h-52 w-[110%]"
          style={{ opacity: organicEdgeOpacity, y: organicEdgeY }}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ scale: fromScale, opacity: fromOpacity, filter: fromFilter }}
      >
        {from}
      </motion.div>
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ scale: toScale, opacity: toOpacity, clipPath }}
      >
        {to}
      </motion.div>
    </>
  );
}

/** Coordinates two live React scenes through one continuous, reversible handoff. */
export function SceneHandoff({
  announcement,
  className,
  fallback,
  from,
  fromLabel,
  label,
  overlay,
  progress: controlledProgress,
  progressMode = "pinned",
  scrollScreens = 2.8,
  stageClassName,
  to,
  toLabel,
  variant = "depth",
  ...props
}: SceneHandoffProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const localProgress = useElementScrollProgress(rootRef, progressMode);
  const fallbackProgress = useMotionValue(0);
  const progress = controlledProgress ?? localProgress ?? fallbackProgress;
  const reducedMotion = useReducedMotion();
  const viewport = useExperienceViewport();
  const linearLayout = reducedMotion || viewport === "mobile";
  const resolvedAnnouncement = announcement ?? `Transition from ${fromLabel} to ${toLabel}.`;

  if (linearLayout) {
    return (
      <section
        ref={rootRef}
        aria-label={label}
        data-scene-handoff
        data-experience-viewport={viewport}
        data-static
        className={cn("relative", className)}
        {...props}
      >
        {fallback ?? (
          <>
            <div className="relative min-h-svh" aria-label={fromLabel}>{from}</div>
            <div className="relative min-h-svh" aria-label={toLabel}>{to}</div>
          </>
        )}
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-scene-handoff
      data-experience-viewport={viewport}
      data-variant={variant}
      className={cn("relative", className)}
      style={{ minHeight: `${Math.max(1, scrollScreens) * 100}svh` }}
      {...props}
    >
      <p className="sr-only">{resolvedAnnouncement}</p>
      <div className={cn("sticky top-0 h-svh overflow-hidden", stageClassName)}>
        <HandoffLayers from={from} to={to} progress={progress} variant={variant} />
        {overlay ? (
          <div className="relative h-full">
            {typeof overlay === "function" ? overlay(progress) : overlay}
          </div>
        ) : null}
      </div>
    </section>
  );
}

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
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type SceneHandoffProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  from: React.ReactNode;
  to: React.ReactNode;
  fromLabel: string;
  toLabel: string;
  /** Screen-reader description of the handoff. Defaults to `Transition from ${fromLabel} to ${toLabel}.` */
  announcement?: string;
  variant?: "depth" | "shutter" | "iris";
  progress?: MotionValue<number>;
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
  const clipPath = variant === "shutter" ? shutterClip : variant === "iris" ? irisClip : depthClip;

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
  scrollScreens = 2.8,
  stageClassName,
  to,
  toLabel,
  variant = "depth",
  ...props
}: SceneHandoffProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const localProgress = useElementScrollProgress(rootRef);
  const fallbackProgress = useMotionValue(0);
  const progress = controlledProgress ?? localProgress ?? fallbackProgress;
  const reducedMotion = useReducedMotion();
  const resolvedAnnouncement = announcement ?? `Transition from ${fromLabel} to ${toLabel}.`;

  if (reducedMotion) {
    return (
      <section
        ref={rootRef}
        aria-label={label}
        data-scene-handoff
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

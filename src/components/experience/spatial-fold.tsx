"use client";

import * as React from "react";
import { motion, type MotionValue, useMotionValue, useTransform } from "motion/react";

import { cn } from "@/lib/utils";
import {
  clamp01,
  useCoarsePointer,
  useExperienceViewport,
  usePrefersReducedMotion,
} from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type SpatialFoldHinge = "left" | "right" | "top" | "bottom";

export type SpatialFoldChapter = {
  id: string;
  label: string;
  accessibleText: string;
  content: React.ReactNode;
  /** The edge around which this chapter leaves. Ignored for the final chapter. */
  hinge?: SpatialFoldHinge;
  className?: string;
};

export type SpatialFoldProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  chapters: SpatialFoldChapter[];
  progress?: MotionValue<number>;
  scrollScreensPerChapter?: number;
  perspective?: number;
  maxFold?: number;
  depth?: number;
  shadowStrength?: number;
  stageClassName?: string;
  chapterClassName?: string | ((chapter: SpatialFoldChapter, index: number) => string | undefined);
  overlay?: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  fallback?: React.ReactNode;
};

const hingeGeometry: Record<SpatialFoldHinge, {
  origin: string;
  axis: "x" | "y";
  direction: number;
  shade: string;
  crease: string;
}> = {
  left: {
    origin: "0% 50%",
    axis: "y",
    direction: -1,
    shade: "linear-gradient(90deg, transparent 18%, color-mix(in oklab, var(--foreground) 42%, transparent) 100%)",
    crease: "inset-y-0 left-0 w-px",
  },
  right: {
    origin: "100% 50%",
    axis: "y",
    direction: 1,
    shade: "linear-gradient(270deg, transparent 18%, color-mix(in oklab, var(--foreground) 42%, transparent) 100%)",
    crease: "inset-y-0 right-0 w-px",
  },
  top: {
    origin: "50% 0%",
    axis: "x",
    direction: 1,
    shade: "linear-gradient(180deg, transparent 18%, color-mix(in oklab, var(--foreground) 42%, transparent) 100%)",
    crease: "inset-x-0 top-0 h-px",
  },
  bottom: {
    origin: "50% 100%",
    axis: "x",
    direction: -1,
    shade: "linear-gradient(0deg, transparent 18%, color-mix(in oklab, var(--foreground) 42%, transparent) 100%)",
    crease: "inset-x-0 bottom-0 h-px",
  },
};

function smoothstep(value: number) {
  const bounded = clamp01(value);
  return bounded * bounded * (3 - 2 * bounded);
}

function SpatialFoldPanel({
  chapter,
  chapterClassName,
  depth,
  index,
  maxFold,
  progress,
  shadowStrength,
  total,
}: {
  chapter: SpatialFoldChapter;
  chapterClassName?: SpatialFoldProps["chapterClassName"];
  depth: number;
  index: number;
  maxFold: number;
  progress: MotionValue<number>;
  shadowStrength: number;
  total: number;
}) {
  const transitionCount = Math.max(0, total - 1);
  const hinge = chapter.hinge ?? (index % 2 === 0 ? "left" : "bottom");
  const geometry = hingeGeometry[hinge];
  const departure = useTransform(progress, (value) => (
    index < transitionCount ? smoothstep(value * transitionCount - index) : 0
  ));
  const arrival = useTransform(progress, (value) => (
    index === 0 ? 1 : smoothstep(value * transitionCount - (index - 1))
  ));
  const rotateX = useTransform(departure, (value) => (
    geometry.axis === "x" ? value * maxFold * geometry.direction : 0
  ));
  const rotateY = useTransform(departure, (value) => (
    geometry.axis === "y" ? value * maxFold * geometry.direction : 0
  ));
  const scale = useTransform(arrival, [0, 1], [0.965, 1]);
  const z = useTransform(arrival, [0, 1], [-depth, 0]);
  const opacity = useTransform(departure, [0, 0.965, 1], [1, 1, 0]);
  const shadeOpacity = useTransform(departure, (value) => (
    Math.sin(value * Math.PI) * shadowStrength
  ));
  const resolvedClassName = typeof chapterClassName === "function"
    ? chapterClassName(chapter, index)
    : chapterClassName;

  return (
    <motion.article
      aria-hidden
      inert
      data-spatial-fold-chapter={chapter.id}
      className={cn(
        "absolute inset-0 overflow-hidden [backface-visibility:hidden] [transform-style:preserve-3d] will-change-transform",
        resolvedClassName,
        chapter.className,
      )}
      style={{
        opacity,
        rotateX,
        rotateY,
        scale,
        transformOrigin: geometry.origin,
        z,
        zIndex: total - index,
      }}
    >
      {chapter.content}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: geometry.shade, opacity: shadeOpacity }}
      />
      <motion.div
        aria-hidden
        className={cn(
          "pointer-events-none absolute bg-[color-mix(in_oklab,var(--foreground)_24%,transparent)]",
          geometry.crease,
        )}
        style={{ opacity: shadeOpacity }}
      />
    </motion.article>
  );
}

/** Live React chapters that hinge through one reversible CSS 3D sequence. */
export function SpatialFold({
  chapters,
  chapterClassName,
  className,
  depth = 90,
  fallback,
  label,
  maxFold = 92,
  overlay,
  perspective = 1400,
  progress: controlledProgress,
  scrollScreensPerChapter = 1.15,
  shadowStrength = 0.72,
  stageClassName,
  style,
  ...props
}: SpatialFoldProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const localProgress = useElementScrollProgress(rootRef);
  const fallbackProgress = useMotionValue(0);
  const progress = controlledProgress ?? localProgress ?? fallbackProgress;
  const reducedMotion = usePrefersReducedMotion();
  const coarsePointer = useCoarsePointer();
  const viewport = useExperienceViewport();
  const linearLayout = reducedMotion || coarsePointer || viewport === "mobile" || chapters.length < 2;

  if (linearLayout) {
    return (
      <section
        ref={rootRef}
        aria-label={label}
        data-spatial-fold
        data-experience-viewport={viewport}
        data-static
        className={cn("relative", className)}
        style={style}
        {...props}
      >
        {fallback ?? chapters.map((chapter, index) => (
          <article
            key={chapter.id}
            aria-label={chapter.label}
            className={cn(
              "relative min-h-svh overflow-hidden",
              typeof chapterClassName === "function" ? chapterClassName(chapter, index) : chapterClassName,
              chapter.className,
            )}
          >
            {chapter.content}
          </article>
        ))}
        {overlay ? (
          <div>{typeof overlay === "function" ? overlay(progress) : overlay}</div>
        ) : null}
      </section>
    );
  }

  const transitionCount = chapters.length - 1;
  const scrollScreens = 1 + transitionCount * Math.max(0.75, scrollScreensPerChapter);
  const boundedFold = Math.min(96, Math.max(78, maxFold));
  const boundedShadow = clamp01(shadowStrength);

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-spatial-fold
      data-experience-viewport={viewport}
      className={cn("relative", className)}
      style={{ ...style, minHeight: `${scrollScreens * 100}svh` }}
      {...props}
    >
      <ol className="sr-only">
        {chapters.map((chapter) => <li key={chapter.id}>{chapter.accessibleText}</li>)}
      </ol>
      <div
        className={cn("sticky top-0 h-svh overflow-hidden", stageClassName)}
        style={{ perspective: `${Math.max(600, perspective)}px`, perspectiveOrigin: "50% 50%" }}
      >
        <div className="absolute inset-0 [transform-style:preserve-3d]">
          {chapters.map((chapter, index) => (
            <SpatialFoldPanel
              key={chapter.id}
              chapter={chapter}
              chapterClassName={chapterClassName}
              depth={Math.max(0, depth)}
              index={index}
              maxFold={boundedFold}
              progress={progress}
              shadowStrength={boundedShadow}
              total={chapters.length}
            />
          ))}
        </div>
        {overlay ? (
          <div className="absolute inset-0 z-20">
            {typeof overlay === "function" ? overlay(progress) : overlay}
          </div>
        ) : null}
      </div>
    </section>
  );
}

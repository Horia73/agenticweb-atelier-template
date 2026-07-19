"use client";

import * as React from "react";
import { type MotionValue, useMotionValue, useMotionValueEvent } from "motion/react";

import { cn } from "@/lib/utils";
import { clamp01, usePrefersReducedMotion } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type DrawOnScrollProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  /** Inline SVG content whose stroked shapes get drawn. */
  children: React.ReactNode;
  /**
   * 0 draws every shape simultaneously; 1 draws them strictly one after
   * another; values in between overlap the strokes.
   */
  stagger?: number;
  /** Pin the section and drive drawing across this many scroll screens. */
  pin?: boolean;
  scrollScreens?: number;
  /** External progress override (0..1). */
  progress?: MotionValue<number>;
  /** Bump to re-measure after the SVG content changes. */
  remeasureKey?: React.Key;
  stageClassName?: string;
};

type StrokeTarget = { element: SVGGeometryElement; length: number };

/** Progress of a non-pinned element through the viewport: 0 entering from the bottom, 1 leaving the top. */
function useViewportProgress(target: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const progress = useMotionValue(0);
  React.useEffect(() => {
    const element = target.current;
    if (!element || !enabled) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const viewport = window.innerHeight;
        progress.set(clamp01((viewport - rect.top) / Math.max(1, viewport + rect.height)));
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [enabled, progress, target]);
  return progress;
}

/**
 * Draws the stroked shapes of an inline SVG as the section moves through the
 * viewport (or across a pinned range). Reduced-motion users see the finished
 * drawing.
 */
export function DrawOnScroll({
  children,
  className,
  label,
  pin = false,
  progress: controlledProgress,
  remeasureKey,
  scrollScreens = 2,
  stageClassName,
  stagger = 0.35,
  ...props
}: DrawOnScrollProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const targetsRef = React.useRef<StrokeTarget[]>([]);
  const reducedMotion = usePrefersReducedMotion();

  const pinnedProgress = useElementScrollProgress(rootRef);
  const viewportProgress = useViewportProgress(rootRef, !pin && !controlledProgress && !reducedMotion);
  const progress = controlledProgress ?? (pin ? pinnedProgress : viewportProgress);

  const applyProgress = React.useCallback(
    (value: number) => {
      const targets = targetsRef.current;
      const count = targets.length;
      if (count === 0) return;
      const span = 1 / (1 + (count - 1) * clamp01(stagger));
      const step = count > 1 ? (1 - span) / (count - 1) : 0;
      targets.forEach(({ element, length }, index) => {
        const local = clamp01((value - index * step) / span);
        element.style.strokeDashoffset = `${length * (1 - local)}`;
      });
    },
    [stagger],
  );

  React.useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const shapes = Array.from(
      stage.querySelectorAll<SVGGeometryElement>("path, circle, ellipse, line, polyline, polygon, rect"),
    ).filter((shape) => typeof shape.getTotalLength === "function");
    if (reducedMotion) {
      shapes.forEach((shape) => {
        shape.style.strokeDasharray = "";
        shape.style.strokeDashoffset = "";
      });
      targetsRef.current = [];
      return;
    }
    targetsRef.current = shapes.map((element) => {
      let length = 0;
      try {
        length = element.getTotalLength();
      } catch {
        length = 0;
      }
      element.style.strokeDasharray = `${length}`;
      return { element, length };
    });
    applyProgress(progress.get());
  }, [applyProgress, progress, reducedMotion, remeasureKey]);

  useMotionValueEvent(progress, "change", (value) => {
    if (!reducedMotion) applyProgress(value);
  });

  if (reducedMotion) {
    return (
      <section ref={rootRef} aria-label={label} data-draw-on-scroll data-static className={cn("relative", className)} {...props}>
        <div ref={stageRef} className={stageClassName}>
          {children}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-draw-on-scroll
      data-pin={pin || undefined}
      className={cn("relative", className)}
      style={pin ? { minHeight: `${Math.max(1, scrollScreens) * 100}svh` } : undefined}
      {...props}
    >
      <div ref={stageRef} className={cn(pin && "sticky top-0 flex h-svh items-center justify-center overflow-hidden", stageClassName)}>
        {children}
      </div>
    </section>
  );
}

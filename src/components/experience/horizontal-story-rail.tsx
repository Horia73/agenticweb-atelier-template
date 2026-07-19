"use client";

import * as React from "react";
import {
  type MotionValue,
  type SpringOptions,
  useSpring,
} from "motion/react";

import {
  HorizontalTrack,
  type HorizontalTrackMetrics,
  type HorizontalTrackProps,
} from "@/components/experience/horizontal-track";
import { cn } from "@/lib/utils";
import { useCoarsePointer, useExperienceViewport, usePrefersReducedMotion } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type HorizontalStoryRailProps = Omit<React.ComponentProps<"section">, "children"> & {
  children: React.ReactNode;
  label: string;
  itemClassName?: HorizontalTrackProps["itemClassName"];
  stageClassName?: string;
  trackClassName?: string;
  progressClassName?: HorizontalTrackProps["progressClassName"];
  progressIndicatorClassName?: HorizontalTrackProps["progressIndicatorClassName"];
  showProgress?: boolean;
  progress?: MotionValue<number>;
  renderCounter?: HorizontalTrackProps["renderCounter"];
  scrollSpring?: false | SpringOptions;
};

const DEFAULT_SCROLL_SPRING: SpringOptions = {
  stiffness: 120,
  damping: 28,
  mass: 0.22,
};

/**
 * A pinned scene where native vertical page scroll drives a horizontal track.
 * Reduced-motion users receive the same content as a normal vertical list.
 */
export function HorizontalStoryRail({
  children,
  className,
  itemClassName,
  label,
  progress: controlledProgress,
  progressClassName,
  progressIndicatorClassName,
  renderCounter,
  scrollSpring = false,
  showProgress = true,
  stageClassName,
  style,
  trackClassName,
  ...props
}: HorizontalStoryRailProps) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const items = React.Children.toArray(children);
  const [metrics, setMetrics] = React.useState({ distance: 0, viewportHeight: 0 });
  const prefersReducedMotion = usePrefersReducedMotion();
  const coarsePointer = useCoarsePointer();
  const viewport = useExperienceViewport();

  const scrollYProgress = useElementScrollProgress(sectionRef);
  const smoothedProgress = useSpring(scrollYProgress, scrollSpring || DEFAULT_SCROLL_SPRING);
  const progress = controlledProgress ?? (scrollSpring === false ? scrollYProgress : smoothedProgress);
  const handleMetricsChange = React.useCallback((next: HorizontalTrackMetrics) => {
    setMetrics({ distance: next.distance, viewportHeight: next.viewportHeight });
  }, []);

  if (prefersReducedMotion) {
    return (
      <section
        ref={sectionRef}
        aria-label={label}
        data-horizontal-story="reduced"
        data-experience-viewport={viewport}
        className={cn("relative", className)}
        style={style}
        {...props}
      >
        <div role="list" className={cn("grid gap-4 py-8", trackClassName)}>
          {items.map((child, index) => {
            const counter = renderCounter?.(index + 1, items.length) ?? `${index + 1} / ${items.length}`;
            const counterLabel = typeof counter === "string" || typeof counter === "number"
              ? String(counter)
              : undefined;
            return (
              <div
                key={React.isValidElement(child) && child.key != null ? child.key : index}
                role="listitem"
                aria-label={counterLabel}
                className={typeof itemClassName === "function" ? itemClassName(index) : itemClassName}
              >
                {counterLabel === undefined ? <span className="sr-only">{counter}</span> : null}
                {child}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (coarsePointer || viewport !== "desktop") {
    return (
      <section ref={sectionRef} aria-label={label} data-horizontal-story="native-snap" data-experience-viewport={viewport} className={cn("relative min-w-0 overflow-hidden", className)} style={style} {...props}>
        <div role="list" className={cn("flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-12 [scrollbar-width:none] sm:gap-6 sm:px-8 sm:py-16 [&::-webkit-scrollbar]:hidden", trackClassName)}>
          {items.map((child, index) => {
            const counter = renderCounter?.(index + 1, items.length) ?? `${index + 1} / ${items.length}`;
            const counterLabel = typeof counter === "string" || typeof counter === "number" ? String(counter) : undefined;
            return <div key={React.isValidElement(child) && child.key != null ? child.key : index} role="listitem" aria-label={counterLabel} className={cn("w-[86vw] shrink-0 snap-center sm:w-[min(68vw,38rem)]", typeof itemClassName === "function" ? itemClassName(index) : itemClassName)}>{counterLabel === undefined ? <span className="sr-only">{counter}</span> : null}{child}</div>;
          })}
        </div>
      </section>
    );
  }

  const scrollHeight = Math.max(
    metrics.viewportHeight * 2,
    metrics.viewportHeight + metrics.distance,
  );

  return (
    <section
      ref={sectionRef}
      aria-label={label}
      data-horizontal-story="vertical-driven"
      data-experience-viewport={viewport}
      className={cn("relative", className)}
      style={{ minHeight: `${Math.max(items.length, 2) * 85}svh`, height: scrollHeight, ...style }}
      {...props}
    >
      <div className={cn("sticky top-0 h-svh overflow-hidden", stageClassName)}>
        <HorizontalTrack
          label={label}
          progress={progress}
          itemClassName={itemClassName}
          renderCounter={renderCounter}
          trackClassName={trackClassName}
          showProgress={showProgress}
          progressClassName={progressClassName}
          progressIndicatorClassName={progressIndicatorClassName}
          onMetricsChange={handleMetricsChange}
        >
          {items}
        </HorizontalTrack>
      </div>
    </section>
  );
}

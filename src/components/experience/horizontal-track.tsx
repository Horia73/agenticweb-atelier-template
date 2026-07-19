"use client";

import * as React from "react";
import { motion, type MotionValue, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

export type HorizontalTrackMetrics = {
  distance: number;
  trackWidth: number;
  viewportHeight: number;
  viewportWidth: number;
};

export type HorizontalTrackProps = Omit<React.ComponentProps<"div">, "children"> & {
  children: React.ReactNode;
  itemClassName?: string | ((index: number) => string | undefined);
  label: string;
  onMetricsChange?: (metrics: HorizontalTrackMetrics) => void;
  progress: MotionValue<number>;
  progressClassName?: string;
  progressIndicatorClassName?: string;
  showProgress?: boolean;
  trackClassName?: string;
};

function sameMetrics(left: HorizontalTrackMetrics, right: HorizontalTrackMetrics) {
  return left.distance === right.distance
    && left.trackWidth === right.trackWidth
    && left.viewportHeight === right.viewportHeight
    && left.viewportWidth === right.viewportWidth;
}

/**
 * A measured horizontal track controlled by an external normalized progress.
 * It owns no sticky section or scroll listener, so it can live inside another
 * timeline, a 2.5D stage, a carousel controller, or a standalone composition.
 */
export function HorizontalTrack({
  children,
  className,
  itemClassName,
  label,
  onMetricsChange,
  progress,
  progressClassName,
  progressIndicatorClassName,
  showProgress = true,
  style,
  trackClassName,
  ...props
}: HorizontalTrackProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const metricsRef = React.useRef<HorizontalTrackMetrics>({
    distance: 0,
    trackWidth: 0,
    viewportHeight: 0,
    viewportWidth: 0,
  });
  const items = React.Children.toArray(children);
  const [distance, setDistance] = React.useState(0);
  const x = useTransform(progress, [0, 1], [0, -distance], { clamp: true });
  const progressScale = useTransform(progress, (value) => Math.max(0, Math.min(1, value)));

  React.useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measure = () => {
      const next: HorizontalTrackMetrics = {
        distance: Math.max(0, track.scrollWidth - viewport.clientWidth),
        trackWidth: track.scrollWidth,
        viewportHeight: viewport.clientHeight,
        viewportWidth: viewport.clientWidth,
      };
      if (sameMetrics(metricsRef.current, next)) return;
      metricsRef.current = next;
      setDistance(next.distance);
      onMetricsChange?.(next);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    measure();
    return () => observer.disconnect();
  }, [items.length, onMetricsChange]);

  return (
    <div
      ref={viewportRef}
      data-horizontal-track-viewport
      className={cn("relative flex h-full w-full items-center overflow-hidden", className)}
      style={style}
      {...props}
    >
      <motion.div
        ref={trackRef}
        role="list"
        aria-label={label}
        data-horizontal-track
        className={cn(
          "flex w-max items-stretch gap-[clamp(1rem,2.5vw,2.5rem)] px-[max(1.25rem,5vw)] will-change-transform",
          trackClassName,
        )}
        style={{ x }}
      >
        {items.map((child, index) => {
          const key = React.isValidElement(child) && child.key != null ? child.key : index;
          const resolvedItemClassName = typeof itemClassName === "function"
            ? itemClassName(index)
            : itemClassName;

          return (
            <div
              key={key}
              role="listitem"
              aria-label={`${index + 1} din ${items.length}`}
              data-horizontal-track-item={index}
              className={cn("w-[min(82vw,62rem)] shrink-0", resolvedItemClassName)}
            >
              {child}
            </div>
          );
        })}
      </motion.div>

      {showProgress ? (
        <div
          aria-hidden
          className={cn(
            "absolute inset-x-[max(1.25rem,5vw)] bottom-6 h-px origin-left bg-current/20",
            progressClassName,
          )}
        >
          <motion.div
            className={cn("h-full origin-left bg-current", progressIndicatorClassName)}
            style={{ scaleX: progressScale }}
          />
        </div>
      ) : null}
    </div>
  );
}

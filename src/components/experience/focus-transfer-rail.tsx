"use client";

import * as React from "react";
import {
  motion,
  type MotionValue,
  useMotionValue,
  useTransform,
} from "motion/react";

import {
  clamp01,
  useCoarsePointer,
  useExperienceViewport,
  usePrefersReducedMotion,
} from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";
import { cn } from "@/lib/utils";

export type FocusTransferRailItem = {
  id: string;
  label: string;
  content: React.ReactNode;
  className?: string;
};

export type FocusTransferRailProps = Omit<
  React.ComponentProps<"section">,
  "children"
> & {
  label: string;
  items: FocusTransferRailItem[];
  progress?: MotionValue<number>;
  activeRatio?: number;
  idleRatio?: number;
  scrollScreensPerStep?: number;
  header?: React.ReactNode;
  overlay?: React.ReactNode;
  stageClassName?: string;
  trackClassName?: string;
  itemClassName?:
    | string
    | ((item: FocusTransferRailItem, index: number) => string | undefined);
  staticClassName?: string;
  staticTrackClassName?: string;
  staticItemClassName?: string;
};

function FocusTransferPanel({
  activeRatio,
  idleRatio,
  index,
  item,
  itemClassName,
  progress,
  total,
}: {
  activeRatio: number;
  idleRatio: number;
  index: number;
  item: FocusTransferRailItem;
  itemClassName?: FocusTransferRailProps["itemClassName"];
  progress: MotionValue<number>;
  total: number;
}) {
  const flexGrow = useTransform(progress, (value) => {
    const activeIndex = clamp01(value) * Math.max(0, total - 1);
    const influence = Math.max(0, 1 - Math.abs(index - activeIndex));
    return idleRatio + (activeRatio - idleRatio) * influence;
  });
  const resolvedClassName =
    typeof itemClassName === "function"
      ? itemClassName(item, index)
      : itemClassName;

  return (
    <motion.article
      aria-label={item.label}
      data-focus-transfer-panel={item.id}
      className={cn(
        "relative min-w-0 overflow-hidden will-change-[flex-grow]",
        resolvedClassName,
        item.className,
      )}
      style={{ flexBasis: 0, flexGrow }}
    >
      {item.content}
    </motion.article>
  );
}

/** Transfers visual priority across a fixed row of React panels as the page scrolls. */
export function FocusTransferRail({
  activeRatio = 2.35,
  className,
  header,
  idleRatio = 1,
  itemClassName,
  items,
  label,
  overlay,
  progress: controlledProgress,
  scrollScreensPerStep = 0.9,
  stageClassName,
  staticClassName,
  staticItemClassName,
  staticTrackClassName,
  style,
  trackClassName,
  ...props
}: FocusTransferRailProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const localProgress = useElementScrollProgress(rootRef);
  const fallbackProgress = useMotionValue(0);
  const progress = controlledProgress ?? localProgress ?? fallbackProgress;
  const reducedMotion = usePrefersReducedMotion();
  const coarsePointer = useCoarsePointer();
  const viewport = useExperienceViewport();
  const staticMode =
    items.length < 2 ||
    reducedMotion ||
    coarsePointer ||
    viewport !== "desktop";

  if (staticMode) {
    return (
      <section
        ref={rootRef}
        aria-label={label}
        data-focus-transfer-rail
        data-experience-viewport={viewport}
        data-static
        className={cn("relative", className, staticClassName)}
        style={style}
        {...props}
      >
        {header}
        <div className={cn("grid gap-4", staticTrackClassName)}>
          {items.map((item, index) => (
            <article
              key={item.id}
              aria-label={item.label}
              data-focus-transfer-panel={item.id}
              className={cn(
                "relative min-w-0 overflow-hidden",
                staticItemClassName,
                typeof itemClassName === "function"
                  ? itemClassName(item, index)
                  : itemClassName,
                item.className,
              )}
            >
              {item.content}
            </article>
          ))}
        </div>
        {overlay ? (
          <div className="pointer-events-none absolute inset-0 z-20">
            {overlay}
          </div>
        ) : null}
      </section>
    );
  }

  const scrollScreens =
    1 + Math.max(0, items.length - 1) * Math.max(0.35, scrollScreensPerStep);

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-focus-transfer-rail
      data-experience-viewport={viewport}
      className={cn("relative", className)}
      style={{ minHeight: `${scrollScreens * 100}svh`, ...style }}
      {...props}
    >
      <div
        className={cn(
          "sticky top-0 flex h-svh min-h-0 flex-col overflow-hidden",
          stageClassName,
        )}
      >
        {header}
        <div className={cn("flex min-h-0", trackClassName)}>
          {items.map((item, index) => (
            <FocusTransferPanel
              key={item.id}
              activeRatio={Math.max(idleRatio, activeRatio)}
              idleRatio={Math.max(0.1, idleRatio)}
              index={index}
              item={item}
              itemClassName={itemClassName}
              progress={progress}
              total={items.length}
            />
          ))}
        </div>
        {overlay ? (
          <div className="pointer-events-none absolute inset-0 z-20">
            {overlay}
          </div>
        ) : null}
      </div>
    </section>
  );
}

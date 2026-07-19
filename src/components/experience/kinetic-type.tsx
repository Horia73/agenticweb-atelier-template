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

export type KineticTypeFrame = {
  blur?: number;
  fontVariationSettings?: string;
  letterSpacing?: string;
  opacity?: number;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  scale?: number;
  x?: number | string;
  y?: number | string;
};

export type KineticTypeSegment = {
  className?: string;
  exit?: KineticTypeFrame;
  exitRange?: [number, number];
  from?: KineticTypeFrame;
  range?: [number, number];
  text: string;
  to?: KineticTypeFrame;
  transformOrigin?: React.CSSProperties["transformOrigin"];
};

type KineticTypeProps = Omit<React.ComponentProps<"section">, "children"> & {
  as?: "h1" | "h2" | "h3" | "p";
  label: string;
  progress?: MotionValue<number>;
  range?: [number, number];
  scrollScreens?: number;
  segmentClassName?: string;
  segments?: KineticTypeSegment[];
  mobileSegments?: KineticTypeSegment[];
  tabletSegments?: KineticTypeSegment[];
  split?: "words" | "characters";
  stageClassName?: string;
  text: string;
  textClassName?: string;
};

function AnimatedSegment({
  defaultRange,
  progress,
  segment,
  segmentClassName,
}: {
  defaultRange: [number, number];
  progress: MotionValue<number>;
  segment: KineticTypeSegment;
  segmentClassName?: string;
}) {
  const range = segment.range ?? defaultRange;
  const from = segment.from ?? {};
  const to = segment.to ?? {};
  const exit = segment.exit;
  const exitRange = segment.exitRange ?? [Math.max(range[1], 0.78), 0.96];
  const input = exit ? [range[0], range[1], exitRange[0], exitRange[1]] : range;
  const track = <T,>(start: T, end: T, exitValue: T): T[] => exit
    ? [start, end, end, exitValue]
    : [start, end];
  const x = useTransform(progress, input, track(from.x ?? 0, to.x ?? 0, exit?.x ?? to.x ?? 0), { clamp: true });
  const y = useTransform(progress, input, track(from.y ?? "0em", to.y ?? "0em", exit?.y ?? to.y ?? "0em"), { clamp: true });
  const scale = useTransform(progress, input, track(from.scale ?? 1, to.scale ?? 1, exit?.scale ?? to.scale ?? 1), { clamp: true });
  const rotate = useTransform(progress, input, track(from.rotate ?? 0, to.rotate ?? 0, exit?.rotate ?? to.rotate ?? 0), { clamp: true });
  const rotateX = useTransform(progress, input, track(from.rotateX ?? 0, to.rotateX ?? 0, exit?.rotateX ?? to.rotateX ?? 0), { clamp: true });
  const rotateY = useTransform(progress, input, track(from.rotateY ?? 0, to.rotateY ?? 0, exit?.rotateY ?? to.rotateY ?? 0), { clamp: true });
  const opacity = useTransform(progress, input, track(from.opacity ?? 1, to.opacity ?? 1, exit?.opacity ?? to.opacity ?? 1), { clamp: true });
  const blur = useTransform(progress, input, track(from.blur ?? 0, to.blur ?? 0, exit?.blur ?? to.blur ?? 0), { clamp: true });
  const filter = useTransform(blur, (value) => `blur(${value}px)`);
  const letterSpacing = useTransform(
    progress,
    input,
    track(from.letterSpacing ?? "0em", to.letterSpacing ?? "0em", exit?.letterSpacing ?? to.letterSpacing ?? "0em"),
    { clamp: true },
  );
  const fontVariationSettings = useTransform(
    progress,
    input,
    track(from.fontVariationSettings ?? "normal", to.fontVariationSettings ?? "normal", exit?.fontVariationSettings ?? to.fontVariationSettings ?? "normal"),
    { clamp: true },
  );

  return (
    <motion.span
      className={cn("inline-block whitespace-pre will-change-transform", segmentClassName, segment.className)}
      style={{
        filter,
        fontVariationSettings,
        letterSpacing,
        opacity,
        rotate,
        rotateX,
        rotateY,
        scale,
        transformOrigin: segment.transformOrigin,
        x,
        y,
      }}
    >
      {segment.text}
    </motion.span>
  );
}

function createFallbackSegments(
  text: string,
  split: NonNullable<KineticTypeProps["split"]>,
): KineticTypeSegment[] {
  const tokens = split === "characters" ? Array.from(text) : text.split(/(\s+)/);
  return tokens.map((token, index) => ({
    text: token,
    from: {
      blur: 5,
      opacity: token.trim() ? 0.12 : 1,
      rotateX: token.trim() ? 38 : 0,
      y: token.trim() ? "0.65em" : "0em",
    },
    to: { blur: 0, opacity: 1, rotateX: 0, y: "0em" },
    transformOrigin: "50% 100%",
    range: [index / Math.max(tokens.length, 1), Math.min(1, (index + 2.4) / Math.max(tokens.length, 1))],
  }));
}

/**
 * Semantic display type with an art-directed segment timeline. The `segments`
 * API is the production path; `split` remains as a useful editorial fallback.
 */
export function KineticType({
  as: Tag = "h2",
  className,
  label,
  mobileSegments,
  progress: controlledProgress,
  range = [0.08, 0.92],
  scrollScreens = 2.6,
  segmentClassName,
  segments,
  split = "words",
  stageClassName,
  style,
  tabletSegments,
  text,
  textClassName,
  ...props
}: KineticTypeProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const viewport = useExperienceViewport();
  const localProgress = useElementScrollProgress(rootRef);
  const progress = controlledProgress ?? localProgress;
  const activeSegments = viewport === "mobile"
    ? mobileSegments ?? tabletSegments ?? segments
    : viewport === "tablet"
      ? tabletSegments ?? segments
      : segments;
  const resolvedSegments = React.useMemo(
    () => activeSegments?.length ? activeSegments : createFallbackSegments(text, split),
    [activeSegments, split, text],
  );
  const warnedRef = React.useRef(false);

  React.useEffect(() => {
    if (process.env.NODE_ENV === "production" || warnedRef.current) return;
    if (resolvedSegments.length <= 120) return;
    warnedRef.current = true;
    console.warn(
      `[KineticType] Animating ${resolvedSegments.length} segments creates roughly `
      + `${resolvedSegments.length * 11} MotionValues. split="characters" on long text is a `
      + "performance cliff; prefer split=\"words\" or an art-directed `segments` timeline.",
    );
  }, [resolvedSegments.length]);

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-kinetic-type={activeSegments?.length ? "segments" : split}
      data-experience-viewport={viewport}
      className={cn("relative", className)}
      style={{ minHeight: reducedMotion ? "auto" : `${Math.max(1, scrollScreens * (viewport === "mobile" ? .76 : viewport === "tablet" ? .88 : 1)) * 100}svh`, ...style }}
      {...props}
    >
      <div className={cn(reducedMotion ? "relative" : "sticky top-0 flex min-h-svh items-center overflow-hidden", stageClassName)}>
        <Tag className={cn("[perspective:1000px]", textClassName)}>
          {reducedMotion ? text : (
            <>
              <span className="sr-only">{text}</span>
              <span aria-hidden className="block">
                {resolvedSegments.map((segment, index) => {
                  const span = Math.max(0.08, range[1] - range[0]);
                  const step = span / Math.max(resolvedSegments.length, 1);
                  const segmentRange: [number, number] = [
                    range[0] + step * index,
                    Math.min(range[1], range[0] + step * (index + 2.2)),
                  ];
                  return (
                    <AnimatedSegment
                      key={`${index}-${segment.text}`}
                      defaultRange={segmentRange}
                      progress={progress}
                      segment={segment}
                      segmentClassName={segmentClassName}
                    />
                  );
                })}
              </span>
            </>
          )}
        </Tag>
      </div>
    </section>
  );
}

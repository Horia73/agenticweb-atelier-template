"use client";

import * as React from "react";
import {
  motion,
  type MotionValue,
  type SpringOptions,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

const subscribeToHydration = () => () => undefined;

function useHydrated() {
  return React.useSyncExternalStore(subscribeToHydration, () => true, () => false);
}

function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = React.useCallback(() => window.matchMedia(query).matches, [query]);
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}

type TimelineValue = number | string;

export type ScrollDepthKeyframe = {
  at: number;
  x?: TimelineValue;
  y?: TimelineValue;
  z?: number;
  scale?: number;
  rotate?: TimelineValue;
  rotateX?: TimelineValue;
  rotateY?: TimelineValue;
  opacity?: number;
  filter?: string;
  clipPath?: string;
};

export type ScrollDepthPointer = {
  x?: number;
  y?: number;
  rotateX?: number;
  rotateY?: number;
  scale?: number;
};

export type LayeredDepthLayer = {
  id: string;
  content: React.ReactNode;
  mobileContent?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  depth?: number;
  timeline?: ScrollDepthKeyframe[];
  mobileTimeline?: ScrollDepthKeyframe[];
  pointer?: false | number | ScrollDepthPointer;
  reducedMotionFrame?: Omit<ScrollDepthKeyframe, "at">;
  transformOrigin?: React.CSSProperties["transformOrigin"];
  ariaHidden?: boolean;
};

export type LayeredDepthSceneProps = Omit<React.ComponentProps<"section">, "children"> & {
  layers: LayeredDepthLayer[];
  label: string;
  overlay?: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  overlayClassName?: string;
  pointerTravel?: number;
  pointerSpring?: SpringOptions;
  progress?: MotionValue<number>;
  reducedMotionFallback?: React.ReactNode;
  scrollScreens?: number;
  scrollSpring?: false | SpringOptions;
  stageClassName?: string;
  stageStyle?: React.CSSProperties;
  mobileBreakpoint?: number;
  onProgressChange?: (progress: number) => void;
  sourceContract?: {
    sourceId: string;
    mode: "segmented-still" | "integrated-occlusion" | "video-matte" | "designed-layers";
    aligned: boolean;
    contactPlates?: number;
  };
};

type ResolvedKeyframe = Required<ScrollDepthKeyframe>;

const STATIC_FRAME: Omit<ResolvedKeyframe, "at"> = {
  x: 0,
  y: 0,
  z: 0,
  scale: 1,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  opacity: 1,
  filter: "none",
  clipPath: "inset(0% 0% 0% 0%)",
};

function defaultTimeline(depth: number): ScrollDepthKeyframe[] {
  return [
    {
      at: 0,
      y: depth * 64,
      scale: 1 + depth * 0.02,
      rotate: -depth * 0.3,
    },
    {
      at: 1,
      y: depth * -96,
      scale: 1 + depth * 0.12,
      rotate: depth * 0.3,
    },
  ];
}

function normalizeTimeline(
  timeline: ScrollDepthKeyframe[] | undefined,
  depth: number,
): ResolvedKeyframe[] {
  const source = timeline?.length ? timeline : defaultTimeline(depth);
  const sorted = [...source]
    .map((frame) => ({ ...frame, at: Math.min(1, Math.max(0, frame.at)) }))
    .sort((left, right) => left.at - right.at);
  const normalized: ResolvedKeyframe[] = [];
  let previous = { ...STATIC_FRAME };

  for (const frame of sorted) {
    previous = { ...previous, ...frame };
    const resolved = { ...previous, at: frame.at } as ResolvedKeyframe;
    const existingIndex = normalized.findIndex((item) => item.at === resolved.at);
    if (existingIndex >= 0) normalized[existingIndex] = resolved;
    else normalized.push(resolved);
  }

  if (normalized.length === 0) normalized.push({ at: 0, ...STATIC_FRAME });
  if (normalized[0]!.at > 0) normalized.unshift({ ...normalized[0]!, at: 0 });
  if (normalized.length === 1 || normalized.at(-1)!.at < 1) {
    normalized.push({ ...normalized.at(-1)!, at: 1 });
  }
  return normalizeTimelineUnits(normalized);
}

const UNIT_KEYS = ["x", "y", "rotate", "rotateX", "rotateY"] as const;

function parseUnit(value: TimelineValue) {
  if (typeof value !== "string") return null;
  return value.trim().match(/^(-?(?:\d+\.?\d*|\.\d+))([a-z%]+)$/i);
}

/** Motion cannot interpolate `0` to `12%` reliably. Keep every key on one unit. */
function normalizeTimelineUnits(frames: ResolvedKeyframe[]) {
  const normalized = frames.map((frame) => ({ ...frame }));

  for (const key of UNIT_KEYS) {
    const parsed = normalized
      .map((frame) => parseUnit(frame[key]))
      .filter((match): match is RegExpMatchArray => Boolean(match));
    if (parsed.length === 0) continue;

    const units = new Set(parsed.map((match) => match[2]!.toLowerCase()));
    if (units.size > 1) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[ScrollDepthScene] ${key} mixes incompatible units: ${[...units].join(", ")}.`,
        );
      }
      continue;
    }

    const unit = parsed[0]![2]!;
    for (const frame of normalized) {
      if (typeof frame[key] === "number") frame[key] = `${frame[key]}${unit}`;
    }
  }

  return normalized;
}

function useTimelineValue<T extends TimelineValue>(
  progress: MotionValue<number>,
  frames: ResolvedKeyframe[],
  key: keyof Omit<ResolvedKeyframe, "at">,
) {
  return useTransform(
    progress,
    frames.map((frame) => frame.at),
    frames.map((frame) => frame[key] as T),
    { clamp: true },
  );
}

type DepthLayerProps = {
  layer: LayeredDepthLayer;
  mobile: boolean;
  pointerTravel: number;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  reducedMotion: boolean;
  scrollProgress: MotionValue<number>;
};

function DepthLayer({
  layer,
  mobile,
  pointerTravel,
  pointerX,
  pointerY,
  reducedMotion,
  scrollProgress,
}: DepthLayerProps) {
  const frames = React.useMemo(
    () => normalizeTimeline(mobile ? layer.mobileTimeline ?? layer.timeline : layer.timeline, layer.depth ?? 0),
    [layer.depth, layer.mobileTimeline, layer.timeline, mobile],
  );
  const x = useTimelineValue<TimelineValue>(scrollProgress, frames, "x");
  const y = useTimelineValue<TimelineValue>(scrollProgress, frames, "y");
  const z = useTimelineValue<number>(scrollProgress, frames, "z");
  const scale = useTimelineValue<number>(scrollProgress, frames, "scale");
  const rotate = useTimelineValue<TimelineValue>(scrollProgress, frames, "rotate");
  const rotateX = useTimelineValue<TimelineValue>(scrollProgress, frames, "rotateX");
  const rotateY = useTimelineValue<TimelineValue>(scrollProgress, frames, "rotateY");
  const opacity = useTimelineValue<number>(scrollProgress, frames, "opacity");
  const filter = useTimelineValue<string>(scrollProgress, frames, "filter");
  const clipPath = useTimelineValue<string>(scrollProgress, frames, "clipPath");

  const defaultPointer = (layer.depth ?? 0) * pointerTravel;
  const pointer = layer.pointer;
  const pointerConfig: Required<ScrollDepthPointer> = pointer === false
    ? { x: 0, y: 0, rotateX: 0, rotateY: 0, scale: 0 }
    : typeof pointer === "number"
      ? { x: pointer, y: pointer, rotateX: 0, rotateY: 0, scale: 0 }
      : {
          x: pointer?.x ?? defaultPointer,
          y: pointer?.y ?? defaultPointer,
          rotateX: pointer?.rotateX ?? 0,
          rotateY: pointer?.rotateY ?? 0,
          scale: pointer?.scale ?? 0,
        };
  const pointerOffsetX = useTransform(pointerX, [-0.5, 0.5], [-pointerConfig.x, pointerConfig.x]);
  const pointerOffsetY = useTransform(pointerY, [-0.5, 0.5], [-pointerConfig.y, pointerConfig.y]);
  const pointerRotateX = useTransform(pointerY, [-0.5, 0.5], [pointerConfig.rotateX, -pointerConfig.rotateX]);
  const pointerRotateY = useTransform(pointerX, [-0.5, 0.5], [-pointerConfig.rotateY, pointerConfig.rotateY]);
  const pointerScale = useTransform(pointerX, [-0.5, 0, 0.5], [1, 1 + pointerConfig.scale, 1]);
  const reducedFrame = { ...STATIC_FRAME, ...layer.reducedMotionFrame };

  return (
    <motion.div
      aria-hidden={layer.ariaHidden ?? true}
      data-depth-layer={layer.id}
      data-depth={layer.depth ?? 0}
      className={cn("absolute inset-0 will-change-transform", layer.className)}
      style={reducedMotion
        ? {
            x: reducedFrame.x,
            y: reducedFrame.y,
            z: reducedFrame.z,
            scale: reducedFrame.scale,
            rotate: reducedFrame.rotate,
            rotateX: reducedFrame.rotateX,
            rotateY: reducedFrame.rotateY,
            opacity: reducedFrame.opacity,
            filter: reducedFrame.filter,
            clipPath: reducedFrame.clipPath,
            transformOrigin: layer.transformOrigin,
          }
        : {
            x,
            y,
            z,
            scale,
            rotate,
            rotateX,
            rotateY,
            opacity,
            filter,
            clipPath,
            transformOrigin: layer.transformOrigin,
          }}
    >
      <motion.div
        className={cn("absolute inset-0 will-change-transform", layer.contentClassName)}
        style={reducedMotion || mobile
          ? undefined
          : {
              x: pointerOffsetX,
              y: pointerOffsetY,
              rotateX: pointerRotateX,
              rotateY: pointerRotateY,
              scale: pointerScale,
              transformStyle: "preserve-3d",
            }}
      >
        {mobile ? layer.mobileContent ?? layer.content : layer.content}
      </motion.div>
    </motion.div>
  );
}

const DEFAULT_POINTER_SPRING: SpringOptions = {
  stiffness: 90,
  damping: 24,
  mass: 0.4,
};

const DEFAULT_SCROLL_SPRING: SpringOptions = {
  stiffness: 130,
  damping: 30,
  mass: 0.25,
};

/**
 * A behavior-only 2.5D scene. Pass separate raster plates and editable React
 * text as ordered layers; every layer can own desktop/mobile keyframes and
 * pointer response. The component intentionally ships no visual direction.
 */
export function LayeredDepthScene({
  layers,
  label,
  overlay,
  overlayClassName,
  pointerSpring = DEFAULT_POINTER_SPRING,
  pointerTravel = 24,
  progress: controlledProgress,
  reducedMotionFallback,
  scrollScreens = 3,
  scrollSpring = false,
  stageClassName,
  stageStyle,
  mobileBreakpoint = 768,
  onProgressChange,
  sourceContract,
  className,
  style,
  onPointerLeave,
  onPointerMove,
  ...props
}: LayeredDepthSceneProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const rawPointerX = useMotionValue(0);
  const rawPointerY = useMotionValue(0);
  const pointerX = useSpring(rawPointerX, pointerSpring);
  const pointerY = useSpring(rawPointerY, pointerSpring);
  const reducedMotionPreference = useReducedMotion();
  const mounted = useHydrated();
  const mobile = useMediaQuery(`(max-width: ${mobileBreakpoint - 0.02}px)`);
  const prefersReducedMotion = mounted && Boolean(reducedMotionPreference);
  const scrollYProgress = useElementScrollProgress(rootRef);
  const smoothedProgress = useSpring(scrollYProgress, scrollSpring || DEFAULT_SCROLL_SPRING);
  const sceneProgress = controlledProgress ?? (scrollSpring === false ? scrollYProgress : smoothedProgress);

  useMotionValueEvent(sceneProgress, "change", (value) => onProgressChange?.(value));

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!prefersReducedMotion && !mobile && event.pointerType !== "touch") {
      const rect = event.currentTarget.getBoundingClientRect();
      rawPointerX.set((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5);
      rawPointerY.set((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5);
    }
    onPointerMove?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    rawPointerX.set(0);
    rawPointerY.set(0);
    onPointerLeave?.(event);
  };

  if (prefersReducedMotion && reducedMotionFallback) {
    return (
      <section
        ref={rootRef}
        aria-label={label}
        data-depth-scene
        data-depth-source={sourceContract?.sourceId}
        data-depth-source-mode={sourceContract?.mode}
        data-depth-aligned={sourceContract?.aligned || undefined}
        data-depth-contact-plates={sourceContract?.contactPlates}
        data-reduced-motion
        className={cn("relative isolate", className)}
        style={style}
        {...props}
      >
        {reducedMotionFallback}
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-depth-scene
      data-depth-source={sourceContract?.sourceId}
      data-depth-source-mode={sourceContract?.mode}
      data-depth-aligned={sourceContract?.aligned || undefined}
      data-depth-contact-plates={sourceContract?.contactPlates}
      data-mobile={mobile || undefined}
      data-reduced-motion={prefersReducedMotion || undefined}
      className={cn("relative isolate", className)}
      style={{
        minHeight: prefersReducedMotion ? "100svh" : `${Math.max(1, scrollScreens) * 100}svh`,
        ...style,
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <div
        data-depth-stage
        className={cn(
          "top-0 h-svh overflow-hidden",
          prefersReducedMotion ? "relative" : "sticky",
          stageClassName,
        )}
        style={{ perspective: 1200, ...stageStyle }}
      >
        <div className="absolute inset-0 [transform-style:preserve-3d]">
          {layers.map((layer) => (
            <DepthLayer
              key={`${mobile ? "mobile" : "desktop"}-${layer.id}`}
              layer={layer}
              mobile={mobile}
              pointerTravel={pointerTravel}
              pointerX={pointerX}
              pointerY={pointerY}
              reducedMotion={prefersReducedMotion}
              scrollProgress={sceneProgress}
            />
          ))}
        </div>
        {overlay ? (
          <div className={cn("pointer-events-none absolute inset-0 z-20", overlayClassName)}>
            {typeof overlay === "function" ? overlay(sceneProgress) : overlay}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export const ScrollDepthScene = LayeredDepthScene;

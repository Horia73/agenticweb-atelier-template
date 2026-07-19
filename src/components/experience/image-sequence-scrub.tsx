"use client";

import * as React from "react";
import Image from "next/image";
import {
  type MotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";

import { cn } from "@/lib/utils";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

const subscribeToHydration = () => () => undefined;

function useHydrated() {
  return React.useSyncExternalStore(subscribeToHydration, () => true, () => false);
}

export type ImageSequenceScrubProps = Omit<React.ComponentProps<"section">, "children"> & {
  alt: string;
  frames: string[];
  label: string;
  mobileFrames?: string[];
  objectFit?: "cover" | "contain";
  overlay?: React.ReactNode;
  poster: string;
  preloadRadius?: number;
  progress?: MotionValue<number>;
  scrollScreens?: number;
  stageClassName?: string;
};

function drawFrame(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  objectFit: "cover" | "contain",
) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height || !image.naturalWidth || !image.naturalHeight) return;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * ratio);
  const height = Math.round(rect.height * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return;
  const scale = objectFit === "cover"
    ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
    : Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.clearRect(0, 0, width, height);
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

/** Native vertical scroll scrubs an optimized still-image sequence on one canvas. */
export function ImageSequenceScrub({
  alt,
  className,
  frames,
  label,
  mobileFrames,
  objectFit = "cover",
  overlay,
  poster,
  preloadRadius = 6,
  progress: controlledProgress,
  scrollScreens = 4,
  stageClassName,
  style,
  ...props
}: ImageSequenceScrubProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imagesRef = React.useRef(new Map<number, HTMLImageElement>());
  const frameRef = React.useRef(0);
  const mounted = useHydrated();
  const reducedMotionPreference = useReducedMotion();
  const reducedMotion = mounted && Boolean(reducedMotionPreference);
  const [mobile, setMobile] = React.useState(false);
  const sources = mobile && mobileFrames?.length ? mobileFrames : frames;
  const scrollYProgress = useElementScrollProgress(rootRef);
  const progress = controlledProgress ?? scrollYProgress;

  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 767.98px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const loadFrame = React.useCallback((index: number) => {
    const src = sources[index];
    if (!src || imagesRef.current.has(index)) return;
    const image = new window.Image();
    image.decoding = "async";
    image.src = src;
    imagesRef.current.set(index, image);
    image.addEventListener("load", () => {
      if (frameRef.current === index && canvasRef.current) {
        drawFrame(canvasRef.current, image, objectFit);
      }
    }, { once: true });
  }, [objectFit, sources]);

  const renderIndex = React.useCallback((index: number) => {
    if (sources.length === 0) return;
    const safeIndex = Math.max(0, Math.min(sources.length - 1, index));
    frameRef.current = safeIndex;
    const start = Math.max(0, safeIndex - preloadRadius);
    const end = Math.min(sources.length - 1, safeIndex + preloadRadius);
    for (let frame = start; frame <= end; frame += 1) loadFrame(frame);
    const image = imagesRef.current.get(safeIndex);
    if (image?.complete && canvasRef.current) drawFrame(canvasRef.current, image, objectFit);
  }, [loadFrame, objectFit, preloadRadius, sources.length]);

  React.useEffect(() => {
    imagesRef.current.clear();
    renderIndex(0);
  }, [renderIndex, sources]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => renderIndex(frameRef.current));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [renderIndex]);

  useMotionValueEvent(progress, "change", (value) => {
    renderIndex(Math.round(value * Math.max(0, sources.length - 1)));
  });

  if (reducedMotion || sources.length < 2) {
    return (
      <section ref={rootRef} aria-label={label} className={cn("relative isolate min-h-svh", className)} style={style} {...props}>
        <Image alt={alt} src={poster} fill sizes="100vw" className={cn("-z-10", objectFit === "cover" ? "object-cover" : "object-contain")} />
        {overlay}
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-image-sequence
      className={cn("relative isolate", className)}
      style={{ minHeight: `${Math.max(2, scrollScreens) * 100}svh`, ...style }}
      {...props}
    >
      <div className={cn("sticky top-0 h-svh overflow-hidden", stageClassName)}>
        <Image alt={alt} src={poster} fill priority sizes="100vw" className={cn("-z-10", objectFit === "cover" ? "object-cover" : "object-contain")} />
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />
        {overlay ? <div className="absolute inset-0 z-10">{overlay}</div> : null}
      </div>
    </section>
  );
}

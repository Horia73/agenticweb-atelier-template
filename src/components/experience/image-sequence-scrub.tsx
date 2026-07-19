"use client";

import * as React from "react";
import Image from "next/image";
import {
  type MotionValue,
  useMotionValueEvent,
} from "motion/react";

import { cn } from "@/lib/utils";
import {
  getExperienceDprCap,
  useExperienceViewport,
  usePrefersReducedMotion,
} from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type ImageSequenceScrubProps = Omit<React.ComponentProps<"section">, "children"> & {
  alt: string;
  frames: string[];
  label: string;
  mobileFrames?: string[];
  mobilePoster?: string;
  objectFit?: "cover" | "contain";
  overlay?: React.ReactNode;
  poster: string;
  preloadRadius?: number;
  progress?: MotionValue<number>;
  scrollScreens?: number;
  stageClassName?: string;
  tabletFrames?: string[];
  tabletPoster?: string;
};

function drawFrame(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  objectFit: "cover" | "contain",
) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height || !image.naturalWidth || !image.naturalHeight) return;

  const ratio = Math.min(window.devicePixelRatio || 1, getExperienceDprCap(rect.width));
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
  mobilePoster,
  objectFit = "cover",
  overlay,
  poster,
  preloadRadius = 6,
  progress: controlledProgress,
  scrollScreens = 4,
  stageClassName,
  style,
  tabletFrames,
  tabletPoster,
  ...props
}: ImageSequenceScrubProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imagesRef = React.useRef(new Map<number, HTMLImageElement>());
  const frameRef = React.useRef(0);
  const reducedMotion = usePrefersReducedMotion();
  const viewport = useExperienceViewport();
  const sources = viewport === "mobile" && mobileFrames?.length
    ? mobileFrames
    : viewport === "tablet" && tabletFrames?.length
      ? tabletFrames
      : frames;
  const activePoster = viewport === "mobile"
    ? mobilePoster ?? tabletPoster ?? poster
    : viewport === "tablet"
      ? tabletPoster ?? poster
      : poster;
  const activePreloadRadius = Math.min(preloadRadius, viewport === "mobile" ? 3 : viewport === "tablet" ? 5 : preloadRadius);
  const scrollYProgress = useElementScrollProgress(rootRef);
  const progress = controlledProgress ?? scrollYProgress;

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
    const start = Math.max(0, safeIndex - activePreloadRadius);
    const end = Math.min(sources.length - 1, safeIndex + activePreloadRadius);
    for (let frame = start; frame <= end; frame += 1) loadFrame(frame);
    // Evict decoded frames far outside the preload window (keeping the first and
    // last frame) so long sequences do not retain every frame forever.
    const evictionDistance = activePreloadRadius * 3;
    for (const cachedIndex of imagesRef.current.keys()) {
      if (cachedIndex === 0 || cachedIndex === sources.length - 1) continue;
      if (Math.abs(cachedIndex - safeIndex) > evictionDistance) {
        imagesRef.current.delete(cachedIndex);
      }
    }
    const image = imagesRef.current.get(safeIndex);
    if (image?.complete && canvasRef.current) drawFrame(canvasRef.current, image, objectFit);
  }, [activePreloadRadius, loadFrame, objectFit, sources.length]);

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
      <section ref={rootRef} aria-label={label} data-image-sequence data-experience-viewport={viewport} data-static className={cn("relative isolate min-h-svh", className)} style={style} {...props}>
        <Image alt={alt} src={activePoster} fill sizes="100vw" className={cn("-z-10", objectFit === "cover" ? "object-cover" : "object-contain")} />
        {overlay}
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-image-sequence
      data-experience-viewport={viewport}
      className={cn("relative isolate", className)}
      style={{ minHeight: `${Math.max(2, scrollScreens) * 100}svh`, ...style }}
      {...props}
    >
      <div className={cn("sticky top-0 h-svh overflow-hidden", stageClassName)}>
        <div className="absolute inset-0 -z-10">
          <Image alt={alt} src={activePoster} fill priority sizes="100vw" className={objectFit === "cover" ? "object-cover" : "object-contain"} />
        </div>
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />
        {overlay ? <div className="absolute inset-0 z-10">{overlay}</div> : null}
      </div>
    </section>
  );
}

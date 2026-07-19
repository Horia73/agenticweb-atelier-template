"use client";

import * as React from "react";
import { motion, type MotionValue, useMotionValue, useReducedMotion, useTransform } from "motion/react";

import { cn } from "@/lib/utils";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type SliceRecomposeProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  src: string;
  alt: string;
  axis?: "vertical" | "horizontal";
  slices?: number;
  scatter?: number;
  rotation?: number;
  stagger?: number;
  trigger?: "scroll" | "hover" | "controlled";
  progress?: MotionValue<number>;
  scrollScreens?: number;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  stageClassName?: string;
};

function Slice({ axis, count, index, progress, rotation, scatter, src, stagger }: { axis: "vertical" | "horizontal"; count: number; index: number; progress: MotionValue<number>; rotation: number; scatter: number; src: string; stagger: number }) {
  const delay = (index / Math.max(1, count - 1)) * stagger;
  const start = Math.min(.75, delay);
  const end = Math.min(1, .62 + delay);
  const direction = index % 2 === 0 ? -1 : 1;
  const travel = useTransform(progress, [start, end], [direction * scatter * (1 + (index % 3) * .12), 0]);
  const rotate = useTransform(progress, [start, end], [direction * rotation, 0]);
  const opacity = useTransform(progress, [start, Math.min(1, start + .16)], [0, 1]);
  const scale = useTransform(progress, [start, end], [1.08, 1]);
  const clipStart = index * 100 / count;
  const clipEnd = (index + 1) * 100 / count;
  const overlap = .075;
  const clipPath = axis === "vertical"
    ? `inset(0 ${Math.max(0, 100 - clipEnd - overlap)}% 0 ${Math.max(0, clipStart - overlap)}%)`
    : `inset(${Math.max(0, clipStart - overlap)}% 0 ${Math.max(0, 100 - clipEnd - overlap)}% 0)`;
  return <motion.div aria-hidden className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform" style={{ x: axis === "vertical" ? travel : 0, y: axis === "horizontal" ? travel : 0, rotate, opacity, scale, clipPath, backgroundImage: `url("${src.replaceAll('"', '%22')}")` }} />;
}

/** Rebuilds one source from editable image strips, driven by scroll, hover or an external motion value. */
export function SliceRecompose({
  alt,
  axis = "vertical",
  children,
  className,
  fallback,
  label,
  progress: controlledProgress,
  rotation = 8,
  scatter = 180,
  scrollScreens = 2.6,
  slices = 9,
  src,
  stageClassName,
  stagger = .24,
  trigger = "scroll",
  onPointerEnter,
  onPointerLeave,
  ...props
}: SliceRecomposeProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const hoverProgress = useMotionValue(0);
  const localProgress = useElementScrollProgress(rootRef);
  const progress = controlledProgress ?? (trigger === "hover" ? hoverProgress : localProgress);
  const reducedMotion = useReducedMotion();
  const count = Math.max(2, Math.min(24, Math.round(slices)));
  const handlePointerEnter = (event: React.PointerEvent<HTMLElement>) => { if (trigger === "hover") hoverProgress.set(1); onPointerEnter?.(event); };
  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => { if (trigger === "hover") hoverProgress.set(0); onPointerLeave?.(event); };
  const content = <div className={cn(trigger === "scroll" ? "sticky top-0 h-svh" : "relative h-full", "overflow-hidden", stageClassName)}><span className="sr-only">{alt}</span>{reducedMotion ? <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${src.replaceAll('"', '%22')}")` }} /> : Array.from({ length: count }, (_, index) => <Slice key={index} axis={axis} count={count} index={index} progress={progress} rotation={rotation} scatter={scatter} src={src} stagger={stagger} />)}{reducedMotion && fallback ? <div className="absolute inset-0">{fallback}</div> : null}<div className="relative h-full">{children}</div></div>;
  return <section ref={rootRef} aria-label={label} data-slice-recompose data-axis={axis} className={cn("relative", trigger !== "scroll" && "h-svh", className)} style={trigger === "scroll" ? { minHeight: `${Math.max(1, scrollScreens) * 100}svh` } : undefined} onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave} {...props}>{content}</section>;
}

"use client";

import * as React from "react";
import { motion, type MotionValue, useMotionValue, useReducedMotion, useTransform } from "motion/react";

import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type FilmStrip3DItem = { id: string; label: string; content: React.ReactNode; className?: string };
export type FilmStrip3DProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  items: FilmStrip3DItem[];
  progress?: MotionValue<number>;
  scrollScreens?: number;
  spacing?: number;
  curve?: number;
  perspective?: number;
  stageClassName?: string;
  itemClassName?: string | ((item: FilmStrip3DItem, index: number) => string | undefined);
  overlay?: React.ReactNode;
};

function FilmFrame({ curve, index, item, itemClassName, progress, spacing, total }: { curve: number; index: number; item: FilmStrip3DItem; itemClassName?: FilmStrip3DProps["itemClassName"]; progress: MotionValue<number>; spacing: number; total: number }) {
  const position = useTransform(progress, (value) => index - value * Math.max(0, total - 1));
  const x = useTransform(position, (value) => value * spacing);
  const z = useTransform(position, (value) => -Math.abs(value) * curve);
  const rotateY = useTransform(position, (value) => Math.max(-52, Math.min(52, -value * 18)));
  const rotateZ = useTransform(position, (value) => Math.max(-4, Math.min(4, value * 1.8)));
  const opacity = useTransform(position, (value) => Math.max(0, 1 - Math.max(0, Math.abs(value) - 2.2) * .55));
  const scale = useTransform(position, (value) => Math.max(.74, 1 - Math.abs(value) * .075));
  return <motion.article aria-label={item.label} className={cn("absolute left-1/2 top-1/2 aspect-[4/5] w-[min(68vw,28rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] shadow-2xl will-change-transform", typeof itemClassName === "function" ? itemClassName(item, index) : itemClassName, item.className)} style={{ x, z, rotateY, rotateZ, opacity, scale, transformStyle: "preserve-3d" }}>{item.content}</motion.article>;
}

/** A continuous curved film strip; several frames remain visible while one frame reaches focus. */
export function FilmStrip3D({ className, curve = 190, itemClassName, items, label, overlay, perspective = 1200, progress: controlledProgress, scrollScreens = 4.2, spacing = 430, stageClassName, ...props }: FilmStrip3DProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const localProgress = useElementScrollProgress(rootRef);
  const fallbackProgress = useMotionValue(0);
  const progress = controlledProgress ?? localProgress ?? fallbackProgress;
  const reducedMotion = useReducedMotion();
  const narrow = useMediaQuery("(max-width: 639.98px)");
  if (reducedMotion || narrow) return <section ref={rootRef} aria-label={label} data-film-strip-3d data-static className={cn("min-h-svh overflow-hidden py-24", className, stageClassName)} {...props}><div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 [scrollbar-width:none]">{items.map((item, index) => <article key={item.id} aria-label={item.label} className={cn("aspect-[4/5] w-[78vw] shrink-0 snap-center overflow-hidden rounded-[2rem]", typeof itemClassName === "function" ? itemClassName(item, index) : itemClassName, item.className)}>{item.content}</article>)}</div>{overlay}</section>;
  return <section ref={rootRef} aria-label={label} data-film-strip-3d className={cn("relative", className)} style={{ minHeight: `${Math.max(1, scrollScreens) * 100}svh` }} {...props}><div className={cn("sticky top-0 h-svh overflow-hidden", stageClassName)} style={{ perspective: `${perspective}px`, perspectiveOrigin: "50% 48%" }}><div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>{items.map((item, index) => <FilmFrame key={item.id} curve={curve} index={index} item={item} itemClassName={itemClassName} progress={progress} spacing={spacing} total={items.length} />)}</div>{overlay ? <div className="pointer-events-none absolute inset-0 z-20">{overlay}</div> : null}</div></section>;
}

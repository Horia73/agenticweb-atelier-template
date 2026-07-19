"use client";

import * as React from "react";
import { motion, type MotionValue, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type TypographyDepthTunnelItem = {
  id: string;
  content: React.ReactNode;
  accessibleText: string;
  className?: string;
  align?: "start" | "center" | "end";
};

export type TypographyDepthTunnelProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  items: TypographyDepthTunnelItem[];
  progress?: MotionValue<number>;
  scrollScreens?: number;
  perspective?: number;
  depth?: number;
  smoothing?: number;
  className?: string;
  stageClassName?: string;
  footer?: React.ReactNode;
};

function TunnelLayer({ depth, index, item, progress, total }: { depth: number; index: number; item: TypographyDepthTunnelItem; progress: MotionValue<number>; total: number }) {
  const slot = 1 / Math.max(1, total);
  const center = (index + .5) * slot;
  const enter = Math.max(0, center - slot * .54);
  const focusStart = Math.max(0, center - slot * .2);
  const focusEnd = Math.min(1, center + slot * .2);
  const exit = Math.min(1, center + slot * .54);
  const fadeOut = Math.min(1, center + slot * .42);
  const z = useTransform(progress, [enter, focusStart, focusEnd, exit], [-depth * 1.55, -depth * .48, depth * .08, depth * .95]);
  const opacity = useTransform(progress, [enter, focusStart, focusEnd, fadeOut], [0, 1, 1, 0]);
  const scale = useTransform(progress, [enter, focusStart, focusEnd, exit], [.52, .88, 1.04, 1.3]);
  const filter = useTransform(progress, [enter, focusStart, focusEnd, exit], ["blur(18px)", "blur(0px)", "blur(0px)", "blur(14px)"]);
  return <motion.div aria-hidden className={cn("absolute inset-x-0 top-1/2 flex -translate-y-1/2", item.align === "start" ? "justify-start" : item.align === "end" ? "justify-end" : "justify-center", item.className)} style={{ opacity, scale, filter, z }}>{item.content}</motion.div>;
}

/** Semantic scroll typography mapped onto a CSS 3D camera tunnel. */
export function TypographyDepthTunnel({
  className,
  depth = 900,
  footer,
  items,
  label,
  perspective = 1000,
  progress: controlledProgress,
  scrollScreens = 4.2,
  smoothing = 92,
  stageClassName,
  ...props
}: TypographyDepthTunnelProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const localProgress = useElementScrollProgress(rootRef);
  const fallbackProgress = useMotionValue(0);
  const rawProgress = controlledProgress ?? localProgress ?? fallbackProgress;
  const progress = useSpring(rawProgress, { stiffness: smoothing, damping: 28, mass: .42 });
  const reducedMotion = useReducedMotion();
  const narrow = useMediaQuery("(max-width: 639.98px)");
  if (reducedMotion || narrow) {
    return <section ref={rootRef} aria-label={label} data-typography-depth-tunnel data-static className={cn("grid min-h-svh content-center gap-8 overflow-hidden px-5 py-28", className, stageClassName)} {...props}>{items.map((item) => <div key={item.id} className={cn("text-balance", item.className)}>{item.content}</div>)}{footer}</section>;
  }
  return (
    <section ref={rootRef} aria-label={label} data-typography-depth-tunnel className={cn("relative", className)} style={{ minHeight: `${Math.max(1, scrollScreens) * 100}svh` }} {...props}>
      <ol className="sr-only">{items.map((item) => <li key={item.id}>{item.accessibleText}</li>)}</ol>
      <div className={cn("sticky top-0 h-svh overflow-hidden", stageClassName)} style={{ perspective: `${perspective}px`, perspectiveOrigin: "50% 50%" }}>
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>{items.map((item, index) => <TunnelLayer key={item.id} depth={depth} index={index} item={item} progress={progress} total={items.length} />)}</div>
        {footer ? <div className="absolute inset-x-0 bottom-0 z-10">{footer}</div> : null}
      </div>
    </section>
  );
}

"use client";

import * as React from "react";
import {
  motion,
  type MotionValue,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type MediaPortalProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  backdrop: React.ReactNode;
  media: React.ReactNode;
  children?: React.ReactNode;
  shape?: "circle" | "rounded" | "vertical" | "diamond";
  trigger?: "scroll" | "hover" | "controlled";
  progress?: MotionValue<number>;
  scrollScreens?: number;
  portalClassName?: string;
  stageClassName?: string;
  reducedMotionFallback?: React.ReactNode;
};

const SHAPES = {
  circle: {
    top: [43, 35, 0],
    right: [25, 21, 0],
    bottom: [43, 35, 0],
    left: [61, 53, 0],
    radius: [999, 999, 0],
  },
  rounded: {
    top: [28, 18, 0],
    right: [38, 25, 0],
    bottom: [28, 18, 0],
    left: [38, 25, 0],
    radius: [40, 48, 0],
  },
  vertical: {
    top: [8, 8, 0],
    right: [47, 34, 0],
    bottom: [8, 8, 0],
    left: [47, 34, 0],
    radius: [999, 48, 0],
  },
  diamond: {
    top: [43, 22, -20],
    right: [43, 22, -20],
    bottom: [43, 22, -20],
    left: [43, 22, -20],
    radius: [0, 0, 0],
  },
} as const;

/** A behavior-only aperture that promotes any React media into a full viewport beat. */
export function MediaPortal({
  backdrop,
  children,
  className,
  label,
  media,
  portalClassName,
  progress: controlledProgress,
  reducedMotionFallback,
  scrollScreens = 2.6,
  shape = "circle",
  stageClassName,
  trigger = "scroll",
  ...props
}: MediaPortalProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const hoverTarget = useMotionValue(0);
  const scrollProgress = useElementScrollProgress(rootRef);
  const source = trigger === "controlled" && controlledProgress
    ? controlledProgress
    : trigger === "hover"
      ? hoverTarget
      : scrollProgress;
  const reducedMotion = useReducedMotion();
  const progress = useSpring(source, { stiffness: 125, damping: 30, mass: 0.25 });
  const shapeConfig = SHAPES[shape];
  const top = useTransform(progress, [0, 0.32, 1], shapeConfig.top.map((value) => `${value}%`));
  const right = useTransform(progress, [0, 0.32, 1], shapeConfig.right.map((value) => `${value}%`));
  const bottom = useTransform(progress, [0, 0.32, 1], shapeConfig.bottom.map((value) => `${value}%`));
  const left = useTransform(progress, [0, 0.32, 1], shapeConfig.left.map((value) => `${value}%`));
  const borderRadius = useTransform(progress, [0, 0.42, 1], [...shapeConfig.radius]);
  const rotate = useTransform(progress, [0, 0.55, 1], shape === "diamond" ? [45, 45, 0] : [0, 0, 0]);
  const mediaRotate = useTransform(progress, [0, 0.55, 1], shape === "diamond" ? [-45, -45, 0] : [0, 0, 0]);
  const scale = useTransform(progress, [0, 0.4, 1], [0.9, 1, 1]);
  const ringOpacity = useTransform(progress, [0, 0.18, 0.7, 1], [0.85, 1, 0.4, 0]);
  const backdropScale = useTransform(progress, [0, 1], [1, 1.08]);
  const backdropOpacity = useTransform(progress, [0, 0.72, 1], [1, 0.72, 0]);

  if (reducedMotion) {
    return <section ref={rootRef} aria-label={label} data-media-portal data-reduced-motion className={cn("relative min-h-svh overflow-hidden", className)} {...props}>{reducedMotionFallback ?? media}{children ? <div className="pointer-events-none absolute inset-0">{children}</div> : null}</section>;
  }

  const scrollDriven = trigger !== "hover";
  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-media-portal
      data-shape={shape}
      data-trigger={trigger}
      className={cn("relative isolate", className)}
      style={{ minHeight: scrollDriven ? `${Math.max(1, scrollScreens) * 100}svh` : "100svh" }}
      onPointerEnter={() => hoverTarget.set(1)}
      onPointerLeave={() => hoverTarget.set(0)}
      {...props}
    >
      <div className={cn(scrollDriven ? "sticky top-0" : "relative", "h-svh overflow-hidden", stageClassName)}>
        <motion.div aria-hidden className="absolute inset-0" style={{ scale: backdropScale, opacity: backdropOpacity }}>
          {backdrop}
        </motion.div>
        <motion.div
          className={cn("absolute overflow-hidden will-change-[top,right,bottom,left,border-radius,transform]", portalClassName)}
          style={{ borderRadius, bottom, left, right, rotate, scale, top }}
        >
          <motion.div className={cn("absolute", shape === "diamond" ? "-inset-[22%]" : "inset-0")} style={{ rotate: mediaRotate }}>
            {media}
          </motion.div>
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 border border-white/45 shadow-[inset_0_0_80px_rgb(255_255_255/.14),0_0_70px_rgb(255_255_255/.2)]" style={{ borderRadius, opacity: ringOpacity }} />
        </motion.div>
        <div className="pointer-events-none absolute inset-0">{children}</div>
      </div>
    </section>
  );
}

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
    clip: ["circle(7% at 68% 52%)", "circle(13% at 68% 52%)", "circle(74% at 54% 50%)"],
    radius: ["50%", "50%", "0%"],
  },
  rounded: {
    clip: ["inset(28% 38% 28% 38% round 2.5rem)", "inset(18% 25% 18% 25% round 3rem)", "inset(0% 0% 0% 0% round 0rem)"],
    radius: ["2.5rem", "3rem", "0rem"],
  },
  vertical: {
    clip: ["inset(8% 47% 8% 47% round 999px)", "inset(8% 34% 8% 34% round 3rem)", "inset(0% 0% 0% 0% round 0rem)"],
    radius: ["999px", "3rem", "0rem"],
  },
  diamond: {
    clip: ["polygon(50% 43%, 57% 50%, 50% 57%, 43% 50%)", "polygon(50% 22%, 78% 50%, 50% 78%, 22% 50%)", "polygon(50% -45%, 145% 50%, 50% 145%, -45% 50%)"],
    radius: ["0px", "0px", "0px"],
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
  const clipPath = useTransform(progress, [0, 0.32, 1], [...shapeConfig.clip]);
  const borderRadius = useTransform(progress, [0, 0.42, 1], [...shapeConfig.radius]);
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
        <motion.div className={cn("absolute inset-0 overflow-hidden will-change-[clip-path,transform]", portalClassName)} style={{ clipPath, borderRadius, scale }}>
          {media}
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 border border-white/45 shadow-[inset_0_0_80px_rgb(255_255_255/.14),0_0_70px_rgb(255_255_255/.2)]" style={{ borderRadius, opacity: ringOpacity }} />
        </motion.div>
        <div className="pointer-events-none absolute inset-0">{children}</div>
      </div>
    </section>
  );
}

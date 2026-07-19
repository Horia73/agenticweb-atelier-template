"use client";

import * as React from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";
import {
  useFinePointer,
  usePrefersReducedMotion,
} from "@/components/experience/experience-runtime";

type CursorAmbientProps = Omit<React.ComponentProps<"div">, "children"> & {
  base: React.ReactNode;
  reveal: React.ReactNode;
  children?: React.ReactNode;
  cursorLabel?: string;
  label: string;
  lensClassName?: string;
  lensSize?: number;
};

/**
 * A kinetic cursor lens that reveals a second visual state. It is intentionally
 * scoped to its canvas and becomes a static base visual on touch/reduced motion.
 */
export function CursorAmbient({
  base,
  children,
  className,
  cursorLabel = "EXPLORE",
  label,
  lensClassName,
  lensSize = 220,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  reveal,
  style,
  ...props
}: CursorAmbientProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const radius = useMotionValue(0);
  const opacity = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 420, damping: 38, mass: 0.35 });
  const smoothY = useSpring(y, { stiffness: 420, damping: 38, mass: 0.35 });
  const smoothRadius = useSpring(radius, { stiffness: 240, damping: 25, mass: 0.3 });
  const smoothOpacity = useSpring(opacity, { stiffness: 260, damping: 28 });
  const ringX = useTransform(smoothX, (value) => value - lensSize / 2);
  const ringY = useTransform(smoothY, (value) => value - lensSize / 2);
  const clipPath = useMotionTemplate`circle(${smoothRadius}px at ${smoothX}px ${smoothY}px)`;
  const prefersReducedMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();
  const [activeLabel, setActiveLabel] = React.useState(cursorLabel);
  // rAF-coalesced label lookup: the `.closest` walk runs at most once per frame.
  const labelLookupRef = React.useRef({ frame: 0, target: null as HTMLElement | null });

  React.useEffect(() => {
    const labelLookup = labelLookupRef.current;
    return () => cancelAnimationFrame(labelLookup.frame);
  }, []);

  const scheduleLabelUpdate = (target: HTMLElement) => {
    const labelLookup = labelLookupRef.current;
    labelLookup.target = target;
    if (labelLookup.frame) return;
    labelLookup.frame = requestAnimationFrame(() => {
      labelLookup.frame = 0;
      const hit = labelLookup.target?.closest<HTMLElement>("[data-cursor-label]");
      const next = hit?.dataset.cursorLabel || cursorLabel;
      setActiveLabel((current) => (current === next ? current : next));
    });
  };

  const canFollow = finePointer && !prefersReducedMotion;
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (canFollow) {
      const rect = event.currentTarget.getBoundingClientRect();
      x.set(event.clientX - rect.left);
      y.set(event.clientY - rect.top);
      radius.set(lensSize / 2);
      opacity.set(1);
      scheduleLabelUpdate(event.target as HTMLElement);
    }
    onPointerMove?.(event);
  };
  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (canFollow) {
      const rect = event.currentTarget.getBoundingClientRect();
      x.set(event.clientX - rect.left);
      y.set(event.clientY - rect.top);
      radius.set(lensSize / 2);
      opacity.set(1);
    }
    onPointerEnter?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    const labelLookup = labelLookupRef.current;
    radius.set(0);
    opacity.set(0);
    cancelAnimationFrame(labelLookup.frame);
    labelLookup.frame = 0;
    labelLookup.target = null;
    setActiveLabel(cursorLabel);
    onPointerLeave?.(event);
  };

  return (
    <div
      role="region"
      aria-label={label}
      data-cursor-lens
      className={cn("relative isolate overflow-hidden", className)}
      style={{ cursor: canFollow ? "none" : undefined, ...style }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      {...props}
    >
      <div className="absolute inset-0">{base}</div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 will-change-[clip-path]"
        style={{ clipPath }}
      >
        {reveal}
      </motion.div>
      {children ? <div className="absolute inset-0 z-10">{children}</div> : null}

      {canFollow ? (
        <motion.div
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 top-0 z-30 grid rounded-full border border-current text-[0.62rem] font-semibold tracking-[0.18em] will-change-transform",
            lensClassName,
          )}
          style={{
            width: lensSize,
            height: lensSize,
            x: ringX,
            y: ringY,
            opacity: smoothOpacity,
          }}
        >
          <span className="place-self-center">{activeLabel}</span>
        </motion.div>
      ) : null}
    </div>
  );
}

export const CursorLens = CursorAmbient;

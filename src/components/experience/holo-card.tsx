"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { damp, useFinePointer, usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type HoloCardProps = React.ComponentProps<"div"> & {
  children: React.ReactNode;
  /** Maximum tilt in degrees. */
  maxTilt?: number;
  /** Glare highlight strength (0 disables the layer). */
  glare?: number;
  /** Holographic foil strength (0 disables the layer). */
  foil?: number;
  /** Gradient stops for the foil rainbow. */
  foilStops?: string[];
  /** Optional CSS mask image URL so the foil only shows through a pattern. */
  foilMaskSrc?: string;
  scaleOnHover?: number;
  radius?: number;
  smoothing?: number;
  cardClassName?: string;
};

const DEFAULT_FOIL_STOPS = ["#ff2d92", "#ffd23e", "#3effe0", "#5a7bff", "#c04dff", "#ff2d92"];

/**
 * A trading-card style holographic tilt: the card follows the pointer in 3D
 * while a rainbow foil and a glare highlight sweep across it. Touch and
 * reduced-motion render the card static; content semantics stay in `children`.
 */
export function HoloCard({
  cardClassName,
  children,
  className,
  foil = 0.7,
  foilMaskSrc,
  foilStops = DEFAULT_FOIL_STOPS,
  glare = 0.75,
  maxTilt = 10,
  radius = 20,
  scaleOnHover = 1.035,
  smoothing = 11,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  ...props
}: HoloCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const foilRef = React.useRef<HTMLDivElement>(null);
  const glareRef = React.useRef<HTMLDivElement>(null);
  const rectRef = React.useRef<DOMRect | null>(null);
  const stateRef = React.useRef({ rx: 0, ry: 0, px: 0.5, py: 0.5, presence: 0 });
  const targetRef = React.useRef({ rx: 0, ry: 0, px: 0.5, py: 0.5, presence: 0 });
  const wakeRef = React.useRef<() => void>(() => undefined);
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  const interactive = finePointer && !reducedMotion;

  const foilGradient = `linear-gradient(115deg, ${foilStops.join(", ")})`;

  // The damped tilt loop lives in one effect and sleeps once the card settles;
  // pointer handlers only move targets and wake it.
  React.useEffect(() => {
    if (!interactive) return;
    let frame = 0;
    let running = false;
    const applyFrame = () => {
      const card = cardRef.current;
      if (!card) return;
      const state = stateRef.current;
      card.style.transform = `perspective(900px) rotateX(${state.rx.toFixed(2)}deg) rotateY(${state.ry.toFixed(2)}deg) scale(${(1 + (scaleOnHover - 1) * state.presence).toFixed(4)})`;
      const foilLayer = foilRef.current;
      if (foilLayer) {
        foilLayer.style.opacity = `${(foil * state.presence * 0.9).toFixed(3)}`;
        foilLayer.style.backgroundPosition = `${(50 + (state.px - 0.5) * 90).toFixed(2)}% ${(50 + (state.py - 0.5) * 90).toFixed(2)}%`;
      }
      const glareLayer = glareRef.current;
      if (glareLayer) {
        glareLayer.style.opacity = `${(glare * state.presence).toFixed(3)}`;
        glareLayer.style.background = `radial-gradient(circle at ${(state.px * 100).toFixed(1)}% ${(state.py * 100).toFixed(1)}%, rgba(255,255,255,.55), rgba(255,255,255,.12) 32%, transparent 62%)`;
      }
    };
    const tick = () => {
      const state = stateRef.current;
      const target = targetRef.current;
      const delta = 1 / 60;
      state.rx = damp(state.rx, target.rx, smoothing, delta);
      state.ry = damp(state.ry, target.ry, smoothing, delta);
      state.px = damp(state.px, target.px, smoothing, delta);
      state.py = damp(state.py, target.py, smoothing, delta);
      state.presence = damp(state.presence, target.presence, smoothing, delta);
      applyFrame();
      const settled =
        Math.abs(state.rx - target.rx) < 0.02 &&
        Math.abs(state.ry - target.ry) < 0.02 &&
        Math.abs(state.px - target.px) < 0.002 &&
        Math.abs(state.py - target.py) < 0.002 &&
        Math.abs(state.presence - target.presence) < 0.005;
      if (settled) {
        running = false;
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    wakeRef.current = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };
    return () => {
      cancelAnimationFrame(frame);
      running = false;
      wakeRef.current = () => undefined;
    };
  }, [foil, glare, interactive, scaleOnHover, smoothing]);

  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (interactive && event.pointerType !== "touch") {
      rectRef.current = event.currentTarget.getBoundingClientRect();
      targetRef.current.presence = 1;
      wakeRef.current();
    }
    onPointerEnter?.(event);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (interactive && event.pointerType !== "touch") {
      const rect = rectRef.current ?? event.currentTarget.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(1, rect.width)));
      const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(1, rect.height)));
      const target = targetRef.current;
      target.px = px;
      target.py = py;
      target.ry = (px - 0.5) * 2 * maxTilt;
      target.rx = (0.5 - py) * 2 * maxTilt;
      target.presence = 1;
      wakeRef.current();
    }
    onPointerMove?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = targetRef.current;
    target.rx = 0;
    target.ry = 0;
    target.px = 0.5;
    target.py = 0.5;
    target.presence = 0;
    rectRef.current = null;
    if (interactive) wakeRef.current();
    onPointerLeave?.(event);
  };

  const maskStyle = foilMaskSrc
    ? {
        maskImage: `url("${foilMaskSrc}")`,
        maskSize: "cover",
        WebkitMaskImage: `url("${foilMaskSrc}")`,
        WebkitMaskSize: "cover",
      }
    : undefined;

  return (
    <div
      data-holo-card
      data-static={!interactive || undefined}
      className={cn("relative", className)}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <div
        ref={cardRef}
        className={cn("relative overflow-hidden will-change-transform", cardClassName)}
        style={{ borderRadius: radius, transform: "perspective(900px)" }}
      >
        {children}
        {foil > 0 && interactive ? (
          <div
            ref={foilRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-color-dodge"
            style={{ background: foilGradient, backgroundSize: "340% 340%", ...maskStyle }}
          />
        ) : null}
        {glare > 0 && interactive ? (
          <div ref={glareRef} aria-hidden className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay" />
        ) : null}
      </div>
    </div>
  );
}

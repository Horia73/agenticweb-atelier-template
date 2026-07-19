"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useExperienceViewport, useFinePointer, usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type ImageTrailProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  /** Image sources cycled along the trail. */
  images: string[];
  children?: React.ReactNode;
  /** Rendered instead of the trail on touch / reduced-motion. */
  fallback?: React.ReactNode;
  /** Card width in pixels. */
  size?: number;
  /** Pointer distance in pixels between two spawned cards. */
  threshold?: number;
  /** Lifetime of one card in milliseconds. */
  lifeMs?: number;
  /** Number of pooled cards (the visual trail length). */
  maxActive?: number;
  /** Random rotation jitter in degrees. */
  rotationJitter?: number;
  imageClassName?: string;
};

/**
 * An editorial pointer trail: moving the cursor scatters a decaying trail of
 * image cards behind it. Content stays in `children`; the trail is decorative.
 */
export function ImageTrail({
  children,
  className,
  fallback,
  imageClassName,
  images,
  label,
  lifeMs = 1000,
  maxActive = 8,
  rotationJitter = 14,
  size = 180,
  threshold = 96,
  ...props
}: ImageTrailProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const poolRef = React.useRef<Array<HTMLDivElement | null>>([]);
  const stateRef = React.useRef({ lastX: 0, lastY: 0, distance: 0, slot: 0, image: 0, primed: false });
  const reducedMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();
  const viewport = useExperienceViewport();
  const active = finePointer && !reducedMotion && images.length > 0 && viewport !== "mobile";
  const activeSize = size * (viewport === "tablet" ? 0.78 : 1);
  const activeThreshold = threshold * (viewport === "tablet" ? 1.18 : 1);
  const activeLifeMs = lifeMs * (viewport === "tablet" ? 0.82 : 1);
  const activeMax = Math.min(maxActive, viewport === "tablet" ? 5 : maxActive);

  React.useEffect(() => {
    if (!active) return;
    const loaders = images.map((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      return image;
    });
    return () => {
      loaders.forEach((image) => {
        image.src = "";
      });
    };
  }, [active, images]);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!active || event.pointerType === "touch") return;
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const state = stateRef.current;
    if (!state.primed) {
      state.primed = true;
      state.lastX = x;
      state.lastY = y;
      return;
    }
    state.distance += Math.hypot(x - state.lastX, y - state.lastY);
    state.lastX = x;
    state.lastY = y;
    if (state.distance < activeThreshold) return;
    state.distance = 0;

    const card = poolRef.current[state.slot];
    state.slot = (state.slot + 1) % Math.max(1, activeMax);
    if (!card) return;
    const img = card.firstElementChild as HTMLImageElement | null;
    if (img) {
      img.src = images[state.image % images.length]!;
      state.image += 1;
    }
    const rotation = (Math.random() - 0.5) * 2 * rotationJitter;
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    card.getAnimations().forEach((animation) => animation.cancel());
    card.animate(
      [
        { opacity: 0, transform: `translate(-50%, -50%) scale(0.55) rotate(${rotation * 1.6}deg)` },
        { opacity: 1, transform: `translate(-50%, -50%) scale(1) rotate(${rotation}deg)`, offset: 0.18 },
        { opacity: 1, transform: `translate(-50%, -46%) scale(1) rotate(${rotation}deg)`, offset: 0.62 },
        { opacity: 0, transform: `translate(-50%, -38%) scale(0.92) rotate(${rotation * 0.6}deg)` },
      ],
      { duration: activeLifeMs, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "forwards" },
    );
  };

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-image-trail
      data-experience-viewport={viewport}
      data-static={!active || undefined}
      className={cn("relative isolate overflow-hidden", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        stateRef.current.primed = false;
        stateRef.current.distance = 0;
      }}
      {...props}
    >
      {active ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {Array.from({ length: Math.max(1, activeMax) }, (_, index) => (
            <div
              key={index}
              ref={(node) => {
                poolRef.current[index] = node;
              }}
              className="absolute opacity-0 will-change-transform"
              style={{ width: activeSize }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- registry source stays framework-neutral. */}
              <img alt="" draggable={false} className={cn("aspect-[4/5] w-full rounded-xl object-cover shadow-2xl", imageClassName)} />
            </div>
          ))}
        </div>
      ) : (
        fallback && <div className="absolute inset-0 -z-10">{fallback}</div>
      )}
      {children}
    </section>
  );
}

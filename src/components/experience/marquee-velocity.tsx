"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { damp, usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type MarqueeVelocityProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  children: React.ReactNode;
  /** Base travel speed in pixels per second. */
  speed?: number;
  /** 1 moves left-to-right content leftwards, -1 the other way. */
  direction?: 1 | -1;
  /** How strongly scroll velocity boosts the marquee (0 disables the coupling). */
  velocityInfluence?: number;
  /** Cap for the velocity boost multiplier. */
  maxBoost?: number;
  /** Reverse travel while the user scrolls upward. */
  flipOnScroll?: boolean;
  /** Ease the strip to a stop while hovered. */
  pauseOnHover?: boolean;
  gap?: number;
  trackClassName?: string;
  contentClassName?: string;
};

/**
 * An infinite marquee whose speed and direction react to scroll velocity.
 * Reduced-motion users get a static, natively scrollable strip.
 */
export function MarqueeVelocity({
  children,
  className,
  contentClassName,
  direction = 1,
  flipOnScroll = true,
  gap = 48,
  label,
  maxBoost = 4,
  pauseOnHover = false,
  speed = 80,
  trackClassName,
  velocityInfluence = 1.6,
  ...props
}: MarqueeVelocityProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const hoveredRef = React.useRef(false);
  const [copies, setCopies] = React.useState(2);
  const reducedMotion = usePrefersReducedMotion();

  React.useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const content = contentRef.current;
    if (!root || !track || !content || reducedMotion) return;

    let disposed = false;
    let frame = 0;
    let previous = performance.now();
    let offset = 0;
    let contentWidth = Math.max(1, content.offsetWidth + gap);
    let onScreen = true;
    let lastScrollY = window.scrollY;
    let smoothedScrollVelocity = 0;
    let pauseFactor = 1;

    const measure = () => {
      contentWidth = Math.max(1, content.offsetWidth + gap);
      const needed = Math.max(2, Math.ceil((root.clientWidth * 2) / contentWidth) + 1);
      setCopies((current) => (current === needed ? current : needed));
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(root);
    resizeObserver.observe(content);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = Boolean(entry?.isIntersecting);
      },
      { rootMargin: "10% 0px" },
    );
    intersectionObserver.observe(root);

    const render = (time: number) => {
      if (disposed) return;
      const delta = Math.min(0.05, Math.max(0.001, (time - previous) / 1000));
      previous = time;
      if (onScreen && document.visibilityState === "visible") {
        const scrollY = window.scrollY;
        const scrollVelocity = (scrollY - lastScrollY) / delta;
        lastScrollY = scrollY;
        smoothedScrollVelocity = damp(smoothedScrollVelocity, scrollVelocity, 8, delta);
        pauseFactor = damp(pauseFactor, pauseOnHover && hoveredRef.current ? 0 : 1, 10, delta);

        const boost = Math.min(maxBoost, Math.abs(smoothedScrollVelocity) * (velocityInfluence / 1000));
        let travelDirection = direction;
        if (flipOnScroll && smoothedScrollVelocity < -40) travelDirection = (direction * -1) as 1 | -1;
        offset -= travelDirection * speed * (1 + boost) * pauseFactor * delta;
        offset = ((offset % contentWidth) + contentWidth) % contentWidth;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }
      frame = requestAnimationFrame(render);
    };

    measure();
    frame = requestAnimationFrame(render);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [direction, flipOnScroll, gap, maxBoost, pauseOnHover, reducedMotion, speed, velocityInfluence]);

  if (reducedMotion) {
    return (
      <section aria-label={label} data-marquee-velocity data-static className={cn("relative overflow-x-auto", className)} {...props}>
        <div className={cn("flex w-max items-center", contentClassName)} style={{ gap }}>
          {children}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-marquee-velocity
      className={cn("relative overflow-hidden", className)}
      onPointerEnter={() => {
        hoveredRef.current = true;
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
      }}
      {...props}
    >
      <div ref={trackRef} className={cn("flex w-max items-center will-change-transform", trackClassName)} style={{ gap }}>
        {Array.from({ length: copies }, (_, index) => (
          <div
            key={index}
            ref={index === 0 ? contentRef : undefined}
            aria-hidden={index > 0 || undefined}
            className={cn("flex shrink-0 items-center", contentClassName)}
            style={{ gap }}
          >
            {children}
          </div>
        ))}
      </div>
    </section>
  );
}

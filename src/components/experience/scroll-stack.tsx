"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { clamp01, usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type ScrollStackProps = React.ComponentProps<"section"> & {
  label: string;
  /** Each direct child becomes one stacked card. */
  children: React.ReactNode;
  /** Sticky offset of the first card from the viewport top, in pixels. */
  topOffset?: number;
  /** Extra sticky offset per card so covered headers stay visible, in pixels. */
  peek?: number;
  /** Vertical rhythm between cards while they are still in flow, in pixels. */
  gap?: number;
  /** How much a fully covered card scales down. */
  scaleStep?: number;
  /** How much a fully covered card darkens (0..1). */
  dim?: number;
  itemClassName?: string;
};

/**
 * Stacking cards: each card pins below the viewport top and the next one
 * slides over it, gently scaling and dimming what it covers — the classic
 * services/process pattern. Everything is derived from live measurements, so
 * cards can have any height, and scrolling back replays the stack in reverse.
 * Reduced motion renders a plain vertical list.
 */
export function ScrollStack({
  children,
  className,
  dim = 0.35,
  gap = 24,
  itemClassName,
  label,
  peek = 16,
  scaleStep = 0.05,
  topOffset = 96,
  ...props
}: ScrollStackProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const items = React.Children.toArray(children);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;
    let frame = 0;
    let onScreen = true;
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-stack-item]"));
    const inners = cards.map((card) => card.querySelector<HTMLElement>("[data-scroll-stack-inner]"));
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!onScreen) return;
        for (let index = 0; index < cards.length - 1; index += 1) {
          const inner = inners[index];
          const next = cards[index + 1];
          if (!inner || !next) continue;
          const rect = inner.getBoundingClientRect();
          // 0 while the next card is still below, 1 once it fully covers this one.
          const covered = clamp01(1 - (next.getBoundingClientRect().top - rect.top) / Math.max(1, rect.height));
          inner.style.transform = covered > 0 ? `scale(${(1 - covered * scaleStep).toFixed(4)})` : "";
          inner.style.filter = covered > 0 && dim > 0 ? `brightness(${(1 - covered * dim).toFixed(3)})` : "";
        }
      });
    };
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = Boolean(entry?.isIntersecting);
        if (onScreen) update();
      },
      { rootMargin: "20% 0px" },
    );
    intersectionObserver.observe(root);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(root);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [dim, reducedMotion, scaleStep, items.length]);

  if (reducedMotion) {
    return (
      <section ref={rootRef} aria-label={label} data-scroll-stack data-static className={className} {...props}>
        <div className="flex flex-col" style={{ gap }}>
          {items.map((item, index) => (
            <div key={index} className={itemClassName}>
              {item}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={rootRef} aria-label={label} data-scroll-stack className={className} {...props}>
      {items.map((item, index) => (
        <div
          key={index}
          data-scroll-stack-item
          className="sticky"
          style={{ top: topOffset + index * peek, marginTop: index === 0 ? 0 : gap }}
        >
          <div data-scroll-stack-inner className={cn("origin-top will-change-transform", itemClassName)}>
            {item}
          </div>
        </div>
      ))}
    </section>
  );
}

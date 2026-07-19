"use client";

import * as React from "react";
import { useMotionValue } from "motion/react";

/**
 * Stable `start start` → `end end` progress for pinned sections. It measures
 * the section itself, so progress remains monotonic all the way to the final
 * pixel and does not wrap when a sticky child releases.
 */
export function useElementScrollProgress(
  target: React.RefObject<HTMLElement | null>,
  mode: "pinned" | "entry" = "pinned",
) {
  const progress = useMotionValue(0);

  React.useEffect(() => {
    const element = target.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      const value = mode === "entry"
        ? (window.innerHeight - rect.top) / Math.max(1, element.offsetHeight)
        : -rect.top / Math.max(1, element.offsetHeight - window.innerHeight);
      progress.set(Math.max(0, Math.min(1, value)));
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    // Synchronous first measurement: consumers that render a bootstrap frame
    // before the first animation frame (e.g. a restored scroll position in a
    // background tab) already see the true progress.
    measure();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [mode, progress, target]);

  return progress;
}

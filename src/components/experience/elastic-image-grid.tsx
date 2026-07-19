"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  damp,
  useCoarsePointer,
  usePrefersReducedMotion,
} from "@/components/experience/experience-runtime";

export type ElasticImageGridItem = { id: string; label: string; content: React.ReactNode; className?: string };
export type ElasticImageGridProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  items: ElasticImageGridItem[];
  minItemWidth?: number;
  radius?: number;
  maxTravel?: number;
  maxScale?: number;
  maxTilt?: number;
  smoothing?: number;
  gridClassName?: string;
  itemClassName?: string | ((item: ElasticImageGridItem, index: number) => string | undefined);
  header?: React.ReactNode;
};

type ElasticItemState = { x: number; y: number; scale: number; rotateX: number; rotateY: number };

const REST_STATE: ElasticItemState = { x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0 };

function isAtRest(state: ElasticItemState) {
  return (
    Math.abs(state.x) < 0.1
    && Math.abs(state.y) < 0.1
    && Math.abs(state.scale - 1) < 0.001
    && Math.abs(state.rotateX) < 0.01
    && Math.abs(state.rotateY) < 0.01
  );
}

/** A semantic image grid with a bounded spring field; no cursor replacement and no touch hijacking. */
export function ElasticImageGrid({
  className,
  gridClassName,
  header,
  itemClassName,
  items,
  label,
  maxScale = .075,
  maxTilt = 3.5,
  maxTravel = 34,
  minItemWidth = 260,
  radius = 420,
  smoothing = 10,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  ...props
}: ElasticImageGridProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef(new Map<string, HTMLElement>());
  const pointerRef = React.useRef({ x: 0, y: 0, active: false });
  const statesRef = React.useRef(new Map<string, ElasticItemState>());
  const wakeRef = React.useRef<() => void>(() => undefined);
  const reducedMotion = usePrefersReducedMotion();
  const coarse = useCoarsePointer();
  const staticMode = reducedMotion || coarse;

  React.useEffect(() => {
    if (staticMode) return;
    const root = rootRef.current;
    const grid = gridRef.current;
    if (!root || !grid) return;
    const itemElements = itemRefs.current;
    const motionStates = statesRef.current;
    // Item centers cached in viewport space; the rAF loop never reads layout.
    const centers = new Map<string, { x: number; y: number }>();
    const scrollOffset = { x: window.scrollX, y: window.scrollY };
    let frame = 0;
    let measureFrame = 0;
    let running = false;
    let disposed = false;
    let intersecting = false;
    let previous = performance.now();

    const restCenter = (element: HTMLElement, id: string) => {
      // Subtract the applied translation so the cache stores the rest position.
      const rect = element.getBoundingClientRect();
      const state = motionStates.get(id);
      return {
        x: rect.left + rect.width / 2 - (state?.x ?? 0),
        y: rect.top + rect.height / 2 - (state?.y ?? 0),
      };
    };
    const measure = () => {
      scrollOffset.x = window.scrollX;
      scrollOffset.y = window.scrollY;
      itemElements.forEach((element, id) => {
        centers.set(id, restCenter(element, id));
      });
    };
    const scheduleMeasure = () => {
      if (measureFrame) return;
      measureFrame = requestAnimationFrame(() => {
        measureFrame = 0;
        measure();
      });
    };

    const settle = () => {
      itemElements.forEach((element, id) => {
        element.style.transform = "";
        motionStates.set(id, { ...REST_STATE });
      });
    };

    const render = (time: number) => {
      if (disposed) return;
      frame = 0;
      if (!intersecting || document.visibilityState !== "visible") {
        running = false;
        return;
      }
      const delta = Math.min(.05, Math.max(.001, (time - previous) / 1000));
      previous = time;
      const pointer = pointerRef.current;
      let settled = !pointer.active;
      itemElements.forEach((element, id) => {
        let center = centers.get(id);
        if (!center) {
          center = restCenter(element, id);
          centers.set(id, center);
        }
        const dx = pointer.x - center.x;
        const dy = pointer.y - center.y;
        const distance = Math.hypot(dx, dy);
        const influence = pointer.active ? Math.max(0, 1 - distance / radius) : 0;
        const targetX = distance ? (dx / distance) * maxTravel * influence : 0;
        const targetY = distance ? (dy / distance) * maxTravel * influence : 0;
        const state = motionStates.get(id) ?? { ...REST_STATE };
        state.x = damp(state.x, targetX, smoothing, delta);
        state.y = damp(state.y, targetY, smoothing, delta);
        state.scale = damp(state.scale, 1 + maxScale * influence, smoothing, delta);
        state.rotateX = damp(state.rotateX, -(dy / Math.max(1, radius)) * maxTilt * influence, smoothing, delta);
        state.rotateY = damp(state.rotateY, (dx / Math.max(1, radius)) * maxTilt * influence, smoothing, delta);
        motionStates.set(id, state);
        element.style.transform = `translate3d(${state.x}px,${state.y}px,0) rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg) scale(${state.scale})`;
        if (settled && !isAtRest(state)) settled = false;
      });
      if (settled) {
        // Idle stop: pointer left and every item converged, so stop scheduling.
        settle();
        running = false;
        return;
      }
      frame = requestAnimationFrame(render);
    };

    const wake = () => {
      if (disposed || running) return;
      running = true;
      previous = performance.now();
      measure();
      frame = requestAnimationFrame(render);
    };
    wakeRef.current = wake;

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      intersecting = Boolean(entry?.isIntersecting);
      if (intersecting) wake();
    }, { rootMargin: "20% 0px" });
    intersectionObserver.observe(root);
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(grid);
    const handleScroll = () => {
      // Shift the cached centers by the scroll delta instead of re-reading layout.
      const nextX = window.scrollX;
      const nextY = window.scrollY;
      const deltaX = nextX - scrollOffset.x;
      const deltaY = nextY - scrollOffset.y;
      scrollOffset.x = nextX;
      scrollOffset.y = nextY;
      if (!deltaX && !deltaY) return;
      centers.forEach((center) => {
        center.x -= deltaX;
        center.y -= deltaY;
      });
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") wake();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      disposed = true;
      wakeRef.current = () => undefined;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(measureFrame);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", scheduleMeasure);
      document.removeEventListener("visibilitychange", handleVisibility);
      itemElements.forEach((element) => {
        element.style.transform = "";
      });
      motionStates.clear();
    };
  }, [maxScale, maxTilt, maxTravel, radius, smoothing, staticMode]);

  const trackPointer = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    pointerRef.current = { x: event.clientX, y: event.clientY, active: true };
    wakeRef.current();
  };
  const handlePointerEnter = (event: React.PointerEvent<HTMLElement>) => {
    trackPointer(event);
    onPointerEnter?.(event);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    trackPointer(event);
    onPointerMove?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    pointerRef.current.active = false;
    onPointerLeave?.(event);
  };

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-elastic-image-grid
      data-static={staticMode || undefined}
      className={cn("relative", className)}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      {header}
      <div
        ref={gridRef}
        className={cn("grid gap-4", gridClassName)}
        style={{ gridTemplateColumns: `repeat(auto-fit,minmax(min(100%,${minItemWidth}px),1fr))` }}
      >
        {items.map((item, index) => (
          <article
            ref={(node) => {
              if (node) itemRefs.current.set(item.id, node);
              else itemRefs.current.delete(item.id);
            }}
            key={item.id}
            aria-label={item.label}
            className={cn(
              "relative transform-gpu overflow-hidden rounded-[2rem] will-change-transform",
              typeof itemClassName === "function" ? itemClassName(item, index) : itemClassName,
              item.className,
            )}
          >
            {item.content}
          </article>
        ))}
      </div>
    </section>
  );
}

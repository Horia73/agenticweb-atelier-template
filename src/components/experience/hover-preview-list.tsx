"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { damp, useFinePointer, usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type HoverPreviewItem = {
  id: string;
  /** The visible row (typically a link). Stays fully semantic. */
  content: React.ReactNode;
  /** Media shown in the floating panel while this row is active. */
  preview: React.ReactNode;
};

export type HoverPreviewListProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: string;
  items: HoverPreviewItem[];
  /** Floating panel width in pixels. */
  previewWidth?: number;
  /** Width / height ratio of the floating panel. */
  previewAspect?: number;
  /** Pointer-follow smoothing; higher is snappier. */
  smoothing?: number;
  /** Maximum tilt in degrees derived from horizontal velocity (0 disables). */
  maxTilt?: number;
  /**
   * Render each item's preview inline inside the row on touch/reduced motion
   * so mobile still shows the media. Disable when the rows already contain
   * their own thumbnails.
   */
  inlineFallback?: boolean;
  listClassName?: string;
  itemClassName?: string | ((index: number, active: boolean) => string);
  previewClassName?: string;
  inlinePreviewClassName?: string;
};

/**
 * An editorial index list: hovering (or keyboard-focusing) a row reveals a
 * floating media panel that follows the cursor with damped motion and tilts
 * with velocity, crossfading as the active row changes. On touch and reduced
 * motion the panel is skipped and each row can render its preview inline, so
 * the list stays a plain, fully semantic block of rows.
 */
export function HoverPreviewList({
  className,
  inlineFallback = true,
  inlinePreviewClassName,
  itemClassName,
  items,
  label,
  listClassName,
  maxTilt = 6,
  previewAspect = 4 / 3,
  previewClassName,
  previewWidth = 320,
  smoothing = 10,
  ...props
}: HoverPreviewListProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const targetRef = React.useRef({ x: 0, y: 0, presence: 0 });
  const stateRef = React.useRef({ x: 0, y: 0, presence: 0, tilt: 0 });
  const wakeRef = React.useRef<() => void>(() => undefined);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  const floating = finePointer && !reducedMotion;
  const previewHeight = previewWidth / previewAspect;

  React.useEffect(() => {
    if (!floating) return;
    let frame = 0;
    let running = false;
    let previous = performance.now();
    const tick = (time: number) => {
      const panel = panelRef.current;
      if (!panel) return;
      const delta = Math.min(0.05, Math.max(0.001, (time - previous) / 1000));
      previous = time;
      const state = stateRef.current;
      const target = targetRef.current;
      const previousX = state.x;
      state.x = damp(state.x, target.x, smoothing, delta);
      state.y = damp(state.y, target.y, smoothing, delta);
      state.presence = damp(state.presence, target.presence, smoothing + 2, delta);
      const velocity = (state.x - previousX) / delta;
      state.tilt = damp(state.tilt, Math.max(-maxTilt, Math.min(maxTilt, velocity / 60)), 8, delta);
      panel.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) rotate(${state.tilt.toFixed(2)}deg) scale(${(0.86 + state.presence * 0.14).toFixed(3)})`;
      panel.style.opacity = state.presence.toFixed(3);
      const settled =
        Math.abs(state.x - target.x) < 0.3 &&
        Math.abs(state.y - target.y) < 0.3 &&
        Math.abs(state.presence - target.presence) < 0.004 &&
        Math.abs(state.tilt) < 0.05;
      if (settled) {
        running = false;
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    wakeRef.current = () => {
      if (running) return;
      running = true;
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    };
    return () => {
      cancelAnimationFrame(frame);
      running = false;
      wakeRef.current = () => undefined;
    };
  }, [floating, maxTilt, smoothing]);

  const moveTo = (clientX: number, clientY: number) => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const target = targetRef.current;
    // Clamp so the panel never leaves the list's bounds.
    target.x = Math.min(rect.width - previewWidth * 0.5, Math.max(-previewWidth * 0.1, clientX - rect.left - previewWidth * 0.5));
    target.y = Math.min(rect.height - previewHeight * 0.6, Math.max(-previewHeight * 0.25, clientY - rect.top - previewHeight * 0.5));
    wakeRef.current();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!floating || event.pointerType === "touch") return;
    moveTo(event.clientX, event.clientY);
  };
  const activate = (id: string) => {
    setActiveId(id);
    targetRef.current.presence = 1;
    wakeRef.current();
  };
  const deactivate = () => {
    setActiveId(null);
    targetRef.current.presence = 0;
    wakeRef.current();
  };
  // Keyboard parity: focusing a row anchors the panel beside it.
  const handleRowFocus = (id: string, event: React.FocusEvent<HTMLLIElement>) => {
    activate(id);
    if (!floating) return;
    const rect = event.currentTarget.getBoundingClientRect();
    moveTo(rect.right - previewWidth * 0.4, rect.top + rect.height / 2);
  };

  const resolveItemClassName = (index: number, active: boolean) =>
    typeof itemClassName === "function" ? itemClassName(index, active) : itemClassName;

  return (
    <div
      ref={rootRef}
      aria-label={label}
      data-hover-preview-list
      data-static={!floating || undefined}
      className={cn("relative", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={deactivate}
      {...props}
    >
      <ul className={cn("relative z-10", listClassName)}>
        {items.map((item, index) => {
          const active = activeId === item.id;
          return (
            <li
              key={item.id}
              data-active={active || undefined}
              className={resolveItemClassName(index, active)}
              onPointerEnter={(event) => {
                if (floating && event.pointerType !== "touch") activate(item.id);
              }}
              onFocus={(event) => handleRowFocus(item.id, event)}
              onBlur={deactivate}
            >
              {item.content}
              {!floating && inlineFallback ? (
                <div className={cn("relative overflow-hidden", inlinePreviewClassName)}>{item.preview}</div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {floating ? (
        <div
          ref={panelRef}
          aria-hidden
          className={cn("pointer-events-none absolute left-0 top-0 z-20 overflow-hidden opacity-0 will-change-transform", previewClassName)}
          style={{ width: previewWidth, height: previewHeight }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="absolute inset-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(.22,.61,.21,1)]"
              style={{ opacity: activeId === item.id ? 1 : 0, transform: activeId === item.id ? "scale(1)" : "scale(1.08)" }}
            >
              {item.preview}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import * as React from "react";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/components/experience/experience-runtime";

export type SpatialCanvasItem = {
  id: string;
  x: number;
  y: number;
  width?: number;
  label: string;
  content: React.ReactNode;
  className?: string;
};

export type SpatialCanvasView = { x: number; y: number; zoom: number };

export type SpatialCanvasProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  items: SpatialCanvasItem[];
  worldSize?: [number, number];
  initialView?: SpatialCanvasView;
  minZoom?: number;
  maxZoom?: number;
  showControls?: boolean;
  gridSize?: number;
  stageClassName?: string;
  itemClassName?: string | ((item: SpatialCanvasItem, index: number) => string | undefined);
  onViewChange?: (view: SpatialCanvasView) => void;
  instructions?: string;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  resetLabel?: string;
};

type DragState = { pointerId: number; x: number; y: number; startX: number; startY: number; currentX: number; currentY: number };

/** A drag-and-keyboard spatial plane. Page wheel remains native unless Ctrl/⌘ is held. */
export function SpatialCanvas({
  className,
  gridSize = 72,
  initialView = { x: 0, y: 0, zoom: 1 },
  instructions = "Drag or use the arrow keys to pan. Hold Control or Command and scroll to zoom.",
  itemClassName,
  items,
  label,
  maxZoom = 1.8,
  minZoom = .55,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onViewChange,
  onWheel,
  resetLabel = "Reset view",
  showControls = true,
  stageClassName,
  worldSize = [2200, 1500],
  zoomInLabel = "Zoom in",
  zoomOutLabel = "Zoom out",
  ...props
}: SpatialCanvasProps) {
  const reducedMotion = useReducedMotion();
  const narrow = useMediaQuery("(max-width: 639.98px)");
  const [view, setView] = React.useState(initialView);
  const dragRef = React.useRef<DragState | null>(null);
  const planeRef = React.useRef<HTMLDivElement>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);
  const updateView = React.useCallback((next: SpatialCanvasView | ((current: SpatialCanvasView) => SpatialCanvasView)) => {
    setView((current) => {
      // While dragging, the committed state lags the on-screen pan; fold the
      // live drag offset in so discrete zoom/keyboard updates stay coherent.
      const drag = dragRef.current;
      const base = drag ? { ...current, x: drag.currentX, y: drag.currentY } : current;
      const value = typeof next === "function" ? next(base) : next;
      const resolved = { x: value.x, y: value.y, zoom: Math.max(minZoom, Math.min(maxZoom, value.zoom)) };
      onViewChange?.(resolved);
      return resolved;
    });
  }, [maxZoom, minZoom, onViewChange]);

  if (narrow || reducedMotion) {
    return <section aria-label={label} data-spatial-canvas data-static className={cn("min-h-svh overflow-hidden py-24", className, stageClassName)} {...props}><div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 [scrollbar-width:none]">{items.map((item, index) => <article key={item.id} className={cn("relative aspect-[4/5] w-[82vw] shrink-0 snap-center overflow-hidden rounded-[2rem]", typeof itemClassName === "function" ? itemClassName(item, index) : itemClassName, item.className)} aria-label={item.label}>{item.content}</article>)}</div></section>;
  }

  // Drag writes the pan straight to the DOM; React state commits on release.
  const applyPan = (x: number, y: number) => {
    if (planeRef.current) planeRef.current.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) scale(${view.zoom})`;
    if (backdropRef.current) backdropRef.current.style.backgroundPosition = `${x}px ${y}px`;
  };
  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button, a, input, select, textarea")) { onPointerDown?.(event); return; }
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: view.x, startY: view.y, currentX: view.x, currentY: view.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    onPointerDown?.(event);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) {
      drag.currentX = drag.startX + event.clientX - drag.x;
      drag.currentY = drag.startY + event.clientY - drag.y;
      applyPan(drag.currentX, drag.currentY);
    }
    onPointerMove?.(event);
  };
  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) {
      dragRef.current = null;
      if (drag.currentX !== drag.startX || drag.currentY !== drag.startY) {
        updateView((current) => ({ ...current, x: drag.currentX, y: drag.currentY }));
      }
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onPointerUp?.(event);
  };
  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      updateView((current) => ({ ...current, zoom: current.zoom * Math.exp(-event.deltaY * .002) }));
    }
    onWheel?.(event);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const move = event.shiftKey ? 120 : 48;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      updateView((current) => ({ ...current, x: current.x + (event.key === "ArrowLeft" ? move : event.key === "ArrowRight" ? -move : 0), y: current.y + (event.key === "ArrowUp" ? move : event.key === "ArrowDown" ? -move : 0) }));
    }
    if (event.key === "+" || event.key === "=") updateView((current) => ({ ...current, zoom: current.zoom * 1.12 }));
    if (event.key === "-") updateView((current) => ({ ...current, zoom: current.zoom / 1.12 }));
    if (event.key === "0") updateView(initialView);
    onKeyDown?.(event);
  };
  const controlClass = "grid size-10 place-items-center rounded-xl border border-white/15 bg-black/45 text-white shadow-lg backdrop-blur-xl transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
  return (
    <section aria-label={label} tabIndex={0} data-spatial-canvas className={cn("relative h-svh touch-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60", className, stageClassName)} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onWheel={handleWheel} onKeyDown={handleKeyDown} {...props}>
      <p className="sr-only">{instructions}</p>
      <div ref={backdropRef} aria-hidden className="absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.16) 1px,transparent 1px)", backgroundSize: `${gridSize * view.zoom}px ${gridSize * view.zoom}px`, backgroundPosition: `${view.x}px ${view.y}px` }} />
      <div ref={planeRef} className="absolute left-1/2 top-1/2 will-change-transform" style={{ width: worldSize[0], height: worldSize[1], transform: `translate3d(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px), 0) scale(${view.zoom})`, transformOrigin: "center" }}>
        {items.map((item, index) => <article key={item.id} aria-label={item.label} className={cn("absolute overflow-hidden rounded-[2rem] shadow-2xl", typeof itemClassName === "function" ? itemClassName(item, index) : itemClassName, item.className)} style={{ left: `calc(50% + ${item.x}px)`, top: `calc(50% + ${item.y}px)`, width: item.width ?? 420, transform: "translate(-50%, -50%)" }}>{item.content}</article>)}
      </div>
      {showControls ? <div className="absolute bottom-5 right-5 z-20 flex gap-2"><Button type="button" variant="outline" size="icon" className={controlClass} aria-label={zoomOutLabel} onClick={() => updateView((current) => ({ ...current, zoom: current.zoom / 1.18 }))}><Minus className="size-4" /></Button><Button type="button" variant="outline" size="icon" className={controlClass} aria-label={resetLabel} onClick={() => updateView(initialView)}><LocateFixed className="size-4" /></Button><Button type="button" variant="outline" size="icon" className={controlClass} aria-label={zoomInLabel} onClick={() => updateView((current) => ({ ...current, zoom: current.zoom * 1.18 }))}><Plus className="size-4" /></Button></div> : null}
    </section>
  );
}

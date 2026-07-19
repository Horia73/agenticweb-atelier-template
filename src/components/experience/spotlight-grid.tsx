"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useExperienceViewport, useFinePointer, usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type SpotlightGroupProps = React.ComponentProps<"div"> & {
  children: React.ReactNode;
  /** Spotlight radius in pixels. */
  radius?: number;
  /** Border glow color for every card (a card can override it). */
  color?: string;
  /** Softer fill glow inside the card; 0 disables it. */
  fillOpacity?: number;
};

type SpotlightGroupContextValue = { color: string; fillOpacity: number; radius: number; active: boolean };

const SpotlightGroupContext = React.createContext<SpotlightGroupContextValue | null>(null);

/**
 * Shared pointer field for `SpotlightCard`s: one listener updates per-card CSS
 * variables (spotlight position and strength), so a whole bento grid lights up
 * along the cursor with a single rAF loop. Cards keep their own content and
 * borders; touch and reduced motion render them completely static.
 */
export function SpotlightGroup({
  children,
  className,
  color = "rgba(255,255,255,.5)",
  fillOpacity = 0.06,
  radius = 320,
  ...props
}: SpotlightGroupProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const pointerRef = React.useRef({ x: 0, y: 0, inside: false });
  const frameRef = React.useRef(0);
  const scheduledRef = React.useRef(false);
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  const viewport = useExperienceViewport();
  const active = finePointer && !reducedMotion;

  const applyFrame = React.useCallback(() => {
    scheduledRef.current = false;
    const root = rootRef.current;
    if (!root) return;
    const pointer = pointerRef.current;
    const cards = root.querySelectorAll<HTMLElement>("[data-spotlight-card]");
    cards.forEach((card) => {
      // Rects are read inside the rAF and only while the pointer is over the
      // group, so a handful of cards stays cheap.
      const rect = card.getBoundingClientRect();
      const x = pointer.x - rect.left;
      const y = pointer.y - rect.top;
      const centerDistance = Math.hypot(x - rect.width / 2, y - rect.height / 2);
      const reach = radius + Math.max(rect.width, rect.height) / 2;
      const strength = pointer.inside ? Math.max(0, 1 - centerDistance / reach) : 0;
      card.style.setProperty("--spotlight-x", `${x.toFixed(1)}px`);
      card.style.setProperty("--spotlight-y", `${y.toFixed(1)}px`);
      card.style.setProperty("--spotlight-strength", strength.toFixed(3));
    });
  }, [radius]);

  const schedule = React.useCallback(() => {
    if (scheduledRef.current) return;
    scheduledRef.current = true;
    frameRef.current = requestAnimationFrame(applyFrame);
  }, [applyFrame]);

  React.useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const value = React.useMemo(() => ({ active, color, fillOpacity, radius }), [active, color, fillOpacity, radius]);

  return (
    <SpotlightGroupContext.Provider value={value}>
      <div
        ref={rootRef}
        data-spotlight-group
        data-experience-viewport={viewport}
        data-static={!active || undefined}
        className={className}
        onPointerMove={(event) => {
          if (!active || event.pointerType === "touch") return;
          pointerRef.current = { x: event.clientX, y: event.clientY, inside: true };
          schedule();
        }}
        onPointerLeave={() => {
          pointerRef.current.inside = false;
          schedule();
        }}
        {...props}
      >
        {children}
      </div>
    </SpotlightGroupContext.Provider>
  );
}

export type SpotlightCardProps = React.ComponentProps<"div"> & {
  children: React.ReactNode;
  /** Overrides the group glow color for this card. */
  color?: string;
  /** Width of the illuminated border ring in pixels. */
  borderWidth?: number;
};

/**
 * One illuminated card inside a `SpotlightGroup`: a border ring and a soft
 * interior fill follow the shared pointer via CSS variables. Give the card its
 * own resting border/background through `className`; the spotlight only adds
 * light on top.
 */
export function SpotlightCard({ borderWidth = 1, children, className, color, ...props }: SpotlightCardProps) {
  const context = React.useContext(SpotlightGroupContext);
  if (!context) throw new Error("SpotlightCard must be rendered inside a SpotlightGroup.");
  const glow = color ?? context.color;
  return (
    <div data-spotlight-card className={cn("relative", className)} {...props}>
      {context.active ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[calc(var(--spotlight-strength,0)*1)]"
            style={{
              padding: borderWidth,
              background: `radial-gradient(${context.radius}px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${glow}, transparent 70%)`,
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
            }}
          />
          {context.fillOpacity > 0 ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[calc(var(--spotlight-strength,0)*1)]"
              style={{
                background: `radial-gradient(${context.radius * 1.4}px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), color-mix(in srgb, ${glow} ${Math.round(context.fillOpacity * 100)}%, transparent), transparent 65%)`,
              }}
            />
          ) : null}
        </>
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );
}

"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export type LiquidGlassSurfaceProps = React.ComponentProps<"div"> & {
  tint?: string;
  blur?: number;
  saturation?: number;
  borderOpacity?: number;
  glow?: boolean;
  interactiveLight?: boolean;
};

/** A content-agnostic glass surface with bounded pointer lighting and a CSS fallback. */
export function LiquidGlassSurface({
  blur = 22,
  borderOpacity = 0.24,
  children,
  className,
  glow = true,
  interactiveLight = true,
  onPointerLeave,
  onPointerMove,
  saturation = 1.35,
  style,
  tint = "255 255 255",
  ...props
}: LiquidGlassSurfaceProps) {
  const reducedMotion = useReducedMotion();
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (interactiveLight && !reducedMotion) {
      const rect = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty("--glass-x", `${event.clientX - rect.left}px`);
      event.currentTarget.style.setProperty("--glass-y", `${event.clientY - rect.top}px`);
    }
    onPointerMove?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.removeProperty("--glass-x");
    event.currentTarget.style.removeProperty("--glass-y");
    onPointerLeave?.(event);
  };

  return (
    <div
      data-liquid-glass
      className={cn(
        "relative isolate overflow-hidden border shadow-[0_20px_80px_rgb(0_0_0/.16),inset_0_1px_0_rgb(255_255_255/.34)]",
        "supports-[backdrop-filter:blur(1px)]:backdrop-blur-[var(--glass-blur)] supports-[backdrop-filter:blur(1px)]:backdrop-saturate-[var(--glass-saturation)]",
        className,
      )}
      style={{
        "--glass-blur": `${blur}px`,
        "--glass-saturation": saturation,
        background: `linear-gradient(135deg, rgb(${tint} / .22), rgb(${tint} / .075) 48%, rgb(${tint} / .15))`,
        borderColor: `rgb(${tint} / ${borderOpacity})`,
        ...style,
      } as React.CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgb(255_255_255/.3),transparent_28%,transparent_65%,rgb(255_255_255/.16))] opacity-70" />
      {glow ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70 mix-blend-screen [background:radial-gradient(220px_circle_at_var(--glass-x,15%)_var(--glass-y,0%),rgb(255_255_255/.5),transparent_70%)]"
        />
      ) : null}
      <div aria-hidden className="pointer-events-none absolute inset-x-[12%] top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      {children}
    </div>
  );
}

export type LiquidGlassNavItem = {
  id: string;
  label: React.ReactNode;
  href: string;
  icon?: React.ReactNode;
};

export type LiquidGlassNavProps = Omit<React.ComponentProps<"nav">, "children"> & {
  items: LiquidGlassNavItem[];
  label: string;
  brand?: React.ReactNode;
  action?: React.ReactNode;
  activeId?: string;
  defaultActiveId?: string;
  onActiveChange?: (id: string) => void;
  compact?: boolean;
  surfaceClassName?: string;
};

/** A morphing, semantic nav dock. Content, links and placement remain consumer-owned. */
export function LiquidGlassNav({
  action,
  activeId,
  brand,
  className,
  compact = false,
  defaultActiveId,
  items,
  label,
  onActiveChange,
  surfaceClassName,
  ...props
}: LiquidGlassNavProps) {
  const [internalActive, setInternalActive] = React.useState(defaultActiveId ?? items[0]?.id ?? "");
  const resolvedActive = activeId ?? internalActive;
  const reducedMotion = useReducedMotion();
  const choose = (id: string) => {
    if (activeId === undefined) setInternalActive(id);
    onActiveChange?.(id);
  };

  return (
    <nav aria-label={label} className={cn("w-full", className)} {...props}>
      <LiquidGlassSurface className={cn("flex items-center gap-2 rounded-[1.35rem] p-1.5 text-sm text-white", surfaceClassName)} tint="225 239 255" blur={24}>
        {brand ? <div className="shrink-0 px-3 font-semibold tracking-[-0.03em]">{brand}</div> : null}
        <ul className="flex min-w-0 flex-1 items-center justify-center gap-0.5" role="list">
          {items.map((item) => {
            const selected = item.id === resolvedActive;
            return (
              <li key={item.id} className="relative min-w-0">
                {selected ? (
                  <motion.div
                    layoutId="liquid-glass-nav-active"
                    aria-hidden
                    className="absolute inset-0 rounded-[1rem] border border-white/28 bg-white/18 shadow-[inset_0_1px_0_rgb(255_255_255/.35),0_8px_28px_rgb(0_0_0/.12)]"
                    transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36, mass: 0.65 }}
                  />
                ) : null}
                <a
                  href={item.href}
                  aria-current={selected ? "page" : undefined}
                  className={cn("relative flex h-10 items-center justify-center gap-2 rounded-[1rem] px-3 font-medium text-white/68 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/70", selected && "text-white", compact && "size-10 px-0")}
                  onClick={() => choose(item.id)}
                >
                  {item.icon}
                  <span className={cn(compact && "sr-only")}>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
        {action ? <div className="shrink-0">{action}</div> : null}
      </LiquidGlassSurface>
    </nav>
  );
}

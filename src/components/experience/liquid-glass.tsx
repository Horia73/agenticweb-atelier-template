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
  variant?: "regular" | "clear";
  tone?: "light" | "dark";
};

/** A content-agnostic glass surface with bounded pointer lighting and a CSS fallback. */
export function LiquidGlassSurface({
  blur = 22,
  borderOpacity,
  children,
  className,
  glow = true,
  interactiveLight = true,
  onPointerLeave,
  onPointerMove,
  saturation = 1.35,
  style,
  tint = "255 255 255",
  tone = "dark",
  variant = "regular",
  ...props
}: LiquidGlassSurfaceProps) {
  const reducedMotion = useReducedMotion();
  const clear = variant === "clear";
  const lightTone = tone === "light";
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
      data-tone={tone}
      data-variant={variant}
      className={cn(
        "relative isolate overflow-hidden border",
        className,
      )}
      style={{
        "--glass-blur": `${blur}px`,
        "--glass-saturation": saturation,
        WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}) contrast(${clear ? 1.015 : 1.06}) brightness(${clear ? 1.04 : lightTone ? 1.03 : 0.92})`,
        backdropFilter: `blur(${blur}px) saturate(${saturation}) contrast(${clear ? 1.015 : 1.06}) brightness(${clear ? 1.04 : lightTone ? 1.03 : 0.92})`,
        background: clear
          ? `linear-gradient(145deg, rgb(${tint} / .032), rgb(${tint} / .003) 44%, rgb(${tint} / .016))`
          : `linear-gradient(145deg, rgb(${tint} / .17), rgb(${tint} / .065) 48%, rgb(${tint} / .12))`,
        borderColor: `rgb(${tint} / ${borderOpacity ?? (clear ? 0.18 : 0.25)})`,
        boxShadow: clear
          ? "0 18px 70px rgb(0 0 0 / .075), inset 0 1px 0 rgb(255 255 255 / .2), inset 0 -1px 0 rgb(255 255 255 / .045)"
          : "0 22px 80px rgb(0 0 0 / .18), inset 0 1px 0 rgb(255 255 255 / .32), inset 0 -1px 0 rgb(255 255 255 / .1)",
        ...style,
      } as React.CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <div aria-hidden className="pointer-events-none absolute inset-[1px] -z-10 rounded-[inherit] bg-[linear-gradient(115deg,rgb(255_255_255/.16),transparent_24%,transparent_72%,rgb(255_255_255/.065))] opacity-65" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] shadow-[inset_1.5px_1.5px_0_rgb(255_255_255/.16),inset_-1.5px_-1.5px_0_rgb(255_255_255/.035),inset_0_0_22px_rgb(255_255_255/.018)]" />
      {glow ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-45 mix-blend-screen [background:radial-gradient(240px_circle_at_var(--glass-x,15%)_var(--glass-y,0%),rgb(255_255_255/.34),transparent_68%)]"
        />
      ) : null}
      <div aria-hidden className="pointer-events-none absolute inset-x-[9%] top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
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
  surfaceProps?: Omit<LiquidGlassSurfaceProps, "children" | "className">;
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
  surfaceProps,
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
      <LiquidGlassSurface tint="225 239 255" blur={18} saturation={1.42} variant="clear" {...surfaceProps} className={cn("flex items-center gap-2 rounded-[1.35rem] p-1.5 text-sm text-white", surfaceClassName)}>
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
                    className="absolute inset-0 rounded-[1rem] border border-white/14 bg-white/[.055] shadow-[inset_0_1px_0_rgb(255_255_255/.2),0_8px_28px_rgb(0_0_0/.07)] backdrop-blur-sm"
                    transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 30, mass: 0.55 }}
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

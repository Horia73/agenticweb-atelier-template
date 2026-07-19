"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useHydrated, usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type RevealVariant = "fade" | "rise" | "blur" | "clip" | "zoom";

const revealCss = `
[data-reveal-item] { transition: opacity var(--reveal-duration, 700ms) var(--reveal-easing, ease) var(--reveal-delay, 0ms), transform var(--reveal-duration, 700ms) var(--reveal-easing, ease) var(--reveal-delay, 0ms), filter var(--reveal-duration, 700ms) var(--reveal-easing, ease) var(--reveal-delay, 0ms), clip-path var(--reveal-duration, 700ms) var(--reveal-easing, ease) var(--reveal-delay, 0ms); }
[data-reveal-stagger]:not([data-revealed]) [data-reveal-item][data-reveal-variant="fade"] { opacity: 0; }
[data-reveal-stagger]:not([data-revealed]) [data-reveal-item][data-reveal-variant="rise"] { opacity: 0; transform: translate3d(0, var(--reveal-distance, 28px), 0); }
[data-reveal-stagger]:not([data-revealed]) [data-reveal-item][data-reveal-variant="blur"] { opacity: 0; filter: blur(12px); }
[data-reveal-stagger]:not([data-revealed]) [data-reveal-item][data-reveal-variant="clip"] { clip-path: inset(0 0 100% 0); }
[data-reveal-stagger]:not([data-revealed]) [data-reveal-item][data-reveal-variant="zoom"] { opacity: 0; transform: scale(.94); }
`;

type RevealContextValue = {
  staggerMs: number;
  variant: RevealVariant;
};

const RevealContext = React.createContext<RevealContextValue | null>(null);

/** Observes the element and reports when it should be revealed (and un-revealed when `once` is false). */
function useRevealTrigger(target: React.RefObject<HTMLElement | null>, enabled: boolean, once: boolean, threshold: number) {
  const [revealed, setRevealed] = React.useState(false);
  React.useEffect(() => {
    const element = target.current;
    if (!element || !enabled) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setRevealed(false);
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, once, target, threshold]);
  return revealed;
}

export type RevealStaggerProps = React.ComponentProps<"div"> & {
  children: React.ReactNode;
  /** Default variant for every item in the group. */
  variant?: RevealVariant;
  /** Delay between consecutive items in milliseconds. */
  staggerMs?: number;
  durationMs?: number;
  /** Rise travel in pixels. */
  distance?: number;
  easing?: string;
  /** Reveal only the first time the group enters the viewport. */
  once?: boolean;
  /** Fraction of the group that must be visible before revealing. */
  threshold?: number;
};

/**
 * Viewport-entry choreography: descendants wrapped in `RevealItem` (or a
 * `RevealText`) animate in with a shared stagger once the group scrolls into
 * view. The choreography is pure CSS — the group toggles `data-revealed` and
 * assigns per-item delays from DOM order. Server markup and reduced motion
 * render everything in its final state, so content never depends on
 * JavaScript to be readable.
 */
export function RevealStagger({
  children,
  className,
  distance = 28,
  durationMs = 700,
  easing = "cubic-bezier(.22,.61,.21,1)",
  once = true,
  staggerMs = 90,
  style,
  threshold = 0.2,
  variant = "rise",
  ...props
}: RevealStaggerProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const reducedMotion = usePrefersReducedMotion();
  const animated = hydrated && !reducedMotion;
  const revealed = useRevealTrigger(rootRef, animated, once, threshold);
  const childCount = React.Children.count(children);

  // Stagger delays follow DOM order; items with an explicit order/delay opt out.
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || !animated) return;
    const items = root.querySelectorAll<HTMLElement>("[data-reveal-item]:not([data-reveal-fixed])");
    items.forEach((item, index) => item.style.setProperty("--reveal-delay", `${index * staggerMs}ms`));
  }, [animated, childCount, staggerMs]);

  const value = React.useMemo<RevealContextValue>(() => ({ staggerMs, variant }), [staggerMs, variant]);

  return (
    <RevealContext.Provider value={value}>
      <style href="reveal-stagger" precedence="medium">{revealCss}</style>
      <div
        ref={rootRef}
        data-reveal-stagger
        data-revealed={(revealed || !animated) || undefined}
        className={className}
        style={{
          "--reveal-duration": `${durationMs}ms`,
          "--reveal-easing": easing,
          "--reveal-distance": `${distance}px`,
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    </RevealContext.Provider>
  );
}

export type RevealItemProps = React.ComponentProps<"div"> & {
  children: React.ReactNode;
  /** Overrides the group variant for this item. */
  variant?: RevealVariant;
  /**
   * Absolute delay override in milliseconds. Combined with `order`
   * (`order * staggerMs + delayMs`); items using either leave the automatic
   * DOM-order stagger.
   */
  delayMs?: number;
  /** Explicit stagger position; see `delayMs`. */
  order?: number;
};

/**
 * One choreographed element inside a `RevealStagger`. DOM order defines the
 * stagger position unless `order`/`delayMs` pin an explicit delay.
 */
export function RevealItem({ children, className, delayMs, order, style, variant, ...props }: RevealItemProps) {
  const context = React.useContext(RevealContext);
  if (!context) throw new Error("RevealItem must be rendered inside a RevealStagger.");
  const fixed = order !== undefined || delayMs !== undefined;
  const fixedDelay = fixed ? (order ?? 0) * context.staggerMs + (delayMs ?? 0) : undefined;
  return (
    <div
      data-reveal-item
      data-reveal-variant={variant ?? context.variant}
      data-reveal-fixed={fixed || undefined}
      className={className}
      style={fixed ? ({ "--reveal-delay": `${fixedDelay}ms`, ...style } as React.CSSProperties) : style}
      {...props}
    >
      {children}
    </div>
  );
}

export type RevealTextProps = Omit<React.ComponentProps<"span">, "children"> & {
  text: string;
  /** Split unit for the choreography. */
  by?: "word" | "character";
  /** Delay between consecutive units in milliseconds. */
  staggerMs?: number;
  durationMs?: number;
  distance?: string;
  easing?: string;
  once?: boolean;
  threshold?: number;
  /** Class applied to every animated unit (e.g. gradient text per word). */
  unitClassName?: string;
};

/**
 * Masked-line text reveal: the string splits into words or characters that
 * rise out of an `overflow:hidden` mask with a stagger. The full string stays
 * available to assistive tech; the animated fragments are decorative. Works
 * standalone or inside a `RevealStagger` (it observes its own visibility).
 */
export function RevealText({
  by = "word",
  className,
  distance = "110%",
  durationMs = 800,
  easing = "cubic-bezier(.22,.61,.21,1)",
  once = true,
  staggerMs = 55,
  text,
  threshold = 0.35,
  unitClassName,
  ...props
}: RevealTextProps) {
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const hydrated = useHydrated();
  const reducedMotion = usePrefersReducedMotion();
  const animated = hydrated && !reducedMotion;
  const revealed = useRevealTrigger(rootRef, animated, once, threshold);
  const units = React.useMemo(() => (by === "word" ? text.split(/\s+/) : Array.from(text)), [by, text]);

  if (!animated) {
    return (
      <span ref={rootRef} data-reveal-text data-static className={className} {...props}>
        {text}
      </span>
    );
  }

  return (
    <span ref={rootRef} data-reveal-text data-revealed={revealed || undefined} aria-label={text} role="text" className={className} {...props}>
      {units.map((unit, index) => (
        <span key={index} aria-hidden className="inline-block overflow-hidden align-bottom">
          <span
            className={cn("inline-block will-change-transform", unitClassName)}
            style={{
              transition: `transform ${durationMs}ms ${easing} ${index * staggerMs}ms`,
              transform: revealed ? "translate3d(0,0,0)" : `translate3d(0, ${distance}, 0)`,
            }}
          >
            {by === "character" && unit === " " ? " " : unit}
          </span>
          {by === "word" && index < units.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

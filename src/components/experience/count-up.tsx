"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type CountUpProps = Omit<React.ComponentProps<"span">, "children" | "prefix"> & {
  /** Target value. Changing it after the first reveal animates to the new value. */
  value: number;
  /** Starting value for the first animation. */
  from?: number;
  durationMs?: number;
  /** Extra delay before the first animation, e.g. to stagger a stat row. */
  delayMs?: number;
  /** Intl.NumberFormat options (decimals, currency, notation …). */
  formatOptions?: Intl.NumberFormatOptions;
  locale?: string;
  prefix?: string;
  suffix?: string;
  /** Animate only on the first viewport entry. */
  once?: boolean;
  /** 0..1 progress curve; defaults to an ease-out-expo. */
  easing?: (t: number) => number;
};

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * A stat number that counts up when it enters the viewport. The final value is
 * rendered invisibly to reserve layout (no width jitter) and exposed to
 * assistive tech; the animated digits are decorative. Reduced motion and
 * server markup show the final value immediately. Pair with `tabular-nums`
 * for stable digit widths.
 */
export function CountUp({
  className,
  delayMs = 0,
  durationMs = 1400,
  easing = easeOutExpo,
  formatOptions,
  from = 0,
  locale,
  once = true,
  prefix = "",
  suffix = "",
  value,
  ...props
}: CountUpProps) {
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const liveRef = React.useRef<HTMLSpanElement>(null);
  const displayedRef = React.useRef(from);
  const frameRef = React.useRef(0);
  const [armed, setArmed] = React.useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const formatter = React.useMemo(() => new Intl.NumberFormat(locale, formatOptions), [locale, formatOptions]);
  const format = React.useCallback((current: number) => `${prefix}${formatter.format(current)}${suffix}`, [formatter, prefix, suffix]);
  const finalText = format(value);

  React.useEffect(() => {
    const element = rootRef.current;
    if (!element || reducedMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setArmed(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setArmed(false);
          displayedRef.current = from;
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [from, once, reducedMotion]);

  React.useEffect(() => {
    const live = liveRef.current;
    if (!live || reducedMotion) return;
    if (!armed) {
      live.textContent = format(from);
      return;
    }
    const start = displayedRef.current;
    if (start === value) {
      live.textContent = format(value);
      return;
    }
    // Integers stay integers mid-flight unless the caller formats decimals.
    const decimals = formatOptions?.maximumFractionDigits ?? (Number.isInteger(value) && Number.isInteger(start) ? 0 : 2);
    const startedAt = performance.now() + delayMs;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - startedAt) / durationMs));
      const current = start + (value - start) * easing(t);
      const rounded = Number(current.toFixed(decimals));
      displayedRef.current = rounded;
      live.textContent = format(rounded);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [armed, delayMs, durationMs, easing, format, formatOptions, from, reducedMotion, value]);

  if (reducedMotion) {
    return (
      <span data-count-up data-static className={className} {...props}>
        {finalText}
      </span>
    );
  }

  return (
    <span ref={rootRef} data-count-up aria-label={finalText} role="text" className={cn("relative inline-block", className)} {...props}>
      <span aria-hidden className="invisible">{finalText}</span>
      {/* Server markup shows the final value so the stat reads without JS; hydration rewinds it to `from` before the viewport trigger. */}
      <span ref={liveRef} aria-hidden className="absolute inset-0">
        {finalText}
      </span>
    </span>
  );
}

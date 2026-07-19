"use client";

import * as React from "react";
import { type MotionValue, useMotionValueEvent } from "motion/react";

import { cn } from "@/lib/utils";
import {
  clamp01,
  damp,
  mix,
  useExperienceViewport,
  useFinePointer,
  usePrefersReducedMotion,
} from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type FontAxis = {
  /** OpenType axis tag, e.g. "wght", "wdth", "opsz", "slnt". */
  tag: string;
  from: number;
  to: number;
};

export type VariableFontAxisProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  text: string;
  axes: FontAxis[];
  /** "pointer" warps characters near the cursor; "scroll" drives the whole text. */
  mode?: "pointer" | "scroll";
  as?: "h1" | "h2" | "h3" | "p" | "span";
  /** Pointer influence radius in pixels. */
  radius?: number;
  smoothing?: number;
  /** Pin the section and drive scroll mode across this many screens. */
  pin?: boolean;
  scrollScreens?: number;
  /** External progress override for scroll mode (0..1). */
  progress?: MotionValue<number>;
  textClassName?: string;
};

function formatAxes(axes: FontAxis[], values: number[]) {
  return axes.map((axis, index) => `"${axis.tag}" ${values[index]?.toFixed(1)}`).join(", ");
}

/**
 * Animates variable-font axes — weight, width, optical size — from the pointer
 * or from scroll. The accessible text never changes; only font-variation
 * settings move.
 */
export function VariableFontAxis({
  as = "h2",
  axes,
  className,
  label,
  mode = "pointer",
  pin = false,
  progress: controlledProgress,
  radius = 150,
  scrollScreens = 2,
  smoothing = 10,
  text,
  textClassName,
  ...props
}: VariableFontAxisProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const textRef = React.useRef<HTMLElement>(null);
  const charRefs = React.useRef<Array<HTMLSpanElement | null>>([]);
  const reducedMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();
  const viewport = useExperienceViewport();
  const activeRadius = radius * (viewport === "mobile" ? 0.7 : viewport === "tablet" ? 0.84 : 1);
  const activeScrollScreens = scrollScreens * (viewport === "mobile" ? 0.72 : viewport === "tablet" ? 0.86 : 1);
  const pointerMode = mode === "pointer" && finePointer && !reducedMotion;
  const scrollMode = mode === "scroll" && !reducedMotion;
  const activePin = pin && viewport !== "mobile";

  const localProgress = useElementScrollProgress(rootRef);
  const scrollProgress = controlledProgress ?? localProgress;
  const axesSignature = JSON.stringify(axes);

  // Scroll mode: one style write per progress change on the real text node.
  useMotionValueEvent(scrollProgress, "change", (value) => {
    if (!scrollMode) return;
    const element = textRef.current;
    if (!element) return;
    const parsed = JSON.parse(axesSignature) as FontAxis[];
    element.style.fontVariationSettings = formatAxes(parsed, parsed.map((axis) => mix(axis.from, axis.to, clamp01(value))));
  });

  // Pointer mode: cached character offsets, damped per-character values and an
  // animation loop that stops itself once everything settles at rest.
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || !pointerMode) return;
    const parsedAxes = JSON.parse(axesSignature) as FontAxis[];
    const chars = charRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (chars.length === 0) return;

    let disposed = false;
    let frame = 0;
    let running = false;
    let previous = 0;
    const pointer = { x: 0, active: false };
    let centers: number[] = [];
    const values = chars.map(() => 0);

    const measure = () => {
      const rootRect = root.getBoundingClientRect();
      centers = chars.map((char) => {
        const rect = char.getBoundingClientRect();
        return rect.left - rootRect.left + rect.width / 2;
      });
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(root);
    measure();

    const render = (time: number) => {
      if (disposed) return;
      const delta = Math.min(0.05, Math.max(0.001, (time - previous) / 1000));
      previous = time;
      let settled = true;
      const rootLeft = root.getBoundingClientRect().left;
      chars.forEach((char, index) => {
        const distance = Math.abs(pointer.x - (rootLeft + (centers[index] ?? 0)));
        const target = pointer.active ? clamp01(1 - distance / Math.max(1, activeRadius)) : 0;
        const eased = target * target * (3 - 2 * target);
        const next = damp(values[index] ?? 0, eased, smoothing, delta);
        if (Math.abs(next - (values[index] ?? 0)) > 0.001 || Math.abs(next - eased) > 0.001) settled = false;
        values[index] = next;
        char.style.fontVariationSettings = formatAxes(parsedAxes, parsedAxes.map((axis) => mix(axis.from, axis.to, next)));
      });
      if (settled && !pointer.active) {
        running = false;
        return;
      }
      frame = requestAnimationFrame(render);
    };
    const wake = () => {
      if (!running && !disposed) {
        running = true;
        previous = performance.now();
        frame = requestAnimationFrame(render);
      }
    };
    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.x = event.clientX;
      pointer.active = true;
      wake();
    };
    const handleLeave = () => {
      pointer.active = false;
      wake();
    };
    root.addEventListener("pointermove", handleMove);
    root.addEventListener("pointerleave", handleLeave);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      root.removeEventListener("pointermove", handleMove);
      root.removeEventListener("pointerleave", handleLeave);
    };
  }, [activeRadius, axesSignature, pointerMode, smoothing]);

  const Tag = as;
  const restSettings = formatAxes(axes, axes.map((axis) => axis.from));
  // Words keep their own inline-block wrapper so line wrapping happens between
  // words, never inside one — individual characters still animate separately.
  const words = React.useMemo(() => {
    let index = 0;
    return text.split(/(\s+)/).map((chunk) => ({
      chunk,
      isSpace: chunk.trim() === "",
      chars: chunk.trim() === "" ? [] : Array.from(chunk).map((char) => ({ char, index: index++ })),
    }));
  }, [text]);

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-variable-font-axis
      data-experience-viewport={viewport}
      data-mode={mode}
      data-static={reducedMotion || undefined}
      className={cn("relative min-w-0", activePin && scrollMode && "min-h-0", className)}
      style={activePin && scrollMode ? { minHeight: `${Math.max(1, activeScrollScreens) * 100}svh` } : undefined}
      {...props}
    >
      <div className={cn(activePin && scrollMode && "sticky top-0 flex h-svh items-center")}>
        {pointerMode ? (
          <>
            <span className="sr-only">{text}</span>
            <Tag ref={textRef as React.Ref<never>} aria-hidden className={textClassName} style={{ fontVariationSettings: restSettings }}>
              {words.map((word, wordIndex) =>
                word.isSpace ? (
                  <React.Fragment key={`space-${wordIndex}`}>{word.chunk}</React.Fragment>
                ) : (
                  <span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap">
                    {word.chars.map(({ char, index }) => (
                      <span
                        key={index}
                        ref={(node) => {
                          charRefs.current[index] = node;
                        }}
                        className="inline-block"
                        style={{ fontVariationSettings: restSettings }}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                ),
              )}
            </Tag>
          </>
        ) : (
          <Tag ref={textRef as React.Ref<never>} className={cn("max-w-full whitespace-pre-wrap break-words", textClassName)} style={{ fontVariationSettings: restSettings }}>
            {text}
          </Tag>
        )}
      </div>
    </section>
  );
}

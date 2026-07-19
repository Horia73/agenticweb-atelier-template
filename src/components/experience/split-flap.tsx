"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type SplitFlapTextProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Board content. Changing it flips the board to the new text. */
  text: string;
  /** Glyph wheel every cell steps through, in order. */
  charset?: string;
  /** Duration of one flap, in milliseconds. */
  stepMs?: number;
  /** Column-to-column start delay, in milliseconds. */
  staggerMs?: number;
  /** Maximum flaps per cell on reveal; cells start this far back on the wheel. */
  maxSteps?: number;
  /** Pad (with spaces) to a fixed number of cells so the board width is stable. */
  padTo?: number;
  /** Animate only on the first viewport entry (text changes still animate). */
  once?: boolean;
  /** Shrink the board's font automatically so it never overflows its container. */
  fit?: boolean;
  cellClassName?: string;
};

const DEFAULT_CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ĂÂÎȘȚ.,:-→·";

const splitFlapCss = `
[data-split-flap] .sf-board { display: inline-flex; gap: .12ch; }
[data-split-flap] .sf-cell { position: relative; display: inline-block; width: 1.3ch; height: 1.42em; perspective: 300px; background: var(--sf-tile, #15171b); border-radius: .14em; box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 1px 2px rgba(0,0,0,.35); }
[data-split-flap] .sf-half { position: absolute; left: 0; width: 100%; height: 50%; overflow: hidden; }
[data-split-flap] .sf-half-top { top: 0; border-radius: .14em .14em 0 0; }
[data-split-flap] .sf-half-bottom { top: 50%; border-radius: 0 0 .14em .14em; }
[data-split-flap] .sf-glyph { position: absolute; left: 0; width: 100%; height: 200%; display: flex; align-items: center; justify-content: center; line-height: 1; }
[data-split-flap] .sf-half-top .sf-glyph { top: 0; }
[data-split-flap] .sf-half-bottom .sf-glyph { top: -100%; }
[data-split-flap] .sf-flap { background: var(--sf-tile, #15171b); backface-visibility: hidden; will-change: transform; }
[data-split-flap] .sf-flap-top { z-index: 2; transform-origin: 50% 100%; animation: sf-flip-top var(--sf-step) ease-in both; }
[data-split-flap] .sf-flap-bottom { z-index: 3; transform-origin: 50% 0%; animation: sf-flip-bottom var(--sf-step) ease-out both; animation-delay: calc(var(--sf-step) / 2); }
[data-split-flap] .sf-hinge { position: absolute; left: 0; right: 0; top: calc(50% - .5px); height: 1px; z-index: 4; background: rgba(0,0,0,.5); }
@keyframes sf-flip-top { from { transform: rotateX(0deg); filter: brightness(1); } to { transform: rotateX(-90deg); filter: brightness(.4); } }
@keyframes sf-flip-bottom { from { transform: rotateX(90deg); filter: brightness(.4); } to { transform: rotateX(0deg); filter: brightness(1); } }
`;

/**
 * One run of the board: per column, the full wheel path `[from, …steps…,
 * target]`. Everything else — which flap is showing at any moment — is derived
 * from `startedAt` and the clock, so remounts, Strict Mode and Fast Refresh
 * can never strand the board mid-word.
 */
type FlapRun = { startedAt: number; sequences: number[][] };

/** Deterministic per-column jitter (ms) so columns do not tick in lockstep. */
function columnJitter(column: number) {
  return (column * 7919) % 29;
}

function columnTick(run: FlapRun, column: number, now: number, staggerMs: number, flipPeriod: number) {
  const sequence = run.sequences[column];
  if (!sequence || sequence.length <= 1) return 0;
  const local = now - run.startedAt - column * staggerMs - columnJitter(column);
  if (local <= 0) return 0;
  return Math.min(sequence.length - 1, Math.floor(local / flipPeriod) + 1);
}

/**
 * A split-flap departure board: every cell flips through a glyph wheel to its
 * target character with per-column stagger, both on first viewport entry and
 * whenever `text` changes. The full string is the accessible name and the
 * server-rendered content; cells are decorative. Reduced motion renders plain
 * static text. Use a monospaced or tabular font for stable cell widths.
 */
export function SplitFlapText({
  cellClassName,
  charset = DEFAULT_CHARSET,
  className,
  fit = true,
  maxSteps = 9,
  once = false,
  padTo,
  staggerMs = 36,
  stepMs = 70,
  text,
  ...props
}: SplitFlapTextProps) {
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const boardRef = React.useRef<HTMLSpanElement>(null);
  const startedRef = React.useRef(false);
  const [run, setRun] = React.useState<FlapRun | null>(null);
  const [now, setNow] = React.useState(0);
  const reducedMotion = usePrefersReducedMotion();
  // Spaced past the flap animation (duration + half-step delay) so a flip
  // never cuts the previous one mid-swing.
  const flipPeriod = stepMs * 1.6;

  const target = React.useMemo(() => {
    const padded = padTo ? text.padEnd(padTo, " ").slice(0, padTo) : text;
    return Array.from(padded);
  }, [padTo, text]);
  const targetKey = target.join("");

  const indexOf = React.useCallback(
    (char: string) => {
      const index = charset.indexOf(char.toUpperCase());
      return index === -1 ? 0 : index;
    },
    [charset],
  );

  const animateTo = React.useCallback(
    (chars: string[], fromBlank: boolean) => {
      const startedAt = performance.now();
      setRun((previousRun) => {
        const sequences = chars.map((char, column) => {
          const toIndex = indexOf(char);
          let fromIndex: number;
          if (!fromBlank && previousRun) {
            const sequence = previousRun.sequences[column];
            fromIndex = sequence
              ? sequence[columnTick(previousRun, column, startedAt, staggerMs, flipPeriod)] ?? toIndex
              : toIndex;
          } else {
            fromIndex = (toIndex - Math.min(maxSteps, 3 + (column % 5)) + charset.length) % charset.length;
          }
          // Walk forward around the wheel, capped so long distances stay snappy.
          const distance = (toIndex - fromIndex + charset.length) % charset.length;
          const steps = distance === 0 ? 0 : Math.min(distance, maxSteps);
          const path = Array.from({ length: steps }, (_, step) => (toIndex - (steps - 1 - step) + charset.length) % charset.length);
          return [fromIndex, ...path];
        });
        return { startedAt, sequences };
      });
      setNow(startedAt);
    },
    [charset.length, flipPeriod, indexOf, maxSteps, staggerMs],
  );

  // The clock: while any column has flips left, keep sampling. Deriving the
  // board from timestamps makes the loop restart-safe by construction.
  React.useEffect(() => {
    if (!run || reducedMotion) return;
    let frame = 0;
    const loop = () => {
      const time = performance.now();
      setNow(time);
      const settleBuffer = stepMs * 2;
      const pending = run.sequences.some((sequence, column) => {
        const total = run.startedAt + column * staggerMs + columnJitter(column) + Math.max(0, sequence.length - 1) * flipPeriod + settleBuffer;
        return time < total;
      });
      if (pending) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [flipPeriod, reducedMotion, run, staggerMs, stepMs]);

  React.useEffect(() => {
    const element = rootRef.current;
    if (!element || reducedMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        if (once && startedRef.current) return;
        startedRef.current = true;
        animateTo(target, true);
        if (once) observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => observer.disconnect();
    // The reveal fires once from the observer; text changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateTo, once, reducedMotion]);

  // Text changes animate from the characters currently on the board.
  React.useEffect(() => {
    if (reducedMotion || !startedRef.current) return;
    animateTo(target, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey, reducedMotion]);

  // Shrink-to-fit: the board's font scales down so a long line can never
  // overflow the container it sits in.
  React.useEffect(() => {
    const board = boardRef.current;
    const parent = rootRef.current?.parentElement;
    if (!fit || !board || !parent || reducedMotion) return;
    const measure = () => {
      board.style.fontSize = "";
      const styles = getComputedStyle(parent);
      const available = parent.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
      const needed = board.scrollWidth;
      if (needed > available && available > 0) {
        board.style.fontSize = `${Math.max(20, Math.floor((available / needed) * 100))}%`;
      }
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(parent);
    measure();
    return () => resizeObserver.disconnect();
  }, [fit, reducedMotion, targetKey]);

  if (reducedMotion) {
    return (
      <span ref={rootRef} data-split-flap data-static className={className} {...props}>
        {padTo ? text.padEnd(padTo, " ").slice(0, padTo) : text}
      </span>
    );
  }

  return (
    <span ref={rootRef} data-split-flap aria-label={text} role="text" className={cn("inline-flex max-w-full", className)} style={{ "--sf-step": `${stepMs}ms` } as React.CSSProperties} {...props}>
      <style href="split-flap" precedence="medium">{splitFlapCss}</style>
      <span ref={boardRef} aria-hidden className="sf-board">
        {target.map((char, column) => {
          const sequence = run?.sequences[column];
          const tick = run && sequence ? columnTick(run, column, now, staggerMs, flipPeriod) : 0;
          const currentChar = sequence ? charset[sequence[tick] ?? 0] ?? " " : char;
          const previousChar = sequence && tick > 0 ? charset[sequence[tick - 1] ?? 0] ?? " " : currentChar;
          const flipped = Boolean(sequence && tick > 0);
          return (
            <span key={column} className={cn("sf-cell", cellClassName)}>
              {/* Static halves: the incoming char waits behind the top flap; the outgoing one sits below until the bottom flap lands on it. */}
              <span className="sf-half sf-half-top"><span className="sf-glyph">{currentChar}</span></span>
              <span className="sf-half sf-half-bottom"><span className="sf-glyph">{previousChar}</span></span>
              {flipped ? (
                <React.Fragment key={tick}>
                  <span className="sf-half sf-half-top sf-flap sf-flap-top"><span className="sf-glyph">{previousChar}</span></span>
                  <span className="sf-half sf-half-bottom sf-flap sf-flap-bottom"><span className="sf-glyph">{currentChar}</span></span>
                </React.Fragment>
              ) : null}
              <span className="sf-hinge" />
            </span>
          );
        })}
      </span>
    </span>
  );
}

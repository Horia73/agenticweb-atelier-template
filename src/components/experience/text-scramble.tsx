"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useExperienceViewport, usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type TextScrambleProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Final text (also the server-rendered content, so SEO and no-JS read it). */
  text: string;
  /** Cycle through these phrases instead of settling on `text` alone; `text` is the first phrase. */
  phrases?: string[];
  /** What starts the effect. */
  trigger?: "visible" | "hover" | "load";
  /** Time a full decode takes, in milliseconds. */
  durationMs?: number;
  /** Hold time on each phrase when cycling. */
  holdMs?: number;
  /** Pool of glyphs used while a character is still encrypted. */
  charset?: string;
  /** Re-run on every viewport entry / hover instead of only the first. */
  once?: boolean;
  /** Class for characters that are still scrambled (e.g. a dimmer color). */
  scrambleClassName?: string;
};

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/\\_<>[]*+=";

type Cell = { char: string; settled: boolean };

/**
 * Terminal-style decode: characters resolve left-to-right with jitter while
 * unresolved slots flicker through a glyph pool. The real string is server
 * rendering and the accessible name; scrambled glyphs are decorative. Reduced
 * motion renders static text (phrases still swap, instantly, when cycling).
 */
export function TextScramble({
  charset = DEFAULT_CHARSET,
  className,
  durationMs = 900,
  holdMs = 2200,
  once = false,
  phrases,
  scrambleClassName,
  text,
  trigger = "visible",
  ...props
}: TextScrambleProps) {
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const frameRef = React.useRef(0);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const playedRef = React.useRef(false);
  const phraseIndexRef = React.useRef(0);
  const playRef = React.useRef<(target: string) => void>(() => undefined);
  const [cells, setCells] = React.useState<Cell[] | null>(null);
  const [activeTarget, setActiveTarget] = React.useState(text);
  const [staticText, setStaticText] = React.useState(text);
  const reducedMotion = usePrefersReducedMotion();
  const viewport = useExperienceViewport();
  const activeDurationMs = durationMs * (viewport === "mobile" ? 0.72 : viewport === "tablet" ? 0.86 : 1);
  const sequence = React.useMemo(() => (phrases && phrases.length > 0 ? phrases : [text]), [phrases, text]);
  const cycling = sequence.length > 1;

  const play = React.useCallback(
    (target: string) => {
      cancelAnimationFrame(frameRef.current);
      clearTimeout(timeoutRef.current);
      setActiveTarget(target);
      const length = target.length;
      // Each slot locks at a jittered point of the timeline, biased left-to-right.
      const locks = Array.from({ length }, (_, index) => ((index / Math.max(1, length - 1)) * 0.7 + Math.random() * 0.3) * activeDurationMs);
      const startedAt = performance.now();
      let lastFlicker = 0;
      const tick = (now: number) => {
        const elapsed = now - startedAt;
        const flicker = now - lastFlicker > 45;
        if (flicker) lastFlicker = now;
        let done = true;
        const next: Cell[] = [];
        for (let index = 0; index < length; index += 1) {
          const targetChar = target[index] ?? "";
          if (elapsed >= locks[index]!) {
            if (targetChar) next.push({ char: targetChar, settled: true });
          } else {
            done = false;
            if (targetChar === " ") {
              next.push({ char: " ", settled: false });
            } else {
              next.push({ char: charset[Math.floor(Math.random() * charset.length)] ?? "#", settled: false });
            }
          }
        }
        setCells(next);
        if (!done) {
          frameRef.current = requestAnimationFrame(tick);
          return;
        }
        playedRef.current = true;
        if (cycling) {
          timeoutRef.current = setTimeout(() => {
            phraseIndexRef.current = (phraseIndexRef.current + 1) % sequence.length;
            playRef.current(sequence[phraseIndexRef.current]!);
          }, holdMs);
        }
      };
      frameRef.current = requestAnimationFrame(tick);
    },
    [activeDurationMs, charset, cycling, holdMs, sequence],
  );

  React.useEffect(() => {
    playRef.current = play;
  }, [play]);

  React.useEffect(() => () => {
    cancelAnimationFrame(frameRef.current);
    clearTimeout(timeoutRef.current);
  }, []);

  // Static phrase cycling for reduced motion: content still changes, nothing animates.
  React.useEffect(() => {
    if (!reducedMotion || !cycling) return;
    const interval = setInterval(() => {
      phraseIndexRef.current = (phraseIndexRef.current + 1) % sequence.length;
      setStaticText(sequence[phraseIndexRef.current]!);
    }, holdMs + activeDurationMs);
    return () => clearInterval(interval);
  }, [activeDurationMs, cycling, holdMs, reducedMotion, sequence]);

  React.useEffect(() => {
    const element = rootRef.current;
    if (!element || reducedMotion || trigger !== "visible") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        if (once && playedRef.current) return;
        play(sequence[phraseIndexRef.current]!);
        if (once) observer.disconnect();
      },
      { threshold: viewport === "mobile" ? 0.25 : viewport === "tablet" ? 0.38 : 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [once, play, reducedMotion, sequence, trigger, viewport]);

  React.useEffect(() => {
    if (reducedMotion || trigger !== "load") return;
    const frame = requestAnimationFrame(() => playRef.current(sequence[0]!));
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, sequence, trigger]);

  const handlePointerEnter = () => {
    if (reducedMotion || trigger !== "hover") return;
    if (once && playedRef.current) return;
    play(sequence[phraseIndexRef.current]!);
  };

  if (reducedMotion) {
    return (
      <span ref={rootRef} data-text-scramble data-experience-viewport={viewport} data-static className={className} {...props}>
        {cycling ? staticText : text}
      </span>
    );
  }

  return (
    <span
      ref={rootRef}
      data-text-scramble
      data-experience-viewport={viewport}
      aria-label={cells ? activeTarget : text}
      role="text"
      className={cn("max-w-full whitespace-pre-wrap break-words", className)}
      onPointerEnter={handlePointerEnter}
      {...props}
    >
      {cells ? (
        <span aria-hidden>
          {cells.map((cell, index) => (
            <span key={index} className={cn(!cell.settled && scrambleClassName)}>
              {cell.char}
            </span>
          ))}
        </span>
      ) : (
        text
      )}
    </span>
  );
}

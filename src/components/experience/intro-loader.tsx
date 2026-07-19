"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { clamp01, damp, useExperienceViewport, usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type IntroLoaderProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Accessible name of the loading state. */
  label?: string;
  /** The choreography never finishes before this, even on a warm cache. */
  minDurationMs?: number;
  /** Hard cap: the loader exits at this point even if `load` never fires. */
  maxDurationMs?: number;
  /** Words cycled while loading (brand values, cities, verbs …). */
  words?: string[];
  /**
   * sessionStorage key so the intro plays once per tab session. Pass `null`
   * to play on every mount (e.g. the Lab fixture).
   */
  storageKey?: string | null;
  /**
   * Controlled visibility for loading-screen use (route changes, gallery or
   * scene preloads): the curtain holds while `true` and exits when it flips to
   * `false`. Remount with a new `key` to replay. Leave undefined for the
   * self-timed intro behavior.
   */
  active?: boolean;
  /**
   * Real external progress (0..1), e.g. `loadedAssets / totalAssets`. The
   * counter eases toward it instead of simulating document readiness.
   */
  progress?: number;
  exit?: "up" | "down" | "fade";
  exitDurationMs?: number;
  onComplete?: () => void;
  /** Brand mark / center content. */
  children?: React.ReactNode;
  counterClassName?: string;
  wordClassName?: string;
};

type Phase = "loading" | "exiting" | "done";

const subscribeNoop = () => () => undefined;

/**
 * Hydration-safe "already played" flag: false on the server (the curtain
 * covers first paint), then the real sessionStorage value on the client.
 */
function useSessionFlag(storageKey: string | null) {
  const getSnapshot = React.useCallback(() => {
    if (!storageKey) return false;
    try {
      return sessionStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  }, [storageKey]);
  return React.useSyncExternalStore(subscribeNoop, getSnapshot, () => false);
}

/**
 * Full-page intro choreography: a fixed curtain with a progress counter and a
 * word cycle that tracks real document readiness (eased toward 90%, released
 * to 100% on `load`), then exits with a curtain lift. Plays once per session
 * via `storageKey`, locks scroll only while visible, and is skipped entirely
 * for reduced motion and for visitors who already saw it — the server-rendered
 * curtain is removed before first paint in those cases.
 */
export function IntroLoader({
  active,
  className,
  children,
  counterClassName,
  exit = "up",
  exitDurationMs = 850,
  label = "Loading",
  maxDurationMs = 6000,
  minDurationMs = 1800,
  onComplete,
  progress: externalProgress,
  storageKey = "intro-loader-played",
  wordClassName,
  words,
  ...props
}: IntroLoaderProps) {
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [displayProgress, setDisplayProgress] = React.useState(0);
  const [wordIndex, setWordIndex] = React.useState(0);
  const completedRef = React.useRef(false);
  const controlRef = React.useRef({ active, externalProgress });
  const reducedMotion = usePrefersReducedMotion();
  const viewport = useExperienceViewport();
  const activeMinDurationMs = minDurationMs * (viewport === "mobile" ? 0.76 : viewport === "tablet" ? 0.88 : 1);
  const activeMaxDurationMs = Math.max(activeMinDurationMs + 800, maxDurationMs * (viewport === "mobile" ? 0.78 : viewport === "tablet" ? 0.9 : 1));
  const activeExitDurationMs = exitDurationMs * (viewport === "mobile" ? 0.72 : viewport === "tablet" ? 0.86 : 1);
  const played = useSessionFlag(storageKey);
  // Repeat visitors and reduced motion never see the curtain: `played` and the
  // media query both resolve before the post-hydration paint.
  const skip = played || reducedMotion;
  // A controlled `active={false}` starts the exit without waiting for the timeline.
  const exiting = active === false ? phase !== "done" : phase === "exiting";

  React.useEffect(() => {
    controlRef.current = { active, externalProgress };
  }, [active, externalProgress]);

  const complete = React.useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (storageKey) {
      try {
        sessionStorage.setItem(storageKey, "1");
      } catch {
        // Storage can be unavailable (private mode); the intro just replays.
      }
    }
    onComplete?.();
  }, [onComplete, storageKey]);

  React.useEffect(() => {
    if (skip) complete();
  }, [complete, skip]);

  React.useEffect(() => {
    if (phase !== "loading" || skip) return;
    const startedAt = performance.now();
    let previous = startedAt;
    let shown = 0;
    let frame = 0;
    let loaded = document.readyState === "complete";
    const handleLoad = () => {
      loaded = true;
    };
    window.addEventListener("load", handleLoad);
    const tick = (now: number) => {
      const control = controlRef.current;
      if (control.active === false) return;
      const elapsed = now - startedAt;
      // Controlled asset gates must also fail open: a broken CDN response or
      // decoder can never trap the visitor behind a permanent curtain.
      if (control.active !== undefined && elapsed >= activeMaxDurationMs) {
        setPhase("exiting");
        return;
      }
      const delta = Math.min(0.05, Math.max(0.001, (now - previous) / 1000));
      previous = now;
      let next: number;
      if (typeof control.externalProgress === "number") {
        // Controlled mode: the counter eases toward the real reported progress.
        shown = damp(shown, clamp01(control.externalProgress), 7, delta);
        next = shown;
      } else {
        // Ease toward 90% on the minimum timeline; document `load` (or the cap) releases the rest.
        const simulated = 0.9 * (1 - Math.pow(1 - clamp01(elapsed / activeMinDurationMs), 2.2));
        const release = loaded || elapsed >= activeMaxDurationMs ? clamp01((elapsed - activeMinDurationMs) / 400 + simulated) : simulated;
        next = Math.min(1, Math.max(simulated, release));
        shown = next;
      }
      setDisplayProgress(next);
      // A controlled `active` holds the finished curtain until the caller releases it.
      if (next >= 0.995 && elapsed >= activeMinDurationMs && control.active === undefined) {
        setPhase("exiting");
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("load", handleLoad);
    };
  }, [activeMaxDurationMs, activeMinDurationMs, phase, skip]);

  React.useEffect(() => {
    if (phase !== "loading" || exiting || skip || !words || words.length < 2) return;
    const interval = setInterval(() => setWordIndex((index) => (index + 1) % words.length), 420);
    return () => clearInterval(interval);
  }, [exiting, phase, skip, words]);

  // Scroll stays locked only while the curtain is actually covering content.
  React.useEffect(() => {
    if (phase !== "loading" || exiting || skip) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [exiting, phase, skip]);

  React.useEffect(() => {
    if (!exiting || skip) return;
    const timeout = setTimeout(() => {
      setPhase("done");
      complete();
    }, activeExitDurationMs);
    return () => clearTimeout(timeout);
  }, [activeExitDurationMs, complete, exiting, skip]);

  if (skip || phase === "done") return null;

  const exitTransform = exit === "up" ? "translateY(-100%)" : exit === "down" ? "translateY(100%)" : "none";

  return (
    <div
      role="status"
      aria-label={label}
      data-intro-loader
      data-experience-viewport={viewport}
      data-phase={phase}
      className={cn("fixed inset-0 z-[90] flex flex-col justify-between overflow-hidden bg-[#0a0a0a] text-white", className)}
      style={{
        transform: exiting ? exitTransform : "none",
        opacity: exiting && exit === "fade" ? 0 : 1,
        transition: exiting ? `transform ${activeExitDurationMs}ms cubic-bezier(.76,0,.24,1), opacity ${activeExitDurationMs}ms ease` : undefined,
        pointerEvents: exiting ? "none" : undefined,
      }}
      {...props}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center p-5 sm:p-8">{children}</div>
      <div className="flex items-end justify-between p-6 sm:p-10">
        {words && words.length > 0 ? (
          <span aria-hidden className={cn("text-xs font-semibold uppercase tracking-[0.22em] opacity-60", wordClassName)}>
            {words[wordIndex]}
          </span>
        ) : (
          <span />
        )}
        <span aria-hidden className={cn("font-mono text-4xl font-semibold tabular-nums tracking-tight sm:text-6xl lg:text-7xl", counterClassName)}>
          {String(Math.round(displayProgress * 100)).padStart(3, "0")}
        </span>
      </div>
    </div>
  );
}

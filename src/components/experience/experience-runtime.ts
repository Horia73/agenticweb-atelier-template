"use client";

import * as React from "react";

export const EXPERIENCE_BREAKPOINTS = {
  tablet: 640,
  desktop: 1025,
} as const;

export type ExperienceViewport = "mobile" | "tablet" | "desktop";

export type ExperienceResponsiveValue<T> = T | {
  /** Mobile-first value, also used during SSR/hydration. */
  mobile: T;
  /** iPad/tablet value. Falls back to `mobile` when omitted. */
  tablet?: T;
  /** Wide-screen value. Falls back to `tablet`, then `mobile`. */
  desktop?: T;
};

const subscribeToHydration = () => () => undefined;

export function useHydrated() {
  return React.useSyncExternalStore(subscribeToHydration, () => true, () => false);
}

export function useMediaQuery(query: string, serverValue = false) {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = React.useCallback(() => window.matchMedia(query).matches, [query]);
  return React.useSyncExternalStore(subscribe, getSnapshot, () => serverValue);
}

/**
 * Hydration-safe reduced-motion preference: false on the server and during
 * hydration, then live. Replaces the repeated `mounted && useReducedMotion()`
 * pattern.
 */
export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True on touch-first devices; use to swap pointer effects for static or rail modes. */
export function useCoarsePointer() {
  return useMediaQuery("(pointer: coarse)");
}

/** True only when a hover-capable precise pointer is present. */
export function useFinePointer() {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/**
 * Shared mobile-first viewport contract for every experience primitive.
 *
 * Mobile: < 640px · tablet/iPad: 640–1024px · desktop: >= 1025px.
 * Pointer capability remains a separate signal because an iPad can gain a
 * trackpad without changing its layout profile.
 */
export function useExperienceViewport(): ExperienceViewport {
  const tablet = useMediaQuery(`(min-width: ${EXPERIENCE_BREAKPOINTS.tablet}px)`);
  const desktop = useMediaQuery(`(min-width: ${EXPERIENCE_BREAKPOINTS.desktop}px)`);
  if (desktop) return "desktop";
  if (tablet) return "tablet";
  return "mobile";
}

export function resolveExperienceValue<T>(
  value: ExperienceResponsiveValue<T>,
  viewport: ExperienceViewport,
): T {
  if (typeof value !== "object" || value === null || !("mobile" in value)) return value;
  if (viewport === "desktop") return value.desktop ?? value.tablet ?? value.mobile;
  if (viewport === "tablet") return value.tablet ?? value.mobile;
  return value.mobile;
}

/** Conservative raster/WebGL supersampling budget for each layout profile. */
export function getExperienceDprCap(width: number) {
  if (width < EXPERIENCE_BREAKPOINTS.tablet) return 1;
  if (width < EXPERIENCE_BREAKPOINTS.desktop) return 1.25;
  return 1.6;
}

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

export function damp(current: number, target: number, smoothing: number, deltaSeconds: number) {
  return mix(current, target, 1 - Math.exp(-Math.max(0.01, smoothing) * deltaSeconds));
}

/** Returns the frames sorted by `at`, reusing the input when it is already ordered. */
export function sortKeyframes<T extends { at: number }>(frames: T[]): T[] {
  for (let index = 1; index < frames.length; index += 1) {
    if (frames[index - 1]!.at > frames[index]!.at) {
      return [...frames].sort((left, right) => left.at - right.at);
    }
  }
  return frames;
}

export function resolveKeyframes<T extends { at: number }>(
  frames: T[],
  progress: number,
): { from: T; to: T; mix: number } {
  if (frames.length === 0) throw new Error("Experience keyframes cannot be empty.");
  const sorted = sortKeyframes(frames);
  if (progress <= sorted[0]!.at) return { from: sorted[0]!, to: sorted[0]!, mix: 0 };
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const from = sorted[index]!;
    const to = sorted[index + 1]!;
    if (progress <= to.at) {
      const span = Math.max(0.0001, to.at - from.at);
      return { from, to, mix: clamp01((progress - from.at) / span) };
    }
  }
  const final = sorted.at(-1)!;
  return { from: final, to: final, mix: 0 };
}

export function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true })
      || canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }),
    );
  } catch {
    return false;
  }
}

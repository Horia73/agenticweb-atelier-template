"use client";

import * as React from "react";

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

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

export function damp(current: number, target: number, smoothing: number, deltaSeconds: number) {
  return mix(current, target, 1 - Math.exp(-Math.max(0.01, smoothing) * deltaSeconds));
}

export function resolveKeyframes<T extends { at: number }>(
  frames: T[],
  progress: number,
): { from: T; to: T; mix: number } {
  if (frames.length === 0) throw new Error("Experience keyframes cannot be empty.");
  const sorted = [...frames].sort((left, right) => left.at - right.at);
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

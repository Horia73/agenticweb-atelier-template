"use client";

import * as React from "react";
import {
  type MotionValue,
  useMotionValue,
  useMotionValueEvent,
} from "motion/react";

export type ProgressPlayback = "scrub" | "commit";

/**
 * Converts a reversible scroll MotionValue into a one-way progress value.
 * Use `resetKey` when a route, slide, or story chapter should deliberately
 * replay the effect.
 */
export function useCommittedProgress(
  source: MotionValue<number>,
  playback: ProgressPlayback = "scrub",
  resetKey?: React.Key,
) {
  const committed = useMotionValue(source.get());

  React.useEffect(() => {
    committed.set(source.get());
  }, [committed, resetKey, source]);

  useMotionValueEvent(source, "change", (value) => {
    committed.set(playback === "commit" ? Math.max(committed.get(), value) : value);
  });

  return playback === "commit" ? committed : source;
}

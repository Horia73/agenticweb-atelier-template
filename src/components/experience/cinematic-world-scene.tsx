"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  motion,
  type MotionValue,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import {
  DepthCameraScene,
  type DepthCameraLayer,
  type DepthCameraSceneProps,
} from "@/components/experience/depth-camera-scene";
import { HorizontalTrack } from "@/components/experience/horizontal-track";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CinematicWorldCatalog = {
  heading: React.ReactNode;
  items: React.ReactNode[];
  label: string;
  eyebrow?: React.ReactNode;
  itemClassName?: string | ((index: number) => string | undefined);
  trackClassName?: string;
};

export type CinematicWorldSceneProps = Omit<
  DepthCameraSceneProps,
  "backOverlay" | "frontOverlay"
> & {
  catalog: CinematicWorldCatalog;
  chrome?: React.ReactNode;
  intro: React.ReactNode;
  rearNarrative?: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  frontNarrative?: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  layers: DepthCameraLayer[];
  /** Accessible name for the catalog region that owns ArrowLeft/ArrowRight frame navigation. */
  catalogRegionLabel?: string;
  /** Aria label for the previous-frame button. */
  previousFrameLabel?: string;
  /** Aria label for the next-frame button. */
  nextFrameLabel?: string;
};

function resolveNarrative(
  narrative: CinematicWorldSceneProps["rearNarrative"] | CinematicWorldSceneProps["frontNarrative"],
  progress: MotionValue<number>,
) {
  return typeof narrative === "function" ? narrative(progress) : narrative;
}

function CinematicBackOverlay({
  intro,
  narrative,
  progress,
}: {
  intro: React.ReactNode;
  narrative?: CinematicWorldSceneProps["rearNarrative"];
  progress: MotionValue<number>;
}) {
  const introOpacity = useTransform(progress, [0, 0.08, 0.19, 0.27], [1, 1, 0.45, 0]);
  const introY = useTransform(progress, [0, 0.27], [0, -110]);
  const narrativeOpacity = useTransform(progress, [0.14, 0.21, 0.33, 0.43], [0, 1, 1, 0]);
  const narrativeY = useTransform(progress, [0.14, 0.28, 0.43], [110, 0, -120]);
  const narrativeScale = useTransform(progress, [0.14, 0.33, 0.43], [0.94, 1.03, 1.1]);
  return (
    <>
      <motion.div className="absolute inset-0" style={{ opacity: introOpacity, y: introY }}>
        {intro}
      </motion.div>
      {narrative ? (
        <motion.div
          className="absolute inset-0"
          style={{ opacity: narrativeOpacity, y: narrativeY, scale: narrativeScale }}
        >
          {resolveNarrative(narrative, progress)}
        </motion.div>
      ) : null}
    </>
  );
}

function CinematicFrontOverlay({
  catalog,
  catalogRegionLabel,
  chrome,
  narrative,
  nextFrameLabel,
  previousFrameLabel,
  progress,
}: {
  catalog: CinematicWorldCatalog;
  catalogRegionLabel: string;
  chrome?: React.ReactNode;
  narrative?: CinematicWorldSceneProps["frontNarrative"];
  nextFrameLabel: string;
  previousFrameLabel: string;
  progress: MotionValue<number>;
}) {
  const target = useMotionValue(0);
  const spring = useSpring(target, { stiffness: 160, damping: 32, mass: 0.28 });
  const reducedMotion = useReducedMotion();
  const trackProgress = reducedMotion ? target : spring;
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [catalogInteractive, setCatalogInteractive] = React.useState(false);
  const chromeOpacity = useTransform(progress, [0.52, 0.66], [1, 0]);
  const narrativeOpacity = useTransform(progress, [0.7, 0.75, 0.82, 0.88], [0, 1, 1, 0]);
  const narrativeY = useTransform(progress, [0.7, 0.77, 0.88], [70, 0, -80]);
  const catalogOpacity = useTransform(progress, [0.88, 0.95, 1], [0, 0.76, 1]);
  const catalogY = useTransform(progress, [0.88, 1], ["14vh", "0vh"]);
  const catalogScale = useTransform(progress, [0.88, 1], [0.96, 1]);
  const scrimOpacity = useTransform(progress, [0.87, 0.99], [0, 0.84]);

  useMotionValueEvent(progress, "change", (value) => {
    const interactive = value >= 0.9;
    setCatalogInteractive((current) => current === interactive ? current : interactive);
    if (value < 0.72 && target.get() !== 0) {
      target.set(0);
      setActiveIndex(0);
    }
  });

  const goTo = (nextIndex: number) => {
    const lastIndex = Math.max(0, catalog.items.length - 1);
    const resolved = Math.max(0, Math.min(lastIndex, nextIndex));
    setActiveIndex(resolved);
    target.set(lastIndex === 0 ? 0 : resolved / lastIndex);
  };

  const handleCatalogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!catalogInteractive) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndex + 1);
    }
  };

  return (
    <>
      {chrome ? (
        <motion.div aria-hidden className="absolute inset-x-0 top-0 z-20" style={{ opacity: chromeOpacity }}>
          {chrome}
        </motion.div>
      ) : null}
      {narrative ? (
        <motion.div className="absolute inset-0 z-10" style={{ opacity: narrativeOpacity, y: narrativeY }}>
          {resolveNarrative(narrative, progress)}
        </motion.div>
      ) : null}
      <motion.div
        aria-hidden
        className="absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(5,9,12,.18),rgba(5,9,12,.94))]"
        style={{ opacity: scrimOpacity }}
      />
      <motion.div
        aria-hidden={!catalogInteractive}
        role="group"
        aria-label={catalogRegionLabel}
        tabIndex={catalogInteractive ? 0 : undefined}
        onKeyDown={handleCatalogKeyDown}
        data-cinematic-catalog
        className={cn(
          "absolute inset-0 z-30 flex flex-col overflow-hidden pb-6 pt-24 text-white",
          catalogInteractive ? "pointer-events-auto" : "pointer-events-none",
        )}
        style={{ opacity: catalogOpacity, y: catalogY, scale: catalogScale }}
      >
        <div className="flex items-end justify-between gap-6 px-5 sm:px-[5vw]">
          <div>
            {catalog.eyebrow ? (
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/52">
                {catalog.eyebrow}
              </div>
            ) : null}
            <div className="mt-3 text-[clamp(2.7rem,6vw,5.8rem)] font-semibold leading-[0.86] tracking-[-0.065em]">
              {catalog.heading}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="icon" className="rounded-full border-white/20 bg-black/15 text-white backdrop-blur-md hover:bg-white hover:text-black" aria-label={previousFrameLabel} tabIndex={catalogInteractive ? undefined : -1} disabled={!catalogInteractive || activeIndex === 0} onClick={() => goTo(activeIndex - 1)}>
              <ArrowLeft aria-hidden />
            </Button>
            <Button type="button" variant="outline" size="icon" className="rounded-full border-white/20 bg-black/15 text-white backdrop-blur-md hover:bg-white hover:text-black" aria-label={nextFrameLabel} tabIndex={catalogInteractive ? undefined : -1} disabled={!catalogInteractive || catalog.items.length <= 1 || activeIndex === catalog.items.length - 1} onClick={() => goTo(activeIndex + 1)}>
              <ArrowRight aria-hidden />
            </Button>
          </div>
        </div>
        <div className="mt-6 min-h-0 flex-1">
          <HorizontalTrack label={catalog.label} progress={trackProgress} itemClassName={catalog.itemClassName} trackClassName={catalog.trackClassName} progressClassName="text-white">
            {catalog.items}
          </HorizontalTrack>
        </div>
      </motion.div>
    </>
  );
}

/** A composed Advanced recipe. Use `DepthCameraScene` directly for custom timelines. */
export function CinematicWorldScene({
  catalog,
  catalogRegionLabel = "Frame catalog",
  chrome,
  frontNarrative,
  intro,
  nextFrameLabel = "Next frame",
  previousFrameLabel = "Previous frame",
  rearNarrative,
  ...props
}: CinematicWorldSceneProps) {
  return (
    <DepthCameraScene
      {...props}
      backOverlay={(progress) => (
        <CinematicBackOverlay intro={intro} narrative={rearNarrative} progress={progress} />
      )}
      frontOverlay={(progress) => (
        <CinematicFrontOverlay
          catalog={catalog}
          catalogRegionLabel={catalogRegionLabel}
          chrome={chrome}
          narrative={frontNarrative}
          nextFrameLabel={nextFrameLabel}
          previousFrameLabel={previousFrameLabel}
          progress={progress}
        />
      )}
    />
  );
}

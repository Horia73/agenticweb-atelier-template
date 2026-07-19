"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  useHydrated,
  useMediaQuery,
  usePrefersReducedMotion,
} from "@/components/experience/experience-runtime";

export type StickyStoryChapter = {
  id: string;
  eyebrow?: string;
  title: string;
  body: string;
};

type StickyStoryProps = Omit<React.ComponentProps<"section">, "children"> & {
  chapterClassName?: string;
  chapters: StickyStoryChapter[];
  contentClassName?: string;
  renderVisual: (chapter: StickyStoryChapter, index: number) => React.ReactNode;
  stageClassName?: string;
  stickyTop?: number | string;
  visualClassName?: string;
  visualLabel: string;
  visualSide?: "left" | "right";
};

/**
 * A chapter narrative whose desktop visual is registered to the viewport and
 * never participates in document movement. Mobile renders each matching visual
 * inline so the story stays complete without sticky behavior.
 */
export function StickyStory({
  chapterClassName,
  chapters,
  contentClassName,
  renderVisual,
  stageClassName,
  stickyTop = 0,
  visualClassName,
  visualLabel,
  visualSide = "left",
  className,
  ...props
}: StickyStoryProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const hydrated = useHydrated();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const prefersReducedMotion = usePrefersReducedMotion();

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const chapterNodes = root.querySelectorAll<HTMLElement>("[data-story-index]");
    if (chapterNodes.length === 0) return;
    // A chapter is active while it overlaps a thin band centered in the
    // viewport; the observer replaces per-scroll-frame rect loops entirely.
    const observer = new IntersectionObserver((entries) => {
      let closestIndex = -1;
      let closestDistance = Number.POSITIVE_INFINITY;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const bounds = entry.rootBounds;
        const bandCenter = bounds ? bounds.top + bounds.height / 2 : window.innerHeight / 2;
        const rect = entry.boundingClientRect;
        const distance = Math.abs(rect.top + rect.height / 2 - bandCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = Number((entry.target as HTMLElement).dataset.storyIndex ?? 0);
        }
      });
      if (closestIndex < 0) return;
      setActiveIndex((current) => current === closestIndex ? current : closestIndex);
    }, { rootMargin: "-45% 0px -45% 0px" });
    chapterNodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [chapters]);

  if (chapters.length === 0) return null;
  const safeIndex = Math.min(activeIndex, chapters.length - 1);

  // SSR and the hydration pass keep the dual mobile+desktop markup (CSS hides
  // the inactive side) to avoid a hydration mismatch; once mounted we swap to
  // rendering only the active variant so each visual mounts a single time.
  const showInlineVisuals = !hydrated || !desktop;
  const showStageVisual = !hydrated || desktop;

  const content = (
    <div className={cn("min-w-0 px-5 sm:px-10 lg:px-[clamp(2rem,6vw,7rem)]", contentClassName)}>
      {chapters.map((chapter, index) => (
        <article
          key={chapter.id}
          data-story-index={index}
          aria-current={index === safeIndex ? "step" : undefined}
          className={cn(
            "flex min-h-[72svh] flex-col justify-center border-b py-16 transition-opacity duration-300 motion-reduce:transition-none lg:min-h-svh",
            index === safeIndex ? "opacity-100" : "lg:opacity-40",
            chapterClassName,
          )}
        >
          {showInlineVisuals ? (
            <div
              role="img"
              aria-label={`${visualLabel}: ${chapter.title}`}
              className={cn(
                "relative mb-9 aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-muted lg:hidden",
                visualClassName,
              )}
            >
              {renderVisual(chapter, index)}
            </div>
          ) : null}
          {chapter.eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {chapter.eyebrow}
            </p>
          ) : null}
          <h3 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {chapter.title}
          </h3>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {chapter.body}
          </p>
        </article>
      ))}
    </div>
  );

  const visual = showStageVisual ? (
    <div
      className={cn("relative hidden h-svh min-w-0 lg:block", stageClassName)}
      style={{ position: "sticky", top: stickyTop }}
    >
      <div
        role="img"
        aria-label={visualLabel}
        className={cn("absolute inset-0 overflow-hidden bg-muted", visualClassName)}
      >
        {prefersReducedMotion ? (
          // Reduced motion: no crossfade stack, just an instant swap of the
          // active chapter's visual.
          <div className="absolute inset-0">
            {renderVisual(chapters[safeIndex], safeIndex)}
          </div>
        ) : (
          chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              aria-hidden={index !== safeIndex}
              className={cn(
                "absolute inset-0 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
                index === safeIndex ? "z-10 scale-100 opacity-100" : "z-0 scale-[1.015] opacity-0",
              )}
            >
              {renderVisual(chapter, index)}
            </div>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <section
      ref={rootRef}
      data-sticky-story
      data-visual-side={visualSide}
      className={cn(
        "grid items-start gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,1fr)]",
        className,
      )}
      {...props}
    >
      {visualSide === "left" ? <>{visual}{content}</> : <>{content}{visual}</>}
    </section>
  );
}

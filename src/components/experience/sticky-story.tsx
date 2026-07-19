"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

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

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const chapterNodes = root.querySelectorAll<HTMLElement>("[data-story-index]");
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const viewportCenter = window.innerHeight / 2;
        let closestIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;
        chapterNodes.forEach((node) => {
          const rect = node.getBoundingClientRect();
          const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = Number(node.dataset.storyIndex ?? 0);
          }
        });
        setActiveIndex((current) => current === closestIndex ? current : closestIndex);
      });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [chapters]);

  if (chapters.length === 0) return null;
  const safeIndex = Math.min(activeIndex, chapters.length - 1);

  const content = (
    <div className={cn("min-w-0", contentClassName)}>
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

  const visual = (
    <div
      className={cn("relative hidden h-svh min-w-0 lg:block", stageClassName)}
      style={{ position: "sticky", top: stickyTop }}
    >
      <div
        role="img"
        aria-label={visualLabel}
        className={cn("absolute inset-0 overflow-hidden bg-muted", visualClassName)}
      >
        {chapters.map((chapter, index) => (
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
        ))}
      </div>
    </div>
  );

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

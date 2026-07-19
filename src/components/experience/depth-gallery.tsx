"use client";

import * as React from "react";
import {
  motion,
  type MotionValue,
  useMotionValueEvent,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";
import {
  clamp01,
  useExperienceViewport,
  useMediaQuery,
  usePrefersReducedMotion,
} from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type DepthGalleryItem = {
  className?: string;
  content: React.ReactNode;
  depth?: number;
  description?: string;
  eyebrow?: string;
  id: string;
  label?: string;
  title?: string;
};

export type DepthGalleryProps = Omit<React.ComponentProps<"section">, "children"> & {
  exitTravel?: number;
  itemClassName?: string;
  items: DepthGalleryItem[];
  label: string;
  onActiveChange?: (index: number, item: DepthGalleryItem) => void;
  scrollScreens?: number;
  stackOffset?: number;
  stageClassName?: string;
};

function FocusCard({
  active,
  index,
  item,
  itemClassName,
  itemCount,
  progress,
  exitTravel,
  stackOffset,
}: {
  active: boolean;
  exitTravel: number;
  index: number;
  item: DepthGalleryItem;
  itemClassName?: string;
  itemCount: number;
  progress: MotionValue<number>;
  stackOffset: number;
}) {
  const position = useTransform(progress, (value) => index - value * Math.max(itemCount - 1, 1));
  const depthStrength = Math.min(1, Math.abs(item.depth ?? 0.5));

  // Earlier cards always stay above later cards. They lift away to reveal the
  // next frame below, so no z-index handoff can flicker mid-transition.
  const y = useTransform(position, (value) => {
    if (value < 0) return `${Math.max(-exitTravel, value * exitTravel)}%`;
    return `${Math.min(2, value) * stackOffset}%`;
  });
  const z = useTransform(position, (value) => {
    if (value < 0) return Math.min(1, -value) * 24;
    return -Math.min(2, value) * (86 + depthStrength * 54);
  });
  const scale = useTransform(position, (value) => {
    if (value < 0) return 1 + Math.min(1, -value) * 0.025;
    return 1 - Math.min(2, value) * (0.052 + depthStrength * 0.01);
  });
  const opacity = useTransform(position, (value) => {
    if (value < -0.82) return clamp01(1 - (-value - 0.82) / 0.18);
    if (value > 2) return clamp01(1 - (value - 2) * 4);
    return 1;
  });
  const contentOpacity = useTransform(position, (value) => {
    if (value < 0) return clamp01(1 - -value / 0.34);
    return clamp01(1 - value / 0.24);
  });
  const rotateX = useTransform(position, (value) => {
    if (value < 0) return Math.max(-2.5, value * 2.5);
    return Math.min(2.5, value * 1.5);
  });

  return (
    <motion.article
      role="listitem"
      aria-current={active ? "true" : undefined}
      aria-hidden={!active}
      aria-label={item.label ?? item.title}
      data-depth-gallery-item={item.id}
      inert={!active}
      className={cn(
        "absolute left-1/2 top-1/2 aspect-[16/10] w-[min(88vw,68rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[clamp(1.25rem,3vw,2.5rem)] bg-muted shadow-2xl [backface-visibility:hidden] will-change-transform",
        itemClassName,
        item.className,
      )}
      style={{ opacity, pointerEvents: active ? "auto" : "none", rotateX, scale, transformStyle: "preserve-3d", y, z, zIndex: itemCount - index }}
    >
      <div className="absolute inset-0">{item.content}</div>
      {item.eyebrow || item.title || item.description ? (
        <motion.div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/10 to-transparent p-[clamp(1.5rem,4vw,4rem)] text-white" style={{ opacity: contentOpacity }}>
          <div className="max-w-2xl">
            {item.eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">{item.eyebrow}</p> : null}
            {item.title ? <h3 className="mt-3 text-[clamp(2.2rem,6vw,6rem)] font-semibold leading-[0.9] tracking-[-0.06em]">{item.title}</h3> : null}
            {item.description ? <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">{item.description}</p> : null}
          </div>
        </motion.div>
      ) : null}
    </motion.article>
  );
}

/**
 * A clear, scroll-driven focus stack: the next frame approaches the camera,
 * the current frame locks into focus, and the previous frame recedes.
 */
export function DepthGallery({
  className,
  exitTravel = 112,
  itemClassName,
  items,
  label,
  onActiveChange,
  scrollScreens,
  stackOffset = 7,
  stageClassName,
  style,
  ...props
}: DepthGalleryProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const viewport = useExperienceViewport();
  const coarsePointer = useMediaQuery("(pointer: coarse)");
  const staticLayout = reducedMotion || coarsePointer || viewport !== "desktop";
  const [activeIndex, setActiveIndex] = React.useState(0);
  const scrollYProgress = useElementScrollProgress(rootRef);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (items.length === 0) return;
    const position = value * Math.max(items.length - 1, 1);
    const nextIndex = Math.max(0, Math.min(items.length - 1, Math.floor(position + 0.2)));
    setActiveIndex((current) => {
      if (current === nextIndex) return current;
      onActiveChange?.(nextIndex, items[nextIndex]!);
      return nextIndex;
    });
  });

  if (items.length === 0) return null;

  if (staticLayout) {
    return (
      <section ref={rootRef} aria-label={label} data-depth-gallery data-experience-viewport={viewport} data-static className={cn("relative min-h-svh", className)} style={style} {...props}>
        <div role="list" className="flex min-h-svh snap-x snap-mandatory items-center gap-4 overflow-x-auto px-5 py-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <article key={item.id} role="listitem" aria-label={item.label ?? item.title} className={cn("relative aspect-[4/5] min-w-[84vw] snap-center overflow-hidden rounded-[1.5rem] bg-muted sm:min-w-[52vw]", itemClassName, item.className)}>
              <div className="absolute inset-0">{item.content}</div>
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-6 text-white">
                <div>{item.eyebrow ? <p className="text-xs uppercase tracking-[0.2em] text-white/60">{item.eyebrow}</p> : null}{item.title ? <h3 className="mt-2 text-4xl font-semibold tracking-[-0.05em]">{item.title}</h3> : null}{item.description ? <p className="mt-3 text-sm text-white/70">{item.description}</p> : null}</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-active-index={activeIndex}
      data-depth-gallery
      data-experience-viewport={viewport}
      className={cn("relative isolate", className)}
      style={{ minHeight: `${Math.max(items.length, scrollScreens ?? items.length) * 100}svh`, perspective: 1200, ...style }}
      {...props}
    >
      <div className={cn("sticky top-0 h-svh overflow-hidden [transform-style:preserve-3d]", stageClassName)}>
        <div role="list" className="absolute inset-0 [transform-style:preserve-3d]">
          {items.map((item, index) => (
            <FocusCard
              key={item.id}
              active={index === activeIndex}
              exitTravel={exitTravel}
              index={index}
              item={item}
              itemClassName={itemClassName}
              itemCount={items.length}
              progress={scrollYProgress}
              stackOffset={stackOffset}
            />
          ))}
        </div>
        <div aria-hidden className="absolute bottom-6 right-6 z-30 flex gap-2">
          {items.map((item, index) => <span key={item.id} className={cn("h-1 rounded-full bg-white/45 transition-[width,background-color]", index === activeIndex ? "w-10 bg-white" : "w-3")} />)}
        </div>
      </div>
    </section>
  );
}

"use client";

import * as React from "react";
import { useMotionValueEvent } from "motion/react";

import { cn } from "@/lib/utils";
import { clamp01, useMediaQuery, usePrefersReducedMotion } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type KnockoutTextProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  /** The knocked-out copy. A visually hidden heading keeps it real text. */
  text: string;
  /** Image revealed through the letters and, at the end, full-bleed. */
  src: string;
  /** Alternate art direction below 640px. */
  mobileSrc?: string;
  /** Semantic element that carries the copy for assistive tech and SEO. */
  as?: "h1" | "h2" | "h3" | "p";
  /** Pinned travel length in scroll screens. */
  scrollScreens?: number;
  /** How far the letter-windows zoom past the camera at the end of the travel. */
  maxScale?: number;
  /** The point the camera flies through, as a transform-origin (aim inside a letter counter). */
  origin?: string;
  /** Curtain color around the letters while the scene is still dark. */
  curtainColor?: string;
  /** Fixed chrome (eyebrow, hints) above the stage. */
  overlay?: React.ReactNode;
  textClassName?: string;
  stageClassName?: string;
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * A pinned knockout sequence in four beats driven by one scroll travel: the
 * stage starts dark, the headline rises in as solid type, the letters then
 * turn into transparent windows — the photograph sits fixed behind a curtain
 * and shows only through the letterforms — and finally the type zooms toward
 * the camera until the windows swallow the viewport and the image takes over.
 * The image never sticks to the glyphs: it is a fixed backdrop revealed
 * through an SVG mask, so zooming reads as flying through the letters.
 * Scrolling back replays every beat in reverse. A visually hidden heading
 * keeps the copy real; reduced motion shows the composed knockout frame with
 * no pin.
 */
export function KnockoutText({
  as: Tag = "h1",
  className,
  curtainColor = "#050505",
  label,
  maxScale = 16,
  mobileSrc,
  origin = "50% 46%",
  overlay,
  scrollScreens = 3,
  src,
  stageClassName,
  text,
  textClassName,
  ...props
}: KnockoutTextProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const groupRef = React.useRef<SVGGElement>(null);
  const solidGroupRef = React.useRef<SVGGElement>(null);
  const solidTextRef = React.useRef<SVGTextElement>(null);
  const holeTextRef = React.useRef<SVGTextElement>(null);
  const curtainRef = React.useRef<SVGRectElement>(null);
  const imageRef = React.useRef<HTMLDivElement>(null);
  const maskId = React.useId();
  const reducedMotion = usePrefersReducedMotion();
  const mobile = useMediaQuery("(max-width: 639.98px)");
  const activeSrc = mobile && mobileSrc ? mobileSrc : src;
  const progress = useElementScrollProgress(rootRef);

  const applyProgress = React.useCallback(
    (value: number) => {
      const group = groupRef.current;
      const solidText = solidTextRef.current;
      const holeText = holeTextRef.current;
      const curtain = curtainRef.current;
      const image = imageRef.current;
      if (!group || !solidText || !holeText || !curtain || !image) return;
      // Beat 1 — the headline rises out of the dark.
      const entry = easeInOut(clamp01(value / 0.22));
      // Beat 2 — the letters become windows: solid type fades, holes open.
      const fill = easeInOut(clamp01((value - 0.2) / 0.25));
      // Beat 3 — the windows fly toward the camera.
      const zoom = clamp01((value - 0.42) / 0.58);
      // Beat 4 — the letters pass the camera; the curtain dissolves into the image.
      const takeover = easeInOut(clamp01((value - 0.82) / 0.15));
      const scale = 1 + (maxScale - 1) * Math.pow(zoom, 2.4);
      const transform = `translate3d(0, ${((1 - entry) * 14).toFixed(3)}%, 0) scale(${scale.toFixed(4)})`;
      group.style.transform = transform;
      if (solidGroupRef.current) solidGroupRef.current.style.transform = transform;
      solidText.style.opacity = `${(entry * (1 - fill)).toFixed(3)}`;
      holeText.style.opacity = fill.toFixed(3);
      image.style.opacity = fill < 0.02 ? "0" : "1";
      curtain.style.opacity = `${(1 - takeover).toFixed(3)}`;
    },
    [maxScale],
  );

  useMotionValueEvent(progress, "change", (value) => {
    if (!reducedMotion) applyProgress(value);
  });

  React.useEffect(() => {
    if (!reducedMotion) applyProgress(progress.get());
  }, [applyProgress, progress, reducedMotion]);

  if (reducedMotion) {
    return (
      <section ref={rootRef} aria-label={label} data-knockout-text data-static className={cn("relative grid min-h-svh place-items-center overflow-hidden", className)} style={{ backgroundColor: curtainColor }} {...props}>
        {overlay}
        <Tag
          className={cn("relative", textClassName)}
          style={{
            backgroundImage: `url("${activeSrc}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {text}
        </Tag>
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-knockout-text
      className={cn("relative", className)}
      style={{ minHeight: `${Math.max(1.5, scrollScreens) * 100}svh`, backgroundColor: curtainColor }}
      {...props}
    >
      <Tag className="sr-only">{text}</Tag>
      <div className={cn("sticky top-0 h-svh overflow-hidden", stageClassName)}>
        {/* The photograph is a fixed backdrop: the letters only ever reveal it, they never carry it. */}
        <div
          ref={imageRef}
          aria-hidden
          className="absolute inset-0 opacity-0"
          style={{ backgroundImage: `url("${activeSrc}")`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <svg aria-hidden className="absolute inset-0 size-full">
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
              <rect width="100%" height="100%" fill="white" />
              <g ref={groupRef} className="will-change-transform" style={{ transformBox: "view-box", transformOrigin: origin }}>
                <text
                  ref={holeTextRef}
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="black"
                  className={textClassName}
                  style={{ opacity: 0 }}
                >
                  {text}
                </text>
              </g>
            </mask>
          </defs>
          {/* The curtain: dark everywhere except through the letter windows. */}
          <rect ref={curtainRef} width="100%" height="100%" fill={curtainColor} mask={`url(#${maskId})`} />
          {/* Beat-1 solid type, drawn with the same geometry so the crossfade registers perfectly. */}
          <g ref={solidGroupRef} className="will-change-transform" style={{ transformBox: "view-box", transformOrigin: origin }}>
            <text
              ref={solidTextRef}
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              fill="currentColor"
              className={textClassName}
              style={{ opacity: 0 }}
            >
              {text}
            </text>
          </g>
        </svg>
        {overlay}
      </div>
    </section>
  );
}

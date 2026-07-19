"use client";

import * as React from "react";
import { useMotionValueEvent } from "motion/react";

import { cn } from "@/lib/utils";
import { clamp01, useExperienceViewport, usePrefersReducedMotion } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type KnockoutTextProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  /** The knocked-out copy. A visually hidden heading keeps it real text. */
  text: string;
  /** Image revealed only through the transparent letterforms. */
  src: string;
  /** Alternate art direction below 640px. */
  mobileSrc?: string;
  /** Dedicated iPad/tablet art direction between 640px and 1023px. */
  tabletSrc?: string;
  /** Semantic element that carries the copy for assistive tech and SEO. */
  as?: "h1" | "h2" | "h3" | "p";
  /** Pinned travel length in scroll screens. */
  scrollScreens?: number;
  /** How far the transparent letterforms advance past the camera. */
  maxScale?: number;
  mobileMaxScale?: number;
  tabletMaxScale?: number;
  /** Continuous destination push-in while the camera crosses the glyph. */
  imageMaxScale?: number;
  mobileImageMaxScale?: number;
  tabletImageMaxScale?: number;
  /** Fallback camera anchor when no focusIndex is supplied. */
  origin?: string;
  mobileOrigin?: string;
  tabletOrigin?: string;
  /** Character whose transparent face becomes the camera path. */
  focusIndex?: number;
  /** Passage point inside that character's inked shape, from 0 to 1. */
  passageX?: number;
  passageY?: number;
  mobilePassageX?: number;
  mobilePassageY?: number;
  tabletPassageX?: number;
  tabletPassageY?: number;
  /** Opaque stage color surrounding the transparent letterforms. */
  curtainColor?: string;
  /** Fixed chrome (eyebrow, hints) above the stage. */
  overlay?: React.ReactNode;
  textClassName?: string;
  stageClassName?: string;
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * A pinned knockout sequence in four beats driven by one scroll travel: the
 * stage starts dark and the headline rises in as solid type. Once fully
 * visible, those exact letterforms become transparent windows onto the image.
 * The selected central glyph then advances until the camera passes through an
 * inked part of its now-transparent shape — never through an artificial circle
 * or through the glyph's counter. The surrounding dark field stays opaque.
 * Scrolling back replays every beat in reverse. A visually hidden heading
 * keeps the copy real; reduced motion shows the composed knockout frame with
 * no pin.
 */
export function KnockoutText({
  as: Tag = "h1",
  className,
  curtainColor = "#050505",
  focusIndex,
  imageMaxScale = 1.5,
  label,
  maxScale = 210,
  mobileImageMaxScale,
  mobileMaxScale,
  mobileOrigin,
  mobilePassageX,
  mobilePassageY,
  mobileSrc,
  origin = "50% 46%",
  overlay,
  passageX = 0.5,
  passageY = 0.55,
  scrollScreens = 3,
  src,
  stageClassName,
  tabletMaxScale,
  tabletImageMaxScale,
  tabletOrigin,
  tabletPassageX,
  tabletPassageY,
  tabletSrc,
  text,
  textClassName,
  ...props
}: KnockoutTextProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const cutoutGroupRef = React.useRef<SVGGElement>(null);
  const cutoutGlyphRefs = React.useRef<Array<SVGTextElement | null>>([]);
  const solidGroupRef = React.useRef<SVGGElement>(null);
  const measureTextRef = React.useRef<SVGTextElement>(null);
  const solidTextRef = React.useRef<SVGTextElement>(null);
  const curtainRef = React.useRef<SVGRectElement>(null);
  const imageRef = React.useRef<HTMLDivElement>(null);
  const passageShiftRef = React.useRef({ x: 0, y: 0 });
  const maskId = React.useId();
  const reducedMotion = usePrefersReducedMotion();
  const viewport = useExperienceViewport();
  const activeSrc = viewport === "mobile"
    ? mobileSrc ?? tabletSrc ?? src
    : viewport === "tablet"
      ? tabletSrc ?? src
      : src;
  const activeMaxScale = viewport === "mobile"
    ? mobileMaxScale ?? tabletMaxScale ?? Math.min(maxScale, 200)
    : viewport === "tablet"
      ? tabletMaxScale ?? Math.min(maxScale, 210)
      : maxScale;
  const activeImageMaxScale = viewport === "mobile"
    ? mobileImageMaxScale ?? tabletImageMaxScale ?? imageMaxScale
    : viewport === "tablet"
      ? tabletImageMaxScale ?? imageMaxScale
      : imageMaxScale;
  const activeOrigin = viewport === "mobile"
    ? mobileOrigin ?? tabletOrigin ?? origin
    : viewport === "tablet"
      ? tabletOrigin ?? origin
      : origin;
  const activePassageX = viewport === "mobile"
    ? mobilePassageX ?? tabletPassageX ?? passageX
    : viewport === "tablet"
      ? tabletPassageX ?? passageX
      : passageX;
  const activePassageY = viewport === "mobile"
    ? mobilePassageY ?? tabletPassageY ?? passageY
    : viewport === "tablet"
      ? tabletPassageY ?? passageY
      : passageY;
  const progress = useElementScrollProgress(rootRef);

  React.useLayoutEffect(() => {
    const measureText = measureTextRef.current;
    const cutoutGroup = cutoutGroupRef.current;
    const solidGroup = solidGroupRef.current;
    if (!measureText || !cutoutGroup || !solidGroup) return;

    let cancelled = false;
    const svg = measureText.ownerSVGElement;
    const updateOrigin = () => {
      if (cancelled) return;
      const count = measureText.getNumberOfChars();
      if (count < 1) return;
      cutoutGlyphRefs.current.forEach((glyph, glyphIndex) => {
        if (!glyph || glyphIndex >= count) return;
        const start = measureText.getStartPositionOfChar(glyphIndex);
        glyph.setAttribute("x", start.x.toFixed(3));
      });
      if (focusIndex === undefined) {
        passageShiftRef.current = { x: 0, y: 0 };
        cutoutGroup.style.transformOrigin = activeOrigin;
        solidGroup.style.transformOrigin = activeOrigin;
        return;
      }
      const index = Math.min(count - 1, Math.max(0, Math.round(focusIndex)));
      const box = measureText.getExtentOfChar(index);
      const x = box.x + box.width * clamp01(activePassageX);
      const y = box.y + box.height * clamp01(activePassageY);
      const measuredOrigin = `${x.toFixed(3)}px ${y.toFixed(3)}px`;
      passageShiftRef.current = {
        x: (svg?.clientWidth ?? 0) * 0.5 - x,
        y: (svg?.clientHeight ?? 0) * 0.5 - y,
      };
      cutoutGroup.style.transformOrigin = measuredOrigin;
      solidGroup.style.transformOrigin = measuredOrigin;
    };

    updateOrigin();
    const resizeObserver = svg ? new ResizeObserver(updateOrigin) : null;
    if (svg) resizeObserver?.observe(svg);
    void document.fonts.ready.then(updateOrigin);

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [activeOrigin, activePassageX, activePassageY, focusIndex, text]);

  const applyProgress = React.useCallback(
    (value: number) => {
      const cutoutGroup = cutoutGroupRef.current;
      const solidGroup = solidGroupRef.current;
      const solidText = solidTextRef.current;
      const curtain = curtainRef.current;
      const image = imageRef.current;
      if (!cutoutGroup || !solidGroup || !solidText || !curtain || !image) return;
      // Beat 1 — the complete word arrives as ordinary solid type.
      const entry = easeInOut(clamp01(value / 0.12));
      // Beat 2 — after a short hold, the solid word becomes a set of exact
      // transparent glyph cutouts. The opaque field around it never fades.
      const cutout = easeInOut(clamp01((value - 0.16) / 0.08));
      // Beat 3 — the cutout letters advance. The origin is placed inside the
      // inked shape of the selected glyph, not inside its counter.
      const flight = clamp01((value - 0.22) / 0.78);
      const targetScale = Math.max(1, activeMaxScale);
      const scale = 1 + (targetScale - 1) * Math.pow(flight, 2.15);
      const cameraTrack = easeInOut(clamp01(flight / 0.6));
      const passageShift = passageShiftRef.current;
      const transform = `translate3d(${(passageShift.x * cameraTrack).toFixed(3)}px, ${(passageShift.y * cameraTrack).toFixed(3)}px, 0) translateY(${((1 - entry) * 14).toFixed(3)}%) scale(${scale.toFixed(4)})`;
      const destinationScale = 1 + (Math.max(1, activeImageMaxScale) - 1) * Math.pow(flight, 1.15);
      cutoutGroup.style.transform = transform;
      solidGroup.style.transform = transform;
      cutoutGroup.style.opacity = cutout.toFixed(3);
      solidText.style.opacity = (entry * (1 - cutout)).toFixed(3);
      // Once the camera has crossed the transparent stroke, release the dark
      // field in one discrete handoff. It never fades or grows as a new shape.
      curtain.style.visibility = value >= 0.7 ? "hidden" : "visible";
      image.style.clipPath = "none";
      image.style.opacity = cutout > 0.001 ? "1" : "0";
      image.style.transform = `scale(${destinationScale.toFixed(4)})`;
      if (rootRef.current) {
        rootRef.current.dataset.phase = value < 0.12
          ? "entry"
          : value < 0.16
            ? "solid-hold"
            : value < 0.24
              ? "glyph-cutout"
              : value < 0.7
                ? "glyph-flight"
                : "image-arrival";
      }
    },
    [activeImageMaxScale, activeMaxScale],
  );

  useMotionValueEvent(progress, "change", (value) => {
    if (!reducedMotion) applyProgress(value);
  });

  React.useEffect(() => {
    if (!reducedMotion) applyProgress(progress.get());
  }, [applyProgress, progress, reducedMotion]);

  if (reducedMotion) {
    return (
      <section ref={rootRef} aria-label={label} data-knockout-text data-experience-viewport={viewport} data-static className={cn("relative grid min-h-svh place-items-center overflow-hidden px-4 sm:px-8", className)} style={{ backgroundColor: curtainColor }} {...props}>
        {overlay}
        <Tag
          className={cn("relative", textClassName)}
          style={{
            backgroundImage: `url("${activeSrc}")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
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
      data-experience-viewport={viewport}
      className={cn("relative overflow-x-clip", className)}
      style={{ minHeight: `${Math.max(1.5, scrollScreens) * 100}svh`, backgroundColor: curtainColor }}
      {...props}
    >
      <Tag className="sr-only">{text}</Tag>
      <div className={cn("sticky top-0 h-svh overflow-hidden", stageClassName)}>
        {/* Fixed destination; the opaque curtain reveals it only inside the letters. */}
        <div
          ref={imageRef}
          aria-hidden
          data-knockout-image
          className="absolute inset-0 opacity-0 will-change-transform"
          style={{ backgroundImage: `url("${activeSrc}")`, backgroundSize: "cover", backgroundPosition: "center", transformOrigin: "center" }}
        />
        <svg aria-hidden className="absolute inset-0 size-full">
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
              <rect width="100%" height="100%" fill="white" />
              <g
                ref={cutoutGroupRef}
                data-knockout-cutout
                className="will-change-transform"
                style={{ opacity: 0, transformBox: "view-box", transformOrigin: activeOrigin }}
              >
                {Array.from(text).map((character, index) => (
                  <text
                    key={`${character}-${index}`}
                    ref={(node) => { cutoutGlyphRefs.current[index] = node; }}
                    x="50%"
                    y="50%"
                    textAnchor="start"
                    dominantBaseline="central"
                    fill="black"
                    className={textClassName}
                  >
                    {character}
                  </text>
                ))}
              </g>
            </mask>
          </defs>
          {/* The dark field stays fully opaque; only the glyph shapes perforate it. */}
          <rect ref={curtainRef} width="100%" height="100%" fill={curtainColor} mask={`url(#${maskId})`} />
          {/* Stable, untransformed geometry source for responsive passage measurement. */}
          <text
            ref={measureTextRef}
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className={textClassName}
            visibility="hidden"
          >
            {text}
          </text>
          {/* Entry type on the initial dark stage. */}
          <g ref={solidGroupRef} className="will-change-transform" style={{ transformBox: "view-box", transformOrigin: activeOrigin }}>
            <text
              ref={solidTextRef}
              data-knockout-solid
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

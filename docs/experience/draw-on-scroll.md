# Draw On Scroll

## Purpose

Use scroll-driven stroke drawing for diagrams, maps, signatures and technical illustration. It animates the stroked shapes of an inline SVG you fully control — it is not a canvas effect and does not own your artwork.

## Install and use

```tsx
import { DrawOnScroll } from "@/components/experience/draw-on-scroll";

<DrawOnScroll label="Process diagram" stagger={0.5}>
  <svg viewBox="0 0 800 400" className="w-full" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M40 200 C 200 40, 400 360, 760 120" />
    <circle cx="40" cy="200" r="8" />
  </svg>
</DrawOnScroll>
```

Every `path`, `circle`, `line`, `polyline`, `polygon` and `rect` with a stroke is drawn in document order. `stagger` blends between simultaneous (0) and strictly sequential (1). Use `pin` + `scrollScreens` for a pinned drawing beat, or pass an external `progress` MotionValue. Bump `remeasureKey` after swapping the SVG content.

## Gates

- Reduced motion renders the finished drawing immediately — never a blank frame.
- Fills are untouched; if a shape must stay invisible until drawn, keep it stroke-only.
- Verify reverse scroll, the non-pinned viewport ranges at 390 and 1440 px, and that decorative SVGs carry `aria-hidden` while meaningful ones keep a `<title>`.

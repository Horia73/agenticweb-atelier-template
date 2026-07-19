# Knockout Text

## Purpose

A pinned type-traversal sequence with no artificial aperture: the headline first enters as fully solid type, then those exact glyph shapes become transparent cutouts onto the destination. A selected central glyph advances until the camera passes through an inked part of its transparent form, not through its counter. The surrounding dark field never fades or becomes transparent, and no circle, ellipse, or independent reveal shape is introduced. The copy remains real text for accessibility and SEO.

## Install and use

```tsx
import { KnockoutText } from "@/components/experience/knockout-text";

<KnockoutText
  label="From dark, through the letters, into the image"
  as="h1"
  text="PORTAL"
  src="/media/hero-fill.webp"
  mobileSrc="/media/hero-fill-mobile.webp"
  scrollScreens={3.5}
  maxScale={210}
  mobileMaxScale={200}
  tabletMaxScale={210}
  imageMaxScale={1.5}
  mobileImageMaxScale={1.55}
  tabletImageMaxScale={1.52}
  focusIndex={2}
  passageX={0.15}
  passageY={0.5}
  textClassName="text-[clamp(4rem,17cqw,19rem)] font-bold leading-none tracking-tight text-white"
  overlay={<Chrome />}
/>
```

The stages are fixed fractions of the pinned travel (solid entry → short hold → transparent glyph cutouts → glyph flight → image arrival) and replay exactly in reverse. The image begins to show only inside the actual letterforms after the word is fully visible. During flight, the selected transparent stroke is tracked toward the viewport center while the destination performs a continuous push-in, so the passage reads as forward camera travel rather than lateral mask drift. The dark field never fades and no growing circle is introduced; after the camera has crossed the selected transparent stroke, the field is removed in one discrete handoff to the full image. `maxScale` controls the advancing glyphs; `imageMaxScale` controls the destination push-in, with mobile and tablet overrides for both. `focusIndex` selects the glyph, while `passageX`/`passageY` place the camera inside an inked part of its measured box; do not place this point in the glyph's counter. The component recalculates the point after resize and font loading, with responsive passage overrides available when needed. Explicit `origin` values remain available when no `focusIndex` is supplied. Reduced motion renders the real word filled with the destination image and removes the pin.

## Gates

- Use heavy, tight type: its strokes must stay legible after they become transparent and while the letterforms advance.
- Choose a visually central glyph with a broad stroke (`T`, `H`, `E`, `R`, `A`) and pass through that stroke, not through an enclosed counter.
- The measured `passageX`/`passageY` point must land inside the glyph's inked shape. At the endpoint, that transparent stroke must exceed the viewport.
- Keep the tracked passage point centered during the crossing and verify that the destination keeps scaling; the mask must not read as a horizontal pan.
- Keep the word solid until its entry is complete; only then transition its exact glyph shapes into image cutouts.
- Do not add radial/circular reveals and do not fade the surrounding dark field. Only the letterforms become transparent.
- The opaque field around the letters needs sufficient contrast; choose `curtainColor` accordingly.
- Verify the takeover endpoint: at progress 1 the full image must be composed art direction, not an accidental crop; check 390px as well as desktop.
- The image is decorative; any information it carries must also exist as real content nearby. Test 200% zoom and `clamp()` the font size so the word never overflows mid-zoom.

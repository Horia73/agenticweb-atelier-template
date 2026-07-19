# Knockout Text

## Purpose

A pinned knockout-type sequence in four scroll-driven beats: the stage starts dark, the headline rises in as solid type, photography fades into the letterforms via `background-clip: text`, then the type zooms toward the camera until the letters become windows and the full image takes over the stage. The copy is real, selectable text throughout.

## Install and use

```tsx
import { KnockoutText } from "@/components/experience/knockout-text";

<KnockoutText
  label="From dark, through the letters, into the image"
  as="h1"
  text="ATELIER"
  src="/media/hero-fill.webp"
  mobileSrc="/media/hero-fill-mobile.webp"
  scrollScreens={3.5}
  maxScale={18}
  origin="50% 46%"
  textClassName="text-[clamp(4rem,17vw,19rem)] font-bold leading-none tracking-tight text-white"
  overlay={<Chrome />}
/>
```

Beats are fixed fractions of the pinned travel (entry → fill → zoom → takeover) and replay in reverse on reverse scroll. `maxScale` controls how far the type passes the camera, `origin` places the point the camera flies through (aim it inside a letter counter), `revealImage={false}` keeps the sequence type-only, and `backgroundClassName` sets the dark stage. Reduced motion renders the composed image-filled headline with no pin.

## Gates

- Use heavy, tight type: thin strokes make both the fill and the zoom unreadable.
- The letterforms must stay readable over the busiest region of the image during the fill beat — pick a coherent tonality or pre-treat the asset.
- Verify the takeover endpoint: at progress 1 the full image must be composed art direction, not an accidental crop; check 390px as well as desktop.
- The image is decorative; any information it carries must also exist as real content nearby. Test 200% zoom and `clamp()` the font size so the word never overflows mid-zoom.

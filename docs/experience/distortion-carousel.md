# Distortion Carousel

## Purpose

Use a draggable GPU image strip for hero galleries, campaign switchers and lookbooks. Velocity bends the image, shifts its spectrum and pulls it toward the camera — the drag itself is the experience, not just the navigation.

## Install and use

```tsx
import { DistortionCarousel } from "@/components/experience/distortion-carousel";

<DistortionCarousel
  label="Campaign gallery"
  items={[
    { id: "dawn", src: "/media/dawn.webp", alt: "Dawn over the coast" },
    { id: "dusk", src: "/media/dusk.webp", alt: "Dusk in the valley" },
  ]}
  distortion={1.1}
  className="h-svh"
  renderCaption={(item, index, active) => <Caption item={item} active={active} />}
/>
```

Drag (mouse or touch — vertical page scroll stays native via `touch-pan-y`), arrow keys on the focused stage, prev/next buttons and dots all drive the same snapped offset with momentum and edge rubber-banding. Textures load lazily around the active slide. Tune `distortion`, `smoothing`, `dragSensitivity`; captions crossfade per slide via `renderCaption`.

## Gates

- Reduced motion and WebGL failure render a native snap rail with plain images — same content, no distortion.
- The stage is a labeled `carousel` group with a polite live region announcing the active slide; keep `alt` texts real.
- Verify fling snapping at both ends (rubber band), reverse drags mid-flight, lazy texture loads on slow networks, context loss, and 390/768/1440 px.

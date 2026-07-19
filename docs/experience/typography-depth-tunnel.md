# Typography Depth Tunnel

## Purpose

Use a depth tunnel when a short sequence of phrases is the story. It is CSS 3D applied to semantic React text, not text baked into a rendered image.

## Install and use

```tsx
import { TypographyDepthTunnel } from "@/components/experience/typography-depth-tunnel";

<TypographyDepthTunnel
  label="Manifesto"
  items={[
    { id: "idea", accessibleText: "Ideas gain depth", content: <h2>IDEAS GAIN DEPTH.</h2> },
    { id: "proof", accessibleText: "Proof comes forward", content: <h2>PROOF COMES FORWARD.</h2> },
  ]}
  perspective={1100}
  depth={900}
  smoothing={92}
/>
```

Art-direct each layer through `content`, `className` and `align`; tune depth, perspective, scroll length and spring smoothing. Each phrase owns an exclusive focus slot with only a short crossfade at the boundary. Keep the list short enough to read and provide accurate `accessibleText`.

## Gates

- At reduced motion and narrow widths the component becomes a normal vertical semantic sequence.
- Verify 200% zoom, long translations, diacritics, reverse scroll, no overlap at endpoints and readable contrast.

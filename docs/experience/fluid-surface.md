# Fluid Surface

## Purpose

Use dissipating image distortion for water, material memory or responsive atmosphere. It is a bounded image surface, not a site-wide cursor effect.

## Install and use

```tsx
import { FluidSurface } from "@/components/experience/fluid-surface";

<FluidSurface
  label="Responsive material"
  src="/media/material.webp"
  alt="Macro material surface"
  strength={0.03}
  radius={0.26}
  decay={0.9}
  fallback={<MaterialPoster />}
>
  <Copy />
</FluidSurface>
```

Customize source, crop, strength, radius, decay and chromatic edge. Keep required actions outside highly distorted areas and retain the native cursor.

## Gates

- Coarse pointer and reduced motion use a complete static image. No decorative dot or cursor replacement is allowed.
- Verify rapid pointer movement, leaving/re-entering the field, offscreen pause, context loss, load failure, DPR cap and text contrast.

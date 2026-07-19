# Refractive Glass

## Purpose

Use one bounded refractive lens when the brief needs materiality or product precision. It is an image-aware WebGL effect, not a replacement for every card or navigation surface.

## Install and use

```tsx
import { RefractiveGlass } from "@/components/experience/refractive-glass";

<RefractiveGlass
  label="Material study"
  src="/media/scene.webp"
  mobileSrc="/media/scene-mobile.webp"
  alt="Product in a mineral landscape"
  lensSize={420}
  lensAspect={1.5}
  refraction={0.022}
  aberration={0.004}
>
  <HeroCopy />
</RefractiveGlass>
```

The source is sampled inside WebGL, so use a high-resolution responsive master with the same crop as the fallback. Customize `shape`, size, aspect, radius, refraction, magnification and chromatic edge; do not reuse the Lab copy or composition.

## Gates

- Keep the native cursor and a restrained refraction value; required copy must remain semantic and outside the canvas.
- Provide `mobileSrc` for a materially different crop and `fallback` when a branded static treatment is needed.
- Verify loading failure, context loss, reduced motion, coarse pointer, contrast and 390/768/1440 px. The component caps DPR, pauses offscreen and cleans up its renderer.

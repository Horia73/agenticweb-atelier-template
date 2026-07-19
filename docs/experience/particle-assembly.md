# Particle Assembly

## Purpose

Use a particle-to-object reveal for formation, computation or assembly narratives. The target comes from a transparent or high-contrast raster; semantic copy always remains React/HTML.

## Install and use

```tsx
import { ParticleAssembly } from "@/components/experience/particle-assembly";

<ParticleAssembly
  label="Signal becomes product"
  src="/media/product-mask.webp"
  colorSrc="/media/product-color.webp"
  sampling="light"
  alt="Product assembled from points"
  trigger="scroll"
  particleCount={7000}
  scatter={4.5}
  color="#d7ff43"
  fallback={<ProductPoster />}
>
  <Narrative />
</ParticleAssembly>
```

Choose `scroll`, `hover`, or `controlled`; external timelines pass a `MotionValue<number>`. `src` defines the sampled silhouette, while optional `colorSrc` transfers recognizable product color into `aColor`. Select `alpha`, `light`, `dark` or `auto` sampling, then personalize point count, size, base/source color mix, scatter, smoothing, section length and background.

## Gates

- Supply a clean alpha/high-contrast matte and test that target sampling produces a recognizable silhouette.
- Cap point count for mobile GPUs; reduced motion and WebGL failure must show a complete object, not an empty stage.
- Verify reverse scroll, offscreen pause, context loss, resize and text contrast at all breakpoints.

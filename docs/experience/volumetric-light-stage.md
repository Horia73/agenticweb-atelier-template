# Volumetric Light Stage

## Purpose

Use procedural shafts and haze to art-direct an existing scene, not to hide a weak source image. The component samples one raster and adds up to three editable light emitters.

## Install and use

```tsx
import { VolumetricLightStage } from "@/components/experience/volumetric-light-stage";

<VolumetricLightStage
  label="Atmospheric product stage"
  src="/media/clean-stage.webp"
  alt="Product on an atmospheric stage"
  beams={[{ x: 0.25, width: 0.14, angle: 0.2, color: "#ffd29d", intensity: 1.1 }]}
  density={0.8}
  haze={0.6}
>
  <ProductCopy />
</VolumetricLightStage>
```

Customize every emitter, density, haze, speed, pointer influence, crop and semantic overlay. Prefer a clean source with intentional negative space.

## Gates

- Maintain text contrast throughout the animated light cycle and provide a branded static fallback.
- Verify DPR cap, offscreen pause, context loss, reduced motion, load failure and 390/768/1440 crops.

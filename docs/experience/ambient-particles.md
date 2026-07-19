# Ambient Particles

## Purpose

A decorative atmosphere layer behind hero content: `dust`, `snow`, `embers` or `fireflies` rendered as soft prerendered glow sprites across three depth bands (far particles are smaller, slower and dimmer). It is a background layer, never a mechanic — the section must communicate identically with the layer removed.

## Install and use

```tsx
import { AmbientParticles } from "@/components/experience/ambient-particles";

<section className="relative min-h-svh bg-black">
  <Image src="/media/hero.webp" alt="…" fill className="object-cover" />
  <AmbientParticles preset="embers" density={5} opacity={0.7} pointerInfluence={40} />
  <div className="relative z-10">…hero content…</div>
</section>
```

`density` is particles per 100 000 px² (hard-capped by `maxCount`), `colors` overrides the preset palette, `size`/`speed`/`opacity` shape the look and `blend` is available when the preset's own compositing (additive for glow presets, normal for snow) needs overriding. `edgeFade` controls the margin across which particles dissolve at the stage border, and `pointerInfluence` adds a gentle depth-weighted push on fine pointers. Particles survive resizes by reprojecting instead of respawning. Place it inside a `position: relative` parent; it fills the parent and ignores pointer events.

## Gates

- Reduced motion renders nothing — never attach content or meaning to the particles.
- Budget is enforced (area-scaled count, `maxCount`, DPR cap, offscreen/hidden-tab pause); do not raise `maxCount` past ~200 without profiling.
- Keep `edgeFade` at or above ~0.08 whenever the section meets other content, so the field never pops against its border.
- Particles must not reduce copy contrast: keep `opacity` restrained and test over the real background.
- One field per viewport; stacking several defeats the budget.

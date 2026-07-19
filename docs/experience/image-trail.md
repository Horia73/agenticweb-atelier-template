# Image Trail

## Purpose

Use a decaying trail of images behind the cursor for editorial, fashion and portfolio moments. It is a decorative flourish over a real section — content stays in `children`, the trail never carries meaning.

## Install and use

```tsx
import { ImageTrail } from "@/components/experience/image-trail";

<ImageTrail
  label="Collection tease"
  images={["/media/look-1.webp", "/media/look-2.webp", "/media/look-3.webp"]}
  size={200}
  threshold={110}
  className="min-h-svh"
  fallback={<StaticCollage />}
>
  <Heading />
</ImageTrail>
```

Cards spawn every `threshold` pixels of pointer travel, cycle through `images` in order, and animate in/out via the Web Animations API from a fixed pool (`maxActive`) — no per-move allocations. Tune `size`, `lifeMs` and `rotationJitter` to the art direction.

## Gates

- Touch and reduced motion render only `children` (plus the optional `fallback` layer) — never an auto-playing trail.
- The trail layer is `aria-hidden`; images are decorative and preloaded on mount.
- Verify fast pointer sweeps (pool recycling), text contrast above the trail, and that nothing in the trail intercepts clicks.

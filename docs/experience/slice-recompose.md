# Slice & Recompose

## Purpose

Use image slices to communicate reconstruction, modularity or transformation. It accepts one high-resolution source and never duplicates accessible image semantics.

## Install and use

```tsx
import { SliceRecompose } from "@/components/experience/slice-recompose";

<SliceRecompose
  label="Portrait recomposes"
  src="/media/portrait.webp"
  alt="Editorial portrait"
  axis="vertical"
  slices={11}
  scatter={220}
  stagger={0.28}
  trigger="scroll"
>
  <Copy />
</SliceRecompose>
```

Tune axis, slice count, scatter, rotation, stagger and timeline driver. `controlled` accepts a shared `MotionValue`; `hover` is reversible and must not contain required information.

## Gates

- The exact assembled endpoint must reproduce the source with no gaps or seams.
- Use a large enough source for the final viewport, verify reverse scroll and resize, and keep the reduced-motion state fully assembled.

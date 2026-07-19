# Physics Playground

## Purpose

Drop badge, pill or card stickers into a section with gravity, let them collide and stack, and let visitors grab, drag and toss them. A tiny internal engine (no physics dependencies) runs circle bodies with staggered drops, wall and pair collisions, and a rotation flourish; the arrangement is purely decorative.

## Install and use

```tsx
import { PhysicsPlayground } from "@/components/experience/physics-playground";

<PhysicsPlayground
  label="Things we ship"
  className="min-h-[480px]"
  header={<h2 className="p-6 text-2xl font-semibold">Toss these around</h2>}
  items={capabilities.map((capability) => ({
    id: capability.id,
    content: (
      <span className="rounded-full border bg-card px-5 py-2.5 text-sm font-medium shadow-sm">
        {capability.name}
      </span>
    ),
  }))}
  gravity={1600}
  restitution={0.35}
  dropStagger={90}
/>
```

The consumer must give the section a height via `className` (for example `min-h-[480px]`): the stage fills the space left under `header` and bodies fall within it, so a zero-height stage shows nothing. Tune gravity, restitution, air friction, drop stagger and toss speed cap; give items stable intrinsic sizes because each body is measured once after mount (or pass an explicit `radius`).

## Gates

- Reduced motion disables physics entirely: items render in a static `flex flex-wrap` arrangement (`data-static`) with no rAF loop. Coarse pointers keep physics and touch dragging.
- The arrangement is decorative only; wrappers are never focusable and interactive content keeps its own semantics inside `content`, with the required `label` describing the section for screen readers.
- Verify that a fast drag release genuinely flings, that the loop sleeps once every body is at rest and pauses offscreen or when the tab is hidden, and that any pointerdown, resize or re-entry wakes it.
- Verify resize re-clamps bodies into the stage, page scroll stays native outside bodies (`touch-action: none` on bodies only), and the min-height requirement is met at mobile widths and 200% zoom.

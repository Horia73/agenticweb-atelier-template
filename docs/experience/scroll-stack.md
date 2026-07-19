# Scroll Stack

## Purpose

Stacking cards for services/process/feature narratives: each card pins near the viewport top and the next one slides over it while the covered card gently scales down and dims. Scrolling back replays the stack in reverse; the document keeps its native scroll.

## Install and use

```tsx
import { ScrollStack } from "@/components/experience/scroll-stack";

<ScrollStack label="Services" topOffset={96} peek={16} scaleStep={0.05} dim={0.35} className="px-5">
  <article className="min-h-[70svh] rounded-3xl bg-neutral-900 p-10">…</article>
  <article className="min-h-[70svh] rounded-3xl bg-lime-300 p-10">…</article>
  <article className="min-h-[70svh] rounded-3xl bg-white p-10">…</article>
</ScrollStack>
```

Each direct child is one card of any height. `topOffset` sets the pin line, `peek` staggers each card's pin a few pixels lower so covered headers stay visible, `gap` is the in-flow rhythm, `scaleStep`/`dim` shape the covered state.

## Gates

- Cards must be tall enough (≥ ~60svh) that pinning reads as intent; a stack of short rows becomes a glitchy list.
- The last card never transforms — verify the section releases cleanly into the next block.
- Reduced motion renders a plain vertical list with the same content and order.
- Cards with interactive content stay usable while partially covered; do not put critical CTAs at the bottom edge that the next card covers first.

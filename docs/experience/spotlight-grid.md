# Spotlight Grid

## Purpose

Cursor-lit cards: a shared pointer field illuminates the border and interior of every card near the cursor (the Linear/Vercel bento treatment). One listener and one rAF loop drive the whole group through CSS variables; cards keep their own content, background and resting border.

## Install and use

```tsx
import { SpotlightCard, SpotlightGroup } from "@/components/experience/spotlight-grid";

<SpotlightGroup radius={320} color="rgba(215,255,67,.6)" className="grid gap-4 md:grid-cols-3">
  <SpotlightCard className="rounded-3xl border border-white/10 bg-white/[.03] p-8">…</SpotlightCard>
  <SpotlightCard color="rgba(115,215,255,.55)" className="rounded-3xl border border-white/10 p-8">…</SpotlightCard>
</SpotlightGroup>
```

Group props: `radius`, `color`, `fillOpacity` (interior glow, 0 disables). Card props: `color` override and `borderWidth` for the illuminated ring. The ring uses a mask-composite border technique, so it inherits the card's `border-radius`.

## Gates

- Cards need a visible resting border/background of their own — the spotlight is an accent, not the only affordance, and touch/reduced motion render it not at all.
- The glow color must keep card text contrast intact; test the brightest state over the card's palette.
- Keep groups to a screenful of cards: rects are measured per frame while the pointer moves, which is cheap for a bento, not for a 100-row table.
- Interactive content inside cards keeps native focus styles; the spotlight never replaces `:focus-visible`.

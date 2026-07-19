# Split-Flap

## Purpose

A split-flap departure board for headlines, statuses and destinations: each cell mechanically flips through a glyph wheel to its target character with column stagger — on first viewport entry and again whenever `text` changes. High nostalgia, real information.

## Install and use

```tsx
import { SplitFlapText } from "@/components/experience/split-flap";

<SplitFlapText text="NOW BOARDING" className="font-mono text-6xl" stepMs={70} staggerMs={40} />
<SplitFlapText text={status} padTo={16} once={false} className="font-mono" />
```

`charset` defines the wheel (include the language's diacritics; the default covers A–Z, digits and Romanian), `stepMs`/`staggerMs` the rhythm, `maxSteps` caps flips per cell, `padTo` fixes the board width in cells for changing content, and `fit` (default on) shrinks the board's font so a long line can never overflow its container. Every flap is derived from timestamps — one run is just `startedAt` plus per-column wheel paths — so remounts can never strand the board mid-word. The full string is the accessible name and the server-rendered content; reduced motion renders plain static text.

## Gates

- Use a monospaced (or tabular) font: cells reserve `1ch`, and proportional glyphs will jitter the board.
- Characters missing from `charset` resolve to the wheel's first glyph — verify every character you display is on the wheel.
- Keep boards short (a line or two); a paragraph of flaps is noise and costs a React render per flip.
- On `text` changes the board animates from the current characters — pad with `padTo` so length changes do not reflow the layout.

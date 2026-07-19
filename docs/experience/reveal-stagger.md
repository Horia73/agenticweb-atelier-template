# Reveal Stagger

## Purpose

The workhorse entrance choreography: a group of elements (cards, list rows, a headline plus its support copy) animates in with a shared stagger when the group scrolls into view. `RevealText` adds masked word/character reveals for headlines. Use it to give ordinary sections rhythm — it is deliberately not a signature mechanic.

## Install and use

```tsx
import { RevealItem, RevealStagger, RevealText } from "@/components/experience/reveal-stagger";

<RevealStagger variant="rise" staggerMs={90}>
  <RevealItem><h2>…</h2></RevealItem>
  <RevealItem delayMs={80}><p>…</p></RevealItem>
</RevealStagger>

<RevealText text="Craft moves the eye" by="word" className="text-7xl font-semibold" />
```

Variants: `fade`, `rise`, `blur`, `clip`, `zoom`; items can override the group variant, delay and order. `once={false}` replays on every entry. `RevealText` observes itself, so it works with or without a surrounding group.

## Gates

- Server markup and reduced motion render everything in the final state — content never depends on JS to be readable; below-fold items may briefly render visible before hydration, which is the accepted trade-off.
- Choreograph moments, not the whole page: two or three groups per view, staggers under ~120ms, or the page feels slow.
- `RevealText` keeps the full string as the accessible name; the animated fragments are `aria-hidden`.
- Verify `once={false}` groups do not fight sticky/pinned neighbours by re-triggering mid-interaction.

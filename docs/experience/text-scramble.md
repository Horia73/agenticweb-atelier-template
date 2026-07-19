# Text Scramble

## Purpose

Terminal-style decode for short technical copy: characters resolve left-to-right while unresolved slots flicker through a glyph pool. Works as a one-shot reveal (`trigger="visible"`), a hover affordance on labels, or a cycling headline (`phrases`).

## Install and use

```tsx
import { TextScramble } from "@/components/experience/text-scramble";

<TextScramble text="SYSTEMS ONLINE" trigger="visible" once className="font-mono" scrambleClassName="opacity-50" />
<TextScramble text="Design" phrases={["Design", "Engineering", "Motion"]} holdMs={2400} className="font-mono" />
```

`charset` controls the glyph pool (match the language/diacritics), `durationMs` the decode length, `scrambleClassName` styles the not-yet-settled characters. The real string is the server-rendered content and the accessible name; reduced motion renders static text (phrase cycles still swap, instantly).

## Gates

- Use a monospaced or uppercase treatment: proportional lowercase glyphs make the line width shiver during the decode.
- Keep it to short strings (labels, one-line headlines) — paragraphs of scramble are noise, not craft.
- When cycling phrases, reserve layout for the longest phrase (e.g. a min-width) so surrounding content does not reflow.
- The decode must finish under ~1.2s; the user should never wait for copy.

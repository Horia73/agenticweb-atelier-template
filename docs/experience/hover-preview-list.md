# Hover Preview List

## Purpose

The editorial index pattern: a typographic list of projects/articles where hovering a row summons a floating media panel that follows the cursor, tilts with velocity and crossfades between rows. The list itself stays a plain semantic list of links — the panel is decorative.

## Install and use

```tsx
import { HoverPreviewList } from "@/components/experience/hover-preview-list";

<HoverPreviewList
  label="Selected work"
  previewWidth={340}
  items={works.map((work) => ({
    id: work.slug,
    content: <a href={work.href} className="flex justify-between py-6">{work.title}<span>{work.year}</span></a>,
    preview: <Image src={work.cover} alt="" fill className="object-cover" />,
  }))}
/>
```

Tune `previewWidth`, `previewAspect`, `smoothing`, `maxTilt`; style rows via `itemClassName(index, active)` and the panel via `previewClassName`. Keyboard focus anchors the panel beside the focused row. On touch/reduced motion the panel is skipped and `inlineFallback` renders each preview inside its row (disable it when rows already show thumbnails).

## Gates

- Rows must be real links/buttons with their own focus styles; the panel never carries required information.
- Verify the panel stays inside the list bounds (it clamps) and never covers the row currently under the cursor in a way that blocks the click — it is `pointer-events: none`, keep it that way.
- Provide a deliberate touch layout: either `inlineFallback` media or rows that are self-sufficient.
- Media in previews should be small (the panel is ~340px), not the full-resolution case-study hero.

# 3D Film Strip

## Purpose

Use a curved film strip when simultaneous context and one changing focus frame matter. It differs from Spatial Gallery: multiple frames intentionally remain visible as one continuous strip.

## Install and use

```tsx
import { FilmStrip3D } from "@/components/experience/film-strip-3d";

<FilmStrip3D
  label="Campaign chapters"
  items={chapters.map((chapter) => ({ id: chapter.id, label: chapter.title, content: <ChapterCard chapter={chapter} /> }))}
  spacing={460}
  curve={210}
/>
```

Every frame is live React content. Tune spacing, curve, perspective, scroll length and frame size; keep 3–7 items for a legible rhythm.

## Gates

- Narrow and reduced-motion modes become a native horizontal snap strip.
- Verify future/past frame opacity, no clipping at both ends, reverse scroll, semantic labels, focusable content and image delivery quality.

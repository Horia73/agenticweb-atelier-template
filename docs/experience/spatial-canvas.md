# Spatial Canvas

## Purpose

Use an explorable plane for archives, maps of ideas or non-linear collections. If ordering is the main message, use a normal grid or rail instead.

## Install and use

```tsx
import { SpatialCanvas } from "@/components/experience/spatial-canvas";

<SpatialCanvas
  label="Explore the archive"
  worldSize={[2400, 1600]}
  items={[{ id: "origin", x: -400, y: 120, width: 520, label: "Origin study", content: <OriginCard /> }]}
  initialView={{ x: 0, y: 0, zoom: 0.8 }}
/>
```

Every item is semantic React content with explicit world coordinates. Tune world size, view, zoom bounds, grid rhythm and item styling; listen to `onViewChange` for state or deep links.

## Gates

- Drag pans; arrows pan; plus/minus zoom; zero and the reset control restore the initial view. Ctrl/Command + wheel zooms, while ordinary wheel keeps page scrolling.
- Narrow/reduced-motion output is a native snap rail. Verify focus, links inside items, touch, 200% zoom and that the initial composition exposes useful content.

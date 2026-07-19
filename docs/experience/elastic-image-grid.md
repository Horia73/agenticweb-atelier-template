# Elastic Image Grid

## Purpose

Use a proximity field to make a curated grid feel responsive while preserving its information architecture. It keeps the native cursor and disables the field for coarse pointers and reduced motion.

## Install and use

```tsx
import { ElasticImageGrid } from "@/components/experience/elastic-image-grid";

<ElasticImageGrid
  label="Selected work"
  items={projects.map((project) => ({ id: project.id, label: project.title, content: <ProjectCard project={project} /> }))}
  radius={440}
  maxTravel={32}
  maxTilt={3}
/>
```

Tune minimum item width, radius, travel, scale, tilt and smoothing. Each item owns its image, link, copy, crop and visual identity.

## Gates

- Motion must remain bounded and must not cause layout shift, collision that hides content, or a custom cursor.
- Verify keyboard links without a pointer, coarse touch, reduced motion, quick pointer exit, resize and 200% zoom.

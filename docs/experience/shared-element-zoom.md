# Shared Element Zoom

## Purpose

Use a continuous grid-to-detail morph for portfolios, product grids and case studies. The cell itself becomes the detail view — no hard cut, fully reversible. It is a layout transition, not a lightbox clone.

## Install and use

```tsx
import { SharedElementZoom } from "@/components/experience/shared-element-zoom";

<SharedElementZoom
  label="Selected work"
  items={projects}
  renderThumb={(project) => <ProjectCard project={project} />}
  renderDetail={(project, { close }) => <ProjectDetail project={project} onDone={close} />}
  gridClassName="md:grid-cols-3"
/>
```

Items need `id` and `label`; everything visual lives in your render props. The expanded view is a real dialog: Escape, backdrop click and the close button all dismiss it, and focus returns to the trigger. Pass `cursorLabel` (e.g. "Open") to show a pointer-following badge over cells on fine pointers — the affordance that cells expand; cells also lift on hover and keep `cursor: pointer`.

## Gates

- Reduced motion replaces the morph with a plain fade; the dialog semantics stay identical.
- Keep `renderThumb` non-interactive — the whole cell is the trigger button.
- Verify keyboard flow (open, Escape, focus restore), scroll lock while open, and that detail content scrolls internally on small viewports.

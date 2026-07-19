# Scene Handoff

## Purpose

Use a handoff when two live React scenes need one continuous narrative transition. Unlike a two-image mesh, both endpoints can contain video, product UI, semantic copy and controls.

## Install and use

```tsx
import { SceneHandoff } from "@/components/experience/scene-handoff";

<SceneHandoff
  label="From process to outcome"
  from={<ProcessScene />}
  to={<OutcomeScene />}
  fromLabel="Process"
  toLabel="Outcome"
  variant="depth"
  scrollScreens={3}
/>
```

Choose `depth`, `shutter` or `iris`, or pass a shared `MotionValue<number>` to coordinate with a larger sequence. Endpoint scenes own all content and art direction.

## Gates

- Both exact endpoints must be clean, with a single continuous seam and natural reverse scroll.
- Reduced motion renders two normal semantic scenes (or the explicit `fallback`). Verify focus behavior, media playback policy, resize, route changes and 390/768/1440 px.

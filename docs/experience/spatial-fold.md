# Spatial Fold

## Purpose

Use Spatial Fold for a short, high-impact chapter sequence in which live React surfaces hinge away from the viewport and reveal the next surface behind them. The fold should communicate a meaningful change of perspective, layer or chapter; it is not a replacement for ordinary page sections.

Unlike `scene-handoff`, both chapters do not dissolve through one another. The outgoing chapter remains a physical surface with a visible hinge, controlled perspective and directional light while the next chapter is already present behind it.

## Install and use

```tsx
import { SpatialFold, type SpatialFoldChapter } from "@/components/experience/spatial-fold";

const chapters: SpatialFoldChapter[] = [
  {
    id: "origin",
    label: "Origin",
    hinge: "left",
    content: <OriginChapter />,
  },
  {
    id: "process",
    label: "Process",
    hinge: "bottom",
    content: <ProcessChapter />,
  },
  {
    id: "result",
    label: "Result",
    content: <ResultChapter />,
  },
];

<SpatialFold
  label="From raw material to final form"
  chapters={chapters}
  scrollScreensPerChapter={1.15}
  perspective={1400}
  maxFold={92}
/>
```

Every chapter is complete React content. `hinge` belongs to the outgoing chapter and accepts `left`, `right`, `top` or `bottom`; the last chapter never folds. `progress` can replace the internal scroll driver when a parent recipe owns the timeline. `overlay` can render persistent progress or navigation copy, but required chapter content stays inside each chapter.

The default scroll duration is derived from the chapter count. Use `scrollScreensPerChapter` to tune pacing, not to compress several folds into one fast gesture. `perspective`, `maxFold`, `depth`, `shadowStrength` and per-chapter `className` personalize the material without changing the semantic structure.

## Behavior contract

- A transition has three readable phases: the current chapter settles, folds around its declared edge, then releases the next chapter as the active plane.
- Scroll is native, monotonic and fully reversible. The component never captures the wheel or creates an internal scroll container.
- Only the outgoing surface transforms. Future chapters remain stacked behind it and past chapters become inert and hidden after their fold completes.
- The last chapter reaches a complete, front-facing endpoint before the sticky stage releases into normal document flow.
- Desktop and capable tablet viewports may use the spatial stage. Mobile, coarse pointer and reduced-motion output is a normal vertical sequence with identical chapter order and labels.

## Gates

- Keep the sequence to 3–5 chapters. More folds become navigation rather than one signature beat.
- Each chapter must remain a complete composition at `0deg`; never rely on the folded underside to communicate required text or actions.
- Do not place forms, dialogs or primary CTAs in a chapter while it is transforming. Put important interaction in the final chapter or after the fold sequence.
- Alternate hinge directions deliberately. Random left/right/top/bottom changes cause disorientation and are not art direction.
- Keep `maxFold` between roughly `78deg` and `96deg`. Larger rotations expose mirrored backs and smaller rotations leave the previous chapter covering the next one.
- Verify the hinge edge at 200% zoom, reverse scroll by a few pixels at every seam, route restoration, resize and sticky release.
- The linear fallback is the canonical semantic path. If CSS 3D, JavaScript or motion is unavailable, every chapter remains readable in the same order.

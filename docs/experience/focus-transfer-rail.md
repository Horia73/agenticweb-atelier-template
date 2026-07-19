# Focus Transfer Rail

## Purpose

`FocusTransferRail` keeps a short media collection in one fixed row while native vertical scroll transfers visual priority from one panel to the next. It is useful for themes, product variants, chapters, materials, or services that belong together and should be compared without becoming a carousel.

Use it for two to five complete React panels. The primitive controls only the proportional width of each panel; imagery, copy, color, overlays, and art direction stay project-owned.

## Install

```bash
npx shadcn@latest add @agenticweb/focus-transfer-rail
```

```tsx
import {
  FocusTransferRail,
  type FocusTransferRailItem,
} from "@/components/experience/focus-transfer-rail";

const items: FocusTransferRailItem[] = [
  { id: "one", label: "First scene", content: <FirstScene /> },
  { id: "two", label: "Second scene", content: <SecondScene /> },
  { id: "three", label: "Third scene", content: <ThirdScene /> },
];

export function Collection() {
  return (
    <FocusTransferRail
      label="Three atmospheres"
      items={items}
      activeRatio={2.35}
      idleRatio={1}
      scrollScreensPerStep={0.9}
      stageClassName="px-8 pb-8 pt-24"
      trackClassName="mx-auto mt-10 w-full max-w-7xl flex-1 gap-3"
      itemClassName="rounded-3xl"
      staticTrackClassName="grid-cols-1 sm:grid-cols-3"
      staticItemClassName="min-h-96 rounded-3xl"
    />
  );
}
```

Pass `progress` when another timeline owns the sequence. Without it, the component measures its own section and uses native page scroll. Scrolling backward reverses the same interpolation.

## Customization gates

- Keep the collection between two and five panels. Beyond that, use a native rail or a gallery with explicit navigation.
- Keep each panel semantically complete. Do not hide required copy or the only CTA inside a collapsed frame.
- Use stable media dimensions and deliberate crops; width changes must not trigger intrinsic-size layout shifts.
- `activeRatio` should usually stay between `1.8` and `2.8`. Larger values make neighboring panels unreadable and turn the mechanic into a reveal.
- `scrollScreensPerStep` controls pacing per focus transfer. Values around `0.75–1.1` read as deliberate without stalling the page.
- Use `header`, `overlay`, and class slots for project identity. The primitive intentionally ships no palette, typography, or client assets.

## Responsive and accessibility contract

- Desktop with a fine pointer: sticky full-viewport stage, reversible width transfer, and no wheel interception.
- Mobile, tablet, coarse pointer, or reduced motion: semantic grid in normal document flow, in the same order, with all content visible.
- Every panel requires a useful `label`; media inside it still requires its own correct `alt` text.
- The component never changes DOM order, focus order, or reading order as visual focus moves.
- Verify at `390`, `768`, `1024`, and `1440` px, at `200%` zoom, with reversed scroll, reduced motion, coarse pointer, and slow media loading.

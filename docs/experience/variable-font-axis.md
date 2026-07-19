# Variable Font Axis

## Purpose

Use live variable-font axes — weight, width, optical size, slant — as the motion itself. Pointer mode swells the characters near the cursor; scroll mode drives the whole line. The text stays real, selectable and semantic: only `font-variation-settings` moves.

## Install and use

```tsx
import { VariableFontAxis } from "@/components/experience/variable-font-axis";

<VariableFontAxis
  label="Manifesto headline"
  text="Material moves meaning"
  as="h1"
  axes={[{ tag: "wght", from: 300, to: 800 }]}
  mode="pointer"
  radius={180}
  textClassName="text-[clamp(3rem,9vw,9rem)] tracking-tight"
/>
```

The font in `textClassName` must actually be variable on the listed axes. Combine axes freely (`wght` + `wdth`). Scroll mode accepts `pin` + `scrollScreens` or an external `progress`.

## Gates

- Reduced motion and coarse pointers render static text at the `from` values; pointer mode also requires a fine pointer.
- Pointer mode splits characters visually but mirrors the full text for AT via `sr-only`; scroll mode never splits.
- Verify the chosen font really covers the axis range (no faux bolding), line wrapping at 390 px, and that the loop idles when the cursor leaves.

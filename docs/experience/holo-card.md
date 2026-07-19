# Holo Card

## Purpose

Use a trading-card holographic treatment for product cards, memberships, certificates and collectibles: 3D tilt toward the pointer, a rainbow foil that slides across the surface and a glare highlight. It is a wrapper — the card's real content and semantics stay in `children`.

## Install and use

```tsx
import { HoloCard } from "@/components/experience/holo-card";

<HoloCard maxTilt={12} foil={0.8} glare={0.7} className="w-80">
  <MembershipCard />
</HoloCard>
```

Tune `maxTilt`, `foil`, `glare`, `scaleOnHover`, `radius` and `foilStops` (the rainbow). `foilMaskSrc` restricts the foil to a pattern (logo, texture) via CSS mask. The tilt loop damps toward the pointer and stops itself once the card settles.

## Gates

- Touch and reduced motion render the card fully static — no tilt, no foil sweep; never hide content behind the effect.
- The foil uses `mix-blend-color-dodge`: verify legibility of text inside the card on light and dark content.
- Verify pointer enter/leave settling (no stuck tilt), nested interactive elements still clickable, and that the wrapper adds no layout shift.

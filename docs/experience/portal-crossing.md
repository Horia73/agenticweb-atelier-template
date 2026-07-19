# Portal Crossing

## Purpose

Use a portal crossing when the story needs a literal threshold between two worlds. At rest the section is simply the origin photo, full-bleed and untouched — no portal exists yet. Scroll births it far in the deep: a 3D portal condenses gradually out of the haze at the horizon and glides ~30 world-units toward the camera with real perspective growth (ease-in-out — a gentle start, never a pop), settles in front of the camera, and continued scroll carries the camera physically through it into the other world. The scene is scroll-only — the cursor never influences it — and the "3D" lives in the portal object itself: an irregular tube contour that undulates in depth with varying thickness, dressed as the boundary between the worlds — the half facing the aperture wears the destination image, the half facing the surrounding scene wears the origin image, split along the contour crest.

## Install and use

```tsx
import { PortalCrossing, PORTAL_CROSSING_AT } from "@/components/experience/portal-crossing";

<PortalCrossing
  label="Crossing into the product world"
  origin={{ src: "/img/wasteland.webp", alt: "Silent mineral horizon" }}
  destination={{ src: "/img/forest.webp", alt: "Lush forest clearing" }}
  arrival={<ArrivalHero />}
  overlay={(progress) => <PinnedHud progress={progress} />}
/>
```

The choreography: the origin photo holds the frame alone; over the arrival window the portal travels from deep in the scene toward its resting plane (ease-out, with a slow settling spin), dissolving in from the haze while the photo recedes slightly to give it focus. A rippling energy film glazes the aperture and fades as the approach commits. The camera then flies a straight ease-in-out dolly through the ring — the aperture swallows the viewport, the stencil masking flips invisibly at the threshold (exported as `PORTAL_CROSSING_AT` for overlay choreography), a light bloom pulses, and the camera decelerates inside the destination while `arrival` content fades up and becomes interactive. Fully reversible: scrolling back re-crosses and sends the portal back into the deep.

The rim is a real 3D object: fixed harmonics modulate the contour's radius and push it in and out of depth, the tube thickness varies along the path, and both world textures wrap it 50/50 (fresnel lighting plus a soft accent glow from `rimColors`; the origin-facing half dims in sync with the receding photo). `irregularity` (0–1) scales the organic deformation down to a clean circle at 0. Because the destination exists only through a true stencil aperture, the rim occludes the world behind it correctly at every angle. Pass a shared `MotionValue<number>` as `progress` to drive the section externally.

## Gates

- The destination must read as a *different world* from the origin — distinct palette, light and subject — or the crossing has no narrative payoff. The rim wears both textures split at its crest, so a low-contrast pairing also mutes the portal itself.
- At rest the frame must be exactly the origin photo: never pre-open the portal, never attach pointer effects to this section.
- Asset gate: the arrival frame magnifies the center of the destination image roughly 1.15×, so supply a source comfortably above the largest viewport it must survive; the DPR cap already refuses to supersample past its texel density.
- Reduced motion renders the destination image with `arrival` visible statically (or the explicit `fallback`); the same composition serves WebGL failure, so it must communicate the message alone.
- One portal per page. The stage pins for `scrollScreens` (default 4) viewport heights — keep the section's neighbors calm so the traversal owns its scroll range.
- Verify forward and reverse scroll across the threshold with zero pops, the closed portal at rest, resize and 390/768/1440 px.

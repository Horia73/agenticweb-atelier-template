# Portal Crossing

## Purpose

Use a portal crossing when the story needs a literal threshold between two worlds. At rest the section is simply the origin photo, full-bleed and untouched — no portal exists yet. Scroll births it far in the deep — and the birth is a morph out of the photo itself: a patch of the origin's own pixels puckers and swirls at the birth point, and the ENTIRE portal is camouflaged in those pixels — the backdrop plane, a ray-projected veil over the aperture and the rim tube all sample the same warped photo, pixel-continuously. The reveal is driven by true distance as the portal physically travels ~30 world-units toward the camera (no scaling, only real approach with an ease-in-out arrival): late in the approach and gradually, the aperture veil dissolves toward the destination while the rim morphs from photo-matter into its own dual-world tube in the same breath — one body, one becoming. Nothing can ever pop: no foreign color, no early destination, no early edge. Continued scroll carries the camera physically through the ring into the other world. The scene is scroll-only — the cursor never influences it — and the "3D" lives in the portal object itself: an irregular tube contour that undulates in depth with varying thickness, dressed as the boundary between the worlds — the half facing the aperture wears the destination image, the half facing the surrounding scene wears the origin image, split along the contour crest.

## Install and use

```tsx
import { PortalCrossing, PORTAL_CROSSING_AT } from "@/components/experience/portal-crossing";

<PortalCrossing
  label="Crossing into the product world"
  origin={{ src: "/img/wasteland.webp", alt: "Silent mineral horizon" }}
  destination={{ src: "/img/coastal-road.webp", alt: "Coastal road at sunset" }}
  arrival={<ArrivalHero />}
  overlay={(progress) => <PinnedHud progress={progress} />}
/>
```

The choreography: the origin photo holds the frame alone; over the arrival window the portal travels from deep in the scene toward its resting plane (ease-out, with a slow settling spin), dissolving in from the haze while the photo recedes slightly to give it focus. A rippling energy film glazes the aperture and fades as the approach commits. The camera then flies a straight ease-in-out dolly through the ring — the aperture swallows the viewport, the stencil masking flips invisibly at the threshold (exported as `PORTAL_CROSSING_AT` for overlay choreography), a light bloom pulses, and the camera decelerates inside the destination while `arrival` content fades up and becomes interactive. Fully reversible: scrolling back re-crosses and sends the portal back into the deep.

The rim is a real, living 3D object: fixed harmonics modulate the contour's radius and push it in and out of depth, the tube thickness varies along the path plus a slow traveling wave that keeps the edge visibly breathing, and both world textures wrap it 50/50 (the origin-facing half dims in sync with the receding photo). The matter itself behaves like liquid glass, in place: the sampled world pixels ripple as if refracted through moving glass (no circulation around the ring — the assets never rotate), the meniscus between the two worlds undulates, and a glassy highlight breathes along the circumference — all in the fragment shader, on top of fresnel lighting and a soft accent glow from `rimColors`. `irregularity` (0–1) scales the organic deformation down to a clean circle at 0. Because the destination exists only through a true stencil aperture, the rim occludes the world behind it correctly at every angle. Pass a shared `MotionValue<number>` as `progress` to drive the section externally.

## Gates

- The destination must read as a *different world* from the origin — distinct palette, light and subject — or the crossing has no narrative payoff. The rim wears both textures split at its crest, so a low-contrast pairing also mutes the portal itself.
- At rest the frame must be exactly the origin photo: never pre-open the portal, never attach pointer effects to this section.
- Asset gate: the arrival frame magnifies the center of the destination image roughly 1.15×, so supply a source comfortably above the largest viewport it must survive; the DPR cap already refuses to supersample past its texel density.
- Reduced motion renders the destination image with `arrival` visible statically (or the explicit `fallback`); the same composition serves WebGL failure, so it must communicate the message alone.
- One portal per page. The stage pins for `scrollScreens` (default 4) viewport heights — keep the section's neighbors calm so the traversal owns its scroll range.
- Verify forward and reverse scroll across the threshold with zero pops, the closed portal at rest, resize and 390/768/1440 px.

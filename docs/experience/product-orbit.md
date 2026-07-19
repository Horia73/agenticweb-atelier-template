# Product Orbit

## Purpose

Use this viewer when inspecting form or explaining real product details is part of the story. Prefer a compressed, optimized GLB with meaningful hotspot coordinates; the built-in primitives are for prototyping and art direction.

## Install and use

```tsx
import { ProductOrbit } from "@/components/experience/product-orbit";

<ProductOrbit
  label="Explore the product"
  description="Drag or use arrow keys to rotate."
  modelSrc="/models/product.glb"
  modelScale={0.8}
  mobileModelScale={0.62}
  hotspots={[{ id: "lens", label: "Optical lens", position: [0.4, 0.6, 0.5], content: <LensCopy /> }]}
  fallback={<ProductPoster />}
/>
```

Tune `cameraPosition`, desktop/mobile model scale, physical material values and auto-rotation to the asset. Hotspots are real numbered or custom-marker buttons projected from model space; they hide on the rear hemisphere and their content stays semantic.

The stage ships with image-based lighting (a PMREM-prefiltered `RoomEnvironment`), so PBR-textured GLBs read photoreal without any external HDR. `fitDiameter` normalizes any model to a target world-space size regardless of how it was authored — `modelScale`/`mobileModelScale` then multiply on top — so swapping client GLBs needs no manual scale hunting.

## Sourcing real models (repeatable recipe)

1. Get a PBR GLB: the client's own asset, or a permissively licensed one — [Khronos glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) (CC0/CC-BY, download `Models/<Name>/glTF-Binary/<Name>.glb`), poly.pizza (CC0), or photogrammetry via Luma/Polycam.
2. Drop it in `public/models/`, keep the license in the filename or a sidecar note, and add attribution where the license requires it.
3. Point `modelSrc` at it and set `fitDiameter` (~3 for this stage); optionally compress with `npx @gltf-transform/cli optimize` and wire `dracoDecoderPath`/`ktx2TranscoderPath`.

The lab fixture uses `public/models/sneaker-shopify-cc-by.glb` — "Materials Variants Shoe", © 2021 Shopify, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), from Khronos glTF-Sample-Assets (7.8 MB).

Compressed assets are opt-in: pass `dracoDecoderPath` (e.g. `"/draco/"`) for Draco-compressed geometry and `ktx2TranscoderPath` (e.g. `"/basis/"`) for KTX2 textures, and self-host the matching decoder/transcoder files at those paths. Without these props the plain `GLTFLoader` is used and compressed GLBs will fail to parse.

## Gates

- Optimize meshes/textures, document GLB bytes, ship Draco/KTX2 assets only together with `dracoDecoderPath`/`ktx2TranscoderPath` pointing at self-hosted decoder files, and never load a multi-megabyte model without a poster.
- Verify drag on mouse/touch, arrow-key rotation, focus, hotspot labels, reduced motion, context loss and route cleanup.
- Do not make wheel zoom the default: page scroll must remain native.

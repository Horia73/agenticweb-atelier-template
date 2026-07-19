# Production Workflow for Cinematic 3D Worlds

Read this reference before using `Cinematic3DScene`, `CinematicForest3D`, a Gaussian Splat, or another scroll-directed real-time world. A convincing scene is an asset, camera and lighting problem first; Three.js cannot make unrelated objects share one place.

## Choose the right representation

Use a coherent Gaussian Splat/photogrammetry capture when one downloadable scan already contains the complete location and the camera can remain inside its captured volume. Use optimized GLB geometry plus PBR materials when Studio needs editable placement, world-space text, relighting, collisions or a longer camera path. A hybrid scene may use real geometry in the near/mid field and a licensed HDR environment for the far field, but their species, season, lens height, exposure and ground palette must match.

Do not call raster planes with parallax “3D”. Do not combine an isolated tree, a random forest photo and procedural ground unless the zero-motion frame proves that light, contact, scale and horizon form one world.

## Asset gate

Before implementation, record:

1. source page, author/provider and license for every model, texture and environment;
2. model dimensions, up axis, triangle count and texture resolution;
3. target GLB, texture and total transfer bytes after optimization;
4. the intended camera corridor and the minimum distance to close geometry;
5. desktop, balanced and poster-only delivery tiers.

For a forest, require real trunks and branch topology, at least two scale bands of trees, undergrowth, roots/rocks or deadwood, and a PBR forest floor. Place roots at the sampled terrain height. Reject floating bases, repeated trees in an obvious grid, alpha-card halos, black leaf planes, mismatched seasons and an exposed straight seam between geometry and the environment.

## Optimization pipeline

- Keep the licensed source in `.asset-cache/`, never in the shipped public bundle.
- Convert source glTF to GLB, weld and simplify with an inspected error threshold, then use Meshopt/Draco and WebP/KTX2 textures.
- Simplify silhouettes and distant foliage more aggressively than close trunks. Inspect branches after simplification; a good byte count is irrelevant if the crown becomes wire-like.
- Preserve alpha foliage as alpha-tested, double-sided material with depth writing. Avoid large blended leaf planes that sort incorrectly.
- Generate `asset-manifest.json` with provenance, output bytes and checksums.
- Capture the reduced-motion poster from the actual accepted scene and camera, not from an unrelated concept image.

`scripts/build-cinematic-forest-3d.mjs` is the reference pipeline in this template. Its Poly Haven sources are CC0, but its exact forest remains a Lab fixture and must be replaced for client work.

## Camera and narrative

Author 4–7 camera beats in world units. Keep movement continuous, reversible and damped. Every beat needs a safe target, a minimum near-object distance and enough negative space for copy. Scroll only drives the timeline; the cursor must not push the camera unless the brief explicitly chooses a bounded pointer mechanic.

World-space copy may pass behind real meshes through the depth buffer. Give it a separate readable hold where the complete line clears the occluder, then remove it before the next message. Keep an equivalent semantic heading in HTML/React for accessibility; WebGL text is visual only.

## Loading and fallbacks

A desktop cinematic world may use a loading gate only when progress is measurable. Drive `IntroLoader` from the actual asset manager, keep a hard timeout, show no fake percentage, and remove the gate after success or fail-open. Mount the Canvas only near the viewport.

For reduced motion, no WebGL, constrained/mobile delivery or context loss, render a real poster and the same semantic content without the long scroll corridor. Do not download the desktop GLBs before deciding to use the fallback.

## Performance targets

- Cap DPR (normally 1.25–1.5) and use adaptive quality.
- Keep the initial desktop cinematic payload declared; 25–50 MiB can be acceptable only behind a deliberate loading gate. Prefer less for ordinary landing pages.
- Keep draw calls and shadow casters bounded. Far trees should not cast expensive dynamic shadows.
- Pause/unmount outside a generous viewport margin and dispose temporary geometry/materials.
- Test at the weakest supported desktop GPU, not only on an Apple Silicon development machine.

## Required QA

Inspect start, every narrative hold, every environment handoff and final frame at full desktop resolution. Test slow loading, fresh cache, fast wheel input, small reverse scroll, complete reverse, resize mid-scene, zoom, reduced motion, no WebGL and context loss. Reject flicker, camera jumps, blank frames, exposed environment seams, unreadable text, shadow acne, hovering roots, low-resolution closeups or a frame-rate collapse during scroll.

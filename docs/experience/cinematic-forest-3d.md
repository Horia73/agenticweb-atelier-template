# CinematicForest3D — real-time 3D world

`CinematicForest3D` is a desktop cinematic world built from real editable geometry, PBR ground, vegetation, HDR lighting and a reversible scroll camera. It is **3D**, not 2.5D, and it is not a reusable forest theme. The component supplies the difficult runtime; Studio must supply a project-specific world and camera direction.

## When to choose it

Choose it when entering a place is the hero idea: nature, architecture, an exhibition, a product world or another environment that benefits from real occlusion and camera travel. Do not choose it for a page that only needs one premium still or when the project cannot afford a desktop asset/loading budget.

## Install and run

```tsx
import { CinematicForest3D } from "@/components/experience/cinematic-forest-3d"

export function ProjectHero() {
  return (
    <CinematicForest3D
      title="Enter the material world."
      kicker="Project-specific 3D environment"
      closingLine="A second message after the camera clears the trees."
    />
  )
}
```

In this template, rebuild the CC0 Lab assets with:

```bash
npm run assets:forest3d
```

The command downloads licensed sources into `.asset-cache/`, optimizes models with glTF Transform/Meshopt, writes WebP-textured GLBs and generates `public/experience/cinematic-forest-3d/asset-manifest.json` with provenance, byte sizes and checksums.

## Current Lab fixture

The fixture uses CC0 assets from Poly Haven: [Fir Tree 01](https://polyhaven.com/a/fir_tree_01), [Tree Small 02](https://polyhaven.com/a/tree_small_02), [Fir Sapling](https://polyhaven.com/a/fir_sapling), [Fern 02](https://polyhaven.com/a/fern_02), [Moss Rock Set 01](https://polyhaven.com/a/rock_moss_set_01), [Root Cluster 01](https://polyhaven.com/a/root_cluster_01), [Forest Leaves 02](https://polyhaven.com/a/forest_leaves_02) and [Forest Slope](https://polyhaven.com/a/forest_slope). The optimized desktop package is approximately 48 MiB and is intentionally protected by a real loading gate.

Do not ship this combination in a client project. Replace it with the approved ecosystem, regenerate the manifest and derive a new poster from the accepted camera frame.

## Editable contract

- `camera`: 4–7 `{ at, position, target, fov }` beats in world units. The timeline is naturally reversible.
- `assetRoot`: root containing the project GLBs, PBR maps, environment and poster.
- `title`, `kicker`, `closingLine`: semantic React copy layered over the world.
- `scrollScreens`, `smoothing`, `maxDpr`: pacing and performance controls inherited from `Cinematic3DScene`.
- `poster`: reduced-motion, no-WebGL and offscreen fallback derived from the same world.
- `onProgressChange`: optional hook for project-specific narrative/state outside the Canvas.

The world-space phrase inside the fixture is visual and is depth-occluded by the actual tree meshes. It has a readable hold where the full line clears the trunks. If you change the camera or trees, re-author those positions and timings; never accept a message that remains permanently hidden.

## Studio customization workflow

1. Start from the approved client direction and define why the camera enters this world.
2. Select one coherent asset family or capture. Record license, dimensions, season, light and intended camera corridor.
3. Replace every Lab model, ground map, HDR, copy, camera beat and poster. The prop API is not permission to leave the fixture unchanged.
4. Run the optimization script or a project-specific equivalent. Inspect alpha foliage and close bark after simplification.
5. Ground every object with the same terrain function; place undergrowth in clusters, not a regular grid.
6. Blend near geometry into the far environment with real intervening geometry and/or a gradual material fade. Never leave a straight horizon seam.
7. Capture a poster from the final Canvas and verify it before enabling the mobile/reduced fallback.

## Loading and fallback behavior

`Cinematic3DScene` reads real Three.js/Drei loading progress and composes `IntroLoader` as a controlled loading gate. It has a hard cap and fails open. Canvas is mounted only near the viewport. On reduced motion, no WebGL or the configured narrow breakpoint, the page renders the poster plus semantic copy and removes the long scroll corridor.

For a client delivery, create a deliberate mobile direction. It can be a static/project-specific film, a shorter GLB scene or a normal semantic hero; it must not silently download the desktop world behind a poster.

## Production QA

- Inspect 0/25/50/75/100% and reverse-scroll through every beat.
- Confirm the 3D line becomes fully readable once and disappears cleanly.
- Test fresh-cache and throttled loading; the counter must follow real readiness.
- Check roots, rocks and trunks at contact, branches against the sky and foliage alpha on bright/dark backgrounds.
- Test 1440+ desktop, resize mid-scroll, browser zoom, reduced motion and no WebGL.
- Run `npm run typecheck`, `npm run lint`, `npm run registry:build` and `npm run build`.

Lab route: `http://localhost:3000/experience-lab?demo=cinematic-forest-3d`.

# AgenticWeb Experience Registry

Biblioteca conține mecanici de experiență instalabile ca sursă editabilă, nu landing pages sau teme. Site-ul clientului furnizează arhitectura, identitatea, copy-ul, asset-urile și art direction-ul; componentele rezolvă runtime-ul dificil, motion-ul și fallback-urile.

## P0–P6

| ID | Componentă | Rol |
| --- | --- | --- |
| `depth-camera-scene` | `DepthCameraScene` | P0: 2.5D Advanced cu PerspectiveCamera reală, stack 00–50 și ocluzie semantică între două pass-uri WebGL |
| `cinematic-world-scene` | `CinematicWorldScene` | recipe P0 cu intro, rear/front narrative și catalog final controlat local |
| `spatial-product-stage` | `SpatialProductStage` | P1: assembly/exploded pentru plate-uri alpha, primitive editabile sau noduri GLB; hover/scroll/hybrid și idle ascuns |
| `liquid-glass` | `LiquidGlassSurface`, `LiquidGlassNav` | P2: suprafață clear/regular adaptivă și nav semantic cu active pill |
| `shader-field` | `ShaderField` | P3: aurora, metaballs, contour și caustic WebGL reactive |
| `media-portal` | `MediaPortal` | P4: apertură React care crește la full viewport |
| `spatial-gallery` | `SpatialGallery` | P5: galerie cu cameră Three.js și fallback rail nativ |
| `mesh-transition` | `MeshTransition` | P6: tranziție GPU wave/fold/liquid, scroll/hover/controlled |

`ScrollDepthScene` rămâne explicit **2.5D Basic**: master integrat, occlusion matte și text editabil în spatele subiectului. Nu îl numi Advanced doar fiindcă fotografia și tipografia sunt premium.

## Primitive complementare

| ID | Rol |
| --- | --- |
| `horizontal-story-rail` / `horizontal-track` | scroll vertical → track orizontal sau track cu progres extern |
| `sticky-story` | capitole cu vizual persistent |
| `image-sequence-scrub` | secvență reală de cadre pe canvas |
| `mask-reveal` | reveal direcțional/radial reversibil |
| `kinetic-type` | timeline tipografic semantic |
| `cursor-ambient` | lens fără punct central |
| `cursor-magnetic` | proximitate magnetică locală |
| `before-after` | comparator accesibil |
| `expanding-media` | cadru editorial care devine full viewport |
| `depth-gallery` | stack focal DOM cu fallback swipe |

## Direcțiile 20–30

| Nr. | ID | Rol |
| --- | --- | --- |
| 20 | `refractive-glass` | lens WebGL care refractă textura reală, cu formă și material editabile |
| 21 | `product-orbit` | viewer GLB/primitive cu drag, tastatură și hotspots semantice |
| 22 | `particle-assembly` | matte raster → point cloud → obiect, controlat prin scroll/hover/progres extern |
| 23 | `typography-depth-tunnel` | copy semantic într-un tunel CSS 3D |
| 24 | `spatial-canvas` | plan non-liniar cu pan, zoom, tastatură și fallback rail |
| 25 | `volumetric-light-stage` | imagine cu trei emitters procedurali, haze și lifecycle WebGL complet |
| 26 | `slice-recompose` | o sursă high-resolution recompusă din fâșii editabile |
| 27 | `film-strip-3d` | bandă continuă CSS 3D cu mai multe cadre vizibile |
| 28 | `elastic-image-grid` | grid semantic cu câmp local de proximitate |
| 29 | `fluid-surface` | suprafață de imagine cu impulsuri fluide care se disipă |
| 30 | `scene-handoff` | tranziție continuă între două scene React live |

## Contract Studio

1. Citește brief-ul și propune exact **două** direcții vizuale distincte.
2. Pentru fiecare direcție, justifică maximum două mecanici wow dominante și una secundară. Nu combina efecte doar pentru demo.
3. După alegere, instalează doar componentele necesare din registry și modifică sursa lor în proiect.
4. Nu păstra fixture, copy, assets, palette, crop, camera, timings sau geometrie din Experience Lab.
5. Documentează asset workflow-ul, varianta mobilă, reduced motion, byte budget și checkpoint-urile QA.

Fiecare registry item instalează mini-tutorialul din `docs/experience/`, nu fixture-ul sau asset-urile Lab.

## Test local

```bash
npm run dev:experience
```

Deschide `http://localhost:3000/experience-lab`. Hash-uri utile:

```text
#depth-camera-scene
#spatial-product-stage
#liquid-glass
#shader-field
#media-portal
#spatial-gallery
#mesh-transition
#depth-gallery
#refractive-glass
#product-orbit
#particle-assembly
#typography-depth-tunnel
#spatial-canvas
#volumetric-light-stage
#slice-recompose
#film-strip-3d
#elastic-image-grid
#fluid-surface
#scene-handoff
```

Registry-ul păstrează **31 de primitive/recipes** instalabile. Experience Lab are exact **30 de direcții vizibile**: primul selector rămâne rezervat pentru reconstrucția separată `2.5D Advanced` de la zero, iar direcțiile 20–30 sunt engine-uri independente. Diferența de unu apare fiindcă Advanced compune două pachete instalabile (`depth-camera-scene` și recipe-ul `cinematic-world-scene`) într-un singur demo.

Rulează apoi:

```bash
npm run typecheck
npm run lint
npm run registry:build
npm run build
```

Verifică 390, 768 și 1440 px, mouse/trackpad, touch, tastatură, reverse-scroll, loading lent, WebGL/context loss și opțiunea de sistem Reduce motion.

# AgenticWeb Experience Registry

Biblioteca conține mecanici de experiență instalabile ca sursă editabilă, nu landing pages sau teme. Site-ul clientului furnizează arhitectura, identitatea, copy-ul, asset-urile și art direction-ul; componentele rezolvă runtime-ul dificil, motion-ul și fallback-urile.

## P0–P6

| ID | Componentă | Rol |
| --- | --- | --- |
| `cinematic-forest-3d` | `CinematicForest3D`, `Cinematic3DScene` | P0: lume 3D real-time cu geometrie PBR, vegetație/teren/HDR coerente, cameră scroll reversibilă, ocluzie reală, loading măsurat și poster fallback |
| `depth-camera-scene` | `DepthCameraScene` | P0: 2.5D Advanced cu PerspectiveCamera reală, stack 00–50 sau focus handoff A/B cu plane high-res decupate, plus ocluzie semantică între două pass-uri WebGL |
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

## Direcțiile 31–40

| Nr. | ID | Rol |
| --- | --- | --- |
| 31 | `shared-element-zoom` | morph FLIP din grid în vedere de detaliu, cu semantică de dialog |
| 32 | `draw-on-scroll` | desenarea formelor stroked ale unui SVG condusă de scroll |
| 33 | `marquee-velocity` | bandă infinită reactivă la viteza scroll-ului |
| 34 | `variable-font-axis` | axe de font variabil animate din pointer sau scroll |
| 35 | `image-trail` | trail decorativ de imagini în urma cursorului |
| 36 | `route-transition` | continuitate între rute prin View Transitions API, cu theme wipe |
| 37 | `distortion-carousel` | galerie GPU cu drag, momentum și distorsiune condusă de viteză |
| 38 | `portal-crossing` | peste fotografia originală, un portal 3D cu contur neregulat texturat cu lumea următoare sosește din adânc, iar camera trece prin el |
| 39 | `physics-playground` | motor propriu de fizică 2D pentru badge-uri care cad și se aruncă |
| 40 | `holo-card` | card holografic cu tilt 3D, foil și glare |

## Direcțiile 41–50

| Nr. | ID | Rol |
| --- | --- | --- |
| 41 | `reveal-stagger` | coregrafie de intrare în viewport cu stagger, plus reveal mascat pe cuvinte/caractere |
| 42 | `count-up` | statistici care numără la intrarea în viewport, cu Intl formatting și layout rezervat |
| 43 | `hover-preview-list` | index editorial cu panou media care urmărește cursorul |
| 44 | `text-scramble` | decodare de tip terminal cu fraze ciclate |
| 45 | `spotlight-grid` | carduri bento iluminate de un pointer field partajat |
| 46 | `scroll-stack` | carduri sticky care se acoperă, se scalează și se estompează la scroll |
| 47 | `knockout-text` | secvență pinned în patru beat-uri: din negru, prin literele-ferestre, în imagine |
| 48 | `intro-loader` | preloader o dată pe sesiune sau loading screen controlat prin `active`/`progress` |
| 49 | `ambient-particles` | atmosferă canvas cu sprite-uri glow, benzi de adâncime, vânt coerent și edge fade |
| 50 | `split-flap` | panou split-flap derivat din timp, cu roată de glife, stagger pe coloane și shrink-to-fit |

## Runtime partajat

Toate componentele WebGL folosesc `use-webgl-stage.ts` (renderer, DPR cap, pauză offscreen, context loss **și restore**, dispose), iar primitivele împart hook-urile din `experience-runtime.ts` (`usePrefersReducedMotion`, `useCoarsePointer`, `useFinePointer`, `useMediaQuery`, `damp`, `sortKeyframes`). Registry-ul livrează aceste fișiere automat cu fiecare item care le importă. Stringurile vizibile/aria au default-uri în engleză și sunt overridabile prin props — demo-urile din Lab le suprascriu în română.

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
#cinematic-forest-3d
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
#shared-element-zoom
#draw-on-scroll
#marquee-velocity
#variable-font-axis
#image-trail
#route-transition
#distortion-carousel
#portal-crossing
#physics-playground
#holo-card
#reveal-stagger
#count-up
#hover-preview-list
#text-scramble
#spotlight-grid
#scroll-stack
#knockout-text
#intro-loader
#ambient-particles
#split-flap
```

Registry-ul păstrează **52 de primitive/recipes** instalabile. Experience Lab are exact **50 de direcții vizibile**: primul selector este acum `3D Cinematic Forest`, al doilea rămâne `2.5D Basic`, direcțiile 20–30 sunt engine-uri independente, 31–40 sunt mecanicile precedente, iar 41–50 acoperă primitive aplicate frecvent și momente wow. Diferența de două apare fiindcă engine-ul `depth-camera-scene` și recipe-ul `cinematic-world-scene` rămân instalabile pentru proiecte 2.5D Advanced, dar nu mai ocupă selectorul P0 din Lab.

Rulează apoi:

```bash
npm run typecheck
npm run lint
npm run registry:build
npm run build
```

Verifică 390, 768 și 1440 px, mouse/trackpad, touch, tastatură, reverse-scroll, loading lent, WebGL/context loss și opțiunea de sistem Reduce motion.

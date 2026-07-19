# AgenticWeb Experience Registry

Biblioteca conține mecanici de experiență instalabile ca sursă editabilă, nu landing pages sau teme. Site-ul clientului furnizează arhitectura, identitatea, copy-ul, asset-urile și art direction-ul; componentele rezolvă runtime-ul dificil, motion-ul și fallback-urile.

## Sursa de adevăr

- `experience.catalog.json` definește toate mecanismele verificate și instalabile, taxonomia, rolul recomandat, stack-ul, costul, asset profile-ul și fallback-ul.
- `creative-grammar.json` definește axele de compoziție și bugetul de intensitate; nu conține layout-uri de pagină.
- `registry.json` livrează sursa editabilă și mini-tutorialul fiecărui item.
- Experience Lab și registry-ul conțin aceeași listă: fiecare item instalabil are un fixture vizibil și verificabil. Nu păstrăm engine-uri ascunse sau recipe-uri fără consumator.

Validatorul impune ca toate cele trei contracte și Studio template să aibă aceeași versiune și exact aceleași item-uri.

## Familii

| Familie | Ce organizează | Exemple |
| --- | --- | --- |
| Worlds & depth | lumi, profunzime și traversări spațiale | `layered-depth`, `portal-crossing` |
| Product & object | inspecție, assembly și transformarea obiectului | `spatial-product-stage`, `product-orbit`, `particle-assembly` |
| Story & scroll | structuri narative și progres măsurat | `sticky-story`, `horizontal-story-rail`, `scroll-stack` |
| Media & collections | browsing, comparație și galerii | `spatial-gallery`, `spatial-canvas`, `distortion-carousel` |
| Type & signals | tipografie, numere și semnale animate | `kinetic-type`, `count-up`, `split-flap` |
| Transitions & reveals | treceri între scene, rute și stări | `media-portal`, `scene-handoff`, `route-transition` |
| Surfaces & atmosphere | lumină, glass, fluide și particule | `liquid-glass`, `shader-field`, `ambient-particles` |
| System & micro | feedback local și utilități de sistem | `cursor-magnetic`, `reveal-stagger`, `intro-loader` |

Aceste familii sunt filtre de descoperire, nu bundle-uri și nu rețete de landing page. Rolurile sunt `signature`, `structure`, `support`, `micro` și `infrastructure`; rolul final depinde de brief.

## Runtime partajat

Toate componentele WebGL folosesc `use-webgl-stage.ts` (renderer, DPR cap adaptiv, pauză offscreen, context loss **și restore**, dispose), iar primitivele împart hook-urile din `experience-runtime.ts` (`useExperienceViewport`, `resolveExperienceValue`, `usePrefersReducedMotion`, `useCoarsePointer`, `useFinePointer`, `useMediaQuery`, `damp`, `sortKeyframes`). Registry-ul livrează aceste fișiere automat cu fiecare item care le importă. Stringurile vizibile/aria au default-uri în engleză și sunt overridabile prin props — demo-urile din Lab le suprascriu în română.

Contractul comun este mobile-first: mobil sub 640 px, tabletă/iPad între 640–1024 px și desktop de la 1025 px. Capabilitatea pointerului rămâne un semnal separat, astfel încât un iPad cu trackpad poate păstra interacțiuni fine fără să primească bugetul grafic de desktop. Componentele canvas/WebGL limitează DPR la 1 / 1,25 / 1,6, iar mecanicile spațiale sau dependente de hover oferă pe touch o variantă liniară, semantică ori un rail nativ. Detaliile sunt în `docs/experience/responsive-contract.md`.

## Contract Studio

1. Explorează intern minimum patru ipoteze din brief și prezintă exact **două** direcții bespoke distincte; nu forța o pereche safe-versus-wow.
2. Definește ideea dominantă și compoziția înaintea mecanicilor. Fiecare direcție poate avea zero sau o mecanică signature și maximum două support într-un viewport.
3. Cel puțin o direcție trebuie să fie fezabilă cu asset-urile și scope-ul curent. Cealaltă poate fi mai ambițioasă numai cu dependențe și fallback explicite.
4. Rulează maximum o mecanică high-cost într-un viewport și urmează fiecare beat intens cu o secțiune semantică liniștită.
5. După alegere, instalează doar componentele necesare din registry și modifică sursa lor în proiect.
6. Nu păstra fixture, copy, assets, palette, crop, camera, timings sau geometrie din Experience Lab.
7. Documentează asset workflow-ul, varianta mobilă, reduced motion, byte budget și checkpoint-urile QA.

Fiecare registry item instalează mini-tutorialul din `docs/experience/`, nu fixture-ul sau asset-urile Lab.

## Test local

```bash
npm run dev:experience
```

Deschide `http://localhost:3000/experience-lab`. Hash-uri utile:

```text
#layered-depth
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
#focus-transfer-rail
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
#spatial-fold
#knockout-text
#intro-loader
#ambient-particles
#split-flap
```

Registry-ul și Experience Lab au acum exact **51 de mecanisme verificate**, grupate în cele opt familii de mai sus. Numărul este derivat din catalog, iar interfața și contractele Provider îl validează la build.

Rulează apoi:

```bash
npm run typecheck
npm run lint
npm run experience:check
npm run registry:build
npm run build
```

Verifică 390, 768, 1024 și 1440 px, mouse/trackpad, touch, tastatură, reverse-scroll, loading lent, WebGL/context loss și opțiunea de sistem Reduce motion.

# Contract responsive pentru cele 50 de mecanici

Toate item-urile instalabile din Experience Registry pornesc de la varianta mobilă și adaugă progresiv comportament pentru iPad și desktop. Contractul este consumat de runtime, componente și Studio prin `experience.catalog.json` și `studio.template.json`.

## Profile de viewport

| Profil | Interval | Intenție |
| --- | --- | --- |
| Mobil | sub 640 px | compoziție liniară, controale de minimum 44 px, mișcare și densitate reduse |
| Tabletă / iPad | 640–1024 px | layout dedicat portrait/landscape, buget grafic mediu, touch implicit |
| Desktop | de la 1025 px | compoziția completă și bugetul grafic maxim |

`useExperienceViewport()` oferă profilul curent și returnează `mobile` la SSR, ca markup-ul inițial să rămână mobile-first. `resolveExperienceValue()` rezolvă valori cu forma `{ mobile, tablet, desktop }`. Breakpoint-ul de viewport nu înlocuiește verificarea `pointer: coarse` / `pointer: fine`: un iPad poate folosi touch sau trackpad în același profil de layout.

## Reguli pe familii

- Mecanici WebGL/canvas: DPR maxim 1 pe mobil, 1,25 pe iPad și 1,6 pe desktop; numărul de particule, segmente și asset-uri preîncărcate scade pe ecranele mici.
- Galerii spațiale, tuneluri și rail-uri scroll-pinned: pe mobil/iPad touch devin rail-uri native cu scroll-snap sau liste semantice; experiența 3D rămâne pentru desktop cu pointer potrivit.
- Media: componentele high-cost acceptă surse `mobileSrc` / `tabletSrc` ori echivalente; posterul rămâne fallback obligatoriu.
- Tipografie și micro-interacțiuni: distanța, stagger-ul și durata sunt reduse progresiv; textul poate face wrap și nu forțează overflow orizontal.
- Overlays și controale: mobile folosește bottom-sheet/full-width unde este necesar, iar toate țintele tactile au cel puțin 44 × 44 px.
- Reduced motion: continuă să aibă prioritate peste profilul de viewport și afișează conținutul final sau fallback-ul semantic.

## Variante media configurabile

Componentele care au cost media ridicat pot primi surse ori parametri dedicați prin props, printre care: `mobilePoster`, `tabletPoster`, `mobileSrc`, `tabletSrc`, `mobileCameraPosition`, `tabletCameraPosition`, `mobileLensSize`, `tabletLensSize`, `mobileSegments`, `tabletSegments`, `mobileShape`, `tabletShape`, `mobileDirection` și `tabletDirection`. Dacă lipsesc, componenta derivă o variantă optimizată din valorile desktop.

## QA obligatoriu

Rulează Experience Lab la 390, 768, 1024 și 1440 px. La 768 și 1024 verifică separat portrait/landscape, touch și trackpad. Pentru fiecare mecanică verifică: lipsa overflow-ului, ordinea semantică, tap targets, tastatura, reduced motion, fallback-ul media, încărcare lentă și context loss pentru WebGL.

Comenzi de contract:

```bash
npm run typecheck
npm run lint
npm run experience:check
npm run registry:build
npm run build
```

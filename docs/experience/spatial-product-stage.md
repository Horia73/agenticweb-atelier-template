# SpatialProductStage

`SpatialProductStage` asamblează sau explodează un produs pe hover, scroll ori într-un mod hybrid. Poate folosi primitive Three.js editabile, plate-uri raster înregistrate cu alpha sau noduri numite dintr-un GLB. Componenta deține driver-ul și runtime-ul; portretul, obiectul, copy-ul și art direction-ul aparțin proiectului.

## Când îl alegi

Este potrivit pentru produse cu logică modulară: wearables, mobilier, hardware, ambalaje, arhitectură sau un obiect a cărui construcție susține povestea. Nu îl folosi dacă separarea pieselor este arbitrară sau dacă produsul trebuie doar să plutească decorativ.

## Instalare

```bash
npx shadcn@latest add ./public/r/spatial-product-stage.json
```

## Cele trei pipeline-uri

1. **Registered raster plates** — generezi un portret/background fără produs și un produs complet izolat. Segmentezi produsul în piese full-canvas cu alpha, păstrând aceeași ancoră. Este rapid și păstrează realismul fotografic.
2. **Editable primitives** — construiești piese din box/cylinder/sphere/torus/extrude. Este ideal pentru forme grafice și prototipare, nu pentru un produs fotorealist complex.
3. **Named GLB nodes** — livrezi un model cu pivots și nume stabile. Este varianta corectă când lumina, rotația și volumul 3D trebuie să rămână reale.

Fixture-ul raster se reconstruiește cu:

```bash
uv run --with numpy --with pillow python scripts/build-spatial-product-assets.py \
  --source assets/source/product-master.png \
  --output public/experience/product-stage
```

Pentru alpha curat folosește matting și edge decontamination; un checkerboard „transparent” desenat în pixeli nu este alpha.

## Exemplu minimal cu plate-uri

```tsx
const parts = [
  {
    id: "left-shell",
    geometry: { type: "plane", size: [2.2, 2.2] },
    texture: "/product/left-shell.webp",
    assembled: { position: [0, 0, 0.04] },
    exploded: { position: [-2.2, 1.1, 1.3], rotation: [0.3, -0.7, -0.4] },
    assemblyDelay: 0.08,
  },
] satisfies SpatialProductPart[]

<SpatialProductStage
  label="Produs modular"
  mode="hybrid"
  parts={parts}
  visual={<ProjectPortrait />}
  imageAnchor={{ point: [0.67, 0.5], imageAspect: 1600 / 960, objectPosition: [0.7, 0.5] }}
  hoverRadius={0.2}
  idleVisibility="hidden"
  smoothing={4.5}
  fallback={<StaticProduct />}
/>
```

Pentru GLB, setează `modelSrc` și mapează `modelParts` prin `nodeName`; fiecare nod primește transformări `assembled` și `exploded`.

## Comportament

- `hover` asamblează numai în zona definită de `hoverAnchor` și `hoverRadius`, nu oriunde în viewport.
- `idleVisibility="hidden"` ține piesele complet nerandate optic până începe activarea; fiecare piesă își primește apoi propriul fade scurt, sincronizat cu `assemblyDelay`. Folosește `exploded` numai când explozia este intenționat starea inițială.
- `scroll` face scrub reversibil: scroll înainte asamblează, reverse-scroll desface.
- `hybrid` acceptă ambele drivere și păstrează controlul explicit de lock.
- `assemblyDelay` creează o cascadă, dar valorile trebuie să păstreze produsul lizibil și să nu producă lag artificial. Un `smoothing` mai mic produce o apropiere mai lentă și mai grea; verifică mereu hover rapid repetat.
- `imageAnchor`/`mobileImageAnchor` ancorează produsul de un punct din imaginea `visual` (fracții din sursă + `imageAspect` + `objectPosition`): componenta rejoacă crop-ul CSS object-cover la fiecare resize, deci produsul se asamblează pe același detaliu din imagine (ex. fața subiectului) și se scalează cu zoom-ul crop-ului, indiferent de aspect ratio. Hover-ul moștenește implicit același punct.
- `groupAnchor`/`mobileGroupAnchor` fac același lucru dar în fracții de viewport, pentru staging fără imagine de referință. `groupPosition` rămâne pentru adâncime (z) sau plasare world-space fixă când ancorele lipsesc.
- `groupScale` și camera se calibrează pe crop-ul real al vizualului.

## Contract AI și QA

Agentul trebuie să înlocuiască fixture-ul complet și să documenteze de ce se separă fiecare piesă, ancora pe subiect, driver-ul ales, fallback-ul și diferențele mobile. Nu păstrează respiratorul, portretul, copy-ul sau coordonatele demo-ului.

Testează assembled/exploded și stările intermediare, hover la limita zonei, reverse-scroll, tastatura controlului, 390/768/1440 px, reduced motion, WebGL indisponibil, loading lent, alpha halo și eliberarea scenei în flow normal.

Fixture: `http://localhost:3000/experience-lab#spatial-product-stage`.

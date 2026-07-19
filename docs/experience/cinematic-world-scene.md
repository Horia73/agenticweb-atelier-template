# CinematicWorldScene

`CinematicWorldScene` este o compoziție opțională peste `DepthCameraScene`: adaugă intro, text semantic în spatele și în fața hero-ului, apoi un catalog `HorizontalTrack` controlat local. Motorul Advanced rămâne `DepthCameraScene`; recipe-ul nu este un landing template și nu conține identitate de client.

## Când îl alegi

Alege-l numai dacă aceeași lume justifică minimum două beat-uri narative și un catalog final. Pentru o scenă Advanced fără catalog folosește direct `DepthCameraScene`; pentru master integrat + occlusion matte folosește `ScrollDepthScene` Basic.

## Instalare

```bash
npx shadcn@latest add ./public/r/cinematic-world-scene.json
```

Registry item-ul instalează camera scene, runtime-ul, track-ul și mini-tutorialele. Asset-urile Lab nu se instalează.

## Exemplu

```tsx
<CinematicWorldScene
  label="Lumea colecției"
  layers={projectLayers}
  poster="/world/poster.webp"
  mobilePoster="/world/mobile-poster.webp"
  intro={<ProjectIntro />}
  rearNarrative={<RearMessage />}
  frontNarrative={<FrontMessage />}
  chrome={<ProjectChrome />}
  catalog={{
    label: "Colecția",
    eyebrow: "03 / Explore",
    heading: <ProjectCatalogHeading />,
    items: projectCards,
    itemClassName: (index) => projectWidths[index],
  }}
  reducedMotionFallback={<StaticProjectStory />}
/>
```

## Layer order

```text
back WebGL: 00-sky → 10-landscape → 20-midground
DOM: intro / rear narrative
front WebGL: contact → 30-hero → foreground → edge-frame
DOM: front narrative / chrome / catalog
```

Camera dolly-ul este dominant; transformările per plate sunt corecții mici. Rear narrative trebuie să pornească ocluzionat, să iasă suficient pentru lectură și să aibă un hold real. Catalogul intră în aceeași lume, dar nu consumă încă un rail sticky: `HorizontalTrack` primește un controller local după ce timeline-ul scenei a ajuns la final.

Citește `depth-camera-scene.md` pentru pipeline-ul ImageGen 00–50, contact/reflection, manifest și QA de alpha.

## Contract AI

Studio propune mai întâi exact două direcții. Dacă utilizatorul alege acest recipe, agentul documentează rolul fiecărui beat, ordinea de ocluzie, camera, crop-ul mobil, fallback-ul, catalogul și toate diferențele față de Lab. Schimbă asset-uri, copy, type, palette, camera, keyframes, spacing și geometria cardurilor; nu păstrează lumea demo.

Respinge implementarea dacă straturile provin din imagini independente, textul rămâne ascuns, lipsește contact plate-ul, reverse-scroll nu reface natural beat-ul anterior sau există sticky în sticky.

## QA

Testează intro/rear/front/catalog/final, scroll rapid înainte și înapoi, controalele catalogului cu tastatura, resize, 390/768/1440 px, reduced motion, context loss, loading lent și release-ul către flow-ul normal.

Recipe-ul rămâne instalabil din registry, dar nu mai ocupă selectorul P0 din Lab; verifică-l într-un harness construit din asset-urile proiectului.

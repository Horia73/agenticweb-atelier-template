# SpatialGallery

`SpatialGallery` este un tunnel de imagini cu cameră Three.js controlată prin scroll vertical nativ. Pe mobil și reduced motion devine un rail orizontal nativ, snap-based și complet navigabil.

## Instalare

```bash
npx shadcn@latest add ./public/r/spatial-gallery.json
```

## Exemplu

```tsx
<SpatialGallery
  label="Arhiva proiectelor"
  items={projects.map((project) => ({
    id: project.id,
    src: project.desktopImage,
    mobileSrc: project.mobileImage,
    alt: project.alt,
    eyebrow: project.category,
    title: project.title,
    description: project.summary,
  }))}
  curve={0.9}
  spacing={3.4}
  renderCaption={(item, index) => <ProjectCaption item={item} index={index} />}
/>
```

## Art direction

Galeria funcționează când cadrele formează o secvență, nu când înlocuiește un grid care ar fi mai ușor de scanat. Calibrează `curve`, `spacing`, camera, frame colors și caption per colecție. Folosește crop-uri cu focal point stabil și nu amesteca imagini cu rezoluții slabe.

Cadrele depășite sunt ascunse înainte să treacă prin cameră; viitoarele cadre rămân discrete. `onActiveChange` poate alimenta analytics, audio sau UI extern, dar nu muta state greu la fiecare frame.

## Contract AI și QA

Agentul trebuie să schimbe colecția, ritmul, geometria, captions, culorile și fallback-ul mobil. Nu livrează portretul, mașina sau lumea din Lab.

Testează fiecare index, punctele dintre cadre, scroll rapid și reverse, resize în mijloc, imagini lente/404, 390/768/1440 px, reduced motion, WebGL indisponibil, alt text și lipsa frame-urilor vechi peste cadrul activ.

Fixture: `http://localhost:3000/experience-lab#spatial-gallery`.

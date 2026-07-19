# MeshTransition

`MeshTransition` face tranziția GPU între două imagini folosind o suprafață mesh și un seam controlat. Modurile `wave`, `fold` și `liquid` sunt puncte de pornire, nu identități vizuale gata de livrare.

## Instalare

```bash
npx shadcn@latest add ./public/r/mesh-transition.json
```

## Exemplu

```tsx
<MeshTransition
  label="Din produs în origine"
  from={{ src: "/story/product.webp", alt: "Produsul" }}
  to={{ src: "/story/origin.webp", alt: "Originea materialului" }}
  mode="liquid"
  trigger="scroll"
  scrollScreens={2.4}
  intensity={0.85}
  fallback={<StaticDestination />}
  overlay={(progress) => <ProjectTransitionCopy progress={progress} />}
/>
```

## Comportament

- Tranziția este one-pass: scroll înainte mută seam-ul de la prima imagine la a doua; continuarea înainte păstrează a doua imagine. Reverse-scroll inversează natural tranziția.
- `hover` trece la destinație și revine la pointer leave. `controlled` acceptă un `MotionValue` extern.
- Shader-ul folosește overscan ca deformarea mesh-ului să nu descopere margini negre; nu elimina overscan fără QA la toate aspect ratios.
- `from` și `to` au cover crop independent după dimensiunile reale ale texturii.
- Canvas-ul își limitează DPR-ul și după rezoluția ambelor texturi, nu doar după device. Pentru un stage full-screen desktop livrează surse de aproximativ 2× viewportul maxim; altfel un canvas retina doar mărește blur-ul și consumul GPU.

## Personalizare și QA

Agentul trebuie să aleagă două imagini cu legătură semantică, să schimbe seam, distortion, intensitate, copy și durata. Un morph între două cadre arbitrare este zgomot, nu un beat narativ.

Testează exact progresul 0 și 1, seam-ul la 25/50/75%, reverse-scroll, scroll rapid, hover leave, crop-uri foarte diferite, 390/768/1440 px, display 1×/2×, reduced motion, context loss și absența benzilor, marginilor negre sau flash-urilor luminoase. Pentru surse fotografice slabe, fă super-resolution offline și validează artefactele la 100%; nu face upscale din CSS.

Fixture: `http://localhost:3000/experience-lab#mesh-transition`.

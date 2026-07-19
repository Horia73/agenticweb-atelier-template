# MediaPortal

`MediaPortal` promovează orice media React dintr-o apertură mică la full viewport. Este behavior-only: backdrop-ul, media, copy-ul, shape-ul și destinația narativă sunt complet editabile.

## Instalare

```bash
npx shadcn@latest add ./public/r/media-portal.json
```

## Exemplu

```tsx
<MediaPortal
  label="Deschide lumea produsului"
  shape="vertical"
  trigger="scroll"
  backdrop={<ProjectBackdrop />}
  media={<ProjectVideoOrImage />}
  reducedMotionFallback={<StaticProjectPortal />}
>
  <ProjectOverlay />
</MediaPortal>
```

## Contract

- `shape`: `circle`, `rounded`, `vertical` sau `diamond`; modifică keyframe-urile dacă identitatea cere altă apertură.
- `trigger`: `scroll`, `hover` sau `controlled`. Pentru `controlled`, furnizează un `MotionValue<number>`.
- Scroll-ul este scrub reversibil: înainte deschide, reverse-scroll închide. Continuarea înainte nu reanulează efectul.
- Toate shape-urile interpolează aceleași valori `inset` și `border-radius`; evită tranziții între funcții `clip-path` incompatibile (`circle()` → `inset()`), care produc snap-uri între elipsă și dreptunghi.
- `backdrop` rămâne în spate, `media` este clip-uită, iar `children` este overlay neinteractiv; controalele video trebuie să stea în `media`, nu în overlay.

## Personalizare și QA

Agentul trebuie să aleagă shape-ul după subiect, să schimbe media, copy, crop, timing, radius, ring și layout. Fixture-ul nu este un hero reutilizabil ca atare.

Pentru video, furnizează poster, preload corect, captions când există vorbire și nu porni audio automat. Testează stările 0/25/50/75/100%, reverse-scroll, hover leave, touch, reduced motion, focus/controale, crop mobil și release-ul către următoarea secțiune.

Fixture: `http://localhost:3000/experience-lab#media-portal`.

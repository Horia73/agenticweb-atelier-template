# ImageSequenceScrub

Scrub pe canvas pentru o secvență reală de cadre, controlat de scroll vertical nativ.

## Assets obligatorii

Folosește o secvență exportată din același render/video: aceeași cameră, rezoluție, denumire zero-padded și fără cadre lipsă. Recomandat: 24–90 WebP/AVIF și un poster separat. Nu fabrica o rotație de produs din fotografii fără continuitate.

## Instalare și exemplu

```bash
npx shadcn@latest add ./public/r/image-sequence-scrub.json
```

```tsx
const frames = Array.from({ length: 60 }, (_, i) => `/frames/${String(i + 1).padStart(3, "0")}.webp`)

<ImageSequenceScrub
  alt="Mecanismul produsului se deschide"
  label="Exploded view în 60 de cadre"
  frames={frames}
  mobileFrames={mobileFrames}
  poster="/frames/poster.webp"
/>
```

Canvasul limitează DPR la 2, preîncarcă o fereastră locală și păstrează posterul ca fallback. Reduced motion sau o secvență incompletă afișează posterul.

## Personalizare obligatorie pentru AI

- validează numărul, ordinea și dimensiunile tuturor cadrelor înainte de integrare;
- decide range-ul narativ, posterul, crop-ul mobil și copy-ul overlay;
- testează fast scroll, revenire înapoi, resize, conexiune lentă și cadre lipsă;
- respinge dacă transformarea ar fi mai clară ca video normal sau secvența depășește bugetul.

Buget orientativ: 3–8 MB total lazy-loaded; primul poster sub 350 KB, primele cadre sub 1 MB cumulat.

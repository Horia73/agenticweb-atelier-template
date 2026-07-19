# ExpandingMedia

Extinde o imagine sau un video dintr-un cadru editorial la full viewport pe scroll.

## Instalare și exemplu video

```bash
npx shadcn@latest add ./public/r/expanding-media.json
```

```tsx
<ExpandingMedia
  label="Filmul de produs intră în scenă"
  playback="scrub"
  media={(
    <video muted playsInline loop autoPlay poster="/film-poster.webp">
      <source src="/film.webm" type="video/webm" />
      <source src="/film.mp4" type="video/mp4" />
    </video>
  )}
  startInset="14% 12% 10% 12%"
/>
```

Video-ul este media, nu înlocuitor pentru plate-uri 2.5D. Furnizează poster, captions dacă există voce, controale când playback-ul nu este pur decorativ și nu porni audio automat.

Implicit, expansion-ul are o singură fază (`playback="scrub"`): ajunge full viewport și rămâne acolo cât pagina continuă în jos; nu există o fază automată de micșorare la final. Dacă utilizatorul revine efectiv în sus prin range, expansion-ul se inversează. `scrimClassName` și `overlayClassName` controlează contrastul copy-ului; textul rămâne într-un strat separat de media.

## Personalizare obligatorie pentru AI

- definește de ce momentul merită full-bleed, apoi schimbă media, inset-ul, range-ul, copy-ul și crop-ul;
- testează Safari/iOS, autoplay policy, posterul, reduced motion și conexiune lentă;
- respinge dacă media este stock generic, expansion-ul maschează un layout slab sau textul devine ilizibil.

Video recomandat sub 4–6 MB pentru primul beat, cu WebM/MP4 și `preload="metadata"`.

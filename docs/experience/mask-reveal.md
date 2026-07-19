# MaskReveal

Dezvăluie prin scroll un vizual complet peste altul, cu mască laterală, verticală sau radială.

## Instalare și exemplu

```bash
npx shadcn@latest add ./public/r/mask-reveal.json
```

```tsx
<MaskReveal
  label="Structura apare peste finisaj"
  direction="circle"
  playback="scrub"
  before={<FinishImage />}
  after={<StructureImage />}
  reducedMotionState="after"
/>
```

`before` și `after` trebuie să ocupe aceeași geometrie. `range` controlează începutul și finalul, iar `progress` poate veni dintr-un timeline extern.

`playback="scrub"` este implicit. Reveal-ul are o singură fază: după `range[1]` rămâne complet cât utilizatorul continuă în jos, fără o a doua fază care îl închide. Dacă utilizatorul revine efectiv cu scroll-ul în sus prin același range, efectul se inversează natural. `playback="commit"` este opțional numai pentru cazurile în care starea nu trebuie să se inverseze deloc; `resetKey` o repornește deliberat.

## Personalizare obligatorie pentru AI

- alege direcția în funcție de compoziție, nu aleator;
- schimbă media, copy-ul, range-ul și starea reduced-motion;
- păstrează textul semantic în overlay sau în flux, nu duplicat în stratul mascat;
- respinge asset-uri nealiniate, margini vizibile și clip-path folosit doar ca ornament.

Evită blur plus clip-path pe imagini 4K; folosește maximum două plane full-screen.

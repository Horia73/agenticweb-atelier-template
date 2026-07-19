# KineticType

Titlu semantic cu timeline art-directat pe segmente și fallback static. Split-ul automat rămâne fallback; producția folosește de regulă `segments`.

## Instalare și exemplu

```bash
npx shadcn@latest add ./public/r/kinetic-type.json
```

```tsx
<KineticType
  as="h2"
  label="Principiul colecției"
  text="Formă care urmează intenția."
  segments={[
    { text: "FORMĂ", range: [0.08, 0.34], from: { x: "-40vw", rotate: -8 }, to: { x: 0, rotate: 0 } },
    { text: "urmează", range: [0.25, 0.55], from: { scale: .7, opacity: 0 }, to: { scale: 1, opacity: 1 } },
    { text: "intenția", range: [0.48, 0.82], from: { y: "1em", rotateX: 60 }, to: { y: 0, rotateX: 0 } },
  ]}
  textClassName="text-[clamp(4rem,10vw,9rem)]"
/>
```

Cititoarele de ecran primesc propoziția o singură dată; fragmentele animate sunt decorative. Pentru texte lungi folosește `words`, nu `characters`.

Fiecare segment poate declara `exit` și `exitRange`. Fără `exit`, segmentul rămâne în starea `to`; cu `exit`, poate dispărea din nou la finalul scenei. Astfel, compoziția poate fi invizibilă la ambele capete sau poate rămâne completă, fără a schimba engine-ul.

## Personalizare obligatorie pentru AI

- decide ritmul din sintaxă și momentele de accent, apoi construiește segmente diferite ca direcție, scară, tracking și greutate; nu lăsa fallback-ul generic drept rezultat final;
- verifică diacritice, line wrapping la 390/768/1440 px și zoom 200%;
- nu anima body copy, CTA-uri sau fiecare titlu al site-ului;
- respinge dacă motion-ul reduce lizibilitatea sau textul nu are valoare fără animație.

Ține fraza sub aproximativ 12 cuvinte pentru split pe cuvinte și sub 40 de caractere pentru split pe caractere.

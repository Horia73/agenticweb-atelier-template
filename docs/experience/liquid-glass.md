# LiquidGlassSurface și LiquidGlassNav

Aceste componente oferă o suprafață glass editabilă și un nav semantic cu active pill animat. Nu sunt o temă completă și nu impun poziționare, brand, meniu sau palette.

## Instalare

```bash
npx shadcn@latest add ./public/r/liquid-glass.json
```

## Exemplu

```tsx
<LiquidGlassNav
  label="Navigație principală"
  brand={<ProjectMark />}
  items={navigation}
  action={<ProjectCta />}
  surfaceClassName="bg-brand-950/20"
/>

<LiquidGlassSurface
  tint="220 240 255"
  blur={24}
  saturation={1.3}
  className="rounded-[2rem] p-8"
>
  <ProjectContent />
</LiquidGlassSurface>
```

## Personalizare și limite

- `tint`, blur, saturație, border opacity, radius și shadows trebuie să derive din direcția vizuală a clientului.
- `interactiveLight` este un highlight local, fără cursor custom sau punct central. Pe reduced motion rămâne static.
- `LiquidGlassNav` poate fi controlat cu `activeId` sau necontrolat cu `defaultActiveId`; linkurile rămân linkuri semantice.
- Pe fundal plat glass-ul nu are suficient context optic. Folosește-l peste media sau culoare cu variație, dar păstrează contrastul textului verificabil.
- Nu pune toate secțiunile site-ului în sticlă și nu combina simultan blur mare, glow, grain și parallax.

Agentul Studio trebuie să schimbe brandul, itemii, tint-ul, radius-ul, densitatea și placement-ul. Componenta din Lab este doar testul mecanicii.

## QA

Verifică Safari/Chrome, fallback fără `backdrop-filter`, contrast, zoom 200%, focus vizibil, link activ, touch, reduced motion și performance pe mobil. Un nav trebuie să rămână utilizabil și când fundalul din spate devine foarte luminos.

Fixture: `http://localhost:3000/experience-lab#liquid-glass`.

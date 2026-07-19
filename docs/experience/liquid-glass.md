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
  surfaceProps={{ blur: 11, saturation: 1.55, borderOpacity: 0.12 }}
  surfaceClassName="bg-brand-950/20"
/>

<LiquidGlassSurface
  variant="clear"
  tone="dark"
  tint="220 240 255"
  blur={18}
  saturation={1.42}
  className="rounded-[2rem] p-8"
>
  <ProjectContent />
</LiquidGlassSurface>
```

## Personalizare și limite

- `variant="clear"` păstrează contextul optic și folosește highlights/reflexii discrete; `regular` crește separarea când fundalul este prea aglomerat. `tone` calibrează automat conturul, lumina internă și shadow-ul pentru un context luminos sau întunecat.
- `tint`, blur, saturație, border opacity, radius și shadows trebuie să derive din direcția vizuală a clientului.
- `interactiveLight` este un highlight local, fără cursor custom sau punct central. Pe reduced motion rămâne static.
- `LiquidGlassNav` poate fi controlat cu `activeId` sau necontrolat cu `defaultActiveId`; linkurile rămân linkuri semantice.
- `surfaceProps` expune direct materialul nav-ului (`variant`, `tone`, tint, blur, saturation, border, glow), fără să forțeze agentul să editeze intern componenta doar pentru o direcție mai transparentă.
- Pe fundal plat glass-ul nu are suficient context optic. Folosește-l peste media sau culoare cu variație, dar păstrează contrastul textului verificabil.
- Nu pune toate secțiunile site-ului în sticlă și nu combina simultan blur mare, glow, grain și parallax.

Pe web aceasta este o aproximare progresivă a principiilor Liquid Glass: translucență contextuală, material adaptiv, highlights și separare prin lumină. `backdrop-filter` oferă blur/saturație, nu refraction/lensing nativ la nivelul sistemului Apple. Nu promite identitate pixel-perfect cu materialele private din iOS/macOS; pentru o lentilă fizică reală folosește un shader WebGL separat și păstrează acest component ca fallback semantic.

Agentul Studio trebuie să schimbe brandul, itemii, tint-ul, radius-ul, densitatea și placement-ul. Componenta din Lab este doar testul mecanicii.

## QA

Verifică Safari/Chrome, fallback fără `backdrop-filter`, contrast, zoom 200%, focus vizibil, link activ, touch, reduced motion și performance pe mobil. Un nav trebuie să rămână utilizabil și când fundalul din spate devine foarte luminos.

Fixture: `http://localhost:3000/experience-lab#liquid-glass`.

# MagneticField și MagneticTarget

Direcție de cursor fără cursor desenat: elementele aprobate se apropie ușor de pointer, iar cursorul nativ rămâne vizibil.

## Instalare și exemplu

```bash
npx shadcn@latest add ./public/r/cursor-magnetic.json
```

```tsx
<MagneticField>
  <MagneticTarget radius={280} strength={0.2} maxTravel={24} maxTilt={4}>
    <Button>Vezi proiectul</Button>
  </MagneticTarget>
</MagneticField>
```

Field-ul emite poziția pointerului numai în limita sa; target-urile răspund prin proximitate înainte de hover direct. Fiecare poate avea `radius`, `strength`, `maxTravel`, `maxTilt` și `activeScale` proprii. Folosește target-uri doar pentru CTA-uri sau obiecte care justifică atracția. Touch și reduced motion păstrează elementele statice.

## Personalizare obligatorie pentru AI

- alege maximum câteva target-uri importante și ajustează raza/intensitatea după ierarhie;
- păstrează suprafața de click, focus-ul și cursorul nativ;
- verifică mișcări rapide, leave/reset, nested links și zoom 200%;
- nu adăuga dot, trail, canvas global sau magnetism pe fiecare control;
- respinge dacă target-ul fuge de pointer, depășește bugetul declarat sau afectează layout-ul.

Componenta animă doar transform; nu introduce listeners globali și nu are asset-uri.

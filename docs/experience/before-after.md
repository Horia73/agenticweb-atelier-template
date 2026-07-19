# BeforeAfter

Comparație accesibilă cu range input nativ, utilizabilă prin mouse, touch și tastatură.

## Assets obligatorii

Cele două vizuale trebuie să aibă același crop, aceeași cameră și aceleași dimensiuni. Dacă nu sunt înregistrate, aliniază-le înainte de integrare.

## Instalare și exemplu

```bash
npx shadcn@latest add ./public/r/before-after.json
```

```tsx
<BeforeAfter
  label="Compară renovarea"
  beforeLabel="Înainte"
  afterLabel="După"
  before={<Image ... />}
  after={<Image ... />}
/>
```

Poate fi controlat cu `value` și `onValueChange` sau necontrolat cu `defaultValue`.
Handle-ul implicit folosește `ChevronsLeftRight`; `handleIcon` și `handleClassName` acceptă iconul și tratamentul proiectului fără să înlocuiască range input-ul nativ.

## Personalizare obligatorie pentru AI

- personalizează label-urile, poziția inițială, handle-ul prin clase și ambele asset-uri;
- verifică săgețile tastaturii, focus vizibil, drag touch și text la zoom 200%;
- explică diferența și în copy pentru utilizatorii care nu percep vizual comparația;
- respinge dacă imaginile sar, sunt deformate sau comparația nu dovedește nimic.

Încarcă ambele imagini responsive, dar prioritizează doar cea care intră prima în LCP.

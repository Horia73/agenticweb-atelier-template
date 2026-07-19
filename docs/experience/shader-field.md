# ShaderField

`ShaderField` este o suprafață WebGL bounded pentru atmosferă reactivă. Oferă cinci baze — `aurora`, `metaballs`, `contour`, `caustic`, `halftone` — dar copy-ul, dimensiunea, compoziția și culorile sunt ale proiectului.

## Instalare

```bash
npx shadcn@latest add ./public/r/shader-field.json
```

## Exemplu

```tsx
<ShaderField
  label="Câmp cromatic reactiv"
  mode="contour"
  colors={["#ffdf63", "#ff4d8d", "#281bff"]}
  speed={0.7}
  intensity={1.05}
  pointerStrength={0.8}
  fallback={<ProjectGradient />}
  className="min-h-[70svh]"
>
  <ProjectCopy />
</ShaderField>
```

## Alegerea modului

- `aurora`: fundal editorial, calm, pentru type și spațiu negativ.
- `metaballs`: produs experimental, cultură, tech sau tranziții organice.
- `contour`: date, topografie, arhitectură și identități mai precise.
- `caustic`: lumină lichidă, materiale premium, hospitality și produse în care lumina trebuie să pară substanță, nu gradient decorativ.
- `halftone`: raster duotone de inspirație print — un câmp de luminanță procedural eșantionat printr-o grilă de puncte rotită, care se umflă sub pointer; pentru identități editoriale, poster și direcții retro-print.

Nu folosi shader-ul ca decor generic în fiecare secțiune. Alege-l când mișcarea exprimă o proprietate a brandului și când fallback-ul static păstrează aceeași ierarhie.

## Producție

Runtime-ul limitează DPR, oprește animația offscreen, nu actualizează când documentul este ascuns și eliberează geometry/material/renderer. Context loss activează `fallback`.

Agentul trebuie să personalizeze palette prin `colors`, `mode`, `intensity`, `speed`, `pointerStrength`, dimensiunea și compoziția DOM. Acestea sunt props publice și nu cer fork. Dacă direcția cere alte frecvențe, noise sau geometrie a câmpului, agentul editează shader-ul livrat ca sursă — componenta nu este un runtime închis. Nu livrează culorile și headline-ul din Lab neschimbate.

Testează contrastul în toate fazele animației, pointer/touch, reduced motion, WebGL dezactivat, tab background, resize, device pixel ratio mare și un device low-power. Păstrează `maxDpr` între aproximativ 1 și 1.75 pentru suprafețe full-screen.

Fixture: `http://localhost:3000/experience-lab#shader-field`.

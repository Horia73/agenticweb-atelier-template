# DepthCameraScene — 2.5D Advanced

`DepthCameraScene` este engine-ul Advanced pentru o lume fotografică stratificată. Folosește o cameră `PerspectiveCamera` reală, două pass-uri WebGL și un plan DOM între ele, astfel încât textul semantic poate sta realmente în spatele hero-ului și în fața fundalului. Nu este un hero gata desenat și nu include asset-urile din Lab.

## Când îl alegi

Folosește-l când brief-ul justifică un zoom/dolly mare, mai multe adâncimi reale, ocluzie de text și minimum două beat-uri în aceeași lume. Pentru o singură fotografie integrată, un obiect-matte și text în spatele obiectului folosește `ScrollDepthScene`; acela rămâne varianta **Basic 2.5D**.

Nu îl alege pentru un singur fade, pentru un hero care trebuie să încarce instant pe device-uri slabe sau când nu există buget pentru asset-uri înregistrate și QA de matting.

## Instalare

```bash
npx shadcn@latest add ./public/r/depth-camera-scene.json
```

## Workflow-ul de asset-uri

Toate plate-urile sunt full-canvas, au exact aceeași cameră și rămân înregistrate pixel-la-pixel:

```text
00-sky
10-landscape
20-midground
29-contact-reflection
30-hero
40-foreground-left
41-foreground-right
50-edge-frame
```

Workflow ImageGen recomandat:

1. Generează și aprobă un master complet cu perspectivă, orizont, lumină, suprafață și negative space deliberate.
2. Editează succesiv același master, nu genera imagini independente: atmosferă → landscape → midground → hero → foreground stânga → foreground dreapta → edge frame.
3. După fiecare edit, extrage delta/obiectul în coordonatele masterului. Păstrează contact shadow și reflection ca plate separat, legat fizic de hero.
4. Folosește alpha proporțional, edge decontamination și bleed în spatele zonelor mobile. Verifică fiecare alpha pe alb, negru și o culoare saturată.
5. Recompune plate-urile la transform zero și compară rezultatul cu masterul. Livrează poster, crop-uri mobile înregistrate, `manifest.json` și un static composite de QA.

Fixture-ul din repo poate fi reconstruit cu:

```bash
uv run --with numpy --with pillow python scripts/build-depth-camera-assets.py \
  --source public/experience/depth-camera-world-v2/source \
  --output public/experience/depth-camera-world-v2
```

Coordonatele și pragurile scriptului sunt specifice fixture-ului; pentru client se redesenează și se inspectează, nu se copiază orbește.

## Exemplu minimal

```tsx
import { DepthCameraScene, type DepthCameraLayer } from "@/components/experience/depth-camera-scene"

const layers: DepthCameraLayer[] = [
  { id: "sky", src: "/world/00-sky.webp", plane: "back", depth: -2.4 },
  { id: "landscape", src: "/world/10-landscape.webp", plane: "back", depth: -1.5 },
  { id: "hero", src: "/world/30-hero.webp", plane: "front", depth: 0 },
  { id: "foreground", src: "/world/40-foreground.webp", plane: "front", depth: 0.8 },
]

export function ProjectWorld() {
  return (
    <DepthCameraScene
      label="Lumea materialului"
      layers={layers}
      poster="/world/poster.webp"
      mobilePoster="/world/mobile-poster.webp"
      backOverlay={<h1>Text semantic ocluzionat de hero</h1>}
      frontOverlay={<ProjectChrome />}
      reducedMotionFallback={<StaticProjectWorld />}
    />
  )
}
```

## Contract și personalizare

- `camera` primește keyframe-uri `{ at, x, y, z, lookX, lookY, fov }`; un `z` mai mic produce dolly/zoom real.
- `plane: "back" | "front"` stabilește pass-ul. `backOverlay` este între pass-uri, iar `frontOverlay` este peste toate plate-urile.
- `timeline` per layer ajustează numai corecții locale; mișcarea dominantă trebuie să vină din cameră.
- `progress` permite un controller extern; altfel progresul vine din scroll vertical nativ și se inversează natural la reverse-scroll.
- `smoothing`, `maxDpr`, `pointerStrength`, `scrollScreens` și camera se calibrează pentru fiecare direcție.

Agentul Studio trebuie să schimbe toate deciziile vizibile ale fixture-ului: lume, copy, crop, layer order, camera, keyframes, palette, tipografie, pointer și ritm. Nu livrează asset-urile sau compoziția din Lab.

## Producție și QA

- Componenta oprește randarea offscreen, limitează DPR, eliberează texturi și are fallback pentru context WebGL pierdut.
- Pe mobil folosește plate-uri mobile reale și travel mai mic. Nu descărca stack-ul desktop doar ca să îl recadrezi prin CSS.
- Reduced motion trebuie să elimine întregul corridor de scroll și să arate conținutul important în flow normal.
- Testează 390/768/1440 px, zoom de browser, resize în mijlocul scenei, scroll rapid înainte/înapoi, loading lent, context loss, console și lipsa oricărui flash între frame-uri.
- Verifică checkpoint-uri la început, fiecare hold narativ și final. Textul din spatele hero-ului trebuie să iasă suficient pentru lectură, nu să rămână permanent ascuns.

Fixture: `http://localhost:3000/experience-lab#depth-camera-scene` cu `EXPERIENCE_LAB=1`.

# ScrollDepthScene

`ScrollDepthScene` este o primitivă de comportament instalabilă din registry-ul shadcn. Nu este un hero, un template sau o direcție vizuală. Site-ul clientului furnizează toate imaginile, textele, clasele, keyframe-urile și fallback-urile.

## Ce rezolvă

- fixează scena cât timp pagina continuă să aibă scroll vertical nativ;
- compune în ordine orice număr de straturi raster și straturi React editabile;
- interpolează keyframe-uri independente pentru `x`, `y`, `z`, `scale`, `rotate`, `rotateX`, `rotateY`, `opacity`, `filter` și `clipPath`;
- acceptă timeline și conținut separat pentru mobil;
- adaugă pointer parallax per strat, dezactivat pe touch și mobil;
- poate primi un `MotionValue<number>` extern, pentru sincronizare cu altă poveste;
- înlocuiește întreaga scenă cu un fallback explicit la `prefers-reduced-motion`.

## Instalare

```bash
npx shadcn@latest add ./public/r/layered-depth.json
```

Componenta este copiată ca sursă editabilă în `components/experience/layered-depth.tsx` și instalează `motion` ca dependență.

## Contractul asset-urilor

O scenă fotografică 2.5D corectă nu repetă aceeași imagine cu măști aproximative. Pregătește:

| Plate | Format recomandat | Cerință |
| --- | --- | --- |
| background | AVIF/WebP opac | cadru complet după inpainting, fără găuri lăsate de obiectele extrase |
| midground / subject | WebP/PNG cu alpha | siluetă curată, fără halo, aliniată la camera background-ului |
| contact shadow / reflection | WebP/PNG cu alpha | umbra, reflexia și contactul cu suprafața, aliniate și ancorate împreună cu subiectul |
| foreground occluder | WebP/PNG cu alpha | elemente apropiate care pot acoperi media și textul |
| atmosphere, opțional | WebP/PNG cu alpha | ceață, lumină sau particule pre-randate, fără conținut critic |

- Livrează minimum 12% overscan pe fiecare margine care se deplasează.
- Păstrează aceeași cameră, perspectivă, lumină și crop logic în toate plate-urile.
- Pentru desktop, pornește de la minimum 2000 px pe latura lungă; pregătește crop separat pentru mobil când subiectul nu supraviețuiește unui `object-position` diferit.
- Optimizează imaginile înainte de integrare și declară dimensiuni stabile. Demo-ul inclus folosește background, contact shadow, subject și poster înregistrate la 1672×941.
- Blochează background-ul, contact plate-ul și subject-ul în aceeași poziție în primul beat (recomandat 10–15%). Abia după ce utilizatorul vede compoziția corectă începe separarea de adâncime.
- Setează același `transformOrigin` pentru subject și contact plate în punctul fizic de sprijin (roți/asfalt, talpă/podea, obiect/masă). Nu scala subiectul din centrul canvasului.
- Dacă există doar o fotografie, pipeline-ul trebuie să facă segmentare + inpainting. Un depth-map WebGL este o mecanică diferită și trebuie tratată separat.
- Un video simplu nu repară un 2.5D greșit. Pentru adâncime peste video sunt obligatorii video-ul și o mată alpha sincronizată cadru-cu-cadru (`mode: "video-matte"`).

### Mod integrat pentru text în spatele obiectului

Când obiectul trebuie să rămână perfect fotografic, iar efectul cerut este zoom de cameră + text care apare din spatele lui, folosește `mode: "integrated-occlusion"`:

1. baza este masterul complet cu obiectul, umbra și reflexiile deja integrate;
2. textul React se compune deasupra masterului;
3. obiectul decupat din același master se repetă deasupra numai ca occlusion matte;
4. masterul și occlusion matte primesc keyframe-uri și pointer values identice.

Decupajul este invizibil cât timp nu există text, deoarece reproduce aceiași pixeli peste master. Obiectul nu este recompus pe un alt asfalt și nu poate „pluti”; matte-ul doar reacoperă textul acolo unde obiectul trebuie să fie în față. Acesta este modul preferat pentru demo-ul `integrated master + text behind`.

Acesta este **2.5D** chiar dacă art direction-ul este foarte premium: master integrat, tipografie mare în spatele produsului, occlusion matte și cel mult un foreground separat pentru splash/reflexie. Nu cere automat un stack complet de plate-uri.

### Stack complet, când există parallax real

Toate fișierele rămân full-canvas și înregistrate; prefixele fixează ordinea:

| Prefix | Rol |
| --- | --- |
| `00-sky` | cer/atmosferă îndepărtată, opac sau alpha după caz |
| `10-landscape` | relief și fundal îndepărtat |
| `20-midground` | arhitectură, vegetație sau teren intermediar |
| `30-hero` | obiectul principal + contact plate separat |
| `40-foreground-left` | ocluzie apropiată stânga |
| `41-foreground-right` | ocluzie apropiată dreapta |
| `50-edge-frame` | frunze, ramă sau atmosferă foarte apropiată |

Nu genera aceste plate-uri independent. Generează/aprobă întâi masterul compozit, apoi segmentează sky/landscape/midground după depth și extrage fiecare obiect imediat după editarea lui. Pentru un obiect opac izolat, un fundal chroma plat + eliminare locală poate produce alpha; umbrele, sticla, părul, reflexiile și contactul se extrag din master sau printr-un tool de matting dedicat, nu din chroma aproximativ.

Folosește stack-ul complet numai când brief-ul cere mai multe adâncimi reale în aceeași lume. `ScrollDepthScene` rămâne engine-ul behavior-only; compune beat-urile proiectului direct din straturi React și raster. Dacă povestea are și un catalog, montează-l ca secțiune separată cu `HorizontalTrack` sau `HorizontalStoryRail`, fără sticky-uri imbricate.

## Exemplu minimal

```tsx
import Image from "next/image"

import {
  ScrollDepthScene,
  type LayeredDepthLayer,
} from "@/components/experience/layered-depth"

const layers: LayeredDepthLayer[] = [
  {
    id: "background",
    depth: 0.1,
    content: <Image alt="" src="/scene/background.webp" fill sizes="100vw" />,
    timeline: [
      { at: 0, y: 0, z: 0, scale: 1.05 },
      { at: 1, y: -24, z: 0, scale: 1.1, filter: "blur(2px)" },
    ],
  },
  {
    id: "rear-title",
    depth: 0.3,
    ariaHidden: false,
    content: <h2>Text editabil în spatele subiectului</h2>,
    timeline: [
      { at: 0, y: 60, opacity: 0, filter: "blur(8px)" },
      { at: 0.2, y: 0, opacity: 1, filter: "blur(0px)" },
      { at: 0.7, y: -80, opacity: 0 },
    ],
  },
  {
    id: "contact-shadow",
    depth: 0.62,
    transformOrigin: "58% 81%",
    content: <Image alt="" src="/scene/contact-shadow.webp" fill sizes="100vw" />,
    timeline: [
      { at: 0, y: 0, scale: 1 },
      { at: 0.15, y: 0, scale: 1 },
      { at: 1, y: -8, scale: 1.03 },
    ],
  },
  {
    id: "subject",
    depth: 0.65,
    content: <Image alt="" src="/scene/subject.webp" fill sizes="100vw" />,
    pointer: { x: 6, y: 3, rotateX: 0.2, rotateY: 0.3 },
    transformOrigin: "58% 81%",
    timeline: [
      { at: 0, y: 0, z: 0, scale: 1 },
      { at: 0.15, y: 0, z: 0, scale: 1 },
      { at: 1, y: -8, z: 0, scale: 1.03 },
    ],
  },
]

export function StoryScene() {
  return (
    <ScrollDepthScene
      label="Poveste vizuală despre..."
      layers={layers}
      sourceContract={{ sourceId: "approved-master-01", mode: "segmented-still", aligned: true, contactPlates: 1 }}
      scrollScreens={4}
      reducedMotionFallback={<StaticStory />}
    />
  )
}
```

Ordinea din array este ordinea de compoziție. Textul plasat înaintea `subject` poate fi acoperit de subiect; textul plasat după el poate sta în față. `z` adaugă perspectivă reală în interiorul scenei.

## API esențial

### `ScrollDepthScene`

| Prop | Rol |
| --- | --- |
| `layers` | straturile ordonate ale scenei |
| `scrollScreens` | lungimea verticală a timeline-ului în viewport-uri |
| `progress` | progres extern controlat, între `0` și `1` |
| `scrollSpring` | `false` implicit pentru scrub direct; primește spring numai când lag-ul este dorit și testat |
| `sourceContract` | declară sursa comună și tipul pipeline-ului; nu validează vizual plate-urile |
| `pointerTravel` / `pointerSpring` | fallback global pentru pointer parallax |
| `mobileBreakpoint` | pragul care activează `mobileContent` și `mobileTimeline` |
| `reducedMotionFallback` | versiunea statică și accesibilă a întregii scene |
| `onProgressChange` | integrare cu analytics, capitole sau UI extern |
| `stageClassName` / `stageStyle` | stilizarea scenei fără modificarea engine-ului |

### Fiecare layer

| Prop | Rol |
| --- | --- |
| `content` / `mobileContent` | media sau text React complet editabil |
| `timeline` / `mobileTimeline` | unul sau mai multe keyframe-uri ordonate prin `at: 0...1` |
| `pointer` | intensitate numerică, obiect pe axe/rotații sau `false` |
| `ariaHidden` | `true` pentru decor; setează `false` pentru text semantic unic |
| `reducedMotionFrame` | stare statică atunci când nu există fallback pentru toată scena |
| `transformOrigin` | ancora fizică folosită de scale/rotații; trebuie împărțită cu plate-ul de contact |
| `className` / `contentClassName` | poziționare și art direction per proiect |

## Accesibilitate și performanță

- Nu pune linkuri sau formulare în straturi care devin invizibile prin opacity. CTA-urile rămân în conținutul normal sau în overlay-ul permanent.
- Textele decorative duplicate rămân `ariaHidden`; textele unice primesc `ariaHidden: false`.
- Pentru reduced motion, furnizează o compoziție statică în flux, cu tot mesajul important vizibil.
- Animațiile folosesc transforms, opacity, filter și clip-path. Folosește blur/clip-path cu măsură și evită mai mult de 5–7 plate-uri full-screen.
- Imaginile trebuie să aibă `sizes`, dimensiuni stabile și prioritizare numai pentru primul viewport.
- Pe fiecare proprietate de timeline folosește aceeași unitate. Engine-ul normalizează `0` la unitatea seriei, dar nu amesteca `%`, `px`, `vw` sau unghiuri diferite în aceeași serie.

## Contract de personalizare pentru AI

Exemplul din `/experience-lab` este numai QA pentru engine și nu se copiază într-un site de client.

Înainte de implementare, agentul trebuie să decidă și să documenteze:

1. motivul de business și beat-ul narativ al scenei;
2. plate-urile aprobate, drepturile lor și eventualele goluri de asset;
3. ordinea de occlusion, inclusiv poziția textelor față de subject/foreground;
4. timeline-ul desktop, crop-ul/timeline-ul mobil și fallback-ul reduced motion;
5. bugetul de bytes și numărul maxim de straturi;
6. ce a personalizat față de playground: copy, assets, crop, keyframes, pointer și tokens.

Respinge implementarea dacă folosește asset-urile sau copy-ul playground-ului, repetă aceeași fotografie pe toate plane-urile ori nu are fallback mobil/reduced-motion.

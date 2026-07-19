# HorizontalTrack

Motor orizontal măsurat, controlat exclusiv printr-un `MotionValue<number>` extern. Componenta nu creează o secțiune sticky, nu citește scroll-ul global și nu impune un timeline. Poate fi montată într-o scenă 2.5D, într-un controller de carousel sau într-un alt recipe.

## Instalare

```bash
npx shadcn@latest add ./public/r/horizontal-track.json
```

## Exemplu controlat

```tsx
import { useTransform } from "motion/react"

import { HorizontalTrack } from "@/components/experience/horizontal-track"

const catalogProgress = useTransform(sceneProgress, [0.75, 0.96], [0, 1], {
  clamp: true,
})

<HorizontalTrack
  label="Catalog"
  progress={catalogProgress}
  itemClassName={(index) => index === 1 ? "w-[56vw]" : "w-[34vw]"}
  trackClassName="gap-4 px-[8vw]"
>
  {items.map((item) => <CatalogCard key={item.id} item={item} />)}
</HorizontalTrack>
```

`progress` este normalizat la `0…1`. Componenta măsoară `track.scrollWidth - viewport.clientWidth`, observă track-ul și viewport-ul cu `ResizeObserver` și recalculează automat după resize, font loading sau schimbarea dimensiunilor conținutului.

## Contract

- `HorizontalTrack` este o infrastructură controlată, nu o mecanică signature pe care Studio o propune singură clientului;
- parent-ul decide sursa progresului, sticky behavior-ul, timeline-ul și fallback-ul reduced-motion;
- `itemClassName` acceptă o clasă comună sau o funcție per index, deci item-urile pot avea lățimi diferite;
- `trackClassName` personalizează gap-ul, padding-ul și alinierea;
- `onMetricsChange` expune distanța, dimensiunea track-ului și viewport-ul pentru controllere externe;
- conținutul rămâne React semantic, iar ordinea DOM nu se schimbă.

Pentru varianta vertical-scroll completă folosește `HorizontalStoryRail`. Pentru catalogul final al unei scene cinematice, compune `HorizontalTrack` cu un controller de index/drag și animă intrarea întregului catalog prin timeline-ul scenei.

## QA

- testează `progress` la `0`, `0.5` și `1`;
- modifică lățimea viewport-ului după montare;
- verifică item-uri cu lățimi diferite și conținut încărcat lent;
- verifică faptul că primul și ultimul item se așază complet;
- parent-ul trebuie să ofere fallback normal pentru touch și `prefers-reduced-motion`;
- nu transforma acest building block într-un carousel fără controale, drag/swipe și tastatură.

# HorizontalStoryRail

Transformă scroll-ul vertical nativ într-o poveste orizontală măsurată din conținutul real.

## Folosește / evită

Potrivit pentru o succesiune ordonată de 3–7 cadre care câștigă sens lateral. Nu îl folosi pentru logo clouds, carusele obișnuite sau conținut care trebuie scanat rapid.

## Instalare și exemplu

```bash
npx shadcn@latest add ./public/r/horizontal-story-rail.json
```

```tsx
<HorizontalStoryRail label="Procesul în patru etape">
  {steps.map((step) => <article key={step.id}>{step.title}</article>)}
</HorizontalStoryRail>
```

Copiii sunt conținut React complet editabil. Componenta măsoară `scrollWidth`, recalculează la resize și păstrează scroll-ul browserului vertical. Reduced motion afișează o listă normală.

Intern, wrapperul folosește `HorizontalTrack`. `itemClassName` poate fi o clasă comună sau o funcție per index, deci cardurile pot avea lățimi și înălțimi diferite. Pentru integrare într-un timeline existent, instalează și folosește direct `HorizontalTrack`; nu monta o a doua secțiune sticky în interiorul primei scene.

Scrub-ul este direct implicit, ca primul și ultimul cadru să se așeze exact. `scrollSpring` poate primi opțiuni Motion numai după ce lag-ul a fost verificat; `progress` permite sincronizarea cu un timeline extern.

## Personalizare obligatorie pentru AI

- definește de ce ordinea este laterală, lățimea cardurilor, ritmul, gap-ul și contrastul;
- ține CTA-urile utilizabile cu tastatura și nu bloca wheel/touch prin event listeners;
- testează primul și ultimul cadru, resize, font loading și 390/768/1440 px;
- respinge dacă există sub trei cadre, overflow accidental sau un carousel ar fi mai clar.

Țintește sub 5–7 cadre și folosește media responsive; nu preîncărca toate imaginile mari.

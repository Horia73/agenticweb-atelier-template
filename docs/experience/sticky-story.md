# StickyStory

Leagă o coloană de capitole semantice de un vizual sticky care se schimbă odată cu capitolul activ.

## Folosește / evită

Potrivit pentru procese, dovezi și narațiuni în care același cadru vizual capătă sens nou. Evită-l când fiecare capitol este independent sau când vizualul nu se schimbă material.

## Instalare și exemplu

```bash
npx shadcn@latest add ./public/r/sticky-story.json
```

```tsx
<StickyStory
  chapters={chapters}
  visualLabel="Produsul în etapa activă"
  renderVisual={(chapter) => <ProductStage id={chapter.id} />}
/>
```

`chapters` conține `id`, `eyebrow`, `title`, `body`; `renderVisual` primește capitolul și indexul. Pe ecrane mici vizualul rămâne în flux.

Pe desktop, toate stările vizuale sunt suprapuse într-un stage `sticky top: 0; height: 100svh`; containerul nu urcă și nu își schimbă geometria între capitole. `visualSide="right" | "left"` permite compoziții consecutive de câte 2–4 capitole fără să impună un template de pagină. Pe mobil, fiecare capitol își afișează vizualul în flux.

Coloana de conținut include implicit un gutter fluid (`px-5` → `clamp(2rem, 6vw, 7rem)`), astfel încât textul să nu atingă marginea viewportului. Îl poți înlocui prin `contentClassName`, dar păstrează minimum 20 px la 390 px și verifică headline-urile lungi.

## Personalizare obligatorie pentru AI

- rescrie toate capitolele și construiește stări vizuale distincte, nu variații cosmetice;
- păstrează mesajul complet în text, chiar dacă vizualul nu se încarcă;
- verifică `stickyTop`, header-ul real și secțiuni foarte scurte/lungi;
- compune mai multe grupuri dacă povestea cere alternarea vizualului stânga/dreapta; nu introduce această alternare în engine;
- respinge dacă vizualul duplică textul fără valoare sau schimbarea produce layout shift.

Încarcă doar starea activă și vecinii când media este grea; asigură dimensiune stabilă pentru container.

Pentru modelul 3 + 3 din Lab, compune două instanțe consecutive: prima cu `visualSide="right"`, a doua cu `visualSide="left"`. Așa obții oglindirea fără ca un singur engine să-și mute coloanele în mijlocul unei secțiuni sticky.

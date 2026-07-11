# Ghid pentru agent — site de client AgenticWeb

Ești în workspace-ul unui **site de client**, pornit din acest template
(Next.js 15 App Router + Tailwind v4). Contextul clientului (nume, servicii,
culori, pagini dorite) vine în system prompt din brieful completat de client.

## Cum e organizat

- `src/content.ts` — TOT conținutul editabil (nume, slogan, servicii, contact,
  texte). **Începe de aici**: rescrie-l din brief înainte de orice altceva.
- `src/app/globals.css` — tema, în variabile `@theme`. Reculorează site-ul
  schimbând `--color-brand`, `--color-ink`, `--color-bg` etc. din culorile
  clientului. NU împrăștia culori hardcodate prin componente.
- `src/app/page.tsx` — landing-ul, pe secțiuni (Hero, Servicii, Despre,
  Contact). Adaugă/rearanjează secțiuni după paginile cerute în brief.
- `src/app/` — adaugă rute noi ca foldere (`src/app/despre/page.tsx` etc.)
  când clientul vrea pagini separate.

## Reguli

1. **Conținut din `content.ts`, culori din `globals.css`** — păstrează separarea.
2. Fișierele urcate de client (logo, poze) vin ca URL-uri în system prompt;
   descarcă-le cu `curl -o public/…` și folosește-le (logo în header, poze în
   Hero/galerie).
3. Mobile-first: verifică pe lățimi mici; Tailwind e `sm:`/`lg:` peste baza mobilă.
4. Nu adăuga dependențe grele fără motiv — template-ul e intenționat slab.
5. Româna corectă cu diacritice în tot conținutul vizibil.

## Rulare

`npm run dev` pornește dev-serverul. Providerul Atelierului îl gestionează;
tu doar editezi fișiere, preview-ul se actualizează singur (HMR).

# Ghid pentru agent — site de client AgenticWeb

Ești în workspace-ul unui **site de client**, pornit din acest template
(Next.js 16, App Router + Tailwind v4 + componente shadcn). Contextul
clientului (nume, servicii, culori, pagini dorite, fișierele urcate) vine în
system prompt, din brieful completat de client — iar mai târziu, manualul de
identitate vizuală. **Respectă-le ca sursă de adevăr**; unde tac, alege tu cu
bun-gust și spune ce ai presupus.

## Cum e organizat

- `src/content.ts` — TOT conținutul editabil (nume, slogan, servicii, contact,
  texte). **Începe de aici**: rescrie-l din brief înainte de orice altceva.
- `src/app/globals.css` — TEMA. Identitatea vizuală a clientului = rescrii
  variabilele din `:root` (`--primary`, `--background`, `--radius`…).
  Componentele le respectă automat. **Nu hardcoda culori** în pagini.
- `src/app/page.tsx` — landing-ul, pe secțiuni. Adaugă/rearanjează secțiuni;
  pagini noi = foldere în `src/app/`.
- `src/components/ui/` — componentele shadcn instalate (button, input, field,
  select, dialog, dropdown-menu, card, checkbox, radio-group, popover,
  tooltip…). Mai poți adăuga din registru: `npx shadcn@latest add <nume>`.
- `src/components/agenticweb/` — componentele legate de platforma AgenticWeb
  (chatbot, lead form, bookings) — vezi README-ul de acolo; unele sunt încă
  în lucru.

## Când shadcn, când custom

- **Folosește shadcn** pentru primitivele interactive și formularele simple:
  butoane, inputuri, select, dialog, dropdown, tooltip, formular de contact
  (Field + Input + Textarea + Button). Vin cu accesibilitate corectă
  (tastatură, focus, ARIA) — nu le rescrie.
- **Construiește custom** ori de câte ori designul sau nevoia o cere:
  secțiuni de landing, galerii, liste de prețuri, hero-uri, animații,
  componente specifice domeniului clientului. E RECOMANDAT să faci custom
  când șablonul ar arăta generic — scopul e un site care nu pare făcut pe
  bandă. Custom ≠ reinventat: compune peste primitivele shadcn unde ajută.

## Reguli

1. Conținut din `content.ts`, culori/temă din `globals.css` — păstrează separarea.
2. Fișierele clientului (logo, poze, meniu) vin ca URL-uri în system prompt;
   descarcă-le cu `curl -o public/…` și folosește-le real (logo în header,
   poze în hero/galerie, meniul în pagina de servicii).
3. Mobile-first: baza e mobilă, `sm:`/`lg:` sunt straturi peste ea.
4. Fără dependențe grele fără motiv; fără culori/fonturi hardcodate.
5. Română corectă, cu diacritice, în tot conținutul vizibil.
6. Fonturi: dacă identitatea cere alt font, folosește `next/font/google` în
   `layout.tsx` și leagă-l la `--font-sans`.

## Rulare

`npm run dev` pornește dev-serverul — dar providerul Atelierului îl
gestionează singur; tu doar editezi fișiere, preview-ul se actualizează (HMR).

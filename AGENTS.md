# Harta repo-ului — site de client AgenticWeb

Acest fișier NU e promptul unui agent (fiecare agent își primește promptul
lui, per etapă). E harta și convențiile repo-ului — citită nativ de Codex și
Claude Code și valabilă pentru ORICINE editează site-ul mai târziu (agentul
de construcție azi, AI Manager-ul / editorul de site după lansare).

## Harta

- `src/content.ts` — TOT conținutul editabil (nume, slogan, servicii, contact).
- `src/app/globals.css` — TEMA: variabilele din `:root` (`--primary`,
  `--background`, `--radius`…). Identitatea vizuală se aplică doar aici.
- `src/app/page.tsx` — landing-ul, pe secțiuni; pagini noi = foldere în `src/app/`.
- `src/components/ui/` — componentele shadcn instalate; altele:
  `npx shadcn@latest add <nume>`.
- `src/components/agenticweb/` — componentele legate de platforma AgenticWeb
  (chatbot, lead form, bookings) — vezi README-ul de acolo.
- `docs/` — documentația implementării (apare la finalul construcției).

## Convenții

1. Conținut în `content.ts`, temă în `globals.css` — niciodată culori/texte
   hardcodate în componente.
2. shadcn pentru primitive interactive și formulare simple (accesibilitatea e
   rezolvată acolo); custom pentru secțiuni și tot ce ar arăta generic din
   șablon — compus peste primitive, nu reinventat.
3. Mobile-first; `sm:`/`lg:` sunt straturi peste baza mobilă.
4. Română corectă, cu diacritice, în tot ce e vizibil.
5. Fonturi noi doar prin `next/font/google`, legate la `--font-sans`.
6. Fără dependențe grele fără motiv.

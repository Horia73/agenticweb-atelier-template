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
- `.agents/skills/shadcn/SKILL.md` — regulile oficiale shadcn, locale repo-ului;
  se citesc înaintea oricărei schimbări UI.
- `studio.template.json` — contractul machine-readable folosit de Studio pentru
  adaptoare, preview și verificări.
- `src/components/agenticweb/` — componentele legate de platforma AgenticWeb
  (chatbot, lead form, bookings) — vezi README-ul de acolo.
- `docs/` — documentația implementării (apare la finalul construcției).

## Convenții

1. Conținut în `content.ts`, temă în `globals.css` — niciodată culori/texte
   hardcodate în componente.
2. `src/components/ui/` este stratul canonic de primitive. shadcn este fundația
   implicită pentru comportament accesibil, formulare, overlays și stări, nu o
   direcție vizuală obligatorie.
3. Contractul pornește în `ui.designMode: hybrid`: landing-urile și suprafețele
   editoriale au identitate, layout, secțiuni, navigație și motion custom;
   primitivele behavior-heavy pornesc din stratul canonic.
4. Dacă direcția aprobată cere un landing „wow”, modifică substanțial o
   primitivă canonică sau variantele ei într-un singur loc. Nu o înlocui cu
   copii Button/Input/Dialog răspândite prin feature-uri și nu transforma
   pagina într-o colecție de carduri shadcn.
5. În modurile `hybrid`/`custom-first`, rețetele product-UI din skill sunt
   orientative pentru markup editorial neinteractiv: nu transforma automat un
   element art-directed în Card, Badge sau Alert doar fiindcă există în shadcn.
6. `<button>`, `<input>`, `<textarea>`, `<select>` și Radix direct rămân în
   `src/components/ui/`; excepțiile native reale se documentează explicit.
7. Mobile-first; `sm:`/`lg:` sunt straturi peste baza mobilă.
8. Română corectă, cu diacritice, în tot ce e vizibil.
9. Fonturi noi doar prin `next/font/google`, legate la `--font-sans`.
10. Fără dependențe grele fără motiv.
11. `npm run check:ui` trebuie să rămână verde. O excepție nativă reală se
   documentează pe linia elementului cu `ui-primitive-allow-native`.

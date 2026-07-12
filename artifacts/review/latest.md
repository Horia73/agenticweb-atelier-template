# Review site integrat — Studio Ceramic E2E

**Data:** 12 iulie 2026  
**Etapă:** Review  
**Verdict:** implementarea este sigură pentru următorul pas gated de remediere/aprobare, dar **nu este pregătită pentru deployment public**.

## Rezumat

Fluxul principal este coerent cu brief-ul: atelierul introductiv și cererea de rezervare domină ierarhia, obiectele nu sunt prezentate ca ecommerce, capacitatea confirmată este separată de datele sintetice, iar preview-ul este marcat vizibil și `noindex, nofollow`. Formularul este blocat în HTML înainte de hidratare, folosește endpointul și proprietatea `key` aprobate, păstrează datele la eroare și mută focusul către rezultatul accesibil.

Build-ul, TypeScript și testul browser al succesului trec. Nu s-a trimis niciun lead real: endpointul a fost interceptat integral în test. Review-ul nu aprobă publicarea.

## Verificări executate

| Verificare | Rezultat |
|---|---|
| `npm run build` | Trecut; `/`, `/_not-found` și `/icon.svg` sunt statice. |
| `npx tsc --noEmit` | Trecut. |
| `npm run test:booking` cu server local de producție | Trecut; exact un POST simulat, payload canonic cu `key`, sesiune în `meta`, honeypot, pagina curentă, URL neschimbat și confirmare accesibilă. |
| `git diff --check` înaintea artefactelor | Trecut. |
| `npm run lint` | Eșuat: scriptul `next lint` nu mai este valid în Next.js 16 și este interpretat ca director `lint`. |
| Inspecție statică SSR/formular | Trecut pentru gardul pre-hidratare: `fieldset disabled={!hydrated ...}`; submit-ul este prevenit și nu rulează înainte de hidratare. |
| Inspecție vizuală Chromium, desktop 1440 px | Hero, navigație, CTA, marcaj E2E și începutul modulului atelierului sunt lizibile și coerente cu direcția aprobată. |
| Inspecție mobilă | Captura CLI nu a oferit emulare mobilă de încredere pentru întregul document; riscul este consemnat în F-003, fără a inventa un defect vizual. |

Nu a fost disponibil un runner automat de accesibilitate în dependențele repo-ului. Structura semantică, focusul, etichetele, stările live, țintele și contrastele aprobate au fost inspectate în cod, dar aceasta nu înlocuiește un audit automat și unul cu tastatura pe toate stările.

## Findings

### F-001 — P1 — Porțile intenționate E2E blochează deployment-ul public

- **Evidență:** `src/content.ts` declară `e2e.publishable: false`, marchează prețul, programul, procesul, instructorul și confirmarea ca sintetice; `src/app/layout.tsx` setează `noindex, nofollow`; pagina folosește wordmark și placeholder-e locale de test. Lipsesc fotografiile originale, datele reale comerciale/de contact, domeniul și aprobarea de publicare.
- **Locație:** `src/content.ts`, `src/app/layout.tsx`, `src/app/page.tsx`; contractul de identitate aprobat numai pentru E2E.
- **Impact:** publicarea ar expune informații neconfirmate și o identitate neaprobată. Acesta este un blocker intenționat al preview-ului, nu o regresie a implementării E2E.
- **Criteriu de acceptare:** toate valorile sintetice și placeholder-ele sunt înlocuite cu date/active aprobate; numele, contactul, politicile și textul de confidențialitate sunt aprobate; aprobarea explicită de publicare există; abia apoi se decide eliminarea marcajelor și a `noindex`.

### F-002 — P2 — Verificarea lint nu este executabilă

- **Evidență:** `npm run lint` rulează `next lint`; Next.js 16.2.10 răspunde `Invalid project directory .../lint`.
- **Locație:** `package.json`, scriptul `lint`.
- **Impact:** poarta statică declarată a repo-ului nu poate detecta probleme de calitate înainte de release; review-ul nu poate considera toate verificările obligatorii trecute.
- **Criteriu de acceptare:** scriptul lint este migrat la un linter compatibil și configurat, comanda rulează cu exit 0, iar rezultatul este inclus în gate-ul de build.

### F-003 — P2 — Testul browser nu acoperă eroarea, retry-ul și starea pre-hidratare

- **Evidență:** `tests/booking-form.browser.mjs` așteaptă `data-hydrated=true`, simulează numai răspuns 201 și verifică numai succesul. Starea 4xx/5xx, păstrarea valorilor, focusul pe alertă, retry-ul și imposibilitatea submit-ului înainte de hidratare sunt implementate, dar nu sunt exercitate end-to-end.
- **Locație:** `tests/booking-form.browser.mjs`, `src/components/booking-form.tsx`.
- **Impact:** regresii într-un flux de rețea eșuat sau în gardul critic de hidratare pot ajunge nedetectate la pasul următor.
- **Criteriu de acceptare:** testele simulează cel puțin un răspuns 500 urmat de retry 201, verifică `role=alert`, focusul, valorile păstrate și un singur POST per încercare; un test separat verifică HTML-ul/formularul dezactivat înainte de hidratare și absența navigării/POST-ului.

### F-004 — P2 — URL-ul complet al paginii este transmis fără o politică pentru query/fragment

- **Evidență:** payloadul folosește `page: window.location.href`; textul de privacy spune că datele introduse sunt transmise, dar nu explică transmiterea URL-ului complet. Testul confirmă că inclusiv query-ul `?verify=...` ajunge în payload.
- **Locație:** `src/components/booking-form.tsx`, `src/content.ts`, `tests/booking-form.browser.mjs`.
- **Impact:** parametri de campanie sunt de regulă benigni, dar query-ul poate conține accidental identificatori sau alte date care nu sunt necesare lead-ului.
- **Criteriu de acceptare:** proprietarul contractului decide și documentează dacă AgenticWeb necesită URL complet; dacă nu, se transmite numai origin + pathname (fără query/fragment). Dacă da, disclosure-ul și politica de linkuri interzic parametri sensibili și sunt aprobate înainte de publicare.

## Accesibilitate și responsive

- Există `lang="ro"`, skip link, un singur `main`, ierarhie coerentă de titluri, navigație etichetată, label-uri asociate și controluri native.
- CTA-urile și sumarul FAQ au minimum 44 px; meniul desktop este ascuns pe mobil, dar CTA-ul principal rămâne disponibil.
- Succesul folosește `role=status`, eroarea `role=alert`, ambele primesc focus programatic; butonul și fieldset-ul comunică starea de trimitere.
- `prefers-reduced-motion` este tratat. Perechile cromatice intenționate sunt cele aprobate anterior WCAG AA.
- Nu a fost verificată cu instrument automat întreaga pagină la breakpoint-uri intermediare și zoom 200%; aceasta rămâne parte din acceptarea F-003, nu un defect vizual confirmat.

## Corectitudine, adevăr și date

- Capacitatea de maximum 8 și București sunt fapte din brief; restul detaliilor operaționale de test sunt marcate explicit.
- Placeholder-ele sunt locale, neutre și nu pretind fotografii, produse sau persoane reale.
- Formularul transmite nume, email, mesaj opțional, URL, honeypot și sesiune către AgenticWeb. Nu există persistență locală și formularul se golește numai după succes.
- Nu există checkbox de consimțământ sau link către o politică; legalitatea bazei de prelucrare nu poate fi stabilită din repo și trebuie aprobată înainte de publicare, ca parte din F-001/F-004.

## Release blockers și ordine recomandată

1. Reparați poarta lint și extindeți testele pentru eroare/retry și pre-hidratare (F-002, F-003).
2. Decideți minimizarea câmpului `page` și aprobați disclosure-ul de date (F-004).
3. Furnizați și aprobați datele reale, identitatea, activele, contactele și politicile; înlocuiți numai în etapa de fix/build, nu în review (F-001).
4. Rulați auditul final accesibilitate/responsive pe desktop, mobil, tastatură, zoom și toate stările formularului.
5. Solicitați aprobarea explicită de publicare; deployment-ul rămâne interzis până atunci.


# Review final independent — Studio Ceramic E2E

**Data:** 12 iulie 2026

**Etapă:** Review după remedierea Builder

**Verdict tehnic:** **acceptat** — toate remediile tehnice cerute și toate porțile obligatorii trec.

**Verdict publicare:** **blocat intenționat** — preview-ul conține date și identitate E2E nepublicabile, păstrează `noindex, nofollow` și nu are aprobare de publicare.

## Rezumat

Review-ul independent confirmă în cod și în Chromium că cele trei findings tehnice din review-ul anterior sunt remediate: lint-ul este executabil, testul acoperă gardul pre-hidratare și traseele succes/eroare/retry, iar `page` transmite exclusiv `window.location.pathname`. URL-ul browserului rămâne neschimbat, toate cele trei POST-uri sunt interceptate și simulate, iar testul nu poate crea lead-uri reale.

Nu există blocker tehnic rămas pentru remedierea evaluată. F-001 rămâne o poartă intenționată de publicare, distinctă de acceptarea tehnică. `npm audit` raportează două vulnerabilități moderate, dar acestea sunt două noduri ale aceleiași cauze tranzitive: `next@16.2.10` include `postcss@8.4.31`, afectat de GHSA-qx2v-qp2m-jg93. În această aplicație CSS-ul este local și compilat la build, fără CSS neîncrezător furnizat de utilizatori și fără stringify PostCSS la runtime; nu a fost demonstrată o cale de exploatare în runtime sau în site-ul static rezultat. Riscul de build/deployment rămâne redus și neblocant, dar dependența trebuie actualizată când Next oferă o versiune compatibilă. Nu s-a rulat `npm audit fix --force`.

## Verificări executate

| Verificare | Rezultat |
|---|---|
| `npm run lint` | Trecut, fără erori sau avertismente; rulează `eslint .` cu configurația flat Next.js. |
| `npm run test:booking` | Trecut pe build de producție servit local la `127.0.0.1:3210`. |
| `npx tsc --noEmit` | Trecut. |
| `npm run build` | Trecut; `/`, `/_not-found` și `/icon.svg` sunt prerandate static. |
| `git diff --check` înaintea artefactelor | Trecut. |
| `npm audit --json` | Exit 1: 2 moderate, 0 high/critical; `next` direct este raportat prin `postcss@8.4.31` tranzitiv. |
| `npm ls next postcss @tailwindcss/postcss --all` | `next@16.2.10 -> postcss@8.4.31` este ramura afectată; ramurile Tailwind/shadcn folosesc `postcss@8.5.17`. |
| HTML de producție | Confirmă `<meta name="robots" content="noindex, nofollow">` și marcajele vizibile E2E/nepublicabile. |

## Confirmări focalizate ale formularului

- **`page` minimizat:** implementarea folosește exclusiv `window.location.pathname`. Testul pornește de la `/?verify=booking%20test#fragment-test`, iar toate cele trei payloaduri conțin exact `page: "/"`, fără origin, query sau hash.
- **Succes direct:** primul POST primește 201; apare `role="status"`, iar focusul este mutat pe confirmare.
- **Eroare și retry:** al doilea POST primește 500; apare `role="alert"` cu focus, iar numele, emailul și mesajul rămân completate. Reîncercarea primește 201 și confirmarea primește focus.
- **Gard pre-hidratare:** cu JavaScript dezactivat, SSR livrează `data-hydrated="false"` și `fieldset` dezactivat; `requestSubmit()` nu produce POST și nu navighează.
- **URL neschimbat:** URL-ul complet, inclusiv query și fragment, este identic înainte și după toate încercările.
- **Fără lead real:** interceptarea CDP `Fetch` corespunde exact endpointului AgenticWeb și răspunde local; sunt observate exact trei POST-uri simulate.

## Findings active

### F-001 — P1 — Poarta intenționată E2E blochează numai publicarea

- **Evidență:** `src/content.ts` declară `publishable: false` și marchează datele sintetice; `src/app/layout.tsx` setează `noindex, nofollow`; HTML-ul de producție afișează marcajele; lipsesc activele și datele reale aprobate, iar aprobarea de publicare este explicit absentă.
- **Locație:** `src/content.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, contractul de identitate.
- **Impact:** un deployment public ar expune informații sintetice și o identitate de test. Aceasta nu invalidează remedierea tehnică și este o protecție intenționată a preview-ului.
- **Criteriu de acceptare:** datele, contactele, politicile, wordmark-ul și fotografiile reale sunt furnizate și aprobate; conținutul E2E este înlocuit; există aprobare explicită de publicare; numai apoi se elimină marcajele și `noindex`.

### F-005 — P2 — PostCSS vulnerabil este inclus tranzitiv de Next

- **Evidență:** `npm audit --json` raportează GHSA-qx2v-qp2m-jg93 pentru `postcss <8.5.10`; `npm ls` arată `next@16.2.10 -> postcss@8.4.31`. Intrarea `next` din audit este efectul aceleiași dependențe, nu o a doua vulnerabilitate distinctă. Remedierea sugerată automat este downgrade major la `next@9.3.3` și nu este sigură/aplicabilă.
- **Locație:** `package-lock.json`, dependența tranzitivă `node_modules/next/node_modules/postcss`.
- **Impact:** advisory-ul privește XSS la serializarea CSS cu secvența neescapată `</style>`. Site-ul compilează CSS local la build și nu acceptă CSS neîncrezător, deci nu există o cale runtime confirmată și finding-ul nu blochează deployment-ul tehnic actual. Un pipeline viitor care ar procesa CSS neîncrezător ar putea deveni afectat.
- **Criteriu de acceptare:** actualizarea la o versiune Next compatibilă care include `postcss >=8.5.10`, urmată de lint, teste, TypeScript, build și audit; fără `npm audit fix --force` și fără downgrade major automat.

## Findings anterioare închise

- **F-002 lint:** închis; `npm run lint` trece cu ESLint flat config.
- **F-003 acoperire browser:** închis; pre-hidratarea, succesul direct, 500, focusul, păstrarea valorilor și retry 201 sunt exercitate.
- **F-004 minimizarea URL:** închis; payloadul conține numai pathname.

## Release blockers și secvență recomandată

**Blocaje tehnice:** niciunul pentru remedierea evaluată. F-005 este mentenanță neblocantă în configurația actuală.

**Porți intenționate de publicare:** F-001 rămâne activ și interzice deployment-ul public.

1. Acceptați remedierea tehnică Builder.
2. Actualizați Next/PostCSS când există o versiune compatibilă și rerulați porțile, fără force/downgrade automat.
3. Într-o etapă de build separată, înlocuiți datele, contactele, politicile și activele E2E cu variante aprobate.
4. Obțineți aprobarea explicită de publicare și abia apoi eliminați marcajele/noindex și efectuați review-ul de release.

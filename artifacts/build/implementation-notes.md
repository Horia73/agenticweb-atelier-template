# Note de implementare — prima versiune E2E

- Landing responsive cu traseu principal către `#rezervare` și structură: atelier, proces, grupă, obiecte, despre, FAQ și cerere.
- Toate textele editabile sunt în `src/content.ts`; obiectul `e2e` și comentariul de fișier marchează datele sintetice drept nepublicabile.
- Formularul este dezactivat în HTML-ul inițial până la montarea graniței client, apoi oprește submit-ul implicit și trimite câte un POST JSON per încercare către endpointul public AgenticWeb de lead. Cheia publică embed este transmisă în proprietatea canonică `key`; payloadul include sesiunea în `meta`, numai `window.location.pathname` în `page` (fără origin, query sau hash) și honeypot-ul `website`, iar URL-ul paginii rămâne neschimbat.
- Fluxul formularului are stări explicite de trimitere, succes accesibil cu focus și eroare accesibilă cu reîncercare. Datele se golesc numai după succes și rămân completate după eroare.
- Favicon-ul este furnizat local prin `src/app/icon.svg`.
- Testul browser focalizat `npm run test:booking` interceptează integral endpointul extern și simulează răspunsurile local. Verifică gardul din HTML înainte de hidratare și absența oricărui POST/navigări, succesul direct, un răspuns 500 urmat de retry 201, alerta și focusul accesibile, valorile păstrate, exact trei POST-uri pentru cele trei încercări, payloadul cu pathname minimizat și URL-ul neschimbat. Testul nu poate crea un lead real.
- Lint-ul folosește ESLint cu flat config compatibil Next.js 16 (`eslint .`), regulile Core Web Vitals și TypeScript, fără dezactivarea erorilor.
- Placeholder-ele sunt suprafețe CSS locale, neutre, etichetate cu cadrul și raportul dorit; nu reprezintă persoane, produse sau spațiul real.
- Metadata include `robots: noindex, nofollow` pentru a reduce riscul publicării accidentale a preview-ului.

## Înainte de publicare

Înlocuiește datele E2E, wordmark-ul de test și toate placeholder-ele; confirmă datele comerciale, legale și de contact; revizuiește textele de consimțământ și elimină marcajele/noindex numai după aprobarea explicită.

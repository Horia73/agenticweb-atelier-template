# Note de implementare — prima versiune E2E

- Landing responsive cu traseu principal către `#rezervare` și structură: atelier, proces, grupă, obiecte, despre, FAQ și cerere.
- Toate textele editabile sunt în `src/content.ts`; obiectul `e2e` și comentariul de fișier marchează datele sintetice drept nepublicabile.
- Formularul este dezactivat în HTML-ul inițial până la montarea graniței client, apoi oprește submit-ul implicit și trimite un singur POST JSON către endpointul public AgenticWeb de lead. Include sesiunea în `meta`, pagina curentă și honeypot-ul `website`; URL-ul paginii rămâne neschimbat.
- Fluxul formularului are stări explicite de trimitere, succes accesibil cu focus și eroare accesibilă cu reîncercare. Datele se golesc numai după succes și rămân completate după eroare.
- Favicon-ul este furnizat local prin `src/app/icon.svg`.
- Testul browser focalizat `npm run test:booking` interceptează și simulează local răspunsul endpointului extern, apoi verifică exact un POST, corpul JSON și păstrarea exactă a URL-ului. Testul nu poate crea un lead real.
- Placeholder-ele sunt suprafețe CSS locale, neutre, etichetate cu cadrul și raportul dorit; nu reprezintă persoane, produse sau spațiul real.
- Metadata include `robots: noindex, nofollow` pentru a reduce riscul publicării accidentale a preview-ului.

## Înainte de publicare

Înlocuiește datele E2E, wordmark-ul de test și toate placeholder-ele; confirmă datele comerciale, legale și de contact; revizuiește textele de consimțământ și elimină marcajele/noindex numai după aprobarea explicită.

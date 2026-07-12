# Note de implementare — prima versiune E2E

- Landing responsive cu traseu principal către `#rezervare` și structură: atelier, proces, grupă, obiecte, despre, FAQ și cerere.
- Toate textele editabile sunt în `src/content.ts`; obiectul `e2e` și comentariul de fișier marchează datele sintetice drept nepublicabile.
- Formularul oprește submit-ul implicit, golește datele local și afișează o confirmare cu focus accesibil, fără să schimbe URL-ul. Nu transmite, nu persistă date și nu folosește endpointuri AgenticWeb.
- Favicon-ul este furnizat local prin `src/app/icon.svg`.
- Placeholder-ele sunt suprafețe CSS locale, neutre, etichetate cu cadrul și raportul dorit; nu reprezintă persoane, produse sau spațiul real.
- Metadata include `robots: noindex, nofollow` pentru a reduce riscul publicării accidentale a preview-ului.

## Înainte de publicare

Înlocuiește datele E2E, wordmark-ul de test și toate placeholder-ele; confirmă datele comerciale, legale și de contact; apoi conectează formularul prin componenta oficială AgenticWeb și elimină marcajele/noindex numai după aprobarea explicită.

# Componente AgenticWeb (legate de platformă) — în lucru

Aici vor sta componentele pre-cablate la API-ul public al platformei
(`/api/embed/v1/*`, cheiate pe site key-ul clientului):

- `<LeadForm>` — formular de contact → POST `/api/embed/v1/lead` (lead-ul apare
  în dashboard-ul clientului)
- `<Chatbot>` — chat AI → `/api/embed/v1/chat` (configul din OS)
- `<BookingWidget>` — programări → `/api/embed/v1/booking` (+ availability)
- `<Reviews>` — carusel de recenzii → `/api/embed/v1/review`
- `<Catalog>` — meniu/catalog din config

Până sunt implementate: pentru formulare simple de contact folosește
componentele din `src/components/ui` (Field, Input, Button); NU inventa
integrări cu platforma — spune în răspuns că integrarea vine din componenta
oficială când va exista.

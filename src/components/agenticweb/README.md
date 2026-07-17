# Componente AgenticWeb legate de platformă

Aici vor sta componentele pre-cablate la API-ul public al platformei
(`/api/embed/v1/*`, cheiate pe site key-ul clientului):

- `<LeadForm>` — formular de contact → POST `/api/embed/v1/lead` (lead-ul apare
  în dashboard-ul clientului)
- `<Chatbot>` — implementat în `chatbot.tsx`; chat AI prin SSE, configurat din
  OS și cu ancorarea strictă a turei curente
- `<BookingWidget>` — programări → `/api/embed/v1/booking` (+ availability)
- `<Reviews>` — carusel de recenzii → `/api/embed/v1/review`
- `<Catalog>` — meniu/catalog din config

## Chatbot

Necesită `NEXT_PUBLIC_AWOS_SITE_KEY`. Componenta citește mesajul de întâmpinare
și starea modulului din `/api/embed/v1/config`, apoi trimite mesajele la
`/api/embed/v1/chat`. Nu o monta dacă AI Chatbot nu este inclus în ofertă.

```tsx
import { Chatbot } from "@/components/agenticweb/chatbot"

<Chatbot className="h-[34rem]" />
// sau varianta flotantă folosită de layout:
<ChatWidget title={site.chatbot.title} suggestions={site.chatbot.suggestions} />
```

Mesajul utilizatorului devine ancora turei și ajunge sus fără niciun pixel din
răspunsul anterior. Streamul nu forțează scroll-ul; când răspunsul continuă în
afara viewport-ului apare controlul de revenire la cel mai nou răspuns.

Pentru celelalte integrări încă neimplementate, nu inventa endpoint-uri locale:
folosește contractele `/api/embed/v1/*` documentate de platformă.

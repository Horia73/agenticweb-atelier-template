# Componente AgenticWeb legate de platformă

Aici vor sta componentele pre-cablate la API-ul public al platformei
(`/api/embed/v1/*`, cheiate pe site key-ul clientului):

- `<LeadForm>` — implementat în `lead-form.tsx`; formular de contact → POST
  `/api/embed/v1/lead` (lead-ul apare în dashboard-ul clientului), cu honeypot
  anti-bot și stări de succes/eroare accesibile
- `<Chatbot>` — implementat în `chatbot.tsx`; chat AI prin SSE, configurat din
  OS, cu ancorarea strictă a turei curente și buton de oprire a streamului
- `<BookingWidget>` — implementat în `booking-widget.tsx`; fluxul live de
  programări din OS, gata de montat în orice pagină
- `<Reviews>` — implementat în `reviews.tsx`; carusel accesibil de recenzii →
  `/api/embed/v1/review`; secțiunea dispare complet când nu există recenzii
- `<RestaurantMenu>` — implementat în `restaurant-menu.tsx`; meniu live,
  categorii și cereri de comandă în Clienți
- `<HotelBooking>` — implementat în `hotel-booking.tsx`; disponibilitate pe
  nopți și rezervări directe

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

## Programări, restaurant și cazare

Toate cele trei componente necesită `NEXT_PUBLIC_AWOS_SITE_KEY` și folosesc
suprafețele publice production-ready din OS. Datele, disponibilitatea,
protecția anti-suprapunere și mesajele rămân în platformă; site-ul păstrează
doar încadrarea vizuală.

```tsx
import { BookingWidget } from "@/components/agenticweb/booking-widget"
import { RestaurantMenu } from "@/components/agenticweb/restaurant-menu"
import { HotelBooking } from "@/components/agenticweb/hotel-booking"

<BookingWidget />
<RestaurantMenu />
<HotelBooking />
```

Pentru integrările rămase neimplementate, nu inventa endpoint-uri locale:
folosește contractele `/api/embed/v1/*` documentate de platformă.

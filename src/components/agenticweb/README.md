# Componente AgenticWeb legate de platformă

Aici vor sta componentele pre-cablate la API-ul public al platformei
(`/api/embed/v1/*`, cheiate pe site key-ul clientului):

- `<LeadForm>` — implementat în `lead-form.tsx`; kit configurabil pentru formular
  simplu sau multi-pas → POST `/api/embed/v1/lead` (cererea apare în Clienți),
  cu validare pentru câmpuri obligatorii, Înapoi/Continuă, honeypot și stări
  accesibile de încărcare/succes/eroare
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

## Formulare

Necesită `NEXT_PUBLIC_AWOS_SITE_KEY`. Formularul simplu este gata de montat și
trimite nume, email, telefon și mesaj în Clienți:

```tsx
import { LeadForm } from "@/components/agenticweb/lead-form"

<LeadForm
  channel="form:pagina-contact"
  title="Spune-ne despre proiect"
  subtitle="Câmpurile cu * sunt obligatorii."
/>
```

Pentru un flux cu Înapoi/Continuă, configurează pașii și câmpurile. Valorile
rămân completate când vizitatorul revine la pasul anterior:

```tsx
import {
  LeadForm,
  type LeadFormStep,
} from "@/components/agenticweb/lead-form"

const steps: LeadFormStep[] = [
  {
    id: "proiect",
    title: "Despre proiect",
    fields: [
      {
        name: "projectType",
        label: "Tip proiect",
        type: "select",
        required: true,
        options: [
          { label: "Site de prezentare", value: "site" },
          { label: "Magazin online", value: "shop" },
        ],
      },
      {
        name: "budget",
        label: "Buget estimat",
        type: "number",
        min: 0,
        leadField: { kind: "money", unit: "EUR", group: "Proiect" },
      },
    ],
  },
  {
    id: "contact",
    title: "Date de contact",
    description: "Îți trimitem confirmarea la această adresă.",
    fields: [
      { name: "name", label: "Nume", required: true, autoComplete: "name" },
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
        autoComplete: "email",
      },
      { name: "message", label: "Detalii", type: "textarea", rows: 5 },
    ],
  },
]

<LeadForm
  channel="form:brief"
  source="quote"
  steps={steps}
  title="Cere o ofertă"
/>
```

`name`, `email`, `phone` și `message` se mapează direct în cerere. Câmpurile
suplimentare ajung în `meta`; pentru sume, numere, unități sau rezultate folosește
`leadField`, ca OS să le afișeze corect. Păstrează numele câmpurilor unice între
pași. Dacă formularul conține email și confirmarea de lead este activată pentru
site în OS, platforma trimite automat emailul tranzacțional al site-ului după
înregistrarea cererii.

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

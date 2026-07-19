/* Conținutul site-ului, într-un singur loc — agentul îl rescrie din brieful
   clientului (nume, servicii, contact din chestionar). Pagina și componentele
   citesc DOAR de aici, ca schimbarea conținutului să nu ceară atins layout-ul. */

export const site = {
  name: "Stillroom",
  tagline: "spațiu calm pentru zile aglomerate",
  description:
    "Stillroom adună sesiunile de focus, sunetul ambiental și notițele scurte într-un spațiu calm, local și discret.",
  phone: "07xx xxx xxx",
  email: "contact@firma.ro",
  address: "Str. Exemplu 1, Oraș",
  hours: "Luni–Vineri, 9:00–18:00",

  chatbot: {
    enabled: false,
    title: "Asistent virtual",
    suggestions: [
      "Cu ce mă puteți ajuta?",
      "Cât costă serviciile?",
      "Cum pot lua legătura cu voi?",
    ],
  },

  hero: {
    eyebrow: "FOCUS, FĂRĂ ZGOMOT",
    title: "O cameră liniștită",
    titleAccent: "în mijlocul zilei tale.",
    subtitle:
      "Stillroom adună timpul, sunetul și întâlnirile într-un singur loc calm. Se deschide când ai nevoie și dispare când începi să lucrezi.",
    ctaPrimary: "Descarcă pentru Mac",
    ctaSecondary: "Vezi cum funcționează",
  },

  navigation: {
    ariaLabel: "Navigație principală",
    download: "Încearcă",
    menu: "Deschide meniul",
    menuTitle: "Navigație Stillroom",
    menuDescription: "Explorează conceptul demonstrativ.",
    items: [
      { label: "Produs", href: "#produs" },
      { label: "Povești", href: "#povesti" },
      { label: "Proces", href: "#proces" },
      { label: "Întrebări", href: "#intrebari" },
    ],
  },

  demo: {
    imageAlt: "O vale alpină acoperită de ceață, folosită drept fundal al aplicației Stillroom",
    greeting: "bună dimineața",
    time: "9:41",
    period: "AM",
    date: "duminică, 19 iulie",
    nextLabel: "urmează",
    session: "Sesiune profundă",
    sessionMeta: "în 2 min · 42 min",
    action: "Pornește",
    actionActive: "În pauză",
    battery: "87%",
    focus: "Focus",
    sound: "Ploaie blândă",
    menuLeft: "Stillroom   Fișier   Ritual   Ajutor",
    menuRight: "19:40",
  },

  manifest: {
    label: "Manifest Stillroom",
    eyebrow: "Stillroom / manifest",
    lines: [
      { text: "Mai puțină presiune.", tone: "light" },
      { text: "Mai mult ritm.", tone: "accent" },
      { text: "Spațiu pentru ce contează.", tone: "muted" },
    ],
  },

  live: {
    eyebrow: "Rămâne cu tine",
    title: "Tot ce contează, chiar la suprafață.",
    description:
      "Un semnal discret îți arată timpul, următorul moment și sunetul activ. Fără dashboard, fără zece ferestre.",
    status: "42 min · Ploaie blândă",
    cards: [
      {
        kicker: "Sesiune live",
        title: "Ritmul zilei, într-o singură privire.",
        description: "Timerul și următorul eveniment rămân aproape, fără să-ți ocupe ecranul.",
        image: "/stillroom-night-canopy.png",
        alt: "Pădure de conifere în ceață, la ceas de seară",
      },
      {
        kicker: "Jurnal scurt",
        title: "Închide sesiunea cu un singur gând.",
        description: "La final păstrezi ideea, nu o foaie de raport.",
        image: "/stillroom-orange-stone.png",
        alt: "Structură minerală ocru și chihlimbar, fotografiată macro",
      },
    ],
  },

  about: {
    eyebrow: "Mai puțin, dar mai bine",
    title: "O prezență, nu un dashboard.",
    accent: "Atât.",
    body:
      "Îți citește ziua local, pornește ritualul și apoi se retrage.",
    notes: ["Date locale", "Fără cont", "Un singur gest"],
    bento: {
      hardwareTitle: "Gândit pentru dispozitiv.",
      hardwareBody: "Calendarul, transcrierea și ritualurile rulează local. Nimic nu trebuie trimis în altă parte ca să-ți fie util.",
      mediaLabel: "Trăiește lângă tine",
      mediaAlt: "Pădure de conifere în ceață, la ceas de seară",
      activitiesValue: "3",
      activitiesLabel: "semnale esențiale",
      activitiesRows: [
        { label: "Timp și status", value: "01" },
        { label: "Sunet și focus", value: "02" },
        { label: "Întâlniri", value: "03" },
      ],
      accountsValue: "0",
      accountsLabel: "Conturi. Servere. Analytics.",
      accountsBody: "Totul se întâmplă pe Mac-ul tău. Atât.",
      clipsValue: "60",
      clipsLabel: "secunde până în ritm",
      clipsBody: "Alegi atmosfera, pornești sesiunea, iar interfața se retrage.",
      purchaseValue: "1×",
      purchaseLabel: "o singură licență",
      purchaseBody: "Plătești o dată. Fără abonament și fără o nouă relație de administrat.",
      iconLabels: ["Calendar local", "Notițe locale", "Microfon", "Întâlniri"],
    },
  },

  stories: {
    eyebrow: "Trei moduri. Același calm.",
    title: "Se schimbă odată cu ziua ta.",
    items: [
      {
        number: "01",
        title: "Tray",
        statement: "Tot ce urmează, fără să deschizi nimic.",
        description: "O suprafață mică pentru timp, sesiune și sunet — mereu la îndemână, niciodată în cale.",
        image: "/stillroom-valley.png",
        alt: "Vale alpină acoperită de ceață",
      },
      {
        number: "02",
        title: "Transcriere",
        statement: "Vorbești. Gândul rămâne.",
        description: "O notiță audio devine text local, gata de mutat unde lucrezi deja.",
        image: "/stillroom-night-canopy.png",
        alt: "Pădure întunecată de conifere, traversată de ceață",
      },
      {
        number: "03",
        title: "Întâlniri",
        statement: "Camera intră în liniște înaintea ta.",
        description: "Sunetul, statusul și agenda se așază automat cu câteva minute înainte de call.",
        image: "/stillroom-sunrise-ridge.png",
        alt: "Creastă montană la răsărit, deasupra norilor",
      },
    ],
  },

  skins: {
    eyebrow: "Atmosfere",
    title: "Aceeași funcție. Altă temperatură.",
    items: [
      { title: "Moss", meta: "verde rece · ploaie", image: "/stillroom-night-canopy.png", alt: "Pădure verde întunecată" },
      { title: "Ember", meta: "ocru cald · vinil", image: "/stillroom-orange-stone.png", alt: "Piatră ocru și chihlimbar" },
      { title: "Nocturne", meta: "indigo · aer", image: "/stillroom-cosmic-field.png", alt: "Câmp nocturn abstract cu praf luminos" },
    ],
  },

  ritual: {
    eyebrow: "Cum funcționează",
    title: "Din zgomot în ritm, în trei mișcări.",
    description:
      "Un traseu scurt, gândit să nu devină încă o rutină pe care trebuie să o întreții.",
    items: [
      { number: "01", title: "Îți citește ziua", description: "Calendarul local devine o hartă simplă a momentelor care urmează." },
      { number: "02", title: "Pregătește camera", description: "Alege durata și atmosfera; restul se așază singur." },
      { number: "03", title: "Se retrage", description: "Când începi, interfața lasă în urmă doar semnalul esențial." },
    ],
  },

  faq: {
    eyebrow: "Întrebări simple",
    title: "Înainte să intri în cameră.",
    items: [
      { question: "Stillroom trimite date în cloud?", answer: "Nu. Calendarul, notițele și transcrierile rămân pe dispozitiv, iar sincronizarea este opțională." },
      { question: "Funcționează fără calendar?", answer: "Da. Poți porni o sesiune manuală în două gesturi și păstrezi aceeași experiență simplă." },
      { question: "Pot folosi propriile sunete?", answer: "Da. Atmosferele incluse pot fi înlocuite cu fișiere locale sau cu o sursă audio deja deschisă." },
      { question: "Ce se întâmplă în timpul întâlnirilor?", answer: "Stillroom poate pregăti un mod discret de meeting și nu înregistrează nimic fără o acțiune explicită." },
    ],
  },

  pricing: {
    eyebrow: "O singură licență",
    title: "Plătești o dată. Camera rămâne a ta.",
    price: "149 lei",
    note: "Actualizări esențiale incluse. 14 zile de încercare, fără card.",
    action: "Începe perioada de probă",
  },

  closing: {
    eyebrow: "Mai aproape de liniște",
    title: "Lasă ziua să respire.",
    description: "Deschide o cameră pentru următorul lucru important. Restul poate aștepta puțin.",
    action: "Descarcă Stillroom",
    imageAlt: "Creastă montană luminată de răsărit",
  },

  footer: {
    note: "Un concept AgenticWeb pentru o aplicație care încă nu există.",
    copyright: "© 2026 Stillroom",
    imageAlt: "Atmosferă nocturnă abstractă",
    links: ["Instagram", "Are.na", "Termeni", "Confidențialitate"],
    wordmark: "Stillroom",
  },

  services: [
    {
      title: "Serviciul unu",
      description: "O propoziție care explică ce presupune și ce câștigă clientul.",
    },
    {
      title: "Serviciul doi",
      description: "O propoziție care explică ce presupune și ce câștigă clientul.",
    },
    {
      title: "Serviciul trei",
      description: "O propoziție care explică ce presupune și ce câștigă clientul.",
    },
  ],

};

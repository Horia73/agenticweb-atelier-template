/**
 * Sursa unică pentru conținutul editabil.
 * IMPORTANT: orice valoare din `e2e` este sintetică, exclusiv pentru preview și
 * trebuie înlocuită înainte de publicare. Nu reprezintă date reale ale clientului.
 */
export const site = {
  name: "Studio Ceramic",
  tagline: "Ateliere de ceramică pentru adulți în București",
  description:
    "Ateliere de ceramică pentru adulți, în grupe de maximum 8 persoane, și obiecte realizate manual în București.",
  chatbot: {
    enabled: true,
    title: "Asistent Studio Ceramic",
    suggestions: [
      "Cum decurge un atelier?",
      "Cât costă o sesiune?",
      "Cum rezerv un loc?",
    ],
  },
  previewNotice: "Preview E2E · datele marcate sunt sintetice și nu pot fi publicate",
  accessibility: { skipToContent: "Sari la conținut", mainNavigation: "Navigație principală", backToTop: "începutul paginii" },
  navigation: [
    { label: "Ateliere", href: "#ateliere" },
    { label: "Obiecte", href: "#obiecte" },
    { label: "Despre", href: "#despre" },
    { label: "Întrebări", href: "#intrebari" },
  ],
  hero: {
    eyebrow: "Ceramică modelată cu răgaz, în București",
    title: "Două ore în care lutul prinde formă.",
    subtitle:
      "Un atelier introductiv pentru adulți, într-o grupă de maximum 8 persoane. Vii cu curiozitatea; noi pregătim cadrul de lucru.",
    primaryAction: "Rezervă un loc",
    secondaryAction: "Descoperă atelierul",
    facts: ["2 ore · date E2E", "București", "Maximum 8 persoane"],
  },
  placeholders: {
    prefix: "Placeholder local",
    hero: { label: "Fotografie originală a atelierului", ratio: "16:10" },
    process: { label: "Detaliu original din proces", ratio: "4:5" },
    objects: [
      { label: "Obiect ceramic real · cadru 01", ratio: "4:5" },
      { label: "Obiect ceramic real · cadru 02", ratio: "4:5" },
      { label: "Obiect ceramic real · cadru 03", ratio: "4:5" },
    ],
  },
  workshop: {
    eyebrow: "Atelier introductiv",
    title: "Primul contact cu ceramica, pas cu pas",
    intro:
      "Structura de mai jos folosește date sintetice pentru a testa experiența de rezervare. Locurile reale și detaliile comerciale vor fi confirmate înainte de publicare.",
    details: [
      { label: "Durată", value: "2 ore" },
      { label: "Preț", value: "180 lei" },
      { label: "Tehnică", value: "Modelaj manual" },
      { label: "Grupă", value: "Maximum 8 persoane", confirmed: true },
    ],
    includesTitle: "În varianta de test sunt incluse",
    includes: ["Materiale și unelte", "Glazurare", "Două arderi", "Ridicare după aproximativ 14 zile"],
    scheduleTitle: "Program de test",
    schedule: ["Marți · 18:30", "Joi · 18:30", "Sâmbătă · 11:00"],
    e2eLabel: "Date sintetice E2E · nu publica",
  },
  process: {
    eyebrow: "Cum decurge",
    title: "De la o bucată de lut la o formă făcută de tine",
    intro: "Acest parcurs este prezentat exclusiv pentru validarea E2E a structurii site-ului.",
    steps: [
      { number: "01", title: "Modelezi", text: "Lucrezi manual o cană sau un bol, pe parcursul atelierului de test." },
      { number: "02", title: "Lăsăm piesa la atelier", text: "În scenariul E2E, piesa este glazurată și trece prin două arderi." },
      { number: "03", title: "Revii după ea", text: "Ridicarea este estimată în preview la aproximativ 14 zile." },
    ],
  },
  smallGroup: {
    number: "8",
    title: "O grupă mică, prin definiție",
    text: "Fiecare atelier are maximum 8 participanți — o limită confirmată în brieful studioului.",
  },
  objects: {
    eyebrow: "Obiecte în serii mici",
    title: "Forme pentru ritualurile de zi cu zi",
    text: "Aici vor apărea obiectele reale ale studioului, fotografiate editorial. În această etapă nu există cumpărare online, prețuri sau stoc inventat.",
  },
  about: {
    eyebrow: "Despre studio",
    title: "Un loc pentru practică, curiozitate și obiecte făcute manual",
    body: "Studio Ceramic organizează în București ateliere pentru adulți și creează obiecte ceramice în serii mici. Povestea finală a studioului și profilul instructorului vor fi completate numai cu informații și imagini aprobate.",
    testInstructor: "Ana Ceramica · profil sintetic E2E, nepublicabil",
  },
  faq: {
    eyebrow: "Întrebări frecvente",
    title: "Înainte să rezervi",
    items: [
      { question: "Am nevoie de experiență?", answer: "Atelierul este prezentat ca introductiv. Cerințele reale de participare vor fi confirmate înainte de publicare." },
      { question: "Rezervarea este confirmată imediat?", answer: "Nu. În fluxul E2E, formularul trimite o cerere, iar confirmarea ar urma ulterior pe email." },
      { question: "Ce se întâmplă cu piesa mea?", answer: "În scenariul de test, piesa este glazurată, arsă de două ori și se ridică după aproximativ 14 zile." },
      { question: "Pot veni cu un grup?", answer: "Da, brieful include ateliere private și evenimente corporate. Detaliile se stabilesc printr-o cerere separată." },
    ],
  },
  booking: {
    eyebrow: "Cerere de rezervare",
    title: "Alege o sesiune și spune-ne cum te contactăm",
    text: "Acest formular E2E trimite cererea către AgenticWeb pentru testarea fluxului de lead. Datele introduse părăsesc pagina și nu trebuie să conțină informații reale.",
    fields: { name: "Nume", email: "Email", session: "Sesiune preferată", message: "Ce ai vrea să știm? (opțional)" },
    sessionPlaceholder: "Alege o sesiune de test",
    submit: "Trimite cererea de test",
    submitting: "Se trimite…",
    successTitle: "Cererea de test a fost trimisă.",
    successText: "Am primit cererea în fluxul AgenticWeb. În scenariul E2E, confirmarea ar urma ulterior pe email.",
    errorText: "Cererea nu a putut fi trimisă.",
    errorAction: "Verifică conexiunea și încearcă din nou. Datele completate au rămas în formular.",
    retry: "Încearcă din nou",
    reset: "Reia formularul",
    privacy: "Preview nepublic: formularul transmite datele introduse către AgenticWeb. Folosește numai date de test, fără informații personale reale.",
  },
  footer: {
    note: "Versiune de construcție E2E · neaprobată pentru publicare",
    contact: "Telefonul, emailul public, Instagramul și adresa reală urmează să fie furnizate.",
  },
  e2e: {
    publishable: false,
    syntheticFields: ["preț", "program", "adresă", "proces", "instructor", "confirmare"],
  },
} as const;

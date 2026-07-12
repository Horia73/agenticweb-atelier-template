# Direcție vizuală — Studio Ceramic E2E

**Etapă:** Identitate vizuală  
**Data:** 12 iulie 2026  
**Statut:** direcție propusă pentru construcție; aprobarea clientului și activele originale lipsesc

## Rezumat

Direcția principală este **„Atelierul ca pagină vie”**: un sistem cald și editorial în care lutul, mâinile și urmele procesului au greutatea unei povești fotografice, iar informația practică rămâne foarte ușor de parcurs. Atmosfera urmărită este calmă, adultă, tactilă și primitoare — nu rustică teatral, nu infantilă și nu luxoasă în mod ostentativ.

Ideea leagă trei intrări confirmate: cerința „cald, editorial, artizanal”, paleta teracotă–crem–salvie și oferta de atelier introductiv de 2 ore în grupe de maximum 8 persoane. Conversia principală rămâne rezervarea unui loc. Obiectele în serii mici apar ca dovadă de practică și univers vizual, nu ca magazin în prima etapă.

## Intrări fixe și alegeri deschise

### Fixe din brief și research

- activitatea: ateliere de ceramică pentru adulți în București și obiecte realizate manual;
- oferta prioritară: atelier introductiv de 2 ore;
- grupa: maximum 8 persoane;
- acțiunea principală: programarea;
- paleta cerută: teracotă, crem cald, verde salvie; fără neon;
- tonul: cald, editorial și artizanal;
- prima etapă nu include ecommerce.

### Încă deschise

- nu există logo; se poate folosi temporar numele ca wordmark tipografic, fără a-l prezenta ca logo aprobat;
- nu există fotografii originale; layout-ul poate fi construit cu cadre placeholder etichetate, dar lansarea nu trebuie să simuleze spațiul cu imagini stock;
- nu sunt confirmate prețul, adresa, calendarul, tehnica, rezultatul atelierului, politica de anulare și mecanismul exact de confirmare;
- fonturile recomandate mai jos sunt o alegere de design pentru construcție, nu o preferință declarată de client.

## Direcția principală: „Atelierul ca pagină vie”

### Idee și țintă emoțională

Pagina trebuie să se simtă ca o revistă independentă despre un loc real: fotografie amplă, titluri cu ritm lent, note practice precise și detalii de material folosite cu reținere. Vizitatorul ar trebui să perceapă că experiența este accesibilă și atent organizată, fără ca designul să promită în mod neconfirmat îndrumare individuală, relaxare terapeutică sau un rezultat ceramic anume.

Semnătura vizuală este contrastul dintre:

- suprafețe crem, ample și liniștite;
- titluri serif expresive, cu măsură scurtă;
- blocuri practice compacte în verde salvie foarte deschis;
- teracotă închisă rezervată acțiunilor și reperelor importante;
- fotografie reală, decupată asimetric dar ordonat, cu detalii tactile.

### Culoare și contrast

- **Crem hârtie `#F7F0E5`** este fundalul principal. Evită albul clinic pe suprafețe mari.
- **Cărbune cald `#2C2520`** este textul principal, nu negru pur.
- **Teracotă `#91452F`** este culoarea de acțiune, pentru butoane primare, linkuri importante și accente rare.
- **Salvie pală `#DCE1D2`** susține modulele informative și separă secțiuni; nu se folosește ca text.
- **Lut pal `#E8C9B8`** poate marca citate, etichete sau detalii de proces; nu se folosește ca text.
- **Crem pe teracotă** este combinația standard pentru CTA. Focusul folosește un contur cărbune cu offset, vizibil și pe suprafețe colorate.

Contrast verificat matematic: cărbune/crem 13,32:1; teracotă/crem 5,99:1; crem/teracotă 5,99:1; cărbune/salvie 11,31:1; text secundar/crem 5,69:1. Aceste perechi trec WCAG AA pentru text normal. Alte combinații trebuie testate înainte de folosire; culoarea nu va fi singurul semnal de stare.

### Tipografie

- **Display / titluri:** `Fraunces`, încărcat prin `next/font/google`, cu fallback `Georgia, "Times New Roman", serif`. Folosire în greutăți 500–600, fără italic decorativ repetat. Axa optică implicită este suficientă; Constructorul nu trebuie să creeze efecte experimentale.
- **Text / UI:** `Manrope`, prin `next/font/google`, cu fallback `Arial, Helvetica, sans-serif`, legat la `--font-sans` conform repo-ului. Greutăți 400, 500 și 600.
- Titlurile sunt în sentence case, nu cu majuscule integrale. Corpul are 16–18 px și line-height generos. Textele lungi au maximum aproximativ 68 caractere pe rând.
- Labelurile pot fi mici, dar nu sub 12 px și nu cu tracking exagerat. Cifrele pentru dată, durată și locuri trebuie să fie ușor de scanat.

Fallback-ul păstrează contrastul serif/sans chiar dacă fonturile web nu se încarcă. Numele studioului poate apărea temporar în Fraunces 600 ca wordmark textual; nu se desenează simbol și nu se pretinde existența unei mărci aprobate.

### Spațiere, forme, borduri și profunzime

- Grilă de spațiere pe multipli de 4 px; ritmul principal folosește 8, 12, 16, 24, 32, 48, 64 și 96 px.
- Secțiunile respiră: 64–80 px vertical pe mobil și 96–144 px pe ecrane mari, în funcție de densitatea conținutului.
- Raza de bază este 10 px. Butoanele și inputurile folosesc 8 px; cardurile 12 px; imaginile editoriale pot alterna 0 și 16 px. Fără capsule omniprezente.
- Bordurile sunt de 1 px, maro-gri cald. Separatoarele lungi sunt preferate umbrelor.
- Umbra este rară, difuză și joasă, doar pentru elemente care se ridică funcțional. Cardurile obișnuite rămân plate.
- Textura, dacă este adăugată, trebuie să fie o granulare subtilă sub 4% opacitate și să nu reducă lizibilitatea. Nu se imită hârtia veche sau crăpăturile ceramice.

### Mișcare

- Mișcarea explică ierarhia, nu decorează: fade + deplasare verticală de maximum 12 px la intrarea în viewport, 220–320 ms, o singură dată.
- Hoverurile de buton și link folosesc 140–180 ms; fără bounce, parallax sau cursor personalizat.
- `prefers-reduced-motion: reduce` elimină deplasările și tranzițiile neesențiale.
- Rezervarea nu folosește animații care întârzie accesul la date, preț sau formular.

## Imagistică și art direction

Fotografia este principalul purtător de încredere. Setul recomandat înainte de publicare:

1. un cadru orizontal amplu cu spațiul și oameni reali în lucru;
2. mâini în contact cu lutul, fără pozare artificială;
3. un cadru care arată scara grupei, fără a sugera o capacitate diferită;
4. portretul persoanei care conduce atelierul, după confirmarea identității;
5. detalii de unelte, suprafețe, urme și material;
6. obiecte reale realizate în studio, cu statut descris factual;
7. intrarea sau un reper de acces, după confirmarea adresei.

Reguli de imagine:

- lumină naturală laterală, temperatură caldă neutră și tonuri de piele realiste;
- cadre observaționale, apropiate, combinate cu unul-două cadre largi care dovedesc locul;
- texturile sunt fotografiate, nu imitate prin efecte digitale grele;
- raporturi dominante 4:5, 3:2 și 16:10; crop-ul nu taie mâinile în punctele de acțiune;
- alt text factual descrie conținutul, nu atmosfera presupusă;
- nu se folosesc imagini AI sau stock pentru a reprezenta atelierul, instructorul, participanții ori produsele reale;
- până la livrarea fotografiilor, placeholder-ele trebuie să includă eticheta cadrului cerut și raportul său, fără fundaluri care pot fi confundate cu dovezi.

## Layout, ritm și conversie

- **Hero:** compoziție editorială în două zone pe desktop și o singură coloană pe mobil. Mesajul și CTA-ul preced fotografia în ordinea DOM. Titlul nu depășește aproximativ 10–12 cuvinte, iar faptele confirmate „2 ore”, „București”, „maximum 8” apar ca informație scanabilă, nu ca badge-uri decorative în exces.
- **Modulul atelierului introductiv:** cea mai densă zonă de informație și principalul punct de conversie. Include numai după confirmare preț, ce include, dată, locuri și mecanism de confirmare. CTA-ul primar este „Rezervă un loc”.
- **Poveste / proces:** alternanță între o fotografie dominantă și text scurt; dacă procesul ceramic nu este confirmat, structura rămâne placeholder, nu copy speculativ.
- **Grupa mică:** cifra 8 poate fi un reper tipografic mare, însoțită strict de formularea factuală „maximum 8 persoane”. Beneficiile presupuse nu se formulează ca promisiuni.
- **Obiecte:** galerie cu ritm de catalog editorial, secundară față de atelier; fără prețuri, stoc, butoane de cumpărare sau disponibilitate inventate.
- **CTA repetat:** după dovadă și după FAQ, nu după fiecare secțiune. CTA-ul secundar pentru grupuri private/corporate are tratament outline și verb specific.
- **Mobil:** conținutul practic vine înaintea compozițiilor decorative; țintele interactive au minimum 44 × 44 px; nu se folosesc carusele indispensabile.

Ierarhia vizuală trebuie să păstreze raportul aproximativ 70/20/10: suprafețe crem și conținut editorial / module salvie-lut / teracotă de acțiune. Acesta este un principiu de compoziție, nu o măsurătoare rigidă.

## Anti-patterns specifice

- neon, gradiente SaaS, glassmorphism, dashboard cards sau glow-uri;
- colaje cu forme blob, stropi grafici și iconuri generice de bec/inimă/pensulă;
- estetică „boho” generică, fonturi script sau simularea excesivă a imperfecțiunii;
- maro pe maro cu contrast insuficient ori salvie folosită pentru text;
- imagini stock/AI prezentate ca spațiul, echipa, participanții sau obiectele studioului;
- promisiuni vizuale sau verbale despre terapie, mindfulness, lucru la roată, glazurare ori obiectul final înainte de confirmare;
- transformarea fiecărui bloc în card rotunjit și folosirea capsulelor pentru orice informație;
- galerie de obiecte care pare ecommerce în această etapă;
- CTA-uri concurente, formular de rezervare ascuns sau „Contactează-ne” folosit în locul unei acțiuni specifice;
- text decorativ peste zone aglomerate ale fotografiei.

## Direcție de rezervă (numai dacă fotografia originală întârzie)

**„Caiet de atelier”** păstrează aceiași tokeni, tipografie și ierarhie, dar înlocuiește temporar hero-ul fotografic cu o compoziție tipografică, grilă fină și placeholder-e editoriale explicit etichetate. Poate folosi macro-fotografii autentice ale materialelor furnizate ulterior, dar nu ilustrații care pretind un proces real. Este o soluție de construcție și preview, nu recomandarea pentru publicare.

## Trasabilitatea alegerilor

| Alegere | Bază |
|---|---|
| Teracotă, crem, salvie; fără neon | cerință explicită din brief |
| Ton cald, editorial, artizanal | cerință explicită din brief |
| Fotografie reală amplă și tactilă | preferința pentru site-uri editoriale cu fotografie mare și textură naturală; implicație din research |
| Rezervarea domină ierarhia | obiectivul principal și decizia activă din research |
| „Maximum 8” ca reper vizual | fapt confirmat despre capacitate |
| Obiectele au rol editorial, nu de magazin | decizia activă: fără ecommerce în prima etapă |
| Serif display + sans funcțional | judecată de design pentru a combina voce editorială și claritate operațională |
| Borduri, profunzime redusă, mișcare discretă | judecată de design în acord cu ținta calmă și tactilă |
| Fără imagini stock/AI care simulează studioul | lipsa activelor reale și nevoia de dovezi autentice din research |

## Întrebări deschise înainte de publicare

- Aprobă clientul direcția „Atelierul ca pagină vie”, paleta și perechea tipografică?
- Care este forma exactă a numelui ce trebuie folosită în wordmark și există cerințe legale de marcă?
- Pot fi furnizate fotografiile originale din lista de cadre și acordurile necesare pentru persoanele recognoscibile?
- Care sunt prețul atelierului introductiv și elementele incluse?
- Care sunt adresa, calendarul și regulile de anulare sau reprogramare?
- Rezervarea este confirmată imediat sau este o cerere aprobată ulterior?
- Ce tehnică se folosește, ce realizează participantul și cum sunt arse, glazurate și ridicate piesele?
- Cine conduce atelierul și ce biografie factuală poate fi publicată?


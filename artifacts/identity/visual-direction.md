# Direcție vizuală — Studio Ceramic (E2E)

**Etapă:** Identitate vizuală  
**Data:** 12 iulie 2026  
**Statut:** aprobată pentru construcția și testarea E2E; nu reprezintă aprobare de publicare

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

### Aprobate pentru construcție și test

- direcția „Atelierul ca pagină vie”, paleta teracotă–crem–salvie și perechea Fraunces–Manrope;
- wordmark-ul textual de test este **„Studio Ceramic”**, compus în Fraunces 600; este o soluție aprobată pentru E2E, nu o revendicare de marcă;
- în lipsa fotografiilor originale, Constructorul folosește suprafețe grafice neutre și placeholder-e locale, etichetate ca atare; acestea nu vor inventa persoane, produse, spațiul ori drepturi asupra imaginilor;
- setul operațional sintetic documentat mai jos poate alimenta exclusiv testele și preview-ul nepublicabil.

### Încă deschise pentru publicare

- nu există fotografii originale sau acorduri pentru persoane recognoscibile;
- numele juridic/public final și eventualele cerințe de marcă nu sunt confirmate de această aprobare E2E;
- datele comerciale și operaționale reale, inclusiv politica de anulare/reprogramare, trebuie furnizate și validate;
- lipsesc domeniul, URL-ul Instagram și telefonul public.

## Set de conținut sintetic — exclusiv E2E, nepublicabil

Următoarele valori sunt date de test furnizate explicit pentru Constructor. Ele trebuie marcate în sursa de conținut și în orice preview ca **„E2E / date sintetice / nu publica”**. Nu devin fapte despre client și nu pot fi copiate într-un build public fără înlocuire și aprobare:

| Câmp de test | Valoare sintetică E2E |
|---|---|
| Atelier introductiv | 180 lei; 2 ore |
| Include | materiale, unelte, glazurare și două arderi |
| Locație | „Strada Atelierului 12, București — adresă E2E” |
| Calendar | marți și joi la 18:30; sâmbătă la 11:00 |
| Confirmare | rezervarea este o cerere confirmată ulterior pe email |
| Tehnică și rezultat | modelaj manual; participantul realizează o cană sau un bol |
| Ridicare | după aproximativ 14 zile |
| Instructor | „Ana Ceramica — profil E2E” |

Capacitatea de maximum 8 persoane și București provin din brief și rămân fapte confirmate, nu date sintetice. Constructorul trebuie să păstreze delimitarea dintre acestea și tabelul E2E.

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

Fallback-ul păstrează contrastul serif/sans chiar dacă fonturile web nu se încarcă. În test, numele apare ca wordmark textual „Studio Ceramic” în Fraunces 600; nu se desenează simbol și nu se pretinde existența unei mărci înregistrate sau aprobarea numelui pentru publicare.

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

În produsul public, fotografia originală va fi principalul purtător de încredere. Setul recomandat înainte de publicare:

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
- pentru E2E, se folosesc numai suprafețe grafice neutre/placeholder-e locale, etichetate și fără oameni, produse ori spații inventate; nu se presupun licențe sau drepturi;
- placeholder-ele includ eticheta cadrului cerut și raportul său și nu pot fi confundate cu dovezi despre studio.

## Layout, ritm și conversie

- **Hero:** compoziție editorială în două zone pe desktop și o singură coloană pe mobil. Mesajul și CTA-ul preced fotografia în ordinea DOM. Titlul nu depășește aproximativ 10–12 cuvinte, iar faptele confirmate „2 ore”, „București”, „maximum 8” apar ca informație scanabilă, nu ca badge-uri decorative în exces.
- **Modulul atelierului introductiv:** cea mai densă zonă de informație și principalul punct de conversie. În test poate afișa setul sintetic E2E de mai sus, cu marcajul nepublicabil păstrat. În public include numai date reale confirmate. CTA-ul primar este „Rezervă un loc”, iar răspunsul trebuie să spună că cererea a fost primită, nu că locul este confirmat.
- **Poveste / proces:** alternanță între o suprafață grafică neutră și text scurt în E2E. Modelajul manual, cana/bolul, glazurarea, arderile și ridicarea la aproximativ 14 zile sunt exclusiv date sintetice de test; în public, structura rămâne placeholder până la confirmarea procesului real.
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

## Mod de construcție fără fotografie originală

**„Caiet de atelier”** păstrează aceiași tokeni, tipografie și ierarhie, dar înlocuiește hero-ul fotografic cu o compoziție tipografică, grilă fină, suprafețe grafice neutre și placeholder-e editoriale locale explicit etichetate. Nu folosește ilustrații care pretind un proces real. Este modul aprobat pentru construcția E2E, nu recomandarea pentru publicare.

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
| „Studio Ceramic” în Fraunces 600 | aprobare explicită pentru wordmark-ul de test |
| Suprafețe neutre și placeholder-e locale în Constructor | instrucțiune explicită pentru E2E; nu există fotografii originale |
| Setul operațional sintetic | date furnizate explicit pentru test, marcate nepublicabile |

## Cerințe rămase înainte de publicare

- înlocuirea tuturor datelor sintetice cu date comerciale și operaționale reale, aprobate;
- confirmarea politicilor reale de anulare/reprogramare, plată, accesibilitate și protecția datelor;
- confirmarea numelui public final și a oricăror cerințe juridice/de marcă;
- fotografii originale și acordurile necesare sau o decizie editorială separată pentru o identitate publică fără fotografie;
- identitatea și biografia factuală a instructorului real;
- domeniul, URL-ul Instagram, telefonul și datele legale/publice.

# Focus Depth Gallery

Secvență focală fără WebGL: cadrul curent se ridică și descoperă următorul cadru aflat dedesubt. Ordinea stivei rămâne fixă pe toată tranziția, astfel încât nu există schimbări de `z-index`, intercalări de text sau blur animat.

## Instalare și exemplu

```bash
npx shadcn@latest add ./public/r/depth-gallery.json
```

```tsx
<DepthGallery
  label="Selecție de proiecte"
  stackOffset={7}
  exitTravel={112}
  items={projects.map((project) => ({
    id: project.id,
    label: project.title,
    eyebrow: project.category,
    title: project.title,
    description: project.summary,
    content: <ProjectImage project={project} />,
  }))}
/>
```

Pe desktop stage-ul rămâne sticky, iar scroll-ul vertical ridică cadrul activ și aduce următorul cadru de dedesubt. Caption-ul vechi dispare devreme, iar cel nou apare abia după ce takeover-ul este aproape complet. `stackOffset` controlează cât din cadrele următoare se vede în stivă, iar `exitTravel` cât de departe pleacă cadrul curent. Scroll-ul înapoi inversează natural aceeași tranziție.

Pe pointer coarse, mobil sau reduced motion, componenta devine un rail cu swipe și snap. Item-urile rămân conținut React normal.

## Personalizare obligatorie pentru AI

- construiește o succesiune cu motiv clar și 3–6 cadre distincte; `depth` ajustează distanța de recul, nu definește un grid aleator;
- personalizează crop-uri, overlay, metadata, spațiere și starea mobilă;
- nu schimba ordinea stivei în timpul tranziției și nu anima blur-ul; cadrul anterior trebuie să descopere fizic următorul cadru;
- verifică tab order, swipe, overflow, imagini portrait/landscape și resize;
- respinge dacă toate item-urile au aceeași adâncime, transformările taie conținutul sau o grilă statică ar fi mai clară.

Recomandat 3–7 item-uri vizibile și imagini responsive; evită blur-urile animate.

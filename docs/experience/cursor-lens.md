# CursorLens

Lentilă de reveal într-o zonă delimitată. Nu desenează un punct în centrul cursorului și nu înlocuiește cursorul în restul paginii.

## Folosește / evită

Folosește-o când două stări perfect aliniate comunică o diferență reală: material, tratament, raze X, strat informațional. Evită-o pentru decor fără sens, pe suprafețe mici sau când starea secundară conține singurul text important.

## Instalare

```bash
npx shadcn@latest add ./public/r/cursor-ambient.json
```

## Exemplu editabil

```tsx
<CursorLens
  label="Descoperă structura materialului"
  cursorLabel="DETAIL"
  lensSize={220}
  base={<Image alt="" src="/base.webp" fill sizes="100vw" />}
  reveal={<Image alt="" src="/detail.webp" fill sizes="100vw" />}
>
  <h2 data-cursor-label="EXPLORE">Materialul contează.</h2>
</CursorLens>
```

Asset-urile trebuie să aibă același crop și aceeași rezoluție. Pe touch sau reduced motion rămâne starea `base`; informația esențială trebuie să existe și în conținut normal.

## Personalizare obligatorie pentru AI

- schimbă ambele asset-uri, copy-ul, dimensiunea lentilei, contrastul și etichetele;
- verifică marginile canvasului, scroll-ul paginii și pointer stationar în timp ce secțiunea intră sub cursor;
- nu adăuga dot, trail global sau cursor custom fără o justificare aprobată;
- respinge componenta dacă stările nu sunt perfect aliniate sau reveal-ul este doar decorativ.

Buget recomandat: două imagini responsive, maximum 1 MB combinat pentru primul viewport; evită blur-uri full-screen animate.

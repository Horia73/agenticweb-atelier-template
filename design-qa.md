# Design QA — Experience primitives

Final result: **passed**

The supplied Mostar recording was treated as a behavioral reference for real
2.5D occlusion and scroll choreography, not as a visual template to clone.
The implementation deliberately changes the art direction while preserving the
important mechanism: independently moving raster plates, text placed at
different depths, foreground occlusion, and a native vertical scroll timeline.

## Comparison pass

- Combined reference / implementation:
  `output/browser/comparison-reference-implementation.jpg`
- Desktop states:
  `output/browser/depth-desktop-top.png`,
  `output/browser/depth-desktop-rear-text.png`,
  `output/browser/depth-desktop-mid.png`
- Mobile states:
  `output/browser/depth-mobile-top.png`,
  `output/browser/depth-mobile-mid.png`
- Reduced-motion fallback:
  `output/browser/depth-reduced-motion.png`

## Surfaces checked

- Typography: both editable text planes remain legible, use deliberate display
  scale and tracking, and crossfade instead of competing at the same moment.
- Layout and spacing: desktop text keeps a perspective-safe inset; the mobile
  timeline uses its own composition and does not crop the primary copy.
- Color and contrast: the darkened background plate protects white copy while
  the bridge and foreground retain enough local contrast to read as separate
  planes.
- Image quality: background, midground, and foreground are separate files. The
  two cutouts have real alpha and showed no visible magenta residue, hard halo,
  or uncovered hole in the checked frames.
- Copy: playground labels explain the primitive without pretending to be client
  content. The installation contract explicitly rejects reusing this copy or
  these assets unchanged in a generated site.
- Responsiveness: checked at 1440x1000 and 390x844. No document-level horizontal
  overflow was present; desktop and mobile timelines remount independently at
  the breakpoint.
- Behavior: checked beginning, rear-text, front-text, and exit moments. Pointer
  motion changes layer transforms; the horizontal rail moves only in response
  to native vertical scroll; CursorLens activates on pointer movement even when
  scrolling places the component underneath a stationary pointer.
- Accessibility: semantic section labels are present, meaningful text remains in
  the accessibility tree, visual raster plates are decorative, touch disables
  pointer-only effects, and `prefers-reduced-motion` renders a static one-screen
  scene.
- Runtime: clean browser load produced no warning or error logs.

## Intentional differences from the recording

- The reference uses a serif editorial direction and a bridge that becomes an
  architectural frame. The playground uses a neutral sans direction and shows
  two text-depth strategies so the primitive's range is easier to inspect.
- The generated scene is an example asset set, not a bundled site theme. Client
  generation must supply approved, project-specific plates, crop, copy,
  keyframes, mobile composition, and performance budget.

No blocking or high-severity visual findings remain.

---

# Design QA — Stillroom story prototype

The 38-second source recording was used for motion vocabulary and pacing. The
provided desktop screenshot was used as the direct structural reference for the
editorial bento section. The implementation keeps the reference's hierarchy,
asymmetry, large statement, mixed card weights and red-orange accent while using
Stillroom-specific copy and generated imagery.

## Comparison pass

- Side-by-side reference / implementation at the same desktop state:
  `output/browser/comparison-bento.png`
- Organic black handoff:
  `output/browser/story-transition.png`,
  `output/browser/story-black-text.png`
- Expanding live image:
  `output/browser/story-live-start.png`,
  `output/browser/story-live-mid-final.png`
- Bento and post-rail continuation:
  `output/browser/story-bento-top.png`,
  `output/browser/story-atmospheres-final.png`
- Mobile story states:
  `output/browser/story-mobile-top-final.png`,
  `output/browser/story-mobile-black.png`,
  `output/browser/story-mobile-live.png`,
  `output/browser/story-mobile-bento.png`

## Surfaces checked

- Story: the product frame appears once and remains fixed in size; the dark
  scene begins only after the hero, and its manifest copy enters after the dark
  layer has taken over.
- Motion: the black layer rises from below with an irregular feathered seam; the
  live image expands from the right until it replaces the copy plane; the
  horizontal story rail returns into an asymmetric editorial mosaic.
- Reference fidelity: the bento preserves the source's large preface, three
  primary cards, utility-tile cluster, numeric cards, mixed black/white/accent
  surfaces and dense but calm rhythm without copying the source product.
- Responsiveness: verified at 390, 768 and 1440 px. No document-level horizontal
  overflow was present and the product frame remained unique at every width.
- Reduced motion: the handoff and expanding-image sequence resolve to semantic
  linear sections; the animated desktop stage is not displayed.
- Accessibility: images have meaningful Romanian alternatives, decorative
  layers are hidden, navigation and controls retain accessible names, and
  interactive primitives remain in the canonical UI layer.
- Runtime: browser load, responsive checks and reduced-motion checks completed
  without blocking layout or behavior findings.

final result: passed

---

# Design QA — Stillroom clean handoffs și final full-bleed

## Evidence

- Source visual truth: cele patru capturi furnizate în cererea curentă:
  `Screenshot 2026-07-19 at 22.56.42.png`,
  `Screenshot 2026-07-19 at 22.56.58.png`,
  `Screenshot 2026-07-19 at 22.57.12.png` și
  `Screenshot 2026-07-19 at 22.57.28.png`.
- Browser-rendered implementation: `output/browser/current-about-transition-1440.png`,
  `output/browser/current-stories-transition-1440.png`,
  `output/browser/current-process-transition-1440.png`,
  `output/browser/current-closing-transition-1440.png` și
  `output/browser/current-footer-fullbleed-1440.png`.
- Full-view combined comparisons: `output/browser/current-compare-about.png`,
  `output/browser/current-compare-stories.png`,
  `output/browser/current-compare-process.png` și
  `output/browser/current-compare-closing.png`.
- Responsive evidence: `output/browser/current-closing-transition-768.png` și
  `output/browser/current-closing-transition-390.png`.
- Viewports: 1440 × 900, 768 × 1024 și 390 × 844.
- State: Live → About, About → Stories, Atmospheres → Process și closing image → star field.

## Comparison history

- [P2] Cele trei treceri editoriale aveau măști albe lungi care citeau ca o
  ceață peste conținut. Au fost eliminate măștile, marginile negative și
  runway-ul intermediar; capitolele folosesc acum tăieturi curate, cu spațiu
  intern aparținând secțiunii următoare. Dovezi post-fix: primele trei
  comparații combinate.
- [P2] Câmpul de stele era încadrat într-un card rotunjit și separat de imaginea
  de final. A fost refăcut full-bleed, fără container sau colțuri, și suprapus
  peste creastă cu o mască alfa întunecată. Prima versiune a suprapunerii lăsa
  un separator orizontal când se termina fotografia; overlap-ul a fost extins
  până când masca ajunge complet opacă înainte de capătul scenei. Dovezi
  post-fix: `current-compare-closing.png` și cele trei capturi responsive.

## Required fidelity surfaces

- Fonts and typography: ierarhia, wrapping-ul, tracking-ul și contrastul
  editorial rămân neschimbate; tranzițiile nu mai suprapun wash-uri peste text.
- Spacing and layout rhythm: cele trei capitole au limite curate și padding
  propriu; finalul trece continuu din creastă în stele fără gap, card sau bandă.
- Colors and tokens: hârtia caldă, negrul scenei și cele două shade-uri de footer
  rămân tokenizate în tema globală; dissolve-ul folosește numai alfa întunecată,
  fără alb.
- Image quality: stelele folosesc rasterul original optimizat, acum la lățimea
  completă a viewport-ului, cu `object-cover` și fără scalare artificială sau
  substitut CSS/SVG.
- Copy and content: textul românesc și ordinea poveștii nu au fost schimbate în
  această corecție.
- Responsiveness: nu există overflow orizontal la 390, 768 sau 1440 px; overlap-ul
  final rămâne complet înainte de capătul fotografiei la toate cele trei
  viewport-uri.
- Accessibility and reduced motion: imaginile păstrează textele alternative,
  structura semantică nu s-a schimbat, iar Reduce Motion afișează scenele statice
  și ascunde variantele pinned.
- Runtime: scroll-ul principal și tranzițiile responsive au fost verificate în
  browser; consola a fost verificată și nu conține erori. Singurele warning-uri
  de development sunt notificări LCP produse de saltul direct la imaginile
  below-the-fold în timpul capturii. Niciun P0, P1 sau P2 vizual nu mai rămâne.

Focused-region comparison was required because the unwanted masks and the
closing dissolve are not legible in a single full-page screenshot.

final result: passed

---

# Design QA — Stillroom production polish

## Evidence

- Source visual truth: `/var/folders/vt/80tq8ym938s7qx5c495ygrjr0000gn/T/TemporaryItems/NSIRD_screencaptureui_lEfnxs/Screenshot 2026-07-19 at 22.35.25.png`
- Motion source truth: `/Users/horia/Desktop/Screen Recording 2026-07-19 at 19.40.20.mov`
- Browser-rendered implementation: `output/browser/polish-release-2048x498-final.png`
- Full-view combined comparison: `output/browser/polish-transition-comparison.png`
- Focused Mac → black states: `output/browser/polish-final-mac.png`, `output/browser/polish-final-black-full.png`, `output/browser/polish-final-text-entry.png`, `output/browser/polish-final-text-complete.png`
- Focused atmosphere and pricing states: `output/browser/polish-atmosphere-exact-0.png`, `output/browser/polish-atmosphere-exact-1.png`, `output/browser/polish-final-atmosphere-third.png`, `output/browser/polish-final-pricing.png`
- Responsive and reduced-motion evidence: `output/browser/polish-mobile-transition.png`, `output/browser/polish-tablet-black.png`, `output/browser/polish-reduced-motion.png`
- Viewports: 2048 × 498 for the direct supplied-screenshot comparison; 1440 × 900, 768 × 1024 and 390 × 844 for behavior and responsive checks.
- State: pinned product takeover, delayed manifest text, all three atmosphere width states, atmosphere → process release, centered license card.

## Comparison history

- [P1] The Mac previously left the viewport while the black scene entered. Fixed by moving the single product frame into the pinned takeover stage; it now keeps identical size and position while the organic black layer rises over it. Post-fix evidence: `polish-final-mac.png`, `polish-final-black-full.png`.
- [P2] Manifest text could appear before the scene was fully black and moved vertically. Fixed with a hard timing gate after the complete takeover, horizontal offsets, and a gray-to-final-color crossfade. Post-fix evidence: `polish-final-black-full.png`, `polish-final-text-entry.png`, `polish-final-text-complete.png`.
- [P2] The atmosphere sequence ended with the second image wide. Fixed with a three-phase scroll timeline: Moss → Ember → Nocturne. Post-fix evidence: the three focused atmosphere captures above.
- [P2] The white blur covered atmosphere captions and made the section boundary feel abrupt. Fixed by removing the overlapping negative-margin wash and placing a longer token-driven release runway after the image stage. A one-pixel scene overlap removes the residual seam. Post-fix evidence: `polish-release-2048x498-final.png` and the combined comparison.
- [P2] The license card was aligned to the right and its contents were left-biased. Fixed by centering the vertical card, its copy, price and action. Post-fix evidence: `polish-final-pricing.png`.
- [P2] The decorative product vignette intercepted the session control. Fixed by making the vignette pointer-transparent while preserving the visual shade; the React state handler and FAQ disclosure were exercised in the browser.

## Required fidelity surfaces

- Fonts and typography: hierarchy, tracking, wrapping and optical weight remain consistent; the manifest transition is now sharp and legible while moving horizontally.
- Spacing and layout rhythm: the product frame stays fixed, the dark takeover has a complete hold before copy, the lower image scene releases before the process content begins, and the price card is optically centered.
- Colors and tokens: black, muted gray, warm coral, paper white and the release gradient continue to resolve through project tokens rather than component-local colors.
- Image quality: all product and atmosphere visuals remain real optimized raster assets with stable cover crops; no placeholder, SVG approximation or CSS-drawn asset was introduced.
- Copy and content: Romanian labels and concise Stillroom narrative remain unchanged and readable at all tested widths.
- Responsiveness: one device frame and no document-level horizontal overflow at 390, 768 and 1440 px. Tablet keeps the pinned takeover; mobile and reduced motion use the semantic linear story.
- Accessibility and interaction: navigation, accordion, CTA controls and the product state button retain semantic controls and focus behavior; reduced motion disables pinned atmosphere motion and renders complete content.
- Runtime: browser runtime-event buffer was empty after reload and interaction checks; type, lint, UI policy, experience catalog, registry and production build checks passed.

No actionable P0, P1 or P2 finding remains. Focused crops were necessary because the scroll timing, caption boundary and price alignment are not readable in a single full-page frame.

final result: passed

---

# Design QA — Stillroom refinement pass

## Evidence

- Source visual truth: `/var/folders/vt/80tq8ym938s7qx5c495ygrjr0000gn/T/TemporaryItems/NSIRD_screencaptureui_28Z2hG/Screenshot 2026-07-19 at 21.37.30.png`
- Motion source truth: `/Users/horia/Desktop/Screen Recording 2026-07-19 at 19.40.20.mov`
- Source motion contact sheet: `/Users/horia/.codex/visualizations/2026/07/19/019f7b41-3fac-70a0-9f48-fed16b1264c3/video-audit-38s/contact-10-19.png`
- Implementation screenshot: `output/browser/refine-transition-reference-2048.png`
- Full-view comparison: `output/browser/refine-transition-comparison.png`
- Focused motion states: `output/browser/refine-black-seam.png`, `output/browser/refine-text-arrival.png`, `output/browser/refine-atmosphere-start.png`, `output/browser/refine-atmosphere-mid.png`
- Viewport: 2048 × 420 for the direct transition comparison; 1440 × 900 for motion and component states.
- State: lower license-card → cinematic image handoff, plus the Mac → black manifest and atmosphere-width scroll states.

## Comparison history

- [P1] Dead white travel and delayed manifest copy. The previous handoff required a second scroll phase after the black field became complete. Fixed by overlapping the black scene with the bottom of the Mac, tying progress to section entry, shortening the scene, and staging three short lines immediately after full black. Post-fix evidence: `refine-black-seam.png`, `refine-text-arrival.png`.
- [P2] Notch-shaped UI repeated inside the Mac. Fixed by moving the product status into a detached bottom tray while keeping one fixed-size device frame. Post-fix evidence: `refine-mobile-top.png` and the live desktop route.
- [P2] Overscaled editorial copy and bento modules. Fixed by shortening the statement, separating its supporting sentence, reducing grid rows, padding, radii and numeric scale. Post-fix evidence: `refine-about.png`, `refine-bento.png`.
- [P2] Static atmosphere mosaic. Fixed with one scroll-pinned row where the first image contracts while the second inherits its width; mobile, tablet and reduced motion keep a static three-image composition. Post-fix evidence: `refine-atmosphere-start.png`, `refine-atmosphere-mid.png`.
- [P2] Hard lower-page seam and horizontal pricing block. Fixed with a vertical license card and a masked photographic handoff that dissolves the warm surface into the image. The supplied reference and implementation are shown together in `refine-transition-comparison.png`.
- [P2] Footer wordmark was optically too bright. Fixed with a low-contrast scene token and restrained shadow depth. Post-fix evidence: `refine-footer.png`.

## Required fidelity surfaces

- Fonts and typography: the condensed sans/editorial pairing is preserved; long headings were shortened and rewrapped, black-scene lines use a controlled three-step hierarchy, and small labels retain readable tracking.
- Spacing and layout rhythm: the Mac ends directly at the black scene, bento density is reduced, the license card is vertical, and light/dark section changes use overlap and feathering instead of straight separators.
- Colors and tokens: coral remains the only warm accent; black, warm paper, muted text and footer shadow all resolve through project tokens.
- Image quality: all Stillroom media remains raster imagery with deliberate cover crops. The closing photo now participates in the transition instead of sitting below a black divider.
- Copy and content: the manifest and product statement are materially shorter while preserving the local, quiet-product story.
- Responsiveness and accessibility: verified without document overflow at 390, 768 and 1440 px. Reduced motion renders static semantic black, live-media and atmosphere sections; the device frame remains unique.
- Interaction: primary navigation, accordion, product session control, vertical-scroll horizontal rail, live image expansion and atmosphere width exchange remain functional.

No actionable P0, P1 or P2 finding remains in this pass.

final result: passed

---
name: experience-primitives
description: Select, install, customize, and verify the reusable experience mechanics in this template. Use when a Studio site needs a distinctive motion or interaction direction, when editing files under src/components/experience, when installing an item from registry.json, or when preparing 2.5D, ImageGen, or real-time 3D assets. Enforces brief-led art direction, exact asset gates, accessible fallbacks, and production QA instead of copying the Experience Lab.
---

# Experience Primitives

Use the registry as a behavior library, never as a website template. The result must inherit its content, pacing, visual language, and hierarchy from the approved client direction.

## Required Workflow

1. Read `studio.template.json`, `EXPERIENCE_REGISTRY.md`, and `registry.json`.
2. Confirm the selected client direction. During design exploration present exactly two coherent directions; do not select mechanics before the brief has a narrative reason for them.
3. Pick at most one signature mechanic and up to two supporting mechanics. Prefer no special mechanic when it does not improve comprehension, emotion, or proof.
4. Read the selected item's complete mini-tutorial in `docs/experience/` before editing or installing it.
5. Pass the asset gate. Do not simulate missing depth assets by duplicating one photo, using approximate masks, or adding arbitrary parallax. For `layered-depth`, `depth-camera-scene` or `cinematic-world-scene`, read [references/depth-production.md](references/depth-production.md) completely. For `cinematic-forest-3d` or another real-time 3D world, read [references/cinematic-3d-production.md](references/cinematic-3d-production.md) completely.
6. Import the component directly from `@/components/experience/<file>`. Keep shadcn primitives in `src/components/ui` and compose them into the experience; do not rebuild Button, Dialog, form, or focus behavior inside a mechanic.
7. Personalize the component's content, assets, crop, timing, ranges, tokens, mobile behavior, and reduced-motion result. The lab's car, Adriatic copy, colors, layout, and timings are QA fixtures and are forbidden in client output.
8. Keep semantic content in React/HTML. Rasterize only photography, texture, rendered objects, or atmosphere. Never bake required headings or CTA labels into an image.
9. Test the component in the real page architecture, not only `/experience-lab`.

## Production Gates

Reject the implementation until all relevant statements are true:

- The mechanic has a one-sentence purpose tied to the brief.
- Assets are client-approved or generated for this project and have documented rights/provenance.
- Desktop and mobile art direction are deliberate; mobile is not merely a squeezed desktop scene.
- `prefers-reduced-motion`, touch/coarse pointer, keyboard, focus, and 200% zoom have usable outcomes.
- A plain-content path still communicates the message if motion or media fails.
- Full-screen media has stable dimensions, responsive delivery, and a declared byte budget.
- No custom cursor hides the native cursor; proximity effects remain bounded to their field.
- The neutral `[data-studio-seed]` root has been replaced before a client build is called complete.

## Mechanic-Specific Rules

- `cinematic-forest-3d`: this is real-time 3D, never 2.5D. Build one coherent ecosystem from licensed geometry, PBR ground, vegetation, lighting and an environment capture; keep every root grounded and every species/light decision plausible together. Use real loading progress, a camera safety corridor, world-space occlusion for 3D copy, a poster fallback and an explicit desktop byte budget. The Lab forest is a QA fixture: Studio must replace its world, camera, copy and art direction rather than shipping it as a theme.
- `layered-depth`: classify it as Basic 2.5D. Prefer an integrated master plus the exact full-canvas hero occlusion matte, with identical transforms and a static composite QA image.
- `depth-camera-scene`: P0 Advanced requires either a sequentially registered 00–50 stack or an inspected focus-handoff stack (`world A`, `world B`, persistent continuity plate, dedicated trimmed high-res occluders, contact, manifest). A focus handoff may create massive perceived zoom only while the focal plane occludes a blurred world swap; never upscale one wide raster for the whole move. Require readable semantic occlusion and checkpoint QA. A desktop-only study is not a complete client delivery until its separate mobile direction exists.
- `cinematic-world-scene`: use only when P0 also needs at least two semantic depth beats and a final local `HorizontalTrack` controller. Never copy its fixture or nest `HorizontalStoryRail` inside it.
- `spatial-product-stage`: choose registered raster plates, meaningful editable primitives or named GLB nodes; define exact assembly, hover/scroll/hybrid driver, mobile anchor and static fallback.
- `liquid-glass`: keep semantic links/focus and verify contrast over every live background state; customize tint, radius, blur and density.
- `shader-field`: keep WebGL bounded, cap DPR, pause offscreen and provide a project-specific static fallback with stable text contrast.
- `media-portal`: one forward phase opens and remains open; only actual reverse-scroll closes it. Keep media controls inside the media layer.
- `portal-crossing`: at rest only the origin photo is visible — the portal arrives from far in the deep on scroll, never pre-opened, and the cursor never influences the scene. The destination must be a genuinely different world (palette, light, subject); the rim wears both worlds split at its crest (inner half destination, outer half origin), and the destination asset must survive the ~1.15x arrival magnification. One portal per page; verify reverse scroll re-masks the aperture cleanly and that reduced motion / no-WebGL shows the destination poster with readable arrival content.
- `spatial-gallery`: hide planes before the camera reaches them, keep caption/image state deterministic and ship a complete native mobile/reduced rail.
- `mesh-transition`: require one clean seam, exact endpoints, overscan without black edges, natural reverse and a static fallback.
- `horizontal-story-rail`: preserve vertical wheel/trackpad input; horizontal movement is output, never a hidden horizontal scrollbar trap.
- `horizontal-track`: treat it as controlled infrastructure inside an approved recipe, not as a standalone client direction. The parent owns progress, reduced-motion policy and interaction controls.
- `sticky-story`: the desktop stage stays fixed while states crossfade; use multiple 2–4 chapter groups to alternate visual side instead of hard-coding a page layout.
- `mask-reveal` and `expanding-media`: use one monotonic reveal/expand phase that stays complete while scrolling farther down and reverses only when the user actually scrolls back through its range. `playback="scrub"` is the default; use `commit` only when reversal must be disabled entirely.
- `kinetic-type`: production uses art-directed `segments`; automatic split is a fallback, not the final design.
- `before-after`: require registered images and preserve the native range input even when replacing the handle icon.
- `depth-gallery`: build a clear focus sequence of 3–6 frames, not a random parallax grid. Keep a deterministic stack: the current frame lifts away to reveal the next frame below; never swap z-order or overlap two captions mid-transition.
- `cursor-magnetic`: tune radius and strength per important target; keep the native cursor and a static touch/reduced-motion state.
- `refractive-glass`: use one image-aware lens for a narrative reason, preserve the native cursor, keep refraction restrained and provide the correct mobile crop/static result.
- `product-orbit`: ship an optimized GLB and poster, map semantic hotspots in model coordinates, preserve page-wheel behavior and verify drag plus keyboard rotation.
- `particle-assembly`: require a clean transparent/high-contrast target, cap particle count, and make the complete object available when motion or WebGL is unavailable.
- `typography-depth-tunnel`: keep every phrase semantic, short and independently art-directed; narrow/reduced output must become a normal readable sequence.
- `spatial-canvas`: use only for intentionally non-linear content; give keyboard and explicit controls equal capability and never consume ordinary page-wheel input.
- `volumetric-light-stage`: start from a strong clean image, tune each emitter to the composition and test copy contrast across the full light cycle.
- `slice-recompose`: use one high-resolution registered source and verify that the assembled endpoint has no seams, gaps or crop mismatch.
- `film-strip-3d`: use 3–7 frames when simultaneous context matters, keep several frames deliberately visible and ship the native snap fallback.
- `elastic-image-grid`: keep travel bounded, preserve layout and the native cursor, and disable deformation on coarse pointer and reduced motion.
- `fluid-surface`: bound the effect to one image, keep the native cursor, avoid required actions in heavily distorted areas and provide a static touch state.
- `scene-handoff`: both live React endpoints must be complete compositions; maintain one clean seam, exact endpoints, natural reverse and a linear reduced-motion result.
- `reveal-stagger`: choreograph moments, not every block; keep staggers under ~120ms and remember SSR/reduced motion render the final state, so nothing may depend on the animation to be readable.
- `count-up`: the final value is the server-rendered content and accessible name; keep durations under ~2s, use `tabular-nums`, and verify formatted decimals never flash impossible precision.
- `hover-preview-list`: rows stay real links with their own focus styles; the floating panel is decorative and pointer-events-none, and touch needs a deliberate inline-media or self-sufficient row layout.
- `text-scramble`: short strings only, in mono/uppercase treatments; match `charset` to the language and finish the decode in about a second.
- `spotlight-grid`: cards keep a visible resting border and their own contrast; the spotlight is an accent that disappears entirely on touch and reduced motion.
- `scroll-stack`: cards must be tall enough to justify pinning, the last card never transforms, and reduced motion gets a plain list with identical order.
- `knockout-text`: a pinned four-beat sequence (dark → type → fill → camera through the letters); heavy tight type over a tonally coherent fill, a composed takeover endpoint at both breakpoints, and copy that survives 200% zoom via clamp().
- `intro-loader`: once per session and under ~2.5s for the intro, tied to real document readiness with a hard cap; use `active`/`progress` only for genuinely measurable loading, never faked; repeat visitors and reduced motion skip entirely and `onComplete` still fires.
- `ambient-particles`: purely decorative atmosphere with an enforced budget (sprite rendering, depth bands, edge fade at section borders); never attach meaning to particles and keep copy contrast intact over the layer.
- `split-flap`: monospaced/tabular type, every displayed character present on the wheel, short boards only, and `padTo` for changing content so the layout never reflows.

## Verification

Run:

```bash
npm run typecheck
npm run lint
npm run registry:build
```

Then verify the real page and the selected lab fixture at 390, 768, and 1440 px. Exercise wheel/trackpad, touch fallback, keyboard, resize, route transitions, reduced motion, slow media, and scrolling slightly backward after one-way effects complete.

Record in the implementation handoff:

- selected signature/support mechanics and their brief rationale;
- exact files and assets personalized;
- desktop/mobile/reduced-motion behavior;
- bytes or frame count for heavy media;
- checks run and any deliberate exceptions.

## Completion

Work is complete only when the client page no longer contains the Studio seed, no Experience Lab fixture appears in production, every selected mechanic passes its mini-tutorial gates, and the type, UI, registry, production-build, and browser checks pass.

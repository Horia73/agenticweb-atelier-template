# Production 2.5D Asset Workflow

Read this reference before implementing `ScrollDepthScene`, `DepthCameraScene` or `CinematicWorldScene`. A runtime can animate correct plates; it cannot repair unrelated cameras, broken alpha or missing surface contact.

## Preferred ImageGen Workflow: Background First

1. Generate the clean environment without the hero object. Approve composition, lens, horizon, lighting, crop, and negative space first.
2. Lock that exact image as the registered background. Do not regenerate it after approval.
3. Edit the exact background with ImageGen to insert one object. Ask it to preserve camera, crop, surface, lighting direction, and every untouched pixel as closely as possible.
4. Immediately extract that object from the edited composite into a full-canvas alpha plate. Keep the original pixel coordinates and canvas size; never trim and re-center the subject.
5. Extract or recreate the object's contact shadow/reflection as a separate full-canvas alpha plate. Contact can include tire shadows, foot shadows, glass reflection, water displacement, bounced light, or local ambient occlusion.
6. Composite `background + contact + subject` at zero transform and inspect it at 100%. Reject floating edges, bright halos, doubled texture, changed perspective, or a shadow that points against the scene lighting.
7. For another object, edit the latest registered composite, extract the new object and its contact immediately, then preserve the prior approved plates. Do not ask ImageGen for one final image and attempt to recover many overlapping objects afterward.

This workflow creates real parallax because every inserted object shares one camera and one surface with the background. An ImageGen edit is still probabilistic: registration must be proven by the zero-transform composite, not assumed from the prompt.

## Subject-First Fallback

Use subject-first only when exact product/character identity matters more than the environment:

1. Approve the subject on a simple or removable setting.
2. Generate or extend the environment around the exact subject frame without moving or relighting it.
3. Segment subject and contact plate at full canvas size.
4. Inpaint the subject area to create the background.
5. Validate the same zero-transform composite.

If inpainting invents a visibly different surface under the subject, return to background-first or use a designed-layer treatment instead of pretending it is photographic 2.5D.

## Required Plate Order

Use only the layers the scene needs, in this order:

1. background;
2. rear atmosphere or rear text;
3. contact shadow/reflection paired to the subject;
4. subject or midground object;
5. additional registered contact/object pairs;
6. foreground occluder;
7. front text or permanent UI overlay.

For a full parallax shot, use the stable full-canvas naming stack `00-sky`, `10-landscape`, `20-midground`, `30-hero`, `40-foreground-left`, `41-foreground-right`, `50-edge-frame`. Derive these plates from one approved composite and one camera. Never generate the numbered files independently.

## Integrated Master + Occlusion Matte

Use this mode when the required effect is camera zoom plus editable text passing behind a photographed/generated object and perfect grounding matters more than independent object parallax:

1. Render the complete with-object master as the base. Its contact, reflection and local color remain untouched.
2. Place editable rear text over that master.
3. Repeat the hero alpha cutout from the exact same master above the text as an occlusion matte.
4. Give master and matte identical camera transforms, transform origin, filters and pointer response.

With no text crossing the hero, the matte repeats identical pixels and is visually undetectable. When text crosses it, only the object-shaped pixels cover the text. This avoids reconstructing the photo from an AI-edited background and a tight cutout. Declare `mode: "integrated-occlusion"`.

Classify this as 2.5D Basic even when the composition is premium: integrated master, oversized semantic type behind the hero, the registered occlusion matte, and at most a separate foreground splash/reflection. Reserve Advanced for a complete designed-layer world with multiple narrative beats. When Advanced ends with a catalog inside the same stage, use the controlled `HorizontalTrack`; never nest `HorizontalStoryRail` and a second sticky scroll section.

For Advanced install `DepthCameraScene`; add `CinematicWorldScene` only when the same world also contains multiple semantic beats and a final catalog. It composes editable `DepthCameraLayer[]`, two WebGL passes and DOM narrative slots. The camera supplies the dominant dolly; layer transforms stay corrective. In the recipe, the scene timeline introduces the catalog, catalog buttons own horizontal progress after entry, and reverse-scroll withdraws the catalog and restores the prior beat.

## Advanced sequential ImageGen stack

Do not ask ImageGen for seven unrelated transparent pictures. Approve one master and edit a registered full-canvas composite stage by stage: `00-sky` → `10-landscape` → `20-midground` → `30-hero` → `40-foreground-left` → `41-foreground-right` → `50-edge-frame`. Every edit references the immediately approved stage and forbids camera, crop, horizon, lighting and untouched-pixel changes.

After each stage, extract only the new region as a delta plate. Constrain difference mattes to inspected regions and connected components so harmless generative drift does not become giant semi-transparent blocks. Derive `29-contact-reflection` from the hero stage with soft proportional alpha. Apply edge decontamination, inspect alpha on black/white/saturated backgrounds, recompose every plate at transform zero and compare it to the master.

ImageGen can be asked for transparency, but verify the actual alpha channel. A checkerboard rendered in RGB is not transparent. Complex glass, hair, smoke, reflections and soft contact need extraction from the registered composite or dedicated matting.

Create the mobile stack from one shared mobile crop so every plate remains registered. Deliver posters, dimensions, anchors, rights, bytes and a manifest for both desktop and mobile.

When the clean plate is an ImageGen edit of the approved master, derive complex plates with a registered difference matte constrained to explicit regions. Use proportional alpha and edge unmatting against the clean plate for antialiased boundaries; binary thresholds around dark rock, glass or fine edges create bright halos. Render alpha plates losslessly (or prove the chosen codec on a contrasting background), keep a defocused/extended opaque bleed under moving layers and save both the zero-transform composite and per-plate contrast checks.

For simple opaque isolated objects, ImageGen may generate against a perfectly flat removable chroma background followed by local matte removal. Do not use chroma for glass, smoke, hair, reflections, soft shadows or surface contact; derive those from the registered composite or use dedicated/native matting.

Text remains editable React. Rear text can begin below the subject, rise into view, hold long enough to read while the subject visibly occludes it, then exit. Front text enters in a later beat. Do not fade both layers at once or hide the only semantic heading in an `aria-hidden` raster layer.

## Registration, Anchors, and Motion

- Every plate uses the same dimensions, crop, and origin.
- Keep background, contact, and subject exactly registered for the first 10–15% of progress.
- Assign the subject and its contact plate the same `transformOrigin` at the physical support point, such as `58% 81%` for tires on road.
- Move and scale contact with the subject. Contact may change opacity subtly, but must not drift separately.
- Keep photographic translation small. Large movement exposes inpainted differences and makes the scene resemble paper cut-outs.
- Give background the smallest movement, subject a modest movement, and foreground/text the largest motion budget.
- Pointer response is secondary to scroll and remains very small around registered subjects.
- Create a separate mobile crop/timeline when the physical anchor cannot survive a different `object-position`.

## Video Matte Mode

A normal video is not a depth solution. For `mode: "video-matte"`, require:

- a source video and synchronized alpha/matte video with identical frame rate, duration, resolution, and edit points;
- a poster/static fallback built from one registered frame;
- mobile and reduced-motion behavior;
- a preload and byte budget;
- frame-sync testing on Safari/iOS and Chromium.

If synchronized mattes are unavailable, use `ImageSequenceScrub`, `ExpandingMedia`, or a static `ScrollDepthScene` instead.

## Acceptance Checklist

- Background alone has no subject-shaped hole.
- Alpha edges are clean at 100% and on a contrasting debug background.
- The contact plate makes the subject touch its surface at zero transform.
- Subject and contact share canvas, anchor, and initial keyframes.
- Rear text is visibly occluded and readable during a held beat.
- Mobile crop preserves subject, anchor, and copy.
- Reduced motion shows a coherent static poster with complete semantic text.
- Heavy assets are optimized and documented in an asset manifest.

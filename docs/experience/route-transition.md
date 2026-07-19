# Route Transition

## Purpose

Use the View Transitions API for continuity between routes and large state changes: page-to-page morphs, shared hero elements and theme wipes. It complements Scene Handoff — that one choreographs two scenes inside a page; this one carries continuity across navigations.

## Install and use

```tsx
import {
  ViewTransitionLink,
  ViewTransitionStyles,
  sharedElementStyle,
  startThemeWipe,
  useViewTransitionRouter,
} from "@/components/experience/route-transition";

// Root layout, once:
<ViewTransitionStyles />

// Navigation with a transition:
<ViewTransitionLink href="/work/atelier">Open case study</ViewTransitionLink>

// Shared element across the two routes (same name on both sides):
<Image style={sharedElementStyle("case-hero")} … />

// Theme switch with a circular wipe from the toggle:
startThemeWipe(() => setTheme("dark"), { origin: { x: event.clientX, y: event.clientY } });
```

`useViewTransitionRouter()` exposes wrapped `push`/`replace`/`back` for programmatic navigation. Everything degrades gracefully: unsupported browsers and reduced-motion users get instant navigation with zero errors.

## Gates

- Never gate navigation on the transition: the update callback must run even when `startViewTransition` is missing.
- Shared element names must be unique per page; remove them from elements that unmount mid-transition.
- Verify Safari/Firefox fallback (plain navigation), reduced-motion (no animation), and that wipes originate from the triggering control.

# Intro Loader

## Purpose

A page-entry (or any-loading) choreography: a full-viewport curtain with a progress counter and a word cycle, then a curtain-lift exit. Two modes:

- **Self-timed intro** — the counter tracks real document readiness (eased toward 90%, released on `load`, hard-capped), plays once per session.
- **Controlled loading screen** — `active` and `progress` turn it into a gate for anything that actually loads: route changes, gallery/scene preloads, font or video readiness, WebGL warmup.

## Install and use

```tsx
import { IntroLoader } from "@/components/experience/intro-loader";

// Self-timed, once per session:
<IntroLoader minDurationMs={1800} words={["Craft", "Motion", "Systems"]} storageKey="studio-intro" exit="up" onComplete={armHero}>
  <BrandMark className="w-40" />
</IntroLoader>

// Controlled loading screen for real work:
<IntroLoader key={sceneId} storageKey={null} active={loading} progress={loadedAssets / totalAssets} minDurationMs={600} exit="fade" />
```

With `progress` the counter eases toward the reported value instead of simulating; with `active` the curtain holds at 100% until you flip it to `false` (remount with a new `key` to replay). `maxDurationMs` guarantees a stalled asset never traps the visitor. Scroll is locked only while the curtain covers content.

## Gates

- Repeat visitors and reduced motion skip the intro entirely and `onComplete` still fires, so dependent hero animation must not assume the curtain played.
- Keep `minDurationMs` under ~2.5s for the intro; a controlled loading screen should be as short as the real work.
- Coordinate with the hero: the exit should hand off into a composed first frame, not a pop-in.
- The curtain sits at `z-[90]`; verify nothing legitimate (cookie notices, dialogs) needs to appear above it while it plays.
- Never fake `progress` — if there is nothing measurable to load, use the self-timed mode instead.

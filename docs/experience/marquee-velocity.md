# Marquee Velocity

## Purpose

Use a velocity-reactive infinite strip for wordmarks, logo walls and editorial tickers. Scroll speed feeds the strip's speed (and, optionally, direction), so the page's energy is visible in the marquee. It is a rhythm device, not a content carousel.

## Install and use

```tsx
import { MarqueeVelocity } from "@/components/experience/marquee-velocity";

<MarqueeVelocity label="Clients" speed={70} velocityInfluence={1.4} pauseOnHover>
  {logos.map((logo) => <Logo key={logo.id} {...logo} />)}
</MarqueeVelocity>
```

`children` is one sequence; the component measures it and repeats it just enough to stay seamless. Tune `speed`, `velocityInfluence`, `maxBoost`, `gap` and `direction`; `flipOnScroll` reverses travel while scrolling up.

## Gates

- Reduced motion renders a static, natively scrollable strip — no auto-motion at all.
- Duplicated copies are `aria-hidden`; only the first sequence is exposed to AT. Do not put links or buttons inside the moving strip.
- Verify seamlessness after resize, offscreen pause, and that `pauseOnHover` eases to a stop instead of freezing.

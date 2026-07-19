# Count-Up

## Purpose

Stat numbers that count up when they enter the viewport — proof sections, KPI bands, pricing. The final value is always the server-rendered content and the accessible name; the animation is presentation only.

## Install and use

```tsx
import { CountUp } from "@/components/experience/count-up";

<p className="text-7xl font-semibold tabular-nums">
  <CountUp value={12800} suffix="+" formatOptions={{ useGrouping: true }} />
</p>
<CountUp value={99.98} suffix="%" formatOptions={{ minimumFractionDigits: 2 }} durationMs={1800} />
```

`from`, `durationMs`, `delayMs` (stagger a stat row), `locale`/`formatOptions` (Intl formatting, currency, compact notation), `once`, and a custom `easing` curve. Changing `value` after reveal animates from the currently displayed number — usable for live counters.

## Gates

- Layout is reserved by an invisible copy of the final value, so the row must not jump; still set `tabular-nums` on the surrounding type for stable digits.
- Reduced motion and no-JS render the final value immediately — never ship a stat that only exists mid-animation.
- Keep `durationMs` under ~2s; a counter that outlives the scroll gesture reads as broken.
- Intermediate values respect the format's decimals: verify currency/percentage stats do not flash impossible precision.

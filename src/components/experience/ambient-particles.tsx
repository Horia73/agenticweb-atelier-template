"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { clamp01, damp, useFinePointer, usePrefersReducedMotion } from "@/components/experience/experience-runtime";

export type AmbientParticlesPreset = "dust" | "snow" | "embers" | "fireflies";

export type AmbientParticlesProps = Omit<React.ComponentProps<"div">, "children" | "color"> & {
  preset?: AmbientParticlesPreset;
  /** One or more particle colors (picked per particle). */
  colors?: string[];
  /** Particles per 100 000 px² of stage; the result is capped by `maxCount`. */
  density?: number;
  maxCount?: number;
  /** Global speed multiplier. */
  speed?: number;
  /** Particle radius range in pixels (at full depth; far particles render smaller). */
  size?: [number, number];
  /** Overall layer opacity. */
  opacity?: number;
  /** Gentle pointer push in pixels (0 disables; fine pointers only). */
  pointerInfluence?: number;
  /** Fraction of each edge across which particles fade out, so the field never pops at the section border. */
  edgeFade?: number;
  blend?: React.CSSProperties["mixBlendMode"];
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 0 = far (small, slow, dim), 1 = near (large, fast, bright). */
  depth: number;
  radius: number;
  spriteIndex: number;
  alpha: number;
  phase: number;
  rate: number;
};

type PresetConfig = {
  baseVx: number;
  baseVy: number;
  wander: number;
  /** Coherent gust strength: every particle leans into the same slow wind wave. */
  windAmp: number;
  windRate: number;
  /** 0 no pulse, otherwise alpha oscillates by this fraction. */
  pulse: number;
  /** Softness of the sprite: fraction of the radius that is solid core. */
  core: number;
  /** Preset-level multiplier over the `size` prop. */
  sizeMul: number;
  baseAlpha: number;
  composite: GlobalCompositeOperation;
  defaultColors: string[];
};

const PRESETS: Record<AmbientParticlesPreset, PresetConfig> = {
  dust: { baseVx: 5, baseVy: -4, wander: 7, windAmp: 7, windRate: 0.16, pulse: 0.35, core: 0.18, sizeMul: 1, baseAlpha: 0.5, composite: "lighter", defaultColors: ["#ffffff", "#ffeecb"] },
  snow: { baseVx: 9, baseVy: 34, wander: 8, windAmp: 30, windRate: 0.22, pulse: 0.08, core: 0.5, sizeMul: 1.65, baseAlpha: 0.9, composite: "source-over", defaultColors: ["#ffffff", "#eef4ff"] },
  embers: { baseVx: 4, baseVy: -26, wander: 10, windAmp: 10, windRate: 0.3, pulse: 0.55, core: 0.22, sizeMul: 1, baseAlpha: 0.8, composite: "lighter", defaultColors: ["#ffb46b", "#ff7847", "#ffd9a0"] },
  fireflies: { baseVx: 0, baseVy: 0, wander: 16, windAmp: 0, windRate: 0, pulse: 0.9, core: 0.14, sizeMul: 1, baseAlpha: 0.9, composite: "lighter", defaultColors: ["#e8ffb0", "#c8f27d", "#9fe8d8"] },
};

const SPRITE_SIZE = 64;

/** Resolves any CSS color to rgb components via a 1×1 canvas, so gradients can add their own alpha. */
function colorToRgb(color: string): [number, number, number] {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const context = probe.getContext("2d");
  if (!context) return [255, 255, 255];
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r ?? 255, g ?? 255, b ?? 255];
}

/** Prerendered soft radial sprite per color: one drawImage per particle instead of per-frame gradients. */
function makeSprite(color: string, core: number) {
  const sprite = document.createElement("canvas");
  sprite.width = SPRITE_SIZE;
  sprite.height = SPRITE_SIZE;
  const context = sprite.getContext("2d");
  if (!context) return sprite;
  const [r, g, b] = colorToRgb(color);
  const half = SPRITE_SIZE / 2;
  const solid = clamp01(core);
  const gradient = context.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gradient.addColorStop(solid, `rgba(${r},${g},${b},1)`);
  gradient.addColorStop(solid + (1 - solid) * 0.45, `rgba(${r},${g},${b},.32)`);
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return sprite;
}

/**
 * A decorative canvas particle field (dust, snow, embers or fireflies) for
 * atmosphere behind hero content. Particles are soft prerendered glow sprites
 * distributed across three depth bands (far ones are smaller, slower and
 * dimmer), fade out near the stage edges so the field never pops against the
 * section border, and survive resizes without respawning. Count scales with
 * stage area under a hard cap, DPR is capped, and the loop pauses offscreen
 * and on hidden tabs. Purely aria-hidden; reduced motion renders nothing, so
 * the section must read perfectly without it. Place inside a
 * `position: relative` parent.
 */
export function AmbientParticles({
  blend,
  className,
  colors,
  density = 6,
  edgeFade = 0.1,
  maxCount = 150,
  opacity = 0.8,
  pointerInfluence = 0,
  preset = "dust",
  size = [1.4, 3.2],
  speed = 1,
  style,
  ...props
}: AmbientParticlesProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();
  const pointerActive = pointerInfluence > 0 && finePointer;
  const colorsKey = colors?.join("|") ?? "";
  const sizeKey = size.join("|");

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    if (!canvas || !stage || reducedMotion) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const config = PRESETS[preset];
    const palette = colors && colors.length > 0 ? colors : config.defaultColors;
    const sprites = palette.map((color) => makeSprite(color, config.core));
    const [minRadius, maxRadius] = size;
    let disposed = false;
    let frame = 0;
    let running = false;
    let onScreen = true;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let previous = performance.now();
    let particles: Particle[] = [];
    const pointer = { x: -1e4, y: -1e4, sx: -1e4, sy: -1e4 };

    const spawn = (index: number): Particle => {
      const depth = Math.pow(Math.random(), 1.6);
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        depth,
        radius: (minRadius + Math.random() * Math.max(0, maxRadius - minRadius)) * (0.35 + 0.65 * depth) * config.sizeMul,
        spriteIndex: index % sprites.length,
        alpha: config.baseAlpha * (0.4 + 0.6 * depth),
        phase: Math.random() * Math.PI * 2,
        rate: 0.55 + Math.random() * 1.15,
      };
    };

    const measure = () => {
      const rect = stage.getBoundingClientRect();
      const previousWidth = width;
      const previousHeight = height;
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(1.75, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const target = Math.min(maxCount, Math.max(8, Math.round(((width * height) / 100_000) * density)));
      if (particles.length === 0) {
        particles = Array.from({ length: target }, (_, index) => spawn(index));
        return;
      }
      // Resizes reproject the existing field instead of respawning it, so
      // nothing pops while the layout settles.
      if (previousWidth > 0 && previousHeight > 0) {
        for (const particle of particles) {
          particle.x = (particle.x / previousWidth) * width;
          particle.y = (particle.y / previousHeight) * height;
        }
      }
      while (particles.length < target) particles.push(spawn(particles.length));
      if (particles.length > target) particles.length = target;
    };

    const render = (time: number) => {
      if (disposed) return;
      if (!onScreen || document.visibilityState !== "visible") {
        running = false;
        return;
      }
      const delta = Math.min(0.05, Math.max(0.001, (time - previous) / 1000));
      previous = time;
      pointer.sx = damp(pointer.sx, pointer.x, 8, delta);
      pointer.sy = damp(pointer.sy, pointer.y, 8, delta);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = config.composite;
      const t = time / 1000;
      const fadeX = Math.max(1, width * edgeFade);
      const fadeY = Math.max(1, height * edgeFade);
      // One slow, shared wind wave gives the whole field coherent gusts.
      const wind = config.windAmp > 0 ? Math.sin(t * config.windRate) + 0.4 * Math.sin(t * config.windRate * 2.7 + 1.3) : 0;
      for (const particle of particles) {
        const depthSpeed = (0.35 + 0.65 * particle.depth) * speed;
        const wobble = Math.sin(t * particle.rate + particle.phase);
        const drift = Math.cos(t * 0.7 * particle.rate + particle.phase);
        particle.vx = damp(particle.vx, (config.baseVx * wobble + config.wander * drift + config.windAmp * wind) * depthSpeed, 2, delta);
        particle.vy = damp(particle.vy, (config.baseVy + config.wander * 0.4 * wobble) * depthSpeed, 2, delta);
        if (pointerActive) {
          const dx = particle.x - pointer.sx;
          const dy = particle.y - pointer.sy;
          const distance = Math.hypot(dx, dy);
          if (distance < 180 && distance > 0.01) {
            const falloff = 1 - distance / 180;
            const push = falloff * falloff * pointerInfluence * (0.4 + 0.6 * particle.depth);
            particle.x += (dx / distance) * push * delta;
            particle.y += (dy / distance) * push * delta;
          }
        }
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        const margin = particle.radius * 3 + 6;
        if (particle.x < -margin) particle.x = width + margin;
        if (particle.x > width + margin) particle.x = -margin;
        if (particle.y < -margin) particle.y = height + margin;
        if (particle.y > height + margin) particle.y = -margin;
        const pulse = config.pulse > 0 ? 1 - config.pulse + config.pulse * (0.5 + 0.5 * Math.sin(t * 2 * particle.rate + particle.phase)) : 1;
        // Smooth fade toward every edge keeps the field seamless against the section border.
        const edge =
          clamp01(Math.min(particle.x + margin, width + margin - particle.x) / fadeX) *
          clamp01(Math.min(particle.y + margin, height + margin - particle.y) / fadeY);
        const alpha = particle.alpha * Math.max(0, pulse) * edge * edge;
        if (alpha <= 0.004) continue;
        const drawSize = particle.radius * 6;
        context.globalAlpha = alpha;
        context.drawImage(sprites[particle.spriteIndex]!, particle.x - drawSize / 2, particle.y - drawSize / 2, drawSize, drawSize);
      }
      frame = requestAnimationFrame(render);
    };

    const wake = () => {
      if (running || disposed) return;
      running = true;
      previous = performance.now();
      frame = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(() => {
      measure();
      wake();
    });
    resizeObserver.observe(stage);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = Boolean(entry?.isIntersecting);
        if (onScreen) wake();
      },
      { rootMargin: "10% 0px" },
    );
    intersectionObserver.observe(stage);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") wake();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    const handlePointerMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    if (pointerActive) window.addEventListener("pointermove", handlePointerMove, { passive: true });

    measure();
    wake();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (pointerActive) window.removeEventListener("pointermove", handlePointerMove);
    };
    // Array props are keyed by signature strings so identity churn cannot restart the field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorsKey, density, edgeFade, maxCount, pointerActive, pointerInfluence, preset, reducedMotion, sizeKey, speed]);

  if (reducedMotion) return null;

  return (
    <div aria-hidden data-ambient-particles className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} style={{ opacity, mixBlendMode: blend, ...style }} {...props}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}

"use client";

import * as React from "react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import { clamp01, damp, usePrefersReducedMotion } from "@/components/experience/experience-runtime";
import { useWebGLStage } from "@/components/experience/use-webgl-stage";

export type DistortionCarouselItem = {
  id: string;
  src: string;
  alt: string;
};

export type DistortionCarouselProps<T extends DistortionCarouselItem = DistortionCarouselItem> = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  items: T[];
  startIndex?: number;
  /** Strength of the velocity-driven bend, chromatic shift and zoom. */
  distortion?: number;
  /** How quickly the strip settles onto a slide. */
  smoothing?: number;
  /** Horizontal drag distance (in stage widths) that equals one slide. */
  dragSensitivity?: number;
  maxDpr?: number;
  previousLabel?: string;
  nextLabel?: string;
  slideLabel?: (index: number, total: number) => string;
  showDots?: boolean;
  renderCaption?: (item: T, index: number, active: boolean) => React.ReactNode;
  children?: React.ReactNode;
  onActiveChange?: (index: number) => void;
  stageClassName?: string;
  canvasClassName?: string;
  fallback?: React.ReactNode;
};

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.); }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform vec2 uResolution;
  uniform vec2 uFromSize;
  uniform vec2 uToSize;
  uniform float uMix;
  uniform float uVelocity;
  uniform float uDistortion;

  vec2 coverUv(vec2 uv, vec2 imageSize) {
    float screenAspect = uResolution.x / max(1., uResolution.y);
    float imageAspect = imageSize.x / max(1., imageSize.y);
    vec2 scale = screenAspect < imageAspect
      ? vec2(screenAspect / imageAspect, 1.)
      : vec2(1., imageAspect / screenAspect);
    return (uv - .5) * scale + .5;
  }

  void main() {
    float speed = clamp(uVelocity, -1., 1.);
    float energy = abs(speed);
    // Velocity bends the image and pulls it slightly toward the camera.
    vec2 uv = vUv;
    uv.x += sin(uv.y * 5.2 + speed * 2.4) * speed * .045 * uDistortion;
    uv = (uv - .5) * (1. - energy * .06 * uDistortion) + .5;
    // Slide parallax: the outgoing image leads, the incoming one catches up.
    float shift = .22 * uDistortion;
    vec2 fromUv = coverUv(uv + vec2(uMix * shift, 0.), uFromSize);
    vec2 toUv = coverUv(uv - vec2((1. - uMix) * shift, 0.), uToSize);
    vec2 aberration = vec2(speed * .014 * uDistortion, 0.);
    vec3 fromColor;
    fromColor.r = texture2D(uFrom, fromUv + aberration).r;
    fromColor.g = texture2D(uFrom, fromUv).g;
    fromColor.b = texture2D(uFrom, fromUv - aberration).b;
    vec3 toColor;
    toColor.r = texture2D(uTo, toUv + aberration).r;
    toColor.g = texture2D(uTo, toUv).g;
    toColor.b = texture2D(uTo, toUv - aberration).b;
    float blend = smoothstep(.12, .88, uMix);
    vec3 color = mix(fromColor, toColor, blend);
    color *= 1. - energy * .12;
    gl_FragColor = vec4(color, 1.);
  }
`;

/**
 * A draggable WebGL image carousel: momentum, snap, and a velocity-driven
 * bend/chromatic distortion while the strip is moving. Touch drags work
 * (vertical page scroll stays native); reduced motion and WebGL failures get
 * a native snap rail.
 */
export function DistortionCarousel<T extends DistortionCarouselItem = DistortionCarouselItem>({
  canvasClassName,
  children,
  className,
  distortion = 1,
  dragSensitivity = 1,
  fallback,
  items,
  label,
  maxDpr = 1.6,
  nextLabel = "Next slide",
  onActiveChange,
  previousLabel = "Previous slide",
  renderCaption,
  showDots = true,
  slideLabel = (index, total) => `Slide ${index + 1} of ${total}`,
  smoothing = 7,
  stageClassName,
  startIndex = 0,
  ...props
}: DistortionCarouselProps<T>) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const total = items.length;
  const lastIndex = Math.max(0, total - 1);
  const initialIndex = Math.min(lastIndex, Math.max(0, startIndex));

  const offsetRef = React.useRef(initialIndex);
  const targetRef = React.useRef(initialIndex);
  const velocityRef = React.useRef(0);
  const dragRef = React.useRef({ active: false, pointerId: -1, startX: 0, startOffset: 0, lastX: 0, lastTime: 0, speed: 0 });
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);
  const activeIndexRef = React.useRef(initialIndex);
  const reducedMotion = usePrefersReducedMotion();

  const onActiveChangeRef = React.useRef(onActiveChange);
  React.useInsertionEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  });
  React.useEffect(() => {
    onActiveChangeRef.current?.(activeIndex);
  }, [activeIndex]);

  const goTo = React.useCallback(
    (index: number) => {
      const next = Math.min(lastIndex, Math.max(0, index));
      targetRef.current = next;
      // Explicit navigation reflects immediately in captions/dots; the strip
      // itself settles over the following frames.
      if (activeIndexRef.current !== next) {
        activeIndexRef.current = next;
        setActiveIndex(next);
      }
    },
    [lastIndex],
  );

  const { ready, failed } = useWebGLStage({
    stageRef,
    canvasRef,
    enabled: !reducedMotion && total > 0,
    maxDpr,
    signature: JSON.stringify([distortion, smoothing, items.map((item) => item.src)]),
    create: ({ renderer, markReady, markFailed, isDisposed, requestResize }) => {
      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      const geometry = new THREE.PlaneGeometry(2, 2);
      const loader = new THREE.TextureLoader();
      const textures: Array<THREE.Texture | null> = items.map(() => null);
      const pending = new Set<number>();
      const empty = new THREE.Texture();
      const uniforms = {
        uFrom: { value: empty as THREE.Texture },
        uTo: { value: empty as THREE.Texture },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uFromSize: { value: new THREE.Vector2(1, 1) },
        uToSize: { value: new THREE.Vector2(1, 1) },
        uMix: { value: 0 },
        uVelocity: { value: 0 },
        uDistortion: { value: distortion },
      };
      const material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, depthTest: false, depthWrite: false });
      scene.add(new THREE.Mesh(geometry, material));

      const ensureTexture = (index: number) => {
        if (index < 0 || index >= items.length || textures[index] || pending.has(index)) return;
        pending.add(index);
        loader.load(
          items[index]!.src,
          (texture) => {
            pending.delete(index);
            if (isDisposed()) {
              texture.dispose();
              return;
            }
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            textures[index] = texture;
            if (index === Math.round(offsetRef.current)) {
              requestResize();
              markReady();
            }
          },
          undefined,
          () => {
            pending.delete(index);
            if (index === initialIndex) markFailed();
          },
        );
      };
      ensureTexture(initialIndex);
      ensureTexture(initialIndex + 1);
      ensureTexture(initialIndex - 1);

      const applyTexture = (slot: "uFrom" | "uTo", sizeSlot: "uFromSize" | "uToSize", index: number) => {
        const texture = textures[Math.min(lastIndex, Math.max(0, index))];
        if (!texture) return;
        uniforms[slot].value = texture;
        const image = texture.image as { width?: number; height?: number };
        uniforms[sizeSlot].value.set(image.width ?? 1, image.height ?? 1);
      };

      return {
        onResize: (width, height) => {
          uniforms.uResolution.value.set(width, height);
          renderer.render(scene, camera);
        },
        onFrame: (delta) => {
          const drag = dragRef.current;
          const settle = drag.active ? smoothing * 2.2 : smoothing;
          const previous = offsetRef.current;
          offsetRef.current = damp(previous, targetRef.current, settle, delta);
          const frameVelocity = (offsetRef.current - previous) / Math.max(0.001, delta);
          velocityRef.current = damp(velocityRef.current, frameVelocity * 0.34, 9, delta);

          const floor = Math.min(lastIndex - (total > 1 ? 1 : 0), Math.max(0, Math.floor(offsetRef.current)));
          ensureTexture(floor - 1);
          ensureTexture(floor);
          ensureTexture(floor + 1);
          ensureTexture(floor + 2);
          applyTexture("uFrom", "uFromSize", floor);
          applyTexture("uTo", "uToSize", floor + 1);
          uniforms.uMix.value = clamp01(offsetRef.current - floor);
          uniforms.uVelocity.value = Math.max(-1, Math.min(1, velocityRef.current));
          renderer.render(scene, camera);

          const settled = Math.round(targetRef.current);
          if (settled !== activeIndexRef.current) {
            activeIndexRef.current = settled;
            setActiveIndex(settled);
          }
        },
        dispose: () => {
          textures.forEach((texture) => texture?.dispose());
          empty.dispose();
          geometry.dispose();
          material.dispose();
        },
      };
    },
  });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || failed || total < 2) return;
    // Never start a drag from the arrows/dots (or any interactive child):
    // pointer capture would retarget the pointerup and swallow their click.
    if ((event.target as Element | null)?.closest?.("button, a, input, select, textarea")) return;
    const drag = dragRef.current;
    drag.active = true;
    drag.pointerId = event.pointerId;
    drag.startX = event.clientX;
    drag.startOffset = targetRef.current;
    drag.lastX = event.clientX;
    drag.lastTime = performance.now();
    drag.speed = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || event.pointerId !== drag.pointerId) return;
    const stage = stageRef.current;
    const width = Math.max(1, stage?.clientWidth ?? 1);
    const deltaSlides = ((event.clientX - drag.startX) / width) * dragSensitivity * 1.4;
    const raw = drag.startOffset - deltaSlides;
    // Rubber-band beyond the first and last slide.
    const clamped = Math.min(lastIndex, Math.max(0, raw));
    targetRef.current = clamped + (raw - clamped) * 0.25;
    const now = performance.now();
    const elapsed = Math.max(8, now - drag.lastTime);
    drag.speed = ((drag.lastX - event.clientX) / width) * (1000 / elapsed);
    drag.lastX = event.clientX;
    drag.lastTime = now;
  };
  const endDrag = () => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    const projected = targetRef.current + drag.speed * 0.32 * dragSensitivity;
    targetRef.current = Math.min(lastIndex, Math.max(0, Math.round(projected)));
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(Math.round(targetRef.current) - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(Math.round(targetRef.current) + 1);
    }
  };

  const staticMode = reducedMotion || failed;
  const activeItem = items[Math.min(lastIndex, Math.max(0, activeIndex))];

  return (
    <section aria-label={label} data-distortion-carousel data-ready={ready || undefined} data-fallback={staticMode || undefined} className={cn("relative isolate overflow-hidden bg-black", className)} {...props}>
      {staticMode ? (
        fallback ?? (
          <ul className="flex h-full snap-x snap-mandatory gap-3 overflow-x-auto">
            {items.map((item, index) => (
              <li key={item.id} className="relative h-full w-[88%] shrink-0 snap-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- registry source stays framework-neutral. */}
                <img alt={item.alt} src={item.src} className="size-full object-cover" loading={index > 1 ? "lazy" : undefined} />
                {renderCaption?.(item, index, index === activeIndex)}
              </li>
            ))}
          </ul>
        )
      ) : (
        <div
          ref={stageRef}
          role="group"
          aria-roledescription="carousel"
          aria-label={label}
          tabIndex={0}
          className={cn("absolute inset-0 cursor-grab touch-pan-y select-none focus-visible:outline-2 focus-visible:-outline-offset-2 active:cursor-grabbing", stageClassName)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={handleKeyDown}
        >
          <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 size-full transition-opacity duration-500", ready ? "opacity-100" : "opacity-0", canvasClassName)} />
          <span aria-live="polite" className="sr-only">
            {activeItem ? `${slideLabel(activeIndex, total)}. ${activeItem.alt}` : null}
          </span>
          {renderCaption ? (
            <div className="pointer-events-none absolute inset-0">
              {items.map((item, index) => (
                <div key={item.id} aria-hidden={index !== activeIndex} className={cn("absolute inset-0 transition-opacity duration-500", index === activeIndex ? "opacity-100" : "opacity-0")}>
                  {renderCaption(item, index, index === activeIndex)}
                </div>
              ))}
            </div>
          ) : null}
          {total > 1 ? (
            <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-4">
              {/* ui-primitive-allow-native: canvas-overlay arrow with bespoke styling. */}<button type="button" aria-label={previousLabel} disabled={activeIndex <= 0} onClick={() => goTo(activeIndex - 1)} className="pointer-events-auto flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/55 disabled:cursor-default disabled:opacity-35">
                <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              {showDots ? (
                <div className="flex items-center gap-2">
                  {items.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {/* ui-primitive-allow-native: carousel dot with bespoke styling. */}<button type="button" aria-label={slideLabel(index, total)} aria-current={index === activeIndex || undefined} onClick={() => goTo(index)} className={cn("size-2 cursor-pointer rounded-full transition-all", index === activeIndex ? "w-6 bg-white" : "bg-white/40 hover:bg-white/70")} />
                    </React.Fragment>
                  ))}
                </div>
              ) : null}
              {/* ui-primitive-allow-native: canvas-overlay arrow with bespoke styling. */}<button type="button" aria-label={nextLabel} disabled={activeIndex >= lastIndex} onClick={() => goTo(activeIndex + 1)} className="pointer-events-auto flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/55 disabled:cursor-default disabled:opacity-35">
                <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}

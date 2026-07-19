"use client";

import * as React from "react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import { useCoarsePointer, usePrefersReducedMotion } from "@/components/experience/experience-runtime";
import { useWebGLStage } from "@/components/experience/use-webgl-stage";

export type FluidSurfaceProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  src: string;
  alt: string;
  strength?: number;
  radius?: number;
  decay?: number;
  chromatic?: number;
  maxDpr?: number;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  canvasClassName?: string;
};

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.); }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uImageSize;
  uniform vec4 uRipples[5];
  uniform float uStrength;
  uniform float uRadius;
  uniform float uChromatic;

  vec2 coverUv(vec2 uv) {
    float screenAspect = uResolution.x / max(1., uResolution.y);
    float imageAspect = uImageSize.x / max(1., uImageSize.y);
    vec2 ratio = vec2(min(screenAspect / imageAspect, 1.), min(imageAspect / screenAspect, 1.));
    return (uv - .5) * ratio + .5;
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / max(1., uResolution.y), 1.);
    vec2 displacement = vec2(0.);
    float highlight = 0.;
    for (int i = 0; i < 5; i++) {
      vec2 d = (vUv - uRipples[i].xy) * aspect;
      float dist = length(d);
      float age = uRipples[i].z;
      float amp = uRipples[i].w * exp(-age * 2.2);
      float wave = sin(dist * 42. - age * 9.) * exp(-dist / max(.01, uRadius)) * amp;
      displacement += normalize(d + vec2(.0001)) * wave * uStrength;
      highlight += abs(wave) * .1;
    }
    vec2 uv = coverUv(vUv - displacement);
    vec2 ca = normalize(displacement + vec2(.0001)) * uChromatic * min(1., length(displacement) * 35.);
    vec3 color;
    color.r = texture2D(uTexture, uv + ca).r;
    color.g = texture2D(uTexture, uv).g;
    color.b = texture2D(uTexture, uv - ca).b;
    color += highlight;
    gl_FragColor = vec4(color, 1.);
  }
`;

/** An image surface with dissipating pointer impulses; it preserves the native cursor. */
export function FluidSurface({
  alt,
  canvasClassName,
  children,
  chromatic = 0.0014,
  className,
  decay = 1,
  fallback,
  label,
  maxDpr = 1.6,
  radius = 0.24,
  src,
  strength = 0.018,
  onPointerMove,
  ...props
}: FluidSurfaceProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const impulsesRef = React.useRef<Array<{ x: number; y: number; age: number; power: number }>>([]);
  const lastPointerRef = React.useRef({ x: 0.5, y: 0.5, time: 0 });
  const reducedMotion = usePrefersReducedMotion();
  const coarsePointer = useCoarsePointer();
  const staticMode = reducedMotion || coarsePointer;

  const { ready, failed } = useWebGLStage({
    stageRef: rootRef,
    canvasRef,
    enabled: !staticMode,
    maxDpr,
    signature: JSON.stringify([chromatic, decay, radius, src, strength]),
    create: ({ renderer, markReady, markFailed, isDisposed, requestResize }) => {
      let texture: THREE.Texture | null = null;
      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      const geometry = new THREE.PlaneGeometry(2, 2);
      const rippleVectors = Array.from({ length: 5 }, () => new THREE.Vector4(0.5, 0.5, 99, 0));
      const uniforms = {
        uTexture: { value: new THREE.Texture() },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uImageSize: { value: new THREE.Vector2(1, 1) },
        uRipples: { value: rippleVectors },
        uStrength: { value: strength },
        uRadius: { value: radius },
        uChromatic: { value: chromatic },
      };
      const material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, depthTest: false, depthWrite: false });
      scene.add(new THREE.Mesh(geometry, material));

      new THREE.TextureLoader().load(
        src,
        (loaded) => {
          if (isDisposed()) {
            loaded.dispose();
            return;
          }
          texture = loaded;
          texture.colorSpace = THREE.SRGBColorSpace;
          const image = loaded.image as { width?: number; height?: number };
          uniforms.uTexture.value = loaded;
          uniforms.uImageSize.value.set(image.width ?? 1, image.height ?? 1);
          requestResize();
          markReady();
        },
        undefined,
        () => markFailed(),
      );

      return {
        onResize: (width, height) => {
          uniforms.uResolution.value.set(width, height);
          renderer.render(scene, camera);
        },
        onFrame: (delta) => {
          impulsesRef.current.forEach((impulse) => {
            impulse.age += delta * decay;
          });
          impulsesRef.current = impulsesRef.current.filter((impulse) => impulse.age < 2.6).slice(-5);
          rippleVectors.forEach((vector, index) => {
            const impulse = impulsesRef.current[index];
            vector.set(impulse?.x ?? 0.5, impulse?.y ?? 0.5, impulse?.age ?? 99, impulse?.power ?? 0);
          });
          renderer.render(scene, camera);
        },
        dispose: () => {
          texture?.dispose();
          geometry.dispose();
          material.dispose();
        },
      };
    },
  });

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch") {
      const now = performance.now();
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width);
      const y = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
      const previous = lastPointerRef.current;
      if (now - previous.time > 42) {
        const velocity = Math.min(1, Math.hypot(x - previous.x, y - previous.y) * 18 + 0.18);
        impulsesRef.current.push({ x, y, age: 0, power: velocity });
        lastPointerRef.current = { x, y, time: now };
      }
    }
    onPointerMove?.(event);
  };
  const posterStyle = { backgroundImage: `url("${src.replaceAll('"', '%22')}")` };

  return (
    <section ref={rootRef} aria-label={label} data-fluid-surface data-ready={ready || undefined} className={cn("relative isolate overflow-hidden bg-black", className)} onPointerMove={handlePointerMove} {...props}>
      <span className="sr-only">{alt}</span>
      <div aria-hidden className={cn("absolute inset-0 -z-20 bg-cover bg-center", ready && !failed && !staticMode ? "opacity-0" : "opacity-100")} style={posterStyle} />
      <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 -z-10 size-full transition-opacity duration-500", ready && !failed && !staticMode ? "opacity-100" : "opacity-0", canvasClassName)} />
      {(failed || staticMode) && fallback ? <div className="absolute inset-0 -z-10">{fallback}</div> : null}
      {children}
    </section>
  );
}

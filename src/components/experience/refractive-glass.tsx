"use client";

import * as React from "react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import {
  damp,
  useCoarsePointer,
  useMediaQuery,
  usePrefersReducedMotion,
} from "@/components/experience/experience-runtime";
import { useWebGLStage } from "@/components/experience/use-webgl-stage";

export type RefractiveGlassProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  src: string;
  mobileSrc?: string;
  alt: string;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  shape?: "circle" | "rounded";
  lensSize?: number;
  lensAspect?: number;
  radius?: number;
  refraction?: number;
  aberration?: number;
  magnification?: number;
  pointerFollow?: boolean;
  maxDpr?: number;
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
  uniform vec2 uPointer;
  uniform vec2 uLens;
  uniform float uShape;
  uniform float uRadius;
  uniform float uRefraction;
  uniform float uAberration;
  uniform float uMagnification;

  vec2 coverUv(vec2 uv) {
    float screenAspect = uResolution.x / max(1., uResolution.y);
    float imageAspect = uImageSize.x / max(1., uImageSize.y);
    vec2 ratio = vec2(min(screenAspect / imageAspect, 1.), min(imageAspect / screenAspect, 1.));
    return (uv - .5) * ratio + .5;
  }

  float roundedBoxSdf(vec2 p, vec2 halfSize, float radius) {
    vec2 q = abs(p) - halfSize + radius;
    return min(max(q.x, q.y), 0.) + length(max(q, 0.)) - radius;
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / max(1., uResolution.y), 1.);
    vec2 p = (vUv - uPointer) * aspect;
    vec2 halfSize = vec2(uLens.x, uLens.y);
    float dist = uShape < .5 ? length(p / max(halfSize, vec2(.001))) - 1. : roundedBoxSdf(p, halfSize, min(uRadius, min(halfSize.x, halfSize.y)));
    float inside = 1. - smoothstep(-.006, .008, dist);
    float edge = exp(-abs(dist) * 95.);
    float inner = clamp(1. - length(p / max(halfSize, vec2(.001))), 0., 1.);
    vec2 normal = normalize(p + vec2(.00001));
    vec2 magnified = uPointer + (vUv - uPointer) / max(.2, uMagnification);
    vec2 offset = normal * uRefraction * (.28 + pow(1. - inner, 2.));
    vec2 baseUv = coverUv(vUv);
    vec2 lensUv = coverUv(magnified - offset);
    vec3 base = texture2D(uTexture, baseUv).rgb;
    float ca = uAberration * (.25 + edge);
    vec3 refracted;
    refracted.r = texture2D(uTexture, lensUv + normal * ca).r;
    refracted.g = texture2D(uTexture, lensUv).g;
    refracted.b = texture2D(uTexture, lensUv - normal * ca).b;
    refracted += edge * vec3(.18, .24, .3);
    refracted *= 1. + inner * .035;
    gl_FragColor = vec4(mix(base, refracted, inside), 1.);
  }
`;

const POINTER_REST = { x: 0.68, y: 0.5 };

/** A media-aware WebGL lens. Consumers own the background, copy and layout. */
export function RefractiveGlass({
  aberration = 0.0035,
  alt,
  canvasClassName,
  children,
  className,
  fallback,
  label,
  lensAspect = 1.45,
  lensSize = 360,
  magnification = 1.045,
  maxDpr = 1.75,
  mobileSrc,
  pointerFollow = true,
  radius = 0.09,
  refraction = 0.018,
  shape = "rounded",
  src,
  onPointerLeave,
  onPointerMove,
  ...props
}: RefractiveGlassProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const pointerRef = React.useRef({ ...POINTER_REST });
  const targetRef = React.useRef({ ...POINTER_REST });
  const reducedMotion = usePrefersReducedMotion();
  const coarsePointer = useCoarsePointer();
  const mobile = useMediaQuery("(max-width: 767.98px)");
  const staticMode = reducedMotion || coarsePointer;
  const resolvedSrc = mobile && mobileSrc ? mobileSrc : src;

  const { ready, failed } = useWebGLStage({
    stageRef: rootRef,
    canvasRef,
    enabled: !staticMode,
    maxDpr,
    signature: JSON.stringify([aberration, lensAspect, lensSize, magnification, radius, refraction, resolvedSrc, shape]),
    create: ({ renderer, markReady, markFailed, isDisposed, requestResize }) => {
      let texture: THREE.Texture | null = null;
      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      const geometry = new THREE.PlaneGeometry(2, 2);
      const uniforms = {
        uTexture: { value: new THREE.Texture() },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uImageSize: { value: new THREE.Vector2(1, 1) },
        uPointer: { value: new THREE.Vector2(pointerRef.current.x, pointerRef.current.y) },
        uLens: { value: new THREE.Vector2(0.2, 0.15) },
        uShape: { value: shape === "circle" ? 0 : 1 },
        uRadius: { value: radius },
        uRefraction: { value: refraction },
        uAberration: { value: aberration },
        uMagnification: { value: magnification },
      };
      const material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, depthTest: false, depthWrite: false });
      scene.add(new THREE.Mesh(geometry, material));

      new THREE.TextureLoader().load(
        resolvedSrc,
        (loaded) => {
          if (isDisposed()) {
            loaded.dispose();
            return;
          }
          texture = loaded;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
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
          const normalizedWidth = lensSize / height;
          uniforms.uLens.value.set(normalizedWidth * 0.5, (normalizedWidth / Math.max(0.25, lensAspect)) * 0.5);
          renderer.render(scene, camera);
        },
        onFrame: (delta) => {
          pointerRef.current.x = damp(pointerRef.current.x, targetRef.current.x, 9, delta);
          pointerRef.current.y = damp(pointerRef.current.y, targetRef.current.y, 9, delta);
          uniforms.uPointer.value.set(pointerRef.current.x, pointerRef.current.y);
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
    if (pointerFollow && event.pointerType !== "touch") {
      const rect = event.currentTarget.getBoundingClientRect();
      targetRef.current = {
        x: (event.clientX - rect.left) / Math.max(1, rect.width),
        y: 1 - (event.clientY - rect.top) / Math.max(1, rect.height),
      };
    }
    onPointerMove?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    targetRef.current = { ...POINTER_REST };
    onPointerLeave?.(event);
  };
  const posterStyle = { backgroundImage: `url("${resolvedSrc.replaceAll('"', '%22')}")` };

  return (
    <section ref={rootRef} aria-label={label} data-refractive-glass data-ready={ready || undefined} data-fallback={failed || staticMode || undefined} className={cn("relative isolate overflow-hidden bg-black", className)} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} {...props}>
      <span className="sr-only">{alt}</span>
      <div aria-hidden className={cn("absolute inset-0 -z-20 bg-cover bg-center", ready && !failed && !staticMode ? "opacity-0" : "opacity-100")} style={posterStyle} />
      {staticMode && !fallback ? <div aria-hidden className="absolute right-[8%] top-1/2 -z-10 h-[32%] w-[42%] -translate-y-1/2 rounded-[2.5rem] border border-white/25 bg-white/[.06] shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_30px_80px_rgba(0,0,0,.25)] backdrop-blur-[3px]" /> : null}
      <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 -z-10 size-full transition-opacity duration-500", ready && !failed && !staticMode ? "opacity-100" : "opacity-0", canvasClassName)} />
      {(failed || staticMode) && fallback ? <div className="absolute inset-0 -z-10">{fallback}</div> : null}
      {children}
    </section>
  );
}

"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import { damp, supportsWebGL, useHydrated } from "@/components/experience/experience-runtime";

export type ShaderFieldProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  mode?: "aurora" | "metaballs" | "contour";
  colors?: [string, string, string];
  speed?: number;
  intensity?: number;
  pointerStrength?: number;
  maxDpr?: number;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  canvasClassName?: string;
};

const DEFAULT_COLORS: [string, string, string] = ["#b9ff5c", "#5de8ff", "#5a45ff"];

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uMode;
  uniform float uIntensity;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1.)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.;
    float amplitude = .5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = p * 2.03 + 17.17;
      amplitude *= .5;
    }
    return value;
  }

  float blob(vec2 uv, vec2 center, float radius) {
    return radius * radius / max(.0008, dot(uv - center, uv - center));
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uResolution.x / max(1., uResolution.y), 1.);
    vec2 p = (uv - .5) * aspect;
    vec2 pointer = (uPointer - .5) * aspect;
    float time = uTime;
    vec3 color;

    if (uMode < .5) {
      float flow = fbm(p * 2.8 + vec2(time * .055, -time * .032));
      float warp = (flow - .5) * .42;
      float ribbonA = exp(-abs(p.y + sin(p.x * 2.7 + time * .18) * .17 + warp * .36) * 9.5);
      float ribbonB = exp(-abs(p.y - .2 + cos(p.x * 3.15 - time * .14) * .13 - warp * .28) * 12.);
      float ribbonC = exp(-abs(p.y + .27 + sin(p.x * 4.1 + time * .11) * .09 + warp * .2) * 15.);
      float curtain = pow(sin((p.x * 1.35 + flow * .82 + time * .035) * 3.14159) * .5 + .5, 3.);
      float pointerGlow = exp(-length(p - pointer) * 4.2);
      color = uColorC * (.035 + flow * .055);
      color += uColorA * ribbonA * (.48 + flow * .32);
      color += uColorB * ribbonB * .72;
      color += mix(uColorB, uColorA, .35) * ribbonC * .44;
      color += mix(uColorC, uColorB, .55) * curtain * .14;
      color += uColorB * pointerGlow * .15;
    } else if (uMode < 1.5) {
      float field = 0.;
      field += blob(p, vec2(-.42 + sin(time * .31) * .11, .16 + cos(time * .27) * .07), .12);
      field += blob(p, vec2(.4 + cos(time * .23) * .09, .12 + sin(time * .35) * .09), .11);
      field += blob(p, vec2(-.12 + sin(time * .17 + 2.) * .14, -.3 + cos(time * .29 + 1.) * .07), .1);
      field += blob(p, pointer, .12);
      field += (fbm(p * 3.4 + time * .025) - .5) * .08;
      float surface = smoothstep(.78, 1.03, field);
      float core = smoothstep(1.05, 2.4, field);
      float edge = exp(-abs(field - 1.) * 9.5);
      float halo = exp(-abs(field - .72) * 6.5) * (1. - surface);
      color = uColorC * (.028 + fbm(p * 1.7) * .045);
      color = mix(color, uColorB * .72, surface);
      color = mix(color, uColorA, core);
      color += edge * mix(uColorB, uColorA, .45) * 1.35;
      color += halo * uColorB * .16;
    } else {
      float terrain = fbm(p * 3.2 + vec2(time * .035, 0.));
      terrain += exp(-length(p - pointer) * 3.) * .22;
      float lines = 1. - smoothstep(.025, .085, abs(fract(terrain * 8.) - .5));
      float glow = smoothstep(.42, .92, terrain);
      color = mix(uColorC * .09, uColorB * .55, glow);
      color += lines * mix(uColorB, uColorA, terrain) * .8;
    }
    color *= uIntensity;
    color = color / (color + vec3(1.));
    gl_FragColor = vec4(color, 1.);
  }
`;

/** A bounded ambient WebGL surface. It owns no copy, layout, or landing recipe. */
export function ShaderField({
  canvasClassName,
  children,
  className,
  colors = DEFAULT_COLORS,
  fallback,
  intensity = 1.15,
  label,
  maxDpr = 1.6,
  mode = "aurora",
  onPointerLeave,
  onPointerMove,
  pointerStrength = 1,
  speed = 1,
  ...props
}: ShaderFieldProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const activeRef = React.useRef(true);
  const pointerRef = React.useRef({ x: 0.5, y: 0.5 });
  const targetPointerRef = React.useRef({ x: 0.5, y: 0.5 });
  const reducedMotion = useReducedMotion();
  const hydrated = useHydrated();
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const prefersReducedMotion = hydrated && Boolean(reducedMotion);
  const colorSignature = colors.join("|");

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas || prefersReducedMotion) return;
    if (!supportsWebGL()) {
      const fallbackTimer = window.setTimeout(() => setFailed(true), 0);
      return () => window.clearTimeout(fallbackTimer);
    }
    let disposed = false;
    let frame = 0;
    let previous = performance.now();
    let elapsed = 0;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      uTime: { value: 0 },
      uMode: { value: mode === "aurora" ? 0 : mode === "metaballs" ? 1 : 2 },
      uIntensity: { value: intensity },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uColorA: { value: new THREE.Color(colors[0]) },
      uColorB: { value: new THREE.Color(colors[1]) },
      uColorC: { value: new THREE.Color(colors[2]) },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: VERTEX_SHADER, fragmentShader: FRAGMENT_SHADER, uniforms, depthTest: false, depthWrite: false });
    scene.add(new THREE.Mesh(geometry, material));
    const resize = () => {
      const width = Math.max(1, root.clientWidth);
      const height = Math.max(1, root.clientHeight);
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const intersectionObserver = new IntersectionObserver(([entry]) => { activeRef.current = Boolean(entry?.isIntersecting); }, { rootMargin: "20% 0px" });
    intersectionObserver.observe(root);
    const contextLost = (event: Event) => { event.preventDefault(); if (!disposed) setFailed(true); };
    canvas.addEventListener("webglcontextlost", contextLost);
    const render = (time: number) => {
      if (disposed) return;
      const delta = Math.min(0.05, Math.max(0.001, (time - previous) / 1000));
      previous = time;
      if (activeRef.current && document.visibilityState === "visible") {
        elapsed += delta * speed;
        pointerRef.current.x = damp(pointerRef.current.x, targetPointerRef.current.x, 7, delta);
        pointerRef.current.y = damp(pointerRef.current.y, targetPointerRef.current.y, 7, delta);
        uniforms.uTime.value = elapsed;
        uniforms.uPointer.value.set(pointerRef.current.x, pointerRef.current.y);
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(render);
    };
    resize();
    renderer.render(scene, camera);
    frame = requestAnimationFrame((time) => {
      if (disposed) return;
      setReady(true);
      render(time);
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", contextLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [colorSignature, colors, intensity, maxDpr, mode, prefersReducedMotion, speed]);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch") {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width);
      const y = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
      targetPointerRef.current.x = 0.5 + (x - 0.5) * pointerStrength;
      targetPointerRef.current.y = 0.5 + (y - 0.5) * pointerStrength;
    }
    onPointerMove?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    targetPointerRef.current = { x: 0.5, y: 0.5 };
    onPointerLeave?.(event);
  };

  if (prefersReducedMotion) {
    return <section ref={rootRef} aria-label={label} data-shader-field data-reduced-motion className={cn("relative isolate overflow-hidden bg-black", className)} {...props}>{fallback ? <div className="absolute inset-0 -z-10">{fallback}</div> : null}{children}</section>;
  }

  return (
    <section ref={rootRef} aria-label={label} data-shader-field data-mode={mode} data-ready={ready || undefined} data-fallback={failed || undefined} className={cn("relative isolate overflow-hidden bg-black", className)} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} {...props}>
      <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 -z-10 size-full transition-opacity duration-500", ready && !failed ? "opacity-100" : "opacity-0", canvasClassName)} />
      {failed ? <div className="absolute inset-0 -z-10">{fallback}</div> : null}
      {children}
    </section>
  );
}

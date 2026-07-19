"use client";

import * as React from "react";
import { type MotionValue, useMotionValue, useReducedMotion } from "motion/react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import { damp, supportsWebGL, useHydrated } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type MeshTransitionProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  from: { src: string; alt: string };
  to: { src: string; alt: string };
  mode?: "wave" | "fold" | "liquid";
  trigger?: "scroll" | "hover" | "controlled";
  progress?: MotionValue<number>;
  scrollScreens?: number;
  intensity?: number;
  maxDpr?: number;
  overlay?: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  fallback?: React.ReactNode;
  stageClassName?: string;
};

const VERTEX_SHADER = /* glsl */ `
  uniform float uProgress;
  uniform float uMode;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    vUv = uv;
    vec3 transformed = position;
    float envelope = sin(uProgress * 3.14159265);
    float wave = sin((uv.x * 2.4 + uv.y * 1.2 + uProgress * 1.8) * 3.14159265);
    if (uMode < .5) {
      transformed.z += wave * .055 * envelope * uIntensity;
      transformed.x += sin(uv.y * 8. + uProgress * 5.) * .012 * envelope * uIntensity;
    } else if (uMode < 1.5) {
      float fold = abs(uv.x - uProgress);
      transformed.z += exp(-fold * 12.) * .09 * envelope * uIntensity;
      transformed.x += (uv.x - .5) * envelope * .018 * uIntensity;
    } else {
      transformed.z += sin((uv.x + uv.y) * 11. + uProgress * 8.) * .022 * envelope * uIntensity;
    }
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform vec2 uResolution;
  uniform vec2 uFromSize;
  uniform vec2 uToSize;
  uniform vec2 uPointer;
  uniform float uProgress;
  uniform float uMode;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vWave;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3. - 2. * f);
    return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1.)), f.x), f.y);
  }

  vec2 coverUv(vec2 uv, vec2 imageSize) {
    float screenAspect = uResolution.x / max(1., uResolution.y);
    float imageAspect = imageSize.x / max(1., imageSize.y);
    vec2 scale = screenAspect < imageAspect
      ? vec2(screenAspect / imageAspect, 1.)
      : vec2(1., imageAspect / screenAspect);
    return (uv - .5) * scale + .5;
  }

  void main() {
    float envelope = sin(uProgress * 3.14159265);
    vec2 centered = vUv - .5;
    vec2 pointerOffset = (uPointer - .5) * .025 * envelope * uIntensity;
    float n = noise(vUv * 5.5 + uProgress * 2.1);
    vec2 distortion = vec2(0.);
    float mixValue = 0.;
    float boundaryDistance = 0.;
    if (uMode < .5) {
      float boundary = mix(-.14, 1.14, uProgress) + sin(vUv.y * 8. + uProgress * 5.) * .055 * envelope;
      boundaryDistance = boundary - vUv.x;
      float seam = 1. - smoothstep(.025, .16, abs(boundaryDistance));
      distortion = vec2(vWave, cos(vUv.y * 12. + uProgress * 5.)) * .018 * seam * envelope * uIntensity;
      mixValue = smoothstep(-.045, .045, boundaryDistance);
    } else if (uMode < 1.5) {
      float foldEdge = mix(-.08, 1.08, uProgress) + (n - .5) * .025 * envelope;
      boundaryDistance = foldEdge - vUv.x;
      float seam = 1. - smoothstep(.015, .13, abs(boundaryDistance));
      distortion = vec2(sign(vUv.x - foldEdge) * .022, 0.) * seam * envelope * uIntensity;
      mixValue = smoothstep(-.02, .02, boundaryDistance);
    } else {
      float boundary = mix(-.16, 1.16, uProgress) + (n - .5) * .2 * envelope;
      boundaryDistance = boundary - vUv.x;
      float seam = 1. - smoothstep(.02, .18, abs(boundaryDistance));
      distortion = (vec2(n, noise(vUv.yx * 6. + 4.)) - .5) * .03 * seam * envelope * uIntensity;
      mixValue = smoothstep(-.04, .04, boundaryDistance);
    }
    vec2 fromUv = coverUv(vUv + distortion + pointerOffset, uFromSize);
    vec2 toUv = coverUv(vUv - distortion * .72 - pointerOffset, uToSize);
    vec3 fromColor = texture2D(uFrom, fromUv).rgb;
    vec3 toColor = texture2D(uTo, toUv).rgb;
    float edge = (1. - smoothstep(.012, .052, abs(boundaryDistance))) * envelope;
    vec3 color = mix(fromColor, toColor, mixValue);
    color += edge * vec3(.045, .09, .12) * uIntensity;
    float vignette = 1. - dot(centered, centered) * .34;
    gl_FragColor = vec4(color * vignette, 1.);
  }
`;

function renderOverlay(overlay: MeshTransitionProps["overlay"], progress: MotionValue<number>) {
  return typeof overlay === "function" ? overlay(progress) : overlay;
}

/** GPU image-to-image transition with reversible scroll, hover or controlled playback. */
export function MeshTransition({
  className,
  fallback,
  from,
  intensity = 1,
  label,
  maxDpr = 1.6,
  mode = "wave",
  onPointerLeave,
  onPointerMove,
  overlay,
  progress: controlledProgress,
  scrollScreens = 2.2,
  stageClassName,
  to,
  trigger = "scroll",
  ...props
}: MeshTransitionProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const pointerRef = React.useRef({ x: 0.5, y: 0.5 });
  const targetPointerRef = React.useRef({ x: 0.5, y: 0.5 });
  const activeRef = React.useRef(true);
  const hoverProgress = useMotionValue(0);
  const visibleProgress = useMotionValue(0);
  const scrollProgress = useElementScrollProgress(rootRef);
  const source = trigger === "controlled" && controlledProgress ? controlledProgress : trigger === "hover" ? hoverProgress : scrollProgress;
  const reducedMotion = useReducedMotion();
  const hydrated = useHydrated();
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const prefersReducedMotion = hydrated && Boolean(reducedMotion);

  React.useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas || prefersReducedMotion) return;
    if (!supportsWebGL()) {
      const fallbackTimer = window.setTimeout(() => setFailed(true), 0);
      return () => window.clearTimeout(fallbackTimer);
    }
    let disposed = false;
    let frame = 0;
    let previous = performance.now();
    let smoothed = source.get();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
    camera.position.z = 3.35;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    const loader = new THREE.TextureLoader();
    const uniforms = {
      uFrom: { value: null as THREE.Texture | null },
      uTo: { value: null as THREE.Texture | null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uFromSize: { value: new THREE.Vector2(1, 1) },
      uToSize: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uProgress: { value: source.get() },
      uMode: { value: mode === "wave" ? 0 : mode === "fold" ? 1 : 2 },
      uIntensity: { value: intensity },
    };
    const geometry = new THREE.PlaneGeometry(2, 2, 80, 80);
    const material = new THREE.ShaderMaterial({ vertexShader: VERTEX_SHADER, fragmentShader: FRAGMENT_SHADER, uniforms, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const load = Promise.all([loader.loadAsync(from.src), loader.loadAsync(to.src)]).then(([fromTexture, toTexture]) => {
      [fromTexture, toTexture].forEach((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
      });
      const fromImage = fromTexture.image as HTMLImageElement;
      const toImage = toTexture.image as HTMLImageElement;
      uniforms.uFrom.value = fromTexture;
      uniforms.uTo.value = toTexture;
      uniforms.uFromSize.value.set(fromImage.naturalWidth, fromImage.naturalHeight);
      uniforms.uToSize.value.set(toImage.naturalWidth, toImage.naturalHeight);
    });
    const resize = () => {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      mesh.scale.set(viewHeight * camera.aspect / 2 * 1.12, viewHeight / 2 * 1.12, 1);
      uniforms.uResolution.value.set(width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    const intersectionObserver = new IntersectionObserver(([entry]) => { activeRef.current = Boolean(entry?.isIntersecting); }, { rootMargin: "20% 0px" });
    intersectionObserver.observe(stage);
    const contextLost = (event: Event) => { event.preventDefault(); if (!disposed) setFailed(true); };
    canvas.addEventListener("webglcontextlost", contextLost);
    const render = (time: number) => {
      if (disposed) return;
      const delta = Math.min(0.05, Math.max(0.001, (time - previous) / 1000));
      previous = time;
      if (activeRef.current && document.visibilityState === "visible") {
        smoothed = damp(smoothed, source.get(), 11, delta);
        visibleProgress.set(smoothed);
        pointerRef.current.x = damp(pointerRef.current.x, targetPointerRef.current.x, 7, delta);
        pointerRef.current.y = damp(pointerRef.current.y, targetPointerRef.current.y, 7, delta);
        uniforms.uProgress.value = smoothed;
        uniforms.uPointer.value.set(pointerRef.current.x, pointerRef.current.y);
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(render);
    };
    load.then(() => {
      if (disposed) return;
      resize();
      renderer.render(scene, camera);
      setReady(true);
      frame = requestAnimationFrame(render);
    }).catch(() => setFailed(true));
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", contextLost);
      geometry.dispose();
      material.dispose();
      uniforms.uFrom.value?.dispose();
      uniforms.uTo.value?.dispose();
      renderer.dispose();
    };
  }, [from.src, intensity, maxDpr, mode, prefersReducedMotion, source, to.src, visibleProgress]);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.pointerType !== "touch") {
      targetPointerRef.current.x = (event.clientX - rect.left) / Math.max(1, rect.width);
      targetPointerRef.current.y = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
    }
    onPointerMove?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    hoverProgress.set(0);
    targetPointerRef.current = { x: 0.5, y: 0.5 };
    onPointerLeave?.(event);
  };

  if (prefersReducedMotion) {
    return <section ref={rootRef} aria-label={label} data-mesh-transition data-reduced-motion className={cn("relative min-h-svh overflow-hidden bg-black", className)} {...props}>{fallback ?? (
      // eslint-disable-next-line @next/next/no-img-element -- registry source stays framework-neutral.
      <img alt={to.alt} src={to.src} className="absolute inset-0 size-full object-cover" />
    )}</section>;
  }
  const scrollDriven = trigger !== "hover";
  return (
    <section ref={rootRef} aria-label={label} data-mesh-transition data-mode={mode} data-trigger={trigger} data-ready={ready || undefined} data-fallback={failed || undefined} className={cn("relative isolate", className)} style={{ minHeight: scrollDriven ? `${Math.max(1, scrollScreens) * 100}svh` : "100svh" }} onPointerEnter={() => hoverProgress.set(1)} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} {...props}>
      <span className="sr-only">{from.alt}. Tranziție către: {to.alt}.</span>
      <div ref={stageRef} className={cn(scrollDriven ? "sticky top-0" : "relative", "h-svh overflow-hidden bg-black", stageClassName)}>
        <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 size-full transition-opacity duration-500", ready && !failed ? "opacity-100" : "opacity-0")} />
        {failed ? <div className="absolute inset-0">{fallback ?? (
          // eslint-disable-next-line @next/next/no-img-element -- registry source stays framework-neutral.
          <img alt={to.alt} src={to.src} className="size-full object-cover" />
        )}</div> : null}
        <div className="pointer-events-none absolute inset-0">{renderOverlay(overlay, visibleProgress)}</div>
      </div>
    </section>
  );
}

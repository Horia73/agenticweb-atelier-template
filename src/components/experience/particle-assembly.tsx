"use client";

import * as React from "react";
import { type MotionValue, useMotionValue, useMotionValueEvent } from "motion/react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import { clamp01, damp, usePrefersReducedMotion } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";
import { useWebGLStage } from "@/components/experience/use-webgl-stage";

export type ParticleAssemblyProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  src: string;
  colorSrc?: string;
  alt: string;
  trigger?: "scroll" | "hover" | "controlled";
  progress?: MotionValue<number>;
  particleCount?: number;
  pointSize?: number;
  color?: THREE.ColorRepresentation;
  sourceColorMix?: number;
  /** Multiplies the final particle color; lifts dark product sources above the additive floor. */
  colorBoost?: number;
  /** Depth amplitude derived from source luminance (color source when present, else the matte). */
  relief?: number;
  sampling?: "auto" | "alpha" | "light" | "dark";
  scatter?: number;
  scrollScreens?: number;
  smoothing?: number;
  invert?: boolean;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  maxDpr?: number;
  stageClassName?: string;
};

const VERTEX = /* glsl */ `
  attribute vec3 aTarget;
  attribute vec3 aScatter;
  attribute float aSeed;
  attribute vec3 aColor;
  uniform float uProgress;
  uniform float uPointSize;
  uniform float uTime;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float eased = uProgress * uProgress * (3. - 2. * uProgress);
    float wave = sin(aSeed * 23. + uTime * .45) * .035 * (1. - eased);
    vec3 p = mix(aScatter, aTarget, eased);
    p.z += wave;
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPointSize * (1. + eased * .5) * (5. / max(1., -mv.z));
    vAlpha = .22 + eased * .78;
    vColor = aColor;
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uColorMix;
  uniform float uColorBoost;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - .5);
    float alpha = (1. - smoothstep(.22, .5, d)) * vAlpha;
    gl_FragColor = vec4(mix(uColor, vColor, uColorMix) * uColorBoost, alpha);
  }
`;

/** Morphs a transparent or high-contrast source into a point cloud target. */
export function ParticleAssembly({
  alt,
  children,
  className,
  color = "#d9ff62",
  colorBoost = 1,
  colorSrc,
  fallback,
  invert = false,
  label,
  maxDpr = 1.6,
  particleCount = 6200,
  pointSize = 7,
  progress: controlledProgress,
  relief = 0.12,
  scatter = 3.8,
  sampling = "auto",
  scrollScreens = 2.8,
  smoothing = 7,
  sourceColorMix = 0.82,
  src,
  stageClassName,
  trigger = "scroll",
  onPointerEnter,
  onPointerLeave,
  ...props
}: ParticleAssemblyProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const desiredRef = React.useRef(0);
  const actualRef = React.useRef(0);
  const localProgress = useElementScrollProgress(rootRef);
  const fallbackProgress = useMotionValue(0);
  const progress = controlledProgress ?? (trigger === "scroll" ? localProgress : fallbackProgress);
  const progressRef = React.useRef(progress);
  React.useInsertionEffect(() => {
    progressRef.current = progress;
  });
  const staticMode = usePrefersReducedMotion();
  useMotionValueEvent(progress, "change", (value) => {
    desiredRef.current = invert ? 1 - clamp01(value) : clamp01(value);
  });
  // Re-derive the desired progress whenever the interaction contract changes,
  // so a late `invert` or `trigger` switch cannot leave a stale target behind.
  React.useEffect(() => {
    const value = trigger === "hover" ? 0 : clamp01(progressRef.current.get());
    desiredRef.current = invert ? 1 - value : value;
  }, [invert, trigger]);

  const { ready, failed } = useWebGLStage({
    stageRef,
    canvasRef,
    enabled: !staticMode,
    maxDpr,
    alpha: true,
    // `trigger` swaps the stage DOM (and therefore the canvas element), so the
    // scene must rebuild against the freshly mounted canvas.
    signature: JSON.stringify([color, colorBoost, colorSrc, particleCount, pointSize, relief, sampling, scatter, smoothing, sourceColorMix, src, trigger]),
    create: ({ renderer, markReady, markFailed, isDisposed }) => {
      let elapsed = 0;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.z = 6;
      const geometry = new THREE.BufferGeometry();
      const uniforms = {
        uProgress: { value: 0 },
        uPointSize: { value: pointSize },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uColorMix: { value: colorSrc ? Math.max(0, Math.min(1, sourceColorMix)) : 0 },
        uColorBoost: { value: Math.max(0, colorBoost) },
      };
      const material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const load = async () => {
        try {
          const loadImage = async (source: string) => {
            const image = new Image();
            image.decoding = "async";
            image.src = source;
            await image.decode();
            return image;
          };
          const [image, colorImage] = await Promise.all([loadImage(src), colorSrc ? loadImage(colorSrc) : Promise.resolve(null)]);
          if (isDisposed()) return;
          const sampleSize = 256;
          const sampleCanvas = document.createElement("canvas");
          sampleCanvas.width = sampleSize;
          sampleCanvas.height = sampleSize;
          const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
          if (!context) throw new Error("Canvas 2D unavailable");
          const ratio = Math.min(sampleSize / image.naturalWidth, sampleSize / image.naturalHeight);
          const width = image.naturalWidth * ratio;
          const height = image.naturalHeight * ratio;
          context.clearRect(0, 0, sampleSize, sampleSize);
          context.drawImage(image, (sampleSize - width) / 2, (sampleSize - height) / 2, width, height);
          const pixels = context.getImageData(0, 0, sampleSize, sampleSize).data;
          let colorPixels: Uint8ClampedArray | null = null;
          if (colorImage) {
            const colorCanvas = document.createElement("canvas");
            colorCanvas.width = sampleSize;
            colorCanvas.height = sampleSize;
            const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
            if (colorContext) {
              const colorRatio = Math.min(sampleSize / colorImage.naturalWidth, sampleSize / colorImage.naturalHeight);
              const colorWidth = colorImage.naturalWidth * colorRatio;
              const colorHeight = colorImage.naturalHeight * colorRatio;
              colorContext.drawImage(colorImage, (sampleSize - colorWidth) / 2, (sampleSize - colorHeight) / 2, colorWidth, colorHeight);
              colorPixels = colorContext.getImageData(0, 0, sampleSize, sampleSize).data;
            }
          }
          const hasTransparency = pixels.some((value, index) => index % 4 === 3 && value < 240);
          const resolvedSampling = sampling === "auto" ? (hasTransparency ? "alpha" : "dark") : sampling;
          const candidates: Array<[number, number, number, number, number, number]> = [];
          for (let y = 0; y < sampleSize; y += 1) {
            for (let x = 0; x < sampleSize; x += 1) {
              const index = (y * sampleSize + x) * 4;
              const alpha = pixels[index + 3]! / 255;
              const luminance = (pixels[index]! + pixels[index + 1]! + pixels[index + 2]!) / 765;
              const selected = resolvedSampling === "alpha" ? alpha > 0.12 : resolvedSampling === "light" ? luminance > 0.52 : luminance < 0.48;
              if (selected) {
                const source = colorPixels ?? pixels;
                const sourceLuminance = (source[index]! + source[index + 1]! + source[index + 2]!) / 765;
                candidates.push([
                  (x / sampleSize - 0.5) * 4.15,
                  (0.5 - y / sampleSize) * 4.15,
                  (sourceLuminance - 0.5) * relief,
                  source[index]! / 255,
                  source[index + 1]! / 255,
                  source[index + 2]! / 255,
                ]);
              }
            }
          }
          if (!candidates.length) throw new Error("No target pixels");
          const count = Math.min(Math.max(600, particleCount), 32000);
          const target = new Float32Array(count * 3);
          const scattered = new Float32Array(count * 3);
          const seeds = new Float32Array(count);
          const sourceColors = new Float32Array(count * 3);
          for (let index = 0; index < count; index += 1) {
            const candidate = candidates[Math.floor(Math.random() * candidates.length)]!;
            const offset = index * 3;
            target[offset] = candidate[0] + (Math.random() - 0.5) * 0.025;
            target[offset + 1] = candidate[1] + (Math.random() - 0.5) * 0.025;
            target[offset + 2] = candidate[2];
            sourceColors[offset] = candidate[3];
            sourceColors[offset + 1] = candidate[4];
            sourceColors[offset + 2] = candidate[5];
            const theta = Math.random() * Math.PI * 2;
            const radius = scatter * (0.3 + Math.pow(Math.random(), 0.55));
            scattered[offset] = Math.cos(theta) * radius;
            scattered[offset + 1] = Math.sin(theta) * radius * 0.72;
            scattered[offset + 2] = (Math.random() - 0.5) * scatter * 1.4;
            seeds[index] = Math.random();
          }
          geometry.setAttribute("position", new THREE.BufferAttribute(target, 3));
          geometry.setAttribute("aTarget", new THREE.BufferAttribute(target, 3));
          geometry.setAttribute("aScatter", new THREE.BufferAttribute(scattered, 3));
          geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
          geometry.setAttribute("aColor", new THREE.BufferAttribute(sourceColors, 3));
          markReady();
        } catch {
          markFailed();
        }
      };
      void load();

      return {
        onResize: (width, height) => {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          const mobileScale = width < 640 ? 0.74 : 1;
          points.scale.setScalar(mobileScale);
        },
        onFrame: (delta) => {
          elapsed += delta;
          actualRef.current = damp(actualRef.current, desiredRef.current, smoothing, delta);
          uniforms.uProgress.value = actualRef.current;
          uniforms.uTime.value = elapsed;
          points.rotation.y = (1 - actualRef.current) * 0.18;
          renderer.render(scene, camera);
        },
        dispose: () => {
          geometry.dispose();
          material.dispose();
        },
      };
    },
  });

  const handlePointerEnter = (event: React.PointerEvent<HTMLElement>) => {
    if (trigger === "hover") desiredRef.current = invert ? 0 : 1;
    onPointerEnter?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    if (trigger === "hover") desiredRef.current = invert ? 1 : 0;
    onPointerLeave?.(event);
  };
  const posterStyle = { backgroundImage: `url("${src.replaceAll('"', '%22')}")` };
  const content = (
    <div ref={stageRef} className={cn("sticky top-0 h-svh overflow-hidden", stageClassName)}>
      <span className="sr-only">{alt}</span>
      <div aria-hidden className={cn("absolute inset-0 bg-contain bg-center bg-no-repeat transition-opacity duration-500", (failed || staticMode) ? "opacity-100" : "opacity-0")} style={posterStyle} />
      <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 size-full transition-opacity duration-500", ready && !failed && !staticMode ? "opacity-100" : "opacity-0")} />
      {(failed || staticMode) && fallback ? <div className="absolute inset-0">{fallback}</div> : null}
      <div className="relative h-full">{children}</div>
    </div>
  );

  return (
    <section ref={rootRef} aria-label={label} data-particle-assembly data-trigger={trigger} data-ready={ready || undefined} className={cn("relative", className)} style={trigger === "scroll" ? { minHeight: `${Math.max(1, scrollScreens) * 100}svh` } : undefined} onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave} {...props}>
      {trigger === "scroll" ? content : <div className="h-svh">{React.cloneElement(content, { className: cn("relative h-full", stageClassName) })}</div>}
    </section>
  );
}

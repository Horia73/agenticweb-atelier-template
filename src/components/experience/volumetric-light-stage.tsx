"use client";

import * as React from "react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import { damp, useExperienceViewport, usePrefersReducedMotion } from "@/components/experience/experience-runtime";
import { useWebGLStage } from "@/components/experience/use-webgl-stage";

export type VolumetricLightBeam = {
  x: number;
  width?: number;
  angle?: number;
  color?: THREE.ColorRepresentation;
  intensity?: number;
};

export type VolumetricLightStageProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  src: string;
  mobileSrc?: string;
  tabletSrc?: string;
  alt: string;
  beams?: VolumetricLightBeam[];
  density?: number;
  haze?: number;
  speed?: number;
  pointerStrength?: number;
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
  uniform vec2 uPointer;
  uniform float uTime;
  uniform float uDensity;
  uniform float uHaze;
  uniform vec3 uBeamColor[3];
  uniform vec3 uBeamData[3];

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.), f.x), f.y);
  }

  vec2 coverUv(vec2 uv) {
    float screenAspect = uResolution.x / max(1., uResolution.y);
    float imageAspect = uImageSize.x / max(1., uImageSize.y);
    vec2 ratio = vec2(min(screenAspect / imageAspect, 1.), min(imageAspect / screenAspect, 1.));
    return (uv - .5) * ratio + .5;
  }

  void main() {
    vec2 uv = vUv;
    vec3 base = texture2D(uTexture, coverUv(uv)).rgb;
    float mist = noise(uv * 5. + vec2(uTime * .025, -uTime * .018)) * uHaze;
    vec3 light = vec3(0.);
    for (int i = 0; i < 3; i++) {
      float x = uBeamData[i].x + (uv.y - .5) * uBeamData[i].z;
      float width = max(.015, uBeamData[i].y) * (1.15 - uv.y * .4);
      float shaft = exp(-pow(abs(uv.x - x) / width, 2.)) * smoothstep(.02, .42, 1. - uv.y);
      float breakup = .65 + .35 * noise(vec2(uv.x * 11. + float(i) * 3., uv.y * 5. - uTime * .035));
      light += uBeamColor[i] * shaft * breakup * uDensity;
    }
    float pointerGlow = exp(-length((uv - uPointer) * vec2(uResolution.x / max(1., uResolution.y), 1.)) * 4.2) * .12;
    vec3 color = base * (.78 + mist * .24) + light + pointerGlow * mix(uBeamColor[0], uBeamColor[1], .5);
    color = 1. - exp(-color * 1.08);
    gl_FragColor = vec4(color, 1.);
  }
`;

const DEFAULT_BEAMS: VolumetricLightBeam[] = [
  { x: 0.25, width: 0.12, angle: 0.18, color: "#ffd6a5", intensity: 1 },
  { x: 0.58, width: 0.16, angle: -0.12, color: "#a5ddff", intensity: 0.85 },
  { x: 0.82, width: 0.09, angle: -0.22, color: "#d6b6ff", intensity: 0.65 },
];

/** Image-backed procedural light shafts with bounded pointer influence. */
export function VolumetricLightStage({
  alt,
  beams = DEFAULT_BEAMS,
  canvasClassName,
  children,
  className,
  density = 0.72,
  fallback,
  haze = 0.55,
  label,
  maxDpr = 1.6,
  mobileSrc,
  pointerStrength = 0.35,
  speed = 1,
  src,
  tabletSrc,
  onPointerLeave,
  onPointerMove,
  ...props
}: VolumetricLightStageProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const pointerRef = React.useRef({ x: 0.5, y: 0.5 });
  const targetRef = React.useRef({ x: 0.5, y: 0.5 });
  const warnedBeamOverflowRef = React.useRef(false);
  const staticMode = usePrefersReducedMotion();
  const viewport = useExperienceViewport();
  const activeSrc = viewport === "mobile" ? mobileSrc ?? tabletSrc ?? src : viewport === "tablet" ? tabletSrc ?? src : src;
  const activeSpeed = speed * (viewport === "mobile" ? .72 : viewport === "tablet" ? .86 : 1);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production" && beams.length > 3 && !warnedBeamOverflowRef.current) {
      warnedBeamOverflowRef.current = true;
      console.warn(
        `VolumetricLightStage: received ${beams.length} beams, but the shader supports 3; extra beams are ignored.`,
      );
    }
  }, [beams.length]);

  const { ready, failed } = useWebGLStage({
    stageRef: rootRef,
    canvasRef,
    enabled: !staticMode,
    maxDpr,
    signature: JSON.stringify([activeSpeed, activeSrc, beams, density, haze]),
    create: ({ renderer, markReady, markFailed, isDisposed, requestResize }) => {
      let elapsed = 0;
      let texture: THREE.Texture | null = null;
      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      const geometry = new THREE.PlaneGeometry(2, 2);
      const normalized = [0, 1, 2].map((index) => beams[index] ?? { x: 0.5, width: 0, angle: 0, color: "#000000", intensity: 0 });
      const uniforms = {
        uTexture: { value: new THREE.Texture() },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uImageSize: { value: new THREE.Vector2(1, 1) },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uTime: { value: 0 },
        uDensity: { value: density },
        uHaze: { value: haze },
        uBeamColor: { value: normalized.map((beam) => new THREE.Color(beam.color ?? "#ffffff").multiplyScalar(beam.intensity ?? 1)) },
        uBeamData: { value: normalized.map((beam) => new THREE.Vector3(beam.x, beam.width ?? 0.12, beam.angle ?? 0)) },
      };
      const material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, depthTest: false, depthWrite: false });
      scene.add(new THREE.Mesh(geometry, material));

      new THREE.TextureLoader().load(
        activeSrc,
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
          elapsed += delta * activeSpeed;
          pointerRef.current.x = damp(pointerRef.current.x, targetRef.current.x, 6, delta);
          pointerRef.current.y = damp(pointerRef.current.y, targetRef.current.y, 6, delta);
          uniforms.uTime.value = elapsed;
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
    if (event.pointerType !== "touch") {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width);
      const y = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
      targetRef.current = { x: 0.5 + (x - 0.5) * pointerStrength, y: 0.5 + (y - 0.5) * pointerStrength };
    }
    onPointerMove?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    targetRef.current = { x: 0.5, y: 0.5 };
    onPointerLeave?.(event);
  };
  const posterStyle = { backgroundImage: `url("${activeSrc.replaceAll('"', '%22')}")` };

  return (
    <section ref={rootRef} aria-label={label} data-volumetric-light data-experience-viewport={viewport} data-ready={ready || undefined} className={cn("relative isolate overflow-hidden bg-black", className)} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} {...props}>
      <span className="sr-only">{alt}</span>
      <div aria-hidden className={cn("absolute inset-0 -z-20 bg-cover bg-center", ready && !failed && !staticMode ? "opacity-0" : "opacity-100")} style={posterStyle} />
      <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 -z-10 size-full transition-opacity duration-500", ready && !failed && !staticMode ? "opacity-100" : "opacity-0", canvasClassName)} />
      {(failed || staticMode) && fallback ? <div className="absolute inset-0 -z-10">{fallback}</div> : null}
      {children}
    </section>
  );
}

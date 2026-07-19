"use client";

import * as React from "react";
import { motion, type MotionValue, useMotionValue, useTransform } from "motion/react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import { clamp01, damp, mix, useExperienceViewport, usePrefersReducedMotion } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";
import { useWebGLStage } from "@/components/experience/use-webgl-stage";

export type PortalCrossingMedia = { src: string; mobileSrc?: string; tabletSrc?: string; alt: string };

export type PortalCrossingProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  /** The world the section starts in — a full-bleed photo the portal arrives into. */
  origin: PortalCrossingMedia;
  /** The world visible through the aperture, wrapped onto the rim, and entered at the crossing. */
  destination: PortalCrossingMedia;
  /** Accent colors for the halo, the energy film and the rim's fresnel glow. */
  rimColors?: [string, string, string];
  /** 0..1 amount of organic irregularity in the rim contour (radius + depth undulation). */
  irregularity?: number;
  /** Pinned scroll length in viewport heights. Defaults to 4. */
  scrollScreens?: number;
  maxDpr?: number;
  /** Screen-reader description; defaults to a sentence built from the alts. */
  announcement?: string;
  progress?: MotionValue<number>;
  overlay?: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  /** Content of the destination world, revealed once the camera has crossed. */
  arrival?: React.ReactNode;
  stageClassName?: string;
  fallback?: React.ReactNode;
};

// Choreography: the origin photo holds the frame alone. Scroll births the
// portal DEEP in the scene — it rushes forward from the horizon with real
// perspective growth, settles at z = 0, and a straight, scroll-only dolly then
// carries the camera through the aperture into the destination plane. The
// cursor never influences the scene — the 3D relief lives in the rim itself.
const FOV = 55;
const TAN_HALF_FOV = Math.tan((FOV / 2) * (Math.PI / 180));
const CAMERA_START_Z = 6.2;
// The camera pushes in slightly while the portal arrives, then the dolly proper starts.
const OPEN_PUSH = 0.3;
const DOLLY_START_Z = CAMERA_START_Z - OPEN_PUSH;
const CAMERA_END_Z = -2.3;
const RING_RADIUS = 1.7;
const RING_TUBE = 0.1;
// Where the portal is born (very deep, just in front of the destination
// plane — a distant speck that glides 30 units toward the camera) and where
// it settles for the crossing.
const PORTAL_BORN_Z = -30;
const PORTAL_REST_Z = 0;
const DESTINATION_PLANE_Z = -32;
const ORIGIN_PLANE_Z = -34;
// Portal arrival window within the scroll progress. The dolly starts BEFORE
// the arrival fully settles (DOLLY_FROM < OPEN_END): the two eased phases
// overlap, so their combined velocity never reaches zero mid-journey — no
// scroll dead zone where the scene appears to stall.
const OPEN_START = 0.05;
const OPEN_END = 0.55;
const DOLLY_FROM = 0.42;
// Flip the stencil masking just before the camera reaches the near plane; at
// this distance the aperture already covers the whole viewport, so the swap is
// invisible in both scroll directions.
const CROSS_EPSILON = 0.14;
const DEFAULT_RIM_COLORS: [string, string, string] = ["#f3f6ff", "#7dd3fc", "#c4b5fd"];
const CONTOUR_SEGMENTS = 220;
// Radius (in world units on the origin plane) of the birth morph — the patch
// of the photo's own pixels that warps into the portal. Deliberately larger
// than the portal's projected footprint at birth: the sky visibly bends
// BEFORE anything arrives, so the portal lands inside an ongoing distortion.
const WARP_RADIUS = 4.2;
// Largest radius the irregular contour can reach (see contourRadius harmonics).
const CONTOUR_MAX = RING_RADIUS * 1.11;

// Fraction of the dolly at which the camera reaches the settled portal plane,
// then the closed-form inverse of easeInOutCubic (the fraction sits in its
// upper half), mapped back onto global progress.
const CROSS_FRACTION = DOLLY_START_Z / (DOLLY_START_Z - CAMERA_END_Z);
/** Progress (0..1) at which the camera crosses the portal plane — for overlay choreography. */
export const PORTAL_CROSSING_AT = DOLLY_FROM + (1 - Math.cbrt(2 * (1 - CROSS_FRACTION)) / 2) * (1 - DOLLY_FROM);
const ARRIVAL_START = PORTAL_CROSSING_AT + 0.07;
const ARRIVAL_END = 0.96;

function easeInOutCubic(progress: number) {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (2 - 2 * progress) ** 3 / 2;
}

function smoothstep(value: number) {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

/** Bell curve rising over [start, mid] and falling over [mid, end]. */
function bell(value: number, start: number, mid: number, end: number) {
  if (value <= start || value >= end) return 0;
  if (value <= mid) return smoothstep((value - start) / (mid - start));
  return 1 - smoothstep((value - mid) / (end - mid));
}

// The rim contour: a near-circle with gentle fixed harmonics on the radius and
// a depth undulation, so the frame reads as a hand-formed 3D object instead of
// a flat circle. The aperture mask and the rim tube share these functions.
function contourRadius(theta: number, irregularity: number) {
  return RING_RADIUS * (1 + irregularity * (0.05 * Math.sin(3 * theta + 0.9) + 0.032 * Math.sin(5 * theta + 2.1) + 0.02 * Math.sin(8 * theta + 4.4)));
}

function contourDepth(theta: number, irregularity: number) {
  return irregularity * (0.09 * Math.sin(2 * theta + 1.3) + 0.055 * Math.sin(5 * theta + 3.7));
}

/** Triangle fan over the irregular contour, with a 0-center → 1-edge radial attribute. */
function buildApertureGeometry(irregularity: number) {
  const positions: number[] = [0, 0, 0];
  const radial: number[] = [0];
  for (let index = 0; index <= CONTOUR_SEGMENTS; index += 1) {
    const theta = (index / CONTOUR_SEGMENTS) * Math.PI * 2;
    const radius = contourRadius(theta, irregularity);
    positions.push(Math.cos(theta) * radius, Math.sin(theta) * radius, 0);
    radial.push(1);
  }
  const indices: number[] = [];
  for (let index = 1; index <= CONTOUR_SEGMENTS; index += 1) indices.push(0, index, index + 1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aRadial", new THREE.Float32BufferAttribute(radial, 1));
  geometry.setIndex(indices);
  return geometry;
}

function buildRimGeometry(irregularity: number) {
  const points: THREE.Vector3[] = [];
  for (let index = 0; index < CONTOUR_SEGMENTS; index += 1) {
    const theta = (index / CONTOUR_SEGMENTS) * Math.PI * 2;
    const radius = contourRadius(theta, irregularity);
    points.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, contourDepth(theta, irregularity)));
  }
  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.5);
  return new THREE.TubeGeometry(curve, 320, RING_TUBE, 20, true);
}

/** Cover-fit a texture inside a plane of the given world size via repeat/offset. */
function coverTexture(texture: THREE.Texture, planeWidth: number, planeHeight: number, imageWidth: number, imageHeight: number) {
  const planeAspect = planeWidth / Math.max(0.0001, planeHeight);
  const imageAspect = imageWidth / Math.max(1, imageHeight);
  if (imageAspect > planeAspect) {
    const repeat = planeAspect / imageAspect;
    texture.repeat.set(repeat, 1);
    texture.offset.set((1 - repeat) / 2, 0);
  } else {
    const repeat = imageAspect / planeAspect;
    texture.repeat.set(1, repeat);
    texture.offset.set(0, (1 - repeat) / 2);
  }
}

// Sampling the origin photo in plane space with the birth morph applied — the
// backdrop plane, the aperture camouflage veil AND the rim share this, so the
// warp is pixel-continuous across the portal's edge: the portal is literally
// born from a few of the photo's own pixels bending.
const ORIGIN_SAMPLE_GLSL = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uCover;
  uniform vec2 uOffset;
  uniform vec2 uPlaneHalf;
  uniform float uDim;
  uniform float uWarp;
  uniform float uWarpRadius;
  uniform float uSpin;
  uniform float uTime;
  vec3 sampleOriginWarped(vec2 planeXY) {
    float d = length(planeXY);
    float influence = smoothstep(uWarpRadius, 0., d) * uWarp;
    // A true vortex driven purely by scroll: uSpin is the accumulated angle
    // at the heart (decaying outward). Scrolling turns it, stopping freezes
    // it, reverse scroll unwinds it — like every other beat of the scrub.
    float spin = influence * uSpin;
    float cs = cos(spin);
    float sn = sin(spin);
    vec2 swirled = vec2(planeXY.x * cs - planeXY.y * sn, planeXY.x * sn + planeXY.y * cs);
    vec2 dir = d > .0001 ? planeXY / d : vec2(0.);
    // …pulled hard toward the heart, with concentric ripples tied to the
    // same scroll drive.
    float ripple = sin(d * 3.2 - uSpin * .9) * ${(WARP_RADIUS * 0.1).toFixed(4)};
    vec2 displaced = swirled - dir * influence * (uWarpRadius * .5 - ripple);
    vec2 uv = uOffset + clamp(displaced / (2. * uPlaneHalf) + .5, 0., 1.) * uCover;
    vec3 color = texture2D(uMap, uv).rgb * uDim;
    // The morph heart glows with its OWN pixels — no foreign color.
    return color + color * influence * .45;
  }
`;

// The rim is the boundary between the two worlds, so it wears both skins:
// the half facing the aperture is destination matter, the half facing the
// surrounding scene is origin matter, blended across the contour crest. Local
// disc coordinates map each texture to a centered crop; fresnel lighting and
// a soft accent glow keep it 3D.
const RIM_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vLocal;
  varying vec3 vWorld;
  void main() {
    float angle = uv.x * 6.2831853;
    // Thickness variation along the contour plus a slow traveling wave — the
    // tube reads as living matter, not an extruded profile. The total stays
    // well under the tube radius so the rim keeps covering the aperture seam.
    float swell = sin(angle * 7. + 1.7) * .022 + sin(angle * 13. + 4.2) * .014 + sin(angle * 5. - uTime * 1.1) * .012;
    vec3 transformed = position + normal * swell;
    vLocal = transformed.xy;
    vec4 world = modelMatrix * vec4(transformed, 1.);
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    vNormal = normalMatrix * normal;
    vView = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const RIM_FRAGMENT = /* glsl */ `
  precision highp float;
  ${""}${ORIGIN_SAMPLE_GLSL}
  uniform sampler2D uMapInner;
  uniform sampler2D uMapOuter;
  uniform vec2 uUvScaleInner;
  uniform vec2 uUvScaleOuter;
  uniform vec3 uGlow;
  uniform float uEmerge;
  uniform float uFade;
  uniform float uPulse;
  uniform float uIrregularity;
  uniform float uOuterDim;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vLocal;
  varying vec3 vWorld;
  void main() {
    // Same contour harmonics as the geometry: split the tube at its crest —
    // inside the contour the rim is destination matter, outside origin matter.
    // The meniscus between the two ripples slowly, like a liquid seam.
    float theta = atan(vLocal.y, vLocal.x);
    float contour = ${RING_RADIUS.toFixed(4)} * (1. + uIrregularity * (.05 * sin(3. * theta + .9) + .032 * sin(5. * theta + 2.1) + .02 * sin(8. * theta + 4.4)));
    float meniscus = sin(theta * 9. + uTime * 1.2) * .012 + sin(theta * 5. - uTime * .7) * .009;
    float toOuter = smoothstep(${(-RING_TUBE * 0.45).toFixed(4)}, ${(RING_TUBE * 0.45).toFixed(4)}, length(vLocal) - contour + meniscus);
    // Liquid glass, in place: the sampled world pixels ripple as if refracted
    // through moving glass — no circulation around the ring.
    vec2 wobble = vec2(
      sin(vLocal.y * 6.5 + uTime * 1.5) + sin(vLocal.x * 9. - uTime * 1.1),
      cos(vLocal.x * 7. - uTime * 1.3) + cos(vLocal.y * 8.5 + uTime * .9)
    ) * .05;
    vec2 liquid = vLocal + wobble;
    vec3 inner = texture2D(uMapInner, clamp(vec2(.5) + liquid * uUvScaleInner, 0., 1.)).rgb;
    vec3 outer = texture2D(uMapOuter, clamp(vec2(.5) + liquid * uUvScaleOuter, 0., 1.)).rgb * uOuterDim;
    vec3 matter = mix(inner, outer, toOuter);
    float fresnel = pow(1. - abs(dot(normalize(vNormal), normalize(vView))), 1.6);
    // A glassy highlight breathes back and forth in place.
    float sheen = pow(.5 + .5 * sin(theta * 2. + sin(uTime * .5) * 1.6), 10.);
    vec3 lit = matter * (.78 + .5 * fresnel) + uGlow * fresnel * .18 + vec3(1.) * sheen * fresnel * .35 + (matter + vec3(.55)) * uPulse * .8;
    // Birth camouflage: the rim starts as the photo's own bent pixels — the
    // same ray-projected, warped sample as the aperture veil, with NO shading
    // of its own (any fresnel tint would trace a readable ring outline far
    // too early) — and its true dual-world matter emerges only with
    // proximity. Encode to sRGB manually (ShaderMaterial skips the renderer's
    // output encode) so the matter matches the photo planes.
    vec3 rayDirection = vWorld - cameraPosition;
    float t = (${ORIGIN_PLANE_Z.toFixed(1)} - cameraPosition.z) / min(-.0001, rayDirection.z);
    vec3 camo = sampleOriginWarped(cameraPosition.xy + rayDirection.xy * t);
    vec3 outColor = pow(max(mix(camo, lit, uEmerge), 0.), vec3(.4545));
    gl_FragColor = vec4(outColor, uFade);
  }
`;

// The halo quad is HALO_REACH times the ring radius per side; the glow peaks
// around the ring circumference.
const HALO_REACH = 1.9;
const HALO_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - .5) * 2.;
    float glow = exp(-pow(abs(d - ${(1 / HALO_REACH).toFixed(4)}) * 9., 1.35));
    gl_FragColor = vec4(uColor * glow * uIntensity, glow * uIntensity);
  }
`;

const QUAD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`;

const ORIGIN_VERTEX = /* glsl */ `
  varying vec2 vLocal;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.);
    vLocal = world.xy;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const ORIGIN_FRAGMENT = /* glsl */ `
  precision highp float;
  ${""}${ORIGIN_SAMPLE_GLSL}
  varying vec2 vLocal;
  void main() {
    vec3 color = sampleOriginWarped(vLocal);
    gl_FragColor = vec4(pow(max(color, 0.), vec3(.4545)), 1.);
  }
`;

// The camouflage veil over the aperture: it renders exactly what the origin
// backdrop would show along each ray (same warp), so at birth the aperture is
// invisible — the destination only bleeds through as the veil dissolves with
// proximity.
const VEIL_VERTEX = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const VEIL_FRAGMENT = /* glsl */ `
  precision highp float;
  ${""}${ORIGIN_SAMPLE_GLSL}
  uniform float uOpacity;
  uniform float uPlaneZ;
  varying vec3 vWorld;
  void main() {
    vec3 rayDirection = vWorld - cameraPosition;
    float t = (uPlaneZ - cameraPosition.z) / min(-.0001, rayDirection.z);
    vec2 hit = cameraPosition.xy + rayDirection.xy * t;
    vec3 color = sampleOriginWarped(hit);
    gl_FragColor = vec4(pow(max(color, 0.), vec3(.4545)), uOpacity);
  }
`;

// Energy film over the aperture: a rippling veil that makes the arrival read
// as a surface, then dissolves as the camera commits to the approach.
const FILM_VERTEX = /* glsl */ `
  attribute float aRadial;
  varying float vRadial;
  void main() {
    vRadial = aRadial;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`;

const FILM_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uVeil;
  uniform float uCenter;
  varying float vRadial;
  void main() {
    float ripple = sin(vRadial * 22. - uTime * 2.2) * .5 + .5;
    // Edge-weighted at rest; uCenter spreads the glaze across the whole
    // surface as the camera nears the threshold, so the crossing reads as
    // passing through glass even once the aperture fills the viewport.
    float alpha = (smoothstep(.1, .95, vRadial) * .5 + .1 + .38 * uCenter) * (.28 + .3 * ripple) * uVeil;
    gl_FragColor = vec4(mix(uColor, vec3(1.), ripple * .3) * alpha, alpha);
  }
`;

function renderOverlay(overlay: PortalCrossingProps["overlay"], progress: MotionValue<number>) {
  return typeof overlay === "function" ? overlay(progress) : overlay;
}

function CrossingBloom({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (value) => bell(value, PORTAL_CROSSING_AT - 0.06, PORTAL_CROSSING_AT + 0.005, PORTAL_CROSSING_AT + 0.16) * 0.9);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 mix-blend-screen"
      style={{ opacity, background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,.95), rgba(190,215,255,.5) 40%, transparent 72%)" }}
    />
  );
}

// No vignette while the origin photo stands alone; it deepens as the portal
// arrives (focus toward the aperture) and lifts again inside the destination.
function FadingVignette({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, OPEN_END, PORTAL_CROSSING_AT, ARRIVAL_END], [0, 1, 1, 0.3]);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ opacity, background: "radial-gradient(circle at 50% 50%, transparent 52%, rgba(2,4,9,.55) 100%)" }}
    />
  );
}

function ArrivalLayer({ children, progress }: { children: React.ReactNode; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [ARRIVAL_START, ARRIVAL_END], [0, 1]);
  const y = useTransform(progress, [ARRIVAL_START, ARRIVAL_END], [28, 0]);
  const pointerEvents = useTransform(progress, (value) => (value > (ARRIVAL_START + ARRIVAL_END) / 2 ? "auto" : "none"));
  return (
    <motion.div className="absolute inset-0" style={{ opacity, y, pointerEvents }}>
      {children}
    </motion.div>
  );
}

/**
 * A 3D portal into another world: at rest only the origin photo is visible;
 * scroll births an irregular, depth-undulating rim — textured with the
 * destination's own matter — deep in the scene, rushing forward with real
 * perspective growth, and the scroll-only dolly then carries the camera across
 * the threshold into DOM arrival content. The cursor never influences the scene.
 */
export function PortalCrossing({
  announcement,
  arrival,
  className,
  destination,
  fallback,
  irregularity = 1,
  label,
  maxDpr = 1.6,
  origin,
  overlay,
  progress: controlledProgress,
  rimColors = DEFAULT_RIM_COLORS,
  scrollScreens = 4,
  stageClassName,
  ...props
}: PortalCrossingProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const visibleProgress = useMotionValue(0);
  const localProgress = useElementScrollProgress(rootRef);
  const source = controlledProgress ?? localProgress;
  const sourceRef = React.useRef(source);
  React.useInsertionEffect(() => {
    sourceRef.current = source;
  });
  const prefersReducedMotion = usePrefersReducedMotion();
  const viewport = useExperienceViewport();
  const originSrc = viewport === "mobile" ? origin.mobileSrc ?? origin.tabletSrc ?? origin.src : viewport === "tablet" ? origin.tabletSrc ?? origin.src : origin.src;
  const destinationSrc = viewport === "mobile" ? destination.mobileSrc ?? destination.tabletSrc ?? destination.src : viewport === "tablet" ? destination.tabletSrc ?? destination.src : destination.src;
  const resolvedAnnouncement = announcement ?? `${origin.alt}. A portal opens into: ${destination.alt}. Scrolling crosses into that world.`;

  const { ready, failed } = useWebGLStage({
    stageRef,
    canvasRef,
    enabled: !prefersReducedMotion,
    maxDpr,
    antialias: true,
    stencil: true,
    signature: JSON.stringify([destinationSrc, originSrc, irregularity, rimColors, viewport]),
    create: ({ renderer, markReady, markFailed, isDisposed, requestResize }) => {
      let smoothed = clamp01(sourceRef.current.get());
      let crossed = false;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#05070b");
      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
      camera.position.set(0, 0, CAMERA_START_Z);
      const destinationSize = new THREE.Vector2(1, 1);
      const originSize = new THREE.Vector2(1, 1);
      const disposables: { dispose: () => void }[] = [];
      const track = <T extends { dispose: () => void }>(resource: T): T => {
        disposables.push(resource);
        return resource;
      };

      // Everything that IS the portal travels from the deep as one object: the
      // aperture mask, the textured rim, the halo and the energy film.
      const portalGroup = new THREE.Group();
      scene.add(portalGroup);

      // Aperture mask: writes stencil 1 inside the irregular contour, draws no
      // color. It renders first so every masked material can test against it.
      const apertureGeometry = track(buildApertureGeometry(irregularity));
      const apertureMask = new THREE.Mesh(apertureGeometry, track(new THREE.MeshBasicMaterial()));
      apertureMask.material.colorWrite = false;
      apertureMask.material.depthWrite = false;
      apertureMask.material.stencilWrite = true;
      apertureMask.material.stencilRef = 1;
      apertureMask.material.stencilZPass = THREE.ReplaceStencilOp;
      apertureMask.renderOrder = -10;
      portalGroup.add(apertureMask);

      // Shared {value} objects: the backdrop plane, the aperture camouflage
      // veil and the rim sample the origin photo with identical cover mapping
      // and birth warp, so the morph is pixel-continuous across all three.
      const originShared = {
        uMap: { value: null as THREE.Texture | null },
        uCover: { value: new THREE.Vector2(1, 1) },
        uOffset: { value: new THREE.Vector2(0, 0) },
        uPlaneHalf: { value: new THREE.Vector2(1, 1) },
        uDim: { value: 1 },
        uWarp: { value: 0 },
        uWarpRadius: { value: 0.001 },
        uSpin: { value: 0 },
        uTime: { value: 0 },
      };
      const rimUniforms = {
        ...originShared,
        uMapInner: { value: null as THREE.Texture | null },
        uMapOuter: { value: null as THREE.Texture | null },
        uUvScaleInner: { value: new THREE.Vector2(0.12, 0.12) },
        uUvScaleOuter: { value: new THREE.Vector2(0.12, 0.12) },
        uGlow: { value: new THREE.Color(rimColors[1]) },
        uEmerge: { value: 0 },
        uFade: { value: 0 },
        uPulse: { value: 0 },
        uIrregularity: { value: irregularity },
        uOuterDim: { value: 1 },
      };
      const rim = new THREE.Mesh(
        track(buildRimGeometry(irregularity)),
        track(new THREE.ShaderMaterial({ vertexShader: RIM_VERTEX, fragmentShader: RIM_FRAGMENT, uniforms: rimUniforms, transparent: true, depthWrite: true })),
      );
      portalGroup.add(rim);

      const haloUniforms = { uColor: { value: new THREE.Color(rimColors[1]).lerp(new THREE.Color("#ffffff"), 0.35) }, uIntensity: { value: 0 } };
      const halo = new THREE.Mesh(
        track(new THREE.PlaneGeometry(1, 1)),
        track(new THREE.ShaderMaterial({ vertexShader: QUAD_VERTEX, fragmentShader: HALO_FRAGMENT, uniforms: haloUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })),
      );
      halo.scale.setScalar(RING_RADIUS * 2 * HALO_REACH);
      halo.position.z = 0.01;
      portalGroup.add(halo);

      const veilUniforms = { ...originShared, uOpacity: { value: 1 }, uPlaneZ: { value: ORIGIN_PLANE_Z } };
      const veil = new THREE.Mesh(
        apertureGeometry,
        track(new THREE.ShaderMaterial({ vertexShader: VEIL_VERTEX, fragmentShader: VEIL_FRAGMENT, uniforms: veilUniforms, transparent: true, depthWrite: false })),
      );
      veil.position.z = 0.002;
      portalGroup.add(veil);

      const filmUniforms = { uColor: { value: new THREE.Color(rimColors[1]) }, uTime: { value: 0 }, uVeil: { value: 0 }, uCenter: { value: 0 } };
      const film = new THREE.Mesh(
        apertureGeometry,
        track(new THREE.ShaderMaterial({ vertexShader: FILM_VERTEX, fragmentShader: FILM_FRAGMENT, uniforms: filmUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })),
      );
      film.position.z = 0.005;
      portalGroup.add(film);

      // Destination world — visible only through the aperture until crossing.
      const destinationMaterial = track(new THREE.MeshBasicMaterial());
      destinationMaterial.stencilWrite = true;
      destinationMaterial.stencilRef = 1;
      destinationMaterial.stencilFunc = THREE.EqualStencilFunc;
      const destinationPlane = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), destinationMaterial);
      destinationPlane.position.z = DESTINATION_PLANE_Z;
      scene.add(destinationPlane);

      // Origin world — the full-bleed photo, masked to everywhere EXCEPT the
      // aperture so the destination alone owns the inside of the portal. A
      // shader material so a patch of its own pixels can morph at the birth.
      const originMaterial = track(new THREE.ShaderMaterial({ vertexShader: ORIGIN_VERTEX, fragmentShader: ORIGIN_FRAGMENT, uniforms: originShared }));
      originMaterial.stencilWrite = true;
      originMaterial.stencilRef = 1;
      originMaterial.stencilFunc = THREE.NotEqualStencilFunc;
      const originPlane = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), originMaterial);
      originPlane.position.z = ORIGIN_PLANE_Z;
      scene.add(originPlane);

      const loader = new THREE.TextureLoader();
      const prepare = (texture: THREE.Texture, size: THREE.Vector2) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        const image = texture.image as HTMLImageElement;
        size.set(image.naturalWidth, image.naturalHeight);
        return track(texture);
      };
      Promise.all([
        loader.loadAsync(destinationSrc).then((texture) => {
          if (isDisposed()) return texture.dispose();
          prepare(texture, destinationSize);
          destinationMaterial.map = texture;
          destinationMaterial.needsUpdate = true;
          // The rim samples the same textures raw (repeat/offset do not apply
          // to the shader): map the portal disc onto a centered crop.
          rimUniforms.uMapInner.value = texture;
          rimUniforms.uUvScaleInner.value.set(0.12 * (destinationSize.y / Math.max(1, destinationSize.x)), 0.12);
        }),
        loader.loadAsync(originSrc).then((texture) => {
          if (isDisposed()) return texture.dispose();
          prepare(texture, originSize);
          originShared.uMap.value = texture;
          rimUniforms.uMapOuter.value = texture;
          rimUniforms.uUvScaleOuter.value.set(0.12 * (originSize.y / Math.max(1, originSize.x)), 0.12);
        }),
      ])
        .then(() => {
          if (isDisposed()) return;
          requestResize();
          markReady();
        })
        .catch(() => markFailed());

      // The projection of the settled aperture onto the destination plane, as
      // seen from the dolly start — the plane must cover it so the world
      // through the portal never shows its own edges.
      const apertureNeed = CONTOUR_MAX * ((DOLLY_START_Z - DESTINATION_PLANE_Z) / DOLLY_START_Z) + 0.2;
      const endHalfHeight = (CAMERA_END_Z - DESTINATION_PLANE_Z) * TAN_HALF_FOV;

      let seconds = 0;
      // Everything the scroll drives, derived from one progress value. Also
      // runs on bootstrap/resize renders, so a frame drawn before the loop
      // starts (background tab, restored scroll) already shows the true state.
      const applyState = (progress: number) => {
        // Linear window (the easing lives ONLY in the travel curve — double
        // easing compounds flat spots at both ends of the arrival).
        const open = clamp01((progress - OPEN_START) / (OPEN_END - OPEN_START));
        const dolly = clamp01((progress - DOLLY_FROM) / (1 - DOLLY_FROM));

        // Additive camera path: the arrival push-in and the dolly overlap, so
        // the camera-portal relative motion never fully stops mid-scroll.
        camera.position.z = CAMERA_START_Z - OPEN_PUSH * open + (CAMERA_END_Z - DOLLY_START_Z) * easeInOutCubic(dolly);

        // Once the camera is through, drop the masking: the destination owns
        // the whole frame and the portal (behind the camera) goes away.
        // Reverse scroll re-crosses and restores the aperture.
        const nowCrossed = camera.position.z < CROSS_EPSILON;
        if (nowCrossed !== crossed) {
          crossed = nowCrossed;
          destinationMaterial.stencilWrite = !crossed;
          originPlane.visible = !crossed;
        }
        portalGroup.visible = !crossed && open > 0.001;
        // The portal physically travels from the deep toward the camera —
        // no scaling, only real approach: its on-screen growth is pure
        // perspective. It starts gently and decelerates into place.
        const travel = easeInOutCubic(open);
        portalGroup.position.z = mix(PORTAL_BORN_Z, PORTAL_REST_Z, travel);
        // An arrival spin that settles to rest — no perpetual rotation, the
        // liquid matter moves in place instead.
        portalGroup.rotation.z = -0.9 * (1 - travel);
        // Atmospheric emergence from the real distance: far away the portal is
        // indistinguishable from the horizon haze (rim hazed, aperture veiled)
        // and it gains contrast continuously as it approaches. The alpha fade
        // is only a micro anti-pop for the very first frames.
        // The destination bleeds through only in the second half of the
        // approach, over a wide distance window — late and gradual.
        const distance = camera.position.z - portalGroup.position.z;
        const emerge = 1 - smoothstep((distance - 6) / 16);
        const fade = smoothstep(open / 0.12);

        // The birth morph: a patch of the photo's own pixels warps (pucker +
        // gentle swirl) exactly where the portal is born, peaks while the
        // portal is still far, and releases as it solidifies and approaches.
        // The vortex amplitude ramps in and HOLDS — decaying it would visibly
        // unwind the spin. The release happens via footprint instead: the
        // radius shrinks only late, when the approaching portal's silhouette
        // already covers the whole warp region, so nothing rotates backward.
        originShared.uWarp.value = smoothstep(open / 0.35);
        originShared.uWarpRadius.value = Math.max(0.001, WARP_RADIUS * smoothstep(open / 0.3) * (1 - smoothstep((open - 0.7) / 0.22)));
        // The spiral winds up with scroll alone — ~1.5 turns at the heart
        // across the arrival, at a constant rate per scrolled pixel.
        originShared.uSpin.value = open * 9;
        originShared.uTime.value = seconds;
        // The origin photo stands untouched at rest, then recedes slightly
        // while the portal takes focus; the rim's origin-facing half dims in
        // sync so the boundary stays coherent with the scene around it.
        originShared.uDim.value = 1 - 0.42 * open;
        // The rim's own matter morphs out of the camouflage in step with the
        // destination reveal — one body, one becoming.
        const rimEmerge = emerge;
        rimUniforms.uOuterDim.value = 1 - 0.22 * open;
        rimUniforms.uEmerge.value = rimEmerge;
        rimUniforms.uFade.value = fade;
        rimUniforms.uPulse.value = bell(progress, PORTAL_CROSSING_AT - 0.1, PORTAL_CROSSING_AT, PORTAL_CROSSING_AT + 0.05);
        // The camouflage veil hides the destination from frame one (it shows
        // the origin's own warped pixels) and dissolves purely with proximity.
        veilUniforms.uOpacity.value = 1 - emerge;
        haloUniforms.uIntensity.value = 0.75 * fade * rimEmerge;
        filmUniforms.uTime.value = seconds;
        // A glossy membrane holds over the aperture all the way to the
        // threshold — the crossing reads as passing THROUGH glass — swelling
        // slightly on approach and dissolving only in the final breath,
        // under the bloom.
        const approach = smoothstep((progress - DOLLY_FROM) / (PORTAL_CROSSING_AT - DOLLY_FROM));
        const membrane = 1 - smoothstep((progress - (PORTAL_CROSSING_AT - 0.06)) / 0.055);
        filmUniforms.uVeil.value = fade * rimEmerge * (0.7 + 0.45 * approach) * membrane;
        filmUniforms.uCenter.value = approach;
      };

      return {
        // Never supersample the destination past its texel density at the
        // arrival frame, where only endHalfHeight of the plane fills the view.
        getDpr: (width, height) => {
          const aspect = width / Math.max(1, height);
          const halfHeight = Math.max(endHalfHeight * 1.14, apertureNeed);
          const halfWidth = Math.max(endHalfHeight * aspect * 1.14, apertureNeed);
          const coveredHeight = destinationSize.y * Math.min(1, (destinationSize.x / destinationSize.y) / (halfWidth / halfHeight));
          return Math.max(0.75, (coveredHeight * (endHalfHeight / halfHeight)) / Math.max(1, height));
        },
        onResize: (width, height) => {
          const aspect = width / Math.max(1, height);
          camera.aspect = aspect;
          camera.updateProjectionMatrix();
          const destinationHalfHeight = Math.max(endHalfHeight * 1.14, apertureNeed);
          const destinationHalfWidth = Math.max(endHalfHeight * aspect * 1.14, apertureNeed);
          destinationPlane.scale.set(destinationHalfWidth * 2, destinationHalfHeight * 2, 1);
          if (destinationMaterial.map) coverTexture(destinationMaterial.map, destinationHalfWidth, destinationHalfHeight, destinationSize.x, destinationSize.y);
          const originHalfHeight = (CAMERA_START_Z - ORIGIN_PLANE_Z) * TAN_HALF_FOV * 1.06;
          const originHalfWidth = originHalfHeight * aspect;
          originPlane.scale.set(originHalfWidth * 2, originHalfHeight * 2, 1);
          // Cover-fit goes into the shared shader uniforms (the origin shader
          // ignores texture.repeat/offset).
          originShared.uPlaneHalf.value.set(originHalfWidth, originHalfHeight);
          const originPlaneAspect = originHalfWidth / originHalfHeight;
          const originImageAspect = originSize.x / Math.max(1, originSize.y);
          if (originImageAspect > originPlaneAspect) {
            originShared.uCover.value.set(originPlaneAspect / originImageAspect, 1);
            originShared.uOffset.value.set((1 - originPlaneAspect / originImageAspect) / 2, 0);
          } else {
            originShared.uCover.value.set(1, originImageAspect / originPlaneAspect);
            originShared.uOffset.value.set(0, (1 - originImageAspect / originPlaneAspect) / 2);
          }
          // Resize resyncs to the raw progress (no damping lag after rotation
          // or a bootstrap render) and repaints the true state.
          smoothed = clamp01(sourceRef.current.get());
          visibleProgress.set(smoothed);
          applyState(smoothed);
          renderer.render(scene, camera);
        },
        onFrame: (delta, time) => {
          seconds = time / 1000;
          smoothed = damp(smoothed, clamp01(sourceRef.current.get()), 10, delta);
          visibleProgress.set(smoothed);
          applyState(smoothed);
          renderer.render(scene, camera);
        },
        dispose: () => {
          disposables.forEach((resource) => resource.dispose());
        },
      };
    },
  });

  if (prefersReducedMotion) {
    return (
      <section ref={rootRef} aria-label={label} data-portal-crossing data-experience-viewport={viewport} data-reduced-motion className={cn("relative min-h-svh overflow-hidden bg-black", className)} {...props}>
        {fallback ?? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- registry source stays framework-neutral. */}
            <img alt={destination.alt} src={destinationSrc} className="absolute inset-0 size-full object-cover" />
            {arrival ? <div className="relative z-10 min-h-svh">{arrival}</div> : null}
          </>
        )}
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-portal-crossing
      data-experience-viewport={viewport}
      data-ready={ready || undefined}
      data-fallback={failed || undefined}
      className={cn("relative isolate", className)}
      style={{ minHeight: `${Math.max(1, scrollScreens) * 100}svh` }}
      {...props}
    >
      <span className="sr-only">{resolvedAnnouncement}</span>
      <div ref={stageRef} className={cn("sticky top-0 h-svh overflow-hidden bg-[#05070b]", stageClassName)}>
        <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 size-full transition-opacity duration-700", ready && !failed ? "opacity-100" : "opacity-0")} />
        {failed ? (
          <div className="absolute inset-0">
            {fallback ?? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- registry source stays framework-neutral. */}
                <img alt={destination.alt} src={destinationSrc} className="absolute inset-0 size-full object-cover" />
                {arrival ? <div className="absolute inset-0">{arrival}</div> : null}
              </>
            )}
          </div>
        ) : (
          <>
            <FadingVignette progress={visibleProgress} />
            <CrossingBloom progress={visibleProgress} />
            {arrival ? <ArrivalLayer progress={visibleProgress}>{arrival}</ArrivalLayer> : null}
          </>
        )}
        <div className="pointer-events-none absolute inset-0">{renderOverlay(overlay, visibleProgress)}</div>
      </div>
    </section>
  );
}

"use client";

import * as React from "react";
import { motion, type MotionValue, useMotionValue, useTransform } from "motion/react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import { clamp01, damp, mix, usePrefersReducedMotion } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";
import { useWebGLStage } from "@/components/experience/use-webgl-stage";

export type PortalCrossingMedia = { src: string; alt: string };

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
// Portal arrival window within the scroll progress.
const OPEN_START = 0.04;
const OPEN_END = 0.48;
// Flip the stencil masking just before the camera reaches the near plane; at
// this distance the aperture already covers the whole viewport, so the swap is
// invisible in both scroll directions.
const CROSS_EPSILON = 0.14;
const DEFAULT_RIM_COLORS: [string, string, string] = ["#f3f6ff", "#7dd3fc", "#c4b5fd"];
const CONTOUR_SEGMENTS = 220;
// Largest radius the irregular contour can reach (see contourRadius harmonics).
const CONTOUR_MAX = RING_RADIUS * 1.11;

// Fraction of the dolly at which the camera reaches the settled portal plane,
// then the closed-form inverse of easeInOutCubic (the fraction sits in its
// upper half), mapped back onto global progress.
const CROSS_FRACTION = DOLLY_START_Z / (DOLLY_START_Z - CAMERA_END_Z);
/** Progress (0..1) at which the camera crosses the portal plane — for overlay choreography. */
export const PORTAL_CROSSING_AT = OPEN_END + (1 - Math.cbrt(2 * (1 - CROSS_FRACTION)) / 2) * (1 - OPEN_END);
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

// The rim is the boundary between the two worlds, so it wears both skins:
// the half facing the aperture is destination matter, the half facing the
// surrounding scene is origin matter, blended across the contour crest. Local
// disc coordinates map each texture to a centered crop; fresnel lighting and
// a soft accent glow keep it 3D.
const RIM_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vLocal;
  void main() {
    float angle = uv.x * 6.2831853;
    // Subtle thickness variation along the contour — the tube reads as formed
    // matter, not an extruded profile. Stays well under the tube radius so the
    // rim keeps covering the aperture seam.
    vec3 transformed = position + normal * (sin(angle * 7. + 1.7) * .022 + sin(angle * 13. + 4.2) * .014);
    vLocal = transformed.xy;
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
    vNormal = normalMatrix * normal;
    vView = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const RIM_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D uMapInner;
  uniform sampler2D uMapOuter;
  uniform vec2 uUvScaleInner;
  uniform vec2 uUvScaleOuter;
  uniform vec3 uGlow;
  uniform float uFade;
  uniform float uPulse;
  uniform float uIrregularity;
  uniform float uOuterDim;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vLocal;
  void main() {
    // Same contour harmonics as the geometry: split the tube at its crest —
    // inside the contour the rim is destination matter, outside origin matter.
    float theta = atan(vLocal.y, vLocal.x);
    float contour = ${RING_RADIUS.toFixed(4)} * (1. + uIrregularity * (.05 * sin(3. * theta + .9) + .032 * sin(5. * theta + 2.1) + .02 * sin(8. * theta + 4.4)));
    float toOuter = smoothstep(${(-RING_TUBE * 0.45).toFixed(4)}, ${(RING_TUBE * 0.45).toFixed(4)}, length(vLocal) - contour);
    vec3 inner = texture2D(uMapInner, clamp(vec2(.5) + vLocal * uUvScaleInner, 0., 1.)).rgb;
    vec3 outer = texture2D(uMapOuter, clamp(vec2(.5) + vLocal * uUvScaleOuter, 0., 1.)).rgb * uOuterDim;
    vec3 matter = mix(inner, outer, toOuter);
    float fresnel = pow(1. - abs(dot(normalize(vNormal), normalize(vView))), 1.6);
    vec3 lit = matter * (.78 + .5 * fresnel) + uGlow * fresnel * .18 + (matter + vec3(.55)) * uPulse * .8;
    gl_FragColor = vec4(lit, uFade);
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
  varying float vRadial;
  void main() {
    float ripple = sin(vRadial * 22. - uTime * 2.2) * .5 + .5;
    float alpha = (smoothstep(.1, .95, vRadial) * .5 + .1) * (.28 + .3 * ripple) * uVeil;
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
  const resolvedAnnouncement = announcement ?? `${origin.alt}. A portal opens into: ${destination.alt}. Scrolling crosses into that world.`;

  const { ready, failed } = useWebGLStage({
    stageRef,
    canvasRef,
    enabled: !prefersReducedMotion,
    maxDpr,
    antialias: true,
    stencil: true,
    signature: JSON.stringify([destination.src, origin.src, irregularity, rimColors]),
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

      const rimUniforms = {
        uMapInner: { value: null as THREE.Texture | null },
        uMapOuter: { value: null as THREE.Texture | null },
        uUvScaleInner: { value: new THREE.Vector2(0.12, 0.12) },
        uUvScaleOuter: { value: new THREE.Vector2(0.12, 0.12) },
        uGlow: { value: new THREE.Color(rimColors[1]) },
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

      const filmUniforms = { uColor: { value: new THREE.Color(rimColors[1]) }, uTime: { value: 0 }, uVeil: { value: 0 } };
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
      // aperture so the destination alone owns the inside of the portal.
      const originMaterial = track(new THREE.MeshBasicMaterial());
      originMaterial.stencilWrite = true;
      originMaterial.stencilRef = 1;
      originMaterial.stencilFunc = THREE.NotEqualStencilFunc;
      const originPlane = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), originMaterial);
      originPlane.position.z = ORIGIN_PLANE_Z;
      scene.add(originPlane);

      const loader = new THREE.TextureLoader();
      const configure = (texture: THREE.Texture, size: THREE.Vector2, material: THREE.MeshBasicMaterial) => {
        if (isDisposed()) return texture.dispose();
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        const image = texture.image as HTMLImageElement;
        size.set(image.naturalWidth, image.naturalHeight);
        material.map = track(texture);
        material.needsUpdate = true;
      };
      Promise.all([
        loader.loadAsync(destination.src).then((texture) => {
          configure(texture, destinationSize, destinationMaterial);
          if (isDisposed()) return;
          // The rim samples the same textures raw (repeat/offset do not apply
          // to the shader): map the portal disc onto a centered crop.
          rimUniforms.uMapInner.value = texture;
          rimUniforms.uUvScaleInner.value.set(0.12 * (destinationSize.y / Math.max(1, destinationSize.x)), 0.12);
        }),
        loader.loadAsync(origin.src).then((texture) => {
          configure(texture, originSize, originMaterial);
          if (isDisposed()) return;
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
        const open = smoothstep((progress - OPEN_START) / (OPEN_END - OPEN_START));
        const dolly = clamp01((progress - OPEN_END) / (1 - OPEN_END));

        camera.position.z = dolly > 0 ? mix(DOLLY_START_Z, CAMERA_END_Z, easeInOutCubic(dolly)) : CAMERA_START_Z - OPEN_PUSH * open;

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
        // The portal glides forward from the deep — starting gently, then
        // decelerating into place. Its on-screen growth is real perspective,
        // not a scale trick.
        const travel = easeInOutCubic(open);
        portalGroup.position.z = mix(PORTAL_BORN_Z, PORTAL_REST_Z, travel);
        // A slow drift plus an arrival spin — the irregular contour visibly
        // turning is what sells the portal as a formed 3D object.
        portalGroup.rotation.z = -0.9 * (1 - travel) + seconds * 0.02;
        // The distant birth condenses gradually out of the haze — full
        // presence only past the middle of the journey.
        const fade = smoothstep(open / 0.55);

        // The origin photo stands untouched at rest, then recedes slightly
        // while the portal takes focus; the rim's origin-facing half dims in
        // sync so the boundary stays coherent with the scene around it.
        originMaterial.color.setScalar(1 - 0.42 * open);
        rimUniforms.uOuterDim.value = 1 - 0.22 * open;
        rimUniforms.uFade.value = fade;
        rimUniforms.uPulse.value = bell(progress, PORTAL_CROSSING_AT - 0.1, PORTAL_CROSSING_AT, PORTAL_CROSSING_AT + 0.05);
        haloUniforms.uIntensity.value = 0.7 * fade * open;
        filmUniforms.uTime.value = seconds;
        filmUniforms.uVeil.value = fade * (1 - smoothstep((progress - OPEN_END) / ((PORTAL_CROSSING_AT - OPEN_END) * 0.6)));
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
          if (originMaterial.map) coverTexture(originMaterial.map, originHalfWidth, originHalfHeight, originSize.x, originSize.y);
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
      <section ref={rootRef} aria-label={label} data-portal-crossing data-reduced-motion className={cn("relative min-h-svh overflow-hidden bg-black", className)} {...props}>
        {fallback ?? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- registry source stays framework-neutral. */}
            <img alt={destination.alt} src={destination.src} className="absolute inset-0 size-full object-cover" />
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
                <img alt={destination.alt} src={destination.src} className="absolute inset-0 size-full object-cover" />
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

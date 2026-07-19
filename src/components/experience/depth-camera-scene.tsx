"use client";

import * as React from "react";
import { type MotionValue, useMotionValue, useReducedMotion } from "motion/react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import {
  damp,
  mix,
  resolveKeyframes,
  sortKeyframes,
  useHydrated,
  useMediaQuery,
} from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";
import {
  useWebGLStage,
  type WebGLStageContext,
  type WebGLStageHandle,
} from "@/components/experience/use-webgl-stage";

export type DepthCameraLayerKeyframe = {
  at: number;
  x?: number;
  y?: number;
  z?: number;
  scale?: number;
  opacity?: number;
};

export type DepthCameraBounds = {
  /** Normalized placement inside the registered master canvas. */
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DepthCameraWorldEffectKeyframe = {
  at: number;
  blur?: number;
  brightness?: number;
  saturation?: number;
};

export type DepthCameraLayer = {
  id: string;
  src: string;
  mobileSrc?: string;
  plane: "back" | "front";
  depth: number;
  opacity?: number;
  /**
   * Render this plate without alpha blending. Use for the fully covering
   * backdrop plate so it composites as a solid base instead of blending.
   * Front-plane layers always blend (they sit over the DOM sandwich).
   */
  opaque?: boolean;
  /** Purely decorative plate that low-power devices skip to save a texture and a full-screen blend pass. */
  dropOnLowPower?: boolean;
  /**
   * Places a trimmed high-resolution texture inside the registered canvas.
   * This avoids shipping a mostly-transparent 4K full-canvas plate.
   */
  bounds?: DepthCameraBounds;
  /** Aspect ratio of the registered master canvas used by `bounds`. */
  canvasAspect?: number;
  timeline?: DepthCameraLayerKeyframe[];
};

export type DepthCameraBeat = {
  at: number;
  x?: number;
  y?: number;
  z: number;
  lookX?: number;
  lookY?: number;
  fov?: number;
};

export type DepthCameraSceneProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  layers: DepthCameraLayer[];
  poster: string;
  mobilePoster?: string;
  camera?: DepthCameraBeat[];
  scrollScreens?: number;
  smoothing?: number;
  maxDpr?: number;
  pointerStrength?: number;
  progress?: MotionValue<number>;
  /** Unblurred continuity layer rendered over the world pass and under copy/subjects. */
  persistentBackdrop?: React.ReactNode;
  /** CSS post effects applied only to the back WebGL world pass. */
  worldEffects?: DepthCameraWorldEffectKeyframe[];
  backOverlay?: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  frontOverlay?: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  reducedMotionFallback?: React.ReactNode;
  stageClassName?: string;
  onProgressChange?: (progress: number) => void;
  mobileBreakpoint?: number;
};

type PlaneRecord = {
  layer: DepthCameraLayer;
  frames: DepthCameraLayerKeyframe[];
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  textureAspect: number;
};

const DEFAULT_CAMERA: DepthCameraBeat[] = [
  { at: 0, x: 0, y: 0, z: 9, lookX: 0, lookY: 0, fov: 46 },
  { at: 0.18, x: 0, y: 0, z: 8.1, lookX: 0, lookY: 0, fov: 45 },
  { at: 0.43, x: 0.08, y: 0.03, z: 6.25, lookX: 0.02, lookY: 0, fov: 43 },
  { at: 0.68, x: 0.26, y: 0.08, z: 4.35, lookX: 0.1, lookY: 0.01, fov: 41 },
  { at: 0.88, x: 0.58, y: 0.12, z: 3.15, lookX: 0.26, lookY: 0.02, fov: 39 },
  { at: 1, x: 0.72, y: 0.15, z: 2.72, lookX: 0.34, lookY: 0.02, fov: 38 },
];

const DEFAULT_TIMELINE: DepthCameraLayerKeyframe[] = [{ at: 0 }, { at: 1 }];
const DEFAULT_WORLD_EFFECTS: DepthCameraWorldEffectKeyframe[] = [
  { at: 0, blur: 0, brightness: 1, saturation: 1 },
  { at: 1, blur: 0, brightness: 1, saturation: 1 },
];

function resolveNumber(value: number | undefined, fallback: number) {
  return value ?? fallback;
}

function sampleCamera(frames: DepthCameraBeat[], progress: number) {
  const { from, to, mix: amount } = resolveKeyframes(frames, progress);
  return {
    x: mix(resolveNumber(from.x, 0), resolveNumber(to.x, 0), amount),
    y: mix(resolveNumber(from.y, 0), resolveNumber(to.y, 0), amount),
    z: mix(from.z, to.z, amount),
    lookX: mix(resolveNumber(from.lookX, 0), resolveNumber(to.lookX, 0), amount),
    lookY: mix(resolveNumber(from.lookY, 0), resolveNumber(to.lookY, 0), amount),
    fov: mix(resolveNumber(from.fov, 46), resolveNumber(to.fov, 46), amount),
  };
}

function sampleLayer(record: PlaneRecord, progress: number) {
  const baseOpacity = record.layer.opacity ?? 1;
  const { from, to, mix: amount } = resolveKeyframes(record.frames, progress);
  return {
    x: mix(resolveNumber(from.x, 0), resolveNumber(to.x, 0), amount),
    y: mix(resolveNumber(from.y, 0), resolveNumber(to.y, 0), amount),
    z: mix(resolveNumber(from.z, 0), resolveNumber(to.z, 0), amount),
    scale: mix(resolveNumber(from.scale, 1), resolveNumber(to.scale, 1), amount),
    opacity: mix(
      resolveNumber(from.opacity, baseOpacity),
      resolveNumber(to.opacity, baseOpacity),
      amount,
    ),
  };
}

function sampleWorldEffect(frames: DepthCameraWorldEffectKeyframe[], progress: number) {
  const { from, to, mix: amount } = resolveKeyframes(frames, progress);
  return {
    blur: mix(resolveNumber(from.blur, 0), resolveNumber(to.blur, 0), amount),
    brightness: mix(resolveNumber(from.brightness, 1), resolveNumber(to.brightness, 1), amount),
    saturation: mix(resolveNumber(from.saturation, 1), resolveNumber(to.saturation, 1), amount),
  };
}

function renderOverlay(
  overlay: DepthCameraSceneProps["backOverlay"] | DepthCameraSceneProps["frontOverlay"],
  progress: MotionValue<number>,
) {
  return typeof overlay === "function" ? overlay(progress) : overlay;
}

/**
 * A real-camera 2.5D engine for registered, full-canvas raster plates.
 * Back and front WebGL passes sandwich semantic DOM, so copy can be truly
 * occluded by the hero/foreground instead of faking depth with z-index alone.
 */
export function DepthCameraScene({
  backOverlay,
  camera = DEFAULT_CAMERA,
  className,
  frontOverlay,
  label,
  layers,
  maxDpr = 1.75,
  mobileBreakpoint = 768,
  mobilePoster,
  onPointerLeave,
  onPointerMove,
  onProgressChange,
  persistentBackdrop,
  pointerStrength = 0.11,
  poster,
  progress: controlledProgress,
  reducedMotionFallback,
  scrollScreens = 6,
  smoothing = 10,
  stageClassName,
  style,
  worldEffects = DEFAULT_WORLD_EFFECTS,
  ...props
}: DepthCameraSceneProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const backCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const frontCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const pointerRef = React.useRef({ x: 0, y: 0 });
  const targetPointerRef = React.useRef({ x: 0, y: 0 });
  const smoothedRef = React.useRef(0);
  const rawProgress = useElementScrollProgress(rootRef);
  const visibleProgress = useMotionValue(0);
  const reducedMotion = useReducedMotion();
  const hydrated = useHydrated();
  const mobile = useMediaQuery(`(max-width: ${mobileBreakpoint - 0.02}px)`);
  const sceneProgress = controlledProgress ?? rawProgress;
  const prefersReducedMotion = hydrated && Boolean(reducedMotion);
  const lowPower = typeof navigator !== "undefined" && (navigator.hardwareConcurrency ?? 8) <= 4;

  // Per-frame inputs flow through a ref so identity changes never rebuild the scene.
  const runtimeRef = React.useRef({ onProgressChange, pointerStrength, sceneProgress, smoothing });
  React.useInsertionEffect(() => {
    runtimeRef.current = { onProgressChange, pointerStrength, sceneProgress, smoothing };
  });

  const layerSignature = React.useMemo(() => JSON.stringify(layers), [layers]);
  const cameraSignature = React.useMemo(() => JSON.stringify(camera), [camera]);
  const effectsSignature = React.useMemo(() => JSON.stringify(worldEffects), [worldEffects]);
  const sceneSignature = `${layerSignature}|${cameraSignature}|${effectsSignature}|${mobile ? "mobile" : "desktop"}`;

  const buildPass = (plane: DepthCameraLayer["plane"], context: WebGLStageContext): WebGLStageHandle => {
    const { renderer, markReady, markFailed, isDisposed, requestResize } = context;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const cameraFrames = sortKeyframes(camera);
    const worldEffectFrames = sortKeyframes(worldEffects);
    const initialBeat = sampleCamera(cameraFrames, 0);
    const passCamera = new THREE.PerspectiveCamera(initialBeat.fov, 1, 0.05, 100);
    passCamera.position.set(initialBeat.x, initialBeat.y, initialBeat.z);
    passCamera.lookAt(initialBeat.lookX, initialBeat.lookY, 0);
    const records: PlaneRecord[] = [];
    const passLayers = layers.filter(
      (layer) => layer.plane === plane && !(lowPower && layer.dropOnLowPower),
    );
    const loader = new THREE.TextureLoader();
    if (plane === "back") {
      smoothedRef.current = runtimeRef.current.sceneProgress.get();
    }

    Promise.all(passLayers.map(async (layer, index) => {
      const source = mobile && layer.mobileSrc ? layer.mobileSrc : layer.src;
      const texture = await loader.loadAsync(source);
      if (isDisposed()) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      const image = texture.image as HTMLImageElement;
      const textureAspect = Math.max(0.01, image.naturalWidth / Math.max(1, image.naturalHeight));
      const geometry = new THREE.PlaneGeometry(textureAspect, 1, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: layer.plane === "front" || !layer.opaque,
        opacity: layer.opacity ?? 1,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = layer.depth;
      mesh.renderOrder = index;
      scene.add(mesh);
      records.push({
        layer,
        frames: sortKeyframes(layer.timeline?.length ? layer.timeline : DEFAULT_TIMELINE),
        mesh,
        textureAspect,
      });
    }))
      .then(() => {
        if (isDisposed()) return;
        requestResize();
        markReady();
      })
      .catch(() => markFailed());

    const applyFrame = () => {
      const progress = smoothedRef.current;
      const strength = runtimeRef.current.pointerStrength;
      const sampled = sampleCamera(cameraFrames, progress);
      const pointerX = mobile ? 0 : pointerRef.current.x * strength;
      const pointerY = mobile ? 0 : pointerRef.current.y * strength;
      passCamera.position.set(sampled.x + pointerX, sampled.y - pointerY, sampled.z);
      passCamera.fov = sampled.fov;
      passCamera.lookAt(sampled.lookX + pointerX * 0.18, sampled.lookY - pointerY * 0.12, 0);
      passCamera.updateProjectionMatrix();
      for (const record of records) {
        const sampledLayer = sampleLayer(record, progress);
        const baseScaleX = resolveNumber(record.mesh.userData.baseScaleX as number | undefined, 1);
        const baseScaleY = resolveNumber(record.mesh.userData.baseScaleY as number | undefined, 1);
        const baseX = resolveNumber(record.mesh.userData.baseX as number | undefined, 0);
        const baseY = resolveNumber(record.mesh.userData.baseY as number | undefined, 0);
        record.mesh.position.set(
          baseX + sampledLayer.x,
          baseY + sampledLayer.y,
          record.layer.depth + sampledLayer.z,
        );
        record.mesh.scale.set(
          baseScaleX * sampledLayer.scale,
          baseScaleY * sampledLayer.scale,
          1,
        );
        record.mesh.material.opacity = sampledLayer.opacity;
      }
      if (plane === "back" && backCanvasRef.current) {
        const effect = sampleWorldEffect(worldEffectFrames, progress);
        backCanvasRef.current.style.filter = `blur(${effect.blur.toFixed(2)}px) brightness(${effect.brightness.toFixed(3)}) saturate(${effect.saturation.toFixed(3)})`;
        backCanvasRef.current.style.transform = `scale(${(1 + effect.blur * 0.0018).toFixed(4)})`;
      }
      renderer.render(scene, passCamera);
    };

    return {
      onResize: (width, height) => {
        const viewportAspect = width / Math.max(1, height);
        passCamera.aspect = viewportAspect;
        passCamera.updateProjectionMatrix();
        const verticalFov = THREE.MathUtils.degToRad(initialBeat.fov);
        for (const record of records) {
          const distance = Math.max(0.1, initialBeat.z - record.layer.depth);
          const visibleHeight = 2 * Math.tan(verticalFov / 2) * distance;
          const visibleWidth = visibleHeight * viewportAspect;
          if (record.layer.bounds) {
            const bounds = record.layer.bounds;
            const canvasAspect = record.layer.canvasAspect ?? 16 / 9;
            const fullCanvasFit = Math.max(visibleHeight, visibleWidth / canvasAspect) * 1.035;
            record.mesh.userData.baseScaleX =
              (fullCanvasFit * canvasAspect * bounds.width) / record.textureAspect;
            record.mesh.userData.baseScaleY = fullCanvasFit * bounds.height;
            record.mesh.userData.baseX =
              (bounds.x + bounds.width / 2 - 0.5) * fullCanvasFit * canvasAspect;
            record.mesh.userData.baseY =
              (0.5 - bounds.y - bounds.height / 2) * fullCanvasFit;
          } else {
            const fit = Math.max(visibleHeight, visibleWidth / record.textureAspect) * 1.035;
            record.mesh.userData.baseScaleX = fit;
            record.mesh.userData.baseScaleY = fit;
            record.mesh.userData.baseX = 0;
            record.mesh.userData.baseY = 0;
          }
        }
        applyFrame();
      },
      onFrame: (delta) => {
        // The back pass is the sole writer of shared progress/pointer state;
        // the front pass reads the same refs, so both passes stay registered.
        if (plane === "back") {
          const runtime = runtimeRef.current;
          smoothedRef.current = damp(smoothedRef.current, runtime.sceneProgress.get(), runtime.smoothing, delta);
          visibleProgress.set(smoothedRef.current);
          runtime.onProgressChange?.(smoothedRef.current);
          pointerRef.current.x = damp(pointerRef.current.x, targetPointerRef.current.x, 8, delta);
          pointerRef.current.y = damp(pointerRef.current.y, targetPointerRef.current.y, 8, delta);
        }
        applyFrame();
      },
      dispose: () => {
        for (const record of records) {
          record.mesh.geometry.dispose();
          record.mesh.material.map?.dispose();
          record.mesh.material.dispose();
        }
      },
    };
  };

  const stageEnabled = !prefersReducedMotion;
  const effectiveMaxDpr = lowPower ? 1.25 : maxDpr;
  const backStage = useWebGLStage({
    stageRef,
    canvasRef: backCanvasRef,
    enabled: stageEnabled,
    maxDpr: effectiveMaxDpr,
    antialias: !lowPower,
    alpha: true,
    rootMargin: "25% 0px",
    signature: sceneSignature,
    create: (context) => buildPass("back", context),
  });
  const frontStage = useWebGLStage({
    stageRef,
    canvasRef: frontCanvasRef,
    enabled: stageEnabled,
    maxDpr: effectiveMaxDpr,
    antialias: !lowPower,
    alpha: true,
    rootMargin: "25% 0px",
    signature: sceneSignature,
    create: (context) => buildPass("front", context),
  });
  const ready = backStage.ready && frontStage.ready;
  const failed = backStage.failed || frontStage.failed;

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!mobile && event.pointerType !== "touch") {
      const rect = event.currentTarget.getBoundingClientRect();
      targetPointerRef.current.x = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
      targetPointerRef.current.y = (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    }
    onPointerMove?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    targetPointerRef.current = { x: 0, y: 0 };
    onPointerLeave?.(event);
  };

  if (prefersReducedMotion && reducedMotionFallback) {
    return (
      <section ref={rootRef} aria-label={label} data-depth-camera-scene data-reduced-motion className={className} style={style} {...props}>
        {reducedMotionFallback}
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-depth-camera-scene
      data-ready={ready || undefined}
      data-fallback={failed || undefined}
      className={cn("relative isolate", className)}
      style={{ minHeight: `${Math.max(1, scrollScreens) * 100}svh`, ...style }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <div ref={stageRef} className={cn("sticky top-0 h-svh overflow-hidden bg-black", stageClassName)}>
        <picture className={cn("absolute inset-0 z-0 block transition-opacity duration-700", ready && !failed ? "opacity-0" : "opacity-100")}>
          {mobilePoster ? <source media={`(max-width: ${mobileBreakpoint - 0.02}px)`} srcSet={mobilePoster} /> : null}
          <img alt="" src={poster} className="size-full object-cover" decoding="async" fetchPriority="high" />
        </picture>
        <canvas ref={backCanvasRef} aria-hidden className={cn("absolute inset-0 z-10 size-full origin-center transition-opacity duration-500 will-change-[filter,transform]", ready && !failed ? "opacity-100" : "opacity-0")} />
        {persistentBackdrop ? (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-[15] transition-opacity duration-500",
              ready && !failed ? "opacity-100" : "opacity-0",
            )}
          >
            {persistentBackdrop}
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-0 z-20">
          {renderOverlay(backOverlay, visibleProgress)}
        </div>
        <canvas ref={frontCanvasRef} aria-hidden className={cn("pointer-events-none absolute inset-0 z-30 size-full transition-opacity duration-500", ready && !failed ? "opacity-100" : "opacity-0")} />
        <div className="pointer-events-none absolute inset-0 z-40">
          {renderOverlay(frontOverlay, visibleProgress)}
        </div>
      </div>
    </section>
  );
}

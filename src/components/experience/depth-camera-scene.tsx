"use client";

import * as React from "react";
import { type MotionValue, useMotionValue, useReducedMotion } from "motion/react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import {
  damp,
  mix,
  resolveKeyframes,
  supportsWebGL,
  useHydrated,
  useMediaQuery,
} from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type DepthCameraLayerKeyframe = {
  at: number;
  x?: number;
  y?: number;
  z?: number;
  scale?: number;
  opacity?: number;
};

export type DepthCameraLayer = {
  id: string;
  src: string;
  mobileSrc?: string;
  plane: "back" | "front";
  depth: number;
  opacity?: number;
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
  backOverlay?: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  frontOverlay?: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  reducedMotionFallback?: React.ReactNode;
  stageClassName?: string;
  onProgressChange?: (progress: number) => void;
  mobileBreakpoint?: number;
};

type PlaneRecord = {
  layer: DepthCameraLayer;
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

function sampleLayer(layer: DepthCameraLayer, progress: number) {
  const frames = layer.timeline?.length
    ? layer.timeline
    : [{ at: 0 }, { at: 1 }];
  const { from, to, mix: amount } = resolveKeyframes(frames, progress);
  return {
    x: mix(resolveNumber(from.x, 0), resolveNumber(to.x, 0), amount),
    y: mix(resolveNumber(from.y, 0), resolveNumber(to.y, 0), amount),
    z: mix(resolveNumber(from.z, 0), resolveNumber(to.z, 0), amount),
    scale: mix(resolveNumber(from.scale, 1), resolveNumber(to.scale, 1), amount),
    opacity: mix(
      resolveNumber(from.opacity, layer.opacity ?? 1),
      resolveNumber(to.opacity, layer.opacity ?? 1),
      amount,
    ),
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
  pointerStrength = 0.11,
  poster,
  progress: controlledProgress,
  reducedMotionFallback,
  scrollScreens = 6,
  smoothing = 10,
  stageClassName,
  style,
  ...props
}: DepthCameraSceneProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const backCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const frontCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const pointerRef = React.useRef({ x: 0, y: 0 });
  const targetPointerRef = React.useRef({ x: 0, y: 0 });
  const intersectionRef = React.useRef(true);
  const rawProgress = useElementScrollProgress(rootRef);
  const visibleProgress = useMotionValue(0);
  const reducedMotion = useReducedMotion();
  const hydrated = useHydrated();
  const mobile = useMediaQuery(`(max-width: ${mobileBreakpoint - 0.02}px)`);
  const sceneProgress = controlledProgress ?? rawProgress;
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const prefersReducedMotion = hydrated && Boolean(reducedMotion);
  const layerSignature = React.useMemo(
    () => layers.map((layer) => `${layer.id}:${layer.src}:${layer.mobileSrc ?? ""}`).join("|"),
    [layers],
  );

  React.useEffect(() => {
    const stage = stageRef.current;
    const backCanvas = backCanvasRef.current;
    const frontCanvas = frontCanvasRef.current;
    if (!stage || !backCanvas || !frontCanvas || prefersReducedMotion) return;
    if (!supportsWebGL()) {
      const fallbackTimer = window.setTimeout(() => setFailed(true), 0);
      return () => window.clearTimeout(fallbackTimer);
    }

    let disposed = false;
    let frame = 0;
    let previousTime = performance.now();
    let smoothed = sceneProgress.get();
    const records: PlaneRecord[] = [];
    const backScene = new THREE.Scene();
    const frontScene = new THREE.Scene();
    const firstCamera = sampleCamera(camera, 0);
    const backCamera = new THREE.PerspectiveCamera(firstCamera.fov, 1, 0.05, 100);
    const frontCamera = new THREE.PerspectiveCamera(firstCamera.fov, 1, 0.05, 100);
    const lowPower = (navigator.hardwareConcurrency ?? 8) <= 4;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : maxDpr);
    const rendererOptions: THREE.WebGLRendererParameters = {
      alpha: true,
      antialias: !lowPower,
      powerPreference: "high-performance",
      premultipliedAlpha: true,
    };
    const backRenderer = new THREE.WebGLRenderer({ ...rendererOptions, canvas: backCanvas });
    const frontRenderer = new THREE.WebGLRenderer({ ...rendererOptions, canvas: frontCanvas });
    for (const renderer of [backRenderer, frontRenderer]) {
      renderer.setPixelRatio(pixelRatio);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.setClearColor(0x000000, 0);
    }

    const abort = (event: Event) => {
      event.preventDefault();
      if (!disposed) setFailed(true);
    };
    backCanvas.addEventListener("webglcontextlost", abort);
    frontCanvas.addEventListener("webglcontextlost", abort);

    const manager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(manager);
    const activeLayers = lowPower
      ? layers.filter((layer) => layer.id !== "50-edge-frame")
      : layers;

    const load = async () => {
      const loaded = await Promise.all(activeLayers.map(async (layer, index) => {
        const source = mobile && layer.mobileSrc ? layer.mobileSrc : layer.src;
        const texture = await loader.loadAsync(source);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, backRenderer.capabilities.getMaxAnisotropy());
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        const image = texture.image as HTMLImageElement;
        const textureAspect = Math.max(0.01, image.naturalWidth / Math.max(1, image.naturalHeight));
        const geometry = new THREE.PlaneGeometry(textureAspect, 1, 1, 1);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: layer.plane === "front" || layer.id !== "00-sky",
          opacity: layer.opacity ?? 1,
          depthTest: false,
          depthWrite: false,
          toneMapped: false,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = layer.depth;
        mesh.renderOrder = index;
        (layer.plane === "back" ? backScene : frontScene).add(mesh);
        const record = { layer, mesh, textureAspect };
        records.push(record);
        return record;
      }));
      return loaded;
    };

    const fitPlanes = () => {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      const viewportAspect = width / height;
      for (const renderer of [backRenderer, frontRenderer]) renderer.setSize(width, height, false);
      for (const cameraInstance of [backCamera, frontCamera]) {
        cameraInstance.aspect = viewportAspect;
        cameraInstance.updateProjectionMatrix();
      }
      const initial = sampleCamera(camera, 0);
      const verticalFov = THREE.MathUtils.degToRad(initial.fov);
      for (const record of records) {
        const distance = Math.max(0.1, initial.z - record.layer.depth);
        const visibleHeight = 2 * Math.tan(verticalFov / 2) * distance;
        const visibleWidth = visibleHeight * viewportAspect;
        const fit = Math.max(visibleHeight, visibleWidth / record.textureAspect) * 1.035;
        record.mesh.userData.baseScale = fit;
      }
    };

    const resizeObserver = new ResizeObserver(fitPlanes);
    resizeObserver.observe(stage);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => { intersectionRef.current = Boolean(entry?.isIntersecting); },
      { rootMargin: "25% 0px" },
    );
    intersectionObserver.observe(stage);

    const render = (time: number) => {
      if (disposed) return;
      const delta = Math.min(0.05, Math.max(0.001, (time - previousTime) / 1000));
      previousTime = time;
      if (intersectionRef.current && document.visibilityState === "visible") {
        smoothed = damp(smoothed, sceneProgress.get(), smoothing, delta);
        visibleProgress.set(smoothed);
        onProgressChange?.(smoothed);
        pointerRef.current.x = damp(pointerRef.current.x, targetPointerRef.current.x, 8, delta);
        pointerRef.current.y = damp(pointerRef.current.y, targetPointerRef.current.y, 8, delta);

        const sampled = sampleCamera(camera, smoothed);
        const pointerX = mobile ? 0 : pointerRef.current.x * pointerStrength;
        const pointerY = mobile ? 0 : pointerRef.current.y * pointerStrength;
        for (const cameraInstance of [backCamera, frontCamera]) {
          cameraInstance.position.set(sampled.x + pointerX, sampled.y - pointerY, sampled.z);
          cameraInstance.fov = sampled.fov;
          cameraInstance.lookAt(sampled.lookX + pointerX * 0.18, sampled.lookY - pointerY * 0.12, 0);
          cameraInstance.updateProjectionMatrix();
        }
        for (const record of records) {
          const sampledLayer = sampleLayer(record.layer, smoothed);
          const baseScale = resolveNumber(record.mesh.userData.baseScale as number | undefined, 1);
          record.mesh.position.set(sampledLayer.x, sampledLayer.y, record.layer.depth + sampledLayer.z);
          record.mesh.scale.setScalar(baseScale * sampledLayer.scale);
          record.mesh.material.opacity = sampledLayer.opacity;
        }
        backRenderer.render(backScene, backCamera);
        frontRenderer.render(frontScene, frontCamera);
      }
      frame = requestAnimationFrame(render);
    };

    load()
      .then(() => {
        if (disposed) return;
        fitPlanes();
        backRenderer.render(backScene, backCamera);
        frontRenderer.render(frontScene, frontCamera);
        setReady(true);
        frame = requestAnimationFrame(render);
      })
      .catch(abort);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      backCanvas.removeEventListener("webglcontextlost", abort);
      frontCanvas.removeEventListener("webglcontextlost", abort);
      for (const record of records) {
        record.mesh.geometry.dispose();
        record.mesh.material.map?.dispose();
        record.mesh.material.dispose();
      }
      backRenderer.dispose();
      frontRenderer.dispose();
    };
  }, [
    camera,
    layerSignature,
    layers,
    maxDpr,
    mobile,
    onProgressChange,
    pointerStrength,
    prefersReducedMotion,
    sceneProgress,
    smoothing,
    visibleProgress,
  ]);

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
        <canvas ref={backCanvasRef} aria-hidden className={cn("absolute inset-0 z-10 size-full transition-opacity duration-500", ready && !failed ? "opacity-100" : "opacity-0")} />
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

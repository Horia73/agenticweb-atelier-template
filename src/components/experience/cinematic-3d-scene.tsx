"use client";

import * as React from "react";
import { AdaptiveDpr, Clone, Text, useGLTF, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import { type MotionValue, useMotionValue } from "motion/react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import { IntroLoader } from "@/components/experience/intro-loader";
import {
  damp,
  mix,
  resolveKeyframes,
  sortKeyframes,
  supportsWebGL,
  useHydrated,
  useMediaQuery,
} from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type CinematicCameraBeat = {
  at: number;
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
};

export type OccludedTextBeat = {
  at: number;
  opacity: number;
  position?: [number, number, number];
};

export type Cinematic3DSceneRenderProps = {
  progress: MotionValue<number>;
  quality: "full" | "balanced";
};

export type Cinematic3DLoadingControl = {
  active: boolean;
  progress: number;
  label?: string;
  words?: string[];
};

export type Cinematic3DSceneProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  children: (props: Cinematic3DSceneRenderProps) => React.ReactNode;
  camera: CinematicCameraBeat[];
  poster: string;
  scrollScreens?: number;
  maxDpr?: number;
  smoothing?: number;
  mobileBreakpoint?: number;
  loadingControl?: Cinematic3DLoadingControl;
  intro?: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  chrome?: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode);
  reducedMotionFallback?: React.ReactNode;
  onProgressChange?: (progress: number) => void;
};

const DEFAULT_FONT = "/fonts/geist-regular.ttf";

function useNearViewport(target: React.RefObject<HTMLElement | null>) {
  const [near, setNear] = React.useState(true);

  React.useEffect(() => {
    const node = target.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry?.isIntersecting ?? false),
      { rootMargin: "120% 0px 120% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  return near;
}

function sampleCamera(beats: CinematicCameraBeat[], progress: number) {
  const { from, to, mix: amount } = resolveKeyframes(beats, progress);
  return {
    position: from.position.map((value, index) => mix(value, to.position[index]!, amount)) as [number, number, number],
    target: from.target.map((value, index) => mix(value, to.target[index]!, amount)) as [number, number, number],
    fov: mix(from.fov ?? 44, to.fov ?? 44, amount),
  };
}

/**
 * Reversible scroll camera with frame-rate independent damping. Camera beats
 * are deliberately authored in world units so the scene can enforce a safe
 * minimum distance to hero geometry instead of scaling a raster plate.
 */
export function ScrollCameraRig({
  beats,
  progress,
  smoothing = 7.5,
  onProgressChange,
}: {
  beats: CinematicCameraBeat[];
  progress: MotionValue<number>;
  smoothing?: number;
  onProgressChange?: (progress: number) => void;
}) {
  const sceneCamera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const cameraRef = React.useRef(sceneCamera);
  const frames = React.useMemo(() => sortKeyframes(beats), [beats]);
  const smoothed = React.useRef(progress.get());
  const target = React.useMemo(() => new THREE.Vector3(), []);

  React.useEffect(() => {
    cameraRef.current = sceneCamera;
  }, [sceneCamera]);

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    smoothed.current = damp(smoothed.current, progress.get(), smoothing, delta);
    const sampled = sampleCamera(frames, smoothed.current);
    camera.position.set(...sampled.position);
    target.set(...sampled.target);
    camera.lookAt(target);
    if (Math.abs(camera.fov - sampled.fov) > 0.01) {
      camera.fov = sampled.fov;
      camera.updateProjectionMatrix();
    }
    onProgressChange?.(smoothed.current);
  });

  return null;
}

/** Shared GLB instance that is grounded through the same terrain function as the camera scene. */
export function GroundedAsset({
  src,
  x,
  z,
  heightAt,
  groundOffset = 0,
  castShadow = true,
  receiveShadow = true,
  ...props
}: Omit<ThreeElements["group"], "position"> & {
  src: string;
  x: number;
  z: number;
  heightAt: (x: number, z: number) => number;
  groundOffset?: number;
}) {
  const { scene } = useGLTF(src, false, true);
  return (
    <group {...props} position={[x, heightAt(x, z) + groundOffset, z]}>
      <Clone object={scene} castShadow={castShadow} receiveShadow={receiveShadow} />
    </group>
  );
}

function sampleText(beats: OccludedTextBeat[], progress: number) {
  const { from, to, mix: amount } = resolveKeyframes(beats, progress);
  const fromPosition = from.position ?? [0, 0, 0];
  const toPosition = to.position ?? fromPosition;
  return {
    opacity: mix(from.opacity, to.opacity, amount),
    position: fromPosition.map((value, index) => mix(value, toPosition[index]!, amount)) as [number, number, number],
  };
}

/**
 * SDF copy inside the depth buffer. A real mesh can hide it, reveal it and
 * hide it again without DOM z-index tricks. Keep an equivalent semantic copy
 * outside the Canvas for screen readers.
 */
export function OccludedText({
  beats,
  children,
  progress,
  font = DEFAULT_FONT,
  ...props
}: Omit<React.ComponentProps<typeof Text>, "children" | "font" | "position"> & {
  beats: OccludedTextBeat[];
  children: string;
  progress: MotionValue<number>;
  font?: string;
}) {
  const ref = React.useRef<React.ElementRef<typeof Text>>(null);
  const frames = React.useMemo(() => sortKeyframes(beats), [beats]);

  useFrame(() => {
    const text = ref.current;
    if (!text) return;
    const sampled = sampleText(frames, progress.get());
    text.position.set(...sampled.position);
    text.fillOpacity = sampled.opacity;
    text.visible = sampled.opacity > 0.002;
  });

  const first = frames[0]!;
  return (
    <Text
      ref={ref}
      font={font}
      fillOpacity={first.opacity}
      position={first.position ?? [0, 0, 0]}
      {...props}
    >
      {children}
    </Text>
  );
}

function SceneLoadingOverlay({ control }: { control?: Cinematic3DLoadingControl }) {
  const { active, errors, progress, total } = useProgress();
  const started = active || total > 0 || progress > 0 || errors.length > 0;
  const internalLoading = !started || active || (errors.length === 0 && progress < 99.5);
  const loading = control?.active ?? internalLoading;
  const normalizedProgress = control ? control.progress : (started ? progress / 100 : 0);
  return (
    <IntroLoader
      active={loading}
      progress={normalizedProgress}
      storageKey={null}
      minDurationMs={850}
      maxDurationMs={30_000}
      exit="up"
      exitDurationMs={900}
      label={control?.label ?? "Se încarcă scena 3D"}
      words={control?.words ?? ["Capture", "Geometry", "Vegetation", "Atmosphere"]}
      className="bg-[#07100b]"
    >
      <div className="grid place-items-center text-center">
        <div className="grid size-28 place-items-center rounded-full border border-white/15">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-white/72">Forest<br />01</span>
        </div>
        <p className="mt-5 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/42">Cinematic world loading</p>
      </div>
    </IntroLoader>
  );
}

function renderOverlay(
  overlay: React.ReactNode | ((progress: MotionValue<number>) => React.ReactNode),
  progress: MotionValue<number>,
) {
  return typeof overlay === "function" ? overlay(progress) : overlay;
}

export function Cinematic3DScene({
  camera,
  children,
  chrome,
  className,
  intro,
  label,
  loadingControl,
  maxDpr = 1.5,
  mobileBreakpoint = 900,
  onProgressChange,
  poster,
  reducedMotionFallback,
  scrollScreens = 6.5,
  smoothing = 7.5,
  style,
  ...props
}: Cinematic3DSceneProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const rawProgress = useElementScrollProgress(rootRef);
  const progress = useMotionValue(0);
  const hydrated = useHydrated();
  const mobile = useMediaQuery(`(max-width: ${mobileBreakpoint - 0.02}px)`);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const constrained = useMediaQuery("(max-resolution: 1.25dppx) and (max-width: 1280px)");
  const nearViewport = useNearViewport(rootRef);
  const [webgl, setWebgl] = React.useState(true);

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => setWebgl(supportsWebGL()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const fallback = reducedMotionFallback ?? (
    <div className="relative min-h-svh bg-cover bg-center text-white" style={{ backgroundImage: `linear-gradient(rgb(3 7 5 / 0.2), rgb(3 7 5 / 0.72)), url(${poster})` }}>
      {renderOverlay(intro, progress)}
    </div>
  );
  if (hydrated && (mobile || reducedMotion || !webgl)) return <>{fallback}</>;

  return (
    <section
      ref={rootRef}
      aria-label={label}
      className={cn("relative bg-[#07100b]", className)}
      style={{ minHeight: `${scrollScreens * 100}svh`, ...style }}
      {...props}
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-[#07100b]">
        {nearViewport ? (
          <Canvas
            shadows
            dpr={[1, maxDpr]}
            camera={{ fov: camera[0]?.fov ?? 44, near: 0.08, far: 120, position: camera[0]?.position ?? [0, 3, 9] }}
            gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.02;
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
            }}
            performance={{ min: 0.55 }}
          >
            <ScrollCameraRig
              beats={camera}
              progress={rawProgress}
              smoothing={smoothing}
              onProgressChange={(value) => {
                progress.set(value);
                onProgressChange?.(value);
              }}
            />
            {children({ progress, quality: constrained ? "balanced" : "full" })}
            <AdaptiveDpr pixelated={false} />
          </Canvas>
        ) : (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${poster})` }} aria-hidden="true" />
        )}
        <SceneLoadingOverlay control={loadingControl} />
        <div className="pointer-events-none absolute inset-0 z-10">{renderOverlay(intro, progress)}</div>
        <div className="pointer-events-none absolute inset-0 z-20">{renderOverlay(chrome, progress)}</div>
      </div>
    </section>
  );
}

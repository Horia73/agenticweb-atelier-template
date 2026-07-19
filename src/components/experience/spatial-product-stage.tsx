"use client";

import * as React from "react";
import { Boxes, Combine } from "lucide-react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clamp01,
  damp,
  mix,
  supportsWebGL,
  useHydrated,
  useMediaQuery,
} from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

type Vector3Tuple = [number, number, number];

export type SpatialProductTransform = {
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: number | Vector3Tuple;
};

export type SpatialProductGeometry =
  | { type: "plane"; size: [number, number] }
  | { type: "box"; size: Vector3Tuple; radius?: number }
  | { type: "cylinder"; radiusTop: number; radiusBottom: number; height: number; segments?: number }
  | { type: "sphere"; radius: number; segments?: number }
  | { type: "torus"; radius: number; tube: number; radialSegments?: number; tubularSegments?: number }
  | { type: "extrude"; points: Array<[number, number]>; depth: number; bevel?: number };

export type SpatialProductMaterial = {
  color?: THREE.ColorRepresentation;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  transmission?: number;
};

export type SpatialProductPart = {
  id: string;
  geometry: SpatialProductGeometry;
  texture?: string;
  material?: SpatialProductMaterial;
  assembled: SpatialProductTransform;
  exploded: SpatialProductTransform;
  assemblyDelay?: number;
};

export type SpatialProductModelPart = {
  id: string;
  nodeName: string;
  assembled?: SpatialProductTransform;
  exploded: SpatialProductTransform;
  assemblyDelay?: number;
};

export type SpatialProductStageProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  mode?: "hover" | "scroll" | "hybrid";
  parts?: SpatialProductPart[];
  modelSrc?: string;
  modelParts?: SpatialProductModelPart[];
  visual?: React.ReactNode;
  overlay?: React.ReactNode;
  fallback?: React.ReactNode;
  scrollScreens?: number;
  smoothing?: number;
  maxDpr?: number;
  cameraPosition?: Vector3Tuple;
  groupPosition?: Vector3Tuple;
  mobileGroupPosition?: Vector3Tuple;
  groupScale?: number;
  hoverAnchor?: [number, number];
  hoverRadius?: number;
  assembledLabel?: string;
  explodedLabel?: string;
  stageClassName?: string;
  showControl?: boolean;
  onAssemblyChange?: (progress: number) => void;
};

type PartRecord = {
  object: THREE.Object3D;
  assembled: ResolvedTransform;
  exploded: ResolvedTransform;
  delay: number;
};

type ResolvedTransform = {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
};

const DEFAULT_CAMERA_POSITION: Vector3Tuple = [0, 0, 8];
const DEFAULT_GROUP_POSITION: Vector3Tuple = [0, 0, 0];
const DEFAULT_MOBILE_GROUP_POSITION: Vector3Tuple = [0, -0.5, 0];
const EMPTY_PARTS: SpatialProductPart[] = [];
const EMPTY_MODEL_PARTS: SpatialProductModelPart[] = [];
const DEFAULT_HOVER_ANCHOR: [number, number] = [0.5, 0.5];

function normalizeScale(scale: SpatialProductTransform["scale"]): Vector3Tuple {
  if (Array.isArray(scale)) return scale;
  const value = scale ?? 1;
  return [value, value, value];
}

function normalizeTransform(transform: SpatialProductTransform = {}): ResolvedTransform {
  return {
    position: transform.position ?? [0, 0, 0],
    rotation: transform.rotation ?? [0, 0, 0],
    scale: normalizeScale(transform.scale),
  };
}

function createGeometry(spec: SpatialProductGeometry) {
  if (spec.type === "plane") return new THREE.PlaneGeometry(spec.size[0], spec.size[1], 1, 1);
  if (spec.type === "box") return new THREE.BoxGeometry(...spec.size, 4, 4, 4);
  if (spec.type === "cylinder") return new THREE.CylinderGeometry(spec.radiusTop, spec.radiusBottom, spec.height, spec.segments ?? 32, 2);
  if (spec.type === "sphere") return new THREE.SphereGeometry(spec.radius, spec.segments ?? 32, Math.max(16, (spec.segments ?? 32) / 2));
  if (spec.type === "torus") return new THREE.TorusGeometry(spec.radius, spec.tube, spec.radialSegments ?? 16, spec.tubularSegments ?? 64);
  const shape = new THREE.Shape();
  spec.points.forEach(([x, y], index) => index === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y));
  shape.closePath();
  const bevel = spec.bevel ?? 0.035;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: spec.depth,
    bevelEnabled: bevel > 0,
    bevelSegments: 3,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 16,
  });
  geometry.center();
  return geometry;
}

function createMaterial(spec: SpatialProductMaterial = {}, texture?: THREE.Texture) {
  if (texture) {
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.008,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      toneMapped: true,
    });
  }
  const transmission = spec.transmission ?? 0;
  return new THREE.MeshPhysicalMaterial({
    color: spec.color ?? "#d7dde2",
    emissive: spec.emissive ?? "#000000",
    emissiveIntensity: spec.emissiveIntensity ?? 0,
    metalness: spec.metalness ?? 0.55,
    roughness: spec.roughness ?? 0.28,
    opacity: spec.opacity ?? 1,
    transparent: (spec.opacity ?? 1) < 1 || transmission > 0,
    transmission,
    thickness: transmission > 0 ? 0.25 : 0,
    side: THREE.DoubleSide,
  });
}

function applyTransform(object: THREE.Object3D, transform: ResolvedTransform) {
  object.position.set(...transform.position);
  object.rotation.set(...transform.rotation);
  object.scale.set(...transform.scale);
}

function interpolateTransform(record: PartRecord, progress: number) {
  const amount = progress * progress * (3 - 2 * progress);
  const { assembled, exploded, object } = record;
  object.position.set(
    mix(exploded.position[0], assembled.position[0], amount),
    mix(exploded.position[1], assembled.position[1], amount),
    mix(exploded.position[2], assembled.position[2], amount),
  );
  const fromQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...exploded.rotation));
  const toQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...assembled.rotation));
  object.quaternion.slerpQuaternions(fromQuaternion, toQuaternion, amount);
  object.scale.set(
    mix(exploded.scale[0], assembled.scale[0], amount),
    mix(exploded.scale[1], assembled.scale[1], amount),
    mix(exploded.scale[2], assembled.scale[2], amount),
  );
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      const map = "map" in material ? material.map as THREE.Texture | null : null;
      map?.dispose();
      material.dispose();
    });
  });
}

/**
 * Reusable assembly stage for primitive parts or named nodes from a GLB.
 * The same normalized timeline can be driven by hover, native page scroll,
 * or both; consumers own the art direction and every part transform.
 */
export function SpatialProductStage({
  assembledLabel = "Asamblează produsul",
  cameraPosition = DEFAULT_CAMERA_POSITION,
  className,
  explodedLabel = "Separă piesele",
  fallback,
  groupPosition = DEFAULT_GROUP_POSITION,
  groupScale = 1,
  hoverAnchor = DEFAULT_HOVER_ANCHOR,
  hoverRadius = 0.32,
  label,
  maxDpr = 1.75,
  mobileGroupPosition = DEFAULT_MOBILE_GROUP_POSITION,
  mode = "hybrid",
  modelParts = EMPTY_MODEL_PARTS,
  modelSrc,
  onAssemblyChange,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  overlay,
  parts = EMPTY_PARTS,
  scrollScreens = 2.4,
  showControl = true,
  smoothing = 12,
  stageClassName,
  style,
  visual,
  ...props
}: SpatialProductStageProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const hoverRef = React.useRef(0);
  const lockedRef = React.useRef(false);
  const pointerRef = React.useRef({ x: 0, y: 0 });
  const targetPointerRef = React.useRef({ x: 0, y: 0 });
  const activeRef = React.useRef(true);
  const scrollProgress = useElementScrollProgress(rootRef);
  const reducedMotion = useReducedMotion();
  const hydrated = useHydrated();
  const mobile = useMediaQuery("(max-width: 767.98px)");
  const [assembled, setAssembled] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const prefersReducedMotion = hydrated && Boolean(reducedMotion);
  const signature = React.useMemo(() => parts.map((part) => part.id).join("|"), [parts]);

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
    let smoothed = mode === "hover" ? 0 : scrollProgress.get();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(...cameraPosition);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    const product = new THREE.Group();
    const position = mobile ? mobileGroupPosition : groupPosition;
    product.position.set(...position);
    product.scale.setScalar(groupScale * (mobile ? 0.86 : 1));
    scene.add(product);
    scene.add(new THREE.HemisphereLight(0xeaf7ff, 0x17202a, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 4.4);
    key.position.set(-3, 4, 6);
    scene.add(key);
    const cyan = new THREE.PointLight(0x4ce9ff, 18, 7, 2);
    cyan.position.set(2.5, 0.8, 3.5);
    scene.add(cyan);
    const rim = new THREE.PointLight(0x5577ff, 13, 6, 2);
    rim.position.set(-2.5, -1.5, 2);
    scene.add(rim);
    const records: PartRecord[] = [];
    const textureLoader = new THREE.TextureLoader();

    const addPrimitiveParts = async () => {
      await Promise.all(parts.map(async (part) => {
        const texture = part.texture ? await textureLoader.loadAsync(part.texture) : undefined;
        if (texture) {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        }
        const mesh = new THREE.Mesh(createGeometry(part.geometry), createMaterial(part.material, texture));
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        const assembledTransform = normalizeTransform(part.assembled);
        const explodedTransform = normalizeTransform(part.exploded);
        applyTransform(mesh, explodedTransform);
        product.add(mesh);
        records.push({ object: mesh, assembled: assembledTransform, exploded: explodedTransform, delay: clamp01(part.assemblyDelay ?? 0) });
      }));
    };

    const addModelParts = async () => {
      if (!modelSrc) return;
      const gltf = await new GLTFLoader().loadAsync(modelSrc);
      modelParts.forEach((part) => {
        const source = gltf.scene.getObjectByName(part.nodeName);
        if (!source) return;
        const object = source.clone(true);
        const assembledTransform = normalizeTransform(part.assembled ?? {
          position: source.position.toArray(),
          rotation: [source.rotation.x, source.rotation.y, source.rotation.z],
          scale: source.scale.toArray(),
        });
        const explodedTransform = normalizeTransform(part.exploded);
        applyTransform(object, explodedTransform);
        product.add(object);
        records.push({ object, assembled: assembledTransform, exploded: explodedTransform, delay: clamp01(part.assemblyDelay ?? 0) });
      });
    };

    const resize = () => {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
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
        const scroll = scrollProgress.get();
        const hover = Math.max(hoverRef.current, lockedRef.current ? 1 : 0);
        const target = mode === "hover" ? hover : mode === "scroll" ? scroll : Math.max(scroll, hover);
        smoothed = damp(smoothed, target, smoothing, delta);
        onAssemblyChange?.(smoothed);
        pointerRef.current.x = damp(pointerRef.current.x, targetPointerRef.current.x, 8, delta);
        pointerRef.current.y = damp(pointerRef.current.y, targetPointerRef.current.y, 8, delta);
        product.rotation.y = pointerRef.current.x * 0.14;
        product.rotation.x = -pointerRef.current.y * 0.08;
        records.forEach((record) => {
          const local = clamp01((smoothed - record.delay) / Math.max(0.001, 1 - record.delay));
          interpolateTransform(record, local);
        });
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(render);
    };

    Promise.all([addPrimitiveParts(), addModelParts()])
      .then(() => {
        if (disposed) return;
        resize();
        setReady(true);
        frame = requestAnimationFrame(render);
      })
      .catch(() => setFailed(true));

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", contextLost);
      disposeObject(product);
      renderer.dispose();
    };
  }, [
    cameraPosition,
    groupPosition,
    groupScale,
    maxDpr,
    mobile,
    mobileGroupPosition,
    mode,
    modelParts,
    modelSrc,
    onAssemblyChange,
    parts,
    prefersReducedMotion,
    scrollProgress,
    signature,
    smoothing,
  ]);

  const setLock = () => {
    lockedRef.current = !lockedRef.current;
    setAssembled(lockedRef.current);
  };
  const handlePointerEnter = (event: React.PointerEvent<HTMLElement>) => {
    onPointerEnter?.(event);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = stageRef.current?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
    if (event.pointerType !== "touch") {
      const normalizedX = (event.clientX - rect.left) / Math.max(1, rect.width);
      const normalizedY = (event.clientY - rect.top) / Math.max(1, rect.height);
      targetPointerRef.current.x = normalizedX - 0.5;
      targetPointerRef.current.y = normalizedY - 0.5;
      const aspect = rect.width / Math.max(1, rect.height);
      const distance = Math.hypot(
        (normalizedX - hoverAnchor[0]) * Math.min(1.35, aspect),
        normalizedY - hoverAnchor[1],
      );
      hoverRef.current = distance <= hoverRadius ? 1 : 0;
    }
    onPointerMove?.(event);
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    hoverRef.current = 0;
    targetPointerRef.current = { x: 0, y: 0 };
    onPointerLeave?.(event);
  };

  if (prefersReducedMotion) {
    return <section ref={rootRef} aria-label={label} data-spatial-product data-reduced-motion className={cn("relative min-h-svh overflow-hidden", className)} style={style} {...props}>{fallback ?? visual}{overlay ? <div className="pointer-events-none absolute inset-0">{overlay}</div> : null}</section>;
  }

  const scrollDriven = mode !== "hover";
  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-spatial-product
      data-mode={mode}
      data-ready={ready || undefined}
      data-fallback={failed || undefined}
      className={cn("relative isolate", className)}
      style={{ minHeight: scrollDriven ? `${Math.max(1, scrollScreens) * 100}svh` : "100svh", ...style }}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <div ref={stageRef} className={cn(scrollDriven ? "sticky top-0" : "relative", "h-svh overflow-hidden", stageClassName)}>
        <div className="absolute inset-0 z-0">{visual}</div>
        <canvas ref={canvasRef} aria-hidden className={cn("pointer-events-none absolute inset-0 z-10 size-full transition-opacity duration-500", ready && !failed ? "opacity-100" : "opacity-0")} />
        <div className="pointer-events-none absolute inset-0 z-20">{overlay}</div>
        {showControl ? (
          <Button type="button" variant="outline" size="sm" className="absolute bottom-5 right-5 z-30 rounded-full border-white/20 bg-black/35 text-white backdrop-blur-xl hover:bg-black/55 hover:text-white" aria-pressed={assembled} onClick={setLock}>
            {assembled ? <Boxes aria-hidden /> : <Combine aria-hidden />}
            {assembled ? explodedLabel : assembledLabel}
          </Button>
        ) : null}
        {failed ? <div className="absolute inset-0 z-20">{fallback}</div> : null}
      </div>
    </section>
  );
}

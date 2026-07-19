"use client";

import * as React from "react";
import { Boxes, Combine } from "lucide-react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clamp01,
  damp,
  mix,
  useExperienceViewport,
  usePrefersReducedMotion,
} from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";
import { useWebGLStage } from "@/components/experience/use-webgl-stage";

type Vector3Tuple = [number, number, number];

export type SpatialProductTransform = {
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: number | Vector3Tuple;
};

export type SpatialProductImageAnchor = {
  /** Target point as fractions of the source image ([0,0] top-left → [1,1] bottom-right). */
  point: [number, number];
  /** Natural aspect ratio (width / height) of the `visual` image. */
  imageAspect: number;
  /** CSS object-position of the cover fit, as fractions; defaults to [0.5, 0.5]. */
  objectPosition?: [number, number];
  /** Scale the product with the image zoom so it tracks the subject size; default true. */
  scaleWithImage?: boolean;
};

/**
 * Replays the CSS object-cover crop: returns where an image-space point lands in
 * viewport fractions, plus the image zoom relative to a height-fit (≥ 1).
 */
function projectImageAnchor(anchor: SpatialProductImageAnchor, viewAspect: number): { fraction: [number, number]; zoom: number } {
  const { imageAspect, objectPosition = [0.5, 0.5], point } = anchor;
  const zoom = Math.max(viewAspect / imageAspect, 1);
  const renderedWidth = imageAspect * zoom;
  const offsetX = (viewAspect - renderedWidth) * objectPosition[0];
  const offsetY = (1 - zoom) * objectPosition[1];
  return {
    fraction: [(offsetX + point[0] * renderedWidth) / Math.max(0.0001, viewAspect), offsetY + point[1] * zoom],
    zoom,
  };
}

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
  tabletGroupPosition?: Vector3Tuple;
  /**
   * Viewport-fraction anchor ([0,0] top-left → [1,1] bottom-right) the group's origin
   * projects to at every aspect ratio. When set, it overrides the x/y of
   * `groupPosition` (z is kept as depth) so the product assembles at the same
   * screen spot regardless of window shape. Also becomes the default hover anchor.
   */
  groupAnchor?: [number, number];
  mobileGroupAnchor?: [number, number];
  tabletGroupAnchor?: [number, number];
  /**
   * Anchors the group to a point of the cover-fit `visual` image instead of the
   * viewport: the component replays the CSS object-cover crop for the current
   * aspect ratio, so the product assembles on the same image feature (e.g. a
   * face) no matter the window shape, and scales with the image zoom.
   * Takes precedence over `groupAnchor`.
   */
  imageAnchor?: SpatialProductImageAnchor;
  mobileImageAnchor?: SpatialProductImageAnchor;
  tabletImageAnchor?: SpatialProductImageAnchor;
  groupScale?: number;
  mobileGroupScale?: number;
  tabletGroupScale?: number;
  hoverAnchor?: [number, number];
  hoverRadius?: number;
  assembledLabel?: string;
  explodedLabel?: string;
  /** Generate a PMREM room environment so transmission and metal materials pick up reflections. */
  environment?: boolean;
  idleVisibility?: "exploded" | "hidden";
  stageClassName?: string;
  showControl?: boolean;
  onAssemblyChange?: (progress: number) => void;
};

type PartRecord = {
  object: THREE.Object3D;
  assembled: ResolvedTransform;
  exploded: ResolvedTransform;
  delay: number;
  materials: Array<{
    material: THREE.Material & { opacity: number };
    opacity: number;
  }>;
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

// Scratch instances reused by interpolateTransform so the per-part frame loop stays allocation-free.
const SCRATCH_EULER = new THREE.Euler();
const SCRATCH_FROM_QUATERNION = new THREE.Quaternion();
const SCRATCH_TO_QUATERNION = new THREE.Quaternion();

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
  SCRATCH_FROM_QUATERNION.setFromEuler(SCRATCH_EULER.set(...exploded.rotation));
  SCRATCH_TO_QUATERNION.setFromEuler(SCRATCH_EULER.set(...assembled.rotation));
  object.quaternion.slerpQuaternions(SCRATCH_FROM_QUATERNION, SCRATCH_TO_QUATERNION, amount);
  object.scale.set(
    mix(exploded.scale[0], assembled.scale[0], amount),
    mix(exploded.scale[1], assembled.scale[1], amount),
    mix(exploded.scale[2], assembled.scale[2], amount),
  );
}

function collectOpacityMaterials(object: THREE.Object3D) {
  const materials: PartRecord["materials"] = [];
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const source = Array.isArray(child.material) ? child.material : [child.material];
    source.forEach((material) => {
      if (!("opacity" in material)) return;
      materials.push({
        material: material as THREE.Material & { opacity: number },
        opacity: material.opacity,
      });
    });
  });
  return materials;
}

function setRecordVisibility(record: PartRecord, opacity: number) {
  const visible = opacity > 0.002;
  record.object.visible = visible;
  record.materials.forEach(({ material, opacity: baseOpacity }) => {
    material.opacity = baseOpacity * opacity;
  });
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
  assembledLabel = "Assemble product",
  cameraPosition = DEFAULT_CAMERA_POSITION,
  className,
  environment = true,
  explodedLabel = "Explode view",
  fallback,
  groupAnchor,
  groupPosition = DEFAULT_GROUP_POSITION,
  groupScale = 1,
  hoverAnchor,
  hoverRadius = 0.32,
  imageAnchor,
  mobileGroupAnchor,
  mobileGroupScale,
  mobileImageAnchor,
  idleVisibility = "exploded",
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
  tabletGroupAnchor,
  tabletGroupPosition,
  tabletGroupScale,
  tabletImageAnchor,
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
  const onAssemblyChangeRef = React.useRef(onAssemblyChange);
  React.useEffect(() => {
    onAssemblyChangeRef.current = onAssemblyChange;
  });
  const scrollProgress = useElementScrollProgress(rootRef);
  const prefersReducedMotion = usePrefersReducedMotion();
  const viewport = useExperienceViewport();
  const resolvedGroupPosition = viewport === "mobile"
    ? mobileGroupPosition
    : viewport === "tablet"
      ? tabletGroupPosition ?? groupPosition
      : groupPosition;
  const resolvedGroupAnchor = viewport === "mobile"
    ? mobileGroupAnchor ?? tabletGroupAnchor ?? groupAnchor
    : viewport === "tablet"
      ? tabletGroupAnchor ?? groupAnchor
      : groupAnchor;
  const resolvedImageAnchor = viewport === "mobile"
    ? mobileImageAnchor ?? tabletImageAnchor ?? imageAnchor
    : viewport === "tablet"
      ? tabletImageAnchor ?? imageAnchor
      : imageAnchor;
  const resolvedGroupScale = viewport === "mobile"
    ? mobileGroupScale ?? tabletGroupScale ?? groupScale * (resolvedImageAnchor ? 1 : .82)
    : viewport === "tablet"
      ? tabletGroupScale ?? groupScale * (resolvedImageAnchor ? 1 : .92)
      : groupScale;
  const [assembled, setAssembled] = React.useState(false);

  const { ready, failed } = useWebGLStage({
    stageRef,
    canvasRef,
    enabled: !prefersReducedMotion,
    maxDpr,
    antialias: true,
    alpha: true,
    signature: JSON.stringify([
      cameraPosition,
      environment,
      resolvedGroupAnchor ?? null,
      resolvedGroupPosition,
      resolvedGroupScale,
      idleVisibility,
      resolvedImageAnchor ?? null,
      viewport,
      mode,
      modelParts,
      modelSrc ?? null,
      parts,
      smoothing,
    ]),
    create: ({ renderer, markReady, markFailed, isDisposed, requestResize }) => {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setClearColor(0x000000, 0);
      let loaded = false;
      let smoothed = mode === "hover" ? 0 : scrollProgress.get();
      let sourceScene: THREE.Object3D | null = null;
      let environmentTexture: THREE.Texture | null = null;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(...cameraPosition);
      if (environment) {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        const room = new RoomEnvironment();
        environmentTexture = pmremGenerator.fromScene(room, 0.04).texture;
        room.dispose();
        pmremGenerator.dispose();
        scene.environment = environmentTexture;
      }
      const product = new THREE.Group();
      const position = resolvedGroupPosition;
      const viewportAnchor = resolvedGroupAnchor;
      const activeImageAnchor = resolvedImageAnchor;
      // Project the anchor onto the group's depth plane so the product keeps its
      // screen (or image) spot at every aspect ratio; image anchors also track
      // the cover-crop zoom so the product scales with the pictured subject.
      const placeProduct = () => {
        const baseScale = resolvedGroupScale;
        const resolved = activeImageAnchor
          ? projectImageAnchor(activeImageAnchor, camera.aspect)
          : viewportAnchor
            ? { fraction: viewportAnchor, zoom: 1 }
            : null;
        if (!resolved) {
          product.position.set(...position);
          product.scale.setScalar(baseScale);
          return;
        }
        const distance = camera.position.z - position[2];
        const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
        const halfWidth = halfHeight * camera.aspect;
        product.position.set((resolved.fraction[0] * 2 - 1) * halfWidth, (1 - resolved.fraction[1] * 2) * halfHeight, position[2]);
        product.scale.setScalar(baseScale * (activeImageAnchor?.scaleWithImage === false ? 1 : resolved.zoom));
      };
      placeProduct();
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
          if (isDisposed()) {
            texture?.dispose();
            return;
          }
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
          const materials = collectOpacityMaterials(mesh);
          if (idleVisibility === "hidden") materials.forEach(({ material }) => {
            material.transparent = true;
            material.needsUpdate = true;
          });
          records.push({ object: mesh, assembled: assembledTransform, exploded: explodedTransform, delay: clamp01(part.assemblyDelay ?? 0), materials });
        }));
      };

      const addModelParts = async () => {
        if (!modelSrc) return;
        const gltf = await new GLTFLoader().loadAsync(modelSrc);
        if (isDisposed()) {
          disposeObject(gltf.scene);
          return;
        }
        sourceScene = gltf.scene;
        modelParts.forEach((part) => {
          const source = gltf.scene.getObjectByName(part.nodeName);
          if (!source) return;
          const object = source.clone(true);
          object.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            child.material = Array.isArray(child.material)
              ? child.material.map((material) => material.clone())
              : child.material.clone();
          });
          const assembledTransform = normalizeTransform(part.assembled ?? {
            position: source.position.toArray(),
            rotation: [source.rotation.x, source.rotation.y, source.rotation.z],
            scale: source.scale.toArray(),
          });
          const explodedTransform = normalizeTransform(part.exploded);
          applyTransform(object, explodedTransform);
          product.add(object);
          const materials = collectOpacityMaterials(object);
          if (idleVisibility === "hidden") materials.forEach(({ material }) => {
            material.transparent = true;
            material.needsUpdate = true;
          });
          records.push({ object, assembled: assembledTransform, exploded: explodedTransform, delay: clamp01(part.assemblyDelay ?? 0), materials });
        });
      };

      Promise.all([addPrimitiveParts(), addModelParts()])
        .then(() => {
          if (isDisposed()) return;
          loaded = true;
          requestResize();
          markReady();
        })
        .catch(() => {
          if (!isDisposed()) markFailed();
        });

      return {
        onResize: (width, height) => {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          placeProduct();
        },
        onFrame: (delta) => {
          if (!loaded) return;
          const scroll = scrollProgress.get();
          const hover = Math.max(hoverRef.current, lockedRef.current ? 1 : 0);
          const target = mode === "hover" ? hover : mode === "scroll" ? scroll : Math.max(scroll, hover);
          smoothed = damp(smoothed, target, smoothing, delta);
          onAssemblyChangeRef.current?.(smoothed);
          pointerRef.current.x = damp(pointerRef.current.x, targetPointerRef.current.x, 8, delta);
          pointerRef.current.y = damp(pointerRef.current.y, targetPointerRef.current.y, 8, delta);
          product.rotation.y = pointerRef.current.x * 0.14;
          product.rotation.x = -pointerRef.current.y * 0.08;
          records.forEach((record) => {
            const local = clamp01((smoothed - record.delay) / Math.max(0.001, 1 - record.delay));
            interpolateTransform(record, local);
            const visibility = idleVisibility === "hidden" ? clamp01(local / 0.18) : 1;
            setRecordVisibility(record, visibility);
          });
          renderer.render(scene, camera);
        },
        dispose: () => {
          disposeObject(product);
          // Cloned parts share geometries with the source GLTF scene; three's dispose() is
          // safe to call twice, so disposing both never double-frees GPU resources.
          if (sourceScene) disposeObject(sourceScene);
          environmentTexture?.dispose();
        },
      };
    },
  });

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
      const activeImageAnchor = resolvedImageAnchor;
      const resolvedHoverAnchor = hoverAnchor
        ?? (activeImageAnchor ? projectImageAnchor(activeImageAnchor, aspect).fraction : undefined)
        ?? resolvedGroupAnchor
        ?? DEFAULT_HOVER_ANCHOR;
      const distance = Math.hypot(
        (normalizedX - resolvedHoverAnchor[0]) * Math.min(1.35, aspect),
        normalizedY - resolvedHoverAnchor[1],
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
    return <section ref={rootRef} aria-label={label} data-spatial-product data-experience-viewport={viewport} data-reduced-motion className={cn("relative min-h-svh overflow-hidden", className)} style={style} {...props}>{fallback ?? visual}{overlay ? <div className="pointer-events-none absolute inset-0">{overlay}</div> : null}</section>;
  }

  const scrollDriven = mode !== "hover";
  return (
    <section
      ref={rootRef}
      aria-label={label}
      data-spatial-product
      data-experience-viewport={viewport}
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
          <Button type="button" variant="outline" size="sm" className="absolute inset-x-4 bottom-4 z-30 min-h-11 rounded-full border-white/20 bg-black/35 text-white backdrop-blur-xl hover:bg-black/55 hover:text-white sm:inset-x-auto sm:bottom-5 sm:right-5" aria-pressed={assembled} onClick={setLock}>
            {assembled ? <Boxes aria-hidden /> : <Combine aria-hidden />}
            {assembled ? explodedLabel : assembledLabel}
          </Button>
        ) : null}
        {failed ? <div className="absolute inset-0 z-20">{fallback}</div> : null}
      </div>
    </section>
  );
}

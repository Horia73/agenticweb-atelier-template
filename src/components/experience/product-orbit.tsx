"use client";

import * as React from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { damp, useMediaQuery, usePrefersReducedMotion } from "@/components/experience/experience-runtime";
import { useWebGLStage } from "@/components/experience/use-webgl-stage";

type Vector3Tuple = [number, number, number];

export type ProductOrbitHotspot = {
  id: string;
  label: string;
  position: Vector3Tuple;
  content?: React.ReactNode;
  marker?: React.ReactNode;
};

export type ProductOrbitProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  description?: string;
  modelSrc?: string;
  /** Decoder path for Draco-compressed GLBs (e.g. "/draco/"); wires a DRACOLoader when set. */
  dracoDecoderPath?: string;
  /** Transcoder path for KTX2 textures (e.g. "/basis/"); wires a KTX2Loader when set. */
  ktx2TranscoderPath?: string;
  primitive?: "bottle" | "capsule" | "crystal" | "sphere" | "torus" | "box";
  color?: THREE.ColorRepresentation;
  metalness?: number;
  roughness?: number;
  transmission?: number;
  modelScale?: number;
  mobileModelScale?: number;
  /** Normalizes any model so its bounding-sphere diameter matches this world-space size; `modelScale` then multiplies on top. */
  fitDiameter?: number;
  cameraPosition?: Vector3Tuple;
  autoRotate?: number;
  dragSensitivity?: number;
  hotspots?: ProductOrbitHotspot[];
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  maxDpr?: number;
  canvasClassName?: string;
};

function makePrimitive(type: NonNullable<ProductOrbitProps["primitive"]>, material: THREE.Material) {
  if (type === "bottle") {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.72, 1.45, 14, 64), material);
    body.position.y = -.08;
    group.add(body);
    const liquid = new THREE.Mesh(new THREE.CapsuleGeometry(.63, 1.28, 12, 48), new THREE.MeshPhysicalMaterial({ color: "#0b5364", roughness: .12, transmission: .18, transparent: true, opacity: .84 }));
    liquid.position.y = -.13;
    group.add(liquid);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.31, .42, .58, 48), new THREE.MeshPhysicalMaterial({ color: "#c9d7df", metalness: .16, roughness: .18, transmission: .28, transparent: true, opacity: .92 }));
    neck.position.y = 1.38;
    group.add(neck);
    const capMaterial = new THREE.MeshStandardMaterial({ color: "#11171b", metalness: .78, roughness: .3 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.39, .39, .42, 48, 2), capMaterial);
    cap.position.y = 1.79;
    group.add(cap);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.735, .735, .68, 64, 1, true), new THREE.MeshStandardMaterial({ color: "#10161a", metalness: .32, roughness: .42, transparent: true, opacity: .88, side: THREE.DoubleSide }));
    band.position.y = -.23;
    group.add(band);
    const mark = new THREE.Mesh(new THREE.TorusGeometry(.2, .025, 12, 48), new THREE.MeshBasicMaterial({ color: "#9df4ff" }));
    mark.position.set(0, -.23, .735);
    group.add(mark);
    return group;
  }
  if (type === "crystal") {
    const group = new THREE.Group();
    const physical = material as THREE.MeshPhysicalMaterial;
    physical.flatShading = true;
    physical.iridescence = .48;
    physical.iridescenceIOR = 1.28;
    const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(1.16, 0), physical);
    gem.rotation.set(.5, .35, -.14);
    group.add(gem);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.4, 1), new THREE.MeshBasicMaterial({ color: "#9df4ff" }));
    group.add(core);
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.58, .028, 14, 96), new THREE.MeshStandardMaterial({ color: "#cfd9e2", metalness: .92, roughness: .18 }));
    innerRing.rotation.x = Math.PI / 2.25;
    group.add(innerRing);
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.92, .015, 12, 96), new THREE.MeshStandardMaterial({ color: "#8ea4b5", metalness: .85, roughness: .3 }));
    outerRing.rotation.set(Math.PI / 1.9, 0, .5);
    group.add(outerRing);
    const carrier = new THREE.Group();
    carrier.rotation.x = Math.PI / 2.25;
    const satelliteMaterial = new THREE.MeshBasicMaterial({ color: "#9df4ff" });
    for (let index = 0; index < 3; index += 1) {
      const angle = (index / 3) * Math.PI * 2;
      const satellite = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), satelliteMaterial);
      satellite.position.set(Math.cos(angle) * 1.58, Math.sin(angle) * 1.58, 0);
      carrier.add(satellite);
    }
    group.add(carrier);
    group.userData.animate = (time: number) => {
      gem.rotation.y = .35 + time * .12;
      core.scale.setScalar(1 + Math.sin(time * 2.1) * .07);
      carrier.rotation.z = time * .5;
      outerRing.rotation.z = .5 + Math.sin(time * .4) * .22;
    };
    return group;
  }
  if (type === "sphere") return new THREE.Mesh(new THREE.SphereGeometry(1.35, 64, 48), material);
  if (type === "torus") return new THREE.Mesh(new THREE.TorusKnotGeometry(.9, .32, 160, 24), material);
  if (type === "box") return new THREE.Mesh(new THREE.BoxGeometry(2.15, 2.15, 2.15, 8, 8, 8), material);
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.CapsuleGeometry(.72, 1.7, 12, 48), material));
  const ringMaterial = new THREE.MeshPhysicalMaterial({ color: "#cbd5e1", metalness: .9, roughness: .16 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.78, .055, 12, 64), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -.84;
  group.add(ring);
  return group;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

/** GLB-ready orbit viewer with drag, keyboard control and projected semantic hotspots. */
export function ProductOrbit({
  autoRotate = .16,
  cameraPosition = [0, .15, 5.5],
  canvasClassName,
  children,
  className,
  color = "#d8e0e6",
  description,
  dracoDecoderPath,
  dragSensitivity = .008,
  fallback,
  fitDiameter,
  hotspots = [],
  ktx2TranscoderPath,
  label,
  maxDpr = 1.75,
  metalness = .48,
  modelScale = 1,
  mobileModelScale,
  modelSrc,
  primitive = "bottle",
  roughness = .2,
  transmission = .08,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...props
}: ProductOrbitProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const hotspotRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const draggingRef = React.useRef(false);
  const lastXRef = React.useRef(0);
  const rotationRef = React.useRef({ current: 0, target: 0, tilt: 0, targetTilt: 0 });
  const autoRotateRef = React.useRef(autoRotate);
  const hotspotsRef = React.useRef(hotspots);
  React.useEffect(() => {
    autoRotateRef.current = autoRotate;
    hotspotsRef.current = hotspots;
  });
  const mobile = useMediaQuery("(max-width: 639.98px)");
  const staticMode = usePrefersReducedMotion();
  const [activeHotspot, setActiveHotspot] = React.useState<string | null>(null);
  const resolvedModelScale = mobile && mobileModelScale ? mobileModelScale : modelScale;

  const { ready, failed } = useWebGLStage({
    stageRef: rootRef,
    canvasRef,
    enabled: !staticMode,
    maxDpr,
    antialias: true,
    alpha: true,
    signature: JSON.stringify([
      cameraPosition,
      color,
      dracoDecoderPath ?? null,
      fitDiameter ?? null,
      hotspots.map((hotspot) => [hotspot.id, ...hotspot.position]),
      ktx2TranscoderPath ?? null,
      metalness,
      modelSrc ?? null,
      primitive,
      resolvedModelScale,
      roughness,
      transmission,
    ]),
    create: ({ renderer, markReady, markFailed, isDisposed, requestResize }) => {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      let product: THREE.Object3D | null = null;
      let dracoLoader: DRACOLoader | null = null;
      let ktx2Loader: KTX2Loader | null = null;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
      camera.position.set(...cameraPosition);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const environment = pmrem.fromScene(new RoomEnvironment(), .04);
      scene.environment = environment.texture;
      scene.add(new THREE.HemisphereLight("#eef7ff", "#151922", 1.1));
      const key = new THREE.DirectionalLight("#ffffff", 2.6);
      key.position.set(4, 5, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight("#5de8ff", 1.9);
      rim.position.set(-5, 1, -3);
      scene.add(rim);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.MeshBasicMaterial({ color: "#020407", transparent: true, opacity: .55 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.65;
      scene.add(floor);
      const install = (object: THREE.Object3D) => {
        product = object;
        if (fitDiameter) {
          const sphere = new THREE.Box3().setFromObject(product).getBoundingSphere(new THREE.Sphere());
          if (sphere.radius > 0) product.scale.multiplyScalar(fitDiameter / (sphere.radius * 2));
        }
        product.scale.multiplyScalar(resolvedModelScale);
        const bounds = new THREE.Box3().setFromObject(product);
        const center = bounds.getCenter(new THREE.Vector3());
        product.position.sub(center);
        scene.add(product);
        markReady();
      };
      if (modelSrc) {
        const loader = new GLTFLoader();
        if (dracoDecoderPath) {
          dracoLoader = new DRACOLoader();
          dracoLoader.setDecoderPath(dracoDecoderPath);
          loader.setDRACOLoader(dracoLoader);
        }
        if (ktx2TranscoderPath) {
          ktx2Loader = new KTX2Loader();
          ktx2Loader.setTranscoderPath(ktx2TranscoderPath);
          ktx2Loader.detectSupport(renderer);
          loader.setKTX2Loader(ktx2Loader);
        }
        loader.load(
          modelSrc,
          (gltf) => {
            if (isDisposed()) {
              disposeObject(gltf.scene);
              return;
            }
            install(gltf.scene);
            requestResize();
          },
          undefined,
          () => markFailed(),
        );
      } else {
        const material = new THREE.MeshPhysicalMaterial({ color, metalness, roughness, transmission, thickness: transmission > 0 ? .6 : 0, clearcoat: .45, clearcoatRoughness: .18 });
        install(makePrimitive(primitive, material));
      }
      const projected = new THREE.Vector3();
      let elapsed = 0;
      return {
        onResize: (width, height) => {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        },
        onFrame: (delta) => {
          const currentProduct = product;
          if (!currentProduct) return;
          elapsed += delta;
          (currentProduct.userData.animate as ((time: number) => void) | undefined)?.(elapsed);
          if (!draggingRef.current) rotationRef.current.target += autoRotateRef.current * delta;
          rotationRef.current.current = damp(rotationRef.current.current, rotationRef.current.target, 9, delta);
          rotationRef.current.tilt = damp(rotationRef.current.tilt, rotationRef.current.targetTilt, 9, delta);
          currentProduct.rotation.y = rotationRef.current.current;
          currentProduct.rotation.x = rotationRef.current.tilt;
          currentProduct.updateMatrixWorld();
          hotspotsRef.current.forEach((hotspot) => {
            const element = hotspotRefs.current.get(hotspot.id);
            if (!element) return;
            projected.set(...hotspot.position).applyMatrix4(currentProduct.matrixWorld);
            const facingCamera = projected.z > -.08;
            projected.project(camera);
            const visible = facingCamera && projected.z > -1 && projected.z < 1;
            element.style.setProperty("--hotspot-x", `${(projected.x * .5 + .5) * 100}%`);
            element.style.setProperty("--hotspot-y", `${(-projected.y * .5 + .5) * 100}%`);
            element.style.opacity = visible ? "1" : "0";
            element.style.pointerEvents = visible ? "auto" : "none";
          });
          renderer.render(scene, camera);
        },
        dispose: () => {
          if (product) disposeObject(product);
          floor.geometry.dispose();
          (floor.material as THREE.Material).dispose();
          environment.texture.dispose();
          pmrem.dispose();
          dracoLoader?.dispose();
          ktx2Loader?.dispose();
        },
      };
    },
  });

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || event.button === 0) {
      draggingRef.current = true;
      lastXRef.current = event.clientX;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    onPointerDown?.(event);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (draggingRef.current) {
      const delta = event.clientX - lastXRef.current;
      lastXRef.current = event.clientX;
      rotationRef.current.target += delta * dragSensitivity;
      rotationRef.current.targetTilt = Math.max(-.3, Math.min(.3, (event.clientY / Math.max(1, window.innerHeight) - .5) * .35));
    }
    onPointerMove?.(event);
  };
  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    draggingRef.current = false;
    rotationRef.current.targetTilt = 0;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onPointerUp?.(event);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      rotationRef.current.target += event.key === "ArrowLeft" ? -.32 : .32;
    }
    onKeyDown?.(event);
  };

  return (
    <section ref={rootRef} aria-label={label} tabIndex={0} data-product-orbit data-ready={ready || undefined} data-fallback={failed || staticMode || undefined} className={cn("relative isolate overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-white/70", className)} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onKeyDown={handleKeyDown} {...props}>
      {description ? <p className="sr-only">{description}</p> : null}
      <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 -z-10 size-full touch-none transition-opacity duration-500", ready && !failed && !staticMode ? "opacity-100" : "opacity-0", canvasClassName)} />
      {(failed || staticMode) && fallback ? <div className="absolute inset-0 -z-10">{fallback}</div> : null}
      {!failed && !staticMode ? hotspots.map((hotspot, index) => <Button ref={(node) => { if (node) hotspotRefs.current.set(hotspot.id, node); else hotspotRefs.current.delete(hotspot.id); }} key={hotspot.id} type="button" variant="ghost" size="icon" aria-label={hotspot.label} className="absolute left-[var(--hotspot-x)] top-[var(--hotspot-y)] z-20 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/55 bg-black/48 font-mono text-[.62rem] font-semibold tracking-[.08em] text-white shadow-lg backdrop-blur-md transition-[opacity,background-color] hover:bg-black/78 hover:text-white focus-visible:ring-white" onClick={() => setActiveHotspot((current) => current === hotspot.id ? null : hotspot.id)}>{hotspot.marker ?? String(index + 1).padStart(2, "0")}</Button>) : null}
      {activeHotspot ? <div className="absolute bottom-6 right-6 z-20 max-w-xs rounded-2xl border border-white/15 bg-black/58 p-4 text-sm text-white shadow-2xl backdrop-blur-xl">{hotspots.find((item) => item.id === activeHotspot)?.content ?? hotspots.find((item) => item.id === activeHotspot)?.label}</div> : null}
      {children}
    </section>
  );
}

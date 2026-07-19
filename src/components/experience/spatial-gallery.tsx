"use client";

import * as React from "react";
import { ArrowDown } from "lucide-react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import { clamp01, damp, mix, supportsWebGL, useHydrated, useMediaQuery } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";

export type SpatialGalleryItem = {
  id: string;
  src: string;
  mobileSrc?: string;
  alt: string;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
};

export type SpatialGalleryProps = Omit<React.ComponentProps<"section">, "children"> & {
  label: string;
  items: SpatialGalleryItem[];
  scrollScreens?: number;
  maxDpr?: number;
  curve?: number;
  spacing?: number;
  stageClassName?: string;
  renderCaption?: (item: SpatialGalleryItem, index: number) => React.ReactNode;
  onActiveChange?: (index: number) => void;
};

type GalleryRecord = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  frame: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  texture: THREE.Texture;
};

function GalleryFallback({ items }: { items: SpatialGalleryItem[] }) {
  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => (
        <article key={item.id} className="w-[86vw] shrink-0 snap-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- registry source stays framework-neutral. */}
          <img alt={item.alt} src={item.mobileSrc ?? item.src} className="aspect-[4/5] w-full object-cover" loading="lazy" />
          <div className="p-6">
            {item.eyebrow ? <p className="text-xs uppercase tracking-[0.2em] text-white/50">{item.eyebrow}</p> : null}
            <h3 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">{item.title}</h3>
            {item.description ? <p className="mt-3 text-sm leading-relaxed text-white/60">{item.description}</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

/** A real-camera image tunnel driven by native vertical document scroll. */
export function SpatialGallery({
  className,
  curve = 1.05,
  items,
  label,
  maxDpr = 1.6,
  onActiveChange,
  renderCaption,
  scrollScreens = Math.max(3, items.length * 1.15),
  spacing = 3.65,
  stageClassName,
  ...props
}: SpatialGalleryProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const activeRef = React.useRef(true);
  const scrollProgress = useElementScrollProgress(rootRef);
  const reducedMotion = useReducedMotion();
  const hydrated = useHydrated();
  const mobile = useMediaQuery("(max-width: 767.98px)");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const prefersReducedMotion = hydrated && Boolean(reducedMotion);
  const signature = items.map((item) => `${item.id}:${item.src}:${item.mobileSrc ?? ""}`).join("|");

  React.useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas || prefersReducedMotion || mobile || items.length === 0) return;
    if (!supportsWebGL()) {
      const fallbackTimer = window.setTimeout(() => setFailed(true), 0);
      return () => window.clearTimeout(fallbackTimer);
    }
    let disposed = false;
    let frame = 0;
    let previous = performance.now();
    let smoothed = scrollProgress.get();
    let lastActive = -1;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#08090d");
    scene.fog = new THREE.FogExp2("#08090d", 0.075);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    const loader = new THREE.TextureLoader();
    const records: GalleryRecord[] = [];
    const group = new THREE.Group();
    scene.add(group);

    const load = Promise.all(items.map(async (item, index) => {
      const texture = await loader.loadAsync(item.src);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const image = texture.image as HTMLImageElement;
      const aspect = image.naturalWidth / Math.max(1, image.naturalHeight);
      const height = 1.95;
      const width = Math.min(3.3, height * aspect);
      const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1, toneMapped: true });
      const mesh = new THREE.Mesh(geometry, material);
      const frameGeometry = new THREE.PlaneGeometry(width + 0.08, height + 0.08);
      const frameMaterial = new THREE.MeshBasicMaterial({ color: index % 2 ? 0x9bf7ff : 0xe7ff89, transparent: true, opacity: 0.2 });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      const z = -index * spacing;
      const x = Math.sin(index * 1.18) * curve;
      const y = Math.cos(index * 0.82) * 0.28;
      mesh.position.set(x, y, z);
      frame.position.set(x, y, z - 0.025);
      mesh.rotation.y = -x * 0.075;
      frame.rotation.copy(mesh.rotation);
      group.add(frame, mesh);
      const record = { mesh, frame, texture };
      records[index] = record;
      return record;
    }));

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
        smoothed = damp(smoothed, scrollProgress.get(), 10, delta);
        const floatIndex = smoothed * Math.max(0, items.length - 1);
        const index = Math.min(items.length - 1, Math.max(0, Math.round(floatIndex)));
        if (index !== lastActive) {
          lastActive = index;
          setActiveIndex(index);
          onActiveChange?.(index);
        }
        const cameraZ = 4.65 - floatIndex * spacing;
        const pathX = Math.sin(floatIndex * 1.18) * curve * 0.45;
        const pathY = Math.cos(floatIndex * 0.82) * 0.12;
        camera.position.set(pathX, pathY, cameraZ);
        const lookIndex = Math.min(items.length - 1, floatIndex + 0.28);
        camera.lookAt(Math.sin(lookIndex * 1.18) * curve * 0.52, Math.cos(lookIndex * 0.82) * 0.1, cameraZ - 4.65);
        records.forEach((record, recordIndex) => {
          const distance = Math.abs(floatIndex - recordIndex);
          const focus = clamp01(1 - distance * 0.45);
          const pastFade = clamp01((recordIndex - floatIndex + 0.68) / 0.5);
          const scale = mix(0.78, 1, focus);
          record.mesh.scale.setScalar(scale);
          record.frame.scale.setScalar(scale);
          record.mesh.material.opacity = mix(0.08, 1, focus) * pastFade;
          record.frame.material.opacity = mix(0.015, 0.34, focus) * pastFade;
        });
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(render);
    };

    load.then(() => {
      if (disposed) return;
      resize();
      setReady(true);
      frame = requestAnimationFrame(render);
    }).catch(() => setFailed(true));

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", contextLost);
      records.forEach((record) => {
        record.mesh.geometry.dispose();
        record.mesh.material.dispose();
        record.frame.geometry.dispose();
        record.frame.material.dispose();
        record.texture.dispose();
      });
      renderer.dispose();
    };
  }, [curve, items, maxDpr, mobile, onActiveChange, prefersReducedMotion, scrollProgress, signature, spacing]);

  if (prefersReducedMotion || mobile) {
    return <section ref={rootRef} aria-label={label} data-spatial-gallery data-native-fallback className={cn("min-h-svh bg-[#08090d]", className)} {...props}><GalleryFallback items={items} /></section>;
  }

  const activeItem = items[activeIndex];
  return (
    <section ref={rootRef} aria-label={label} data-spatial-gallery data-ready={ready || undefined} data-fallback={failed || undefined} className={cn("relative isolate bg-[#08090d]", className)} style={{ minHeight: `${Math.max(1, scrollScreens) * 100}svh` }} {...props}>
      <div ref={stageRef} className={cn("sticky top-0 h-svh overflow-hidden", stageClassName)}>
        <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 size-full transition-opacity duration-500", ready && !failed ? "opacity-100" : "opacity-0")} />
        {failed ? <GalleryFallback items={items} /> : null}
        {activeItem ? (
          <div className="pointer-events-none absolute inset-0 flex items-end p-5 pb-8 text-white sm:p-10">
            <div key={activeItem.id} className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderCaption ? renderCaption(activeItem, activeIndex) : (
                <>
                  {activeItem.eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/48">{activeItem.eyebrow}</p> : null}
                  <h2 className="mt-3 text-[clamp(3.4rem,7vw,6.5rem)] font-semibold leading-[0.82] tracking-[-0.07em]">{activeItem.title}</h2>
                  {activeItem.description ? <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/58">{activeItem.description}</p> : null}
                </>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45"><ArrowDown className="size-4" aria-hidden /> {activeIndex + 1} / {items.length}</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

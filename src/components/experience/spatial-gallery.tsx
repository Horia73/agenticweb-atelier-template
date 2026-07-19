"use client";

import * as React from "react";
import { ArrowDown } from "lucide-react";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import { clamp01, damp, mix, useCoarsePointer, useExperienceViewport, usePrefersReducedMotion } from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";
import { useWebGLStage } from "@/components/experience/use-webgl-stage";

export type SpatialGalleryItem = {
  id: string;
  src: string;
  mobileSrc?: string;
  tabletSrc?: string;
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
  /** Scene background, fog and section background color. */
  background?: string;
  /** Alternating frame accent colors behind the images. */
  accentColors?: [string, string];
  /** Damping factor for the scroll-follow camera; higher is snappier. */
  smoothing?: number;
  stageClassName?: string;
  renderCaption?: (item: SpatialGalleryItem, index: number) => React.ReactNode;
  onActiveChange?: (index: number) => void;
};

type GalleryRecord = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  frame: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  texture: THREE.Texture;
};

const DEFAULT_ACCENT_COLORS: [string, string] = ["#9bf7ff", "#e7ff89"];

function galleryPoint(index: number, curve: number) {
  const side = index % 2 === 0 ? -1 : 1;
  const amplitude = 0.56 + (index % 4) * 0.045;
  return {
    x: side * curve * amplitude,
    y: ((index % 3) - 1) * 0.16,
  };
}

function sampleGalleryPath(value: number, count: number, curve: number) {
  const fromIndex = Math.max(0, Math.min(count - 1, Math.floor(value)));
  const toIndex = Math.max(0, Math.min(count - 1, fromIndex + 1));
  const local = clamp01(value - fromIndex);
  const eased = local * local * (3 - 2 * local);
  const from = galleryPoint(fromIndex, curve);
  const to = galleryPoint(toIndex, curve);
  return { x: mix(from.x, to.x, eased), y: mix(from.y, to.y, eased) };
}

function GalleryFallback({ items, viewport }: { items: SpatialGalleryItem[]; viewport: "mobile" | "tablet" | "desktop" }) {
  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-16 [scrollbar-width:none] sm:gap-6 sm:px-8 sm:py-20 [&::-webkit-scrollbar]:hidden">
      {items.map((item) => (
        <article key={item.id} className="w-[86vw] shrink-0 snap-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 text-white sm:w-[min(68vw,34rem)] sm:rounded-[2rem]">
          {/* eslint-disable-next-line @next/next/no-img-element -- registry source stays framework-neutral. */}
          <img alt={item.alt} src={viewport === "mobile" ? item.mobileSrc ?? item.tabletSrc ?? item.src : item.tabletSrc ?? item.src} className="aspect-[4/5] w-full object-cover sm:aspect-[5/4]" loading="lazy" />
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
  accentColors = DEFAULT_ACCENT_COLORS,
  background = "#08090d",
  className,
  curve = 1.05,
  items,
  label,
  maxDpr = 1.6,
  onActiveChange,
  renderCaption,
  scrollScreens = Math.max(3, items.length * 1.15),
  smoothing = 6.5,
  spacing = 3.65,
  stageClassName,
  ...props
}: SpatialGalleryProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const scrollProgress = useElementScrollProgress(rootRef);
  const prefersReducedMotion = usePrefersReducedMotion();
  const coarsePointer = useCoarsePointer();
  const viewport = useExperienceViewport();
  const nativeFallback = prefersReducedMotion || coarsePointer || viewport !== "desktop";
  const [activeIndex, setActiveIndex] = React.useState(0);
  const onActiveChangeRef = React.useRef(onActiveChange);
  React.useInsertionEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  });

  const { ready, failed } = useWebGLStage({
    stageRef,
    canvasRef,
    enabled: !nativeFallback && items.length > 0,
    maxDpr,
    antialias: true,
    signature: JSON.stringify([
      accentColors,
      background,
      curve,
      smoothing,
      spacing,
      items.map((item) => [item.id, item.src, item.mobileSrc ?? "", item.alt]),
    ]),
    create: ({ renderer, markReady, markFailed, isDisposed, requestResize }) => {
      let smoothed = scrollProgress.get();
      let lastActive = -1;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(background);
      scene.fog = new THREE.FogExp2(background, 0.075);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      const loader = new THREE.TextureLoader();
      const records: GalleryRecord[] = [];
      const group = new THREE.Group();
      scene.add(group);

      Promise.all(items.map(async (item, index) => {
        const texture = await loader.loadAsync(item.src);
        if (isDisposed()) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        const image = texture.image as HTMLImageElement;
        const aspect = image.naturalWidth / Math.max(1, image.naturalHeight);
        const height = 1.95;
        const width = Math.min(3.3, height * aspect);
        const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, toneMapped: true });
        const mesh = new THREE.Mesh(geometry, material);
        const frameGeometry = new THREE.PlaneGeometry(width + 0.08, height + 0.08);
        const frameMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(index % 2 ? accentColors[0] : accentColors[1]), transparent: true, opacity: 0 });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        mesh.visible = false;
        frame.visible = false;
        const z = -index * spacing;
        const { x, y } = galleryPoint(index, curve);
        mesh.position.set(x, y, z);
        frame.position.set(x, y, z - 0.025);
        mesh.rotation.y = -x * 0.075;
        frame.rotation.copy(mesh.rotation);
        group.add(frame, mesh);
        records[index] = { mesh, frame, texture };
      })).then(() => {
        if (isDisposed()) return;
        records.forEach((record, index) => {
          const initial = index === 0;
          record.mesh.visible = initial;
          record.frame.visible = initial;
          record.mesh.material.opacity = initial ? 1 : 0;
          record.frame.material.opacity = initial ? 0.34 : 0;
        });
        const initialPath = sampleGalleryPath(0, items.length, curve);
        const initialLook = sampleGalleryPath(0.28, items.length, curve);
        camera.position.set(initialPath.x * 0.45, initialPath.y * 0.42, 4.65);
        camera.lookAt(initialLook.x * 0.52, initialLook.y * 0.38, 0);
        requestResize();
        markReady();
      }).catch(() => markFailed());

      return {
        onResize: (width, height) => {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
        },
        onFrame: (delta) => {
          smoothed = damp(smoothed, scrollProgress.get(), smoothing, delta);
          const floatIndex = smoothed * Math.max(0, items.length - 1);
          const index = Math.min(items.length - 1, Math.max(0, Math.round(floatIndex)));
          if (index !== lastActive) {
            lastActive = index;
            setActiveIndex(index);
            onActiveChangeRef.current?.(index);
          }
          const cameraZ = 4.65 - floatIndex * spacing;
          const path = sampleGalleryPath(floatIndex, items.length, curve);
          camera.position.set(path.x * 0.45, path.y * 0.42, cameraZ);
          const lookIndex = Math.min(items.length - 1, floatIndex + 0.28);
          const lookPath = sampleGalleryPath(lookIndex, items.length, curve);
          camera.lookAt(lookPath.x * 0.52, lookPath.y * 0.38, cameraZ - 4.65);
          records.forEach((record, recordIndex) => {
            const distance = Math.abs(floatIndex - recordIndex);
            const focus = clamp01(1 - distance * 0.36);
            const entryRaw = clamp01((floatIndex - (recordIndex - 0.92)) / 0.68);
            const exitRaw = clamp01((recordIndex + 0.86 - floatIndex) / 0.38);
            const entryFade = entryRaw * entryRaw * (3 - 2 * entryRaw);
            const exitFade = exitRaw * exitRaw * (3 - 2 * exitRaw);
            const opacity = focus * entryFade * exitFade;
            const insideCameraWindow = opacity > 0.002 && distance < 1.18;
            const scale = mix(0.82, 1, focus);
            record.mesh.scale.setScalar(scale);
            record.frame.scale.setScalar(scale);
            record.mesh.visible = insideCameraWindow;
            record.frame.visible = insideCameraWindow;
            record.mesh.material.opacity = insideCameraWindow ? opacity : 0;
            record.frame.material.opacity = insideCameraWindow ? opacity * 0.3 : 0;
          });
          renderer.render(scene, camera);
        },
        dispose: () => {
          records.forEach((record) => {
            record.mesh.geometry.dispose();
            record.mesh.material.dispose();
            record.frame.geometry.dispose();
            record.frame.material.dispose();
            record.texture.dispose();
          });
        },
      };
    },
  });

  if (nativeFallback) {
    return <section ref={rootRef} aria-label={label} data-spatial-gallery data-experience-viewport={viewport} data-native-fallback className={cn("min-h-svh", className)} style={{ backgroundColor: background }} {...props}><GalleryFallback items={items} viewport={viewport} /></section>;
  }

  const activeItem = items[activeIndex];
  return (
    <section ref={rootRef} aria-label={label} data-spatial-gallery data-experience-viewport={viewport} data-ready={ready || undefined} data-fallback={failed || undefined} className={cn("relative isolate", className)} style={{ backgroundColor: background, minHeight: `${Math.max(1, scrollScreens) * 100}svh` }} {...props}>
      <div ref={stageRef} className={cn("sticky top-0 h-svh overflow-hidden", stageClassName)}>
        <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 size-full transition-opacity duration-500", ready && !failed ? "opacity-100" : "opacity-0")} />
        {failed ? <GalleryFallback items={items} viewport={viewport} /> : null}
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

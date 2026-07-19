"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowDown, MoveHorizontal, Scan } from "lucide-react";
import { motion, type MotionValue, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

import { BeforeAfter } from "@/components/experience/before-after";
import { CinematicWorldScene } from "@/components/experience/cinematic-world-scene";
import { CursorLens } from "@/components/experience/cursor-ambient";
import { MagneticField, MagneticTarget } from "@/components/experience/cursor-magnetic";
import type { DepthCameraLayer } from "@/components/experience/depth-camera-scene";
import { DepthGallery, type DepthGalleryItem } from "@/components/experience/depth-gallery";
import { ExpandingMedia } from "@/components/experience/expanding-media";
import { ElasticImageGrid, type ElasticImageGridItem } from "@/components/experience/elastic-image-grid";
import { FilmStrip3D, type FilmStrip3DItem } from "@/components/experience/film-strip-3d";
import { FluidSurface } from "@/components/experience/fluid-surface";
import { HorizontalStoryRail } from "@/components/experience/horizontal-story-rail";
import { HorizontalTrack } from "@/components/experience/horizontal-track";
import { ImageSequenceScrub } from "@/components/experience/image-sequence-scrub";
import { KineticType, type KineticTypeSegment } from "@/components/experience/kinetic-type";
import { LiquidGlassNav, LiquidGlassSurface } from "@/components/experience/liquid-glass";
import { MaskReveal } from "@/components/experience/mask-reveal";
import { MediaPortal } from "@/components/experience/media-portal";
import { MeshTransition } from "@/components/experience/mesh-transition";
import { ParticleAssembly } from "@/components/experience/particle-assembly";
import { ProductOrbit } from "@/components/experience/product-orbit";
import { RefractiveGlass } from "@/components/experience/refractive-glass";
import { SceneHandoff } from "@/components/experience/scene-handoff";
import { ShaderField } from "@/components/experience/shader-field";
import { SliceRecompose } from "@/components/experience/slice-recompose";
import { SpatialCanvas, type SpatialCanvasItem } from "@/components/experience/spatial-canvas";
import { SpatialGallery, type SpatialGalleryItem } from "@/components/experience/spatial-gallery";
import { SpatialProductStage, type SpatialProductPart } from "@/components/experience/spatial-product-stage";
import { ScrollDepthScene, type LayeredDepthLayer } from "@/components/experience/layered-depth";
import { StickyStory, type StickyStoryChapter } from "@/components/experience/sticky-story";
import { TypographyDepthTunnel, type TypographyDepthTunnelItem } from "@/components/experience/typography-depth-tunnel";
import { VolumetricLightStage } from "@/components/experience/volumetric-light-stage";
import { useMediaQuery } from "@/components/experience/experience-runtime";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { ExperienceLabGuideSection, ExperienceLabSidebar } from "@/app/experience-lab/experience-lab-chrome";
import { experienceLabGuides } from "@/app/experience-lab/experience-lab-guides";

const ASSETS = {
  carBackground: "/experience/depth-car-v3/background.webp",
  carPoster: "/experience/depth-car-v3/poster.webp",
  carSubject: "/experience/depth-car-v3/subject.webp",
  carSequence: "/experience/sequence-car-v2/poster.webp",
  portrait: "/experience/spatial-product-stage-v1/portrait.webp",
  respiratorAssembled: "/experience/spatial-product-stage-v1/respirator/assembled.webp",
  respiratorMask: "/experience/spatial-product-stage-v1/respirator/mask.png",
  respiratorComposite: "/experience/spatial-product-stage-v1/respirator/qa-composite.webp",
  worldPoster: "/experience/depth-camera-world-v2/poster.webp",
  worldMobile: "/experience/depth-camera-world-v2/mobile-poster.webp",
  emptyWorld: "/experience/depth-camera-world-v2/layers/00-sky.webp",
  meshCar: "/experience/mesh-transition-v1/car-2x.webp",
  meshWorld: "/experience/mesh-transition-v1/world-2x.webp",
} as const;

const WORLD = {
  sky: "/experience/depth-camera-world-v2/layers/00-sky.webp",
  landscape: "/experience/depth-camera-world-v2/layers/10-landscape.webp",
  midground: "/experience/depth-camera-world-v2/layers/20-midground.webp",
  reflection: "/experience/depth-camera-world-v2/layers/29-contact-reflection.webp",
  hero: "/experience/depth-camera-world-v2/layers/30-hero.webp",
  left: "/experience/depth-camera-world-v2/layers/40-foreground-left.webp",
  right: "/experience/depth-camera-world-v2/layers/41-foreground-right.webp",
  edge: "/experience/depth-camera-world-v2/layers/50-edge-frame.webp",
  skyMobile: "/experience/depth-camera-world-v2/layers-mobile/00-sky.webp",
  landscapeMobile: "/experience/depth-camera-world-v2/layers-mobile/10-landscape.webp",
  midgroundMobile: "/experience/depth-camera-world-v2/layers-mobile/20-midground.webp",
  reflectionMobile: "/experience/depth-camera-world-v2/layers-mobile/29-contact-reflection.webp",
  heroMobile: "/experience/depth-camera-world-v2/layers-mobile/30-hero.webp",
  leftMobile: "/experience/depth-camera-world-v2/layers-mobile/40-foreground-left.webp",
  rightMobile: "/experience/depth-camera-world-v2/layers-mobile/41-foreground-right.webp",
  edgeMobile: "/experience/depth-camera-world-v2/layers-mobile/50-edge-frame.webp",
} as const;

function SceneImage({ alt = "", className, priority = false, sizes = "(min-width: 1024px) calc(100vw - 22rem), 100vw", src }: { alt?: string; className?: string; priority?: boolean; sizes?: string; src: string }) {
  return <Image alt={alt} src={src} fill priority={priority} loading={priority ? "eager" : undefined} sizes={sizes} className={className} />;
}

const worldLayers: DepthCameraLayer[] = [
  { id: "00-sky", src: WORLD.sky, mobileSrc: WORLD.skyMobile, plane: "back", depth: -2.4, opaque: true },
  { id: "10-landscape", src: WORLD.landscape, mobileSrc: WORLD.landscapeMobile, plane: "back", depth: -1.6 },
  { id: "20-midground", src: WORLD.midground, mobileSrc: WORLD.midgroundMobile, plane: "back", depth: -0.8 },
  { id: "29-contact-reflection", src: WORLD.reflection, mobileSrc: WORLD.reflectionMobile, plane: "front", depth: -0.08, opacity: 0.9 },
  { id: "30-hero", src: WORLD.hero, mobileSrc: WORLD.heroMobile, plane: "front", depth: 0, timeline: [{ at: 0 }, { at: 1, x: 0.055, y: -0.015 }] },
  { id: "40-foreground-left", src: WORLD.left, mobileSrc: WORLD.leftMobile, plane: "front", depth: 0.75, timeline: [{ at: 0 }, { at: 1, x: -0.16, y: -0.035 }] },
  { id: "41-foreground-right", src: WORLD.right, mobileSrc: WORLD.rightMobile, plane: "front", depth: 0.9, timeline: [{ at: 0 }, { at: 1, x: 0.18, y: -0.04 }] },
  { id: "50-edge-frame", src: WORLD.edge, mobileSrc: WORLD.edgeMobile, plane: "front", depth: 1.05, opacity: 0.76, dropOnLowPower: true },
];

const carLayers: LayeredDepthLayer[] = [
  {
    id: "master",
    depth: 0.1,
    pointer: false,
    timeline: [{ at: 0, scale: 1 }, { at: 1, scale: 1.18, y: -12 }],
    content: <SceneImage src={ASSETS.carPoster} priority className="object-cover" />,
  },
  {
    id: "rear-copy",
    depth: 0.4,
    pointer: false,
    ariaHidden: false,
    timeline: [{ at: 0, opacity: 0, y: "20vh" }, { at: 0.3, opacity: 1, y: "0vh" }, { at: 0.72, opacity: 0, y: "-16vh" }],
    content: <div className="flex h-full items-end justify-center pb-[10vh] text-white"><p className="text-[clamp(4rem,13vw,12rem)] font-semibold leading-none tracking-[-0.08em]">GRAND TOURING</p></div>,
  },
  {
    id: "subject-matte",
    depth: 0.72,
    pointer: false,
    timeline: [{ at: 0, z: 12, scale: 1 }, { at: 1, z: 20, scale: 1.18, y: -12 }],
    content: <SceneImage src={ASSETS.carSubject} priority className="object-cover" />,
  },
  {
    id: "front-copy",
    depth: 0.9,
    pointer: false,
    ariaHidden: false,
    timeline: [{ at: 0, opacity: 0, y: "-18vh" }, { at: 0.56, opacity: 0, y: "-18vh" }, { at: 0.8, opacity: 1, y: "0vh" }, { at: 1, opacity: 1, y: "0vh" }],
    content: <div className="flex h-full items-start px-6 pt-[18vh] text-white sm:px-[7vw]"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/58">A continental state of mind</p><p className="mt-3 max-w-[9ch] text-[clamp(2.8rem,6vw,6rem)] font-semibold leading-[0.84] tracking-[-0.07em]">Built for the long way.</p></div></div>,
  },
];

const respiratorPlateParts: SpatialProductPart[] = [
  { id: "left-filter", geometry: { type: "plane", size: [2.25, 2.25] }, texture: "/experience/spatial-product-stage-v1/respirator/10-left-filter.webp", assembled: { position: [0, 0, 0.05] }, exploded: { position: [-2.8, -0.45, 1.7], rotation: [-0.35, -0.8, -0.6], scale: 0.8 }, assemblyDelay: 0.04 },
  { id: "left-shell", geometry: { type: "plane", size: [2.25, 2.25] }, texture: "/experience/spatial-product-stage-v1/respirator/20-left-shell.webp", assembled: { position: [0, 0, 0.04] }, exploded: { position: [-2.1, 1.5, 1.1], rotation: [0.4, -0.7, -0.4], scale: 0.82 }, assemblyDelay: 0.1 },
  { id: "center-core", geometry: { type: "plane", size: [2.25, 2.25] }, texture: "/experience/spatial-product-stage-v1/respirator/30-center-core.webp", assembled: { position: [0, 0, 0.08] }, exploded: { position: [0, -2.6, 1.8], rotation: [0.75, 0.15, 0.12], scale: 0.76 }, assemblyDelay: 0.2 },
  { id: "right-shell", geometry: { type: "plane", size: [2.25, 2.25] }, texture: "/experience/spatial-product-stage-v1/respirator/40-right-shell.webp", assembled: { position: [0, 0, 0.03] }, exploded: { position: [2.15, 1.35, 1.25], rotation: [-0.35, 0.75, 0.45], scale: 0.82 }, assemblyDelay: 0.12 },
  { id: "right-filter", geometry: { type: "plane", size: [2.25, 2.25] }, texture: "/experience/spatial-product-stage-v1/respirator/50-right-filter.webp", assembled: { position: [0, 0, 0.06] }, exploded: { position: [2.9, -0.65, 1.9], rotation: [0.45, 0.9, 0.65], scale: 0.8 }, assemblyDelay: 0.06 },
];

const galleryItems: SpatialGalleryItem[] = [
  { id: "world", src: ASSETS.worldPoster, alt: "Portal de obsidian într-un peisaj mineral", eyebrow: "01 / World", title: "Threshold", description: "Un cadru de lume, nu un card într-un carousel." },
  { id: "portrait", src: ASSETS.portrait, alt: "Portret editorial pentru un produs wearable", eyebrow: "02 / Human", title: "Interface", description: "Camera trece printr-o galerie spațială reală." },
  { id: "car", src: ASSETS.carPoster, alt: "Automobil pe un drum de coastă", eyebrow: "03 / Motion", title: "Velocity", description: "Fiecare plan păstrează scară, focus și distanță." },
  { id: "origin", src: ASSETS.emptyWorld, alt: "Orizont mineral fără obiect central", eyebrow: "04 / Origin", title: "Silence", description: "Pe mobil revine la un rail nativ, complet navigabil." },
];

const depthGalleryItems: DepthGalleryItem[] = [
  { id: "threshold", eyebrow: "01 / Threshold", title: "A world in focus", description: "Cardul activ se ridică; următoarele cadre păstrează o profunzime controlată.", depth: 0.8, content: <SceneImage src={ASSETS.worldPoster} className="object-cover" /> },
  { id: "interface", eyebrow: "02 / Interface", title: "Human scale", description: "Conținutul rămâne React editabil, independent de mecanica stack-ului.", depth: 0.55, content: <SceneImage src={ASSETS.portrait} className="object-cover object-[68%_center]" /> },
  { id: "velocity", eyebrow: "03 / Velocity", title: "Forward motion", description: "Scroll-ul invers reconstruiește stiva fără schimbări bruște de z-index.", depth: 0.72, content: <SceneImage src={ASSETS.carPoster} className="object-cover" /> },
  { id: "origin", eyebrow: "04 / Origin", title: "Return to silence", description: "Pe touch, aceeași structură devine un rail nativ cu snap și accesibilitate.", depth: 0.45, content: <SceneImage src={ASSETS.emptyWorld} className="object-cover" /> },
];

const sequenceFrames = Array.from({ length: 36 }, (_, index) => `/experience/sequence-car-v2/frames/frame-${String(index + 1).padStart(3, "0")}.webp`);

function AdvancedDemo() {
  const catalog = ["Matter", "Horizon", "Reflection", "Threshold"].map((title, index) => (
    <article key={title} className={cn("relative flex h-full flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/12 p-7 shadow-2xl backdrop-blur-xl", index === 1 ? "bg-[#d6b16e]/92 text-black" : "bg-[#10161a]/88 text-white")}>
      <div className="absolute inset-0 opacity-20"><SceneImage src={ASSETS.worldPoster} className={cn("object-cover", index % 2 ? "object-left" : "object-right")} /></div>
      <span className="relative text-xs font-semibold uppercase tracking-[0.2em]">0{index + 1}</span>
      <div className="relative"><h3 className="text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.82] tracking-[-0.07em]">{title}</h3><p className="mt-4 max-w-sm text-sm opacity-60">Conținut editabil; scena nu impune un template vizual.</p></div>
    </article>
  ));
  return (
    <div className="bg-[#080c0f]">
      <CinematicWorldScene
        label="DepthCameraScene Advanced cu cameră Three.js și ocluzie semantică"
        catalogRegionLabel="Catalog de cadre"
        previousFrameLabel="Cadrul anterior"
        nextFrameLabel="Cadrul următor"
        layers={worldLayers}
        poster={ASSETS.worldPoster}
        mobilePoster={ASSETS.worldMobile}
        scrollScreens={7.2}
        intro={<div className="flex h-full items-end px-5 pb-[9vh] text-white sm:px-[7vw]"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/58">P0 / Depth camera</p><h1 className="mt-5 max-w-[10ch] text-[clamp(4rem,9vw,9rem)] font-semibold leading-[0.78] tracking-[-0.08em]">Din materie, în experiență.</h1><p className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60"><ArrowDown className="size-4" /> scroll vertical</p></div></div>}
        chrome={<div className="flex justify-between px-6 pt-[5.5rem] text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-white/60"><span>DepthCameraScene</span><span>registered plates · real dolly</span></div>}
        rearNarrative={<div className="flex h-full items-center justify-end px-[4vw] text-right text-white"><div><p className="text-xs uppercase tracking-[0.22em] text-white/55">01 / Behind hero</p><p className="text-[clamp(6rem,16vw,15rem)] font-semibold leading-none tracking-[-0.09em]">FORMĂ</p></div></div>}
        frontNarrative={<div className="flex h-full items-center px-5 text-white sm:px-[7vw]"><div><p className="text-xs uppercase tracking-[0.22em] text-white/55">02 / Front plane</p><p className="mt-4 text-[clamp(3.6rem,8vw,8rem)] font-semibold leading-[0.82] tracking-[-0.07em]">Tăcerea<br />are volum.</p></div></div>}
        catalog={{ eyebrow: "03 / Local interaction", heading: <>Lumea continuă.<br />UI-ul se schimbă.</>, items: catalog, label: "Catalog Advanced", itemClassName: (index) => cn("h-[min(48svh,34rem)]", index % 2 ? "w-[min(88vw,58rem)]" : "w-[min(80vw,43rem)]") }}
        reducedMotionFallback={<div className="relative min-h-svh overflow-hidden bg-black text-white"><SceneImage src={ASSETS.worldPoster} priority className="object-cover brightness-50" /><div className="relative flex min-h-svh items-end p-8"><h1 className="max-w-[9ch] text-6xl font-semibold tracking-[-0.07em]">Din materie, în experiență.</h1></div></div>}
      />
      <section className="grid min-h-[65svh] place-items-center bg-[#e7e3da] px-5 text-center text-black"><div><p className="text-xs uppercase tracking-[0.2em] opacity-50">Normal flow</p><p className="mt-4 text-[clamp(3rem,7vw,7rem)] font-semibold leading-[0.84] tracking-[-0.07em]">Scena se termină.<br />Pagina continuă.</p></div></section>
    </div>
  );
}

function BasicDepthDemo() {
  return <ScrollDepthScene label="2.5D Basic cu mașină și occlusion matte" layers={carLayers} pointerTravel={0} scrollScreens={3.2} sourceContract={{ sourceId: "adriatic-road-v3", mode: "integrated-occlusion", aligned: true, contactPlates: 1 }} stageClassName="bg-black" reducedMotionFallback={<div className="relative h-svh"><SceneImage src={ASSETS.carPoster} className="object-cover" /></div>} overlay={<div className="flex h-full flex-col justify-between p-6 pb-10 pt-24 text-xs uppercase tracking-[0.2em] text-white"><span>Basic / registered master + subject matte</span><span className="flex items-center gap-2"><ArrowDown className="size-4" /> scroll controls depth</span></div>} />;
}

function SpatialProductDemo() {
  const [mode, setMode] = React.useState<"hover" | "scroll" | "hybrid">("hybrid");
  return (
    <SpatialProductStage
      key={mode}
      label="Wearable care se asamblează pe portret"
      mode={mode}
      parts={respiratorPlateParts}
      groupPosition={[1.58, -0.4, 0]}
      mobileGroupPosition={[0, 1.7, 0]}
      groupScale={1.24}
      hoverAnchor={[0.74, 0.53]}
      hoverRadius={0.22}
      idleVisibility="hidden"
      smoothing={4.6}
      scrollScreens={2.4}
      stageClassName="bg-[#eaf1f6]"
      visual={<div className="absolute inset-0"><SceneImage src={ASSETS.portrait} priority className="object-cover object-[70%_center]" /></div>}
      overlay={<div className="flex h-full flex-col justify-between p-5 pb-8 pt-24 text-[#101720] sm:p-10 sm:pt-28"><div className="pointer-events-auto w-fit"><label htmlFor="assembly-mode" className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.2em] opacity-50">Driver</label><NativeSelect id="assembly-mode" value={mode} onChange={(event) => setMode(event.currentTarget.value as typeof mode)} className="w-40 bg-white/75"><NativeSelectOption value="hybrid">Hybrid</NativeSelectOption><NativeSelectOption value="hover">Hover</NativeSelectOption><NativeSelectOption value="scroll">Scroll</NativeSelectOption></NativeSelect></div><div className="max-w-sm"><p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-45">P1 / Spatial product</p><h1 className="mt-4 text-[clamp(3rem,6vw,6rem)] font-semibold leading-[0.86] tracking-[-0.065em]">Clean air.<br />Clear mind.</h1><p className="mt-5 text-sm leading-relaxed opacity-60">Piesele pot fi primitive editabile sau noduri dintr-un GLB real.</p></div></div>}
      fallback={<div className="relative min-h-svh overflow-hidden"><SceneImage src={ASSETS.portrait} className="object-cover object-[70%_center]" /><div className="absolute left-1/2 top-[25%] size-[72vw] max-h-[32rem] max-w-[32rem] -translate-x-1/2 sm:left-auto sm:right-[7%] sm:top-[25%] sm:size-[38vw] sm:translate-x-0"><SceneImage src={ASSETS.respiratorAssembled} className="object-contain" /></div></div>}
    />
  );
}

function LiquidGlassDemo() {
  const mobile = useMediaQuery("(max-width: 639.98px)");
  const navItems = ["Origin", "Material", "Process", "Archive"].map((label) => ({ id: label.toLowerCase(), label, href: `#${label.toLowerCase()}` }));
  return (
    <section className="relative h-svh overflow-hidden bg-black text-white">
      <SceneImage src={ASSETS.worldPoster} priority className="object-cover brightness-[.82] saturate-[1.18]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_64%_25%,transparent_0%,rgba(0,0,0,.08)_52%,rgba(0,0,0,.38)_100%)]" />
      <div className="absolute inset-x-5 top-24 z-10 mx-auto max-w-5xl"><LiquidGlassNav label="Navigație liquid glass" items={mobile ? navItems.slice(0, 2) : navItems} brand={mobile ? undefined : "APERTURE"} surfaceProps={{ blur: 6, saturation: 1.6, borderOpacity: 0.12 }} action={<a href="#contact" className="flex h-10 items-center rounded-xl border border-white/14 bg-white/[.045] px-4 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.14)] backdrop-blur-[4px] transition-colors hover:bg-white/[.09]">Start</a>} /></div>
      <div className="relative flex h-full items-end p-5 pb-10 sm:p-10"><LiquidGlassSurface variant="clear" blur={6} saturation={1.6} borderOpacity={0.12} className="max-w-xl rounded-[2rem] p-7 sm:p-10"><p className="text-xs uppercase tracking-[0.2em] text-white/65">P2 / Clear liquid surface</p><h1 className="mt-4 text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[0.82] tracking-[-0.07em] [text-shadow:0_2px_24px_rgb(0_0_0/.42)]">Glass care aparține lumii.</h1><p className="mt-5 max-w-md text-sm leading-relaxed text-white/78 [text-shadow:0_1px_14px_rgb(0_0_0/.5)]">Lensing subtil, transparență contextuală și highlights adaptive — fără un panou lăptos peste scenă.</p></LiquidGlassSurface></div>
    </section>
  );
}

function ShaderDemo() {
  const [mode, setMode] = React.useState<"aurora" | "metaballs" | "contour" | "caustic">("caustic");
  return <ShaderField label="Câmp shader reactiv" mode={mode} colors={["#f4d7a2", "#73d7ff", "#071426"]} speed={0.62} intensity={1.2} pointerStrength={0.65} className="flex h-svh items-end px-5 pb-[7vh] text-white sm:px-[7vw]" fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_28%,#456d80,#071426_48%,#02070c_82%)]" />}><div className="pointer-events-auto absolute left-5 top-24 z-10 sm:left-10 sm:top-28"><label htmlFor="shader-mode" className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/50">Field</label><NativeSelect id="shader-mode" value={mode} onChange={(event) => setMode(event.currentTarget.value as typeof mode)} className="w-40 border-white/15 bg-black/28 text-white backdrop-blur-xl"><NativeSelectOption value="caustic">Caustic</NativeSelectOption><NativeSelectOption value="aurora">Aurora</NativeSelectOption><NativeSelectOption value="metaballs">Metaballs</NativeSelectOption><NativeSelectOption value="contour">Contour</NativeSelectOption></NativeSelect></div><div className="relative max-w-5xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/58">P3 / Caustic field</p><h1 className="mt-5 text-[clamp(3.7rem,10vw,10rem)] font-semibold leading-[0.84] tracking-[-0.085em]">LIGHT<br />BECOMES<br />MATERIAL.</h1><p className="mt-6 max-w-md text-sm leading-relaxed text-white/62">Un ambient GPU editabil, cu mișcare lentă și spațiu real pentru conținut.</p></div></ShaderField>;
}

function MediaPortalDemo() {
  return <MediaPortal label="Portal media care se extinde la full viewport" shape="vertical" trigger="scroll" scrollScreens={2.7} backdrop={<div className="absolute inset-0 bg-[#e6e2d8] text-[#131313]"><div className="flex h-full items-center px-5 sm:px-[7vw]"><p className="max-w-[9ch] text-[clamp(4rem,9vw,9rem)] font-semibold leading-[0.78] tracking-[-0.08em]">Un gest deschide lumea.</p></div></div>} media={<div className="absolute inset-0"><SceneImage src={ASSETS.worldPoster} priority className="object-cover" /></div>}><div className="flex h-full flex-col items-start justify-end gap-2 p-6 pb-10 text-white mix-blend-difference sm:flex-row sm:items-end sm:justify-between sm:p-10"><p className="text-xs uppercase tracking-[0.2em]">P4 / Media portal</p><p className="max-w-xs text-sm text-white/70 sm:text-right">Orice imagine, video sau componentă React poate trăi în apertură.</p></div></MediaPortal>;
}

function SpatialGalleryDemo() {
  return <SpatialGallery label="Galerie Three.js parcursă cu scroll vertical" items={galleryItems} />;
}

function TransitionCopy({ progress }: { progress: MotionValue<number> }) {
  const firstOpacity = useTransform(progress, [0, 0.35, 0.55], [1, 1, 0]);
  const secondOpacity = useTransform(progress, [0.45, 0.7, 1], [0, 1, 1]);
  return <div className="relative h-full p-6 pt-24 text-white sm:p-10 sm:pt-28"><motion.div className="absolute bottom-10 left-6 sm:left-10" style={{ opacity: firstOpacity }}><p className="text-xs uppercase tracking-[0.2em]">P6 / Mesh transition</p><p className="mt-3 text-4xl font-semibold tracking-[-0.07em] sm:text-8xl">Velocity.</p></motion.div><motion.div className="absolute bottom-10 right-6 text-right sm:right-10" style={{ opacity: secondOpacity }}><p className="text-xs uppercase tracking-[0.2em]">Destination</p><p className="mt-3 text-4xl font-semibold tracking-[-0.07em] sm:text-8xl">Threshold.</p></motion.div></div>;
}

function MeshTransitionDemo() {
  return <MeshTransition label="Tranziție mesh între automobil și portal" from={{ src: ASSETS.meshCar, alt: "Automobil pe coastă" }} to={{ src: ASSETS.meshWorld, alt: "Portal în peisaj mineral" }} mode="liquid" trigger="scroll" scrollScreens={2.5} fallback={<SceneImage src={ASSETS.worldPoster} className="object-cover" />} overlay={(progress) => <TransitionCopy progress={progress} />} />;
}

const railItems = [
  ["01", "Context", "Scroll-ul documentului rămâne vertical și nativ."],
  ["02", "Proof", "Dimensiunile cardurilor pot varia complet."],
  ["03", "Detail", "Track-ul este măsurat, nu aproximat."],
  ["04", "Release", "După final, pagina continuă normal."],
] as const;

function HorizontalDemo() {
  return <HorizontalStoryRail label="Rail orizontal controlat prin scroll vertical" className="bg-[#111318] text-white" stageClassName="pt-20" itemClassName="h-[min(68svh,42rem)]">{railItems.map(([number, title, body], index) => <article key={number} className={cn("flex h-full flex-col justify-between rounded-[2rem] p-8 sm:p-12", index % 2 ? "bg-[#d7ff43] text-black" : "bg-white text-black")}><div className="flex justify-between text-xs uppercase tracking-[0.18em]"><span>Horizontal rail</span><MoveHorizontal className="size-5" /></div><p className="text-[clamp(6rem,14vw,11rem)] font-semibold leading-none tracking-[-0.09em] opacity-12">{number}</p><div><h2 className="text-5xl font-semibold tracking-[-0.06em] sm:text-7xl">{title}</h2><p className="mt-4 max-w-lg opacity-60">{body}</p></div></article>)}</HorizontalStoryRail>;
}

function ControlledTrackDemo() {
  const target = useMotionValue(0);
  const smooth = useSpring(target, { stiffness: 150, damping: 30, mass: 0.28 });
  const reduced = useReducedMotion();
  const progress = reduced ? target : smooth;
  const [index, setIndex] = React.useState(0);
  const go = (next: number) => { const value = Math.max(0, Math.min(railItems.length - 1, next)); setIndex(value); target.set(value / (railItems.length - 1)); };
  return <section className="flex h-svh flex-col overflow-hidden bg-[#101114] pb-6 pt-24 text-white"><div className="flex items-end justify-between px-5 sm:px-[5vw]"><div><p className="text-xs uppercase tracking-[0.2em] text-white/50">Controlled track</p><h1 className="mt-3 text-5xl font-semibold tracking-[-0.06em]">Orice dimensiune.</h1></div><div className="flex gap-2"><Button variant="outline" size="icon" className="rounded-full border-white/20 bg-white/5 text-white" disabled={index === 0} onClick={() => go(index - 1)}>←</Button><Button variant="outline" size="icon" className="rounded-full border-white/20 bg-white/5 text-white" disabled={index === railItems.length - 1} onClick={() => go(index + 1)}>→</Button></div></div><div className="mt-8 min-h-0 flex-1"><HorizontalTrack label="Track controlat extern" progress={progress} itemClassName={(itemIndex) => cn("h-[min(48svh,34rem)]", itemIndex % 2 ? "w-[min(88vw,58rem)]" : "w-[min(76vw,40rem)]")}>{railItems.map(([number, title, body]) => <article key={number} className="flex h-full flex-col justify-between rounded-[2rem] border border-white/10 bg-[#1a1c20] p-8"><span>{number}</span><div><h2 className="text-6xl font-semibold tracking-[-0.06em]">{title}</h2><p className="mt-3 text-white/55">{body}</p></div></article>)}</HorizontalTrack></div></section>;
}

const stickyChapters: StickyStoryChapter[] = [
  { id: "origin", eyebrow: "01 / Origin", title: "Imaginea rămâne", body: "Vizualul este sticky din prima clipă; documentul nu sare." },
  { id: "material", eyebrow: "02 / Material", title: "Copy-ul avansează", body: "Fiecare capitol poate schimba imaginea, video-ul sau interfața." },
  { id: "release", eyebrow: "03 / Release", title: "Pagina continuă", body: "După ultimul capitol, sticky-ul se eliberează normal." },
];

const mirroredStickyChapters: StickyStoryChapter[] = [
  { id: "proof", eyebrow: "04 / Proof", title: "Compoziția se inversează", body: "Al doilea grup mută vizualul în stânga fără să schimbe engine-ul sau ordinea semantică." },
  { id: "detail", eyebrow: "05 / Detail", title: "Ritmul continuă", body: "Pot urma alte imagini, video-uri sau stări de produs, cu aceeași ancoră sticky." },
  { id: "handoff", eyebrow: "06 / Handoff", title: "Oglinda se eliberează", body: "După încă trei capitole, pagina reintră natural în flow și poate continua cu orice secțiune." },
];

function StickyDemo() {
  const firstSources = [ASSETS.carPoster, ASSETS.worldPoster, ASSETS.carPoster];
  const mirroredSources = [ASSETS.portrait, ASSETS.worldPoster, ASSETS.emptyWorld];
  return (
    <div className="bg-background">
      <StickyStory chapters={stickyChapters} visualSide="right" visualLabel="Vizual persistent, primul grup" renderVisual={(_, index) => <div className="relative h-full"><SceneImage src={firstSources[index]!} className="object-cover" /><span className="absolute bottom-8 left-8 text-8xl font-semibold text-white/80">0{index + 1}</span></div>} />
      <StickyStory chapters={mirroredStickyChapters} visualSide="left" visualLabel="Vizual persistent, grup oglindit" renderVisual={(_, index) => <div className="relative h-full"><SceneImage src={mirroredSources[index]!} className={cn("object-cover", index === 0 && "object-[68%_center]")} /><span className="absolute bottom-8 right-8 text-8xl font-semibold text-white/80">0{index + 4}</span></div>} />
    </div>
  );
}
function SequenceDemo() { return <ImageSequenceScrub alt="Automobil roșu pe șosea" frames={sequenceFrames} poster={ASSETS.carSequence} label="Secvență de 36 cadre" scrollScreens={3} overlay={<div className="flex h-full items-end p-8 text-white"><h1 className="text-6xl font-semibold tracking-[-0.07em]">Frame-perfect.</h1></div>} />; }
function MaskDemo() { return <MaskReveal label="Reveal din alb-negru în culoare" direction="circle" playback="commit" before={<SceneImage src={ASSETS.carPoster} className="object-cover grayscale" />} after={<SceneImage src={ASSETS.carPoster} className="object-cover saturate-150" />} overlay={<div className="grid h-full place-items-center"><p className="text-[clamp(5rem,14vw,13rem)] font-semibold tracking-[-0.09em] text-white mix-blend-difference">REVEAL</p></div>} />; }
const kineticSegments: KineticTypeSegment[] = [
  { text: "IDEA", className: "block", range: [0.05, 0.32], from: { x: "-45vw", rotate: -8, opacity: 0 }, to: { x: "0vw", rotate: 0, opacity: 1 } },
  { text: "conduce", className: "ml-[.45em] block italic text-[#d7ff43]", range: [0.24, 0.55], from: { x: "42vw", opacity: 0 }, to: { x: "0vw", opacity: 1 } },
  { text: "MIȘCAREA", className: "block", range: [0.48, 0.8], from: { y: "1em", rotateX: 70, opacity: 0 }, to: { y: "0em", rotateX: 0, opacity: 1 } },
];
function KineticDemo() { return <KineticType label="Tipografie kinetic" text="Ideea conduce mișcarea" segments={kineticSegments} scrollScreens={3} className="bg-[#101010] px-5 text-white sm:px-[7vw]" textClassName="w-full text-[clamp(4rem,11vw,11rem)] font-semibold leading-[.72] tracking-[-.08em]" />; }
function CursorDemo() { return <CursorLens label="Cursor lens fără punct central" cursorLabel="DISCOVER" lensSize={250} className="h-svh bg-black text-white" base={<SceneImage src={ASSETS.worldPoster} className="object-cover grayscale contrast-125" />} reveal={<SceneImage src={ASSETS.worldPoster} className="object-cover saturate-150" />}><div className="flex h-full flex-col justify-between p-6 pb-10 pt-24"><div className="flex justify-between text-xs uppercase tracking-[.2em]"><span>Cursor lens</span><Scan className="size-5" /></div><p className="text-[clamp(4rem,10vw,10rem)] font-semibold leading-[.78] tracking-[-.08em]">Descoperă<br />altă stare.</p></div></CursorLens>; }
function BeforeAfterDemo() { return <section className="grid min-h-svh place-items-center bg-[#e7e3da] p-5"><BeforeAfter label="Compară două stări" beforeLabel="Monochrome" afterLabel="Color" className="aspect-[16/10] w-full max-w-6xl rounded-[2rem]" before={<SceneImage src={ASSETS.worldPoster} className="object-cover grayscale" />} after={<SceneImage src={ASSETS.worldPoster} className="object-cover saturate-150" />} /></section>; }
function ExpandingDemo() { return <ExpandingMedia label="Media care se extinde" playback="commit" media={<SceneImage src={ASSETS.worldPoster} className="object-cover" />} overlay={<div className="flex h-full items-end p-8 text-white"><p className="text-7xl font-semibold tracking-[-.07em]">Din cadru, în lume.</p></div>} />; }
function MagneticDemo() {
  return (
    <MagneticField className="min-h-svh overflow-hidden bg-[#090b0e] px-5 pb-10 pt-28 text-white sm:px-[6vw]">
      <div className="mx-auto grid min-h-[calc(100svh-9.5rem)] max-w-7xl gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <MagneticTarget radius={420} strength={0.12} maxTravel={28} maxTilt={2.8} className="min-h-[54svh]">
          <article className="group relative h-full min-h-[54svh] overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5">
            <SceneImage src={ASSETS.worldPoster} className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/5 to-black/15" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-7 sm:p-10"><div><p className="text-xs uppercase tracking-[0.22em] text-white/60">01 / Primary field</p><h1 className="mt-3 text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[0.8] tracking-[-0.075em]">Follow the<br />material.</h1></div><span className="hidden size-16 place-items-center rounded-full border border-white/30 bg-black/12 text-xl backdrop-blur-md sm:grid">↗</span></div>
          </article>
        </MagneticTarget>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-[.72fr_1.28fr]">
          <MagneticTarget radius={300} strength={0.18} maxTravel={32} maxTilt={4}>
            <article className="flex h-full min-h-52 flex-col justify-between rounded-[2rem] bg-[#d7ff43] p-7 text-black"><p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-55">02 / Signal</p><p className="max-w-[8ch] text-4xl font-semibold leading-[0.9] tracking-[-0.06em]">Motion with hierarchy.</p></article>
          </MagneticTarget>
          <MagneticTarget radius={340} strength={0.14} maxTravel={30} maxTilt={3.5}>
            <article className="relative flex h-full min-h-72 flex-col justify-between overflow-hidden rounded-[2rem] border border-white/12 bg-[#171b20] p-7"><div className="absolute -right-16 -top-16 size-56 rounded-full border border-white/12 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,.2),transparent_65%)]" /><p className="relative text-xs uppercase tracking-[0.2em] text-white/50">03 / Detail</p><div className="relative"><p className="text-7xl font-semibold tracking-[-0.08em]">34px</p><p className="mt-3 max-w-xs text-sm leading-relaxed text-white/52">Fiecare target își controlează independent raza, deplasarea și tilt-ul.</p></div></article>
          </MagneticTarget>
        </div>
      </div>
    </MagneticField>
  );
}

function DepthGalleryDemo() {
  return <DepthGallery label="Galerie focus în straturi suprapuse" items={depthGalleryItems} scrollScreens={4.5} stackOffset={6.5} stageClassName="bg-[#0a0c10]" />;
}

function RefractiveGlassDemo() {
  return (
    <RefractiveGlass label="Sticlă refractivă GPU peste peisaj" src={ASSETS.worldPoster} mobileSrc={ASSETS.worldMobile} alt="Portal de obsidian într-un peisaj mineral" lensSize={420} lensAspect={1.55} refraction={0.022} aberration={0.0045} magnification={1.065} className="h-svh text-white">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.62),transparent_52%,rgba(0,0,0,.14))]" />
      <div className="relative flex h-full flex-col justify-between px-5 pb-10 pt-24 sm:px-[6vw] sm:pb-[7vh] sm:pt-28">
        <div className="flex justify-between text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/62"><span>20 / True refraction</span><span>WebGL lens · native cursor</span></div>
        <div className="max-w-4xl"><p className="max-w-[9ch] text-[clamp(4.2rem,10vw,10rem)] font-semibold leading-[0.76] tracking-[-0.085em]">Materia schimbă perspectiva.</p><p className="mt-6 max-w-md text-sm leading-relaxed text-white/62">Lens-ul citește textura reală din spate: displacement, magnification, chromatic edge și formă complet editabilă.</p></div>
      </div>
    </RefractiveGlass>
  );
}

function ProductOrbitDemo() {
  return (
    <ProductOrbit
      label="Produs 3D rotativ cu hotspots"
      description="Trage orizontal sau folosește săgețile pentru a roti obiectul."
      primitive="bottle"
      color="#d9e5eb"
      transmission={0.34}
      roughness={0.12}
      autoRotate={0.09}
      modelScale={0.74}
      mobileModelScale={0.52}
      hotspots={[
        { id: "shell", label: "Carcasă din sticlă", marker: "01", position: [0, .55, .8], content: <><p className="font-semibold">Carcasă din sticlă</p><p className="mt-1 text-white/62">Transmission, roughness și clearcoat sunt editabile sau vin direct din GLB.</p></> },
        { id: "core", label: "Nucleu mineral", marker: "02", position: [0, -.32, .8], content: <><p className="font-semibold">Nucleu mineral</p><p className="mt-1 text-white/62">Hotspot-ul este ancorat în coordonatele produsului și dispare când ajunge pe spate.</p></> },
      ]}
      className="h-svh bg-[radial-gradient(circle_at_52%_42%,#25303b_0%,#0b0e12_42%,#040506_78%)] text-white"
      fallback={<div className="absolute inset-0 grid place-items-center"><div className="relative size-[min(72vw,34rem)]"><SceneImage src={ASSETS.respiratorComposite} className="object-contain" /></div></div>}
    >
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between px-5 pb-10 pt-24 sm:px-[6vw] sm:pb-[7vh] sm:pt-28"><div className="flex items-start justify-between gap-5"><div><p className="text-xs uppercase tracking-[.22em] text-white/50">21 / GLB product orbit</p><h1 className="mt-4 max-w-[7ch] text-[clamp(2.75rem,8vw,8rem)] font-semibold leading-[.78] tracking-[-.08em] [text-shadow:0_2px_24px_rgb(0_0_0/.55)]">Ține produsul în mână.</h1></div><p className="mt-2 hidden max-w-xs text-right text-xs uppercase leading-relaxed tracking-[.16em] text-white/42 sm:block">drag · arrows · hotspots<br />GLB or editable primitive</p></div><p className="max-w-sm text-sm leading-relaxed text-white/55">Fixture-ul folosește o geometrie generică. Agentul o înlocuiește cu GLB-ul clientului, fără să schimbe engine-ul.</p></div>
    </ProductOrbit>
  );
}

function ParticleAssemblyDemo() {
  return (
    <ParticleAssembly label="Respirator construit din particule" src={ASSETS.respiratorMask} colorSrc={ASSETS.respiratorComposite} sampling="light" sourceColorMix={0.9} alt="Respirator tehnic care se construiește din particule" trigger="scroll" scrollScreens={3.1} particleCount={7600} pointSize={8} scatter={4.8} color="#73ecff" smoothing={6} className="bg-[#050607] text-white" stageClassName="bg-[radial-gradient(circle_at_50%_50%,#172127_0%,#080b0e_42%,#030405_76%)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.58),transparent_46%)]" />
      <div className="relative flex h-full flex-col justify-between px-5 pb-10 pt-24 sm:px-[6vw] sm:pb-[7vh] sm:pt-28"><div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/48"><span>22 / Particle assembly</span><span>scroll → respirator</span></div><div><h1 className="max-w-[7ch] text-[clamp(4rem,9vw,9rem)] font-semibold leading-[.76] tracking-[-.085em]">Semnalul devine protecție.</h1><p className="mt-6 max-w-sm text-sm leading-relaxed text-white/55">Mask-ul definește forma, iar al doilea asset furnizează culorile produsului. Ambele se pot înlocui fără schimbarea engine-ului.</p></div></div>
    </ParticleAssembly>
  );
}

const tunnelItems: TypographyDepthTunnelItem[] = [
  { id: "enter", accessibleText: "Intră în idee", align: "start", content: <p className="max-w-[6ch] text-[clamp(5rem,14vw,14rem)] font-semibold leading-[.68] tracking-[-.095em]">INTRĂ ÎN IDEE.</p> },
  { id: "scale", accessibleText: "Distanța devine scară", align: "end", content: <p className="max-w-[7ch] text-right text-[clamp(4.5rem,12vw,12rem)] font-semibold leading-[.7] tracking-[-.09em] text-[#d7ff43]">DISTANȚA DEVINE SCARĂ.</p> },
  { id: "focus", accessibleText: "Focusul devine ritm", align: "start", content: <p className="max-w-[7ch] text-[clamp(4.5rem,12vw,12rem)] font-semibold leading-[.7] tracking-[-.09em]">FOCUSUL DEVINE RITM.</p> },
  { id: "exit", accessibleText: "Ieși cu o concluzie", align: "center", content: <p className="max-w-[8ch] text-center text-[clamp(4.5rem,12vw,12rem)] font-semibold leading-[.7] tracking-[-.09em]">IEȘI CU O CONCLUZIE.</p> },
];

function TypographyTunnelDemo() {
  return <TypographyDepthTunnel label="Tunel tipografic 3D" items={tunnelItems} scrollScreens={4.8} depth={1100} className="bg-[#080808] px-5 text-white sm:px-[6vw]" stageClassName="bg-[radial-gradient(circle_at_50%_50%,#1d2224_0%,#090a0b_44%,#030303_82%)]" footer={<div className="flex justify-between px-5 pb-8 text-[.65rem] uppercase tracking-[.2em] text-white/38 sm:px-[6vw]"><span>23 / Typography depth tunnel</span><span>semantic DOM · CSS 3D</span></div>} />;
}

const spatialCanvasItems: SpatialCanvasItem[] = [
  { id: "world", x: -420, y: -230, width: 560, label: "World study", content: <div className="relative aspect-[16/10]"><SceneImage src={ASSETS.worldPoster} sizes="(max-width: 1023px) 75vw, 40vw" className="object-cover" /><span className="absolute bottom-5 left-5 text-xs uppercase tracking-[.2em] text-white">01 / World</span></div> },
  { id: "signal", x: 360, y: -310, width: 330, label: "Signal card", content: <div className="flex aspect-square flex-col justify-between bg-[#d7ff43] p-7 text-black"><span className="text-xs uppercase tracking-[.2em]">02 / Signal</span><p className="text-5xl font-semibold leading-[.82] tracking-[-.07em]">Move through the archive.</p></div> },
  { id: "human", x: 520, y: 240, width: 430, label: "Human study", content: <div className="relative aspect-[4/5]"><SceneImage src={ASSETS.portrait} sizes="(max-width: 1023px) 60vw, 32vw" className="object-cover object-[68%_center]" /><span className="absolute bottom-5 left-5 text-xs uppercase tracking-[.2em] text-white">03 / Human</span></div> },
  { id: "motion", x: -260, y: 360, width: 470, label: "Motion study", content: <div className="relative aspect-[16/10]"><SceneImage src={ASSETS.carPoster} sizes="(max-width: 1023px) 65vw, 35vw" className="object-cover" /><span className="absolute bottom-5 left-5 text-xs uppercase tracking-[.2em] text-white">04 / Motion</span></div> },
  { id: "note", x: 40, y: 20, width: 250, label: "Central note", content: <div className="flex aspect-square items-end bg-white p-6 text-black"><p className="text-3xl font-semibold leading-[.9] tracking-[-.06em]">The canvas is layout, not a carousel.</p></div> },
];

function SpatialCanvasDemo() {
  return <SpatialCanvas label="Canvas spațial explorabil" items={spatialCanvasItems} worldSize={[2100, 1450]} initialView={{ x: 0, y: 25, zoom: .82 }} minZoom={.55} maxZoom={1.5} className="bg-[#0a0d10] text-white" stageClassName="pt-16" />;
}

function VolumetricLightDemo() {
  return (
    <VolumetricLightStage label="Peisaj iluminat volumetric" src={ASSETS.emptyWorld} alt="Peisaj mineral iluminat de fascicule atmosferice" density={0.86} haze={0.7} speed={0.7} beams={[{ x: .2, width: .13, angle: .2, color: "#ffd09a", intensity: 1.1 }, { x: .57, width: .18, angle: -.08, color: "#80dfff", intensity: .9 }, { x: .88, width: .1, angle: -.25, color: "#d6b2ff", intensity: .72 }]} className="h-svh text-white">
      <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-black/20" />
      <div className="relative flex h-full flex-col justify-between px-5 pb-10 pt-24 sm:px-[6vw] sm:pb-[7vh] sm:pt-28"><div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/52"><span>25 / Volumetric light stage</span><span>3 editable emitters</span></div><div><h1 className="max-w-[8ch] text-[clamp(4rem,10vw,10rem)] font-semibold leading-[.75] tracking-[-.085em]">Lumina scrie spațiul.</h1><p className="mt-6 max-w-sm text-sm leading-relaxed text-white/58">Fundalul, fiecare sursă, lățimea, unghiul, densitatea și haze-ul sunt parte din contract.</p></div></div>
    </VolumetricLightStage>
  );
}

function SliceRecomposeDemo() {
  return (
    <SliceRecompose label="Portret recompus din fâșii" src={ASSETS.portrait} alt="Portret editorial recompus din fâșii verticale" axis="vertical" slices={11} scatter={240} rotation={9} stagger={0.3} trigger="scroll" scrollScreens={3} className="bg-[#e8edf0] text-[#0b1015]" stageClassName="bg-[#dbe3e8]">
      <div className="absolute inset-0 bg-gradient-to-r from-[#e8edf0]/94 via-transparent to-transparent" />
      <div className="relative flex h-full items-end px-5 pb-10 pt-24 sm:px-[6vw] sm:pb-[7vh]"><div><p className="text-xs uppercase tracking-[.2em] opacity-48">26 / Slice &amp; recompose</p><h1 className="mt-4 max-w-[7ch] text-[clamp(4rem,9vw,9rem)] font-semibold leading-[.76] tracking-[-.085em]">Fragmentele găsesc forma.</h1><p className="mt-6 max-w-sm text-sm leading-relaxed opacity-60">Numărul fâșiilor, axa, stagger-ul și dispersia pot urma identitatea fiecărui proiect.</p></div></div>
    </SliceRecompose>
  );
}

const filmItems: FilmStrip3DItem[] = [
  { id: "origin", label: "Origin", content: <div className="relative h-full"><SceneImage src={ASSETS.emptyWorld} className="object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-6 pt-24 text-white"><span className="text-xs uppercase tracking-[.2em]">01 / Origin</span><p className="mt-2 text-4xl font-semibold tracking-[-.06em]">Silence</p></div></div> },
  { id: "matter", label: "Matter", content: <div className="relative h-full"><SceneImage src={ASSETS.worldPoster} className="object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-6 pt-24 text-white"><span className="text-xs uppercase tracking-[.2em]">02 / Matter</span><p className="mt-2 text-4xl font-semibold tracking-[-.06em]">Threshold</p></div></div> },
  { id: "human", label: "Human", content: <div className="relative h-full"><SceneImage src={ASSETS.portrait} className="object-cover object-[67%_center]" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-6 pt-24 text-white"><span className="text-xs uppercase tracking-[.2em]">03 / Human</span><p className="mt-2 text-4xl font-semibold tracking-[-.06em]">Interface</p></div></div> },
  { id: "motion", label: "Motion", content: <div className="relative h-full"><SceneImage src={ASSETS.carPoster} className="object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-6 pt-24 text-white"><span className="text-xs uppercase tracking-[.2em]">04 / Motion</span><p className="mt-2 text-4xl font-semibold tracking-[-.06em]">Velocity</p></div></div> },
  { id: "return", label: "Return", content: <div className="relative h-full"><SceneImage src={ASSETS.worldPoster} className="object-cover grayscale" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-6 pt-24 text-white"><span className="text-xs uppercase tracking-[.2em]">05 / Return</span><p className="mt-2 text-4xl font-semibold tracking-[-.06em]">Memory</p></div></div> },
];

function FilmStripDemo() {
  return <FilmStrip3D label="Bandă de film 3D" items={filmItems} scrollScreens={4.5} spacing={460} curve={215} className="bg-[#08090b] text-white" stageClassName="bg-[radial-gradient(circle_at_50%_50%,#202329_0%,#0b0c0f_48%,#050506_82%)]" overlay={<div className="flex h-full flex-col justify-between px-5 pb-8 pt-24 text-xs uppercase tracking-[.2em] text-white/46 sm:px-[6vw]"><span>27 / 3D film strip</span><span>vertical scroll · continuous curve</span></div>} />;
}

const elasticItems: ElasticImageGridItem[] = [
  { id: "world", label: "World", content: <div className="relative aspect-[4/5]"><SceneImage src={ASSETS.worldPoster} className="object-cover" /><span className="absolute bottom-5 left-5 text-xs uppercase tracking-[.2em] text-white">World / 01</span></div> },
  { id: "human", label: "Human", content: <div className="relative aspect-[4/5]"><SceneImage src={ASSETS.portrait} className="object-cover object-[68%_center]" /><span className="absolute bottom-5 left-5 text-xs uppercase tracking-[.2em] text-white">Human / 02</span></div> },
  { id: "motion", label: "Motion", content: <div className="relative aspect-[4/5]"><SceneImage src={ASSETS.carPoster} className="object-cover" /><span className="absolute bottom-5 left-5 text-xs uppercase tracking-[.2em] text-white">Motion / 03</span></div> },
  { id: "signal", label: "Signal", content: <div className="flex aspect-[4/5] flex-col justify-between bg-[#d7ff43] p-7 text-black"><span className="text-xs uppercase tracking-[.2em]">Signal / 04</span><p className="text-5xl font-semibold leading-[.82] tracking-[-.07em]">A grid that listens.</p></div> },
];

function ElasticGridDemo() {
  return <ElasticImageGrid label="Grid elastic influențat de proximitatea cursorului" items={elasticItems} radius={460} maxTravel={38} maxScale={0.065} maxTilt={4} minItemWidth={230} className="min-h-svh bg-[#ece9e1] px-5 pb-12 pt-24 text-black sm:px-[5vw] sm:pt-28" gridClassName="mx-auto max-w-7xl" header={<div className="mx-auto mb-8 flex max-w-7xl items-end justify-between gap-6"><div><p className="text-xs uppercase tracking-[.2em] opacity-45">28 / Elastic image grid</p><h1 className="mt-3 text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[.78] tracking-[-.08em]">Proximitatea schimbă ierarhia.</h1></div><p className="hidden max-w-xs text-sm opacity-55 lg:block">Fiecare tile este conținut React; câmpul doar adaugă mișcare controlată.</p></div>} />;
}

function FluidSurfaceDemo() {
  return (
    <FluidSurface label="Suprafață fluidă reactivă" src={ASSETS.worldPoster} alt="Portal mineral distorsionat de unde fluide" strength={0.017} radius={0.25} decay={0.95} chromatic={0.0012} className="h-svh text-white">
      <div className="absolute inset-0 bg-gradient-to-r from-black/64 via-transparent to-black/12" />
      <div className="relative flex h-full flex-col justify-between px-5 pb-10 pt-24 sm:px-[6vw] sm:pb-[7vh] sm:pt-28"><div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/52"><span>29 / Fluid surface</span><span>move through the image</span></div><div><h1 className="max-w-[7ch] text-[clamp(4rem,9vw,9rem)] font-semibold leading-[.76] tracking-[-.085em]">Imaginea ține minte gestul.</h1><p className="mt-6 max-w-sm text-sm leading-relaxed text-white/58">Impulsurile se sting natural; cursorul nativ rămâne vizibil, iar pe touch scena devine statică.</p></div></div>
    </FluidSurface>
  );
}

function SceneHandoffDemo() {
  const from = <div className="relative h-full bg-black text-white"><SceneImage src={ASSETS.carPoster} className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/78 via-transparent to-black/12" /><div className="absolute bottom-[8vh] left-5 sm:left-[6vw]"><p className="text-xs uppercase tracking-[.2em] text-white/55">Scene A / Motion</p><p className="mt-3 text-[clamp(4rem,9vw,9rem)] font-semibold leading-[.76] tracking-[-.085em]">VELOCITY</p></div></div>;
  const to = <div className="relative h-full bg-black text-white"><SceneImage src={ASSETS.worldPoster} className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/74 via-transparent to-black/15" /><div className="absolute bottom-[8vh] right-5 text-right sm:right-[6vw]"><p className="text-xs uppercase tracking-[.2em] text-white/55">Scene B / World</p><p className="mt-3 text-[clamp(4rem,9vw,9rem)] font-semibold leading-[.76] tracking-[-.085em]">THRESHOLD</p></div></div>;
  return <SceneHandoff label="Predare continuă între două scene" from={from} to={to} fromLabel="Velocity" toLabel="Threshold" variant="depth" scrollScreens={3.2} className="bg-black" overlay={<div className="flex h-full justify-between px-5 pt-24 text-xs uppercase tracking-[.2em] text-white mix-blend-difference sm:px-[6vw] sm:pt-28"><span>30 / Scene handoff</span><span className="hidden sm:block">two live React scenes · one timeline</span></div>} />;
}

const demos = [
  ["depth-camera-scene", "P0 · 2.5D Advanced / Three.js", AdvancedDemo],
  ["layered-depth", "Basic · 2.5D car", BasicDepthDemo],
  ["spatial-product-stage", "P1 · Spatial product assembly", SpatialProductDemo],
  ["liquid-glass", "P2 · Liquid glass + nav", LiquidGlassDemo],
  ["shader-field", "P3 · Shader field", ShaderDemo],
  ["media-portal", "P4 · Media portal", MediaPortalDemo],
  ["spatial-gallery", "P5 · Spatial gallery", SpatialGalleryDemo],
  ["mesh-transition", "P6 · Mesh transition", MeshTransitionDemo],
  ["horizontal-story-rail", "Horizontal rail", HorizontalDemo],
  ["horizontal-track", "Controlled horizontal track", ControlledTrackDemo],
  ["sticky-story", "Sticky story", StickyDemo],
  ["image-sequence-scrub", "Image sequence", SequenceDemo],
  ["mask-reveal", "Mask reveal", MaskDemo],
  ["kinetic-type", "Kinetic type", KineticDemo],
  ["cursor-ambient", "Cursor lens", CursorDemo],
  ["before-after", "Before / after", BeforeAfterDemo],
  ["expanding-media", "Expanding media", ExpandingDemo],
  ["cursor-magnetic", "Magnetic cursor", MagneticDemo],
  ["depth-gallery", "Depth gallery stack", DepthGalleryDemo],
  ["refractive-glass", "20 · True refractive glass", RefractiveGlassDemo],
  ["product-orbit", "21 · GLB product orbit", ProductOrbitDemo],
  ["particle-assembly", "22 · Particle assembly", ParticleAssemblyDemo],
  ["typography-depth-tunnel", "23 · Typography depth tunnel", TypographyTunnelDemo],
  ["spatial-canvas", "24 · Infinite spatial canvas", SpatialCanvasDemo],
  ["volumetric-light-stage", "25 · Volumetric light stage", VolumetricLightDemo],
  ["slice-recompose", "26 · Slice & recompose", SliceRecomposeDemo],
  ["film-strip-3d", "27 · 3D film strip", FilmStripDemo],
  ["elastic-image-grid", "28 · Elastic image grid", ElasticGridDemo],
  ["fluid-surface", "29 · Fluid surface cursor", FluidSurfaceDemo],
  ["scene-handoff", "30 · Scene handoff", SceneHandoffDemo],
] as const;

type DemoId = (typeof demos)[number][0];

export function ExperienceLab() {
  const [selected, setSelected] = React.useState<DemoId>("depth-camera-scene");
  React.useEffect(() => {
    const sync = () => {
      const id = window.location.hash.slice(1) as DemoId;
      if (!demos.some(([candidate]) => candidate === id)) return;
      setSelected(id);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const select = (id: DemoId) => { setSelected(id); window.history.replaceState(null, "", `#${id}`); window.scrollTo({ top: 0, behavior: "instant" }); };
  const activeIndex = demos.findIndex(([id]) => id === selected);
  const ActiveDemo = demos[activeIndex]?.[2] ?? AdvancedDemo;
  const activeEntry = demos[activeIndex] ?? demos[0];
  const activeGuide = experienceLabGuides[selected];
  return <main className="min-h-dvh overflow-clip bg-background text-foreground"><ExperienceLabSidebar activeIndex={activeIndex} entries={demos.map(([id, title]) => [id, title] as const)} selected={selected} onSelect={(id) => select(id as DemoId)} /><div className="lg:pl-[22rem]"><ActiveDemo />{activeEntry && activeGuide ? <ExperienceLabGuideSection guide={activeGuide} index={activeIndex} title={activeEntry[1]} /> : null}</div></main>;
}

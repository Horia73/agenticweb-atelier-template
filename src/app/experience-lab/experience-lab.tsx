"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowDown, ArrowLeftRight, MoveHorizontal, Scan } from "lucide-react";
import { motion, type MotionValue, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

import { BeforeAfter } from "@/components/experience/before-after";
import { CinematicWorldScene } from "@/components/experience/cinematic-world-scene";
import { CursorLens } from "@/components/experience/cursor-ambient";
import { MagneticField, MagneticTarget } from "@/components/experience/cursor-magnetic";
import type { DepthCameraLayer } from "@/components/experience/depth-camera-scene";
import { ExpandingMedia } from "@/components/experience/expanding-media";
import { HorizontalStoryRail } from "@/components/experience/horizontal-story-rail";
import { HorizontalTrack } from "@/components/experience/horizontal-track";
import { ImageSequenceScrub } from "@/components/experience/image-sequence-scrub";
import { KineticType, type KineticTypeSegment } from "@/components/experience/kinetic-type";
import { LiquidGlassNav, LiquidGlassSurface } from "@/components/experience/liquid-glass";
import { MaskReveal } from "@/components/experience/mask-reveal";
import { MediaPortal } from "@/components/experience/media-portal";
import { MeshTransition } from "@/components/experience/mesh-transition";
import { ShaderField } from "@/components/experience/shader-field";
import { SpatialGallery, type SpatialGalleryItem } from "@/components/experience/spatial-gallery";
import { SpatialProductStage, type SpatialProductPart } from "@/components/experience/spatial-product-stage";
import { ScrollDepthScene, type LayeredDepthLayer } from "@/components/experience/layered-depth";
import { StickyStory, type StickyStoryChapter } from "@/components/experience/sticky-story";
import { useMediaQuery } from "@/components/experience/experience-runtime";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

const ASSETS = {
  carBackground: "/experience/depth-car-v3/background.webp",
  carPoster: "/experience/depth-car-v3/poster.webp",
  carSubject: "/experience/depth-car-v3/subject.webp",
  carSequence: "/experience/sequence-car-v2/poster.webp",
  portrait: "/experience/spatial-product-stage-v1/portrait.webp",
  respiratorAssembled: "/experience/spatial-product-stage-v1/respirator/assembled.webp",
  worldPoster: "/experience/depth-camera-world-v2/poster.webp",
  worldMobile: "/experience/depth-camera-world-v2/mobile-poster.webp",
  emptyWorld: "/experience/depth-camera-world-v2/layers/00-sky.webp",
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

function SceneImage({ alt = "", className, priority = false, sizes = "100vw", src }: { alt?: string; className?: string; priority?: boolean; sizes?: string; src: string }) {
  return <Image alt={alt} src={src} fill priority={priority} loading={priority ? "eager" : undefined} sizes={sizes} className={className} />;
}

const worldLayers: DepthCameraLayer[] = [
  { id: "00-sky", src: WORLD.sky, mobileSrc: WORLD.skyMobile, plane: "back", depth: -2.4 },
  { id: "10-landscape", src: WORLD.landscape, mobileSrc: WORLD.landscapeMobile, plane: "back", depth: -1.6 },
  { id: "20-midground", src: WORLD.midground, mobileSrc: WORLD.midgroundMobile, plane: "back", depth: -0.8 },
  { id: "29-contact-reflection", src: WORLD.reflection, mobileSrc: WORLD.reflectionMobile, plane: "front", depth: -0.08, opacity: 0.9 },
  { id: "30-hero", src: WORLD.hero, mobileSrc: WORLD.heroMobile, plane: "front", depth: 0, timeline: [{ at: 0 }, { at: 1, x: 0.055, y: -0.015 }] },
  { id: "40-foreground-left", src: WORLD.left, mobileSrc: WORLD.leftMobile, plane: "front", depth: 0.75, timeline: [{ at: 0 }, { at: 1, x: -0.16, y: -0.035 }] },
  { id: "41-foreground-right", src: WORLD.right, mobileSrc: WORLD.rightMobile, plane: "front", depth: 0.9, timeline: [{ at: 0 }, { at: 1, x: 0.18, y: -0.04 }] },
  { id: "50-edge-frame", src: WORLD.edge, mobileSrc: WORLD.edgeMobile, plane: "front", depth: 1.05, opacity: 0.76 },
];

const carLayers: LayeredDepthLayer[] = [
  {
    id: "master",
    depth: 0.1,
    timeline: [{ at: 0, scale: 1 }, { at: 1, scale: 1.18, y: -12 }],
    content: <SceneImage src={ASSETS.carPoster} priority className="object-cover" />,
  },
  {
    id: "rear-copy",
    depth: 0.4,
    ariaHidden: false,
    timeline: [{ at: 0, opacity: 0, y: "20vh" }, { at: 0.3, opacity: 1, y: "0vh" }, { at: 0.72, opacity: 0, y: "-16vh" }],
    content: <div className="flex h-full items-end justify-center pb-[10vh] text-white"><p className="text-[clamp(4rem,13vw,12rem)] font-semibold leading-none tracking-[-0.08em]">GRAND TOURING</p></div>,
  },
  {
    id: "subject-matte",
    depth: 0.72,
    timeline: [{ at: 0, z: 12, scale: 1 }, { at: 1, z: 20, scale: 1.18, y: -12 }],
    content: <SceneImage src={ASSETS.carSubject} priority className="object-cover" />,
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
  return <ScrollDepthScene label="2.5D Basic cu mașină și occlusion matte" layers={carLayers} scrollScreens={3.2} sourceContract={{ sourceId: "adriatic-road-v3", mode: "integrated-occlusion", aligned: true, contactPlates: 1 }} stageClassName="bg-black" reducedMotionFallback={<div className="relative h-svh"><SceneImage src={ASSETS.carPoster} className="object-cover" /></div>} overlay={<div className="flex h-full flex-col justify-between p-6 pb-10 pt-24 text-xs uppercase tracking-[0.2em] text-white"><span>Basic / integrated still</span><span className="flex items-center gap-2"><ArrowDown className="size-4" /> scroll</span></div>} />;
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
      hoverRadius={0.2}
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
      <SceneImage src={ASSETS.worldPoster} priority className="object-cover brightness-[.7] saturate-[1.25]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_30%,transparent,rgba(0,0,0,.58))]" />
      <div className="absolute inset-x-5 top-24 z-10 mx-auto max-w-5xl"><LiquidGlassNav label="Navigație liquid glass" items={mobile ? navItems.slice(0, 2) : navItems} brand={mobile ? undefined : "APERTURE"} action={<a href="#contact" className="flex h-10 items-center rounded-xl bg-white px-4 text-xs font-semibold text-black">Start</a>} /></div>
      <div className="relative flex h-full items-end p-5 pb-10 sm:p-10"><LiquidGlassSurface className="max-w-xl rounded-[2rem] p-7 sm:p-10"><p className="text-xs uppercase tracking-[0.2em] text-white/55">P2 / Liquid surface</p><h1 className="mt-4 text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[0.82] tracking-[-0.07em]">Glass care aparține lumii.</h1><p className="mt-5 max-w-md text-sm leading-relaxed text-white/62">Suprafață, nav și active pill sunt independente și complet editabile.</p></LiquidGlassSurface></div>
    </section>
  );
}

function ShaderDemo() {
  const [mode, setMode] = React.useState<"aurora" | "metaballs" | "contour">("aurora");
  return <ShaderField label="Câmp shader reactiv" mode={mode} className="grid h-svh place-items-center px-5 text-white" fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#3d65ff,#08090d_60%)]" />}><div className="pointer-events-auto absolute left-5 top-24 z-10 sm:left-10 sm:top-28"><label htmlFor="shader-mode" className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/50">Field</label><NativeSelect id="shader-mode" value={mode} onChange={(event) => setMode(event.currentTarget.value as typeof mode)} className="w-40 border-white/15 bg-black/35 text-white backdrop-blur-xl"><NativeSelectOption value="aurora">Aurora</NativeSelectOption><NativeSelectOption value="metaballs">Metaballs</NativeSelectOption><NativeSelectOption value="contour">Contour</NativeSelectOption></NativeSelect></div><div className="text-center"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">P3 / Shader field</p><h1 className="mt-5 text-[clamp(4rem,12vw,12rem)] font-semibold leading-[0.75] tracking-[-0.09em]">AMBIENT<br />IS ACTIVE.</h1><p className="mx-auto mt-6 max-w-md text-sm text-white/60">Aurora, metaballs sau contours. Fără copy impus în componentă.</p></div></ShaderField>;
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
  return <MeshTransition label="Tranziție mesh între automobil și portal" from={{ src: ASSETS.carPoster, alt: "Automobil pe coastă" }} to={{ src: ASSETS.worldPoster, alt: "Portal în peisaj mineral" }} mode="liquid" trigger="scroll" scrollScreens={2.5} fallback={<SceneImage src={ASSETS.worldPoster} className="object-cover" />} overlay={(progress) => <TransitionCopy progress={progress} />} />;
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

function StickyDemo() { return <StickyStory chapters={stickyChapters} visualSide="right" visualLabel="Vizual persistent" renderVisual={(_, index) => <div className="relative h-full"><SceneImage src={index === 1 ? ASSETS.worldPoster : ASSETS.carPoster} className="object-cover" /><span className="absolute bottom-8 left-8 text-8xl font-semibold text-white/80">0{index + 1}</span></div>} />; }
function SequenceDemo() { return <ImageSequenceScrub alt="Automobil roșu pe șosea" frames={sequenceFrames} poster={ASSETS.carSequence} label="Secvență de 36 cadre" scrollScreens={3} overlay={<div className="flex h-full items-end p-8 text-white"><h1 className="text-6xl font-semibold tracking-[-0.07em]">Frame-perfect.</h1></div>} />; }
function MaskDemo() { return <MaskReveal label="Reveal din alb-negru în culoare" direction="circle" before={<SceneImage src={ASSETS.carPoster} className="object-cover grayscale" />} after={<SceneImage src={ASSETS.carPoster} className="object-cover saturate-150" />} overlay={<div className="grid h-full place-items-center"><p className="text-[clamp(5rem,14vw,13rem)] font-semibold tracking-[-0.09em] text-white mix-blend-difference">REVEAL</p></div>} />; }
const kineticSegments: KineticTypeSegment[] = [
  { text: "IDEA", className: "block", range: [0.05, 0.32], from: { x: "-45vw", rotate: -8, opacity: 0 }, to: { x: "0vw", rotate: 0, opacity: 1 } },
  { text: "conduce", className: "ml-[.45em] block italic text-[#d7ff43]", range: [0.24, 0.55], from: { x: "42vw", opacity: 0 }, to: { x: "0vw", opacity: 1 } },
  { text: "MIȘCAREA", className: "block", range: [0.48, 0.8], from: { y: "1em", rotateX: 70, opacity: 0 }, to: { y: "0em", rotateX: 0, opacity: 1 } },
];
function KineticDemo() { return <KineticType label="Tipografie kinetic" text="Ideea conduce mișcarea" segments={kineticSegments} scrollScreens={3} className="bg-[#101010] px-5 text-white sm:px-[7vw]" textClassName="w-full text-[clamp(4rem,11vw,11rem)] font-semibold leading-[.72] tracking-[-.08em]" />; }
function CursorDemo() { return <CursorLens label="Cursor lens fără punct central" cursorLabel="DISCOVER" lensSize={250} className="h-svh bg-black text-white" base={<SceneImage src={ASSETS.worldPoster} className="object-cover grayscale contrast-125" />} reveal={<SceneImage src={ASSETS.worldPoster} className="object-cover saturate-150" />}><div className="flex h-full flex-col justify-between p-6 pb-10 pt-24"><div className="flex justify-between text-xs uppercase tracking-[.2em]"><span>Cursor lens</span><Scan className="size-5" /></div><p className="text-[clamp(4rem,10vw,10rem)] font-semibold leading-[.78] tracking-[-.08em]">Descoperă<br />altă stare.</p></div></CursorLens>; }
function BeforeAfterDemo() { return <section className="grid min-h-svh place-items-center bg-[#e7e3da] p-5"><BeforeAfter label="Compară două stări" beforeLabel="Monochrome" afterLabel="Color" className="aspect-[16/10] w-full max-w-6xl rounded-[2rem]" before={<SceneImage src={ASSETS.worldPoster} className="object-cover grayscale" />} after={<SceneImage src={ASSETS.worldPoster} className="object-cover saturate-150" />} /></section>; }
function ExpandingDemo() { return <ExpandingMedia label="Media care se extinde" playback="scrub" media={<SceneImage src={ASSETS.worldPoster} className="object-cover" />} overlay={<div className="flex h-full items-end p-8 text-white"><p className="text-7xl font-semibold tracking-[-.07em]">Din cadru, în lume.</p></div>} />; }
function MagneticDemo() { return <MagneticField className="grid min-h-svh place-items-center bg-[#111318] p-6 text-white"><div className="grid w-full max-w-5xl gap-5 sm:grid-cols-3">{["Context", "Material", "Detail"].map((title, index) => <MagneticTarget key={title} radius={300} strength={0.18} maxTravel={34} maxTilt={4}><article className={cn("flex aspect-[4/5] flex-col justify-between rounded-[2rem] p-7", index === 1 ? "bg-[#d7ff43] text-black" : "bg-white/8")}><span>0{index + 1}</span><h2 className="text-4xl font-semibold tracking-[-.05em]">{title}</h2></article></MagneticTarget>)}</div></MagneticField>; }

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
  return <main className="min-h-dvh overflow-clip bg-background text-foreground"><nav aria-label="Experience component explorer" className="fixed inset-x-3 top-3 z-50 flex items-center gap-2 rounded-2xl border border-border/70 bg-background/90 p-2 shadow-lg backdrop-blur-xl sm:inset-x-6"><label htmlFor="experience-demo" className="sr-only">Componentă testată</label><NativeSelect id="experience-demo" value={selected} onChange={(event) => select(event.currentTarget.value as DemoId)} className="min-w-0 flex-1">{demos.map(([id, title]) => <NativeSelectOption key={id} value={id}>{title}</NativeSelectOption>)}</NativeSelect><span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">{String(activeIndex + 1).padStart(2, "0")} / {demos.length}</span><Button type="button" variant="outline" size="icon" aria-label="Componenta anterioară" className="rounded-xl" onClick={() => select(demos[(activeIndex - 1 + demos.length) % demos.length]![0])}>←</Button><Button type="button" variant="outline" size="icon" aria-label="Componenta următoare" className="rounded-xl" onClick={() => select(demos[(activeIndex + 1) % demos.length]![0])}>→</Button><ArrowLeftRight className="hidden size-4 text-muted-foreground lg:block" aria-hidden /></nav><ActiveDemo /></main>;
}

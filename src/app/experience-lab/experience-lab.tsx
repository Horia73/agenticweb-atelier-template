"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import { ArrowDown, MoveHorizontal, Scan } from "lucide-react";
import { motion, type MotionValue, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

import { AmbientParticles, type AmbientParticlesPreset } from "@/components/experience/ambient-particles";
import { BeforeAfter } from "@/components/experience/before-after";
import { CountUp } from "@/components/experience/count-up";
import { HoverPreviewList } from "@/components/experience/hover-preview-list";
import { IntroLoader } from "@/components/experience/intro-loader";
import { KnockoutText } from "@/components/experience/knockout-text";
import { RevealItem, RevealStagger, RevealText } from "@/components/experience/reveal-stagger";
import { ScrollStack } from "@/components/experience/scroll-stack";
import { SplitFlapText } from "@/components/experience/split-flap";
import { SpotlightCard, SpotlightGroup } from "@/components/experience/spotlight-grid";
import { TextScramble } from "@/components/experience/text-scramble";
import { CursorLens } from "@/components/experience/cursor-ambient";
import { MagneticField, MagneticTarget } from "@/components/experience/cursor-magnetic";
import { DepthGallery, type DepthGalleryItem } from "@/components/experience/depth-gallery";
import { DistortionCarousel } from "@/components/experience/distortion-carousel";
import { DrawOnScroll } from "@/components/experience/draw-on-scroll";
import { ExpandingMedia } from "@/components/experience/expanding-media";
import { HoloCard } from "@/components/experience/holo-card";
import { ImageTrail } from "@/components/experience/image-trail";
import { PortalCrossing } from "@/components/experience/portal-crossing";
import { MarqueeVelocity } from "@/components/experience/marquee-velocity";
import { PhysicsPlayground } from "@/components/experience/physics-playground";
import { ElasticImageGrid, type ElasticImageGridItem } from "@/components/experience/elastic-image-grid";
import { FilmStrip3D, type FilmStrip3DItem } from "@/components/experience/film-strip-3d";
import { FocusTransferRail, type FocusTransferRailItem } from "@/components/experience/focus-transfer-rail";
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
import { startThemeWipe, ViewTransitionStyles } from "@/components/experience/route-transition";
import { SceneHandoff } from "@/components/experience/scene-handoff";
import { ShaderField } from "@/components/experience/shader-field";
import { SharedElementZoom } from "@/components/experience/shared-element-zoom";
import { VariableFontAxis } from "@/components/experience/variable-font-axis";
import { SliceRecompose } from "@/components/experience/slice-recompose";
import { SpatialCanvas, type SpatialCanvasItem } from "@/components/experience/spatial-canvas";
import { SpatialFold, type SpatialFoldChapter } from "@/components/experience/spatial-fold";
import { SpatialGallery, type SpatialGalleryItem } from "@/components/experience/spatial-gallery";
import { SpatialProductStage, type SpatialProductPart } from "@/components/experience/spatial-product-stage";
import { ScrollDepthScene, type LayeredDepthLayer } from "@/components/experience/layered-depth";
import { StickyStory, type StickyStoryChapter } from "@/components/experience/sticky-story";
import { TypographyDepthTunnel, type TypographyDepthTunnelItem } from "@/components/experience/typography-depth-tunnel";
import { VolumetricLightStage } from "@/components/experience/volumetric-light-stage";
import { useMediaQuery } from "@/components/experience/experience-runtime";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ExperienceLabGuideSection, ExperienceLabSidebar } from "@/app/experience-lab/experience-lab-chrome";
import { experienceLabGuides } from "@/app/experience-lab/experience-lab-guides";
import experienceCatalog from "../../../experience.catalog.json";

const ASSETS = {
  carPoster: "/experience/depth-car-v3/poster.webp",
  carSubject: "/experience/depth-car-v3/subject.webp",
  carSequence: "/experience/sequence-car-v2/poster.webp",
  portrait: "/experience/spatial-product-stage-v1/portrait.webp",
  respiratorAssembled: "/experience/spatial-product-stage-v1/respirator/assembled.webp",
  worldPoster: "/experience/depth-camera-world-v2/poster.webp",
  worldMobile: "/experience/depth-camera-world-v2/mobile-poster.webp",
  emptyWorld: "/experience/depth-camera-world-v2/layers/00-sky.webp",
  meshCar: "/experience/mesh-transition-v1/car-2x.webp",
  meshWorld: "/experience/mesh-transition-v1/world-2x.webp",
  galaxyMask: "/experience/particle-galaxy-v1/mask.png",
  galaxyColor: "/experience/particle-galaxy-v1/color.png",
  galaxyPoster: "/experience/particle-galaxy-v1/poster.png",
} as const;

function SceneImage({ alt = "", className, priority = false, sizes = "(min-width: 1024px) calc(100vw - 22rem), 100vw", src }: { alt?: string; className?: string; priority?: boolean; sizes?: string; src: string }) {
  return <Image alt={alt} src={src} fill priority={priority} loading={priority ? "eager" : undefined} sizes={sizes} className={className} />;
}

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
      imageAnchor={{ point: [0.669, 0.5], imageAspect: 1600 / 960, objectPosition: [0.7, 0.5] }}
      groupScale={1.12}
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
      label="Produs 3D rotativ"
      description="Trage orizontal sau folosește săgețile pentru a roti obiectul."
      modelSrc="/models/sneaker-shopify-cc-by.glb"
      fitDiameter={3.1}
      mobileModelScale={0.72}
      autoRotate={0.18}
      cameraPosition={[0, 0.1, 5.2]}
      className="h-svh bg-[radial-gradient(circle_at_52%_42%,#25303b_0%,#0b0e12_42%,#040506_78%)] text-white"
      fallback={<div className="absolute inset-0 grid place-items-center"><div className="size-[min(60vw,26rem)] rounded-full bg-[radial-gradient(circle_at_38%_32%,#e9f8ff_0%,#7fd8f2_30%,#123241_70%,transparent_76%)]" /></div>}
    >
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between px-5 pb-10 pt-24 sm:px-[6vw] sm:pb-[7vh] sm:pt-28"><div className="flex items-start justify-between gap-5"><div><p className="text-xs uppercase tracking-[.22em] text-white/50">21 / GLB product orbit</p><h1 className="mt-4 max-w-[7ch] text-[clamp(2.75rem,8vw,8rem)] font-semibold leading-[.78] tracking-[-.08em] [text-shadow:0_2px_24px_rgb(0_0_0/.55)]">Ține produsul în mână.</h1></div><p className="mt-2 hidden max-w-xs text-right text-xs uppercase leading-relaxed tracking-[.16em] text-white/42 sm:block">drag · arrows · auto-orbit<br />GLB or editable primitive</p></div><p className="max-w-sm text-sm leading-relaxed text-white/55">Fixture-ul încarcă un GLB real cu texturi PBR (sneaker © Shopify, CC BY 4.0). Agentul îl înlocuiește cu GLB-ul clientului; `fitDiameter` încadrează automat orice model.</p></div>
    </ProductOrbit>
  );
}

function ParticleAssemblyDemo() {
  return (
    <ParticleAssembly label="Galaxie construită din particule" src={ASSETS.galaxyMask} colorSrc={ASSETS.galaxyColor} sampling="light" sourceColorMix={1} colorBoost={1.35} relief={0.55} alt="Galaxie spirală asamblată din particule colorate" trigger="scroll" scrollScreens={3.1} particleCount={26000} pointSize={4.2} scatter={5.4} color="#73ecff" smoothing={6} className="bg-[#050607] text-white" stageClassName="bg-[radial-gradient(circle_at_50%_50%,#10141d_0%,#070a10_42%,#030405_76%)]" fallback={<SceneImage src={ASSETS.galaxyPoster} className="object-contain" />}>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.58),transparent_46%)]" />
      <div className="relative flex h-full flex-col justify-between px-5 pb-10 pt-24 sm:px-[6vw] sm:pb-[7vh] sm:pt-28"><div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/48"><span>22 / Particle assembly</span><span>scroll → galaxie</span></div><div><h1 className="max-w-[8ch] text-[clamp(4rem,9vw,9rem)] font-semibold leading-[.76] tracking-[-.085em]">Din zgomot, o galaxie.</h1><p className="mt-6 max-w-sm text-sm leading-relaxed text-white/55">Matte-ul de densitate și harta de culoare sunt generate procedural (scripts/generate-particle-galaxy.mjs); orice siluetă, logo sau produs poate lua locul lor fără schimbarea engine-ului.</p></div></div>
    </ParticleAssembly>
  );
}

const tunnelItems: TypographyDepthTunnelItem[] = [
  { id: "enter", accessibleText: "Intră în idee", align: "start", content: <p className="max-w-[6ch] text-[clamp(5rem,14vw,14rem)] font-semibold leading-[.82] tracking-[-.08em]">INTRĂ ÎN IDEE.</p> },
  { id: "scale", accessibleText: "Distanța devine scară", align: "end", content: <p className="max-w-[7ch] text-right text-[clamp(4.5rem,12vw,12rem)] font-semibold leading-[.84] tracking-[-.075em] text-[#d7ff43]">DISTANȚA DEVINE SCARĂ.</p> },
  { id: "focus", accessibleText: "Focusul devine ritm", align: "start", content: <p className="max-w-[7ch] text-[clamp(4.5rem,12vw,12rem)] font-semibold leading-[.84] tracking-[-.075em]">FOCUSUL DEVINE RITM.</p> },
  { id: "exit", accessibleText: "Ieși cu o concluzie", align: "center", content: <p className="max-w-[8ch] text-center text-[clamp(4.5rem,12vw,12rem)] font-semibold leading-[.84] tracking-[-.075em]">IEȘI CU O CONCLUZIE.</p> },
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
  return <SpatialCanvas label="Canvas spațial explorabil" items={spatialCanvasItems} worldSize={[2100, 1450]} initialView={{ x: 0, y: 25, zoom: .82 }} minZoom={.55} maxZoom={1.5} zoomInLabel="Mărește" zoomOutLabel="Micșorează" resetLabel="Resetează poziția" instructions="Trage pentru a naviga planul, folosește săgețile pentru deplasare și +/− pentru zoom." className="bg-[#0a0d10] text-white" stageClassName="pt-16" />;
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

const focusTransferItems: FocusTransferRailItem[] = [
  { id: "world", label: "World", content: <div className="relative h-full"><SceneImage src={ASSETS.worldPoster} className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" /><div className="absolute inset-x-0 bottom-0 p-6 text-white"><span className="text-xs uppercase tracking-[.2em] text-white/55">01 / World</span><p className="mt-2 text-4xl font-semibold tracking-[-.06em]">Threshold</p></div></div> },
  { id: "human", label: "Human", content: <div className="relative h-full"><SceneImage src={ASSETS.portrait} className="object-cover object-[68%_center]" /><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" /><div className="absolute inset-x-0 bottom-0 p-6 text-white"><span className="text-xs uppercase tracking-[.2em] text-white/55">02 / Human</span><p className="mt-2 text-4xl font-semibold tracking-[-.06em]">Interface</p></div></div> },
  { id: "motion", label: "Motion", content: <div className="relative h-full"><SceneImage src={ASSETS.carPoster} className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" /><div className="absolute inset-x-0 bottom-0 p-6 text-white"><span className="text-xs uppercase tracking-[.2em] text-white/55">03 / Motion</span><p className="mt-2 text-4xl font-semibold tracking-[-.06em]">Velocity</p></div></div> },
];

function FocusTransferRailDemo() {
  const header = <div className="mx-auto w-full max-w-7xl"><p className="text-xs uppercase tracking-[.2em] text-white/45">51 / Focus transfer rail</p><h1 className="mt-3 max-w-[12ch] text-[clamp(3.2rem,6.5vw,6.5rem)] font-semibold leading-[.82] tracking-[-.075em]">Prioritatea trece dintr-un cadru în altul.</h1></div>;
  return <FocusTransferRail label="Transfer de focus între trei cadre" items={focusTransferItems} activeRatio={2.45} scrollScreensPerStep={0.85} className="bg-[#08090b] text-white" staticClassName="px-5 pb-12 pt-24 sm:px-[5vw] sm:pt-28" stageClassName="px-5 pb-8 pt-24 sm:px-[5vw] sm:pt-28" header={header} trackClassName="mx-auto mt-8 w-full max-w-7xl flex-1 gap-3" staticTrackClassName="mx-auto mt-8 w-full max-w-7xl sm:grid-cols-3" itemClassName="rounded-[1.5rem] bg-[#15181d]" staticItemClassName="min-h-[26rem]" />;
}

function FluidSurfaceDemo() {
  return (
    <FluidSurface label="Suprafață fluidă reactivă" src={ASSETS.worldPoster} alt="Portal mineral distorsionat de unde fluide" strength={0.011} radius={0.22} decay={1.3} chromatic={0.0009} className="h-svh text-white">
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

const zoomWorks = [
  { id: "threshold", label: "Threshold", src: ASSETS.worldPoster, eyebrow: "01 / World", body: "Cadrul se deschide continuu din grid, fără tăietură; aceeași imagine, alt rol de layout." },
  { id: "interface", label: "Interface", src: ASSETS.portrait, eyebrow: "02 / Human", body: "Detaliul este un dialog real: Escape, backdrop și butonul de închidere îl închid, focusul revine pe card." },
  { id: "velocity", label: "Velocity", src: ASSETS.carPoster, eyebrow: "03 / Motion", body: "Morph-ul este reversibil; scroll-ul paginii rămâne blocat doar cât timp detaliul este deschis." },
  { id: "silence", label: "Silence", src: ASSETS.emptyWorld, eyebrow: "04 / Origin", body: "Pe reduced motion morph-ul devine un fade simplu, cu aceeași semantică de dialog." },
];

function SharedElementZoomDemo() {
  return (
    <section className="min-h-svh bg-[#0b0d10] px-5 pb-16 pt-24 text-white sm:px-[5vw] sm:pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-6"><div><p className="text-xs uppercase tracking-[.2em] text-white/45">31 / Shared element zoom</p><h1 className="mt-3 text-[clamp(3rem,6.5vw,6.5rem)] font-semibold leading-[.8] tracking-[-.075em]">Cardul devine scena.</h1></div><p className="hidden max-w-xs text-sm text-white/50 lg:block">Grid → detaliu printr-un morph FLIP continuu; conținutul ambelor stări este React editabil.</p></div>
        <SharedElementZoom label="Lucrări selectate" closeLabel="Închide detaliul" cursorLabel="Deschide" items={zoomWorks} gridClassName="grid-cols-2 gap-4 md:grid-cols-4" detailClassName="bg-[#101318] text-white" renderThumb={(work) => <div className="relative aspect-[4/5]"><SceneImage src={work.src} sizes="(max-width: 767px) 45vw, 22vw" className="object-cover" /><span className="absolute bottom-4 left-4 text-xs uppercase tracking-[.18em] text-white">{work.eyebrow}</span></div>} renderDetail={(work) => <div><div className="relative aspect-[16/10]"><SceneImage src={work.src} sizes="(max-width: 767px) 92vw, 48rem" className="object-cover" /></div><div className="p-6 sm:p-8"><p className="text-xs uppercase tracking-[.2em] text-white/45">{work.eyebrow}</p><h2 className="mt-2 text-4xl font-semibold tracking-[-.05em]">{work.label}</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">{work.body}</p></div></div>} />
      </div>
    </section>
  );
}

function DrawOnScrollDemo() {
  return (
    <DrawOnScroll label="Traseu desenat de scroll" pin scrollScreens={2.6} stagger={0.5} className="bg-[#0d0f12] text-white" stageClassName="px-5 sm:px-[6vw]">
      <div className="w-full max-w-6xl">
        <div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/45"><span>32 / Draw on scroll</span><span className="hidden sm:block">stroke-dasharray · SVG propriu</span></div>
        <svg viewBox="0 0 960 420" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-10 w-full">
          <path d="M20 358 H 940" strokeWidth="1.25" opacity=".4" />
          <path d="M70 358 L 190 190 L 310 358" />
          <path d="M250 358 L 420 128 L 590 358" strokeWidth="3" />
          <circle cx="760" cy="120" r="48" />
          <path d="M20 330 C 200 318, 330 236, 470 250 S 760 340, 940 208" strokeWidth="3.5" />
          <path d="M470 250 C 520 210, 610 196, 668 158" strokeWidth="1.5" opacity=".7" />
        </svg>
        <h1 className="mt-10 max-w-[12ch] text-[clamp(2.6rem,5.5vw,5rem)] font-semibold leading-[.9] tracking-[-.06em]">Linia își amintește drumul.</h1>
      </div>
    </DrawOnScroll>
  );
}

const marqueeWords = ["ATELIER", "MOTION", "MATERIAL", "SIGNAL"];

function MarqueeRow({ accent }: { accent: boolean }) {
  return (
    <>
      {marqueeWords.map((word, index) => (
        <span key={word} className={cn("whitespace-nowrap text-[clamp(3.2rem,8vw,8rem)] font-semibold leading-none tracking-[-.06em]", accent && index % 2 === 1 && "text-[#d7ff43]")}>{word}<span aria-hidden className="mx-8 opacity-25">·</span></span>
      ))}
    </>
  );
}

function MarqueeVelocityDemo() {
  return (
    <section className="flex min-h-svh flex-col justify-center gap-12 overflow-hidden bg-[#101114] py-24 text-white">
      <div className="flex justify-between px-5 text-xs uppercase tracking-[.2em] text-white/45 sm:px-[6vw]"><span>33 / Velocity marquee</span><span className="hidden sm:block">scroll velocity → speed &amp; direction</span></div>
      <div className="space-y-8">
        <MarqueeVelocity label="Bandă principală" speed={90} velocityInfluence={1.8}><MarqueeRow accent /></MarqueeVelocity>
        <MarqueeVelocity label="Bandă secundară" direction={-1} speed={55} velocityInfluence={1.2} className="opacity-40"><MarqueeRow accent={false} /></MarqueeVelocity>
      </div>
      <p className="max-w-md px-5 text-sm leading-relaxed text-white/55 sm:px-[6vw]">Dă scroll rapid în sus și în jos: banda accelerează și își inversează sensul după viteza documentului.</p>
    </section>
  );
}

function VariableFontAxisDemo() {
  return (
    <section className="grid min-h-svh place-items-center bg-[#ece9e1] px-5 py-24 text-black">
      <div className="w-full max-w-6xl">
        <p className="text-xs uppercase tracking-[.2em] opacity-45">34 / Variable font axis</p>
        <VariableFontAxis label="Titlu cu greutate variabilă" text="GREUTATEA URMEAZĂ CURSORUL" as="h1" axes={[{ tag: "wght", from: 320, to: 840 }]} radius={200} className="mt-6" textClassName="text-[clamp(2.4rem,6.4vw,6rem)] leading-[1.04] tracking-[-.04em]" />
        <p className="mt-8 max-w-md text-sm leading-relaxed opacity-60">Textul rămâne real și selectabil; doar font-variation-settings se mișcă. Pe touch și reduced motion rămâne static la valorile de bază.</p>
      </div>
    </section>
  );
}

function ImageTrailDemo() {
  return (
    <ImageTrail label="Trail de imagini după cursor" images={[ASSETS.worldPoster, ASSETS.portrait, ASSETS.carPoster, ASSETS.emptyWorld]} size={190} threshold={110} lifeMs={1100} className="min-h-svh bg-[#0a0b0d] text-white" fallback={<div className="grid h-full grid-cols-2 content-center gap-3 p-5 opacity-35 sm:grid-cols-4">{[ASSETS.worldPoster, ASSETS.portrait, ASSETS.carPoster, ASSETS.emptyWorld].map((src) => <div key={src} className="relative aspect-[4/5] overflow-hidden rounded-xl"><SceneImage src={src} sizes="45vw" className="object-cover" /></div>)}</div>}>
      <div className="pointer-events-none relative z-10 flex min-h-svh flex-col justify-between px-5 pb-10 pt-24 sm:px-[6vw] sm:pb-[7vh] sm:pt-28">
        <div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/48"><span>35 / Image trail</span><span className="hidden sm:block">WAAPI pool · decorative only</span></div>
        <div><h1 className="max-w-[8ch] text-[clamp(4rem,9vw,9rem)] font-semibold leading-[.78] tracking-[-.085em]">Gestul lasă urme.</h1><p className="mt-6 max-w-sm text-sm leading-relaxed text-white/55">Mișcă întâi cursorul prin secțiune: cardurile apar la prag de distanță și se sting singure. Conținutul real rămâne în flow.</p></div>
      </div>
    </ImageTrail>
  );
}

function RouteTransitionDemo() {
  const [dark, setDark] = React.useState(true);
  return (
    <section className={cn("grid min-h-svh place-items-center px-5 py-24", dark ? "bg-[#0b0d10] text-white" : "bg-[#ece9e1] text-black")}>
      <ViewTransitionStyles />
      <div className="w-full max-w-3xl text-center">
        <p className={cn("text-xs uppercase tracking-[.2em]", dark ? "text-white/45" : "opacity-45")}>36 / Route transition</p>
        <h1 className="mt-4 text-[clamp(3rem,7vw,7rem)] font-semibold leading-[.82] tracking-[-.07em]">Continuitate între stări.</h1>
        <p className={cn("mx-auto mt-6 max-w-md text-sm leading-relaxed", dark ? "text-white/58" : "opacity-60")}>ViewTransitionLink și useViewTransitionRouter leagă rutele reale; aici demonstrăm theme wipe-ul circular pe o schimbare locală de stare.</p>
        <Button type="button" variant={dark ? "secondary" : "default"} className="mt-10" onClick={(event) => { const origin = { x: event.clientX, y: event.clientY }; startThemeWipe(() => { flushSync(() => setDark((value) => !value)); }, { origin }); }}>Comută tema cu wipe</Button>
        <p className={cn("mt-6 text-xs uppercase tracking-[.18em]", dark ? "text-white/35" : "opacity-40")}>Fallback: schimbare instant fără View Transitions</p>
      </div>
    </section>
  );
}

function DistortionCarouselDemo() {
  const slides = [
    { id: "world", src: ASSETS.worldPoster, alt: "Portal de obsidian într-un peisaj mineral", eyebrow: "01 / World", title: "Threshold" },
    { id: "human", src: ASSETS.portrait, alt: "Portret editorial pentru un produs wearable", eyebrow: "02 / Human", title: "Interface" },
    { id: "motion", src: ASSETS.carPoster, alt: "Automobil pe un drum de coastă", eyebrow: "03 / Motion", title: "Velocity" },
    { id: "origin", src: ASSETS.emptyWorld, alt: "Orizont mineral fără obiect central", eyebrow: "04 / Origin", title: "Silence" },
  ];
  return (
    <DistortionCarousel
      label="Galerie GPU cu drag și distorsiune"
      items={slides}
      previousLabel="Slide-ul anterior"
      nextLabel="Slide-ul următor"
      slideLabel={(index, count) => `Slide ${index + 1} din ${count}`}
      distortion={1.1}
      className="h-svh text-white"
      renderCaption={(slide) => (
        <div className="flex h-full flex-col justify-between px-5 pb-24 pt-24 sm:px-[6vw] sm:pt-28">
          <div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/55"><span>37 / Distortion carousel</span><span className="hidden sm:block">drag · momentum · GPU bend</span></div>
          <div><p className="text-xs uppercase tracking-[.2em] text-white/55">{slide.eyebrow}</p><p className="mt-3 text-[clamp(3.5rem,9vw,9rem)] font-semibold leading-[.8] tracking-[-.08em] [text-shadow:0_2px_28px_rgb(0_0_0/.5)]">{slide.title}</p></div>
        </div>
      )}
    />
  );
}

function PortalCrossingHint({ progress }: { progress: MotionValue<number> }) {
  const hintOpacity = useTransform(progress, [0, 0.14], [1, 0]);
  return (
    <div className="flex h-full flex-col justify-between px-5 pb-8 pt-24 text-xs uppercase tracking-[.2em] text-white/55 sm:px-[6vw]">
      <div className="flex justify-between"><span>38 / Portal crossing</span><span className="hidden sm:block">portal 3D venit din adânc · traversare la scroll</span></div>
      <motion.span className="self-center inline-flex items-center gap-2" style={{ opacity: hintOpacity }}><ArrowDown className="size-3.5" aria-hidden />scroll pentru a traversa</motion.span>
    </div>
  );
}

function PortalCrossingDemo() {
  return (
    <PortalCrossing
      label="Portal 3D către altă lume"
      origin={{ src: ASSETS.emptyWorld, alt: "Orizont mineral pustiu" }}
      destination={{ src: ASSETS.carPoster, alt: "Drum de coastă luminat la apus" }}
      className="text-white"
      overlay={(progress) => <PortalCrossingHint progress={progress} />}
      arrival={
        <div className="flex h-full flex-col items-center justify-end pb-[10vh] text-center">
          <p className="text-xs uppercase tracking-[.24em] text-white/65">Ai traversat</p>
          <p className="mt-4 max-w-3xl text-[clamp(2.2rem,5.5vw,5rem)] font-semibold leading-[.95] tracking-[-.05em] [text-shadow:0_2px_30px_rgb(0_0_0/.55)]">Bine ai venit în altă lume.</p>
        </div>
      }
    />
  );
}

const physicsBadges = ["Branding", "Web", "Motion", "3D", "AI", "SEO", "UX", "Strategie", "Content", "★"].map((text, index) => ({
  id: `badge-${index}`,
  content: (
    <div
      className={cn(
        "flex items-center justify-center rounded-full px-7 py-4 text-lg font-semibold tracking-[-.02em] shadow-xl select-none",
        index % 3 === 0 ? "bg-[#d7ff43] text-black" : index % 3 === 1 ? "bg-white text-black" : "border border-white/25 bg-[#191d22] text-white",
        text === "★" && "size-16 px-0 text-2xl",
      )}
    >
      {text}
    </div>
  ),
}));

function PhysicsPlaygroundDemo() {
  return (
    <PhysicsPlayground
      label="Teren de joacă cu fizică pentru badge-uri"
      items={physicsBadges}
      className="relative min-h-svh overflow-hidden bg-[#0b0e11] text-white"
      header={
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between px-5 pt-24 text-xs uppercase tracking-[.2em] text-white/48 sm:px-[6vw]">
          <span>39 / Physics playground</span>
          <span className="hidden sm:block">gravitate · coliziuni · aruncă-le</span>
        </div>
      }
    />
  );
}

function HoloCardDemo() {
  return (
    <section className="grid min-h-svh place-items-center bg-[#101114] px-5 py-24 text-white">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/45"><span>40 / Holo card</span><span className="hidden sm:block">tilt 3D · foil · glare</span></div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-10">
          <HoloCard maxTilt={12} foil={0.85} glare={0.7} className="w-[19rem]">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#171b20]">
              <div className="absolute inset-x-0 top-0 aspect-square"><SceneImage src={ASSETS.worldPoster} className="object-cover" /></div>
              <div className="absolute inset-x-0 bottom-0 space-y-1 p-6">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[.24em] text-white/55">Atelier / Member</p>
                <p className="text-2xl font-semibold tracking-[-.04em]">Threshold Pass</p>
                <p className="pt-3 font-mono text-xs text-white/45">Nº 0001 — MMXXVI</p>
              </div>
            </div>
          </HoloCard>
          <div className="max-w-sm">
            <h1 className="text-[clamp(2.6rem,5vw,4.5rem)] font-semibold leading-[.9] tracking-[-.06em]">Materia prinde lumină.</h1>
            <p className="mt-5 text-sm leading-relaxed text-white/55">Mișcă cursorul peste card: tilt-ul urmărește pointerul, foița holografică traversează suprafața, iar pe touch și reduced motion cardul rămâne complet static.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function RevealStaggerDemo() {
  const revealCards = [
    { id: "world", src: ASSETS.worldPoster, eyebrow: "01 / World", title: "Threshold" },
    { id: "human", src: ASSETS.portrait, eyebrow: "02 / Human", title: "Interface" },
    { id: "motion", src: ASSETS.carPoster, eyebrow: "03 / Motion", title: "Velocity" },
  ];
  return (
    <section className="min-h-svh bg-[#ece9e1] px-5 pb-20 pt-24 text-black sm:px-[6vw] sm:pt-28">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[.2em] opacity-45">41 / Reveal stagger</p>
        <h1 className="mt-5 max-w-[14ch] text-[clamp(3rem,7vw,7rem)] font-semibold leading-[.82] tracking-[-.075em]">
          <RevealText text="Ritmul construiește ierarhia." once={false} />
        </h1>
        <RevealStagger variant="rise" staggerMs={110} once={false} className="mt-14 grid gap-4 md:grid-cols-3">
          {revealCards.map((card) => (
            <RevealItem key={card.id}>
              <article className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem]">
                <SceneImage src={card.src} sizes="(max-width: 767px) 92vw, 30vw" className={cn("object-cover", card.id === "human" && "object-[68%_center]")} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20 text-white"><span className="text-xs uppercase tracking-[.2em]">{card.eyebrow}</span><p className="mt-2 text-3xl font-semibold tracking-[-.05em]">{card.title}</p></div>
              </article>
            </RevealItem>
          ))}
        </RevealStagger>
        <RevealStagger variant="fade" staggerMs={140} once={false} className="mt-14 grid gap-8 md:grid-cols-2">
          <RevealItem><p className="max-w-md text-sm leading-relaxed opacity-60">Aceeași coregrafie acoperă titluri, carduri și liste: grupul observă viewportul, iar fiecare element intră cu propriul delay. Dă scroll în jos și înapoi — `once={"{false}"}` rejoacă secvența.</p></RevealItem>
          <RevealItem><p className="max-w-md text-sm leading-relaxed opacity-60">Serverul și reduced motion livrează starea finală: conținutul nu depinde niciodată de JavaScript ca să fie lizibil.</p></RevealItem>
        </RevealStagger>
      </div>
    </section>
  );
}

function CountUpDemo() {
  const stats = [
    { id: "directions", value: experienceCatalog.visibleDirections, suffix: "", label: "Mecanisme verificate în Experience Lab" },
    { id: "uptime", value: 99.98, suffix: "%", options: { minimumFractionDigits: 2 }, label: "Disponibilitate măsurată în producție" },
    { id: "delivery", value: 12, suffix: " zile", label: "De la brief la primul preview" },
    { id: "projects", value: 1840, suffix: "", options: { useGrouping: true }, label: "Componente livrate în site-uri reale" },
  ];
  return (
    <section className="grid min-h-svh place-items-center bg-[#0b0d10] px-5 py-24 text-white">
      <div className="w-full max-w-7xl">
        <div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/45"><span>42 / Count-up stats</span><span className="hidden sm:block">Intl format · layout rezervat</span></div>
        <h1 className="mt-6 max-w-[12ch] text-[clamp(2.8rem,6vw,6rem)] font-semibold leading-[.84] tracking-[-.07em]">Cifrele intră în scenă o singură dată.</h1>
        <dl className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={stat.id} className="border-t border-white/12 pt-6">
              <dd className="text-[clamp(2.8rem,5vw,4.5rem)] font-semibold tabular-nums tracking-[-.05em] text-[#d7ff43]">
                <CountUp value={stat.value} suffix={stat.suffix} formatOptions={stat.options} delayMs={index * 140} locale="ro-RO" />
              </dd>
              <dt className="mt-3 max-w-[24ch] text-sm leading-relaxed text-white/55">{stat.label}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-16 max-w-md text-sm leading-relaxed text-white/45">Valoarea finală este redată de server și rezervă layout-ul: rândul nu sare, iar reduced motion vede direct rezultatul.</p>
      </div>
    </section>
  );
}

function HoverPreviewListDemo() {
  const works = [
    { id: "threshold", title: "Threshold", meta: "Identitate · 2026", src: ASSETS.worldPoster },
    { id: "interface", title: "Interface", meta: "Produs · 2026", src: ASSETS.portrait },
    { id: "velocity", title: "Velocity", meta: "Campanie · 2025", src: ASSETS.carPoster },
    { id: "silence", title: "Silence", meta: "Editorial · 2025", src: ASSETS.emptyWorld },
  ];
  return (
    <section className="min-h-svh bg-[#0d0f12] px-5 pb-20 pt-24 text-white sm:px-[6vw] sm:pt-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/45"><span>43 / Hover preview list</span><span className="hidden sm:block">cursor-follow panel · inline pe touch</span></div>
        <h1 className="mt-5 max-w-[12ch] text-[clamp(2.8rem,6vw,6rem)] font-semibold leading-[.84] tracking-[-.07em]">Indexul rămâne tipografic.</h1>
        <HoverPreviewList
          label="Lucrări selectate"
          previewWidth={330}
          className="mt-12"
          listClassName="divide-y divide-white/12 border-y border-white/12"
          itemClassName={(_, active) => cn("transition-colors", active && "bg-white/[.04]")}
          previewClassName="rounded-[1.25rem] shadow-2xl"
          inlinePreviewClassName="mb-6 aspect-[4/3] rounded-[1.25rem]"
          items={works.map((work) => ({
            id: work.id,
            content: (
              <a href={`#${work.id}`} className="flex items-baseline justify-between gap-6 py-7 outline-offset-4">
                <span className="text-[clamp(1.8rem,4vw,3.5rem)] font-semibold tracking-[-.05em]">{work.title}</span>
                <span className="shrink-0 text-xs uppercase tracking-[.18em] text-white/45">{work.meta}</span>
              </a>
            ),
            preview: <SceneImage src={work.src} sizes="330px" className={cn("object-cover", work.id === "interface" && "object-[68%_center]")} />,
          }))}
        />
        <p className="mt-10 max-w-md text-sm leading-relaxed text-white/45">Panoul urmărește cursorul cu damping și tilt din viteză; focusul din tastatură îl ancorează lângă rând, iar pe touch preview-urile intră inline.</p>
      </div>
    </section>
  );
}

function TextScrambleDemo() {
  return (
    <section className="flex min-h-svh flex-col justify-between bg-[#080a0c] px-5 pb-10 pt-24 font-mono text-white sm:px-[6vw] sm:pb-[7vh] sm:pt-28">
      <div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/45"><span>44 / Text scramble</span><span className="hidden sm:block">decode stânga → dreapta</span></div>
      <div>
        <p className="text-xs uppercase tracking-[.22em] text-white/40">Atelierul lucrează la</p>
        <h1 className="mt-6 text-[clamp(2.6rem,9vw,9rem)] font-semibold uppercase leading-[.9] tracking-[-.04em]">
          <TextScramble text="DESIGN" phrases={["DESIGN", "INGINERIE", "MIȘCARE", "SISTEME"]} holdMs={1900} durationMs={800} charset="ABCDEFGHIJKLMNOPQRSTUVWXYZȘȚĂÂÎ#/*+" scrambleClassName="text-[#d7ff43]/70" />
        </h1>
      </div>
      <div className="flex flex-col gap-3 text-sm text-white/55 sm:flex-row sm:items-end sm:justify-between">
        <TextScramble text="[ HOVER PENTRU RE-DECODARE ]" trigger="hover" durationMs={600} className="w-fit cursor-default uppercase tracking-[.14em]" scrambleClassName="opacity-40" />
        <p className="max-w-sm leading-relaxed">Stringul real rămâne conținutul redat de server și numele accesibil; glifele criptate sunt decorative.</p>
      </div>
    </section>
  );
}

function SpotlightGridDemo() {
  return (
    <section className="min-h-svh bg-[#0a0c0f] px-5 pb-20 pt-24 text-white sm:px-[6vw] sm:pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/45"><span>45 / Spotlight grid</span><span className="hidden sm:block">un singur pointer field · CSS vars</span></div>
        <h1 className="mt-5 max-w-[13ch] text-[clamp(2.8rem,6vw,6rem)] font-semibold leading-[.84] tracking-[-.07em]">Lumina urmează intenția.</h1>
        <SpotlightGroup radius={340} color="rgba(255,255,255,.55)" fillOpacity={0.07} className="mt-12 grid gap-4 md:grid-cols-3">
          <SpotlightCard className="rounded-[1.75rem] border border-white/10 bg-white/[.03] md:col-span-2">
            <div className="flex min-h-72 flex-col justify-between p-8"><p className="text-xs uppercase tracking-[.2em] text-white/45">01 / Platform</p><p className="max-w-[16ch] text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Un singur listener luminează tot grid-ul.</p></div>
          </SpotlightCard>
          <SpotlightCard color="rgba(215,255,67,.6)" className="rounded-[1.75rem] border border-white/10 bg-white/[.03]">
            <div className="flex min-h-72 flex-col justify-between p-8"><p className="text-xs uppercase tracking-[.2em] text-white/45">02 / Accent</p><p className="text-4xl font-semibold tracking-[-.05em]">Glow per card.</p></div>
          </SpotlightCard>
          <SpotlightCard color="rgba(115,215,255,.55)" className="rounded-[1.75rem] border border-white/10 bg-white/[.03]">
            <div className="flex min-h-64 flex-col justify-between p-8"><p className="text-xs uppercase tracking-[.2em] text-white/45">03 / Detail</p><p className="text-4xl font-semibold tracking-[-.05em]">Ring + fill.</p></div>
          </SpotlightCard>
          <SpotlightCard className="relative overflow-hidden rounded-[1.75rem] border border-white/10 md:col-span-2">
            <div className="absolute inset-0 opacity-45"><SceneImage src={ASSETS.worldPoster} className="object-cover" /></div>
            <div className="relative flex min-h-64 flex-col justify-between p-8"><p className="text-xs uppercase tracking-[.2em] text-white/60">04 / Media</p><p className="max-w-[18ch] text-4xl font-semibold tracking-[-.05em]">Cardurile își păstrează propriul conținut.</p></div>
          </SpotlightCard>
        </SpotlightGroup>
        <p className="mt-10 max-w-md text-sm leading-relaxed text-white/45">Pe touch și reduced motion cardurile rămân complet statice, cu bordurile lor de repaus.</p>
      </div>
    </section>
  );
}

const stackCards = [
  { id: "strategy", title: "Strategie", body: "Fiecare card se fixează sub marginea de sus; următorul alunecă peste el.", className: "bg-[#16191d] text-white" },
  { id: "design", title: "Design", body: "Cardul acoperit se scalează și se întunecă proporțional cu acoperirea.", className: "bg-[#d7ff43] text-black" },
  { id: "build", title: "Build", body: "Totul e măsurat live: cardurile pot avea orice înălțime.", className: "bg-white text-black" },
  { id: "launch", title: "Launch", body: "Ultimul card nu se transformă niciodată și eliberează pagina natural.", className: "bg-[#22262b] text-white" },
];

function ScrollStackDemo() {
  return (
    <div className="bg-[#0b0d10] text-white">
      <div className="px-5 pb-4 pt-24 sm:px-[6vw] sm:pt-28">
        <div className="mx-auto flex max-w-5xl justify-between text-xs uppercase tracking-[.2em] text-white/45"><span>46 / Scroll stack</span><span className="hidden sm:block">sticky · reversibil · orice înălțime</span></div>
      </div>
      <ScrollStack label="Procesul atelierului" topOffset={88} peek={14} gap={28} scaleStep={0.055} dim={0.4} className="mx-auto max-w-5xl px-5 pb-24 sm:px-0">
        {stackCards.map((card, index) => (
          <article key={card.id} className={cn("flex min-h-[68svh] flex-col justify-between rounded-[2rem] p-8 shadow-2xl sm:p-12", card.className)}>
            <div className="flex justify-between text-xs uppercase tracking-[.2em] opacity-50"><span>0{index + 1} / Proces</span><span>Scroll stack</span></div>
            <div><h2 className="text-[clamp(2.8rem,7vw,6rem)] font-semibold tracking-[-.06em]">{card.title}</h2><p className="mt-4 max-w-lg text-sm leading-relaxed opacity-60 sm:text-base">{card.body}</p></div>
          </article>
        ))}
      </ScrollStack>
      <section className="grid min-h-[40svh] place-items-center bg-[#ece9e1] px-5 text-center text-black"><p className="max-w-[16ch] text-[clamp(2rem,4.5vw,4rem)] font-semibold leading-[.9] tracking-[-.06em]">Stiva se termină. Pagina continuă.</p></section>
    </div>
  );
}

function KnockoutTextDemo() {
  return (
    <div className="bg-[#050505]">
      <KnockoutText
        label="Secvență knockout: din negru, prin litere, în imagine"
        as="h1"
        text="PORTAL"
        src={ASSETS.worldPoster}
        mobileSrc={ASSETS.worldMobile}
        scrollScreens={3.6}
        maxScale={210}
        mobileMaxScale={200}
        tabletMaxScale={210}
        imageMaxScale={1.5}
        mobileImageMaxScale={1.55}
        tabletImageMaxScale={1.52}
        focusIndex={2}
        passageX={0.15}
        passageY={0.5}
        textClassName="px-4 text-center text-[clamp(3.6rem,16.5cqw,18rem)] font-bold leading-none tracking-[-.05em] text-white"
        className="text-white"
        overlay={
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-5 pb-8 pt-24 sm:px-[6vw] sm:pt-28">
            <div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/45 mix-blend-difference"><span>47 / Knockout text</span><span className="hidden sm:block">text solid → litere decupate → R transparent → traversare</span></div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-white/50 mix-blend-difference"><ArrowDown className="size-4" /> scroll conduce cele patru beat-uri</p>
          </div>
        }
      />
      <section className="grid min-h-[50svh] place-items-center bg-[#ece9e1] px-5 text-center text-black"><div><p className="text-xs uppercase tracking-[.2em] opacity-45">Release</p><p className="mt-4 max-w-[18ch] text-[clamp(2rem,4.5vw,4rem)] font-semibold leading-[.9] tracking-[-.06em]">Camera a trecut prin litere. Pagina continuă.</p></div></section>
    </div>
  );
}

function IntroLoaderDemo() {
  const [runId, setRunId] = React.useState(0);
  return (
    <section className="relative grid min-h-svh place-items-center overflow-hidden bg-[#0b0d10] px-5 py-24 text-white">
      <IntroLoader
        key={runId}
        storageKey={null}
        minDurationMs={2200}
        words={["CRAFT", "MOTION", "SISTEME", "ATELIER"]}
        label="Se încarcă experiența"
        className="absolute z-[40]"
      >
        <p className="text-2xl font-semibold uppercase tracking-[.3em]">Atelier</p>
      </IntroLoader>
      <div className="w-full max-w-3xl text-center">
        <p className="text-xs uppercase tracking-[.2em] text-white/45">48 / Intro loader</p>
        <h1 className="mt-4 text-[clamp(3rem,7vw,7rem)] font-semibold leading-[.82] tracking-[-.07em]">Cortina s-a ridicat.</h1>
        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-white/55">Counterul urmărește încărcarea reală a documentului, cortina iese cu easing, iar `storageKey` limitează secvența la o dată pe sesiune. Prin `active` și `progress` devine loading screen pentru orice: rute, galerii, scene 3D — counterul urmărește progresul real raportat.</p>
        <Button type="button" variant="secondary" className="mt-10" onClick={() => setRunId((id) => id + 1)}>Rejoacă intro-ul</Button>
      </div>
    </section>
  );
}

function AmbientParticlesDemo() {
  const [preset, setPreset] = React.useState<AmbientParticlesPreset>("fireflies");
  return (
    <section className="relative flex h-svh flex-col justify-between overflow-hidden bg-black px-5 pb-10 pt-24 text-white sm:px-[6vw] sm:pb-[7vh] sm:pt-28">
      <SceneImage src={ASSETS.emptyWorld} priority className="object-cover brightness-[.6]" />
      <AmbientParticles preset={preset} density={6} opacity={0.85} blend="screen" pointerInfluence={46} className="z-[1]" />
      <div className="relative z-10 flex justify-between text-xs uppercase tracking-[.2em] text-white/55"><span>49 / Ambient particles</span><span className="hidden sm:block">canvas 2D · buget impus</span></div>
      <div className="relative z-10">
        <div className="pointer-events-auto mb-8 w-fit">
          <p id="particles-preset-label" className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/50">Preset</p>
          <Select value={preset} onValueChange={(value) => setPreset(value as AmbientParticlesPreset)}>
            <SelectTrigger aria-labelledby="particles-preset-label" className="w-44 rounded-xl border-white/15 bg-black/35 text-white backdrop-blur-xl hover:bg-black/50 data-[state=open]:bg-black/50 [&_svg]:text-white/60"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl border-white/12 bg-[#101215]/95 text-white backdrop-blur-xl">
              <SelectItem value="fireflies">Fireflies</SelectItem>
              <SelectItem value="dust">Dust</SelectItem>
              <SelectItem value="snow">Snow</SelectItem>
              <SelectItem value="embers">Embers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <h1 className="max-w-[9ch] text-[clamp(3.5rem,9vw,9rem)] font-semibold leading-[.78] tracking-[-.085em]">Aerul are textură.</h1>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/60">Stratul e pur decorativ: numărul de particule scalează cu aria sub un cap fix, DPR-ul e limitat, iar offscreen totul stă pe loc. Reduced motion nu randează nimic.</p>
      </div>
    </section>
  );
}

const flapDestinations = ["BUCUREȘTI → TOKYO", "PARIS → OSLO", "LISABONA → KYOTO", "BERLIN → SEUL"];

function SplitFlapDemo() {
  const [destinationIndex, setDestinationIndex] = React.useState(0);
  return (
    <section className="grid min-h-svh place-items-center bg-[#0a0b0d] px-5 py-24 font-mono text-white">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between text-xs uppercase tracking-[.2em] text-white/45"><span>50 / Split-flap board</span><span className="hidden sm:block">glyph wheel · stagger pe coloane</span></div>
        <div className="mt-12 flex flex-col items-start gap-6 rounded-[1.5rem] border border-white/12 bg-[#0d0f11] p-6 sm:p-10">
          <SplitFlapText text="ACUM ÎMBARCARE" className="text-[clamp(1.5rem,4.4vw,3.2rem)] font-semibold text-[#ffcf6b]" stepMs={64} staggerMs={34} />
          <SplitFlapText text={flapDestinations[destinationIndex]!} padTo={18} once={false} className="text-[clamp(1.1rem,3.2vw,2.2rem)] text-white/90" stepMs={58} staggerMs={26} />
          <SplitFlapText text="PORȚILE 01 - 50" className="text-[clamp(.85rem,2.2vw,1.2rem)] text-white/55" stepMs={70} staggerMs={30} />
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="secondary" onClick={() => setDestinationIndex((index) => (index + 1) % flapDestinations.length)}>Următoarea destinație</Button>
          <p className="max-w-sm text-xs leading-relaxed text-white/45 sm:text-right">Schimbarea textului animează de la caracterele curente; stringul complet rămâne numele accesibil.</p>
        </div>
      </div>
    </section>
  );
}

const spatialFoldChapters: SpatialFoldChapter[] = [
  {
    id: "premise",
    label: "Premisa",
    accessibleText: "Premisa: schimbă perspectiva, nu doar suprafața.",
    hinge: "left",
    content: (
      <div className="relative flex min-h-svh flex-col justify-between overflow-hidden bg-[#08090b] px-5 pb-10 pt-24 text-white sm:px-[6vw] sm:pb-[7vh] sm:pt-28">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49.9%,rgba(255,255,255,.1)_50%,transparent_50.1%),linear-gradient(0deg,transparent_49.9%,rgba(255,255,255,.08)_50%,transparent_50.1%)] bg-[size:12.5vw_12.5vw] opacity-35" />
        <div className="relative flex justify-between text-xs uppercase tracking-[.2em] text-white/45"><span>01 / Spatial fold</span><span className="hidden sm:block">live React surfaces · CSS 3D</span></div>
        <div className="relative">
          <p className="max-w-[8ch] text-[clamp(3rem,11vw,11rem)] font-semibold leading-[.74] tracking-[-.09em]">SCHIMBĂ PERSPECTIVA.</p>
          <p className="mt-7 max-w-sm text-sm leading-relaxed text-white/52">Nu trecem la următorul slide. Îndoim chiar suprafața pe care stă povestea.</p>
        </div>
      </div>
    ),
  },
  {
    id: "world",
    label: "Lumea",
    accessibleText: "Lumea: planul se deschide și dezvăluie profunzimea unei scene minerale.",
    hinge: "bottom",
    content: (
      <div className="relative flex min-h-svh flex-col justify-between overflow-hidden bg-black px-5 pb-10 pt-24 text-white sm:px-[6vw] sm:pb-[7vh] sm:pt-28">
        <SceneImage src={ASSETS.worldPoster} alt="Portal de obsidian într-un peisaj mineral" priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/78" />
        <div className="relative flex justify-between text-xs uppercase tracking-[.2em] text-white/62"><span>01 / Din plan</span><span className="hidden sm:block">hinge / bottom</span></div>
        <div className="relative">
          <p className="max-w-[7ch] text-[clamp(4rem,10vw,10rem)] font-semibold leading-[.76] tracking-[-.085em]">ÎNTR-O LUME.</p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/65">Următorul capitol exista deja în spate. Pliul îi dă distanță, lumină și sens.</p>
        </div>
      </div>
    ),
  },
  {
    id: "interface",
    label: "Interfața",
    accessibleText: "Interfața: aceeași mecanică poate plia text, fotografie și orice alt conținut React.",
    hinge: "right",
    content: (
      <div className="grid min-h-svh bg-[#d7ff43] text-black lg:grid-cols-[.88fr_1.12fr]">
        <div className="flex flex-col justify-between px-5 pb-10 pt-24 sm:px-[6vw] sm:pb-[7vh] sm:pt-28">
          <div className="flex justify-between text-xs uppercase tracking-[.2em] opacity-45"><span>02 / Conținut viu</span><span>hinge / right</span></div>
          <div><p className="max-w-[6ch] text-[clamp(4rem,8vw,8rem)] font-semibold leading-[.76] tracking-[-.085em]">ORICE DEVINE SUPRAFAȚĂ.</p><p className="mt-6 max-w-sm text-sm leading-relaxed opacity-60">Text, fotografie, produs sau interfață — fără să le transformăm într-un video.</p></div>
        </div>
        <div className="relative min-h-[58svh] overflow-hidden lg:min-h-svh"><SceneImage src={ASSETS.portrait} alt="Portret editorial cu un produs wearable" className="object-cover object-[68%_center] grayscale" /><div className="absolute inset-0 bg-[#d7ff43]/10 mix-blend-color" /></div>
      </div>
    ),
  },
  {
    id: "release",
    label: "Concluzia",
    accessibleText: "Concluzia: o singură mecanică spațială, urmată de o secțiune calmă și complet lizibilă.",
    content: (
      <div className="flex min-h-svh flex-col justify-between bg-[#ece9e1] px-5 pb-10 pt-24 text-black sm:px-[6vw] sm:pb-[7vh] sm:pt-28">
        <div className="flex justify-between text-xs uppercase tracking-[.2em] opacity-45"><span>03 / Release</span><span className="hidden sm:block">quiet semantic endpoint</span></div>
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_.42fr]"><p className="max-w-[9ch] text-[clamp(4rem,10vw,10rem)] font-semibold leading-[.76] tracking-[-.085em]">PLIUL SE TERMINĂ. IDEEA RĂMÂNE.</p><p className="max-w-sm text-sm leading-relaxed opacity-60 lg:pb-4">Patru compoziții React, zero asset-uri obligatorii și un fallback vertical care păstrează exact aceeași poveste.</p></div>
      </div>
    ),
  },
];

function SpatialFoldDemo() {
  return (
    <SpatialFold
      label="Poveste editorială pliată în spațiu"
      chapters={spatialFoldChapters}
      perspective={1450}
      maxFold={92}
      depth={110}
      scrollScreensPerChapter={1.2}
      className="bg-[#08090b]"
      overlay={(progress) => (
        <div className="pointer-events-none flex h-full flex-col justify-end px-5 pb-5 sm:px-[6vw] sm:pb-7">
          <div className="h-px overflow-hidden bg-white/20 mix-blend-difference"><motion.div className="h-full origin-left bg-white" style={{ scaleX: progress }} /></div>
        </div>
      )}
    />
  );
}

const demos = [
  ["spatial-fold", "01 · Spatial fold", SpatialFoldDemo],
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
  ["shared-element-zoom", "31 · Shared element zoom", SharedElementZoomDemo],
  ["draw-on-scroll", "32 · Draw on scroll", DrawOnScrollDemo],
  ["marquee-velocity", "33 · Velocity marquee", MarqueeVelocityDemo],
  ["variable-font-axis", "34 · Variable font axis", VariableFontAxisDemo],
  ["image-trail", "35 · Image trail", ImageTrailDemo],
  ["route-transition", "36 · Route transition", RouteTransitionDemo],
  ["distortion-carousel", "37 · Distortion carousel", DistortionCarouselDemo],
  ["portal-crossing", "38 · Portal crossing", PortalCrossingDemo],
  ["physics-playground", "39 · Physics playground", PhysicsPlaygroundDemo],
  ["holo-card", "40 · Holo card", HoloCardDemo],
  ["reveal-stagger", "41 · Reveal stagger", RevealStaggerDemo],
  ["count-up", "42 · Count-up stats", CountUpDemo],
  ["hover-preview-list", "43 · Hover preview list", HoverPreviewListDemo],
  ["text-scramble", "44 · Text scramble", TextScrambleDemo],
  ["spotlight-grid", "45 · Spotlight grid", SpotlightGridDemo],
  ["scroll-stack", "46 · Scroll stack", ScrollStackDemo],
  ["knockout-text", "47 · Knockout text", KnockoutTextDemo],
  ["intro-loader", "48 · Intro loader", IntroLoaderDemo],
  ["ambient-particles", "49 · Ambient particles", AmbientParticlesDemo],
  ["split-flap", "50 · Split-flap board", SplitFlapDemo],
  ["focus-transfer-rail", "51 · Focus transfer rail", FocusTransferRailDemo],
] as const;

type DemoId = (typeof demos)[number][0];

const familyLabels = new Map(experienceCatalog.families.map((family) => [family.id, family.label]));
const catalogById = new Map(experienceCatalog.items.map((item) => [item.id, item]));
const labEntries = demos.map(([id, title]) => {
  const item = catalogById.get(id);
  if (!item) throw new Error(`Experience Lab demo ${id} is missing from experience.catalog.json.`);
  return {
    id,
    title,
    family: item.family,
    familyLabel: familyLabels.get(item.family) ?? item.family,
    role: item.recommendedRole,
    stack: item.stack,
    performanceCost: item.performanceCost,
  };
});

export function ExperienceLab() {
  const [selected, setSelected] = React.useState<DemoId>("layered-depth");
  React.useEffect(() => {
    const sync = () => {
      const hashId = window.location.hash.slice(1);
      const id = hashId as DemoId;
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
  const ActiveDemo = demos[activeIndex]?.[2] ?? BasicDepthDemo;
  const activeEntry = demos[activeIndex] ?? demos[0];
  const activeGuide = experienceLabGuides[selected];
  return <main className="min-h-dvh overflow-clip bg-background text-foreground"><ExperienceLabSidebar activeIndex={activeIndex} entries={labEntries} selected={selected} onSelect={(id) => select(id as DemoId)} /><div className="lg:pl-[22rem]"><ActiveDemo />{activeEntry && activeGuide ? <ExperienceLabGuideSection guide={activeGuide} index={activeIndex} title={activeEntry[1]} total={demos.length} /> : null}</div></main>;
}

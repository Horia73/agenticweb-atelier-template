"use client";

import Image from "next/image";
import * as React from "react";
import { motion, type MotionValue, useTransform } from "motion/react";
import {
  ApertureIcon,
  ArrowDownToLineIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  HeadphonesIcon,
  MenuIcon,
  MicIcon,
  NotebookPenIcon,
  PauseIcon,
  PlayIcon,
  ShieldCheckIcon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react";

import { HorizontalStoryRail } from "@/components/experience/horizontal-story-rail";
import { FocusTransferRail } from "@/components/experience/focus-transfer-rail";
import {
  useExperienceViewport,
  usePrefersReducedMotion,
} from "@/components/experience/experience-runtime";
import { useElementScrollProgress } from "@/components/experience/use-element-scroll-progress";
import { site } from "@/content";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const MANIFEST_LINE_TIMINGS = [
  { start: 0.58, end: 0.68, offset: -84 },
  { start: 0.68, end: 0.78, offset: -64 },
  { start: 0.78, end: 0.89, offset: -44 },
] as const;

const BENTO_ICONS = [
  CalendarDaysIcon,
  NotebookPenIcon,
  MicIcon,
  VideoIcon,
] as const;

function DockNavigation() {
  return (
    <nav
      aria-label={site.navigation.ariaLabel}
      className="experience-dock fixed left-1/2 top-4 flex h-12 w-[calc(100%_-_2rem)] max-w-[38rem] -translate-x-1/2 items-center gap-3 rounded-full px-3 text-dock-foreground sm:px-4"
    >
      <a
        href="#produs"
        className="flex shrink-0 items-center gap-2 px-2 font-semibold tracking-[-0.04em]"
      >
        <ApertureIcon aria-hidden className="size-4" />
        <span>{site.name}</span>
      </a>

      <ul
        className="hidden min-w-0 flex-1 items-center justify-center gap-5 md:flex"
        role="list"
      >
        {site.navigation.items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="text-xs font-medium text-dock-muted transition-colors hover:text-dock-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dock-foreground/70"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      <Button
        asChild
        variant="dock"
        size="pill-sm"
        className="ml-auto hidden md:inline-flex"
      >
        <a href="#pret">
          <ArrowDownToLineIcon data-icon="inline-start" />
          {site.navigation.download}
        </a>
      </Button>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="dock-ghost"
            size="icon-sm"
            className="ml-auto md:hidden"
            aria-label={site.navigation.menu}
          >
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>{site.navigation.menuTitle}</SheetTitle>
            <SheetDescription>
              {site.navigation.menuDescription}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-6">
            {site.navigation.items.map((item) => (
              <SheetClose asChild key={item.href}>
                <a
                  href={item.href}
                  className="rounded-lg px-3 py-3 text-lg font-medium tracking-[-0.03em] outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </a>
              </SheetClose>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

function ProductDemoFrame() {
  const [isSessionActive, setIsSessionActive] = React.useState(false);

  return (
    <div className="device-shell relative isolate aspect-[16/10] overflow-hidden rounded-[1.7rem]">
      <Image
        src="/stillroom-valley.png"
        alt={site.demo.imageAlt}
        fill
        loading="eager"
        fetchPriority="high"
        sizes="(max-width: 1024px) calc(100vw - 2rem), 72rem"
        className="object-cover"
      />

      <div className="absolute inset-x-0 top-0 flex h-8 items-center justify-between px-4 text-[0.62rem] font-medium text-screen-foreground/85 sm:px-5">
        <span className="hidden sm:inline">{site.demo.menuLeft}</span>
        <span className="ml-auto">{site.demo.menuRight}</span>
      </div>

      <aside className="absolute bottom-3 left-1/2 flex w-[calc(100%_-_1.5rem)] max-w-[34rem] -translate-x-1/2 items-center gap-4 rounded-[1.15rem] bg-screen-panel/90 px-4 py-3 text-screen-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl sm:bottom-5 sm:px-5">
        <div className="min-w-0 shrink-0">
          <p className="text-[0.5rem] text-screen-muted sm:text-[0.62rem]">
            {site.demo.greeting}
          </p>
          <p className="mt-0.5 flex items-baseline gap-1 tracking-[-0.06em]">
            <span className="text-xl font-semibold sm:text-2xl">
              {site.demo.time}
            </span>
            <span className="text-[0.55rem] text-screen-muted sm:text-xs">
              {site.demo.period}
            </span>
          </p>
        </div>

        <div className="hidden min-w-0 flex-1 border-l border-screen-muted/20 pl-4 sm:block">
          <p className="text-[0.6rem] text-screen-muted">
            {site.demo.nextLabel}
          </p>
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-medium">
            <CalendarDaysIcon
              aria-hidden
              className="size-3 text-screen-accent"
            />
            {site.demo.session}
          </p>
          <p className="mt-0.5 text-[0.58rem] text-screen-muted">
            {site.demo.sessionMeta}
          </p>
          <Button
            variant="screen"
            size="screen"
            className="mt-2"
            aria-pressed={isSessionActive}
            onClick={() => setIsSessionActive((active) => !active)}
          >
            {isSessionActive ? (
              <PauseIcon data-icon="inline-start" />
            ) : (
              <PlayIcon data-icon="inline-start" />
            )}
            {isSessionActive ? site.demo.actionActive : site.demo.action}
          </Button>
        </div>

        <div className="ml-auto flex shrink-0 flex-col items-end gap-1 text-[0.48rem] text-screen-muted sm:text-[0.58rem]">
          <span>{site.demo.battery}</span>
          <span className="flex items-center gap-1.5">
            <HeadphonesIcon aria-hidden className="size-3" />
            {site.demo.sound}
          </span>
        </div>
      </aside>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-screen-vignette"
      />
    </div>
  );
}

function Hero() {
  return (
    <section
      id="produs"
      aria-label="Prezentare Stillroom"
      className="px-4 pb-20 pt-28 sm:px-8 sm:pb-24 sm:pt-36"
    >
      <div className="mx-auto flex max-w-[78rem] flex-col items-center text-center">
        <Badge variant="eyebrow">
          <SparklesIcon data-icon="inline-start" />
          {site.hero.eyebrow}
        </Badge>
        <h1 className="mt-7 flex max-w-[72rem] flex-col items-center text-[clamp(3.2rem,7vw,7rem)] leading-[0.8] tracking-[-0.07em]">
          <span className="font-bold">{site.hero.title}</span>
          <span className="font-editorial font-normal italic tracking-[-0.045em]">
            {site.hero.titleAccent}
          </span>
        </h1>
        <p className="mt-8 max-w-xl text-balance text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          {site.hero.subtitle}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="pill">
            <a href="#pret">
              <ArrowDownToLineIcon data-icon="inline-start" />
              {site.hero.ctaPrimary}
            </a>
          </Button>
          <Button asChild variant="outline" size="pill">
            <a href="#povesti">{site.hero.ctaSecondary}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function DarkBackdrop() {
  return (
    <div className="relative h-full overflow-hidden bg-scene">
      <Image
        src="/stillroom-cosmic-field.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-scene-haze" />
    </div>
  );
}

function ManifestLine({
  end,
  offset,
  progress,
  start,
  tone,
  children,
}: {
  end: number;
  offset: number;
  progress: MotionValue<number>;
  start: number;
  tone: string;
  children: React.ReactNode;
}) {
  const opacity = useTransform(
    progress,
    [start - 0.018, start, end],
    [0, 0.42, 1],
  );
  const grayOpacity = useTransform(progress, [start, end], [1, 0]);
  const finalOpacity = useTransform(progress, [start, end], [0, 1]);
  const x = useTransform(progress, [start, end], [offset, 0]);
  return (
    <motion.span className="relative block" style={{ opacity, x }}>
      <motion.span
        aria-hidden
        className="absolute inset-0 text-scene-muted"
        style={{ opacity: grayOpacity }}
      >
        {children}
      </motion.span>
      <motion.span
        className={cn(
          tone === "accent" && "text-primary",
          tone === "muted" && "text-scene-foreground/80",
        )}
        style={{ opacity: finalOpacity }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

function BlackArrivalCopy({ progress }: { progress: MotionValue<number> }) {
  const eyebrowOpacity = useTransform(progress, [0.54, 0.59], [0, 1]);
  const eyebrowX = useTransform(progress, [0.54, 0.59], [-28, 0]);

  return (
    <div className="relative flex h-full items-center px-6 text-scene-foreground sm:px-10 lg:px-[9vw]">
      <div className="max-w-[76rem]">
        <motion.p
          className="text-xs font-semibold uppercase tracking-[0.2em] text-scene-muted"
          style={{ opacity: eyebrowOpacity, x: eyebrowX }}
        >
          {site.manifest.eyebrow}
        </motion.p>
        <h2 className="mt-7 text-[clamp(3rem,6.4vw,6.8rem)] font-semibold leading-[0.89] tracking-[-0.065em]">
          {site.manifest.lines.map((line, index) => (
            <ManifestLine
              key={line.text}
              progress={progress}
              start={MANIFEST_LINE_TIMINGS[index].start}
              end={MANIFEST_LINE_TIMINGS[index].end}
              offset={MANIFEST_LINE_TIMINGS[index].offset}
              tone={line.tone}
            >
              {line.text}
            </ManifestLine>
          ))}
        </h2>
      </div>
    </div>
  );
}

function ProductToBlackStory() {
  const rootRef = React.useRef<HTMLElement>(null);
  const progress = useElementScrollProgress(rootRef);
  const viewport = useExperienceViewport();
  const prefersReducedMotion = usePrefersReducedMotion();
  const blackClip = useTransform(
    progress,
    [0, 0.08, 0.3, 0.48, 0.52, 1],
    [
      "polygon(0 112%, 24% 110%, 52% 114%, 76% 109%, 100% 112%, 100% 112%, 0 112%)",
      "polygon(0 102%, 24% 99%, 52% 103%, 76% 98%, 100% 101%, 100% 112%, 0 112%)",
      "polygon(0 58%, 24% 54%, 52% 59%, 76% 52%, 100% 56%, 100% 112%, 0 112%)",
      "polygon(0 -5%, 24% -9%, 52% -4%, 76% -11%, 100% -7%, 100% 112%, 0 112%)",
      "polygon(0 -14%, 24% -16%, 52% -13%, 76% -18%, 100% -15%, 100% 112%, 0 112%)",
      "polygon(0 -14%, 24% -16%, 52% -13%, 76% -18%, 100% -15%, 100% 112%, 0 112%)",
    ],
  );
  const edgeY = useTransform(
    progress,
    [0, 0.08, 0.3, 0.48, 0.52, 1],
    ["98svh", "88svh", "45svh", "-10svh", "-24svh", "-24svh"],
  );
  const edgeOpacity = useTransform(
    progress,
    [0, 0.05, 0.48, 0.52],
    [0, 1, 1, 0],
  );
  const useLinearStory = viewport === "mobile" || prefersReducedMotion;

  if (useLinearStory) {
    return (
      <section ref={rootRef} aria-label={site.manifest.label}>
        <div className="bg-background px-4 pb-0 sm:px-8">
          <div className="mx-auto w-full max-w-[72rem]">
            <ProductDemoFrame />
          </div>
        </div>
        <div className="relative overflow-hidden bg-scene px-6 py-24 text-scene-foreground sm:px-10 sm:py-32">
          <div className="absolute inset-0">
            <DarkBackdrop />
          </div>
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-scene-muted">
              {site.manifest.eyebrow}
            </p>
            <h2 className="mt-7 text-4xl font-semibold leading-[0.94] tracking-[-0.055em] sm:text-6xl">
              {site.manifest.lines.map((line) => (
                <span
                  key={line.text}
                  className={cn(
                    "block",
                    line.tone === "accent" && "text-primary",
                    line.tone === "muted" && "text-scene-foreground/80",
                  )}
                >
                  {line.text}
                </span>
              ))}
            </h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      className="product-black-story relative h-[245svh] bg-background"
      aria-label={site.manifest.label}
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-background">
        <div className="absolute inset-0 flex items-center px-4 sm:px-8">
          <div className="mx-auto w-full max-w-[72rem]">
            <ProductDemoFrame />
          </div>
        </div>

        <motion.div
          className="pointer-events-none absolute inset-0 z-10 bg-scene"
          style={{ clipPath: blackClip }}
        >
          <DarkBackdrop />
        </motion.div>
        <motion.div
          aria-hidden
          className="organic-handoff-edge pointer-events-none absolute inset-x-0 top-0 z-20 h-56"
          style={{ opacity: edgeOpacity, y: edgeY }}
        />
        <div className="pointer-events-none absolute inset-0 z-30">
          <BlackArrivalCopy progress={progress} />
        </div>
      </div>
    </section>
  );
}

function LiveActivities() {
  const rootRef = React.useRef<HTMLElement>(null);
  const progress = useElementScrollProgress(rootRef);
  const copyOpacity = useTransform(progress, [0, 0.42, 0.66], [1, 1, 0]);
  const copyY = useTransform(progress, [0, 0.66], [0, -70]);
  const imageLeft = useTransform(progress, [0, 0.58, 1], ["52%", "14%", "0%"]);
  const imageTop = useTransform(progress, [0, 0.58, 1], ["13%", "5%", "0%"]);
  const imageRight = useTransform(progress, [0, 0.58, 1], ["5%", "3%", "0%"]);
  const imageBottom = useTransform(progress, [0, 0.58, 1], ["13%", "5%", "0%"]);
  const imageRadius = useTransform(progress, [0, 0.75, 1], [30, 22, 0]);
  const imageCaptionOpacity = useTransform(
    progress,
    [0.08, 0.35, 0.72],
    [1, 1, 0],
  );

  return (
    <>
      <section className="live-static-stage bg-background px-5 py-28 sm:px-8 sm:py-36">
        <div className="mx-auto max-w-[86rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.19em] text-muted-foreground">
            {site.live.eyebrow}
          </p>
          <h2 className="mt-5 max-w-4xl text-[clamp(3rem,6.2vw,6.8rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
            {site.live.title}
          </h2>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground">
            {site.live.description}
          </p>
          <div className="relative mt-12 aspect-[4/5] overflow-hidden rounded-[2rem] bg-muted sm:aspect-[16/10]">
            <Image
              src={site.live.cards[0].image}
              alt={site.live.cards[0].alt}
              fill
              sizes="(max-width: 1024px) calc(100vw - 2.5rem), 86rem"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-media-shade" />
            <p className="absolute bottom-7 left-7 max-w-sm text-sm leading-6 text-scene-muted">
              {site.live.cards[0].description}
            </p>
          </div>
        </div>
      </section>
      <section
        ref={rootRef}
        className="live-motion-stage relative h-[250svh] bg-background"
        aria-label={site.live.title}
      >
        <div className="sticky top-0 h-svh overflow-hidden">
          <motion.div
            className="absolute left-[6vw] top-1/2 w-[39%] -translate-y-1/2"
            style={{ opacity: copyOpacity, y: copyY }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.19em] text-muted-foreground">
              {site.live.eyebrow}
            </p>
            <h2 className="mt-5 text-[clamp(3rem,5.8vw,6.5rem)] font-semibold leading-[0.88] tracking-[-0.065em]">
              {site.live.title}
            </h2>
            <p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground">
              {site.live.description}
            </p>
          </motion.div>

          <motion.div
            className="absolute overflow-hidden bg-muted"
            style={{
              left: imageLeft,
              top: imageTop,
              right: imageRight,
              bottom: imageBottom,
              borderRadius: imageRadius,
            }}
          >
            <Image
              src={site.live.cards[0].image}
              alt={site.live.cards[0].alt}
              fill
              sizes="(min-width: 1025px) 52vw, calc(100vw - 2.5rem)"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-media-shade" />
            <motion.div
              className="absolute inset-x-8 bottom-8 flex items-end justify-between gap-8 text-scene-foreground"
              style={{ opacity: imageCaptionOpacity }}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-scene-muted">
                  {site.live.cards[0].kicker}
                </p>
                <p className="mt-3 max-w-sm text-sm leading-6 text-scene-muted">
                  {site.live.cards[0].description}
                </p>
              </div>
              <Badge variant="scene">{site.live.status}</Badge>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function AboutStillroom() {
  return (
    <section className="bg-surface-warm px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[72rem]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {site.about.eyebrow}
        </p>
        <h2 className="mt-5 max-w-[58rem] text-[clamp(2.3rem,4vw,4.15rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
          {site.about.title}{" "}
          <span className="font-editorial font-normal italic text-primary">
            {site.about.accent}
          </span>
        </h2>
        <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
          {site.about.body}
        </p>

        <div className="mt-12 grid gap-3 lg:grid-cols-12 lg:auto-rows-[7rem]">
          <article className="flex min-h-[22rem] flex-col rounded-[1.55rem] bg-scene p-6 text-scene-foreground lg:col-span-4 lg:row-span-3 lg:min-h-0">
            <ShieldCheckIcon aria-hidden className="size-7" />
            <div className="mt-auto">
              <h3 className="text-2xl font-semibold tracking-[-0.05em]">
                {site.about.bento.hardwareTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-scene-muted">
                {site.about.bento.hardwareBody}
              </p>
            </div>
          </article>

          <article className="relative min-h-[22rem] overflow-hidden rounded-[1.55rem] bg-muted lg:col-span-4 lg:row-span-3 lg:min-h-0">
            <Image
              src="/stillroom-night-canopy.png"
              alt={site.about.bento.mediaAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 34vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-media-vignette" />
            <Badge
              variant="scene"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              {site.about.bento.mediaLabel}
            </Badge>
          </article>

          <article className="flex min-h-[22rem] flex-col rounded-[1.55rem] bg-background p-6 lg:col-span-4 lg:row-span-3 lg:min-h-0">
            <p className="text-6xl font-semibold tracking-[-0.07em]">
              {site.about.bento.activitiesValue}
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.035em]">
              {site.about.bento.activitiesLabel}
            </h3>
            <dl className="mt-auto flex flex-col gap-3">
              {site.about.bento.activitiesRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 text-sm text-muted-foreground"
                >
                  <dt>{row.label}</dt>
                  <dd className="font-semibold text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
          </article>

          <div className="grid min-h-52 grid-cols-2 gap-3 lg:col-span-3 lg:row-span-2 lg:min-h-0">
            {BENTO_ICONS.map((Icon, index) => (
              <div
                key={site.about.bento.iconLabels[index]}
                role="img"
                className="flex items-center justify-center rounded-[1.25rem] bg-background"
                aria-label={site.about.bento.iconLabels[index]}
              >
                <Icon aria-hidden className="size-5" />
              </div>
            ))}
          </div>

          <article className="flex min-h-52 flex-col rounded-[1.55rem] bg-scene p-6 text-scene-foreground lg:col-span-3 lg:row-span-2 lg:min-h-0">
            <p className="text-5xl font-semibold tracking-[-0.07em]">
              {site.about.bento.accountsValue}
            </p>
            <h3 className="mt-2 text-base font-semibold leading-5">
              {site.about.bento.accountsLabel}
            </h3>
            <p className="mt-auto text-sm leading-6 text-scene-muted">
              {site.about.bento.accountsBody}
            </p>
          </article>

          <article className="flex min-h-52 flex-col rounded-[1.55rem] bg-background p-6 lg:col-span-3 lg:row-span-2 lg:min-h-0">
            <p className="text-5xl font-semibold tracking-[-0.07em]">
              {site.about.bento.clipsValue}
            </p>
            <h3 className="mt-2 text-base font-semibold leading-5">
              {site.about.bento.clipsLabel}
            </h3>
            <p className="mt-auto text-sm leading-6 text-muted-foreground">
              {site.about.bento.clipsBody}
            </p>
          </article>

          <article className="flex min-h-52 flex-col rounded-[1.55rem] bg-primary p-6 text-primary-foreground lg:col-span-3 lg:row-span-2 lg:min-h-0">
            <p className="text-5xl font-semibold tracking-[-0.07em]">
              {site.about.bento.purchaseValue}
            </p>
            <h3 className="mt-2 text-base font-semibold leading-5">
              {site.about.bento.purchaseLabel}
            </h3>
            <p className="mt-auto text-sm leading-6 text-primary-foreground/75">
              {site.about.bento.purchaseBody}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function StoryCard({ story }: { story: (typeof site.stories.items)[number] }) {
  return (
    <article className="grid h-[74svh] min-h-[38rem] overflow-hidden rounded-[2rem] bg-scene-raised text-scene-foreground lg:grid-cols-[0.8fr_1.2fr]">
      <div className="flex flex-col p-7 sm:p-10 lg:p-12">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-scene-muted">
          <span>{story.number}</span>
          <span>{story.title}</span>
        </div>
        <h3 className="mt-auto max-w-xl text-[clamp(2.8rem,5vw,5.8rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
          {story.statement}
        </h3>
        <p className="mt-6 max-w-md text-sm leading-6 text-scene-muted sm:text-base sm:leading-7">
          {story.description}
        </p>
      </div>
      <div className="relative min-h-64 overflow-hidden lg:min-h-full">
        <Image
          src={story.image}
          alt={story.alt}
          fill
          sizes="(max-width: 1024px) 86vw, 48vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-media-vignette" />
      </div>
    </article>
  );
}

function Stories() {
  return (
    <section
      id="povesti"
      className="bg-scene pb-24 pt-28 text-scene-foreground sm:pb-36 sm:pt-36"
    >
      <div className="mx-auto flex max-w-[86rem] items-end justify-between gap-8 px-5 sm:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.19em] text-scene-muted">
            {site.stories.eyebrow}
          </p>
          <h2 className="mt-5 max-w-4xl text-[clamp(3rem,6vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
            {site.stories.title}
          </h2>
        </div>
        <ArrowRightIcon
          aria-hidden
          className="hidden size-8 text-scene-muted lg:block"
        />
      </div>

      <HorizontalStoryRail
        label="Modurile Stillroom"
        className="mt-16"
        stageClassName="bg-scene"
        itemClassName="lg:w-[74vw]"
        progressClassName="text-scene-muted"
        renderCounter={(current, total) =>
          `${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`
        }
      >
        {site.stories.items.map((story) => (
          <StoryCard key={story.number} story={story} />
        ))}
      </HorizontalStoryRail>
    </section>
  );
}

function Atmospheres() {
  return (
    <FocusTransferRail
      label={site.skins.title}
      items={site.skins.items.map((skin) => ({
        id: skin.title.toLowerCase(),
        label: skin.title,
        content: (
          <>
            <Image
              src={skin.image}
              alt={skin.alt}
              fill
              sizes="(max-width: 1024px) calc(100vw - 2.5rem), 70vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-media-shade" />
            <div className="absolute inset-x-0 bottom-0 p-6 lg:p-7">
              <h3 className="text-3xl font-semibold tracking-[-0.055em] lg:text-4xl">
                {skin.title}
              </h3>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-scene-muted">
                {skin.meta}
              </p>
            </div>
          </>
        ),
      }))}
      activeRatio={2.35}
      idleRatio={1}
      scrollScreensPerStep={0.9}
      className="bg-scene text-scene-foreground"
      staticClassName="px-5 pb-24 sm:px-8 sm:pb-32"
      stageClassName="px-8 pb-8 pt-24"
      header={
        <div className="mx-auto w-full max-w-[86rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.19em] text-scene-muted">
            {site.skins.eyebrow}
          </p>
          <h2 className="mt-5 max-w-3xl text-[clamp(2.8rem,5vw,5.5rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
            {site.skins.title}
          </h2>
        </div>
      }
      trackClassName="mx-auto mt-10 w-full max-w-[86rem] flex-1 gap-3"
      staticTrackClassName="mx-auto mt-12 max-w-[82rem] gap-3 sm:grid-cols-[1.4fr_1fr_1fr]"
      itemClassName="rounded-[1.65rem] bg-scene-raised"
      staticItemClassName="min-h-[24rem] rounded-[1.5rem]"
    />
  );
}

function Process() {
  return (
    <section
      id="proces"
      className="bg-background px-5 pb-28 pt-28 sm:px-8 sm:pb-40 sm:pt-36"
    >
      <div className="mx-auto grid max-w-[86rem] gap-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.19em] text-muted-foreground">
            {site.ritual.eyebrow}
          </p>
          <h2 className="mt-5 max-w-3xl text-[clamp(3rem,6vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
            {site.ritual.title}
          </h2>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground">
            {site.ritual.description}
          </p>
        </div>

        <ol className="flex flex-col gap-0">
          {site.ritual.items.map((item) => (
            <li
              key={item.number}
              className="grid min-h-64 grid-cols-[3rem_1fr] gap-5 border-b border-border py-10 sm:grid-cols-[5rem_1fr] sm:py-14"
            >
              <span className="text-sm font-semibold text-muted-foreground">
                {item.number}
              </span>
              <div>
                <h3 className="text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
                  {item.title}
                </h3>
                <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function QuestionsAndPrice() {
  return (
    <section
      id="intrebari"
      className="bg-surface-warm px-5 pb-24 pt-28 sm:px-8 sm:pb-28 sm:pt-36"
    >
      <div className="mx-auto grid max-w-[86rem] gap-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.19em] text-muted-foreground">
            {site.faq.eyebrow}
          </p>
          <h2 className="mt-5 max-w-2xl text-[clamp(3rem,5.4vw,5.8rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
            {site.faq.title}
          </h2>
        </div>
        <Accordion type="single" collapsible defaultValue="faq-0">
          {site.faq.items.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger>
                <span className="pr-6 text-xl font-semibold tracking-[-0.035em] sm:text-2xl">
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <p className="max-w-xl text-base leading-7 text-muted-foreground">
                  {item.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div
        id="pret"
        className="mx-auto mt-20 flex max-w-[86rem] justify-center"
      >
        <article className="flex min-h-[36rem] w-full max-w-[29rem] flex-col items-center rounded-[1.75rem] bg-background p-7 text-center sm:min-h-[40rem] sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.19em] text-muted-foreground">
            {site.pricing.eyebrow}
          </p>
          <h3 className="mt-5 text-[clamp(2.7rem,4.2vw,4.25rem)] font-semibold leading-[0.92] tracking-[-0.06em]">
            {site.pricing.title}
          </h3>
          <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            {site.pricing.note}
          </p>
          <div className="mt-auto flex flex-col items-center gap-5">
            <p className="text-5xl font-semibold tracking-[-0.06em] sm:text-6xl">
              {site.pricing.price}
            </p>
            <Button size="pill">
              {site.pricing.action}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}

function CinematicClosing() {
  return (
    <section className="-mt-16 bg-surface-warm sm:-mt-24">
      <div className="closing-immersion relative flex min-h-[96svh] overflow-hidden">
        <Image
          src="/stillroom-sunrise-ridge.png"
          alt={site.closing.imageAlt}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-closing-shade" />
        <div className="relative m-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center text-scene-foreground">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-scene-muted">
            {site.closing.eyebrow}
          </p>
          <h2 className="mt-6 text-[clamp(3.6rem,8vw,8.5rem)] font-semibold leading-[0.84] tracking-[-0.07em]">
            {site.closing.title}
          </h2>
          <p className="mt-7 max-w-xl text-sm leading-6 text-scene-muted sm:text-base sm:leading-7">
            {site.closing.description}
          </p>
          <Button asChild variant="dock" size="pill" className="mt-8">
            <a href="#produs">{site.closing.action}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative -mt-[32svh] text-scene-foreground">
      <div className="footer-star-transition relative min-h-[78svh] overflow-hidden bg-scene">
        <Image
          src="/stillroom-cosmic-field.png"
          alt={site.footer.imageAlt}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-footer-shade" />
        <div className="absolute inset-0 bg-footer-star-shade" />
        <div className="relative mx-auto flex min-h-[78svh] max-w-[86rem] items-end px-5 pb-14 sm:px-8 sm:pb-20">
          <p className="max-w-sm text-sm leading-6 text-scene-muted">
            {site.footer.note}
          </p>
        </div>
      </div>

      <div className="bg-scene px-5 pb-6 sm:px-8">
        <div className="mx-auto max-w-[86rem]">
          <div className="flex flex-col gap-8 py-10 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-sm text-scene-muted">{site.footer.copyright}</p>
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm" role="list">
              {site.footer.links.map((link) => (
                <li key={link}>
                  <a
                    href="#produs"
                    className="text-scene-muted transition-colors hover:text-scene-foreground"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p
            aria-label={site.footer.wordmark}
            className="footer-wordmark select-none overflow-hidden text-center text-[clamp(5rem,17vw,16rem)] font-semibold leading-[0.72] tracking-[-0.085em] text-footer-wordmark"
          >
            {site.footer.wordmark}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function StillroomLanding() {
  return (
    <main className="overflow-clip bg-background text-foreground">
      <DockNavigation />
      <Hero />
      <ProductToBlackStory />
      <LiveActivities />
      <AboutStillroom />
      <Stories />
      <Atmospheres />
      <Process />
      <QuestionsAndPrice />
      <CinematicClosing />
      <Footer />
    </main>
  );
}

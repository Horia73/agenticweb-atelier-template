import { ArrowDown, ArrowRight, CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import { BookingForm } from "@/components/booking-form";
import { Button } from "@/components/ui/button";
import { site } from "@/content";

const sectionClass = "mx-auto max-w-[75rem] px-4 py-16 sm:px-8 lg:px-12 lg:py-28";

function Placeholder({ label, ratio, className = "" }: { label: string; ratio: string; className?: string }) {
  return (
    <div role="img" aria-label={`${label}, placeholder ${ratio}`} className={`placeholder-grid relative flex min-h-64 items-end overflow-hidden border border-border-strong/40 bg-muted p-5 ${className}`}>
      <div className="relative z-10 bg-background/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em]">
        {site.placeholders.prefix} · {label} · {ratio}
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-primary">{children}</p>;
}

export default function Home() {
  return (
    <div className="min-h-dvh overflow-hidden">
      <a href="#continut" className="sr-only z-50 bg-background p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">{site.accessibility.skipToContent}</a>
      <div className="bg-foreground px-4 py-2 text-center text-xs font-semibold text-background" role="note">{site.previewNotice}</div>
      <Header />
      <main id="continut"><Hero /><Workshop /><Process /><SmallGroup /><Objects /><About /><Faq /><Booking /></main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-16 max-w-[75rem] items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
        <a href="#" className="font-heading text-xl font-semibold tracking-tight">{site.name}<span className="sr-only"> — {site.accessibility.backToTop}</span></a>
        <nav aria-label={site.accessibility.mainNavigation} className="hidden items-center gap-7 text-sm font-semibold lg:flex">
          {site.navigation.map((item) => <a key={item.href} href={item.href} className="link-underline py-3">{item.label}</a>)}
        </nav>
        <Button asChild className="min-h-11"><a href="#rezervare">{site.hero.primaryAction}</a></Button>
      </div>
    </header>
  );
}

function Hero() {
  const icons = [Clock3, MapPin, Users];
  return (
    <section className="border-b">
      <div className={`${sectionClass} grid items-center gap-12 lg:grid-cols-12`}>
        <div className="lg:col-span-6">
          <Eyebrow>{site.hero.eyebrow}</Eyebrow>
          <h1 className="max-w-[11ch] font-heading text-5xl leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl">{site.hero.title}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{site.hero.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-h-12 px-5"><a href="#rezervare">{site.hero.primaryAction}<ArrowRight aria-hidden /></a></Button>
            <Button asChild size="lg" variant="outline" className="min-h-12 px-5"><a href="#ateliere">{site.hero.secondaryAction}<ArrowDown aria-hidden /></a></Button>
          </div>
          <ul className="mt-10 grid gap-3 border-t pt-5 sm:grid-cols-3">
            {site.hero.facts.map((fact, index) => { const Icon = icons[index]; return <li key={fact} className="flex items-center gap-2 text-sm font-semibold"><Icon aria-hidden className="size-4 text-primary" />{fact}</li>; })}
          </ul>
        </div>
        <div className="lg:col-span-6"><Placeholder {...site.placeholders.hero} className="aspect-[16/10] rounded-image lg:translate-y-8" /></div>
      </div>
    </section>
  );
}

function Workshop() {
  return (
    <section id="ateliere" className={sectionClass}>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5"><Eyebrow>{site.workshop.eyebrow}</Eyebrow><h2 className="font-heading text-4xl leading-tight sm:text-5xl">{site.workshop.title}</h2><p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">{site.workshop.intro}</p></div>
        <div className="border-t border-border-strong lg:col-span-7">
          <div className="grid grid-cols-2">
            {site.workshop.details.map((item) => <div key={item.label} className="border-b border-r p-4 sm:p-6"><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{item.label}</dt><dd className="mt-2 font-heading text-xl sm:text-2xl">{item.value}</dd></div>)}
          </div>
          <div className="mt-6 grid gap-6 bg-muted p-6 sm:grid-cols-2 sm:p-8">
            <div><h3 className="font-heading text-xl">{site.workshop.includesTitle}</h3><ul className="mt-4 space-y-2 text-sm">{site.workshop.includes.map((item) => <li key={item}>— {item}</li>)}</ul></div>
            <div><h3 className="font-heading text-xl">{site.workshop.scheduleTitle}</h3><ul className="mt-4 space-y-2 text-sm">{site.workshop.schedule.map((item) => <li key={item} className="flex gap-2"><CalendarDays aria-hidden className="size-4 text-secondary" />{item}</li>)}</ul></div>
            <p className="border-t border-secondary/40 pt-4 text-xs font-semibold uppercase tracking-[0.08em] sm:col-span-2">{site.workshop.e2eLabel}</p>
          </div>
          <Button asChild size="lg" className="mt-6 min-h-12"><a href="#rezervare">{site.hero.primaryAction}<ArrowRight aria-hidden /></a></Button>
        </div>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section className="bg-card"><div className={`${sectionClass} grid gap-12 lg:grid-cols-12`}>
      <div className="lg:col-span-5"><Placeholder {...site.placeholders.process} className="aspect-[4/5] rounded-t-[4rem]" /></div>
      <div className="lg:col-span-7 lg:pl-10"><Eyebrow>{site.process.eyebrow}</Eyebrow><h2 className="max-w-xl font-heading text-4xl leading-tight sm:text-5xl">{site.process.title}</h2><p className="mt-4 max-w-xl text-muted-foreground">{site.process.intro}</p>
        <ol className="mt-10 border-t border-border-strong">{site.process.steps.map((step) => <li key={step.number} className="grid grid-cols-[3rem_1fr] gap-3 border-b py-6 sm:grid-cols-[4rem_10rem_1fr]"><span className="text-sm font-semibold text-primary">{step.number}</span><h3 className="font-heading text-xl">{step.title}</h3><p className="col-start-2 text-sm leading-relaxed text-muted-foreground sm:col-start-3">{step.text}</p></li>)}</ol>
      </div>
    </div></section>
  );
}

function SmallGroup() { return <section className="bg-muted"><div className={`${sectionClass} grid items-center gap-6 sm:grid-cols-[1fr_2fr]`}><p className="font-heading text-[8rem] leading-none text-secondary sm:text-[11rem]">{site.smallGroup.number}</p><div><h2 className="font-heading text-4xl sm:text-5xl">{site.smallGroup.title}</h2><p className="mt-4 max-w-xl text-lg leading-relaxed">{site.smallGroup.text}</p></div></div></section>; }

function Objects() {
  return <section id="obiecte" className={sectionClass}><div className="grid gap-8 lg:grid-cols-2"><div><Eyebrow>{site.objects.eyebrow}</Eyebrow><h2 className="max-w-lg font-heading text-4xl sm:text-5xl">{site.objects.title}</h2></div><p className="max-w-xl self-end leading-relaxed text-muted-foreground">{site.objects.text}</p></div><div className="mt-10 grid gap-4 sm:grid-cols-3">{site.placeholders.objects.map((item, index) => <Placeholder key={item.label} {...item} className={`aspect-[4/5] ${index === 1 ? "sm:translate-y-8" : ""}`} />)}</div></section>;
}

function About() { return <section id="despre" className="border-y"><div className={`${sectionClass} grid gap-10 lg:grid-cols-12`}><div className="lg:col-span-4"><Eyebrow>{site.about.eyebrow}</Eyebrow><h2 className="font-heading text-4xl sm:text-5xl">{site.about.title}</h2></div><div className="lg:col-span-7 lg:col-start-6"><p className="text-xl leading-relaxed">{site.about.body}</p><p className="mt-8 border-l-2 border-primary pl-4 text-sm font-semibold">{site.about.testInstructor}</p></div></div></section>; }

function Faq() { return <section id="intrebari" className={sectionClass}><Eyebrow>{site.faq.eyebrow}</Eyebrow><div className="grid gap-10 lg:grid-cols-12"><h2 className="font-heading text-4xl sm:text-5xl lg:col-span-4">{site.faq.title}</h2><div className="divide-y border-y border-border-strong lg:col-span-7 lg:col-start-6">{site.faq.items.map((item, index) => <details key={item.question} className="group py-5" open={index === 0}><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold">{item.question}<span aria-hidden className="text-2xl font-normal group-open:rotate-45">+</span></summary><p className="max-w-xl pb-2 pr-10 leading-relaxed text-muted-foreground">{item.answer}</p></details>)}</div></div></section>; }

function Booking() { return <section id="rezervare" className="bg-muted"><div className={`${sectionClass} grid gap-12 lg:grid-cols-12`}><div className="lg:col-span-5"><Eyebrow>{site.booking.eyebrow}</Eyebrow><h2 className="font-heading text-4xl sm:text-5xl">{site.booking.title}</h2><p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">{site.booking.text}</p><p className="mt-6 inline-block border border-secondary px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em]">{site.workshop.e2eLabel}</p></div><div className="bg-background p-5 sm:p-8 lg:col-span-7"><BookingForm /></div></div></section>; }

function Footer() { return <footer className="bg-foreground text-background"><div className="mx-auto grid max-w-[75rem] gap-8 px-4 py-12 sm:px-8 lg:grid-cols-2 lg:px-12"><div><p className="font-heading text-2xl font-semibold">{site.name}</p><p className="mt-2 text-sm text-background/70">{site.footer.note}</p></div><p className="max-w-lg text-sm leading-relaxed text-background/70 lg:justify-self-end">{site.footer.contact}</p></div></footer>; }

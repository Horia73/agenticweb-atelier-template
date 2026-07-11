import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { site } from "@/content";

/* Landing-ul implicit — o pagină reală, gata de reculorat și rescris din brief.
   Secțiuni clare (Hero, Servicii, Despre, Contact), construite pe tokenii temei
   (bg-background, text-foreground, bg-primary…) și pe componentele din
   src/components/ui. Agentul adaugă/înlocuiește secțiuni și rescrie
   `content.ts`; structura de aici e doar un punct de plecare bun. */

export default function Home() {
  return (
    <div className="min-h-dvh">
      <Header />
      <Hero />
      <Services />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="text-lg font-semibold tracking-tight">
          {site.name}
        </a>
        <nav className="hidden gap-8 text-sm text-muted-foreground sm:flex">
          <a href="#servicii" className="transition-colors hover:text-foreground">
            Servicii
          </a>
          <a href="#despre" className="transition-colors hover:text-foreground">
            Despre
          </a>
          <a href="#contact" className="transition-colors hover:text-foreground">
            Contact
          </a>
        </nav>
        <Button asChild size="sm" className="rounded-full">
          <a href="#contact">{site.hero.ctaPrimary}</a>
        </Button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-muted/40">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          {site.hero.eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          {site.hero.title}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {site.hero.subtitle}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full">
            <a href="#contact">{site.hero.ctaPrimary}</a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <a href="#servicii">{site.hero.ctaSecondary}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="servicii" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-3xl font-semibold tracking-tight">Ce oferim</h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {site.services.map((s) => (
          <Card key={s.title} className="transition-shadow hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <span className="size-2.5 rounded-full bg-primary" />
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="despre" className="bg-muted/40">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          {site.about.title}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          {site.about.body}
        </p>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-6 py-24">
      <div className="rounded-3xl bg-foreground px-8 py-14 text-background sm:px-14">
        <h2 className="text-3xl font-semibold tracking-tight">Hai să vorbim</h2>
        <p className="mt-3 max-w-md text-background/70">
          Suntem aici pentru orice întrebare. Sună, scrie sau treci pe la noi.
        </p>
        <dl className="mt-10 grid gap-6 sm:grid-cols-2">
          <ContactItem label="Telefon" value={site.phone} href={`tel:${site.phone}`} />
          <ContactItem label="Email" value={site.email} href={`mailto:${site.email}`} />
          <ContactItem label="Adresă" value={site.address} />
          <ContactItem label="Program" value={site.hours} />
        </dl>
      </div>
    </section>
  );
}

function ContactItem({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div>
      <dt className="text-sm uppercase tracking-widest text-background/50">
        {label}
      </dt>
      <dd className="mt-1 text-lg">
        {href ? (
          <a href={href} className="transition-colors hover:text-primary">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span>Site realizat cu AgenticWeb</span>
      </div>
    </footer>
  );
}

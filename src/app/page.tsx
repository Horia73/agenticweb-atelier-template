import { site } from "@/content";

/* Landing-ul implicit — o pagină reală, gata de reculorat și rescris din brief.
   Sistem simplu: secțiuni clare (Hero, Servicii, Despre, Contact), tematizate
   prin variabilele din globals.css. Agentul adaugă/înlocuiește secțiuni și
   rescrie `content.ts`; structura de mai jos e doar un punct de plecare bun. */

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
    <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="text-lg font-semibold tracking-tight">
          {site.name}
        </a>
        <nav className="hidden gap-8 text-sm text-muted sm:flex">
          <a href="#servicii" className="transition-colors hover:text-ink">
            Servicii
          </a>
          <a href="#despre" className="transition-colors hover:text-ink">
            Despre
          </a>
          <a href="#contact" className="transition-colors hover:text-ink">
            Contact
          </a>
        </nav>
        <a
          href="#contact"
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition-transform hover:scale-[1.03]"
        >
          {site.hero.ctaPrimary}
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand/10 blur-3xl"
      />
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">
          {site.hero.eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          {site.hero.title}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          {site.hero.subtitle}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href="#contact"
            className="rounded-full bg-brand px-6 py-3 font-medium text-brand-ink transition-transform hover:scale-[1.03]"
          >
            {site.hero.ctaPrimary}
          </a>
          <a
            href="#servicii"
            className="rounded-full border border-line bg-bg px-6 py-3 font-medium transition-colors hover:border-ink/30"
          >
            {site.hero.ctaSecondary}
          </a>
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
          <div
            key={s.title}
            className="rounded-2xl border border-line bg-surface p-7 transition-shadow hover:shadow-lg"
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <span className="size-2.5 rounded-full bg-brand" />
            </div>
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 leading-relaxed text-muted">{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="despre" className="bg-surface">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          {site.about.title}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          {site.about.body}
        </p>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-6 py-24">
      <div className="rounded-3xl bg-ink px-8 py-14 text-bg sm:px-14">
        <h2 className="text-3xl font-semibold tracking-tight">Hai să vorbim</h2>
        <p className="mt-3 max-w-md text-bg/70">
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
      <dt className="text-sm uppercase tracking-widest text-bg/50">{label}</dt>
      <dd className="mt-1 text-lg">
        {href ? (
          <a href={href} className="transition-colors hover:text-brand">
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
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted sm:flex-row">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span>Site realizat cu AgenticWeb</span>
      </div>
    </footer>
  );
}

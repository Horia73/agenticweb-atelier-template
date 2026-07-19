"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, PanelRightOpen, Search, X } from "lucide-react";

import type { ExperienceLabGuide } from "@/app/experience-lab/experience-lab-guides";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/components/experience/experience-runtime";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export type ExperienceLabEntry = {
  id: string;
  title: string;
  family: string;
  familyLabel: string;
  role: string;
  stack: string;
  performanceCost: string;
};

export function ExperienceLabSidebar({ activeIndex, entries, onSelect, selected }: { activeIndex: number; entries: ReadonlyArray<ExperienceLabEntry>; onSelect: (id: string) => void; selected: string }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [family, setFamily] = React.useState("all");
  const [role, setRole] = React.useState("all");
  const desktop = useMediaQuery("(min-width: 1024px)");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const activeButtonRef = React.useRef<HTMLButtonElement>(null);
  const active = entries[activeIndex] ?? entries[0]!;
  const families = React.useMemo(() => Array.from(new Map(entries.map((entry) => [entry.family, entry.familyLabel])).entries()), [entries]);
  const roles = React.useMemo(() => Array.from(new Set(entries.map((entry) => entry.role))), [entries]);
  const filteredEntries = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ro");
    return entries.filter((entry) => (
      (family === "all" || entry.family === family)
      && (role === "all" || entry.role === role)
      && (!normalizedQuery || `${entry.title} ${entry.familyLabel} ${entry.stack}`.toLocaleLowerCase("ro").includes(normalizedQuery))
    ));
  }, [entries, family, query, role]);
  const groupedEntries = React.useMemo(() => families.map(([id, label]) => ({ id, label, entries: filteredEntries.filter((entry) => entry.family === id) })).filter((group) => group.entries.length > 0), [families, filteredEntries]);
  React.useEffect(() => { activeButtonRef.current?.scrollIntoView({ block: "nearest" }); }, [selected]);
  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const select = (id: string) => { onSelect(id); close(); };
  const move = (delta: number) => select(entries[(activeIndex + delta + entries.length) % entries.length]!.id);
  return (
    <>
      <Button ref={triggerRef} type="button" variant="outline" size="icon" aria-label="Deschide biblioteca" aria-expanded={open} className="fixed left-3 top-3 z-[70] rounded-xl border-white/15 bg-black/68 text-white shadow-xl backdrop-blur-xl hover:bg-black/85 hover:text-white lg:hidden" onClick={() => setOpen(true)}>
        <PanelRightOpen className="size-4" />
      </Button>
      {open ? <Button type="button" variant="ghost" aria-label="Închide biblioteca" className="fixed inset-0 z-[55] h-auto w-auto rounded-none bg-black/45 p-0 backdrop-blur-sm hover:bg-black/45 lg:hidden" onClick={close}><span className="sr-only">Închide</span></Button> : null}
      <aside aria-label="Experience library" aria-hidden={!desktop && !open} inert={!desktop && !open} className={cn("fixed inset-y-0 left-0 z-[60] flex w-[min(22rem,100vw)] flex-col overflow-hidden border-r border-white/10 bg-[#0b0d10] text-white shadow-[18px_0_60px_rgba(0,0,0,.14)] transition-transform duration-300", open ? "visible translate-x-0" : "invisible -translate-x-full lg:visible lg:translate-x-0")}>
        <header className="border-b border-white/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[.62rem] font-semibold uppercase tracking-[.22em] text-white/42">Current mechanism</p><h2 className="mt-2 text-2xl font-semibold leading-[.95] tracking-[-.05em]">{active.title}</h2><p className="mt-3 font-mono text-[.65rem] text-white/35">{String(activeIndex + 1).padStart(2, "0")} / {entries.length} · {active.familyLabel}</p></div>
            <Button type="button" variant="ghost" size="icon" aria-label="Închide biblioteca" className="-mr-2 -mt-2 rounded-xl text-white/65 hover:bg-white/10 hover:text-white lg:hidden" onClick={close}><X className="size-4" /></Button>
          </div>
          <div className="mt-4 flex gap-2"><Button type="button" variant="outline" size="sm" className="flex-1 border-white/12 bg-white/[.04] text-white hover:bg-white/10 hover:text-white" onClick={() => move(-1)}><ChevronLeft className="size-4" /> Prev</Button><Button type="button" variant="outline" size="sm" className="flex-1 border-white/12 bg-white/[.04] text-white hover:bg-white/10 hover:text-white" onClick={() => move(1)}>Next <ChevronRight className="size-4" /></Button></div>
          <div className="mt-4 grid gap-2">
            <label className="relative block">
              <span className="sr-only">Caută mecanisme</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/35" />
              <Input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder={`Caută în cele ${entries.length}…`} className="border-white/12 bg-white/[.04] pl-9 text-xs text-white placeholder:text-white/28" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <NativeSelect aria-label="Filtrează după familie" value={family} onChange={(event) => setFamily(event.currentTarget.value)} className="border-white/12 bg-white/[.04] text-xs text-white">
                <NativeSelectOption value="all">Toate familiile</NativeSelectOption>
                {families.map(([id, label]) => <NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}
              </NativeSelect>
              <NativeSelect aria-label="Filtrează după rol" value={role} onChange={(event) => setRole(event.currentTarget.value)} className="border-white/12 bg-white/[.04] text-xs text-white">
                <NativeSelectOption value="all">Toate rolurile</NativeSelectOption>
                {roles.map((entryRole) => <NativeSelectOption key={entryRole} value={entryRole}>{entryRole}</NativeSelectOption>)}
              </NativeSelect>
            </div>
          </div>
        </header>
        <nav className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-color:rgba(255,255,255,.18)_transparent]" aria-label="Direcții disponibile">
          {groupedEntries.map((group) => <section key={group.id} aria-labelledby={`family-${group.id}`} className="mb-3"><div className="sticky top-0 z-10 flex items-center justify-between bg-[#0b0d10]/95 px-3 pb-1.5 pt-2 backdrop-blur"><h3 id={`family-${group.id}`} className="text-[.58rem] font-semibold uppercase tracking-[.18em] text-white/35">{group.label}</h3><span className="font-mono text-[.55rem] text-white/25">{group.entries.length}</span></div>{group.entries.map((entry) => { const index = entries.findIndex((candidate) => candidate.id === entry.id); return <Button ref={selected === entry.id ? activeButtonRef : undefined} key={entry.id} type="button" variant="ghost" className={cn("mb-1 h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-white/58 hover:bg-white/[.07] hover:text-white", selected === entry.id && "bg-white/[.11] text-white")} aria-current={selected === entry.id ? "page" : undefined} onClick={() => select(entry.id)}><span className="w-6 shrink-0 font-mono text-[.62rem] text-white/32">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 whitespace-normal text-xs leading-tight">{entry.title}</span><span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[.5rem] uppercase tracking-[.08em] text-white/28">{entry.stack}</span></Button>; })}</section>)}
          {filteredEntries.length === 0 ? <p className="px-3 py-10 text-center text-xs leading-relaxed text-white/38">Niciun mecanism pentru filtrele curente.</p> : null}
        </nav>
        <footer className="border-t border-white/10 px-5 py-4 text-[.62rem] uppercase leading-relaxed tracking-[.16em] text-white/32">{entries.length} mecanisme verificate. Alege ideea înaintea efectului.</footer>
      </aside>
    </>
  );
}

export function ExperienceLabGuideSection({ guide, index, title, total }: { guide: ExperienceLabGuide; index: number; title: string; total: number }) {
  const cards = [["Purpose", guide.purpose], ["How it works", guide.mechanics], ["AI must customize", guide.customize], ["Fallback / gate", guide.fallback]] as const;
  return <section aria-label={`AI handoff pentru ${title}`} className="relative min-h-svh bg-[#ece8df] px-5 py-24 text-[#101112] sm:px-[6vw] sm:py-28"><div className="mx-auto max-w-6xl"><p className="text-xs font-semibold uppercase tracking-[.22em] opacity-42">AI handoff · {String(index + 1).padStart(2, "0")} / {total}</p><h2 className="mt-5 max-w-[12ch] text-[clamp(3.2rem,7vw,7rem)] font-semibold leading-[.8] tracking-[-.075em]">{title}</h2><div className="mt-12 grid gap-3 sm:grid-cols-2">{cards.map(([heading, body]) => <article key={heading} className="rounded-[1.5rem] border border-black/10 bg-white/48 p-6"><h3 className="text-[.65rem] font-semibold uppercase tracking-[.2em] opacity-42">{heading}</h3><p className="mt-4 text-base leading-relaxed opacity-72">{body}</p></article>)}</div><div className="mt-3 rounded-[1.5rem] bg-[#111315] p-6 text-white"><p className="text-[.65rem] font-semibold uppercase tracking-[.2em] text-white/38">Source contract</p><div className="mt-4 grid gap-2 font-mono text-xs leading-relaxed sm:grid-cols-2"><code className="rounded-lg bg-white/[.05] p-3">{guide.source}</code><code className="rounded-lg bg-white/[.05] p-3">{guide.docs}</code></div><p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/50">Fixture-ul din Lab demonstrează doar mecanica. Agentul citește mini-tutorialul, justifică efectul prin brief și înlocuiește integral copy-ul, asset-urile, crop-ul, paleta și timing-ul.</p></div></div></section>;
}

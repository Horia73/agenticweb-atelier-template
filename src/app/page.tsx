import { redirect } from "next/navigation";

export default function StudioSeedPage() {
  if (process.env.EXPERIENCE_LAB === "1") {
    redirect("/experience-lab?demo=cinematic-forest-3d");
  }

  return (
    <main data-studio-seed className="grid min-h-dvh place-items-center bg-background px-6 text-foreground">
      <div className="max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          AgenticWeb Studio · seed
        </p>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Nicio direcție vizuală implicită.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          Agentul înlocuiește această pagină după alegerea uneia dintre cele două direcții de design.
          Componentele de experiență sunt primitive reutilizabile, nu un site-template.
        </p>
        <code className="mt-8 inline-flex rounded-full border bg-muted/50 px-5 py-2.5 text-sm">
          npm run dev:experience
        </code>
      </div>
    </main>
  );
}

# AgenticWeb — template de site de client

Punct de plecare tehnic pentru site-urile construite în Studio: Next.js 16
(App Router) + Tailwind v4, fără landing page sau direcție vizuală implicită.
Ruta `/` este un seed neutru pe care agentul trebuie să îl înlocuiască după
alegerea uneia dintre cele două direcții de design. Include componenta platform-ready `Chatbot`, montată numai pentru
site-urile care au modulul activ. Vezi `AGENTS.md` pentru cum e organizat.

Template-ul declară contractul Studio în `studio.template.json` și include
skill-ul oficial shadcn direct în `.agents/skills/shadcn/`. shadcn este fundația
tehnică pentru primitive, nu estetica obligatorie; modul vizual implicit este
`hybrid`, astfel încât landing-urile pot avea direcție complet custom.

Primitivele WOW sunt documentate în `EXPERIENCE_REGISTRY.md`; skill-ul local
`.agents/skills/experience-primitives/SKILL.md` obligă agentul să le personalizeze
și descrie pipeline-ul corect pentru plate-uri 2.5D.

```bash
npm install
npm run dev
npm run check
npm run dev:experience
```

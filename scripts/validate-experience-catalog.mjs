import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const readJson = async (name) => JSON.parse(await readFile(resolve(root, name), "utf8"));
const [catalog, grammar, registry, contract, labSource, guideSource] = await Promise.all([
  readJson("experience.catalog.json"),
  readJson("creative-grammar.json"),
  readJson("registry.json"),
  readJson("studio.template.json"),
  readFile(resolve(root, "src/app/experience-lab/experience-lab.tsx"), "utf8"),
  readFile(resolve(root, "src/app/experience-lab/experience-lab-guides.ts"), "utf8"),
]);

const errors = [];
const fail = (message) => errors.push(message);
const unique = (values) => new Set(values).size === values.length;
const allowed = {
  kind: new Set(["primitive", "infrastructure", "utility"]),
  role: new Set(["signature", "structure", "support", "micro", "infrastructure"]),
  stack: new Set(["dom", "canvas", "webgl", "hybrid"]),
  cost: new Set(["low", "medium", "high"]),
};

if (catalog.version !== contract.experience.catalogVersion) fail("Catalog version must match studio.template.json.");
if (grammar.version !== catalog.version) fail("Creative grammar and experience catalog versions must match.");
if (catalog.items.length !== catalog.installableItems) fail(`Expected ${catalog.installableItems} catalog items, found ${catalog.items.length}.`);
if (catalog.items.filter((item) => item.visibleInLab).length !== catalog.visibleDirections) fail(`Expected ${catalog.visibleDirections} visible Lab items.`);
if (catalog.installableItems !== catalog.visibleDirections) fail("Installable and visible counts must match; hidden catalog items are not allowed.");
if (registry.items.length !== catalog.installableItems) fail("Registry and catalog installable counts differ.");
const responsive = catalog.responsiveContract;
if (responsive?.strategy !== "mobile-first") fail("Experience components must use the mobile-first responsive strategy.");
if (responsive?.coverage !== "all-installable-items") fail("The responsive contract must cover every installable item.");
if (responsive?.breakpoints?.mobileMax !== 639 || responsive?.breakpoints?.tabletMin !== 640 || responsive?.breakpoints?.tabletMax !== 1024 || responsive?.breakpoints?.desktopMin !== 1025) fail("Experience breakpoints must stay aligned with the runtime contract (640/1025).");
if (responsive?.pointerCapabilitySeparate !== true) fail("Viewport and pointer capability must remain separate responsive signals.");
if (responsive?.webglDprCaps?.mobile !== 1 || responsive?.webglDprCaps?.tablet !== 1.25 || responsive?.webglDprCaps?.desktop !== 1.6) fail("WebGL DPR caps must stay aligned with the runtime contract.");
if (contract.experience.responsiveContract !== "docs/experience/responsive-contract.md") fail("Studio must reference the responsive experience contract.");

const ids = catalog.items.map((item) => item.id);
const registryIds = registry.items.map((item) => item.name);
const familyIds = new Set(catalog.families.map((family) => family.id));
if (!unique(ids)) fail("Catalog ids must be unique.");
if (!unique(registryIds)) fail("Registry ids must be unique.");
if (!unique([...familyIds])) fail("Family ids must be unique.");

const aliases = [];
for (const item of catalog.items) {
  if (!familyIds.has(item.family)) fail(`${item.id}: unknown family ${item.family}.`);
  if (!allowed.kind.has(item.kind)) fail(`${item.id}: invalid kind ${item.kind}.`);
  if (!allowed.role.has(item.recommendedRole)) fail(`${item.id}: invalid role ${item.recommendedRole}.`);
  if (!allowed.stack.has(item.stack)) fail(`${item.id}: invalid stack ${item.stack}.`);
  if (!allowed.cost.has(item.performanceCost)) fail(`${item.id}: invalid performance cost ${item.performanceCost}.`);
  if (!registryIds.includes(item.registryItem)) fail(`${item.id}: registry item ${item.registryItem} does not exist.`);
  for (const alias of item.legacyAliases ?? []) aliases.push(alias);
}
if (!unique(aliases)) fail("Legacy aliases must be unique.");
for (const alias of aliases) if (ids.includes(alias)) fail(`Legacy alias ${alias} collides with a canonical id.`);
for (const registryId of registryIds) if (!catalog.items.some((item) => item.registryItem === registryId)) fail(`${registryId}: registry item is missing from the catalog.`);

const demosBlock = labSource.match(/const demos = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
const demoIds = [...demosBlock.matchAll(/^\s*\["([^"]+)"/gm)].map(match => match[1]);
const guideIds = [...guideSource.matchAll(/^\s{2}"([^"]+)": guide/gm)].map(match => match[1]);
const visibleIds = catalog.items.filter((item) => item.visibleInLab).map((item) => item.id);
if (demoIds.length !== catalog.visibleDirections) fail(`Experience Lab must declare exactly ${catalog.visibleDirections} demos.`);
if (!unique(demoIds)) fail("Experience Lab demo ids must be unique.");
for (const id of visibleIds) if (!demoIds.includes(id)) fail(`${id}: visible catalog item is missing from Experience Lab.`);
for (const id of demoIds) if (!visibleIds.includes(id)) fail(`${id}: Experience Lab demo is not marked visible in the catalog.`);
for (const id of demoIds) if (!guideIds.includes(id)) fail(`${id}: Experience Lab guide is missing.`);

const signature = grammar.wowBudget?.signatureMechanicsPerPage;
if (signature?.min !== 0 || signature?.max !== 1) fail("Wow budget must allow zero or one signature mechanic per page.");
if (grammar.directionPolicy?.presentationCount !== 2) fail("Studio must present exactly two directions.");
if (grammar.directionPolicy?.forceSafeVersusWowSplit !== false) fail("Directions must not be forced into safe-versus-wow roles.");

if (errors.length) {
  console.error(`Experience catalog validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(`Experience catalog ${catalog.version}: ${catalog.items.length} installable, ${catalog.visibleDirections} visible, ${catalog.families.length} families.`);

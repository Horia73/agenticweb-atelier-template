import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import path from "node:path";

const execFileAsync = promisify(execFile);
const CACHE_DIR = path.resolve(".asset-cache/cinematic-forest-3d");
const OUTPUT_DIR = path.resolve("public/experience/cinematic-forest-3d");
const GLTF_TRANSFORM = path.resolve("node_modules/.bin/gltf-transform");

const MODELS = [
  { id: "fir_tree_01", output: "fir-trees.glb", ratio: 0.032, error: 0.014 },
  { id: "tree_small_02", output: "broadleaf-tree.glb", ratio: 0.055, error: 0.012 },
  { id: "fir_sapling", output: "fir-saplings.glb", ratio: 0.32, error: 0.01 },
  { id: "fern_02", output: "ferns.glb", ratio: 0.8, error: 0.002 },
  { id: "rock_moss_set_01", output: "moss-rocks.glb", ratio: 0.38, error: 0.006 },
  { id: "root_cluster_01", output: "root-cluster.glb", ratio: 0.32, error: 0.008 },
];

const FOREST_ASSETS = {
  environment: {
    id: "forest_slope",
    output: "forest-slope-4k.hdr",
  },
  ground: {
    id: "forest_leaves_02",
    maps: {
      Diffuse: "ground-diffuse.jpg",
      nor_gl: "ground-normal.jpg",
      Rough: "ground-roughness.jpg",
      Displacement: "ground-displacement.jpg",
    },
  },
};

async function existsWithSize(file, size) {
  try {
    return (await stat(file)).size === size;
  } catch {
    return false;
  }
}

async function fileExists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function download(url, destination, expectedSize) {
  if (expectedSize && await existsWithSize(destination, expectedSize)) return;
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.download`;
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Asset download failed (${response.status}): ${url}`);
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
  await rename(temporary, destination);
}

async function polyHavenFiles(id) {
  const response = await fetch(`https://api.polyhaven.com/files/${id}`);
  if (!response.ok) throw new Error(`Poly Haven metadata failed (${response.status}): ${id}`);
  return response.json();
}

async function buildModel(model) {
  const files = await polyHavenFiles(model.id);
  const source = files.gltf?.["1k"]?.gltf;
  if (!source) throw new Error(`No 1K glTF package for ${model.id}.`);

  const sourceDir = path.join(CACHE_DIR, model.id);
  const input = path.join(sourceDir, `${model.id}_1k.gltf`);
  await download(source.url, input, source.size);
  for (const [relativePath, include] of Object.entries(source.include ?? {})) {
    await download(include.url, path.join(sourceDir, relativePath), include.size);
  }

  const output = path.join(OUTPUT_DIR, model.output);
  await execFileAsync(GLTF_TRANSFORM, [
    "optimize",
    input,
    output,
    "--compress", "meshopt",
    "--flatten", "false",
    "--instance", "false",
    "--join", "false",
    "--palette", "false",
    "--simplify", "true",
    "--simplify-ratio", String(model.ratio),
    "--simplify-error", String(model.error),
    "--texture-compress", "webp",
    "--texture-size", "1024",
  ], { maxBuffer: 1024 * 1024 * 12 });

  return {
    id: model.id,
    sourcePage: `https://polyhaven.com/a/${model.id}`,
    sourceBytes: source.size + Object.values(source.include ?? {}).reduce((sum, file) => sum + file.size, 0),
    output: model.output,
    outputBytes: (await stat(output)).size,
  };
}

async function buildEnvironment() {
  const { id, output } = FOREST_ASSETS.environment;
  const files = await polyHavenFiles(id);
  const source = files.hdri?.["4k"]?.hdr;
  if (!source) throw new Error(`No 4K HDR environment for ${id}.`);
  await download(source.url, path.join(OUTPUT_DIR, output), source.size);
  return { id, sourcePage: `https://polyhaven.com/a/${id}`, output, outputBytes: source.size };
}

async function buildGround() {
  const { id, maps } = FOREST_ASSETS.ground;
  const files = await polyHavenFiles(id);
  const built = [];
  for (const [kind, output] of Object.entries(maps)) {
    const source = files[kind]?.["2k"]?.jpg;
    if (!source) throw new Error(`No 2K ${kind} JPG for ${id}.`);
    await download(source.url, path.join(OUTPUT_DIR, output), source.size);
    built.push({ kind, output, outputBytes: source.size });
  }
  return { id, sourcePage: `https://polyhaven.com/a/${id}`, maps: built };
}

async function sha256(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

await mkdir(CACHE_DIR, { recursive: true });
await mkdir(OUTPUT_DIR, { recursive: true });

const models = [];
for (const model of MODELS) {
  console.log(`Building ${model.id}…`);
  models.push(await buildModel(model));
}
const environment = await buildEnvironment();
const ground = await buildGround();

const outputs = [
  ...models.map((model) => model.output),
  environment.output,
  ...ground.maps.map((map) => map.output),
];
if (await fileExists(path.join(OUTPUT_DIR, "poster.webp"))) outputs.push("poster.webp");
const checksums = Object.fromEntries(
  await Promise.all(outputs.map(async (file) => [file, await sha256(path.join(OUTPUT_DIR, file))])),
);

await writeFile(
  path.join(OUTPUT_DIR, "asset-manifest.json"),
  `${JSON.stringify({
    id: "cinematic-forest-3d-v2",
    type: "hybrid-photogrammetric-3d-environment",
    license: "CC0-1.0",
    provider: "Poly Haven",
    models,
    environment,
    ground,
    poster: outputs.includes("poster.webp") ? "poster.webp" : null,
    checksums,
    pipeline: "Poly Haven source glTF/HDR/PBR → meshoptimizer GLB + WebP textures → scroll-directed R3F scene",
  }, null, 2)}\n`,
);

const total = (await Promise.all(outputs.map((file) => stat(path.join(OUTPUT_DIR, file)))))
  .reduce((sum, file) => sum + file.size, 0);
console.log(`Built ${(total / 1024 / 1024).toFixed(1)} MiB of production forest assets.`);

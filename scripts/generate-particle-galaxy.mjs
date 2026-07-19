// Generates the particle-assembly galaxy target: a dithered density matte plus a
// color map, both sized to the component's 256px sampling grid so the density
// falloff survives sampling 1:1. Re-run with `node scripts/generate-particle-galaxy.mjs`;
// tweak the constants below (arms, palette, densities) to art-direct a new target.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SIZE = 256;
const CENTER = SIZE / 2;
const OUT_DIR = new URL("../public/experience/particle-galaxy-v1/", import.meta.url).pathname;

const ARMS = 2;
const ARM_TURNS = 1.45 * Math.PI * 2;
const ARM_SAMPLES = 60000;
const CORE_SAMPLES = 14000;
const STAR_COUNT = 420;

const energy = new Float64Array(SIZE * SIZE);
const red = new Float64Array(SIZE * SIZE);
const green = new Float64Array(SIZE * SIZE);
const blue = new Float64Array(SIZE * SIZE);

const mix = (a, b, t) => a + (b - a) * t;
const mixColor = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const gaussian = () => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const CORE_COLOR = [255, 224, 166];
const MID_COLOR = [56, 208, 255];
const OUTER_COLOR = [148, 92, 255];
const SPARK_COLOR = [255, 79, 216];
const STAR_COLOR = [214, 240, 255];

function splat(x, y, amount, color, radius = 1.5) {
  const minX = Math.max(0, Math.floor(x - radius * 2));
  const maxX = Math.min(SIZE - 1, Math.ceil(x + radius * 2));
  const minY = Math.max(0, Math.floor(y - radius * 2));
  const maxY = Math.min(SIZE - 1, Math.ceil(y + radius * 2));
  for (let py = minY; py <= maxY; py += 1) {
    for (let px = minX; px <= maxX; px += 1) {
      const d2 = (px - x) ** 2 + (py - y) ** 2;
      const weight = amount * Math.exp(-d2 / (2 * radius * radius));
      const index = py * SIZE + px;
      energy[index] += weight;
      red[index] += weight * color[0];
      green[index] += weight * color[1];
      blue[index] += weight * color[2];
    }
  }
}

// Spiral arms: logarithmic-ish radius growth with wide, cloudy gaussian spread.
for (let arm = 0; arm < ARMS; arm += 1) {
  const phase = (arm / ARMS) * Math.PI * 2;
  for (let sample = 0; sample < ARM_SAMPLES; sample += 1) {
    const t = Math.pow(Math.random(), 0.7);
    const angle = phase + t * ARM_TURNS;
    const radius = 9 + 102 * Math.pow(t, 0.88);
    const spread = 3 + 6.5 * t;
    const x = CENTER + Math.cos(angle) * radius + gaussian() * spread;
    const y = CENTER + Math.sin(angle) * radius * 0.94 + gaussian() * spread * 0.9;
    const falloff = (1 - t * 0.6) * 1.05;
    let color = t < 0.45 ? mixColor(CORE_COLOR, MID_COLOR, t / 0.45) : mixColor(MID_COLOR, OUTER_COLOR, (t - 0.45) / 0.55);
    if (Math.random() < 0.05) color = SPARK_COLOR;
    splat(x, y, falloff, color, 1.35);
  }
}

// Faint disc haze so the space between arms breathes instead of going pure black.
for (let sample = 0; sample < 9000; sample += 1) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.min(118, -Math.log(Math.random()) * 30);
  const x = CENTER + Math.cos(angle) * radius;
  const y = CENTER + Math.sin(angle) * radius * 0.94;
  const color = mixColor(CORE_COLOR, MID_COLOR, Math.min(1, radius / 90));
  splat(x, y, 0.09, color, 1.8);
}

// Core bulge.
for (let sample = 0; sample < CORE_SAMPLES; sample += 1) {
  const x = CENTER + gaussian() * 10;
  const y = CENTER + gaussian() * 8.5;
  splat(x, y, 1.15, CORE_COLOR, 1.7);
}

// Sparse field stars across the disc.
for (let star = 0; star < STAR_COUNT; star += 1) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 18 + Math.random() * 102;
  splat(CENTER + Math.cos(angle) * radius, CENTER + Math.sin(angle) * radius * 0.94, 0.9, STAR_COLOR, 0.9);
}

// Normalize against a high percentile so the core doesn't crush the arms.
const sorted = Float64Array.from(energy).sort();
const reference = sorted[Math.floor(sorted.length * 0.998)] || 1;

const maskPixels = Buffer.alloc(SIZE * SIZE * 4);
const colorPixels = Buffer.alloc(SIZE * SIZE * 4);
for (let index = 0; index < SIZE * SIZE; index += 1) {
  const density = Math.min(1, energy[index] / reference);
  // Dithered matte: selection probability follows density, so the sampled
  // particle cloud keeps the galaxy's falloff instead of a hard threshold edge.
  const selected = density > 0.004 && Math.random() < Math.pow(density, 0.62);
  const maskValue = selected ? 255 : 0;
  maskPixels[index * 4] = maskValue;
  maskPixels[index * 4 + 1] = maskValue;
  maskPixels[index * 4 + 2] = maskValue;
  maskPixels[index * 4 + 3] = 255;
  const weight = energy[index] || 1;
  const brightness = Math.pow(density, 0.5);
  colorPixels[index * 4] = Math.min(255, (red[index] / weight) * brightness);
  colorPixels[index * 4 + 1] = Math.min(255, (green[index] / weight) * brightness);
  colorPixels[index * 4 + 2] = Math.min(255, (blue[index] / weight) * brightness);
  colorPixels[index * 4 + 3] = 255;
}

mkdirSync(OUT_DIR, { recursive: true });
const raw = { raw: { width: SIZE, height: SIZE, channels: 4 } };
await sharp(maskPixels, raw).png().toFile(`${OUT_DIR}mask.png`);
await sharp(colorPixels, raw).png().toFile(`${OUT_DIR}color.png`);
await sharp(colorPixels, raw).resize(1024, 1024, { kernel: "lanczos3" }).blur(1.1).png().toFile(`${OUT_DIR}poster.png`);
console.log(`Wrote mask.png, color.png, poster.png to ${OUT_DIR}`);

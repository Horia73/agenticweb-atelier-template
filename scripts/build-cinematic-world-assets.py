#!/usr/bin/env python3
"""Build registered, full-canvas 2.5D plates from a master + clean plate pair.

This intentionally avoids color-key extraction. The source pair must share one
camera; a region-constrained difference matte isolates the designed hero and
foreground planes while soft, overlapping landscape masks provide movement
bleed underneath them.
"""

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps


MASTER_PROMPT = """Use case: stylized-concept
Asset type: master image for a production 2.5D cinematic website scene
Primary request: create one coherent, photorealistic cinematic mineral-valley world designed for later depth-layer separation
Scene/backdrop: a vast remote volcanic valley at blue-gold dawn, a calm shallow reflective lagoon across the lower half, a simple clean gradient sky, distant layered mountains with a clearly readable silhouette, light atmospheric haze
Subject: one original sculptural dark-stone and black-glass pavilion standing on a low island slightly right of center, with a warm narrow doorway glow; two massive near-camera basalt formations frame the lower left and lower right edges like an open portal, visibly separate from the pavilion and from each other; a few subtle edge reeds and mist close to camera
Style/medium: premium photorealistic architectural campaign photography, restrained editorial art direction, realistic rock, water, reflections and atmosphere
Composition/framing: wide 16:9 landscape master, eye-level cinematic camera, strong stable horizon, generous 12–15% overscan, clear negative space left of the pavilion for future semantic HTML copy, distinct far/background/midground/hero/foreground planes, no critical object touching the outer crop except the intended foreground edge formations
Lighting/mood: calm dawn side light from the left, physically consistent reflections and contact, quiet monumental mood, controlled contrast
Color palette: charcoal basalt, graphite glass, muted blue-gray water, warm sand and pale amber dawn
Constraints: one camera and one coherent perspective; foreground-left and foreground-right must have clean readable silhouettes and remain separate; pavilion must be grounded; no people; no animals; no vehicles; no text; no typography; no logo; no watermark; no interface elements
Avoid: fantasy castle, sci-fi spaceship, neon cyberpunk, generic gradient artwork, heavy fog hiding edges, motion blur, floating objects, duplicated structures, extreme depth of field, cluttered sky"""

CLEAN_PLATE_EDIT_PROMPT = """Edit this exact source image into a clean background plate for 2.5D compositing. Preserve the exact camera, horizon, perspective, sky gradient, distant mountain silhouettes, dawn lighting, color grade, lagoon geometry, and 16:9 framing. Remove the central dark architectural pavilion completely, including its doorway glow and its reflection in the water. Remove both near-camera black basalt edge formations on the far left and far right, including their close grasses and reflections. Reconstruct the hidden terrain and lagoon naturally and photorealistically, with continuous shorelines, physically consistent water reflections, subtle mist, and no visible seams or object remnants. Keep the scene empty and calm. Do not add any new structure, object, person, animal, text, logo, watermark, or interface. Output a seamless photorealistic clean plate registered as closely as possible to the source image."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--master", required=True, type=Path)
    parser.add_argument("--clean", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def polygon_mask(size: tuple[int, int], points: list[tuple[int, int]], blur: float = 0) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(blur)) if blur else mask


def difference_mask(
    master: Image.Image,
    clean: Image.Image,
    region: Image.Image,
    *,
    threshold: int,
    grow: int,
    soften: float,
    prefilter: float = 1.2,
) -> Image.Image:
    diff = ImageChops.difference(master.convert("RGB"), clean.convert("RGB"))
    diff = ImageOps.grayscale(diff)
    if prefilter:
        diff = diff.filter(ImageFilter.GaussianBlur(prefilter))
    values = np.asarray(diff, dtype=np.uint8)
    matte = Image.fromarray(np.where(values >= threshold, 255, 0).astype(np.uint8), "L")
    if grow >= 3:
        grow = grow if grow % 2 else grow + 1
        matte = matte.filter(ImageFilter.MaxFilter(grow))
    matte = ImageChops.multiply(matte, region)
    return matte.filter(ImageFilter.GaussianBlur(soften))


def difference_alpha_mask(
    master: Image.Image,
    clean: Image.Image,
    region: Image.Image,
    *,
    low: int,
    high: int,
    prefilter: float = 0.45,
) -> Image.Image:
    master_values = np.asarray(master.convert("RGB"), dtype=np.int16)
    clean_values = np.asarray(clean.convert("RGB"), dtype=np.int16)
    delta = np.max(np.abs(master_values - clean_values), axis=2).astype(np.uint8)
    difference = Image.fromarray(delta, "L")
    if prefilter:
        difference = difference.filter(ImageFilter.GaussianBlur(prefilter))
    values = np.asarray(difference, dtype=np.float32)
    alpha = np.clip((values - low) / max(high - low, 1), 0, 1)
    alpha = np.power(alpha, 0.9) * (np.asarray(region, dtype=np.float32) / 255)
    return Image.fromarray(np.round(alpha * 255).astype(np.uint8), "L")


def keep_seed_component(
    mask: Image.Image,
    seed: tuple[int, int],
    *,
    min_alpha: int = 24,
    restore_edge: int = 5,
) -> Image.Image:
    values = np.asarray(mask, dtype=np.uint8)
    active = values >= min_alpha
    width, height = mask.size
    seed_x = min(width - 1, max(0, seed[0]))
    seed_y = min(height - 1, max(0, seed[1]))
    if not active[seed_y, seed_x]:
        raise ValueError(f"Component seed {seed} is outside the matte")

    visited = np.zeros_like(active, dtype=np.uint8)
    queue: deque[tuple[int, int]] = deque([(seed_x, seed_y)])
    visited[seed_y, seed_x] = 255
    while queue:
        x, y = queue.popleft()
        for next_x, next_y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if next_x < 0 or next_x >= width or next_y < 0 or next_y >= height:
                continue
            if visited[next_y, next_x] or not active[next_y, next_x]:
                continue
            visited[next_y, next_x] = 255
            queue.append((next_x, next_y))

    component = Image.fromarray(visited, "L")
    if restore_edge >= 3:
        restore_edge = restore_edge if restore_edge % 2 else restore_edge + 1
        component = component.filter(ImageFilter.MaxFilter(restore_edge))
    return ImageChops.multiply(mask, component)


def rgba_plate(source: Image.Image, mask: Image.Image) -> Image.Image:
    plate = source.convert("RGBA")
    plate.putalpha(mask)
    return plate


def unmatted_plate(master: Image.Image, clean: Image.Image, mask: Image.Image) -> Image.Image:
    foreground = np.asarray(master.convert("RGB"), dtype=np.float32)
    background = np.asarray(clean.convert("RGB"), dtype=np.float32)
    alpha = np.asarray(mask, dtype=np.float32)[:, :, None] / 255
    safe_alpha = np.maximum(alpha, 0.035)
    colors = (foreground - background * (1 - alpha)) / safe_alpha
    colors = np.where(alpha > 0, np.clip(colors, 0, 255), 0).astype(np.uint8)
    rgba = np.concatenate([colors, np.asarray(mask, dtype=np.uint8)[:, :, None]], axis=2)
    return Image.fromarray(rgba, "RGBA")


def save_webp(image: Image.Image, path: Path, quality: int = 92) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(
        path,
        "WEBP",
        quality=quality,
        method=6,
        exact=True,
        lossless=image.mode == "RGBA",
    )


def make_vignette(size: tuple[int, int]) -> Image.Image:
    width, height = size
    y, x = np.ogrid[:height, :width]
    nx = np.abs((x / max(width - 1, 1)) * 2 - 1)
    ny = np.abs((y / max(height - 1, 1)) * 2 - 1)
    edge = np.maximum(nx ** 2.2, ny ** 2.8)
    alpha = np.clip((edge - 0.48) / 0.52, 0, 1) * 118
    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.array([5, 10, 13], dtype=np.uint8)
    rgba[:, :, 3] = alpha.astype(np.uint8)
    return Image.fromarray(rgba, "RGBA").filter(ImageFilter.GaussianBlur(12))


def main() -> None:
    args = parse_args()
    master = Image.open(args.master).convert("RGB")
    clean = Image.open(args.clean).convert("RGB")
    if master.size != clean.size:
        raise SystemExit(f"Source dimensions do not match: {master.size} vs {clean.size}")

    output = args.output
    layers = output / "layers"
    mobile_layers = output / "layers-mobile"
    masks = output / "masks"
    qa = output / "qa"
    layers.mkdir(parents=True, exist_ok=True)
    mobile_layers.mkdir(parents=True, exist_ok=True)
    masks.mkdir(parents=True, exist_ok=True)
    qa.mkdir(parents=True, exist_ok=True)

    width, height = master.size
    sx = width / 1672
    sy = height / 941
    point = lambda x, y: (round(x * sx), round(y * sy))

    hero_region = polygon_mask(
        master.size,
        [
            point(845, 612), point(900, 555), point(948, 448), point(970, 312),
            point(1015, 338), point(1024, 256), point(1117, 284), point(1125, 326),
            point(1182, 347), point(1192, 423), point(1396, 584), point(1378, 612),
        ],
        blur=2.5,
    )
    reflection_region = polygon_mask(
        master.size,
        [point(865, 620), point(1390, 620), point(1370, 941), point(850, 941)],
        blur=4,
    )
    left_region = polygon_mask(
        master.size,
        [point(0, 90), point(175, 135), point(220, 560), point(690, 941), point(0, 941)],
        blur=2,
    )
    right_region = polygon_mask(
        master.size,
        [point(1490, 80), point(1672, 70), point(1672, 941), point(1160, 941), point(1440, 550)],
        blur=2,
    )

    hero_mask = difference_alpha_mask(master, clean, hero_region, low=14, high=48)
    hero_mask = keep_seed_component(hero_mask, point(1080, 410))
    reflection_mask = difference_mask(master, clean, reflection_region, threshold=18, grow=11, soften=4)
    left_mask = difference_alpha_mask(master, clean, left_region, low=13, high=44)
    right_mask = difference_alpha_mask(master, clean, right_region, low=13, high=44)

    # The base is deliberately defocused behind the moving plates. Small plate
    # offsets reveal atmospheric bleed instead of a sharp duplicate silhouette.
    base = clean.filter(ImageFilter.GaussianBlur(20))

    landscape_mask = polygon_mask(
        master.size,
        [
            point(0, 520), point(160, 535), point(310, 555), point(470, 520),
            point(610, 505), point(750, 425), point(865, 500), point(1010, 475),
            point(1150, 505), point(1310, 475), point(1470, 485), point(1672, 465),
            point(1672, 675), point(0, 675),
        ],
        blur=8,
    )
    midground_mask = Image.new("L", master.size, 0)
    midground_draw = ImageDraw.Draw(midground_mask)
    midground_draw.rectangle((0, round(590 * sy), width, height), fill=255)
    midground_mask = midground_mask.filter(ImageFilter.GaussianBlur(18))

    masks_by_name = {
        "10-landscape": landscape_mask,
        "20-midground": midground_mask,
        "29-contact-reflection": reflection_mask,
        "30-hero": hero_mask,
        "40-foreground-left": left_mask,
        "41-foreground-right": right_mask,
    }
    for name, mask in masks_by_name.items():
        mask.save(masks / f"{name}.png")

    landscape_plate = rgba_plate(clean, landscape_mask)
    midground_plate = rgba_plate(clean, midground_mask)
    edge_plate = make_vignette(master.size)
    save_webp(base, layers / "00-sky.webp", quality=90)
    save_webp(landscape_plate, layers / "10-landscape.webp")
    save_webp(midground_plate, layers / "20-midground.webp")
    reflection_plate = rgba_plate(master, reflection_mask)
    hero_plate = unmatted_plate(master, clean, hero_mask)
    left_plate = unmatted_plate(master, clean, left_mask)
    right_plate = unmatted_plate(master, clean, right_mask)
    save_webp(reflection_plate, layers / "29-contact-reflection.webp")
    save_webp(hero_plate, layers / "30-hero.webp")
    save_webp(left_plate, layers / "40-foreground-left.webp")
    save_webp(right_plate, layers / "41-foreground-right.webp")
    save_webp(edge_plate, layers / "50-edge-frame.webp", quality=90)

    save_webp(master, output / "poster.webp", quality=92)
    mobile_crop_width = round(height * 9 / 16)
    mobile_crop_center = round(width * 0.67)
    mobile_crop_left = min(width - mobile_crop_width, max(0, mobile_crop_center - mobile_crop_width // 2))
    mobile_box = (mobile_crop_left, 0, mobile_crop_left + mobile_crop_width, height)

    def mobile_crop(image: Image.Image) -> Image.Image:
        return image.crop(mobile_box).resize((720, 1280), Image.Resampling.LANCZOS)

    plate_images = {
        "00-sky": base,
        "10-landscape": landscape_plate,
        "20-midground": midground_plate,
        "29-contact-reflection": reflection_plate,
        "30-hero": hero_plate,
        "40-foreground-left": left_plate,
        "41-foreground-right": right_plate,
        "50-edge-frame": edge_plate,
    }
    for name, plate in plate_images.items():
        save_webp(mobile_crop(plate), mobile_layers / f"{name}.webp", quality=90)
    save_webp(mobile_crop(master), output / "mobile-poster.webp", quality=91)

    composite = base.convert("RGBA")
    for name in ["10-landscape", "20-midground", "29-contact-reflection", "30-hero", "40-foreground-left", "41-foreground-right"]:
        if name in {"10-landscape", "20-midground"}:
            plate = rgba_plate(clean, masks_by_name[name])
        elif name in {"30-hero", "40-foreground-left", "41-foreground-right"}:
            plate = unmatted_plate(master, clean, masks_by_name[name])
        else:
            plate = rgba_plate(master, masks_by_name[name])
        composite = Image.alpha_composite(composite, plate)
    composite = Image.alpha_composite(composite, make_vignette(master.size))
    save_webp(composite, qa / "static-composite.webp", quality=94)

    contrast = Image.new("RGBA", master.size, "#b12cff")
    alpha_checks = {
        "30-hero": hero_plate,
        "40-foreground-left": left_plate,
        "41-foreground-right": right_plate,
    }
    for name, plate in alpha_checks.items():
        save_webp(Image.alpha_composite(contrast, plate), qa / f"{name}-alpha-check.webp", quality=92)

    desktop_delivery_files = [*layers.glob("*.webp"), output / "poster.webp"]
    mobile_delivery_files = [*mobile_layers.glob("*.webp"), output / "mobile-poster.webp"]
    desktop_delivery_bytes = sum(path.stat().st_size for path in desktop_delivery_files)
    mobile_delivery_bytes = sum(path.stat().st_size for path in mobile_delivery_files)

    manifest = {
        "id": "cinematic-mineral-world-v1",
        "mode": "designed-layers",
        "dimensions": {"width": width, "height": height, "aspectRatio": round(width / height, 5)},
        "registeredCamera": True,
        "source": {"master": "source/master.png", "cleanPlate": "source/clean-plate.png"},
        "generation": {
            "mode": "Codex built-in ImageGen",
            "masterPrompt": MASTER_PROMPT,
            "cleanPlateEditPrompt": CLEAN_PLATE_EDIT_PROMPT,
            "generatedSourcePaths": {
                "master": "/Users/horia/.codex/generated_images/019f742b-b598-77f0-82d1-49684ad6a038/exec-cd31d8eb-1cc1-4997-b610-1980739eed19.png",
                "cleanPlate": "/Users/horia/.codex/generated_images/019f742b-b598-77f0-82d1-49684ad6a038/exec-6cfcaeb8-71fb-41ac-8f01-12b3ad2d791b.png",
            },
        },
        "poster": "poster.webp",
        "mobilePoster": "mobile-poster.webp",
        "layers": [
            {"id": "00-sky", "src": "layers/00-sky.webp", "mobileSrc": "layers-mobile/00-sky.webp", "role": "opaque atmospheric bleed"},
            {"id": "10-landscape", "src": "layers/10-landscape.webp", "mobileSrc": "layers-mobile/10-landscape.webp", "role": "far mountain plane"},
            {"id": "20-midground", "src": "layers/20-midground.webp", "mobileSrc": "layers-mobile/20-midground.webp", "role": "shore and lagoon plane"},
            {"id": "29-contact-reflection", "src": "layers/29-contact-reflection.webp", "mobileSrc": "layers-mobile/29-contact-reflection.webp", "role": "registered hero reflection"},
            {"id": "30-hero", "src": "layers/30-hero.webp", "mobileSrc": "layers-mobile/30-hero.webp", "role": "registered pavilion hero"},
            {"id": "40-foreground-left", "src": "layers/40-foreground-left.webp", "mobileSrc": "layers-mobile/40-foreground-left.webp", "role": "near left occluder"},
            {"id": "41-foreground-right", "src": "layers/41-foreground-right.webp", "mobileSrc": "layers-mobile/41-foreground-right.webp", "role": "near right occluder"},
            {"id": "50-edge-frame", "src": "layers/50-edge-frame.webp", "mobileSrc": "layers-mobile/50-edge-frame.webp", "role": "vignette and edge integration"},
        ],
        "extraction": {
            "method": "registered clean-plate difference, constrained regions, proportional alpha and edge unmatting",
            "fullCanvas": True,
            "hiddenAreaBleed": True,
            "chromaKey": False,
            "alphaEncoding": "lossless WebP",
        },
        "deliveryBytes": {
            "desktop": desktop_delivery_bytes,
            "mobile": mobile_delivery_bytes,
        },
        "qa": {
            "staticComposite": "qa/static-composite.webp",
            "alphaChecks": [f"qa/{name}-alpha-check.webp" for name in alpha_checks],
        },
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()

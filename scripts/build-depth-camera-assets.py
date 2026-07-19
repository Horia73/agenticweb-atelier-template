#!/usr/bin/env python3
"""Build registered WebGL depth plates from sequential ImageGen composites.

Every source image is an edit of the previous image. This preserves hidden
pixels for the layer that is about to be inserted and avoids asking ImageGen
for unrelated transparent assets. Difference mattes are constrained to the
approved insertion region, then edge-unmatted against the prior composite.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter


SOURCE_NAMES = {
    "00-sky": "00-atmosphere.png",
    "10-landscape": "10-landscape-composite.png",
    "20-midground": "20-midground-composite.png",
    "30-hero": "30-hero-composite.png",
    "40-foreground-left": "40-foreground-left-composite.png",
    "41-foreground-right": "41-foreground-right-composite.png",
    "50-edge-frame": "50-edge-frame-composite.png",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def polygon_mask(
    size: tuple[int, int],
    points: list[tuple[int, int]],
    *,
    blur: float = 0,
) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(blur)) if blur else mask


def proportional_difference(
    after: Image.Image,
    before: Image.Image,
    region: Image.Image,
    *,
    low: int,
    high: int,
    grow: int = 0,
    soften: float = 0.8,
) -> Image.Image:
    after_values = np.asarray(after.convert("RGB"), dtype=np.int16)
    before_values = np.asarray(before.convert("RGB"), dtype=np.int16)
    delta = np.max(np.abs(after_values - before_values), axis=2).astype(np.uint8)
    values = np.asarray(Image.fromarray(delta, "L").filter(ImageFilter.GaussianBlur(0.45)), dtype=np.float32)
    alpha = np.clip((values - low) / max(high - low, 1), 0, 1)
    alpha = np.power(alpha, 0.82)
    alpha *= np.asarray(region, dtype=np.float32) / 255
    matte = Image.fromarray(np.round(alpha * 255).astype(np.uint8), "L")
    if grow >= 3:
        grow = grow if grow % 2 else grow + 1
        matte = matte.filter(ImageFilter.MaxFilter(grow))
    if soften:
        matte = matte.filter(ImageFilter.GaussianBlur(soften))
    return matte


def edge_unmatte(after: Image.Image, before: Image.Image, mask: Image.Image) -> Image.Image:
    foreground = np.asarray(after.convert("RGB"), dtype=np.float32)
    background = np.asarray(before.convert("RGB"), dtype=np.float32)
    alpha = np.asarray(mask, dtype=np.float32)[:, :, None] / 255
    safe_alpha = np.maximum(alpha, 0.045)
    colors = (foreground - background * (1 - alpha)) / safe_alpha
    colors = np.where(alpha > 0, np.clip(colors, 0, 255), 0).astype(np.uint8)
    rgba = np.concatenate([colors, np.asarray(mask, dtype=np.uint8)[:, :, None]], axis=2)
    return Image.fromarray(rgba, "RGBA")


def dark_subject_difference(
    after: Image.Image,
    before: Image.Image,
    region: Image.Image,
    *,
    luminance_max: int,
    low: int,
    high: int,
    core_grow: int = 7,
    detail_grow: int = 17,
    core_difference_min: int = 20,
    seeds: list[tuple[int, int]] | None = None,
) -> Image.Image:
    """Keep dark inserted objects while rejecting ImageGen's global edit drift."""

    luminance = np.asarray(after.convert("L"), dtype=np.uint8)
    after_values = np.asarray(after.convert("RGB"), dtype=np.int16)
    before_values = np.asarray(before.convert("RGB"), dtype=np.int16)
    delta = np.max(np.abs(after_values - before_values), axis=2)
    region_values = np.asarray(region, dtype=np.uint8)
    core_values = np.where(
        (luminance <= luminance_max)
        & (delta >= core_difference_min)
        & (region_values > 0),
        255,
        0,
    ).astype(np.uint8)
    core = Image.fromarray(core_values, "L")
    core_grow = core_grow if core_grow % 2 else core_grow + 1
    detail_grow = detail_grow if detail_grow % 2 else detail_grow + 1
    core = core.filter(ImageFilter.MaxFilter(core_grow))
    if seeds:
        binary = core.point(lambda value: 255 if value else 0)
        selected = Image.new("L", binary.size, 0)
        for seed in seeds:
            flood = binary.copy()
            if flood.getpixel(seed) == 0:
                continue
            ImageDraw.floodfill(flood, seed, 128, thresh=0)
            selected = ImageChops.lighter(
                selected,
                flood.point(lambda value: 255 if value == 128 else 0),
            )
        core = selected
    core = core.filter(ImageFilter.GaussianBlur(0.7))
    detail_zone = core.filter(ImageFilter.MaxFilter(detail_grow))
    detail = proportional_difference(
        after,
        before,
        region,
        low=low,
        high=high,
        grow=3,
        soften=0.75,
    )
    detail = ImageChops.multiply(detail, detail_zone)
    return ImageChops.multiply(ImageChops.lighter(core, detail), region)


def save_webp(image: Image.Image, path: Path, *, quality: int = 92) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(
        path,
        "WEBP",
        quality=quality,
        method=6,
        exact=True,
        lossless=image.mode == "RGBA",
    )


def main() -> None:
    args = parse_args()
    sources = {
        name: Image.open(args.source / filename).convert("RGB")
        for name, filename in SOURCE_NAMES.items()
    }
    dimensions = {image.size for image in sources.values()}
    if len(dimensions) != 1:
        raise SystemExit(f"Sequential source dimensions do not match: {sorted(dimensions)}")

    width, height = next(iter(dimensions))
    sx = width / 1672
    sy = height / 941
    point = lambda x, y: (round(x * sx), round(y * sy))
    output = args.output
    layers_dir = output / "layers"
    mobile_dir = output / "layers-mobile"
    masks_dir = output / "masks"
    qa_dir = output / "qa"
    for directory in (layers_dir, mobile_dir, masks_dir, qa_dir):
        directory.mkdir(parents=True, exist_ok=True)

    regions = {
        "10-landscape": polygon_mask(
            (width, height),
            [point(0, 390), point(1672, 390), point(1672, 525), point(0, 525)],
            blur=7,
        ),
        "20-midground": polygon_mask(
            (width, height),
            [point(0, 465), point(1672, 465), point(1672, 900), point(0, 900)],
            blur=5,
        ),
        "29-contact-reflection": ImageChops.lighter(
            polygon_mask(
                (width, height),
                [point(850, 545), point(1330, 545), point(1330, 625), point(850, 640)],
                blur=2,
            ),
            ImageChops.lighter(
                polygon_mask(
                    (width, height),
                    [point(960, 590), point(1085, 590), point(1085, 790), point(1055, 870), point(1005, 875), point(965, 820)],
                    blur=2,
                ),
                polygon_mask(
                    (width, height),
                    [point(1115, 590), point(1215, 590), point(1215, 820), point(1180, 875), point(1135, 865), point(1115, 785)],
                    blur=2,
                ),
            ),
        ),
        "30-hero": ImageChops.lighter(
            polygon_mask(
                (width, height),
                [
                    point(958, 570), point(958, 350), point(976, 285), point(1010, 232),
                    point(1052, 205), point(1078, 202), point(1078, 258), point(1045, 288),
                    point(1026, 342), point(1016, 570),
                ],
                blur=2,
            ),
            polygon_mask(
                (width, height),
                [
                    point(1086, 202), point(1120, 212), point(1165, 260), point(1190, 330),
                    point(1202, 570), point(1133, 570), point(1128, 340), point(1108, 290),
                    point(1086, 262),
                ],
                blur=2,
            ),
        ),
        "40-foreground-left": polygon_mask(
            (width, height),
            [
                point(0, 445), point(150, 445), point(260, 465), point(360, 495),
                point(410, 515), point(410, 555), point(365, 585), point(325, 625),
                point(315, 675), point(355, 720), point(465, 742), point(560, 742),
                point(620, 780), point(610, 825), point(555, 875), point(500, 910),
                point(0, 941),
            ],
            blur=2,
        ),
        "41-foreground-right": polygon_mask(
            (width, height),
            [
                point(1505, 265), point(1542, 275), point(1572, 322), point(1595, 310),
                point(1625, 350), point(1645, 395), point(1672, 405), point(1672, 941),
                point(1275, 941), point(1290, 825), point(1335, 705), point(1385, 610),
                point(1430, 500), point(1465, 380),
            ],
            blur=2,
        ),
        "50-edge-frame": polygon_mask(
            (width, height),
            [point(0, 820), point(1672, 820), point(1672, 941), point(0, 941)],
            blur=18,
        ),
    }

    transitions = {
        "10-landscape": (sources["10-landscape"], sources["00-sky"], 7, 34, 3, 1.1),
        "20-midground": (sources["20-midground"], sources["10-landscape"], 8, 38, 3, 1.0),
        "29-contact-reflection": (sources["30-hero"], sources["20-midground"], 9, 42, 3, 1.2),
        "30-hero": (sources["30-hero"], sources["20-midground"], 8, 36, 3, 0.8),
        "40-foreground-left": (sources["40-foreground-left"], sources["30-hero"], 8, 38, 3, 0.8),
        "41-foreground-right": (sources["41-foreground-right"], sources["40-foreground-left"], 8, 38, 3, 0.8),
        "50-edge-frame": (sources["50-edge-frame"], sources["41-foreground-right"], 10, 44, 3, 1.6),
    }

    plates: dict[str, Image.Image] = {"00-sky": sources["00-sky"]}
    masks: dict[str, Image.Image] = {}
    dark_layers = {
        "30-hero": 112,
        "40-foreground-left": 118,
        "41-foreground-right": 112,
    }
    component_seeds = {
        "30-hero": [point(1000, 430), point(1160, 430)],
        "40-foreground-left": [point(80, 610), point(160, 820), point(430, 780)],
        "41-foreground-right": [point(1530, 450), point(1450, 760), point(1600, 810)],
    }
    for name, (after, before, low, high, grow, soften) in transitions.items():
        if name in dark_layers:
            mask = dark_subject_difference(
                after,
                before,
                regions[name],
                luminance_max=dark_layers[name],
                low=low,
                high=high,
                seeds=component_seeds.get(name),
            )
        else:
            mask = proportional_difference(
                after,
                before,
                regions[name],
                low=low,
                high=high,
                grow=grow,
                soften=soften,
            )
        masks[name] = mask
        plates[name] = edge_unmatte(after, before, mask)
        mask.save(masks_dir / f"{name}.png")

    save_webp(plates["00-sky"], layers_dir / "00-sky.webp", quality=91)
    for name in transitions:
        save_webp(plates[name], layers_dir / f"{name}.webp")

    poster = sources["41-foreground-right"]
    save_webp(poster, output / "poster.webp", quality=92)

    mobile_width = round(height * 9 / 16)
    mobile_center = round(width * 0.64)
    mobile_left = min(width - mobile_width, max(0, mobile_center - mobile_width // 2))
    mobile_box = (mobile_left, 0, mobile_left + mobile_width, height)

    def mobile_crop(image: Image.Image) -> Image.Image:
        return image.crop(mobile_box).resize((720, 1280), Image.Resampling.LANCZOS)

    for name, plate in plates.items():
        save_webp(mobile_crop(plate), mobile_dir / f"{name}.webp", quality=90)
    save_webp(mobile_crop(poster), output / "mobile-poster.webp", quality=91)

    composite = plates["00-sky"].convert("RGBA")
    layer_order = [
        "10-landscape",
        "20-midground",
        "29-contact-reflection",
        "30-hero",
        "40-foreground-left",
        "41-foreground-right",
        "50-edge-frame",
    ]
    for name in layer_order:
        composite = Image.alpha_composite(composite, plates[name])
    save_webp(composite, qa_dir / "static-composite.webp", quality=94)

    contrast = Image.new("RGBA", (width, height), "#d02bff")
    alpha_checks = ["10-landscape", "20-midground", "30-hero", "40-foreground-left", "41-foreground-right"]
    for name in alpha_checks:
        save_webp(Image.alpha_composite(contrast, plates[name]), qa_dir / f"{name}-alpha-check.webp", quality=92)

    desktop_files = [*layers_dir.glob("*.webp"), output / "poster.webp"]
    mobile_files = [*mobile_dir.glob("*.webp"), output / "mobile-poster.webp"]
    manifest = {
        "id": "depth-camera-salt-portal-v2",
        "mode": "sequential-registered-webgl-planes",
        "dimensions": {
            "width": width,
            "height": height,
            "aspectRatio": round(width / height, 5),
        },
        "registeredCamera": True,
        "source": {name: f"source/{filename}" for name, filename in SOURCE_NAMES.items()},
        "generation": {
            "mode": "Codex built-in ImageGen",
            "workflow": "background-first sequential registered edits; every composite edits the immediately prior approved image",
        },
        "poster": "poster.webp",
        "mobilePoster": "mobile-poster.webp",
        "layers": [
            {"id": "00-sky", "plane": "back", "depth": -2.4, "role": "opaque atmospheric base"},
            {"id": "10-landscape", "plane": "back", "depth": -1.6, "role": "distant registered ridges"},
            {"id": "20-midground", "plane": "back", "depth": -0.8, "role": "registered salt terraces"},
            {"id": "29-contact-reflection", "plane": "front", "depth": -0.08, "role": "hero contact and reflection"},
            {"id": "30-hero", "plane": "front", "depth": 0.0, "role": "registered obsidian portal"},
            {"id": "40-foreground-left", "plane": "front", "depth": 0.75, "role": "near left occluder"},
            {"id": "41-foreground-right", "plane": "front", "depth": 0.9, "role": "near right occluder"},
            {"id": "50-edge-frame", "plane": "front", "depth": 1.05, "role": "near-lens lower edge integration"},
        ],
        "extraction": {
            "method": "sequential composite difference, region-constrained proportional alpha and edge unmatting",
            "fullCanvas": True,
            "hiddenAreaBleed": True,
            "independentlyGeneratedLayers": False,
            "alphaEncoding": "lossless WebP",
        },
        "deliveryBytes": {
            "desktop": sum(path.stat().st_size for path in desktop_files),
            "mobile": sum(path.stat().st_size for path in mobile_files),
        },
        "qa": {
            "staticComposite": "qa/static-composite.webp",
            "alphaChecks": [f"qa/{name}-alpha-check.webp" for name in alpha_checks],
        },
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()

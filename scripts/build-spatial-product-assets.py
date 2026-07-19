#!/usr/bin/env python3
"""Remove a baked checkerboard and build registered respirator part plates."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def polygon(size: tuple[int, int], points: list[tuple[int, int]]) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return mask


def ellipse(size: tuple[int, int], box: tuple[int, int, int, int]) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).ellipse(box, fill=255)
    return mask


def subject_mask(image: Image.Image) -> Image.Image:
    luminance = np.asarray(image.convert("L"), dtype=np.uint8)
    core = Image.fromarray(np.where(luminance < 229, 255, 0).astype(np.uint8), "L")
    # Keep the component connected to the dark grille at the image center.
    flood = core.copy()
    ImageDraw.floodfill(flood, (image.width // 2, round(image.height * 0.56)), 128, thresh=0)
    connected = flood.point(lambda value: 255 if value == 128 else 0)
    connected = connected.filter(ImageFilter.MaxFilter(3))
    # Fill bright metal highlights enclosed by the connected silhouette.
    inverse = ImageChops.invert(connected)
    exterior = inverse.copy()
    ImageDraw.floodfill(exterior, (0, 0), 128, thresh=0)
    holes = exterior.point(lambda value: 255 if value == 255 else 0)
    filled = ImageChops.lighter(connected, holes)
    return filled.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.75))


def save_plate(rgb: Image.Image, subject: Image.Image, region: Image.Image, path: Path) -> None:
    alpha = ImageChops.multiply(subject, region.filter(ImageFilter.GaussianBlur(1.4)))
    rgba = rgb.convert("RGBA")
    rgba.putalpha(alpha)
    rgba.save(path, "WEBP", quality=88, method=6, exact=True)


def main() -> None:
    args = parse_args()
    image = Image.open(args.source).convert("RGB")
    image = image.resize((1024, 1024), Image.Resampling.LANCZOS)
    width, height = image.size
    output = args.output
    output.mkdir(parents=True, exist_ok=True)
    subject = subject_mask(image)
    subject.save(output / "mask.png")

    left_filter = ellipse((width, height), (110, 430, 355, 770))
    right_filter = ellipse((width, height), (669, 430, 914, 770))
    center = polygon((width, height), [(410, 135), (614, 135), (715, 410), (676, 860), (512, 930), (348, 860), (309, 410)])
    used = ImageChops.lighter(center, ImageChops.lighter(left_filter, right_filter))
    remainder = ImageChops.subtract(subject, used)
    left_half = polygon((width, height), [(0, 0), (512, 0), (512, 1024), (0, 1024)])
    right_half = ImageChops.invert(left_half)
    regions = {
        "10-left-filter": left_filter,
        "20-left-shell": ImageChops.multiply(remainder, left_half),
        "30-center-core": center,
        "40-right-shell": ImageChops.multiply(remainder, right_half),
        "50-right-filter": right_filter,
    }
    for name, region in regions.items():
        save_plate(image, subject, region, output / f"{name}.webp")

    full = image.convert("RGBA")
    full.putalpha(subject)
    full.save(output / "assembled.webp", "WEBP", quality=90, method=6, exact=True)
    checker = Image.new("RGBA", image.size, "#d9f4f7")
    for name in regions:
        plate = Image.open(output / f"{name}.webp").convert("RGBA")
        checker = Image.alpha_composite(checker, plate)
    checker.save(output / "qa-composite.webp", "WEBP", quality=92, method=6)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Batch anonymise UI overlays in images.

Pipeline:
  1) Detect near-white rectangular UI boxes via CV (no fixed coordinates).
  2) If detected with sufficient confidence, expand bbox slightly and inpaint.
  3) If not detected, copy image unchanged.
  4) Optionally write debug overlays and a CSV report.

Supports: .jpg/.jpeg/.png/.webp (WebP requires a build of OpenCV with WebP support;
falls back to Pillow if available).

Usage:
  python scripts/anonymise_map_overlays.py \
    --input_dir ./input_images \
    --output_dir ./output_anonymised \
    --debug_dir ./debug_overlays \
    --report_csv ./report.csv \
    --debug_every_n 50

  # Single file
  python scripts/anonymise_map_overlays.py \
    --input_file ./input_images/example.jpg \
    --output_dir ./output_anonymised \
    --debug_dir ./debug_overlays \
    --debug_every_n 1
"""

from __future__ import annotations

import argparse
import csv
import os
from pathlib import Path
from typing import Optional, Tuple

import cv2
import numpy as np

try:
    from tqdm import tqdm  # type: ignore
except Exception:
    tqdm = None

BBox = Tuple[int, int, int, int]  # x, y, w, h


def imread_any(path: Path) -> Optional[np.ndarray]:
    """Read image with OpenCV; fallback to Pillow for WebP if needed."""
    img = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if img is not None:
        return img

    # Fallback (useful if OpenCV lacks WebP support)
    try:
        from PIL import Image  # type: ignore
    except Exception:
        return None

    try:
        with Image.open(path) as im:
            im = im.convert("RGB")
            arr = np.array(im)
            # Pillow gives RGB; OpenCV expects BGR
            return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
    except Exception:
        return None


def imwrite_jpg_or_same(out_path: Path, img_bgr: np.ndarray, quality: int = 92) -> bool:
    """Write as JPG if out_path endswith .jpg/.jpeg, otherwise use OpenCV default for extension."""
    ext = out_path.suffix.lower()
    if ext in {".jpg", ".jpeg"}:
        return bool(cv2.imwrite(str(out_path), img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), int(quality)]))
    return bool(cv2.imwrite(str(out_path), img_bgr))


def expand_bbox(bbox: BBox, w: int, h: int, pad: int) -> BBox:
    x, y, bw, bh = bbox
    x2 = max(0, x - pad)
    y2 = max(0, y - pad)
    x3 = min(w, x + bw + pad)
    y3 = min(h, y + bh + pad)
    return (x2, y2, x3 - x2, y3 - y2)


def detect_spoiler_boxes(
    img_bgr: np.ndarray,
    *,
    bottom_left_weight: float,
    min_area_frac: float,
    max_area_frac: float,
    lab_l_threshold: int,
    min_score: float,
    min_dark_frac: float,
    min_white_frac: float,
    ab_threshold: int,
    max_ab_mean: float,
    min_rectness: float,
    ar_min: float,
    ar_max: float,
    max_boxes: int,
) -> Tuple[list[BBox], float]:
    """
    Detect a bright (near-white) rectangular UI box.
    Returns (bbox or None, best_score).
    """
    h, w = img_bgr.shape[:2]
    img_area = float(h * w)

    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    L, A, B = cv2.split(lab)

    # Threshold for bright, near-neutral regions (UI panels)
    if ab_threshold > 0:
        a_dev = np.abs(A.astype(np.int16) - 128)
        b_dev = np.abs(B.astype(np.int16) - 128)
        mask = ((L >= lab_l_threshold) & (a_dev <= ab_threshold) & (b_dev <= ab_threshold)).astype(np.uint8) * 255
    else:
        _, mask = cv2.threshold(L, lab_l_threshold, 255, cv2.THRESH_BINARY)

    def position_score(cx: float, cy: float) -> float:
        norm_left = 1.0 - (cx / w)    # 1 near left edge
        norm_bottom = (cy / h)        # 1 near bottom edge
        norm_top = 1.0 - (cy / h)     # 1 near top edge
        bottom_left_score = (norm_left + norm_bottom) / 2.0
        top_left_score = (norm_left + norm_top) / 2.0
        return max(bottom_left_score, top_left_score)

    def try_add_candidate(
        x: int,
        y: int,
        bw: int,
        bh: int,
        *,
        rectness: float,
    ) -> None:
        nonlocal best_score
        area = float(bw * bh)
        area_frac = area / img_area
        if area_frac < min_area_frac or area_frac > max_area_frac:
            return
        if rectness < min_rectness:
            return

        ar = float(bw) / (float(bh) + 1e-6)
        if ar < ar_min or ar > ar_max:
            return

        cx = x + bw / 2.0
        cy = y + bh / 2.0
        if cx > (w * 0.6):
            return
        if not (cy < (h * 0.3) or cy > (h * 0.75)):
            return
        pos_score = position_score(cx, cy)

        patch = img_bgr[y : y + bh, x : x + bw]
        gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
        dark_frac = float(np.mean(gray < 120))
        if dark_frac < min_dark_frac:
            return

        patch_lab = lab[y : y + bh, x : x + bw]
        Lp, Ap, Bp = cv2.split(patch_lab)
        white_frac = float(np.mean(Lp >= lab_l_threshold))
        if white_frac < min_white_frac:
            return

        mean_abs_a = float(np.mean(np.abs(Ap.astype(np.float32) - 128.0)))
        mean_abs_b = float(np.mean(np.abs(Bp.astype(np.float32) - 128.0)))
        if ((mean_abs_a + mean_abs_b) / 2.0) > max_ab_mean:
            return

        score = (rectness * 2.0) + (pos_score * bottom_left_weight) + (dark_frac * 0.5)
        if score > best_score:
            best_score = score
        if score >= min_score:
            candidates.append((score, (x, y, bw, bh)))

    def bbox_iou(a: BBox, b: BBox) -> float:
        ax, ay, aw, ah = a
        bx, by, bw, bh = b
        ax2, ay2 = ax + aw, ay + ah
        bx2, by2 = bx + bw, by + bh
        ix1, iy1 = max(ax, bx), max(ay, by)
        ix2, iy2 = min(ax2, bx2), min(ay2, by2)
        iw, ih = max(0, ix2 - ix1), max(0, iy2 - iy1)
        inter = iw * ih
        union = (aw * ah) + (bw * bh) - inter
        return inter / union if union > 0 else 0.0

    # Merge + cleanup
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    candidates: list[Tuple[float, BBox]] = []
    best_score: float = -1.0

    for cnt in contours:
        x, y, bw, bh = cv2.boundingRect(cnt)
        cnt_area = float(cv2.contourArea(cnt))
        rectness = cnt_area / (float(bw * bh) + 1e-6)
        try_add_candidate(x, y, bw, bh, rectness=rectness)

    # Edge-based rectangles for UI overlays on bright backgrounds
    gray_full = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray_full, 50, 150)
    edges = cv2.dilate(edges, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)), iterations=1)
    edge_contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in edge_contours:
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) != 4 or not cv2.isContourConvex(approx):
            continue
        x, y, bw, bh = cv2.boundingRect(approx)
        rectness = float(cv2.contourArea(approx)) / (float(bw * bh) + 1e-6)
        try_add_candidate(x, y, bw, bh, rectness=rectness)

    # Text-driven candidates for UI cards on bright backgrounds
    dark_mask = (gray_full < 80).astype(np.uint8) * 255
    text_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 3))
    dark_mask = cv2.morphologyEx(dark_mask, cv2.MORPH_CLOSE, text_kernel, iterations=2)

    regions = [
        (0, int(h * 0.75), int(w * 0.45), h, "bottom_left"),
        (0, 0, int(w * 0.45), int(h * 0.3), "top_left"),
    ]
    for x0, y0, x1, y1, region_name in regions:
        roi = dark_mask[y0:y1, x0:x1]
        roi_contours, _ = cv2.findContours(roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in roi_contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            if (bw * bh) < 200:
                continue
            gx, gy = x0 + x, y0 + y
            if region_name == "bottom_left" and gx > (w * 0.25):
                continue
            if region_name == "top_left" and gx > (w * 0.35):
                continue
            if region_name == "bottom_left":
                pad_x = max(20, int(bw * 0.6))
                pad_top = max(20, int(bh * 1.0))
                pad_bottom = max(80, int(bh * 4.0))
            else:
                pad_x = max(20, int(bw * 0.4))
                pad_top = max(15, int(bh * 0.8))
                pad_bottom = max(15, int(bh * 1.2))
            ex1 = max(0, gx - pad_x)
            ey1 = max(0, gy - pad_top)
            ex2 = min(w, gx + bw + pad_x)
            ey2 = min(h, gy + bh + pad_bottom)
            if region_name == "bottom_left":
                ex_w = ex2 - ex1
                ex_h = ey2 - ey1
                if ex_h <= 0 or (ex_w / ex_h) < 2.0:
                    continue
            try_add_candidate(ex1, ey1, ex2 - ex1, ey2 - ey1, rectness=1.0)

    if not candidates:
        return [], best_score

    candidates.sort(key=lambda item: item[0], reverse=True)
    deduped: list[Tuple[float, BBox]] = []
    for score, bbox in candidates:
        if any(bbox_iou(bbox, kept) > 0.6 for _, kept in deduped):
            continue
        deduped.append((score, bbox))

    if max_boxes > 0:
        deduped = deduped[:max_boxes]

    return [bbox for _, bbox in deduped], best_score


def inpaint_bboxes(
    img_bgr: np.ndarray,
    bboxes: list[BBox],
    *,
    expand_px: int,
    radius: int,
    method: str,
) -> Tuple[np.ndarray, list[BBox]]:
    h, w = img_bgr.shape[:2]

    inpaint_mask = np.zeros((h, w), dtype=np.uint8)
    used_bboxes: list[BBox] = []
    for bbox in bboxes:
        x, y, bw, bh = expand_bbox(bbox, w, h, expand_px)
        inpaint_mask[y : y + bh, x : x + bw] = 255
        used_bboxes.append((x, y, bw, bh))

    flag = cv2.INPAINT_TELEA if method.lower() == "telea" else cv2.INPAINT_NS
    out = cv2.inpaint(img_bgr, inpaint_mask, float(radius), flag)
    return out, used_bboxes


def write_debug_overlay(debug_path: Path, img_bgr: np.ndarray, bboxes: list[BBox], score: float) -> None:
    dbg = img_bgr.copy()
    h, w = dbg.shape[:2]
    label = f"score={score:.2f} " + ("MASK" if bboxes else "PASS")
    cv2.putText(dbg, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 4, cv2.LINE_AA)
    cv2.putText(dbg, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2, cv2.LINE_AA)

    if bboxes:
        for idx, (x, y, bw, bh) in enumerate(bboxes):
            color = (0, 255, 0) if idx == 0 else (0, 200, 255)
            cv2.rectangle(dbg, (x, y), (x + bw, y + bh), color, 2)

        # also draw a subtle guide box for "bottom-left-ish" quadrant
        cv2.rectangle(dbg, (0, h // 2), (w // 2, h), (255, 255, 255), 1)

    cv2.imwrite(str(debug_path), dbg)


def iter_images(input_dir: Path, exts: set[str]) -> list[Path]:
    files = [p for p in input_dir.rglob("*") if p.is_file() and p.suffix.lower() in exts]
    files.sort()
    return files


def normalize_output_ext(output_ext: str) -> str:
    cleaned = output_ext.strip()
    if not cleaned:
        return ""
    return cleaned if cleaned.startswith(".") else f".{cleaned}"


def build_output_path(
    path: Path,
    *,
    input_root: Optional[Path],
    output_dir: Path,
    output_ext: str,
    flat_output: bool,
) -> Path:
    out_name = path.stem + output_ext if output_ext else path.name
    if flat_output or input_root is None:
        return output_dir / out_name
    rel = path.relative_to(input_root)
    return output_dir / rel.with_name(out_name)


def build_debug_path(
    path: Path,
    *,
    input_root: Optional[Path],
    debug_dir: Path,
    flat_output: bool,
) -> Path:
    dbg_name = f"{path.stem}_debug.jpg"
    if flat_output or input_root is None:
        return debug_dir / dbg_name
    rel = path.relative_to(input_root)
    return debug_dir / rel.with_name(dbg_name)


def main() -> None:
    ap = argparse.ArgumentParser()
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument("--input_dir", type=Path, help="Directory of images to process")
    group.add_argument("--input_file", type=Path, help="Single image file to process")
    ap.add_argument("--output_dir", type=Path, required=True)
    ap.add_argument("--debug_dir", type=Path, default=None)
    ap.add_argument("--report_csv", type=Path, default=None)
    ap.add_argument("--dry_run", action="store_true", help="Do not write outputs; only report/debug")

    # Detector knobs
    ap.add_argument("--lab_l_threshold", type=int, default=210, help="Brightness threshold in Lab L channel")
    ap.add_argument("--min_area_frac", type=float, default=0.002)
    ap.add_argument("--max_area_frac", type=float, default=0.08)
    ap.add_argument("--bottom_left_weight", type=float, default=2.0)
    ap.add_argument("--ar_min", type=float, default=0.6)
    ap.add_argument("--ar_max", type=float, default=12.0)
    ap.add_argument("--min_score", type=float, default=1.5, help="Reject weak candidates to avoid false positives")
    ap.add_argument("--min_dark_frac", type=float, default=0.01, help="Require some dark text inside bright box")
    ap.add_argument("--min_white_frac", type=float, default=0.55, help="Require mostly bright background in box")
    ap.add_argument("--ab_threshold", type=int, default=18, help="Per-pixel Lab A/B neutral threshold")
    ap.add_argument("--max_ab_mean", type=float, default=20.0, help="Reject colored boxes (Lab A/B distance)")
    ap.add_argument("--min_rectness", type=float, default=0.7, help="Reject non-rectangular bright regions")
    ap.add_argument("--max_boxes", type=int, default=0, help="Max number of boxes to mask (0 = no limit)")

    # Inpaint knobs
    ap.add_argument("--expand_px", type=int, default=12)
    ap.add_argument("--inpaint_radius", type=int, default=3)
    ap.add_argument("--inpaint_method", choices=["telea", "ns"], default="telea")

    # IO knobs
    ap.add_argument(
        "--output_ext",
        type=str,
        default="",
        help="Force output extension (e.g. .jpg, .png, .webp). Leave empty to preserve input extension.",
    )
    ap.add_argument("--flat_output", action="store_true", help="Do not preserve input folder structure in output")
    ap.add_argument("--jpg_quality", type=int, default=92)
    ap.add_argument("--debug_every_n", type=int, default=50)

    args = ap.parse_args()

    output_dir: Path = args.output_dir
    debug_dir: Optional[Path] = args.debug_dir
    report_csv: Optional[Path] = args.report_csv
    output_ext = normalize_output_ext(args.output_ext)

    exts = {".jpg", ".jpeg", ".png", ".webp"}

    input_dir: Optional[Path] = args.input_dir
    input_file: Optional[Path] = args.input_file
    input_root: Optional[Path] = None

    if input_dir is not None:
        if not input_dir.exists():
            raise SystemExit(f"Input dir does not exist: {input_dir}")
        input_root = input_dir
    elif input_file is not None:
        if not input_file.exists():
            raise SystemExit(f"Input file does not exist: {input_file}")
        if not input_file.is_file():
            raise SystemExit(f"Input file is not a file: {input_file}")
        input_root = input_file.parent

    if not args.dry_run:
        output_dir.mkdir(parents=True, exist_ok=True)
    if debug_dir is not None:
        debug_dir.mkdir(parents=True, exist_ok=True)

    if input_dir is not None:
        files = iter_images(input_dir, exts)
        if not files:
            raise SystemExit(f"No images found in {input_dir} with extensions {sorted(exts)}")
    else:
        assert input_file is not None
        if input_file.suffix.lower() not in exts:
            raise SystemExit(f"Input file extension not supported: {input_file.suffix}")
        files = [input_file]

    report_rows = []
    masked = 0
    passed = 0
    failed_read = 0

    use_tqdm = tqdm is not None
    iterable = tqdm(files, desc="Processing", unit="img") if use_tqdm else files

    for idx, path in enumerate(iterable, start=1):
        img = imread_any(path)
        if img is None:
            failed_read += 1
            report_rows.append({
                "file": str(path),
                "status": "read_failed",
                "score": "",
                "bbox_x": "", "bbox_y": "", "bbox_w": "", "bbox_h": "",
                "bbox_count": "",
            })
            continue

        bboxes, score = detect_spoiler_boxes(
            img,
            bottom_left_weight=args.bottom_left_weight,
            min_area_frac=args.min_area_frac,
            max_area_frac=args.max_area_frac,
            lab_l_threshold=args.lab_l_threshold,
            min_score=args.min_score,
            min_dark_frac=args.min_dark_frac,
            min_white_frac=args.min_white_frac,
            ab_threshold=int(args.ab_threshold),
            max_ab_mean=args.max_ab_mean,
            min_rectness=args.min_rectness,
            ar_min=args.ar_min,
            ar_max=args.ar_max,
            max_boxes=int(args.max_boxes),
        )

        # Either inpaint (if bbox) or pass-through unchanged
        out_img = img
        used_bboxes: list[BBox] = []
        status = "passed_through"

        if bboxes:
            out_img, used_bboxes = inpaint_bboxes(
                img,
                bboxes,
                expand_px=args.expand_px,
                radius=args.inpaint_radius,
                method=args.inpaint_method,
            )
            status = "masked"
            masked += 1
        else:
            passed += 1

        # Write output
        out_path = build_output_path(
            path,
            input_root=input_root,
            output_dir=output_dir,
            output_ext=output_ext,
            flat_output=args.flat_output,
        )

        if not args.dry_run:
            out_path.parent.mkdir(parents=True, exist_ok=True)
            ok = imwrite_jpg_or_same(out_path, out_img, quality=args.jpg_quality)
            if not ok:
                status = "write_failed"

        # Debug overlay occasionally
        if debug_dir is not None and (idx % int(args.debug_every_n) == 0):
            dbg_path = build_debug_path(
                path,
                input_root=input_root,
                debug_dir=debug_dir,
                flat_output=args.flat_output,
            )
            dbg_path.parent.mkdir(parents=True, exist_ok=True)
            write_debug_overlay(dbg_path, img, used_bboxes, score)

        # Report row
        if used_bboxes:
            x, y, bw, bh = used_bboxes[0]
            bbox_count = len(used_bboxes)
        else:
            x = y = bw = bh = ""
            bbox_count = 0

        report_rows.append({
            "file": str(path),
            "status": status,
            "score": f"{score:.4f}",
            "bbox_x": x, "bbox_y": y, "bbox_w": bw, "bbox_h": bh,
            "bbox_count": bbox_count,
        })

        if (not use_tqdm) and (idx % 100 == 0):
            print(f"Processed {idx}/{len(files)}... (masked={masked}, passed={passed}, read_failed={failed_read})")

    print(f"Done. total={len(files)} masked={masked} passed={passed} read_failed={failed_read}")

    # Write CSV report
    if report_csv is not None:
        if not args.dry_run:
            report_csv.parent.mkdir(parents=True, exist_ok=True)
        if not args.dry_run:
            with open(report_csv, "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(
                    f,
                    fieldnames=["file", "status", "score", "bbox_x", "bbox_y", "bbox_w", "bbox_h", "bbox_count"],
                )
                w.writeheader()
                w.writerows(report_rows)
            print(f"Wrote report: {report_csv}")
        else:
            print("Dry-run: report_csv requested but not written (use without --dry_run to write).")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Looping random non-overlapping collage generator that writes to collage_data.js
(no preview images, no final collage image).

Adds:
- avg_w / avg_h saved in each entry (mean placed image width/height, pixels)
- MIN_FILL_PCT threshold; entries below are skipped
- VERBOSE toggle to suppress prints for long runs

Requires: Pillow (pip install pillow)
"""

import json
import random
import time
from pathlib import Path
from typing import List, Tuple, Dict
from dataclasses import dataclass
from collections import OrderedDict
from PIL import Image

# =======================
# CONFIG
# =======================
COLLAGE_W = 7500
COLLAGE_H = 7500

MIN_IMG_DIM   = 500      # minimum chosen longest side per image
MAX_IMG_DIM   = 700      # maximum chosen longest side per image
FAIL_LIMIT    = 10000      # stop a run after this many consecutive placement failures
PADDING       = 12        # spacing buffer around each placed image (overlap test only)

MIN_FILL_PCT  = 50     # <-- do not save runs whose fill_pct is below this threshold
VERBOSE       = False    # <-- set False for quiet mode (no printing)
LOOP_SLEEP_SEC = 0       # pause between runs

# Script is in: website/config/collage
ROOT            = Path(__file__).parent.parent.parent   # -> website/

INPUT_DIR       = ROOT / "images" / "collage"
COLLAGE_DATA_JS = ROOT / "config" / "collage" / "collage_data.js"

# Acceptable image file extensions
EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".tif", ".tiff"}

# =======================
# Data structures
# =======================
@dataclass
class Rect:
    x: int
    y: int
    w: int  # width
    h: int  # height

def log(*args):
    if VERBOSE:
        print(*args)

# =======================
# Helpers
# =======================
def list_images(folder: Path) -> List[Path]:
    return [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in EXTS]

def scale_to_target_longest(w: int, h: int, target_longest: int) -> Tuple[int, int]:
    target_longest = max(1, int(target_longest))
    cur_long = max(w, h)
    if cur_long == 0:
        return 1, 1
    s = target_longest / float(cur_long)
    nw = max(1, int(round(w * s)))
    nh = max(1, int(round(h * s)))
    return nw, nh

def overlap(a: Rect, b: Rect) -> bool:
    return not (b.x >= a.x + a.w or
                b.x + b.w <= a.x or
                b.y >= a.y + a.h or
                b.y + b.h <= a.y)

def compute_fill_pct(rects: List[Rect]) -> float:
    covered = sum(r.w * r.h for r in rects)
    total   = COLLAGE_W * COLLAGE_H
    return (covered / total) * 100.0 if total > 0 else 0.0

def compute_avg_wh(rects: List[Rect]) -> Tuple[float, float]:
    if not rects:
        return 0.0, 0.0
    n = len(rects)
    avg_w = sum(r.w for r in rects) / n
    avg_h = sum(r.h for r in rects) / n
    return avg_w, avg_h

# =======================
# JS file helpers
# =======================
def load_existing_js_entries(js_path: Path) -> List[Dict]:
    """
    Read collage_data.js which looks like:
      window.COLLAGE_DATA = [ {...}, {...} ];
    Extract the JSON array and parse it.
    """
    if not js_path.exists():
        return []
    try:
        text = js_path.read_text(encoding="utf-8")
        lb = text.find('[')
        rb = text.rfind(']')
        if lb == -1 or rb == -1 or rb < lb:
            return []
        arr_text = text[lb:rb+1]
        data = json.loads(arr_text)
        if isinstance(data, list):
            return data
    except Exception:
        return []
    return []

def write_js_entries(js_path: Path, entries: List[Dict]) -> None:
    """
    Sort by fill_pct desc, assign top_collage (1..N),
    and write as window.COLLAGE_DATA = [...];
    """
    entries.sort(key=lambda e: e.get("fill_pct", 0.0), reverse=True)
    for i, e in enumerate(entries, start=1):
        e["top_collage"] = i
    payload = "window.COLLAGE_DATA = " + json.dumps(entries, indent=2) + ";\n"
    js_path.write_text(payload, encoding="utf-8")
    log(f"[Data] Wrote {js_path} with {len(entries)} entries (ranked).")

# =======================
# One run
# =======================
def run_once_and_summarize() -> Dict:
    """
    Generates one collage's placement (no image output), returns an OrderedDict entry:
      {
        "top_collage": 0,      # placeholder; set during write
        "fill_pct":    float,
        "avg_w":       float,  # mean placed width
        "avg_h":       float,  # mean placed height
        "image_data":  { "file.png": [x, y, l(height), w(width)], ... }
      }
    """
    if MIN_IMG_DIM > MAX_IMG_DIM:
        raise SystemExit("MIN_IMG_DIM cannot be greater than MAX_IMG_DIM.")
    if not INPUT_DIR.exists():
        raise SystemExit(f"Input folder not found: {INPUT_DIR}")

    remaining = list_images(INPUT_DIR)
    if not remaining:
        raise SystemExit("No images found in 'collage' folder.")
    random.shuffle(remaining)

    placed_rects: List[Rect] = []
    image_data: Dict[str, List[int]] = {}
    consecutive_fails = 0

    while remaining and consecutive_fails < FAIL_LIMIT:
        img_path = random.choice(remaining)

        # only need original size for scaling
        try:
            with Image.open(img_path) as im:
                w0, h0 = im.size
        except Exception:
            remaining.remove(img_path)
            continue

        canvas_cap = min(COLLAGE_W, COLLAGE_H) - 2 * PADDING
        canvas_cap = max(1, canvas_cap)
        target_longest = random.randint(MIN_IMG_DIM, min(MAX_IMG_DIM, canvas_cap))

        nw, nh = scale_to_target_longest(w0, h0, target_longest)
        if nw > COLLAGE_W or nh > COLLAGE_H:
            remaining.remove(img_path)
            continue

        x = random.randint(0, COLLAGE_W - nw)
        y = random.randint(0, COLLAGE_H - nh)

        # Padded collision rect
        cand = Rect(x - PADDING, y - PADDING, nw + 2 * PADDING, nh + 2 * PADDING)
        # Clamp padding to canvas
        if cand.x < 0:
            cand.w += cand.x
            cand.x = 0
        if cand.y < 0:
            cand.h += cand.y
            cand.y = 0
        if cand.x + cand.w > COLLAGE_W:
            cand.w = COLLAGE_W - cand.x
        if cand.y + cand.h > COLLAGE_H:
            cand.h = COLLAGE_H - cand.y

        if any(overlap(cand, r) for r in placed_rects):
            consecutive_fails += 1
            continue

        # success
        placed_rects.append(Rect(x, y, nw, nh))
        image_data[img_path.name] = [int(x), int(y), int(nh), int(nw)]
        remaining.remove(img_path)
        consecutive_fails = 0

    fill_pct = round(compute_fill_pct(placed_rects), 4)
    avg_w, avg_h = compute_avg_wh(placed_rects)
    avg_w = round(avg_w, 2)
    avg_h = round(avg_h, 2)

    log(f"[Run] images={len(image_data)} fill_pct={fill_pct} avg_w={avg_w} avg_h={avg_h}")

    # Compose in a fixed key order (so avg fields appear near top)
    entry = OrderedDict()
    entry["top_collage"] = 0                 # will be assigned during write
    entry["fill_pct"]    = fill_pct
    entry["avg_w"]       = avg_w
    entry["avg_h"]       = avg_h
    entry["image_data"]  = image_data
    return entry

# =======================
# Main loop
# =======================
def main():
    random.seed()
    log("Starting data generator. Press Ctrl+C to stop.")

    try:
        while True:
            entry = run_once_and_summarize()

            # Skip saving if below threshold
            if entry["fill_pct"] < MIN_FILL_PCT:
                log(f"[Skip] fill_pct {entry['fill_pct']} < MIN_FILL_PCT {MIN_FILL_PCT}")
                time.sleep(LOOP_SLEEP_SEC)
                continue

            entries = load_existing_js_entries(COLLAGE_DATA_JS)
            entries.append(entry)
            write_js_entries(COLLAGE_DATA_JS, entries)
            time.sleep(LOOP_SLEEP_SEC)
    except KeyboardInterrupt:
        log("\nStopped by user.")

if __name__ == "__main__":
    main()

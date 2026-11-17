#!/usr/bin/env python3
import re
import json

# ---------- CONFIG ----------
THRESHOLD = 50.0   # e.g., 50 means 50%
TOP_N     = 1000      # 0 means "no limit"; otherwise keep only the top N by fill_pct
REINDEX_TOP = True # If True, rewrite top_collage to 1..len(filtered) in sorted order
# ----------------------------

infile  = "collage_data.js"
outfile = "collage_data_filtered.js"

# Read the JS file
with open(infile, "r", encoding="utf-8") as f:
    text = f.read()

# Extract JSON-like payload between assignment and semicolon
m = re.search(r"window\.COLLAGE_DATA\s*=\s*(\[.*\]);?", text, re.S)
if not m:
    raise RuntimeError("Could not find window.COLLAGE_DATA assignment")

data_str = m.group(1)

# Parse as JSON
entries = json.loads(data_str)

# 1) Filter by threshold
filtered = [e for e in entries if e.get("fill_pct", 0.0) >= THRESHOLD]

# 2) Sort by fill_pct descending (stable for ties)
filtered.sort(key=lambda e: e.get("fill_pct", 0.0), reverse=True)

# 3) Take top N if requested
if isinstance(TOP_N, int) and TOP_N > 0:
    filtered = filtered[:TOP_N]

# 4) Optionally reindex top_collage to 1..k
if REINDEX_TOP:
    for i, e in enumerate(filtered, start=1):
        e["top_collage"] = i

print(f"Threshold: {THRESHOLD}%")
print(f"Original entries: {len(entries)}, after threshold: {len([e for e in entries if e.get('fill_pct',0.0) >= THRESHOLD])}, kept: {len(filtered)}")
if TOP_N > 0:
    print(f"Applied TOP_N cap: {TOP_N}")

# Re-wrap as JS
out_text = "window.COLLAGE_DATA = " + json.dumps(filtered, indent=2) + ";"

# Write to new file
with open(outfile, "w", encoding="utf-8") as f:
    f.write(out_text)

print(f"Wrote: {outfile}")

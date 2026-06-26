import os
import sys
import uuid
from pathlib import Path
import tkinter as tk
from tkinter import filedialog

# --- Settings ---------------------------------------------------------------
ALLOWED_EXTS = {".png", ".jpg", ".jpeg", ".webp"}  # set() -> allow everything
START_INDEX  = 1                                    # first number to assign
# ---------------------------------------------------------------------------

def select_folder():
    root = tk.Tk()
    root.withdraw()
    folder = filedialog.askdirectory(title="Select Input Directory")
    return Path(folder) if folder else None

def is_candidate(p: Path) -> bool:
    return p.is_file() and (not ALLOWED_EXTS or p.suffix.lower() in ALLOWED_EXTS)

def creation_key(p: Path):
    # Windows: st_ctime = creation time; other OS: change time.
    # If you prefer last-modified, use p.stat().st_mtime
    return p.stat().st_ctime

def main():
    folder = select_folder()
    if not folder:
        print("No folder selected. Exiting.")
        return

    files = [p for p in folder.iterdir() if is_candidate(p)]
    if not files:
        print("No matching files found.")
        return

    # Sort by creation time
    files.sort(key=creation_key)

    # Make unique temporary names map
    temp_map = {}
    temp_prefix = "__ren_tmp__"
    for p in files:
        tmp = folder / f"{temp_prefix}{uuid.uuid4().hex}{p.suffix.lower()}"
        temp_map[p] = tmp

    # PASS 1: rename originals -> temps
    # This removes any chance of overwriting since names are unique.
    for src, tmp in temp_map.items():
        try:
            src.rename(tmp)
        except Exception as e:
            print(f"ERROR: could not temp-rename {src.name} -> {tmp.name}: {e}")
            # Try to roll back what we can
            for s, t in temp_map.items():
                if t.exists() and not s.exists():
                    try:
                        t.rename(s)
                    except Exception:
                        pass
            sys.exit(1)

    # Build final names in order
    temps_in_order = [temp_map[p] for p in files]
    final_map = {}
    idx = START_INDEX
    for tmp in temps_in_order:
        final = folder / f"{idx}{tmp.suffix.lower()}"
        final_map[tmp] = final
        idx += 1

    # Safety check: if any final name already exists (and isn’t one of our temps),
    # abort to avoid clobbering unrelated files.
    occupied = {f.name for f in folder.iterdir() if f.is_file()}
    temp_names = {t.name for t in temps_in_order}
    for final in final_map.values():
        if final.name in occupied and final.name not in temp_names:
            print(f"ERROR: Destination file already exists and is not one of the temp files: {final.name}")
            print("Move or rename that file and run again. No changes applied.")
            # Roll back temps -> original names
            for orig, tmp in temp_map.items():
                if tmp.exists() and not orig.exists():
                    try:
                        tmp.rename(orig)
                    except Exception:
                        pass
            sys.exit(1)

    # PASS 2: rename temps -> finals
    for tmp, final in final_map.items():
        try:
            tmp.rename(final)
            print(f"{final.name}")
        except Exception as e:
            print(f"ERROR: could not finalize {tmp.name} -> {final.name}: {e}")
            # Best-effort: leave remaining temps untouched so you can recover.
            sys.exit(1)

    print("Renaming complete.")

if __name__ == "__main__":
    main()

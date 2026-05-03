#!/usr/bin/env python3
"""
fix_charging_files.py
Run from the root of your repo.

USAGE:
  python3 fix_charging_files.py           # Fix front matter only, no renaming
  python3 fix_charging_files.py --rename  # Fix front matter AND rename files

The --rename option:
  - Reads date and vehicle from each file's front matter
  - Sorts all files chronologically, then by vehicle name
  - Renames to YYYY-MM-DD-{vehicle-slug}-N.md
    e.g.  2025-10-01-rjb-gt-1.md
          2025-10-01-lrb-gt-1.md
  - N is per-vehicle per-day (RJB and LRB each start at 1 on a given day)
  - Prints a full preview before asking you to confirm

VEHICLE SLUG MAP (edit if you add new vehicles):
  "2025 Mach-E GT"        -> rjb-gt
  "2026 Mach-E SR"        -> rjb-gt
  "LRB's 2025 Mach-E GT"  -> lrb-gt
  "LRB's 2026 Mach-E SR"  -> lrb-gt
"""

import os
import re
import glob
import sys

CHARGING_DIR   = "_charging"
DEFAULT_VEHICLE = "2025 Mach-E GT"

# New optional detail fields added 2026-05.
# Added to every existing file with empty/zero defaults so they can be
# filled in later. Existing non-empty, non-zero values are NEVER overwritten.
DETAIL_FIELDS = [
    "start_date",
    "start_time",
    "end_time",
    "soc_start",
    "soc_end",
    "soc_added",
]
DETAIL_DEFAULTS = {
    "start_date": '""',
    "start_time": '""',
    "end_time":   '""',
    "soc_start":  "0",
    "soc_end":    "0",
    "soc_added":  "0",
}

# Vehicle name -> filename slug
VEHICLE_SLUGS = {
    "2025 Mach-E GT":        "rjb-gt",
    "2026 Mach-E SR":        "rjb-sr",
    "LRB's 2025 Mach-E GT":  "lrb-gt",
    "LRB's 2026 Mach-E SR":  "lrb-sr",
}

def vehicle_slug(name):
    return VEHICLE_SLUGS.get(name, re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"))


# ─────────────────────────────────────────────
#  STEP 1: Fix front matter in a single file
# ─────────────────────────────────────────────
def fix_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    match = re.match(r"^---\n(.*?)\n---\s*$", content, re.DOTALL)
    if not match:
        print(f"  SKIPPED (no valid front matter): {filepath}")
        return False

    fm = match.group(1)
    data = {}
    for line in fm.splitlines():
        if ":" in line:
            key, _, val = line.partition(":")
            data[key.strip()] = val.strip()

    # ── DATE ──────────────────────────────────
    date_val = data.get("date", "").strip('"').strip("'")
    date_val = re.sub(r"(^\d{4}-\d{2}-\d{2}).*", r"\1", date_val)
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date_val):
        print(f"  WARNING: Cannot parse date '{date_val}' in {filepath}")
    data["date"] = f'"{date_val}"'

    # ── LOCATION ──────────────────────────────
    loc = data.get("location", "").strip('"').strip("'") or "Unknown"
    data["location"] = f'"{loc}"'

    # ── VEHICLE ───────────────────────────────
    veh = data.get("vehicle", "").strip('"').strip("'") or DEFAULT_VEHICLE
    data["vehicle"] = f'"{veh}"'

    # ── ENERGY_KWH ────────────────────────────
    try:
        data["energy_kwh"] = str(float(data.get("energy_kwh", "0")))
    except ValueError:
        print(f"  WARNING: Cannot parse energy_kwh in {filepath} — setting to 0.0")
        data["energy_kwh"] = "0.0"

    # ── COST ──────────────────────────────────
    try:
        data["cost"] = str(float(data.get("cost", "0")))
    except ValueError:
        print(f"  WARNING: Cannot parse cost in {filepath} — setting to 0.0")
        data["cost"] = "0.0"

    # ── NEW DETAIL FIELDS ─────────────────────
    # Add if missing. Never overwrite a non-empty/non-zero value.
    for field in DETAIL_FIELDS:
        existing = data.get(field, "").strip().strip('"').strip("'").strip()
        if field not in data or existing in ("", "null", "none", "~"):
            data[field] = DETAIL_DEFAULTS[field]
        elif field in ("soc_start", "soc_end", "soc_added") and existing == "0":
            data[field] = "0"   # keep as zero placeholder — not yet recorded
        # else: keep existing non-zero value untouched

    # ── NOTES ─────────────────────────────────
    notes = data.get("notes", '""').strip()
    if notes.lower() in ("null", "none", "~", ""):
        notes = '""'
    elif not (notes.startswith('"') or notes.startswith("'")):
        notes = f'"{notes}"'
    data["notes"] = notes

    # ── REMOVE CloudCannon-injected keys ──────
    for key in ["_schema", "_inputs"]:
        data.pop(key, None)

    # ── REBUILD in canonical field order ──────
    field_order = [
        "date", "location", "vehicle", "energy_kwh", "cost",
        "start_date", "start_time", "end_time",
        "soc_start", "soc_end", "soc_added",
        "notes",
    ]
    lines = [f"{k}: {data[k]}" for k in field_order if k in data]
    # Preserve unexpected extra fields at end
    for k, v in data.items():
        if k not in field_order:
            lines.append(f"{k}: {v}")

    new_content = "---\n" + "\n".join(lines) + "\n---\n"

    if new_content != content:
        with open(filepath, "w") as f:
            f.write(new_content)
        print(f"  FIXED: {filepath}")
    else:
        print(f"  OK:    {filepath}")

    return True


# ─────────────────────────────────────────────
#  STEP 2: Rename files — vehicle-aware scheme
# ─────────────────────────────────────────────
def rename_files():
    files = glob.glob(os.path.join(CHARGING_DIR, "*.md"))
    if not files:
        print(f"No .md files found in {CHARGING_DIR}/")
        return

    file_info = []
    for filepath in files:
        with open(filepath, "r") as f:
            content = f.read()
        m = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
        date_val = ""
        veh_val  = DEFAULT_VEHICLE
        if m:
            for line in m.group(1).splitlines():
                if line.startswith("date:"):
                    date_val = line.partition(":")[2].strip().strip('"').strip("'")
                    date_val = re.sub(r"(^\d{4}-\d{2}-\d{2}).*", r"\1", date_val)
                elif line.startswith("vehicle:"):
                    veh_val = line.partition(":")[2].strip().strip('"').strip("'")
        if not date_val:
            print(f"  SKIPPED (no date): {filepath}")
            continue
        file_info.append((date_val, veh_val, filepath))

    # Sort by date, then vehicle, then original path for tie-breaking
    file_info.sort(key=lambda x: (x[0], x[1], x[2]))

    # Per-(date, slug) counter so each vehicle restarts at 1 per day
    counters = {}
    rename_plan = []
    for date_val, veh_val, filepath in file_info:
        slug = vehicle_slug(veh_val)
        key  = (date_val, slug)
        counters[key] = counters.get(key, 0) + 1
        n = counters[key]
        new_name = f"{date_val}-{slug}-{n}.md"
        rename_plan.append((filepath, os.path.join(CHARGING_DIR, new_name), veh_val))

    # Preview
    col1, col2, col3 = 50, 38, 26
    print(f"\n  {'Current filename':<{col1}}  {'New filename':<{col2}}  Vehicle")
    print(f"  {'-'*col1}  {'-'*col2}  {'-'*col3}")
    for old, new, veh in rename_plan:
        o = os.path.basename(old)
        n = os.path.basename(new)
        tag = "  (no change)" if o == n else ""
        print(f"  {o:<{col1}}  {n:<{col2}}  {veh}{tag}")

    print()
    confirm = input("  Proceed with renaming? (yes/no): ").strip().lower()
    if confirm not in ("yes", "y"):
        print("  Cancelled.")
        return

    # Two-pass to avoid collisions
    temps = []
    for old, new, _ in rename_plan:
        tmp = old + ".tmp_rename"
        os.rename(old, tmp)
        temps.append((tmp, new))

    renamed = skipped = 0
    for tmp, new in temps:
        os.rename(tmp, new)
        old_name = os.path.basename(tmp).replace(".tmp_rename", "")
        new_name = os.path.basename(new)
        if old_name != new_name:
            print(f"  RENAMED: {old_name}  ->  {new_name}")
            renamed += 1
        else:
            skipped += 1

    print(f"\n  Done. {renamed} renamed, {skipped} already correct.")


# ─────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────
def main():
    do_rename = "--rename" in sys.argv

    files = glob.glob(os.path.join(CHARGING_DIR, "*.md"))
    if not files:
        print(f"No .md files found in {CHARGING_DIR}/")
        return

    print(f"Scanning {len(files)} file(s) in {CHARGING_DIR}/...\n")
    for filepath in sorted(files):
        fix_file(filepath)

    print("\nFront matter fix complete.")

    if do_rename:
        print("\n─── Renaming to vehicle-aware scheme ───")
        rename_files()
    else:
        print("\nTip: run with --rename to rename files to YYYY-MM-DD-{vehicle}-N.md")
        print("     Examples: 2025-10-01-rjb-gt-1.md  /  2025-10-01-lrb-gt-1.md")


if __name__ == "__main__":
    main()
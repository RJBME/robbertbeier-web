#!/usr/bin/env python3
"""
fix_charging_files.py
Run from the root of your repo.

USAGE:
  python3 fix_charging_files.py           # Fix front matter only, no renaming
  python3 fix_charging_files.py --rename  # Fix front matter AND rename files
                                          # to YYYY-MM-DD-session-N.md scheme

The --rename option is optional housekeeping. It:
  - Reads the date from each file's front matter
  - Sorts all files chronologically
  - Renames them to YYYY-MM-DD-session-N.md (N = global sequence, 1-based)
  - Multiple sessions on the same day get sequential numbers
  - Prints a preview of all renames before asking you to confirm
"""

import os
import re
import glob
import sys
import shutil

CHARGING_DIR = "_charging"
DEFAULT_VEHICLE = "2025 Mach-E GT"


# ─────────────────────────────────────────────
#  STEP 1: Fix front matter in a single file
# ─────────────────────────────────────────────
def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Must have front matter between --- markers
    match = re.match(r'^---\n(.*?)\n---\s*$', content, re.DOTALL)
    if not match:
        print(f"  SKIPPED (no valid front matter): {filepath}")
        return False

    fm = match.group(1)

    # Parse key: value lines (simple, single-level only)
    data = {}
    for line in fm.splitlines():
        if ':' in line:
            key, _, val = line.partition(':')
            data[key.strip()] = val.strip()

    # ── DATE ──────────────────────────────────
    # Strip quotes, truncate any timestamp to YYYY-MM-DD, re-quote as string
    date_val = data.get('date', '').strip('"').strip("'")
    date_val = re.sub(r'(^\d{4}-\d{2}-\d{2}).*', r'\1', date_val)
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_val):
        print(f"  WARNING: Could not parse date '{date_val}' in {filepath} — leaving as-is")
    data['date'] = f'"{date_val}"'

    # ── LOCATION ──────────────────────────────
    loc = data.get('location', '').strip('"').strip("'")
    if not loc:
        loc = 'Unknown'
    data['location'] = f'"{loc}"'

    # ── VEHICLE ───────────────────────────────
    veh = data.get('vehicle', '').strip('"').strip("'")
    if not veh:
        veh = DEFAULT_VEHICLE
    data['vehicle'] = f'"{veh}"'

    # ── ENERGY_KWH ────────────────────────────
    try:
        data['energy_kwh'] = str(float(data.get('energy_kwh', '0')))
    except ValueError:
        print(f"  WARNING: Could not parse energy_kwh in {filepath} — setting to 0.0")
        data['energy_kwh'] = '0.0'

    # ── COST ──────────────────────────────────
    try:
        data['cost'] = str(float(data.get('cost', '0')))
    except ValueError:
        print(f"  WARNING: Could not parse cost in {filepath} — setting to 0.0")
        data['cost'] = '0.0'

    # ── NOTES ─────────────────────────────────
    # Replace null/none/~ with empty string, ensure quoted
    notes = data.get('notes', '""').strip()
    if notes.lower() in ('null', 'none', '~', ''):
        notes = '""'
    elif not (notes.startswith('"') or notes.startswith("'")):
        notes = f'"{notes}"'
    data['notes'] = notes

    # ── REMOVE CloudCannon-injected keys ──────
    for key in ['_schema', '_inputs']:
        data.pop(key, None)

    # ── REBUILD front matter in consistent order ──
    field_order = ['date', 'location', 'vehicle', 'energy_kwh', 'cost', 'notes']
    lines = []
    for key in field_order:
        if key in data:
            lines.append(f"{key}: {data[key]}")
    # Preserve any unexpected extra fields
    for key, val in data.items():
        if key not in field_order:
            lines.append(f"{key}: {val}")

    new_content = "---\n" + "\n".join(lines) + "\n---\n"

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"  FIXED: {filepath}")
    else:
        print(f"  OK:    {filepath}")

    return True


# ─────────────────────────────────────────────
#  STEP 2: Rename files to sequential scheme
# ─────────────────────────────────────────────
def rename_files():
    files = glob.glob(os.path.join(CHARGING_DIR, "*.md"))
    if not files:
        print(f"No .md files found in {CHARGING_DIR}/")
        return

    # Read date from each file's front matter
    file_dates = []
    for filepath in files:
        with open(filepath, 'r') as f:
            content = f.read()
        match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        date_val = ''
        if match:
            for line in match.group(1).splitlines():
                if line.startswith('date:'):
                    _, _, val = line.partition(':')
                    date_val = val.strip().strip('"').strip("'")
                    # Truncate any timestamp
                    date_val = re.sub(r'(^\d{4}-\d{2}-\d{2}).*', r'\1', date_val)
                    break
        if not date_val:
            print(f"  SKIPPED (no date found): {filepath}")
            continue
        file_dates.append((date_val, filepath))

    # Sort chronologically, then by current filename for stability on same date
    file_dates.sort(key=lambda x: (x[0], x[1]))

    # Build rename plan
    print("\n  Rename plan:")
    print(f"  {'Current filename':<50}  {'New filename'}")
    print(f"  {'-'*50}  {'-'*40}")

    rename_plan = []
    for i, (date_val, filepath) in enumerate(file_dates, start=1):
        new_filename = f"{date_val}-session-{i}.md"
        new_filepath = os.path.join(CHARGING_DIR, new_filename)
        current_filename = os.path.basename(filepath)
        rename_plan.append((filepath, new_filepath))
        marker = "  (no change)" if current_filename == new_filename else ""
        print(f"  {current_filename:<50}  {new_filename}{marker}")

    # Ask for confirmation
    print()
    confirm = input("  Proceed with renaming? (yes/no): ").strip().lower()
    if confirm not in ('yes', 'y'):
        print("  Renaming cancelled.")
        return

    # Two-pass rename to avoid collisions:
    # Pass 1: rename everything to a temp name
    temp_paths = []
    for old_path, new_path in rename_plan:
        temp_path = old_path + ".tmp_rename"
        os.rename(old_path, temp_path)
        temp_paths.append((temp_path, new_path))

    # Pass 2: rename temp files to final names
    renamed = 0
    skipped = 0
    for temp_path, new_path in temp_paths:
        os.rename(temp_path, new_path)
        old_name = os.path.basename(temp_path).replace('.tmp_rename', '')
        new_name = os.path.basename(new_path)
        if old_name != new_name:
            print(f"  RENAMED: {old_name}  →  {new_name}")
            renamed += 1
        else:
            skipped += 1

    print(f"\n  Done. {renamed} file(s) renamed, {skipped} already correct.")


# ─────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────
def main():
    do_rename = '--rename' in sys.argv

    # Step 1: Fix all files
    files = glob.glob(os.path.join(CHARGING_DIR, "*.md"))
    if not files:
        print(f"No .md files found in {CHARGING_DIR}/")
        return

    print(f"Scanning {len(files)} file(s) in {CHARGING_DIR}/...\n")
    for filepath in sorted(files):
        fix_file(filepath)

    print("\nFront matter fix complete.")

    # Step 2: Rename if requested
    if do_rename:
        print("\n─── Renaming files to sequential scheme ───")
        rename_files()
    else:
        print("\nTip: Run with --rename to also rename files to YYYY-MM-DD-session-N.md")


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
fix_charging_files.py
Run from the root of your repo. Fixes all _charging/*.md files to have
correct front matter syntax for Jekyll/CloudCannon.
"""

import os
import re
import glob

CHARGING_DIR = "_charging"
DEFAULT_VEHICLE = "2025 Mach-E GT"

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Extract front matter between --- markers
    match = re.match(r'^---\n(.*?)\n---\s*$', content, re.DOTALL)
    if not match:
        print(f"  SKIPPED (no valid front matter): {filepath}")
        return

    fm = match.group(1)

    # Parse each key: value line
    data = {}
    for line in fm.splitlines():
        if ':' in line:
            key, _, val = line.partition(':')
            data[key.strip()] = val.strip()

    # --- Fix each field ---

    # DATE: strip quotes, check format, re-quote as string
    date_val = data.get('date', '').strip('"').strip("'")
    # Handle full timestamps like 2026-04-18T00:00:00Z or 2026-04-18 00:00:00 -0400
    date_val = re.sub(r'(^\d{4}-\d{2}-\d{2}).*', r'\1', date_val)
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_val):
        print(f"  WARNING: Could not parse date '{date_val}' in {filepath} — leaving as-is")
    data['date'] = f'"{date_val}"'

    # LOCATION: ensure quoted
    loc = data.get('location', '').strip('"').strip("'")
    if not loc:
        loc = 'Unknown'
    data['location'] = f'"{loc}"'

    # VEHICLE: add if missing, ensure quoted
    veh = data.get('vehicle', '').strip('"').strip("'")
    if not veh:
        veh = DEFAULT_VEHICLE
    data['vehicle'] = f'"{veh}"'

    # ENERGY_KWH: ensure it's a number
    try:
        data['energy_kwh'] = str(float(data.get('energy_kwh', '0')))
    except ValueError:
        print(f"  WARNING: Could not parse energy_kwh in {filepath} — setting to 0.0")
        data['energy_kwh'] = '0.0'

    # COST: ensure it's a number
    try:
        data['cost'] = str(float(data.get('cost', '0')))
    except ValueError:
        print(f"  WARNING: Could not parse cost in {filepath} — setting to 0.0")
        data['cost'] = '0.0'

    # NOTES: replace null or missing with empty string
    notes = data.get('notes', '""').strip()
    if notes.lower() in ('null', 'none', '~', ''):
        notes = '""'
    elif not (notes.startswith('"') or notes.startswith("'")):
        notes = f'"{notes}"'
    data['notes'] = notes

    # Remove any _schema or _inputs keys that CloudCannon injected
    for key in ['_schema', '_inputs']:
        data.pop(key, None)

    # Rebuild front matter in consistent field order
    field_order = ['date', 'location', 'vehicle', 'energy_kwh', 'cost', 'notes']
    lines = []
    for key in field_order:
        if key in data:
            lines.append(f"{key}: {data[key]}")
    # Add any unexpected extra fields at the end
    for key, val in data.items():
        if key not in field_order:
            lines.append(f"{key}: {val}")

    new_content = "---\n" + "\n".join(lines) + "\n---\n"

    # Only write if something actually changed
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"  FIXED: {filepath}")
    else:
        print(f"  OK:    {filepath}")


def main():
    files = glob.glob(os.path.join(CHARGING_DIR, "*.md"))
    if not files:
        print(f"No .md files found in {CHARGING_DIR}/")
        return

    print(f"Scanning {len(files)} file(s) in {CHARGING_DIR}/...\n")
    for filepath in sorted(files):
        fix_file(filepath)
    print("\nDone.")


if __name__ == "__main__":
    main()
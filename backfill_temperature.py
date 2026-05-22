#!/usr/bin/env python3
"""
backfill_temperature.py
Run from the root of your repo.

Reads all _charging/*.md session files, looks up coordinates from
_data/locations.yml, fetches historical temperature from the Open-Meteo
archive API (free, no API key required), and writes temperature_c and
temperature_f back into the front matter of each file.

USAGE:
  python3 backfill_temperature.py           # preview — no writes
  python3 backfill_temperature.py --write   # write to files

REQUIREMENTS:
  pip install pyyaml requests               # requests is optional, falls back to urllib

NOTES:
  - Skips sessions that already have temperature_c filled in
  - Skips sessions with no matching location in _data/locations.yml
  - Skips sessions with no date
  - Batches API calls by (location, date) to avoid duplicate requests
  - Uses session start_time if available, otherwise defaults to 12:00 noon
  - Temperatures are at 2m height, sourced from ERA5 reanalysis
  - Open-Meteo archive API: https://archive-api.open-meteo.com
"""

import os
import re
import glob
import sys
import json
import time
from datetime import datetime, date

CHARGING_DIR  = '_charging'
LOCATIONS_YML = '_data/locations.yml'
TIMEZONE      = 'America/New_York'   # change if you charge frequently in another TZ

# ── Try to import yaml and requests; fall back gracefully ──────────────────
try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False
    print('  ℹ️  PyYAML not installed — using simple YAML parser for locations.yml')
    print('  Install with: pip install pyyaml\n')

try:
    import requests as req_lib
    def http_get(url):
        r = req_lib.get(url, timeout=15)
        r.raise_for_status()
        return r.json()
except ImportError:
    import urllib.request, urllib.error
    def http_get(url):
        with urllib.request.urlopen(url, timeout=15) as r:
            return json.loads(r.read().decode())

DO_WRITE = '--write' in sys.argv


# ── Load locations.yml → dict: location_name → (lat, lng) ─────────────────
def load_locations():
    if not os.path.exists(LOCATIONS_YML):
        print(f'  ⚠️  {LOCATIONS_YML} not found — no coordinates available')
        return {}
    coords = {}
    if HAS_YAML:
        with open(LOCATIONS_YML) as f:
            entries = yaml.safe_load(f) or []
        for e in entries:
            name = e.get('location') or e.get('name') or ''
            lat  = e.get('lat')  or e.get('latitude')
            lng  = e.get('lng')  or e.get('longitude')
            if name and lat is not None and lng is not None:
                try:
                    coords[name.strip()] = (float(lat), float(lng))
                except (ValueError, TypeError):
                    pass  # skip entries with blank or non-numeric coords
    else:
        # Simple regex parser — handles basic YAML list
        with open(LOCATIONS_YML) as f:
            content = f.read()
        blocks = re.split(r'\n- ', '\n' + content)
        for block in blocks:
            name = re.search(r'(?:location|name):\s*["\']?([^"\'\\n]+)["\']?', block)
            lat  = re.search(r'\blat(?:itude)?:\s*([\d.\-]+)', block)
            lng  = re.search(r'\blng|lon(?:gitude)?:\s*([\d.\-]+)', block)
            # Only add if ALL three fields are present — skip blocks missing coords
            if name and lat and lng:
                try:
                    coords[name.group(1).strip()] = (float(lat.group(1)), float(lng.group(1)))
                except (ValueError, TypeError):
                    pass  # skip malformed entries
    print(f'  Loaded {len(coords)} locations with coordinates')
    return coords


# ── Parse front matter from a session file ─────────────────────────────────
def parse_session(filepath):
    with open(filepath) as f:
        content = f.read()
    m = re.match(r'^---\n(.*?)\n---\s*$', content, re.DOTALL)
    if not m:
        return None, content
    fm = {}
    for line in m.group(1).splitlines():
        if ':' in line:
            k, _, v = line.partition(':')
            fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm, content


# ── Fetch temperature from Open-Meteo archive API ─────────────────────────
# Caches by (lat_rounded, lng_rounded, date_str) to avoid duplicate API calls
_temp_cache = {}

def fetch_temp(lat, lng, date_str, start_time_str):
    # Round coords to 2dp — nearby locations share the same grid cell
    lat_r = round(lat, 2)
    lng_r = round(lng, 2)

    cache_key = (lat_r, lng_r, date_str)
    if cache_key not in _temp_cache:
        url = (
            f'https://archive-api.open-meteo.com/v1/archive'
            f'?latitude={lat_r}&longitude={lng_r}'
            f'&start_date={date_str}&end_date={date_str}'
            f'&hourly=temperature_2m'
            f'&temperature_unit=celsius'
            f'&timezone={TIMEZONE}'
        )
        try:
            data = http_get(url)
            hours = data['hourly']['time']          # list of "YYYY-MM-DDTHH:00"
            temps = data['hourly']['temperature_2m']
            _temp_cache[cache_key] = dict(zip(hours, temps))
        except Exception as e:
            print(f'    ⚠️  API error for {date_str} at ({lat_r},{lng_r}): {e}')
            _temp_cache[cache_key] = {}
        # Be polite to the free API — small delay between calls
        time.sleep(0.25)

    hourly = _temp_cache[cache_key]
    if not hourly:
        return None, None

    # Determine which hour to use
    hour = 12  # default: noon
    if start_time_str and re.match(r'^\d{1,2}:\d{2}', start_time_str):
        try:
            hour = int(start_time_str.split(':')[0])
        except ValueError:
            pass

    # Build the key that Open-Meteo uses: "YYYY-MM-DDTHH:00"
    time_key = f'{date_str}T{hour:02d}:00'
    if time_key not in hourly:
        # Fall back to nearest available hour
        time_key = min(hourly.keys(), key=lambda k: abs(int(k[11:13]) - hour))

    temp_c = hourly.get(time_key)
    if temp_c is None:
        return None, None
    temp_f = round(temp_c * 9/5 + 32, 1)
    return round(temp_c, 1), temp_f


# ── Rebuild front matter with temperature fields ───────────────────────────
FIELD_ORDER = [
    'date', 'location', 'vehicle', 'energy_kwh', 'cost',
    'start_date', 'start_time', 'end_time',
    'soc_start', 'soc_end', 'soc_added', 'miles_added',
    'temperature_c', 'temperature_f',
    'notes',
]

def rebuild_content(fm, temp_c, temp_f):
    fm['temperature_c'] = str(temp_c)
    fm['temperature_f'] = str(temp_f)

    def fmt_val(k, v):
        # Preserve numeric fields without quotes; quote strings
        numeric = {'energy_kwh', 'cost', 'soc_start', 'soc_end', 'soc_added',
                   'miles_added', 'temperature_c', 'temperature_f'}
        if k in numeric:
            try:
                float(v); return v
            except (ValueError, TypeError):
                pass
        if not isinstance(v, str):
            return str(v)
        if v in ('null', 'none', '~', ''):
            return '""'
        if v.startswith('"') or v.startswith("'"):
            return v
        return f'"{v}"'

    lines = []
    for k in FIELD_ORDER:
        if k in fm:
            lines.append(f'{k}: {fmt_val(k, fm[k])}')
    for k, v in fm.items():
        if k not in FIELD_ORDER:
            lines.append(f'{k}: {fmt_val(k, v)}')

    return '---\n' + '\n'.join(lines) + '\n---\n'


# ── Main ───────────────────────────────────────────────────────────────────
def main():
    print(f'\n{"─"*60}')
    print('  Temperature Backfill  —  Open-Meteo ERA5 Historical Archive')
    print(f'{"─"*60}')
    if DO_WRITE:
        print('  Mode: WRITE (files will be updated)')
    else:
        print('  Mode: PREVIEW (use --write to actually update files)')
    print()

    locations = load_locations()
    if not locations:
        print('  ❌ No locations loaded — add lat/lng to _data/locations.yml and retry')
        return

    files = sorted(glob.glob(os.path.join(CHARGING_DIR, '*.md')))
    if not files:
        print(f'  ❌ No .md files found in {CHARGING_DIR}/')
        return

    print(f'  Scanning {len(files)} session files...\n')

    skipped_no_coords  = []
    skipped_has_temp   = []
    skipped_no_date    = []
    updated            = []
    errors             = []
    api_calls          = 0

    for filepath in files:
        fm, original_content = parse_session(filepath)
        if fm is None:
            errors.append((filepath, 'no valid front matter'))
            continue

        date_str = fm.get('date', '').strip().strip('"').strip("'")
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
            skipped_no_date.append(filepath)
            continue

        # Skip if already has a non-zero temperature
        existing_c = fm.get('temperature_c', '').strip().strip('"').strip("'")
        if existing_c and existing_c not in ('0', '0.0', '""', ''):
            skipped_has_temp.append(filepath)
            continue

        # Look up coordinates
        location = fm.get('location', '').strip().strip('"').strip("'")
        coords = locations.get(location)
        if not coords:
            # Try case-insensitive match
            loc_lower = location.lower()
            for k, v in locations.items():
                if k.lower() == loc_lower:
                    coords = v
                    break
        if not coords:
            skipped_no_coords.append((filepath, location))
            continue

        lat, lng = coords
        start_time = fm.get('start_time', '').strip().strip('"').strip("'")

        # Fetch temperature
        if not DO_WRITE:
            # In preview mode, show what we'd do without calling the API
            print(f'  WOULD FETCH: {os.path.basename(filepath)}  {date_str}  {location}  @ ({lat},{lng})')
            updated.append(filepath)
        else:
            temp_c, temp_f = fetch_temp(lat, lng, date_str, start_time)
            api_calls += 1
            if temp_c is None:
                errors.append((filepath, 'API returned no data'))
                continue
            new_content = rebuild_content(fm, temp_c, temp_f)
            if new_content != original_content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f'  ✓ {os.path.basename(filepath):45s} {date_str}  {temp_c}°C / {temp_f}°F  ({location})')
                updated.append(filepath)
            else:
                skipped_has_temp.append(filepath)

    # Summary
    print(f'\n{"─"*60}')
    print(f'  Summary:')
    print(f'    {"Would update" if not DO_WRITE else "Updated"}:         {len(updated)} files')
    print(f'    Already has temp:  {len(skipped_has_temp)} files (skipped)')
    print(f'    No coordinates:    {len(skipped_no_coords)} files (skipped)')
    print(f'    No valid date:     {len(skipped_no_date)} files (skipped)')
    print(f'    Errors:            {len(errors)} files')
    if api_calls:
        print(f'    API calls made:    {api_calls} (cache: {len(_temp_cache)} unique date/location combos)')

    if skipped_no_coords:
        print(f'\n  Locations missing from _data/locations.yml (add lat/lng to fix):')
        seen = set()
        for _, loc in skipped_no_coords:
            if loc not in seen:
                print(f'    - {loc}')
                seen.add(loc)

    if errors:
        print(f'\n  Errors:')
        for fp, msg in errors:
            print(f'    {os.path.basename(fp)}: {msg}')

    if not DO_WRITE and updated:
        print(f'\n  Run with --write to apply {len(updated)} updates.')
    elif DO_WRITE and updated:
        print(f'\n  ✅ Done. Run fix_charging_files.py to normalize all files if needed.')
    print()


if __name__ == '__main__':
    main()
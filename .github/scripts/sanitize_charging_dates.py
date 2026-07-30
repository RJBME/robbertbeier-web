#!/usr/bin/env python3
"""
Ensure every _charging/*.md has a valid `date:` so the Jekyll build never fails
because of a blank date — e.g. a session logged via CloudCannon before the date
field was filled in. (One such file takes the whole site build down otherwise.)

Runs in CI BEFORE `jekyll build`. It only sanitizes the ephemeral CI checkout —
it does NOT commit anything back, so your repo stays exactly as you left it; the
*deployed* site is just always buildable.

Derivation order for a missing/invalid date:
  1. keep an existing valid YYYY-MM-DD date
  2. else the date part of `start_date`
  3. else the date at the start of the filename (YYYY-MM-DD-…)
  4. else today (last-resort so the build still succeeds)
"""
import glob, re, os, datetime

DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}')
fixed = 0

for path in sorted(glob.glob("_charging/*.md")):
    with open(path, encoding="utf-8") as fh:
        txt = fh.read()
    m = re.match(r'^---\s*\n(.*?)\n---', txt, re.S)
    if not m:
        continue
    fm = m.group(1)
    dm = re.search(r'(?m)^date:[ \t]*(.*)$', fm)
    cur = dm.group(1).strip().strip('"').strip("'") if dm else ""
    if DATE_RE.match(cur):
        continue  # already has a usable date

    derived = ""
    sd = re.search(r'(?m)^start_date:[ \t]*(.*)$', fm)
    if sd:
        mm = re.match(r'["\']?(\d{4}-\d{2}-\d{2})', sd.group(1).strip())
        if mm:
            derived = mm.group(1)
    if not derived:
        fn = re.match(r'(\d{4}-\d{2}-\d{2})', os.path.basename(path))
        if fn:
            derived = fn.group(1)
    if not derived:
        derived = datetime.date.today().isoformat()

    new_line = f'date: "{derived}"'
    new_fm = re.sub(r'(?m)^date:[ \t]*.*$', new_line, fm, count=1) if dm else (new_line + "\n" + fm)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(txt.replace(fm, new_fm, 1))
    print(f"[sanitize] {path}: filled date -> {derived}")
    fixed += 1

print(f"[sanitize] complete — {fixed} file(s) fixed")

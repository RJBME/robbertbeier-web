// Driving Log — shared config + cloud sync (loaded by driving-log.html and driving-dashboard.html)
// Backend: the same Google Apps Script web app used by the quiz, with row-per-entry log actions.

// ---- Edit these ----
const SYNC_URL = 'https://script.google.com/macros/s/AKfycbx81DU5oNSU6yOO4Svm2EZIfXOJCv4HQwwjtXB5tmEqg4-IjSv71RJ7T9QjENk-II5I/exec';
const SYNC_SECRET = 'Daphnis_Tulip_Bronco';
const SYNC_USER = 'rowan-driving';
const VEHICLES = ['2026 Mach-E SR', "LRB's 2026 Mach-E SR"];   // current cars (match the charging log)
const SUPERVISORS = ['Mom', 'Dad'];              // edit to your supervisors

// ---- Michigan Level 1 goals ----
const GOAL_HOURS = 50;
const GOAL_NIGHT_HOURS = 10;
const SEG2_HOURS = 30;        // Segment 2 interim: 30 total hours...
const SEG2_NIGHT_HOURS = 2;   // ...including 2 at night
const SEG2_DAYS = 90;         // and held Level 1 >= 90 days
const LEVEL2_MONTHS = 6;      // Level 2 eligibility: held Level 1 >= 6 months

// ---- Field options ----
const WEATHER_OPTS = ['Rain', 'Snow', 'Fog', 'Ice'];
const ROAD_OPTS = ['Residential', 'City', 'Highway/Freeway', 'Rural', 'Parking lot'];
const TRAFFIC_OPTS = ['Light', 'Moderate', 'Heavy'];
const MANEUVER_OPTS = ['Turns', 'Lane changes', 'Parallel parking', 'Perpendicular parking',
                       'Backing up', 'Freeway merging', 'Roundabouts', 'Hills', 'Intersections & stops'];

// ---- Entry schema (backward/forward compatible) ----
// RULES for future changes so OLD logged drives keep working:
//   1. Only ADD new fields (with a default in ENTRY_DEFAULTS). Never rename or
//      repurpose an existing key — old drives store data under the old key.
//   2. If a field's MEANING must change, bump SCHEMA_VERSION and add a case in
//      migrateEntry() to upgrade older entries deterministically.
//   3. Every entry is run through normalizeEntry() on load/add/sync, so all
//      code can assume every field exists. Unknown (newer) fields are preserved,
//      so a device running older code won't wipe data written by newer code.
const SCHEMA_VERSION = 1;
const ENTRY_DEFAULTS = {
  v: SCHEMA_VERSION, id: '', date: '', start: '', end: '', minutes: 0, nightMinutes: 0,
  miles: null, vehicle: '', supervisor: '', traffic: '', weather: [], roads: [],
  maneuvers: [], notes: '', t: 0, synced: false
};
function migrateEntry(e) {
  e = e || {};
  // Upgrade older entries here as SCHEMA_VERSION grows, e.g.:
  //   if ((e.v || 1) < 2) { e.someNewField = deriveFrom(e); e.v = 2; }
  return e;
}
function normalizeEntry(e) {
  e = migrateEntry(e || {});
  const out = {};
  for (const k in ENTRY_DEFAULTS) {
    const d = ENTRY_DEFAULTS[k];
    out[k] = (e[k] !== undefined && e[k] !== null) ? e[k] : (Array.isArray(d) ? d.slice() : d);
  }
  for (const k in e) if (!(k in out)) out[k] = e[k]; // preserve unknown/newer fields
  out.v = SCHEMA_VERSION;
  return out;
}

// ---- Storage ----
const LKEY = 'drivingLogEntries', MKEY = 'drivingLogMeta';
function loadLocalEntries() { try { return (JSON.parse(localStorage.getItem(LKEY)) || []).map(normalizeEntry); } catch (e) { return []; } }
function saveLocalEntries(a) { try { localStorage.setItem(LKEY, JSON.stringify(a)); } catch (e) {} }
function getMeta() { try { return JSON.parse(localStorage.getItem(MKEY)) || {}; } catch (e) { return {}; } }
function setMeta(m) { try { localStorage.setItem(MKEY, JSON.stringify(m)); } catch (e) {} }

// ---- Formatting / math ----
function fmtHM(min) { min = Math.round(min || 0); const h = Math.floor(min / 60), m = min % 60; return h ? (m ? h + 'h ' + m + 'm' : h + 'h') : m + 'm'; }
function fmtHrs(min) { return ((min || 0) / 60).toFixed(1); }
function totals(entries) {
  let tot = 0, night = 0, miles = 0;
  entries.forEach(e => { tot += (e.minutes || 0); night += (e.nightMinutes || 0); miles += (+e.miles || 0); });
  return { minutes: tot, nightMinutes: night, hours: tot / 60, nightHours: night / 60, miles, drives: entries.length };
}
function sortEntries(a) { return a.slice().sort((x, y) => (x.date + (x.start || '')).localeCompare(y.date + (y.start || ''))); }

// ---- Cloud (Apps Script) ----
async function cloudList() {
  const r = await fetch(SYNC_URL + '?secret=' + encodeURIComponent(SYNC_SECRET) + '&user=' + encodeURIComponent(SYNC_USER) + '&action=logList&_=' + Date.now());
  const j = await r.json();
  // require a real entries array — guards against a backend that hasn't been updated with the log actions yet
  if (j && j.ok && Array.isArray(j.entries)) return j.entries;
  throw new Error('log endpoint not available');
}
async function cloudAdd(entry) {
  const r = await fetch(SYNC_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret: SYNC_SECRET, user: SYNC_USER, action: 'logAdd', entry: entry }) });
  const j = await r.json(); return !!(j && j.ok);
}
async function cloudDelete(id) {
  const r = await fetch(SYNC_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret: SYNC_SECRET, user: SYNC_USER, action: 'logDelete', id: id }) });
  const j = await r.json(); return !!(j && j.ok);
}

// Pull cloud, push any local-only (pending) entries, merge, cache. Returns { entries, online }.
async function syncEntries() {
  let local = loadLocalEntries();
  let cloud = null, online = false;
  try { cloud = await cloudList(); online = true; } catch (e) {}
  if (online) {
    const cloudIds = new Set(cloud.map(e => e.id));
    for (const e of local) {
      if (!e.synced && !cloudIds.has(e.id)) {
        try { if (await cloudAdd(e)) { e.synced = true; cloudIds.add(e.id); } } catch (err) {}
      }
    }
    const merged = cloud.map(e => Object.assign(normalizeEntry(e), { synced: true }));
    for (const e of local) if (!cloudIds.has(e.id)) merged.push(e);
    local = merged.map(normalizeEntry);
    saveLocalEntries(local);
  }
  return { entries: sortEntries(local.map(normalizeEntry)), online };
}

async function addEntry(entry) {
  entry = normalizeEntry(entry);
  entry.id = entry.id || (Date.now() + '-' + Math.random().toString(36).slice(2, 7));
  entry.synced = false;
  const local = loadLocalEntries(); local.push(entry); saveLocalEntries(local);
  try {
    if (await cloudAdd(entry)) {
      const a = loadLocalEntries(); const i = a.findIndex(x => x.id === entry.id);
      if (i >= 0) { a[i].synced = true; saveLocalEntries(a); }
    }
  } catch (e) {}
  return entry;
}

async function removeEntry(id) {
  saveLocalEntries(loadLocalEntries().filter(e => e.id !== id));
  try { await cloudDelete(id); } catch (e) {}
}

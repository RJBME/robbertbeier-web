// Filament Tracker — shared config, data model + cloud sync (loaded by filament.html)
// Backend: the same Google Apps Script web app as the quiz / driving log. Its row-per-entry
// log actions (logAdd/logList/logDelete) store any JSON and filter by `user`, so filament
// records live under their own user key — no Apps Script change or redeploy needed.

// ---- Edit these ----
const SYNC_URL = 'https://script.google.com/macros/s/AKfycbx81DU5oNSU6yOO4Svm2EZIfXOJCv4HQwwjtXB5tmEqg4-IjSv71RJ7T9QjENk-II5I/exec';
const SYNC_SECRET = 'Daphnis_Tulip_Bronco';
// ?sandbox in the URL = a throwaway copy (own cloud key + local storage) for trying things out.
const SANDBOX = /[?&]sandbox\b/.test(location.search);
const SYNC_USER = SANDBOX ? 'filament-sandbox' : 'filament-tracker';
const DEFAULT_TAX_RATE = 6;        // Michigan sales tax, %
const DEFAULT_SPOOL_GRAMS = 1000;
const BRANDS = ['Bambu Lab', 'Polymaker', 'eSun', 'Elegoo', 'Sunlu', 'Overture', 'Prusament'];
const MATERIALS = ['PLA Basic', 'PLA Matte', 'PLA Silk', 'PLA Silk Multi-Color', 'PLA Silk+', 'PLA Translucent',
                   'PLA Glow', 'PLA Marble', 'PLA-CF', 'PETG Basic', 'PETG HF', 'PETG Translucent', 'ABS', 'ASA',
                   'TPU 95A', 'Support for PLA', 'Support for PLA/PETG', 'PVA'];

// ---- Entry schema (backward/forward compatible) ----
// Same rules as the driving log: only ADD fields (with a default below), never rename or
// repurpose a key; bump SCHEMA_VERSION + add a migrateEntry() case for a semantic change.
// Unknown fields are preserved so an older device never wipes newer data.
// Three record kinds share one list, told apart by `kind`:
//   filament — a color/product in the catalog      (want/need flag lives here)
//   order    — a purchase: items, tax, shipments   (owns the spools it bought)
//   spool    — one physical spool: sealed → open → empty
const SCHEMA_VERSION = 1;
const DEFAULTS = {
  filament: { v: SCHEMA_VERSION, id: '', kind: 'filament', name: '', brand: 'Bambu Lab', material: 'PLA Basic',
              code: '', hex: '#cccccc', hex2: '', flag: '', notes: '', t: 0, synced: false },
  order:    { v: SCHEMA_VERSION, id: '', kind: 'order', date: '', vendor: 'Bambu Lab', items: [], shipping: 0,
              discount: 0, taxRate: DEFAULT_TAX_RATE, tax: null, shipments: [], received: '', notes: '', t: 0, synced: false,
              orderNo: '', extras: [] },
  spool:    { v: SCHEMA_VERSION, id: '', kind: 'spool', fid: '', orderId: '', status: 'sealed', grams: DEFAULT_SPOOL_GRAMS,
              cost: null, opened: '', emptied: '', notes: '', t: 0, synced: false,
              remaining: null, checked: '' }
};
// spool.remaining = estimated grams left (from the spool's markings or Bambu Handy); null = not
// estimated yet (treated as full). spool.checked = date of that estimate.
// order.items[]     = { fid, qty, price (per spool, pre-tax; null = unknown), grams }
// order.shipments[] = { number, carrier, eta, received }
// order.extras[]    = { name, qty, price } — non-filament items (reusable spools, nozzles…): count toward the
//                     order total, but never become spools or affect $/kg
// order.orderNo     = the store's order number (e.g. Bambu "us6812…")
function migrateEntry(e) {
  e = e || {};
  // if ((e.v || 1) < 2) { ...; e.v = 2; }
  return e;
}
function normalizeEntry(e) {
  e = migrateEntry(e || {});
  const def = DEFAULTS[e.kind] || DEFAULTS.filament;
  const out = {};
  for (const k in def) {
    const d = def[k];
    out[k] = (e[k] !== undefined && e[k] !== null) ? e[k] : (Array.isArray(d) ? d.slice() : d);
  }
  for (const k in e) if (!(k in out)) out[k] = e[k];
  out.v = SCHEMA_VERSION;
  return out;
}
function newId() { return Date.now() + '-' + Math.random().toString(36).slice(2, 7); }
function todayISO() { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }

// ---- Local storage: entries + pending deletes ----
const LKEY = SANDBOX ? 'filamentSandboxEntries' : 'filamentEntries';
const DKEY = SANDBOX ? 'filamentSandboxDeletes' : 'filamentPendingDeletes';
function loadLocal() { try { return (JSON.parse(localStorage.getItem(LKEY)) || []).map(normalizeEntry); } catch (e) { return []; } }
function saveLocal(a) { try { localStorage.setItem(LKEY, JSON.stringify(a)); } catch (e) {} }
function loadDeletes() { try { return JSON.parse(localStorage.getItem(DKEY)) || []; } catch (e) { return []; } }
function saveDeletes(a) { try { localStorage.setItem(DKEY, JSON.stringify(a)); } catch (e) {} }

// ---- Cloud (Apps Script) ----
async function cloudList() {
  const r = await fetch(SYNC_URL + '?secret=' + encodeURIComponent(SYNC_SECRET) + '&user=' + encodeURIComponent(SYNC_USER) + '&action=logList&_=' + Date.now());
  const j = await r.json();
  if (j && j.ok && Array.isArray(j.entries)) return j.entries;
  throw new Error('log endpoint not available');
}
async function cloudPost(body) {
  const r = await fetch(SYNC_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(Object.assign({ secret: SYNC_SECRET, user: SYNC_USER }, body)) });
  const j = await r.json(); return !!(j && j.ok);
}
function cloudAdd(entry) {
  const e = Object.assign({}, entry, { synced: true }); delete e._new;
  return cloudPost({ action: 'logAdd', entry: e });
}
const cloudDelete = id => cloudPost({ action: 'logDelete', id });

// Run async jobs a few at a time (Apps Script is slow; the initial import is ~80 rows).
async function runPool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const it = items[i++]; try { await fn(it); } catch (e) {} }
  }));
}

// Store: every change is written locally first (synced:false) and pushed in the background.
// Pending edits upsert (delete old row + add new, same id); pending deletes are queued in DKEY.
// On sync, cloud is the truth except for still-pending local edits/deletes (last writer wins).
const Store = {
  entries: loadLocal(),
  online: null,
  busy: false,
  listeners: [],
  onChange(fn) { this.listeners.push(fn); },
  emit() { this.listeners.forEach(fn => fn()); },
  pendingCount() { return this.entries.filter(e => !e.synced).length + loadDeletes().length; },

  all(kind) { return this.entries.filter(e => e.kind === kind); },
  get(id) { return this.entries.find(e => e.id === id); },

  // Batch writes: put many entries + delete many ids with one save/emit/flush.
  commit(puts, dels) {
    const byId = new Map(this.entries.map(e => [e.id, e]));
    puts = (puts || []).map(e => {
      e = normalizeEntry(e); e.id = e.id || newId(); e.t = Date.now(); e.synced = false;
      const prev = byId.get(e.id);
      if (!prev || prev._new) e._new = true; else delete e._new;   // _new = never reached the cloud: no delete needed
      return e;
    });
    dels = dels || [];
    puts.forEach(e => byId.set(e.id, e));
    const cloudDels = dels.filter(id => { const p = byId.get(id); return p && !p._new; });
    dels.forEach(id => byId.delete(id));
    this.entries = [...byId.values()];
    saveLocal(this.entries);
    if (cloudDels.length) saveDeletes([...new Set([...loadDeletes(), ...cloudDels])]);
    this.emit();
    this.flush();
    return puts;
  },
  put(e) { return this.commit([e])[0]; },
  remove(id) { this.commit([], [id]); },

  async flush() {
    if (this._flushing) { this._again = true; return this._flushing; }
    this._flushing = (async () => {
      do {
        this._again = false;
        const dels = loadDeletes();
        await runPool(dels, 4, async id => {
          if (await cloudDelete(id)) saveDeletes(loadDeletes().filter(x => x !== id));
        });
        const dirty = this.entries.filter(e => !e.synced);
        await runPool(dirty, 4, async e => {
          const snapT = e.t;
          if (!e._new) await cloudDelete(e.id);
          if (await cloudAdd(e)) {
            const cur = this.get(e.id);
            if (cur) delete cur._new;
            if (cur && cur.t === snapT) cur.synced = true;
            this.emit();
          }
        });
        saveLocal(this.entries);
        this.emit();
      } while (this._again);
    })().finally(() => { this._flushing = null; });
    return this._flushing;
  },

  async sync() {
    this.busy = true; this.emit();
    try {
      await this.flush();
      const cloud = await cloudList();
      this.online = true;
      const pendingDel = new Set(loadDeletes());
      const byId = new Map();
      cloud.forEach(e => { if (!pendingDel.has(e.id)) byId.set(e.id, Object.assign(normalizeEntry(e), { synced: true })); });
      this.entries.forEach(e => { if (!e.synced) byId.set(e.id, e); });
      this.entries = [...byId.values()];
      saveLocal(this.entries);
    } catch (e) { this.online = false; }
    this.busy = false; this.emit();
  }
};

// ---- Derived data ----
const money = n => (n == null || isNaN(n)) ? '—' : '$' + (+n).toFixed(2);
const round2 = n => Math.round(n * 100) / 100;

function orderTotals(o) {
  let filSub = 0, extras = 0, unknown = 0, spools = 0;
  (o.items || []).forEach(it => {
    const q = +it.qty || 0; spools += q;
    if (it.price == null || it.price === '') unknown += q; else filSub += q * (+it.price);
  });
  (o.extras || []).forEach(x => { extras += (+x.qty || 0) * (+x.price || 0); });
  const subtotal = filSub + extras;
  const discount = +o.discount || 0, shipping = +o.shipping || 0;
  const tax = (o.tax != null && o.tax !== '') ? +o.tax : round2(Math.max(0, subtotal - discount) * (+o.taxRate || 0) / 100);
  const total = round2(subtotal - discount + shipping + tax);
  // Landed-cost factor spreads discount, shipping and tax across item prices (filament and extras alike).
  const factor = subtotal > 0 ? total / subtotal : 1;
  return { subtotal: round2(subtotal), filSub: round2(filSub), extras: round2(extras), discount, shipping, tax, total, factor, unknown, spools };
}
function orderReceived(o) {
  if (o.received) return o.received;
  const sh = o.shipments || [];
  if (sh.length && sh.every(s => s.received)) return sh.map(s => s.received).sort().pop();
  return '';
}
function orderEta(o) {
  const etas = (o.shipments || []).filter(s => !s.received && s.eta).map(s => s.eta).sort();
  return etas.length ? etas[etas.length - 1] : '';
}

// Make an order's spools match its items: add missing, drop extra sealed ones, refresh costs.
// Open/empty spools are never deleted (they're history). Returns { puts, dels } for Store.commit.
function reconcileOrderSpools(order, entries) {
  const T = orderTotals(order);
  const linked = entries.filter(e => e.kind === 'spool' && e.orderId === order.id);
  const want = new Map();
  (order.items || []).forEach(it => {
    if (!it.fid) return;
    const w = want.get(it.fid) || [];
    for (let i = 0; i < (+it.qty || 0); i++) w.push(it);
    want.set(it.fid, w);
  });
  const puts = [], dels = [];
  const fids = new Set([...want.keys(), ...linked.map(s => s.fid)]);
  const rank = { sealed: 0, open: 1, empty: 2 };
  fids.forEach(fid => {
    const items = want.get(fid) || [];
    const have = linked.filter(s => s.fid === fid).sort((a, b) => rank[b.status] - rank[a.status]); // keep used ones first
    have.forEach((s, i) => {
      if (i < items.length) {
        const it = items[i];
        const cost = (it.price == null || it.price === '') ? null : round2(+it.price * T.factor);
        const grams = +it.grams || DEFAULT_SPOOL_GRAMS;
        if (s.cost !== cost || s.grams !== grams) puts.push(Object.assign({}, s, { cost, grams }));
      } else if (s.status === 'sealed') dels.push(s.id);
    });
    for (let i = have.length; i < items.length; i++) {
      const it = items[i];
      puts.push({ kind: 'spool', id: newId() + i, fid, orderId: order.id, status: 'sealed',
        grams: +it.grams || DEFAULT_SPOOL_GRAMS,
        cost: (it.price == null || it.price === '') ? null : round2(+it.price * T.factor) });
    }
  });
  return { puts, dels };
}

// Grams left on a spool: 0 when used up, the latest estimate when there is one, else full.
function spoolLeft(s) {
  if (s.status === 'empty') return 0;
  const g = +s.grams || DEFAULT_SPOOL_GRAMS;
  return s.remaining == null || s.remaining === '' ? g : Math.max(0, Math.min(g, +s.remaining));
}
function spoolPct(s) { return Math.round(spoolLeft(s) / (+s.grams || DEFAULT_SPOOL_GRAMS) * 100); }

// Per-filament stock summary. gramsLeft = estimated filament on hand (sealed + open, not incoming);
// openPcts = % left on each open spool, lowest first.
function stockFor(fid, entries) {
  const orders = new Map(entries.filter(e => e.kind === 'order').map(o => [o.id, o]));
  const r = { incoming: 0, sealed: 0, open: 0, empty: 0, spools: [], gramsLeft: 0, openPcts: [] };
  entries.forEach(s => {
    if (s.kind !== 'spool' || s.fid !== fid) return;
    r.spools.push(s);
    const o = orders.get(s.orderId);
    if (s.status === 'empty') r.empty++;
    else if (o && !orderReceived(o)) r.incoming++;
    else {
      r[s.status === 'open' ? 'open' : 'sealed']++;
      r.gramsLeft += spoolLeft(s);
      if (s.status === 'open') r.openPcts.push(spoolPct(s));
    }
  });
  r.openPcts.sort((a, b) => a - b);
  r.onHand = r.sealed + r.open;
  return r;
}
function spoolIncoming(s, entries) {
  const o = s.orderId && entries.find(e => e.id === s.orderId);
  return !!(o && !orderReceived(o) && s.status !== 'empty');
}

// Tracking links by carrier (auto-detected from the number when not given).
function detectCarrier(num) {
  const n = String(num || '').replace(/\s/g, '');
  if (/^1Z/i.test(n)) return 'UPS';
  if (/^(94|93|92|95)\d{18,20}$/.test(n) || /^[A-Z]{2}\d{9}US$/i.test(n)) return 'USPS';
  if (/^\d{12}$|^\d{15}$|^\d{20}$/.test(n)) return 'FedEx';
  return '';
}
function trackingUrl(num, carrier) {
  const n = encodeURIComponent(String(num || '').replace(/\s/g, ''));
  switch (carrier || detectCarrier(num)) {
    case 'UPS': return 'https://www.ups.com/track?tracknum=' + n;
    case 'FedEx': return 'https://www.fedex.com/fedextrack/?trknbr=' + n;
    case 'USPS': return 'https://tools.usps.com/go/TrackConfirmAction?tLabels=' + n;
    default: return 'https://www.google.com/search?q=' + n;
  }
}

function swatchCss(f) {
  if (!f) return '#ccc';
  return f.hex2 ? `linear-gradient(135deg, ${f.hex} 0%, ${f.hex} 30%, ${f.hex2} 70%, ${f.hex2} 100%)` : f.hex;
}
function sortFilaments(a) {
  return a.slice().sort((x, y) => (x.brand || '').localeCompare(y.brand || '') || (x.material || '').localeCompare(y.material || '')
    || String(x.code || '').localeCompare(String(y.code || ''), undefined, { numeric: true }) || x.name.localeCompare(y.name));
}

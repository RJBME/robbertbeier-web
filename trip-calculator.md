---
layout: default
title: EV Trip Calculator
permalink: /trip-calculator/
---

{% comment %}
=============================================================
  EV TRIP CALCULATOR
  Runs 100% client-side (GitHub Pages friendly — no backend).

  Data sources (all free, no API key):
    - Nominatim (OpenStreetMap)  → geocode addresses
    - OSRM demo server           → route distance + duration
    - Open-Meteo                 → temperature for the trip

  Efficiency MODEL is built at page load from your real charging
  sessions (energy_kwh + miles_added + temperature_f). See buildModel().
=============================================================
{% endcomment %}

<style>
  .trip-container { font-family: -apple-system, sans-serif; max-width: 1000px; margin: auto; color: var(--text); }

  .charge-nav { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--dash-border); align-items: center; }
  .charge-nav a { font-size: 0.78rem; font-weight: 600; text-decoration: none; padding: 5px 14px; border-radius: 20px; border: 1px solid var(--dash-border); background: var(--dash-card); color: #888; transition: all 0.15s; }
  .charge-nav a:hover  { border-color: var(--link); color: var(--link); }
  .charge-nav a.active { background: var(--link); border-color: var(--link); color: #fff; font-weight: 700; }

  .trip-header h1 { margin: 0 0 4px 0; }
  .trip-header p  { margin: 0 0 20px 0; color: #888; font-size: 0.85rem; }

  .trip-card { background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 12px; padding: 20px; margin-bottom: 20px; }

  .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field.full { grid-column: 1 / -1; }
  .field label { font-size: 0.65rem; text-transform: uppercase; font-weight: 700; color: #888; letter-spacing: 0.06em; }
  .field input, .field select {
    padding: 9px 12px; border-radius: 8px; border: 1px solid var(--dash-border);
    background: var(--bg); color: var(--text); font-size: 0.85rem; box-sizing: border-box; width: 100%;
  }
  .field .hint { font-size: 0.62rem; color: #888; }
  .quick-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .quick-row button {
    font-size: 0.68rem; padding: 3px 10px; border-radius: 14px; cursor: pointer;
    border: 1px solid var(--dash-border); background: var(--dash-card); color: #888; transition: all 0.15s;
  }
  .quick-row button:hover { border-color: var(--link); color: var(--link); }

  /* Google-Maps-style reorderable route list */
  #routeStops { display: flex; flex-direction: column; }
  .route-row { display: grid; grid-template-columns: 18px 16px 1fr auto auto auto; align-items: center; gap: 7px; padding: 4px 0; position: relative; }
  .route-row.dragging { opacity: 0.5; }
  .rs-handle { cursor: grab; color: #aaa; font-size: 0.95rem; text-align: center; user-select: none; touch-action: none; }
  .rs-handle:active { cursor: grabbing; }
  .rs-dot { width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; }
  .rs-dot::before { content: ''; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #888; box-sizing: border-box; }
  .rs-dot.rs-dest::before { content: '📍'; border: none; font-size: 13px; width: auto; height: auto; }
  /* dotted connector between rows */
  .route-row:not(:last-child) .rs-dot::after { content: ''; position: absolute; left: 25px; top: 24px; height: calc(100% - 14px); border-left: 2px dotted var(--dash-border); }
  .rs-addr { min-width: 0; padding: 9px 11px; border-radius: 8px; border: 1px solid var(--dash-border); background: var(--bg); color: var(--text); font-size: 0.84rem; }
  .rs-btn { border: 1px solid var(--dash-border); background: var(--dash-card); color: #888; border-radius: 8px; padding: 6px 8px; cursor: pointer; font-size: 0.8rem; line-height: 1; }
  .rs-btn:hover { border-color: var(--link); color: var(--link); }
  .rs-charge.on { background: var(--link); border-color: var(--link); color: #fff; }
  .rs-del { visibility: hidden; }
  .route-row.removable .rs-del { visibility: visible; color: #ef4444; }
  /* charge slider row (full width under the stop) */
  .rs-slider { grid-column: 3 / -1; display: none; align-items: center; gap: 10px; padding: 4px 2px 8px; }
  .rs-slider.show { display: flex; }
  .rs-slider input[type=range] { flex: 1; accent-color: #16a34a; }
  .rs-slider .rs-pct { font-size: 0.78rem; font-weight: 700; color: #16a34a; min-width: 56px; }
  .rs-slider .rs-pct small { font-weight: 400; color: #888; }

  .stop.wp-stop .stop-num { background: #16a34a; }
  .net-wp { background: #16a34a20; color: #16a34a; }

  .opt-row { display: flex; gap: 18px; flex-wrap: wrap; align-items: flex-end; margin-top: 16px; }
  .opt-row .field { flex: 1; min-width: 130px; }
  .check { display: flex; align-items: center; gap: 7px; font-size: 0.8rem; color: var(--text); }
  .check input { width: auto; }

  .go-btn {
    width: 100%; margin-top: 18px; padding: 13px; border: none; border-radius: 10px;
    background: var(--link); color: #fff; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s;
  }
  .go-btn:hover { opacity: 0.9; }
  .go-btn:disabled { opacity: 0.5; cursor: progress; }

  .status-msg { font-size: 0.78rem; color: #888; margin-top: 10px; text-align: center; min-height: 1em; }
  .status-msg.err { color: #ef4444; }

  /* Results */
  #results { display: none; }
  .result-hero { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
  .hero-stat { flex: 1; min-width: 130px; background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 12px; padding: 16px; text-align: center; }
  .hero-stat .big { font-size: 1.7rem; font-weight: 800; line-height: 1.1; }
  .hero-stat .lbl { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin-top: 4px; }
  .hero-stat .sub { font-size: 0.7rem; color: #888; margin-top: 3px; }

  /* Route options */
  .routes-title { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.06em; color: #888; font-weight: 700; margin-bottom: 8px; }
  .routes-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
  .route-card {
    flex: 1; min-width: 140px; text-align: left; cursor: pointer; font-family: inherit;
    background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 12px;
    padding: 12px 14px; transition: all 0.15s; color: var(--text);
  }
  .route-card:hover { border-color: var(--link); }
  .route-card.sel { border-color: var(--link); box-shadow: inset 0 0 0 1px var(--link); background: rgba(93,63,211,0.06); }
  .route-card .rc-top { font-size: 1.05rem; font-weight: 700; }
  .route-card .rc-dim { color: #888; font-weight: 400; font-size: 0.8rem; }
  .route-card .rc-energy { font-size: 0.8rem; color: var(--link); font-weight: 600; margin-top: 3px; }
  .route-card .rc-tags { margin-top: 7px; display: flex; gap: 5px; flex-wrap: wrap; }
  .rtag { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; padding: 2px 7px; border-radius: 10px; background: var(--dash-border); color: #888; }
  .rtag.eff { background: #22c55e22; color: #16a34a; }

  .fleet-note { font-size: 0.74rem; color: var(--text); background: #3b82f614; border: 1px solid #3b82f640; border-radius: 10px; padding: 10px 14px; margin-bottom: 18px; }

  /* Road-Trips-style stat grid (matches charging-analytics.md) */
  .summary-card { padding: 16px 18px; }
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px; }
  .summary-grid > div { text-align: center; }
  .sg-lbl { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 3px; }
  .sg-val { font-weight: 800; font-size: 1rem; }
  .sg-green { color: #2ecc71; }
  .sg-amber { color: #f39c12; }

  /* Charging stops */
  .stop { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--dash-border); }
  .stop:last-child { border-bottom: none; }
  .stop-num { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: var(--link); color: #fff; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .stop-main { flex: 1; min-width: 0; }
  .stop-name { font-weight: 600; font-size: 0.9rem; }
  .stop-sub { font-size: 0.72rem; color: #888; margin-top: 1px; }
  .stop-charge { font-size: 0.8rem; margin-top: 5px; }
  .stop-charge b { color: var(--link); }
  .net-badge { display: inline-block; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; padding: 2px 7px; border-radius: 10px; margin-left: 6px; vertical-align: middle; }
  .net-tesla { background: #e8222220; color: #e82222; }
  .net-ea    { background: #00b04f20; color: #00963f; }
  .net-cp    { background: #f9731620; color: #f97316; }
  .stops-summary { font-size: 0.78rem; color: #888; margin: 6px 0 14px; }
  .stops-note { font-size: 0.78rem; color: var(--text); padding: 4px 0; }
  .stops-key { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 8px; }
  .stops-key input { flex: 1; min-width: 160px; padding: 8px 11px; border-radius: 8px; border: 1px solid var(--dash-border); background: var(--bg); color: var(--text); font-size: 0.8rem; }
  .stops-key button { padding: 8px 14px; border-radius: 8px; border: none; background: var(--link); color: #fff; font-weight: 600; font-size: 0.8rem; cursor: pointer; }
  .stops-key a { color: var(--link); }

  .verdict { border-radius: 12px; padding: 16px 20px; margin-bottom: 18px; font-size: 0.92rem; font-weight: 600; display: flex; align-items: center; gap: 12px; }
  .verdict .vicon { font-size: 1.6rem; }
  .verdict.ok    { background: #22c55e1a; border: 1px solid #22c55e55; color: var(--text); }
  .verdict.tight { background: #eab3081a; border: 1px solid #eab30855; color: var(--text); }
  .verdict.no    { background: #ef44441a; border: 1px solid #ef444455; color: var(--text); }

  #map { height: 320px; border-radius: 12px; margin-bottom: 18px; border: 1px solid var(--dash-border); z-index: 0; }

  .breakdown { font-size: 0.82rem; }
  .breakdown h4 { margin: 0 0 12px 0; font-size: 0.9rem; }
  .breakdown table { width: 100%; border-collapse: collapse; }
  .breakdown td { padding: 8px 4px; border-bottom: 1px solid var(--dash-border); vertical-align: middle; }
  .breakdown tr:last-child td { border-bottom: none; }
  .breakdown td:last-child { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; white-space: nowrap; }
  .breakdown .factor-src { font-size: 0.62rem; color: #888; display: block; margin-top: 1px; }
  .src-data  { color: #22c55e; }
  .src-model { color: #eab308; }

  .soc-bar-wrap { margin-top: 4px; }
  .soc-bar { height: 22px; border-radius: 6px; background: var(--dash-border); overflow: hidden; position: relative; display: flex; }
  .soc-fill { background: linear-gradient(90deg, #22c55e, #16a34a); transition: width 0.4s; }
  .soc-used { background: repeating-linear-gradient(45deg, #ef444455, #ef444455 6px, transparent 6px, transparent 12px); }
  .soc-labels { display: flex; justify-content: space-between; font-size: 0.62rem; color: #888; margin-top: 4px; }

  .disclaimer { font-size: 0.66rem; color: #888; line-height: 1.5; margin-top: 6px; }
  .disclaimer b { color: var(--text); }

  .dev-banner { font-size: 0.76rem; background: #eab30818; border: 1px solid #eab30855; color: var(--text); border-radius: 10px; padding: 10px 14px; margin-bottom: 18px; line-height: 1.45; }
  .dev-banner b { color: #b45309; }

  @media (max-width: 600px) {
    .field-grid { grid-template-columns: 1fr; }
    .hero-stat .big { font-size: 1.4rem; }
  }
</style>

<div class="trip-container">

<script>(function(){
  var lnk = document.querySelector("link[rel~='icon']") || document.createElement('link');
  lnk.rel = 'icon';
  lnk.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧭</text></svg>";
  if (!lnk.parentNode) document.head.appendChild(lnk);
})();</script>

  <nav class="charge-nav">
    <a href="/charging/">⚡ Dashboard</a>
    <a href="/charging-history/">📋 History</a>
    <a href="/charging-analytics/">📊 Analytics</a>
    <a href="/trip-calculator/" class="active">🧭 Trip</a>
  </nav>

  <div class="dev-banner">🚧 <b>Under development</b> — actively being built and tuned. Charging suggestions are estimates; always sanity-check against your car or a tool like ABRP before relying on them.</div>

  <div class="trip-header">
    <h1>🧭 EV Trip Calculator</h1>
    <p>Energy estimate built from <strong id="modelSessionCount">your</strong> real charging sessions — temperature-aware.</p>
  </div>

  <div class="trip-card">
    <div class="field full">
      <label>Route <span style="font-weight:400;text-transform:none">— drag ⠿ to reorder, ⚡ to charge at a stop</span></label>
      <div id="routeStops"></div>
      <div class="quick-row"><button type="button" onclick="addStop()">＋ Add stop</button></div>
    </div>

    <div class="opt-row">
      <div class="field">
        <label>Vehicle</label>
        <select id="vehSel"></select>
      </div>
      <div class="field">
        <label>Departure date</label>
        <input id="depDate" type="date">
      </div>
      <div class="field">
        <label>Road type</label>
        <select id="roadType">
          <option value="auto">Auto (from route)</option>
          <option value="highway">Mostly highway</option>
          <option value="mixed">Mixed</option>
          <option value="city">Mostly city</option>
        </select>
      </div>
      <div class="field">
        <label>Efficiency override <span style="font-weight:400;text-transform:none">(optional)</span></label>
        <input id="effOverride" type="number" step="0.05" min="0.5" max="6" placeholder="use model">
        <span class="hint">mi/kWh — blank = use model</span>
      </div>
    </div>

    <div class="opt-row">
      <div class="field">
        <label>Start charge % <span style="font-weight:400;text-transform:none">(optional)</span></label>
        <input id="startSoc" type="number" min="0" max="100" placeholder="e.g. 80">
      </div>
      <div class="field">
        <label>Reserve buffer %</label>
        <input id="reserve" type="number" min="0" max="50" value="10">
        <span class="hint">Don't plan to arrive below this</span>
      </div>
      <div style="flex:1;min-width:150px;display:flex;flex-direction:column;gap:6px">
        <label class="check"><input type="checkbox" id="roundTrip" onchange="onRoundTripToggle()"> Round trip</label>
        <label class="check" id="destChargeWrap" style="display:none"><input type="checkbox" id="canChargeDest"> Can charge at destination</label>
      </div>
    </div>

    <button class="go-btn" id="goBtn" onclick="planTrip()">Estimate trip ⚡</button>
    <div class="status-msg" id="status"></div>
  </div>

  <div id="results">
    <div id="routeOptions"></div>
    <div class="fleet-note" id="fleetNote" style="display:none"></div>
    <div class="verdict" id="verdict"></div>

    <div class="result-hero">
      <div class="hero-stat"><div class="big" id="rDist">–</div><div class="lbl">Distance</div><div class="sub" id="rDistSub"></div></div>
      <div class="hero-stat"><div class="big" id="rEnergy">–</div><div class="lbl">Energy needed</div><div class="sub" id="rEnergySub"></div></div>
      <div class="hero-stat"><div class="big" id="rEff">–</div><div class="lbl">Est. efficiency</div><div class="sub" id="rEffSub"></div></div>
      <div class="hero-stat"><div class="big" id="rTemp">–</div><div class="lbl">Trip temp</div><div class="sub" id="rTempSub"></div></div>
    </div>

    <!-- Cost / gas report — same stat-grid format as Road Trips on Analytics -->
    <div class="trip-card summary-card" id="tripSummary" style="display:none">
      <div class="summary-grid">
        <div><div class="sg-lbl">Charged</div><div class="sg-val" id="sgCharged">–</div></div>
        <div><div class="sg-lbl">Est. cost</div><div class="sg-val" id="sgCost">–</div></div>
        <div><div class="sg-lbl">Saved vs Gas</div><div class="sg-val" id="sgSaved">–</div></div>
        <div><div class="sg-lbl">DCFC Time</div><div class="sg-val" id="sgDcfc">–</div></div>
        <div><div class="sg-lbl" id="sgGasStopsLbl">Gas Stops</div><div class="sg-val" id="sgGasStops">–</div></div>
        <div><div class="sg-lbl">Time vs Gas</div><div class="sg-val" id="sgTimeVsGas">–</div></div>
        <div><div class="sg-lbl">Stops</div><div class="sg-val" id="sgStops">–</div></div>
      </div>
    </div>

    <div class="trip-card" id="socCard" style="display:none">
      <h4 style="margin:0 0 12px 0;font-size:0.9rem;">State of charge</h4>
      <div class="soc-bar-wrap">
        <div class="soc-bar">
          <div class="soc-fill" id="socFill"></div>
          <div class="soc-used" id="socUsed"></div>
        </div>
        <div class="soc-labels"><span id="socStartLbl"></span><span id="socEndLbl"></span></div>
      </div>
    </div>

    <div class="trip-card" id="stopsCard" style="display:none">
      <h4 style="margin:0 0 4px 0;font-size:0.9rem;">⚡ Charging stops</h4>
      <div id="stopsBody"></div>
    </div>

    <div id="map"></div>

    <div class="trip-card breakdown">
      <h4>How this estimate was built</h4>
      <table>
        <tr><td>Base efficiency <span class="factor-src src-data">✓ from your sessions</span></td><td id="bBase"></td></tr>
        <tr><td>Temperature adjustment <span class="factor-src src-model">≈ EV temp curve, anchored to your data</span></td><td id="bTemp"></td></tr>
        <tr><td>Road-type adjustment <span class="factor-src src-model">≈ physics estimate</span></td><td id="bRoad"></td></tr>
        <tr id="bElevRow" style="display:none"><td>Elevation <span class="factor-src src-model">≈ physics (m·g·h, partial regen)</span></td><td id="bElev"></td></tr>
        <tr><td>Effective efficiency</td><td id="bEff"></td></tr>
        <tr><td>Usable battery</td><td id="bBatt"></td></tr>
      </table>
      <p class="disclaimer">
        <b>Base efficiency is straight from your data</b> — the median mi/kWh across your real charging sessions, at the temperature they typically happened.
        <b>The temperature adjustment</b> uses a published EV range-vs-temperature curve, anchored to that number — your logged range estimates are too noisy to fit the cold-weather slope directly, so the <i>magnitude</i> is yours and the <i>direction</i> is the curve's.
        <b>Road-type</b> is a physics estimate (aero drag rises with speed²) — your logs don't record driving style.
        Routing &amp; geocoding via OpenStreetMap (Nominatim + OSRM); temperature via Open-Meteo. Estimates only — your mileage will vary.
      </p>
    </div>
  </div>

</div>

<script>
// ============================================================
//  REAL SESSION DATA (embedded by Jekyll at build time)
// ============================================================
const RAW_SESSIONS = [
{% assign ss = site.charging | sort: "date" %}{% for s in ss %}{% if s.energy_kwh and s.energy_kwh != "" %}{"v":{{ s.vehicle | jsonify }},"kwh":{{ s.energy_kwh }},"mi":{% if s.miles_added and s.miles_added != "" %}{{ s.miles_added }}{% else %}0{% endif %},"tf":{% if s.temperature_f and s.temperature_f != "" %}{{ s.temperature_f }}{% else %}null{% endif %},"soc":{% if s.soc_added and s.soc_added != "" %}{{ s.soc_added }}{% else %}null{% endif %},"cost":{% if s.cost and s.cost != "" %}{{ s.cost }}{% else %}0{% endif %},"loc":{{ s.location | jsonify }}},
{% endif %}{% endfor %}
];

// Known usable battery capacity (kWh) — fallback only; the model also derives
// this straight from your data (energy added ÷ %SoC added), so a new car
// self-calibrates as it logs sessions.
const BATTERY = { '2025 Mach-E GT': 91.7, "LRB's 2025 Mach-E GT": 91.7 };
const DEFAULT_BATTERY = 91.7;
// Gas comparison: latest mpg + gas price from _data/rates.yml
{% assign gs = site.data.rates.gas_savings | last %}
const GAS = { mpg: {{ gs.mpg | default: 27 }}, price: {{ gs.gas_price | default: 4.0 }} };
const GAS_STOP_MIN = 6;     // minutes per gas fill-up (matches analytics Road Trips)
const GAS_TANK_GAL = 15.7;  // tank size of the comparison gas car (range = mpg × this)
function fmtMinsShort(m){ m = Math.round(m); return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m} min`; }
const MIN_OWN_SESSIONS = 5; // below this, a vehicle borrows the fleet average
const FLEET_FALLBACK_EFF = 3.0; // mi/kWh if a vehicle has no usable data

// SE-Michigan monthly avg temp (°F) — last-resort fallback for temperature
const MI_MONTHLY_F = [26,29,38,49,60,70,75,73,65,53,41,31];

// Canonical EV efficiency vs ambient temp, relative to ~70°F peak (=1.00).
// Shape from published EV range-vs-temperature studies (Geotab/Recurrent).
const TEMP_CURVE = [[0,0.62],[20,0.72],[32,0.78],[50,0.90],[65,0.99],[72,1.00],[86,0.95],[100,0.88]];
// Road-type / speed multiplier relative to ~40 mph mixed driving (=1.00).
const SPEED_CURVE = [[20,1.10],[30,1.06],[40,1.00],[50,0.95],[60,0.89],[70,0.83],[80,0.78]];

function lerp(curve, x){
  if (x <= curve[0][0]) return curve[0][1];
  if (x >= curve[curve.length-1][0]) return curve[curve.length-1][1];
  for (let i=0;i<curve.length-1;i++){
    const [x0,y0]=curve[i], [x1,y1]=curve[i+1];
    if (x>=x0 && x<=x1) return y0 + (y1-y0)*(x-x0)/(x1-x0);
  }
  return 1;
}
function median(a){ if(!a.length) return null; const b=[...a].sort((x,y)=>x-y); const m=b.length>>1; return b.length%2?b[m]:(b[m-1]+b[m])/2; }

// ============================================================
//  MODEL — built from RAW_SESSIONS
// ============================================================
const MODEL = (function buildModel(){
  const veh = {};
  let usableCount = 0;
  RAW_SESSIONS.forEach(s => {
    if (!(s.kwh > 0)) return;
    if (!(s.v in veh)) veh[s.v] = { effs: [], temps: [], batt: [] };
    if (s.mi > 0){
      const e = s.mi / s.kwh;
      if (e > 1 && e < 6){ // sanity bounds — drop guess-o-meter outliers
        veh[s.v].effs.push(e);
        if (s.tf != null) veh[s.v].temps.push(s.tf);
        usableCount++;
      }
    }
    // Usable battery = energy added ÷ fraction of pack added (ignore tiny charges)
    if (s.soc != null && s.soc >= 15) veh[s.v].batt.push(s.kwh / (s.soc / 100));
  });

  // Fleet averages from vehicles that already have enough of their own data —
  // these become the prior a brand-new car inherits the day you switch.
  const estEffs = [], estBatts = [];
  for (const v in veh){
    if (veh[v].effs.length >= MIN_OWN_SESSIONS) estEffs.push(median(veh[v].effs));
    if (veh[v].batt.length >= MIN_OWN_SESSIONS) estBatts.push(median(veh[v].batt));
  }
  const fleetEff  = estEffs.length  ? median(estEffs)  : FLEET_FALLBACK_EFF;
  const fleetBatt = estBatts.length ? median(estBatts) : DEFAULT_BATTERY;

  // Per vehicle: use its OWN data when it has enough, otherwise borrow the fleet.
  //   baseEff = median mi/kWh magnitude (direction of temp comes from the curve)
  //   tRef    = the temperature those sessions typically happened at
  //   battery = data-derived usable kWh, or known spec, or fleet average
  for (const v in veh){
    const d = veh[v];
    d.ownEff  = d.effs.length >= MIN_OWN_SESSIONS;
    d.ownBatt = d.batt.length >= MIN_OWN_SESSIONS;
    d.nEff    = d.effs.length;
    d.baseEff = d.ownEff ? median(d.effs) : (d.effs.length ? (median(d.effs) + fleetEff) / 2 : fleetEff);
    d.tRef    = d.temps.length ? median(d.temps) : 60;
    d.battery = d.ownBatt ? median(d.batt) : (BATTERY[v] || fleetBatt);
    d.battSrc = d.ownBatt ? 'your data' : (BATTERY[v] ? 'spec' : 'fleet avg');
  }
  return { veh, usableCount, fleetEff, fleetBatt };
})();

// Predict absolute mi/kWh for a vehicle at a given temperature.
// Anchors your real efficiency at its typical temperature, then scales by the
// canonical temperature curve so cold correctly reduces range and warm restores it.
function predictEff(vehName, tempF){
  const v = MODEL.veh[vehName] || { baseEff: MODEL.fleetEff, tRef: 60 };
  return v.baseEff * lerp(TEMP_CURVE, tempF) / lerp(TEMP_CURVE, v.tRef);
}
function vehModel(name){ return MODEL.veh[name] || { baseEff: MODEL.fleetEff, tRef: 60, battery: MODEL.fleetBatt, battSrc: 'fleet avg', ownEff: false, nEff: 0 }; }

// ── Your real charging COSTS: $/kWh per place, from your sessions ──
function costBucket(loc){
  const l = (loc || '').toLowerCase();
  if (l.includes('home')) return 'home';
  if (l.includes('work')) return 'work';
  if (l.includes('tesla')) return 'Tesla';
  if (l.includes('electrify')) return 'Electrify America';
  if (l.includes('chargepoint')) return 'ChargePoint';
  return 'other';
}
const COST = (function buildCost(){
  const b = {};
  RAW_SESSIONS.forEach(s => {
    if (!(s.kwh > 0)) return;
    const k = costBucket(s.loc);
    (b[k] ??= { kwh: 0, paidKwh: 0, paidCost: 0 });
    b[k].kwh += s.kwh;
    if ((s.cost || 0) > 0){ b[k].paidKwh += s.kwh; b[k].paidCost += s.cost; }
  });
  const rate = k => (b[k] && b[k].paidKwh > 0) ? b[k].paidCost / b[k].paidKwh : null;
  // overall paid public DCFC average (fallback for networks you haven't used, e.g. EA)
  let pk = 0, pc = 0;
  ['Tesla', 'Electrify America', 'ChargePoint', 'other'].forEach(k => { if (b[k]){ pk += b[k].paidKwh; pc += b[k].paidCost; } });
  const publicAvg = pk > 0 ? pc / pk : 0.35;
  return {
    home: rate('home') ?? 0.20,
    Tesla: rate('Tesla') ?? publicAvg,
    // You've never logged an EA session; EA pay-as-you-go runs ~$0.60/kWh.
    'Electrify America': rate('Electrify America') ?? 0.60,
    ChargePoint: rate('ChargePoint') ?? publicAvg,
    publicAvg
  };
})();

// ============================================================
//  UI setup
// ============================================================
(function initUI(){
  document.getElementById('modelSessionCount').textContent = MODEL.usableCount + ' of your';
  const sel = document.getElementById('vehSel');
  const names = Object.keys(MODEL.veh);
  // default order: most data first
  names.sort((a,b)=> (MODEL.veh[b].effs.length||0) - (MODEL.veh[a].effs.length||0));
  if (!names.length) names.push('2025 Mach-E GT');
  names.forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n; sel.appendChild(o); });
  const dd = document.getElementById('depDate');
  dd.value = new Date().toISOString().slice(0,10);
  dd.min = '2000-01-01';
  // Seed the route with a Start and a Destination row, enable drag reordering.
  addStop(); addStop();
  renderStopKinds();
  enableStopDrag();
})();

const HOME = { lat: 42.3714, lon: -83.4702, label: 'Home — Plymouth, MI' };

// ── Reorderable route list (Google-Maps style) ──
// One ordered column of rows: first = start, last = destination, middle = stops.
// Any row can toggle "charge here" (a slider sets the target %).
function makeStopRow(addr, charge){
  const row = document.createElement('div');
  row.className = 'route-row';
  row.innerHTML =
      `<span class="rs-handle" title="Drag to reorder">⠿</span>`
    + `<span class="rs-dot"></span>`
    + `<input class="rs-addr" type="text" placeholder="Address or place" autocomplete="off">`
    + `<button type="button" class="rs-btn rs-home" title="Use home">🏠</button>`
    + `<button type="button" class="rs-btn rs-charge" title="Charge here">⚡</button>`
    + `<button type="button" class="rs-btn rs-del" title="Remove stop">×</button>`
    + `<div class="rs-slider"><input type="range" min="50" max="100" step="5" value="${charge||80}"><span class="rs-pct"></span></div>`;
  row.querySelector('.rs-addr').value = addr || '';
  const slider = row.querySelector('.rs-slider'), range = row.querySelector('input[type=range]'), pct = row.querySelector('.rs-pct');
  const updatePct = () => pct.innerHTML = `${range.value}% <small>charge here</small>`;
  updatePct();
  if (charge != null){ row.classList.add('charging'); row.querySelector('.rs-charge').classList.add('on'); slider.classList.add('show'); }
  row.querySelector('.rs-charge').onclick = () => {
    const on = row.classList.toggle('charging');
    row.querySelector('.rs-charge').classList.toggle('on', on);
    slider.classList.toggle('show', on);
    syncCharges();   // charge changes apply live (no re-geocode needed)
  };
  range.oninput = updatePct;
  range.onchange = syncCharges;
  row.querySelector('.rs-home').onclick = () => { const i = row.querySelector('.rs-addr'); i.value = HOME.label; i.dataset.home = '1'; };
  row.querySelector('.rs-del').onclick = () => { row.remove(); renderStopKinds(); };
  row.querySelector('.rs-addr').addEventListener('input', e => delete e.target.dataset.home);
  row.querySelector('.rs-addr').addEventListener('keydown', e => { if (e.key === 'Enter') planTrip(); });
  return row;
}
// Charge toggle/slider changed after a plan exists — update the waypoint anchors
// (intermediate rows map to STATE.waypoints in order) and re-plan, no geocoding.
function syncCharges(){
  if (!STATE) return;
  const middle = [...document.querySelectorAll('#routeStops .route-row')].slice(1, -1);
  if (middle.length !== STATE.waypoints.length) return; // structure changed → click Estimate
  STATE.waypoints.forEach((wp, i) => {
    const row = middle[i];
    wp.chargeTo = row.classList.contains('charging') ? +row.querySelector('input[type=range]').value : NaN;
  });
  refresh();
}
function addStop(addr, charge){
  const list = document.getElementById('routeStops');
  list.appendChild(makeStopRow(addr, charge));
  renderStopKinds();
}
// Recompute each row's role (dot, placeholder, charge availability, deletability)
// from its position after any add / remove / drag-reorder.
function renderStopKinds(){
  const rows = [...document.querySelectorAll('#routeStops .route-row')];
  rows.forEach((row, i) => {
    const isStart = i === 0, isDest = i === rows.length - 1;
    const dot = row.querySelector('.rs-dot');
    dot.className = 'rs-dot' + (isDest ? ' rs-dest' : '');
    row.querySelector('.rs-addr').placeholder = isStart ? 'Start — address or place' : isDest ? 'Destination — address or place' : 'Stop — address or place';
    // "charge here" only applies to intermediate stops (you set start charge
    // separately, and charging at the final destination doesn't affect the plan).
    const endpoint = isStart || isDest;
    row.querySelector('.rs-charge').style.display = endpoint ? 'none' : '';
    if (endpoint && row.classList.contains('charging')){ row.classList.remove('charging'); row.querySelector('.rs-slider').classList.remove('show'); row.querySelector('.rs-charge').classList.remove('on'); }
    row.classList.toggle('removable', rows.length > 2);
  });
}
function getRouteStops(){
  return [...document.querySelectorAll('#routeStops .route-row')].map(row => ({
    addr: row.querySelector('.rs-addr').value.trim(),
    isHome: row.querySelector('.rs-addr').dataset.home === '1',
    chargeHere: row.classList.contains('charging'),
    chargeTo: +row.querySelector('input[type=range]').value
  }));
}
// Lazy-load SortableJS for drag reordering (works on touch too).
function enableStopDrag(){
  const init = () => { if (window.Sortable && !document.getElementById('routeStops')._sortable){
    document.getElementById('routeStops')._sortable = Sortable.create(document.getElementById('routeStops'), {
      handle: '.rs-handle', animation: 150, ghostClass: 'dragging',
      onEnd: () => { renderStopKinds(); }
    });
  }};
  if (window.Sortable) return init();
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js';
  s.onload = init; document.body.appendChild(s);
}

function setStatus(msg, isErr){
  const el = document.getElementById('status');
  el.textContent = msg || '';
  el.className = 'status-msg' + (isErr ? ' err' : '');
}

// ============================================================
//  External APIs (all free, no key)
// ============================================================
async function geocode(q, el){
  if (el && el.dataset.home === '1') return { lat: HOME.lat, lon: HOME.lon, name: HOME.label };
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q);
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  const j = await r.json();
  if (!j.length) throw new Error('Could not find "' + q + '"');
  return { lat: +j[0].lat, lon: +j[0].lon, name: j[0].display_name };
}

// Route through an ordered list of points. With exactly 2 points we ask for
// alternatives; with waypoints we get one route. legMiles[i] = cumulative miles
// at input point i (so waypoint SoC anchors land at the right distance).
async function route(points){
  const coordStr = points.map(p => `${p.lon},${p.lat}`).join(';');
  const alt = points.length === 2;
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&alternatives=${alt ? '3' : 'false'}`;
  const r = await fetch(url);
  const j = await r.json();
  if (!j.routes || !j.routes.length) throw new Error('No driving route found between those points.');
  return j.routes.slice(0, alt ? 3 : 1).map(rt => {
    const legMiles = [0]; let acc = 0;
    (rt.legs || []).forEach(l => { acc += l.distance / 1609.34; legMiles.push(acc); });
    return { miles: rt.distance / 1609.34, hours: rt.duration / 3600, geometry: rt.geometry, legMiles };
  });
}

async function tripTemp(lat, lon, dateStr){
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((d - today) / 86400000);
  try {
    // Within forecast/recent window → exact daily forecast
    if (diffDays >= -60 && diffDays <= 15){
      const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
      const j = await (await fetch(u)).json();
      const mx = j.daily?.temperature_2m_max?.[0], mn = j.daily?.temperature_2m_min?.[0];
      if (mx != null && mn != null) return { f: (mx + mn) / 2, src: 'forecast' };
    }
    // Otherwise → climatology from the same calendar date, prior years (archive)
    const yr = d.getFullYear();
    const md = dateStr.slice(5);
    const temps = [];
    for (let y = yr - 1; y >= yr - 3; y--){
      const ds = y + '-' + md;
      const u = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${ds}&end_date=${ds}&daily=temperature_2m_mean&temperature_unit=fahrenheit&timezone=auto`;
      const j = await (await fetch(u)).json();
      const t = j.daily?.temperature_2m_mean?.[0];
      if (t != null) temps.push(t);
    }
    if (temps.length) return { f: temps.reduce((s,x)=>s+x,0)/temps.length, src: 'historical avg' };
  } catch(e){ /* fall through */ }
  return { f: MI_MONTHLY_F[d.getMonth()], src: 'seasonal est' };
}

// ============================================================
//  Main flow
// ============================================================
let MAP, ROUTE_LAYER, STATE = null;
async function planTrip(){
  const btn = document.getElementById('goBtn');
  const stops = getRouteStops().filter(s => s.addr);
  if (stops.length < 2){ setStatus('Enter at least a start and a destination.', true); return; }
  btn.disabled = true;
  try {
    setStatus('Finding locations…');
    const geo = await Promise.all(stops.map(s =>
      s.isHome ? Promise.resolve({ lat: HOME.lat, lon: HOME.lon, name: HOME.label }) : geocode(s.addr)));
    const A = geo[0], B = geo[geo.length - 1];
    // Intermediate stops become waypoints, carrying their "charge here" target.
    const waypoints = [];
    for (let i = 1; i < stops.length - 1; i++){
      waypoints.push({ addr: stops[i].addr, lat: geo[i].lat, lon: geo[i].lon,
        chargeTo: stops[i].chargeHere ? stops[i].chargeTo : NaN });
    }

    setStatus('Planning route…');
    const routes = await route([A, ...waypoints, B]);

    const mid = { lat: (A.lat + B.lat) / 2, lon: (A.lon + B.lon) / 2 };
    setStatus('Checking the weather…');
    const temp = await tripTemp(mid.lat, mid.lon, document.getElementById('depDate').value);

    setStatus('');
    STATE = { A, B, routes, temp, sel: 0, waypoints };
    renderRouteOptions();
    compute(A, B, routes[0], temp);
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch(e){
    setStatus(e.message || 'Something went wrong. Try a more specific address.', true);
  } finally {
    btn.disabled = false;
  }
}

// Recompute everything from inputs when a route is already loaded
function refresh(){ if (STATE){ renderRouteOptions(); compute(STATE.A, STATE.B, STATE.routes[STATE.sel], STATE.temp); } }

// Shared math — used by both the route cards and the full result render
function estimate(rt, temp){
  const round    = document.getElementById('roundTrip').checked;
  const miles    = rt.miles * (round ? 2 : 1);
  const vehName  = document.getElementById('vehSel').value;
  const m        = vehModel(vehName);
  const tempEff  = predictEff(vehName, temp.f);
  const road     = roadFactor(rt);
  const modelEff = tempEff * road.f;
  const ovr      = parseFloat(document.getElementById('effOverride').value);
  const hasOvr   = !isNaN(ovr) && ovr > 0;
  const effEff   = hasOvr ? ovr : modelEff;
  const energy   = miles / effEff;
  return { round, miles, hours: rt.hours * (round ? 2 : 1), vehName, m, batt: m.battery,
           baseEff: m.baseEff, tempEff, tempMult: tempEff / m.baseEff, road, modelEff,
           hasOvr, effEff, energy, pctBatt: energy / m.battery * 100 };
}

function renderRouteOptions(){
  const box = document.getElementById('routeOptions');
  box.innerHTML = '';
  const routes = STATE.routes;
  const ests = routes.map(rt => estimate(rt, STATE.temp));
  if (routes.length > 1){
    const t = document.createElement('div');
    t.className = 'routes-title';
    t.textContent = routes.length + ' route options — tap to compare';
    box.appendChild(t);
  }
  const minE = Math.min(...ests.map(e => e.energy)), maxE = Math.max(...ests.map(e => e.energy));
  const minT = Math.min(...ests.map(e => e.hours)), maxT = Math.max(...ests.map(e => e.hours));
  const grid = document.createElement('div');
  grid.className = 'routes-grid';
  routes.forEach((rt, i) => {
    const e = ests[i];
    const tags = [];
    if (routes.length > 1){
      if (e.energy === minE && minE !== maxE) tags.push('<span class="rtag eff">⚡ least energy</span>');
      if (e.hours === minT && minT !== maxT)  tags.push('<span class="rtag">fastest</span>');
    }
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'route-card' + (i === STATE.sel ? ' sel' : '');
    card.innerHTML =
      `<div class="rc-top">${e.miles.toFixed(0)} mi <span class="rc-dim">· ${fmtDur(e.hours)}</span></div>`
      + `<div class="rc-energy">${e.energy.toFixed(1)} kWh · ${e.pctBatt.toFixed(0)}%</div>`
      + (tags.length ? `<div class="rc-tags">${tags.join('')}</div>` : '');
    card.onclick = () => { STATE.sel = i; refresh(); };
    grid.appendChild(card);
  });
  box.appendChild(grid);
}

function roadFactor(rt){
  const sel = document.getElementById('roadType').value;
  if (sel === 'highway') return { f: lerp(SPEED_CURVE, 70), label: 'Mostly highway' };
  if (sel === 'city')    return { f: lerp(SPEED_CURVE, 28), label: 'Mostly city' };
  if (sel === 'mixed')   return { f: lerp(SPEED_CURVE, 42), label: 'Mixed' };
  // Auto: door-to-door average understates cruising speed on longer trips —
  // city miles at each end drag it down — so estimate a cruising speed that
  // leans toward highway as the trip gets longer. Caps at 75 mph.
  const avg = rt.miles / Math.max(rt.hours, 0.01);
  const cruise = Math.min(avg + Math.min(rt.miles, 220) / 220 * 20, 75);
  return { f: lerp(SPEED_CURVE, cruise), label: `Auto · ${Math.round(avg)} mph avg` };
}

function compute(A, B, rt, temp){
  const e = estimate(rt, temp);

  // Hero stats
  document.getElementById('rDist').textContent = e.miles.toFixed(0) + ' mi';
  document.getElementById('rDistSub').textContent = e.round ? 'round trip' : fmtDur(e.hours);
  document.getElementById('rEnergy').textContent = e.energy.toFixed(1) + ' kWh';
  document.getElementById('rEnergySub').textContent = e.pctBatt.toFixed(0) + '% of battery';
  document.getElementById('rEff').textContent = e.effEff.toFixed(2);
  document.getElementById('rEffSub').textContent = 'mi / kWh';
  document.getElementById('rTemp').textContent = Math.round(temp.f) + '°F';
  document.getElementById('rTempSub').textContent = temp.src;

  // "Running on fleet average" note for a freshly-added car
  const fn = document.getElementById('fleetNote');
  if (!e.m.ownEff){
    fn.style.display = 'block';
    fn.innerHTML = `ℹ️ <b>${e.vehName}</b> has only ${e.m.nEff} session${e.m.nEff===1?'':'s'} with range data so far — using your fleet average until it builds its own profile.`;
  } else {
    fn.style.display = 'none';
  }

  // Breakdown
  if (e.hasOvr){
    document.getElementById('bBase').textContent = 'overridden';
    document.getElementById('bTemp').textContent = '—';
    document.getElementById('bRoad').textContent = '—';
    document.getElementById('bEff').textContent  = e.effEff.toFixed(2) + ' mi/kWh  (your manual override)';
  } else {
    document.getElementById('bBase').textContent = e.baseEff.toFixed(2) + ' mi/kWh  '
      + (e.m.ownEff ? '(your avg @ ' + Math.round(e.m.tRef) + '°F)' : '(fleet avg)');
    document.getElementById('bTemp').textContent = (e.tempMult>=1?'+':'') + ((e.tempMult-1)*100).toFixed(0) + '%  (' + Math.round(temp.f) + '°F)';
    document.getElementById('bRoad').textContent = (e.road.f>=1?'+':'') + ((e.road.f-1)*100).toFixed(0) + '%  · ' + e.road.label;
    document.getElementById('bEff').textContent  = e.effEff.toFixed(2) + ' mi/kWh';
  }
  document.getElementById('bBatt').textContent = e.batt.toFixed(1) + ' kWh  (' + e.m.battSrc + ')';

  // SoC + verdict
  buildVerdict(e.energy, e.batt, e.effEff);

  drawMap(A, B, rt.geometry);
  updateChargingPlan(rt, e, temp);
}

// ============================================================
//  CHARGING-STOP PLANNER
//  Data: Open Charge Map (your free key, kept in localStorage).
//  Only DCFC >= 50 kW on your preferred networks are considered.
// ============================================================
const PREFERRED_NETS = ['Tesla', 'Electrify America', 'ChargePoint'];
const NET_DEFAULT_KW = { 'Tesla': 250, 'Electrify America': 150, 'ChargePoint': 62.5 };
const NET_CLASS = { 'Tesla': 'net-tesla', 'Electrify America': 'net-ea', 'ChargePoint': 'net-cp' };
const NET_PREF = { 'Tesla': 3, 'Electrify America': 2, 'ChargePoint': 1 }; // tie-break order
const MIN_DCFC_KW = 50;
const TESLA_MIN_KW = 200; // V3+ Superchargers (250 kW) work with the Ford NACS adapter; V2 (150) don't

// Mach-E (extended range / GT) DC charging curve: power (kW) vs SoC (%).
// Effective rate = min(this, the charger's max kW). Peak ~150 kW, tapers hard >70%.
const CAR_CURVE = [[5,115],[10,150],[20,150],[35,135],[45,108],[55,88],[65,68],[75,50],[85,34],[92,24],[100,16]];

function getOCMKey(){ try { return localStorage.getItem('ocmKey') || ''; } catch(e){ return ''; } }
function saveOCMKey(){
  const v = document.getElementById('ocmKeyInput').value.trim();
  try { localStorage.setItem('ocmKey', v); } catch(e){}
  // re-plan the current route now that we have a key
  if (STATE){ STATE.routes.forEach(r => delete r.chargers); refresh(); }
}

function matchNetwork(operator){
  const t = (operator || '').toLowerCase();
  if (t.includes('tesla')) return 'Tesla';
  if (t.includes('electrify america')) return 'Electrify America';
  if (t.includes('chargepoint')) return 'ChargePoint';
  return null;
}

function haversine(la1, lo1, la2, lo2){
  const R = 3958.8, p = Math.PI/180;
  const a = Math.sin((la2-la1)*p/2)**2 + Math.cos(la1*p)*Math.cos(la2*p)*Math.sin((lo2-lo1)*p/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}
// Sample points along the polyline roughly every stepMi miles (for corridor queries)
function sampleAlong(coords, stepMi){
  const pts = [{ lat: coords[0][1], lon: coords[0][0] }];
  let acc = 0;
  for (let i=1;i<coords.length;i++){
    acc += haversine(coords[i-1][1],coords[i-1][0],coords[i][1],coords[i][0]);
    if (acc >= stepMi){ pts.push({ lat: coords[i][1], lon: coords[i][0] }); acc = 0; }
  }
  pts.push({ lat: coords[coords.length-1][1], lon: coords[coords.length-1][0] });
  return pts;
}
// Cumulative miles at each route vertex
function routeCum(coords){
  const cum = [0];
  for (let i=1;i<coords.length;i++) cum.push(cum[i-1] + haversine(coords[i-1][1],coords[i-1][0],coords[i][1],coords[i][0]));
  return cum;
}
// Nearest route vertex for a charger → distance along route + how far off-route
function projectCharger(coords, cum, lat, lon){
  let best = 1e9, bi = 0;
  for (let i=0;i<coords.length;i++){
    const d = haversine(lat, lon, coords[i][1], coords[i][0]);
    if (d < best){ best = d; bi = i; }
  }
  return { alongMi: cum[bi], offMi: best };
}

// Fetch JSON with one retry — OCM drops bursts, so a brief backoff recovers them
async function fetchJSON(url){
  for (let attempt = 0; attempt < 2; attempt++){
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch(e){ /* retry */ }
    await new Promise(res => setTimeout(res, 450));
  }
  return [];
}
// Run async tasks with limited concurrency + a small stagger, so we don't burst
// past OCM's rate limit (which silently kills later requests → missing chargers)
async function fetchPool(items, fn, concurrency){
  const results = new Array(items.length);
  let i = 0;
  async function worker(){
    while (i < items.length){
      const idx = i++;
      results[idx] = await fn(items[idx]);
      await new Promise(res => setTimeout(res, 120));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function fetchChargers(geometry){
  const key = getOCMKey();
  if (!key) return null;
  const coords = geometry.coordinates;
  const cum = routeCum(coords);
  const totalMi = cum[cum.length-1] || 0;
  // Corridor sampling. Keep the query COUNT bounded (~25 max) so we don't trip
  // OCM's burst limit on long trips, and make the radius exceed half the spacing
  // so there are no coverage holes between samples (radius = stepMi/2 + 8).
  const stepMi = Math.max(22, Math.min(100, totalMi / 24));
  const radius = Math.ceil(stepMi / 2) + 8;
  const samples = sampleAlong(coords, stepMi);
  const results = await fetchPool(samples, p => {
    const u = `https://api.openchargemap.io/v3/poi/?key=${encodeURIComponent(key)}&output=json&countrycode=US&latitude=${p.lat}&longitude=${p.lon}&distance=${radius}&distanceunit=Miles&levelid=3&maxresults=80&compact=false&verbose=false`;
    return fetchJSON(u);
  }, 3);
  const seen = new Set(), out = [];
  results.flat().forEach(p => {
    if (!p || !p.AddressInfo || seen.has(p.ID)) return;
    seen.add(p.ID);
    const opTitle = (p.OperatorInfo && p.OperatorInfo.Title) || '';
    const net = matchNetwork(opTitle) || matchNetwork(p.AddressInfo.Title || '');  // fall back to the site name
    if (!net) return;
    const dc = (p.Connections || []).filter(c => (c.PowerKW >= MIN_DCFC_KW) || (c.Level && c.Level.IsFastChargeCapable && c.PowerKW == null));
    if (!dc.length) return;
    let maxKW = Math.max(0, ...dc.map(c => c.PowerKW || 0));
    if (maxKW < MIN_DCFC_KW) maxKW = NET_DEFAULT_KW[net];
    if (maxKW < MIN_DCFC_KW) return;
    // NACS compatibility: the Mach-E's Ford NACS adapter works on V3+ Superchargers
    // (250 kW), NOT V2 (150 kW). OCM's "Tesla-only / including-non-tesla" tag is
    // unreliable (Stevensville & Cadillac are both "Tesla-only", but only the
    // 250 kW V3 Stevensville works), so we gate Tesla on power instead.
    if (net === 'Tesla' && maxKW < TESLA_MIN_KW) return;
    const pr = projectCharger(coords, cum, p.AddressInfo.Latitude, p.AddressInfo.Longitude);
    if (pr.offMi > 8) return; // keep it reasonably close to the route
    out.push({ id: p.ID, name: p.AddressInfo.Title, net, maxKW,
      town: p.AddressInfo.Town || p.AddressInfo.StateOrProvince || '',
      lat: p.AddressInfo.Latitude, lon: p.AddressInfo.Longitude,
      alongMi: pr.alongMi, offMi: pr.offMi });
  });
  out.sort((a,b) => a.alongMi - b.alongMi);
  return out;
}

function carCurveKW(soc){
  const c = CAR_CURVE;
  if (soc <= c[0][0]) return c[0][1];
  if (soc >= c[c.length-1][0]) return c[c.length-1][1];
  for (let i=0;i<c.length-1;i++) if (soc>=c[i][0] && soc<=c[i+1][0]){
    const [x0,y0]=c[i],[x1,y1]=c[i+1]; return y0+(y1-y0)*(soc-x0)/(x1-x0);
  }
  return c[c.length-1][1];
}
// Minutes to charge from→to SoC, capped by the charger's max kW (curve-aware)
function chargeMinutes(from, to, batt, capKW){
  let mins = 0;
  for (let s=from; s<to; s+=1){
    const kw = Math.min(carCurveKW(s + 0.5), capKW);
    mins += (batt*0.01) / kw * 60;
  }
  return mins;
}

// ── Elevation-aware energy model ──────────────────────────────────────────
// Sample N points evenly along the route, each with its cumulative miles.
function sampleWithMiles(coords, n){
  const cum = routeCum(coords);
  const total = cum[cum.length-1] || 0;
  const out = []; let j = 0;
  for (let k=0;k<n;k++){
    const target = total * k / (n-1);
    while (j < cum.length-1 && cum[j] < target) j++;
    out.push({ lat: coords[j][1], lon: coords[j][0], mi: cum[j] });
  }
  return out;
}
async function fetchElevation(geometry){
  const pts = sampleWithMiles(geometry.coordinates, 90);
  const lats = pts.map(p => p.lat.toFixed(4)).join(',');
  const lons = pts.map(p => p.lon.toFixed(4)).join(',');
  try {
    const j = await (await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`)).json();
    const el = j.elevation || [];
    if (el.length !== pts.length) return null;
    return pts.map((p,i) => ({ mi: p.mi, elev: el[i] }));
  } catch(e){ return null; }
}
// Build the energy model: flat term from your efficiency + elevation physics.
// Climbing costs m·g·Δh; descending recovers REGEN_FRAC of it. Falls back to a
// flat model when elevation isn't available.
const CAR_MASS_KG = 2300;   // Mach-E GT + typical load
const REGEN_FRAC = 0.7;     // fraction of potential energy recovered on descent
function buildEnergyModel(effEff, batt, elev){
  let pts = null, gainM = 0, dropM = 0, elevKWh = 0;
  if (elev && elev.length > 1){
    pts = [{ mi: elev[0].mi, cum: 0 }];
    for (let i=1;i<elev.length;i++){
      const dMi = elev[i].mi - elev[i-1].mi;
      const flat = dMi / effEff;
      const dh = elev[i].elev - elev[i-1].elev;       // meters
      let eK = CAR_MASS_KG * 9.81 * dh / 3.6e6;        // kWh (potential)
      if (dh >= 0) gainM += dh; else { dropM += -dh; eK *= REGEN_FRAC; }
      elevKWh += eK;
      pts.push({ mi: elev[i].mi, cum: pts[i-1].cum + flat + eK });
    }
  }
  function eAt(mi){
    if (!pts) return Math.max(0, mi) / effEff;
    if (mi <= pts[0].mi) return 0;
    const last = pts[pts.length-1];
    if (mi >= last.mi) return last.cum + (mi - last.mi) / effEff;
    for (let i=1;i<pts.length;i++) if (pts[i].mi >= mi){
      const a=pts[i-1], b=pts[i], f=(mi-a.mi)/((b.mi-a.mi)||1);
      return a.cum + (b.cum-a.cum)*f;
    }
    return last.cum;
  }
  const energyKWh = (fromMi, toMi) => Math.max(0, eAt(toMi) - eAt(fromMi));
  const socDrop   = (fromMi, toMi) => energyKWh(fromMi, toMi) / batt * 100;
  // Farthest mile reachable from fromMi at fromSoc, not dropping below floorSoc.
  function reachMi(fromMi, fromSoc, floorSoc){
    const budget = (fromSoc - floorSoc) / 100 * batt;     // kWh available
    if (budget <= 0) return fromMi;
    const target = eAt(fromMi) + budget;
    if (!pts) return fromMi + budget * effEff;
    const last = pts[pts.length-1];
    if (target >= eAt(last.mi)) return last.mi + (target - eAt(last.mi)) * effEff;
    let lo = fromMi, hi = last.mi;
    for (let it=0; it<36; it++){ const mid=(lo+hi)/2; if (eAt(mid) < target) lo=mid; else hi=mid; }
    return lo;
  }
  return { batt, effEff, eAt, energyKWh, socDrop, reachMi,
           hasElev: !!pts, gainM: Math.round(gainM), dropM: Math.round(dropM), elevKWh };
}

// Greedy plan for ONE segment [fromMi, toMi]: stop as far along as range-to-buffer
// allows, prefer fast/preferred chargers, charge only enough to reach the next stop
// or the segment end + buffer.
const DCFC_TOP = 80;       // never charge past this on DC fast (charge curve too slow above)
const TESLA_REACH_TOL = 40; // mi — prefer Tesla unless a non-Tesla gets you this much farther
const CHARGER_FLOOR = 6;    // % — willing to run this low to REACH a charger (reserve is for the destination)
function planSegment(fromMi, toMi, startSoc, reserve, chargers, nrg, maxTop){
  maxTop = maxTop || DCFC_TOP;
  const batt = nrg.batt;
  const peak = Math.max(...CAR_CURVE.map(p => p[1]));
  const espeed = c => Math.min(c.maxKW, peak);
  // You can dip below the reserve to reach a charger (you're about to refill);
  // the reserve still governs arriving at the final destination.
  const chargerFloor = Math.min(reserve, CHARGER_FLOOR);
  const stops = [];
  let pos = fromMi, soc = startSoc, guard = 0;
  const usable = chargers.filter(c => c.alongMi > fromMi + 1 && c.alongMi < toMi - 1);
  while (guard++ < 30){  // enough for cross-country
    if (toMi <= nrg.reachMi(pos, soc, reserve)){            // reach the END keeping the reserve
      return { feasible: true, stops, arriveSoc: soc - nrg.socDrop(pos, toMi) };
    }
    // Chargers reachable while staying at/above the charger floor.
    const chargerReach = nrg.reachMi(pos, soc, chargerFloor);
    let all = usable.filter(c => c.alongMi > pos + 4 && c.alongMi <= chargerReach);
    if (!all.length){
      return { feasible: false, stops, gapFrom: Math.round(pos), reachMi: Math.round(chargerReach) };
    }
    // Prefer fast chargers (>=100 kW); fall back to slow only if none reachable.
    const fast = all.filter(c => c.maxKW >= 100);
    const pool = fast.length ? fast : all;
    // TESLA-FIRST: you prefer Tesla (cheaper, more reliable). Use Tesla unless a
    // non-Tesla charger gets you meaningfully farther (likely saving a stop).
    const maxAll  = Math.max(...pool.map(c => c.alongMi));
    const teslas  = pool.filter(c => c.net === 'Tesla');
    const maxTesla = teslas.length ? Math.max(...teslas.map(c => c.alongMi)) : -Infinity;
    const basis = (teslas.length && maxTesla >= maxAll - TESLA_REACH_TOL) ? teslas : pool;
    // Among the chosen network basis, take the farthest cluster (fewest stops,
    // arrive low = fast part of the curve), best effective speed within it.
    const top = Math.max(...basis.map(c => c.alongMi));
    const cluster = basis.filter(c => c.alongMi >= top - 20);
    cluster.sort((a,b) => (espeed(b)-espeed(a)) || (NET_PREF[b.net]-NET_PREF[a.net]) || (b.alongMi-a.alongMi));
    const c = cluster[0];
    const arriveSoc = soc - nrg.socDrop(pos, c.alongMi);
    const finishSoc = reserve + nrg.socDrop(c.alongMi, toMi);  // charge needed to reach segment end + buffer
    // Charge only enough to reach the segment end + buffer, but never above the
    // DCFC cap (default 80%). If 80% can't reach the end, the loop adds a stop.
    let target = finishSoc <= maxTop ? Math.ceil(finishSoc) : maxTop;
    target = Math.min(maxTop, Math.max(target, arriveSoc + 1));
    stops.push({ ...c, arriveSoc, target, addedKWh: (target-arriveSoc)/100*batt,
      mins: chargeMinutes(arriveSoc, target, batt, c.maxKW) });
    pos = c.alongMi; soc = target;
  }
  return { feasible: false, stops, gapFrom: Math.round(pos), reachMi: Math.round(nrg.reachMi(pos, soc, reserve)) };
}

// Plan a segment with the 80% DCFC cap; only if that's infeasible (a leg with no
// charger in range) raise the cap in small steps and use the lowest that works,
// flagging any stop forced above 80%.
function planSegmentCapped(fromMi, toMi, soc, reserve, chargers, nrg){
  for (const cap of [DCFC_TOP, 85, 90, 95, 100]){
    const r = planSegment(fromMi, toMi, soc, reserve, chargers, nrg, cap);
    if (r.feasible){
      if (cap > DCFC_TOP) r.stops.forEach(s => { if (s.target > DCFC_TOP) s.overCap = true; });
      return r;
    }
  }
  return planSegment(fromMi, toMi, soc, reserve, chargers, nrg, 100); // infeasible → gap info
}

// Full journey over [0, totalMi]. `anchors` are SoC-reset points (a charging
// waypoint, or a round-trip destination where you can charge): each splits the
// trip into a segment and resets SoC to its chargeTo for the next leg. DCFC
// stops and anchor charges are returned in route order.
function planJourney(totalMi, anchors, nrg, startSoc, reserve, chargers){
  anchors = (anchors || []).filter(a => a.mile > 0 && a.mile < totalMi).sort((a,b) => a.mile - b.mile);
  const all = [];
  let segStart = 0, soc = startSoc, overCap = false;
  for (const wp of anchors){
    const r = planSegmentCapped(segStart, wp.mile, soc, reserve, chargers, nrg);
    r.stops.forEach(s => { all.push(s); if (s.overCap) overCap = true; });
    if (!r.feasible) return { needed: true, feasible: false, stops: all, gapFrom: r.gapFrom, reachMi: r.reachMi };
    all.push({ waypoint: true, name: wp.name, net: wp.acNet || 'AC', alongMi: wp.mile,
      arriveSoc: r.arriveSoc, target: wp.chargeTo, lat: wp.lat, lon: wp.lon });
    soc = wp.chargeTo;
    segStart = wp.mile;
  }
  const rf = planSegmentCapped(segStart, totalMi, soc, reserve, chargers, nrg);
  rf.stops.forEach(s => { all.push(s); if (s.overCap) overCap = true; });
  if (!rf.feasible) return { needed: true, feasible: false, stops: all, gapFrom: rf.gapFrom, reachMi: rf.reachMi };
  return { needed: all.length > 0, feasible: true, stops: all, arriveSoc: rf.arriveSoc, overCap };
}

// Mirror chargers + elevation onto the return leg of a round trip: a charger at
// outbound mile X is hit again at (2·oneWay − X); elevation reverses.
function mirrorForRoundTrip(chargers, elev, oneWay){
  const full = oneWay * 2;
  const out = [];
  (chargers || []).forEach(c => {
    out.push(c);
    if (c.alongMi < oneWay - 0.5) out.push({ ...c, alongMi: full - c.alongMi, id: (c.id||'') + '_r', returnLeg: true });
  });
  out.sort((a,b) => a.alongMi - b.alongMi);
  let mElev = null;
  if (elev && elev.length > 1){
    mElev = elev.map(p => ({ mi: p.mi, elev: p.elev }));
    for (let i = elev.length - 2; i >= 0; i--) mElev.push({ mi: full - elev[i].mi, elev: elev[i].elev });
  }
  return { chargers: out, elev: mElev, full };
}

// Fold elevation into the hero energy/efficiency once the profile is loaded.
// nrg + totalMi already span the whole trip (round trips pass the mirrored model).
function applyElevationToHero(e, nrg, totalMi){
  const energy = nrg.energyKWh(0, totalMi);
  const miles  = totalMi;
  const effEff = energy > 0 ? miles / energy : e.effEff;
  document.getElementById('rEnergy').textContent = energy.toFixed(1) + ' kWh';
  document.getElementById('rEnergySub').textContent = (energy / e.batt * 100).toFixed(0) + '% of battery';
  document.getElementById('rEff').textContent = effEff.toFixed(2);
  if (nrg.hasElev && (nrg.gainM > 60 || nrg.dropM > 60)){
    const row = document.getElementById('bElevRow');
    if (row){
      row.style.display = '';
      const sign = nrg.elevKWh >= 0 ? '+' : '−';
      document.getElementById('bElev').textContent =
        `${sign}${Math.abs(nrg.elevKWh).toFixed(1)} kWh  ·  ↑${nrg.gainM} m / ↓${nrg.dropM} m`;
    }
    document.getElementById('bEff').textContent = effEff.toFixed(2) + ' mi/kWh  (incl. terrain)';
  }
}

// Estimate trip cost from YOUR real $/kWh: the starting charge (home rate when
// you leave from home) + each DCFC stop at that network's average rate.
// Cost / gas report in the same stat-grid format as Road Trips on Analytics.
function renderSummary(plan, energyTrip, fromHome, miles){
  const dcfc = ((plan && plan.stops) || []).filter(s => !s.waypoint);
  let dcfcKWh = 0, dcfcCost = 0, dcfcMin = 0;
  dcfc.forEach(s => {
    const r = (COST[s.net] != null) ? COST[s.net] : COST.publicAvg;
    dcfcKWh += s.addedKWh; dcfcCost += s.addedKWh * r; dcfcMin += s.mins || 0;
  });
  const startKWh  = Math.max(0, energyTrip - dcfcKWh);
  const startRate = fromHome ? COST.home : COST.publicAvg;
  const total = startKWh * startRate + dcfcCost;
  const gasCost = (GAS.mpg > 0 && miles > 0) ? miles / GAS.mpg * GAS.price : 0;
  const saved = gasCost - total;
  const gasStops = Math.max(0, Math.ceil(miles / (GAS.mpg * GAS_TANK_GAL)) - 1);
  const gasMins  = gasStops * GAS_STOP_MIN;
  const timeDiff = Math.round(dcfcMin) - gasMins;   // EV fast-charging time vs gas refuel time

  document.getElementById('tripSummary').style.display = 'block';
  const set = (id, txt, cls) => { const el = document.getElementById(id); el.textContent = txt; el.className = 'sg-val' + (cls ? ' ' + cls : ''); };
  set('sgCharged', dcfcKWh > 0 ? dcfcKWh.toFixed(1) + ' kWh' : '0 kWh');
  set('sgCost', '$' + total.toFixed(2));
  set('sgSaved', (saved >= 0 ? '$' + saved.toFixed(2) : '−$' + (-saved).toFixed(2)), saved >= 0 ? 'sg-green' : 'sg-amber');
  set('sgDcfc', dcfcMin > 0 ? fmtMinsShort(dcfcMin) : '—');
  document.getElementById('sgGasStopsLbl').textContent = `Gas Stops (${GAS.mpg}mpg)`;
  set('sgGasStops', `${gasStops} × ${GAS_STOP_MIN}min = ${gasMins}min`);
  if (timeDiff > 0)      set('sgTimeVsGas', `+${fmtMinsShort(timeDiff)} vs gas`, 'sg-amber');
  else if (timeDiff < 0) set('sgTimeVsGas', `${fmtMinsShort(-timeDiff)} faster`, 'sg-green');
  else                   set('sgTimeVsGas', 'Same as gas');
  set('sgStops', String(dcfc.length));
}

let CHARGER_LAYER = [];
async function updateChargingPlan(rt, e, temp){
  const card = document.getElementById('stopsCard');
  const body = document.getElementById('stopsBody');
  const socEl = document.getElementById('startSoc');
  clearChargerMarkers();

  if (socEl.value === '' || isNaN(+socEl.value)){
    card.style.display = 'block';
    body.innerHTML = `<div class="stops-summary">Enter your <b>start charge %</b> above to plan charging stops.</div>`;
    return;
  }

  const startSoc = Math.max(0, Math.min(100, +socEl.value));
  const reserve = Math.max(0, Math.min(50, +document.getElementById('reserve').value || 0));
  const waypoints = (STATE && STATE.waypoints) || [];
  const chargingWps = waypoints.filter(w => !isNaN(w.chargeTo) && w.chargeTo > 0);

  // Elevation-aware energy model (keyless). Cache the profile on the route.
  if (rt.elev === undefined){
    try { rt.elev = await fetchElevation(rt.geometry); } catch(err){ rt.elev = null; }
  }
  if (STATE && STATE.routes[STATE.sel] !== rt) return;
  const nrg = buildEnergyModel(e.effEff, e.batt, rt.elev);

  // Round-trip setup: we plan the full out-and-back continuously (mirroring the
  // route) so RETURN-leg stops get planned. A destination charge is assumed ONLY
  // if you check "Can charge at destination".
  const round = document.getElementById('roundTrip').checked;
  const canChargeDest = round && document.getElementById('canChargeDest').checked;
  const oneWay = rt.miles;
  const planMi = round ? oneWay * 2 : oneWay;
  const planNrg = round ? buildEnergyModel(e.effEff, e.batt, mirrorForRoundTrip([], rt.elev, oneWay).elev) : nrg;
  applyElevationToHero(e, planNrg, planMi);
  const energyTrip = planNrg.energyKWh(0, planMi);
  const fromHome = STATE && STATE.A && haversine(STATE.A.lat, STATE.A.lon, HOME.lat, HOME.lon) < 3;

  // Reachable without charging? (no key/API call needed)
  if (!chargingWps.length){
    const reachStart = nrg.reachMi(0, startSoc, reserve);
    if (!round && oneWay <= reachStart){
      card.style.display = 'block';
      body.innerHTML = `<div class="stops-note">✅ No charging stop needed — you can do this on the starting charge.</div>`;
      setVerdict('ok', '✅', `No charging stop needed — you'll make it on the starting charge.`);
      renderSummary(null, energyTrip, fromHome, planMi);
      return;
    }
    if (round && canChargeDest && oneWay <= reachStart){
      card.style.display = 'block';
      body.innerHTML = `<div class="stops-note">✅ No DC fast stop needed en route — you'll charge at your destination before the return.</div>`;
      setVerdict('ok', '✅', `No stop needed each way — just top up at your destination before heading back.`);
      renderSummary(null, energyTrip, fromHome, planMi);
      return;
    }
    if (round && !canChargeDest && planMi <= planNrg.reachMi(0, startSoc, reserve)){
      card.style.display = 'block';
      body.innerHTML = `<div class="stops-note">✅ No charging stop needed — the whole round trip fits on your starting charge.</div>`;
      setVerdict('ok', '✅', `No charging stop needed — the whole round trip is within range.`);
      renderSummary(null, energyTrip, fromHome, planMi);
      return;
    }
  }

  if (!getOCMKey()){
    card.style.display = 'block';
    body.innerHTML = `<div class="stops-summary">Charging-stop suggestions need a free <a href="https://openchargemap.org/site/profile/applications" target="_blank" rel="noopener">Open Charge Map API key</a> (kept only in this browser).</div>`
      + `<div class="stops-key"><input id="ocmKeyInput" type="text" placeholder="Paste OCM API key"><button onclick="saveOCMKey()">Save key</button></div>`;
    setVerdict('tight', '🔌', `This trip needs charging — add a free Open Charge Map key below to plan the stops.`);
    return;
  }

  card.style.display = 'block';
  body.innerHTML = `<div class="stops-summary">Finding DC fast chargers along the route…</div>`;

  if (!rt.chargers){
    try { rt.chargers = await fetchChargers(rt.geometry); }
    catch(err){ rt.chargers = []; }
  }
  // Guard against stale renders if the user changed routes meanwhile
  if (STATE && STATE.routes[STATE.sel] !== rt) return;

  const chargers = rt.chargers || [];
  if (!chargers.length){
    body.innerHTML = `<div class="stops-note">No compatible DCFC (Tesla V3 / EA / ChargePoint, ≥50 kW) found near this route in Open Charge Map.</div>`;
    setVerdict('no', '🛑', `No compatible fast chargers found along this route.`);
    return;
  }
  // Build plan inputs. Round trips mirror chargers + elevation onto the return
  // leg; a destination charge becomes a SoC-reset anchor only if allowed.
  let planChargers, useNrg, anchors;
  if (round){
    const m = mirrorForRoundTrip(chargers, rt.elev, oneWay);
    planChargers = m.chargers;
    useNrg = buildEnergyModel(e.effEff, e.batt, m.elev);
    anchors = canChargeDest
      ? [{ mile: oneWay, chargeTo: 90, name: 'Destination charge', lat: STATE.B.lat, lon: STATE.B.lon }]
      : [];
  } else {
    planChargers = chargers;
    useNrg = nrg;
    anchors = waypoints
      .map((w,i) => ({ mile: (rt.legMiles && rt.legMiles[i+1]), chargeTo: w.chargeTo, name: w.addr, lat: w.lat, lon: w.lon }))
      .filter(a => a.mile != null && !isNaN(a.chargeTo) && a.chargeTo > 0);
  }
  const plan = planJourney(planMi, anchors, useNrg, startSoc, reserve, planChargers);
  renderStops(plan, e, reserve, round, startSoc, useNrg, oneWay);
  renderSummary(plan, energyTrip, fromHome, planMi);
  drawChargerMarkers(plan.stops, round ? [] : waypoints);
  rerouteThroughStops(rt, plan, e, round, oneWay);
}

// Redraw the map route so it actually passes through the chosen stops. For a
// round trip we draw the FULL loop (A → stops → destination → return stops → A)
// and report the true driven round-trip mileage.
async function rerouteThroughStops(rt, plan, e, round, oneWay){
  if (!STATE || !plan || !plan.feasible) return;
  const pts = [{ lat: STATE.A.lat, lon: STATE.A.lon }];
  const withLatLon = plan.stops.filter(s => s.lat && s.lon);
  if (round){
    const out = withLatLon.filter(s => s.alongMi <= oneWay).sort((a,b)=>a.alongMi-b.alongMi);
    const ret = withLatLon.filter(s => s.alongMi >  oneWay).sort((a,b)=>a.alongMi-b.alongMi);
    out.forEach(s => pts.push({ lat: s.lat, lon: s.lon }));
    pts.push({ lat: STATE.B.lat, lon: STATE.B.lon });            // turnaround
    ret.forEach(s => pts.push({ lat: s.lat, lon: s.lon }));
    pts.push({ lat: STATE.A.lat, lon: STATE.A.lon });            // back home
  } else {
    withLatLon.sort((a,b)=>a.alongMi-b.alongMi).forEach(s => pts.push({ lat: s.lat, lon: s.lon }));
    pts.push({ lat: STATE.B.lat, lon: STATE.B.lon });
  }
  if (pts.length > 14) return; // OSRM waypoint limit
  try {
    const rr = (await route(pts))[0];
    await loadLeaflet();
    if (MAP && ROUTE_LAYER && ROUTE_LAYER[0]){
      MAP.removeLayer(ROUTE_LAYER[0]);
      const line = L.geoJSON(rr.geometry, { style: { color: '#5d3fd3', weight: 5, opacity: 0.85 } }).addTo(MAP);
      ROUTE_LAYER[0] = line;
      MAP.fitBounds(line.getBounds(), { padding: [30, 30] });
    }
    // rr.miles is the true driven distance (full loop for round trips).
    const driven = Math.round(rr.miles);
    if (Math.abs(driven - Math.round(e.miles)) >= 3)
      document.getElementById('rDistSub').textContent = `${driven} mi via stops${round ? ' · round trip' : ''}`;
  } catch(err){ /* keep the direct route */ }
}

function setVerdict(cls, icon, html){
  const vEl = document.getElementById('verdict');
  vEl.className = 'verdict ' + cls;
  vEl.innerHTML = `<span class="vicon">${icon}</span><span>${html}</span>`;
}

function renderStops(plan, e, reserve, roundTrip, startSoc, nrg, oneWay){
  const body = document.getElementById('stopsBody');
  if (plan.needed && !plan.feasible){
    const oneWayMi = e.round ? e.miles / 2 : e.miles;
    const chargerFloor = Math.min(reserve, CHARGER_FLOOR);  // matches the planner
    const usableMi  = Math.max(0, nrg.reachMi(0, startSoc, chargerFloor));
    const neededStart = Math.ceil(reserve + nrg.socDrop(0, oneWayMi));
    // "Stuck at the start": couldn't even place a first stop — almost always the
    // starting charge is too low to reach any charger, not a real route gap.
    if (!plan.stops.length && (plan.gapFrom == null || plan.gapFrom < 12)){
      let note, verdict;
      if (neededStart <= 100){
        note = `At a <b>${Math.round(startSoc)}%</b> start minus your <b>${reserve}%</b> reserve you have only ~${Math.round(usableMi)} mi of usable range, and there's no compatible fast charger within that distance of the start. But this trip needs <b>no charging at all</b> if you leave at <b>≥${neededStart}%</b> — charge before you go, raise your start %, or lower the reserve.`;
        verdict = `Start charge is low — at ${Math.round(startSoc)}% you can only go ~${Math.round(usableMi)} mi before your reserve, with no charger in range. Leave at <b>≥${neededStart}%</b> and you'll make it with no stops.`;
      } else {
        note = `At <b>${Math.round(startSoc)}%</b> you have only ~${Math.round(usableMi)} mi before your reserve and there's no compatible fast charger within reach of the start. Charge before you leave, or start with a higher %.`;
        verdict = `Start charge too low to reach the first charger — charge before leaving or start higher.`;
      }
      setVerdict('tight', '⚠️', verdict);
      body.innerHTML = `<div class="stops-note">⚠️ ${note}</div>`;
      return;
    }
    // A genuine mid-route gap between chargers.
    let msg = `<div class="stops-note">⚠️ Couldn't build a complete plan with your preferred networks`;
    if (plan.gapFrom != null) msg += ` — no compatible DCFC (Tesla open-to-NACS / EA / ChargePoint, ≥50 kW) between mile ${plan.gapFrom} and ~mile ${plan.reachMi}`;
    msg += `. The gap may be too long for one charge — add a waypoint there, or use a non-preferred charger.</div>`;
    body.innerHTML = msg + (plan.stops.length ? `<div class="stops-summary">Partial plan: ${plan.stops.length} stop(s) before the gap.</div>` : '');
    setVerdict('no', '🛑', `Couldn't complete a charging plan — gap near mile ${plan.gapFrom}. Add a waypoint there or use a non-preferred charger.`);
    return;
  }
  if (!plan.stops.length){
    body.innerHTML = `<div class="stops-note">✅ No charging stop needed — you'll arrive around ${Math.round(plan.arriveSoc)}%.</div>`;
    return;
  }
  const dcfc = plan.stops.filter(s => !s.waypoint);
  const totalMin = dcfc.reduce((s,x)=>s+x.mins,0);
  const nWp = plan.stops.length - dcfc.length;
  const wpNote = nWp ? ` + ${nWp} waypoint charge${nWp>1?'s':''}` : '';
  setVerdict('ok', '✅', `Doable with <b>${dcfc.length} DC fast stop${dcfc.length!==1?'s':''}</b>${wpNote} (~${Math.round(totalMin)} min fast-charging) — arrive around <b>${Math.round(plan.arriveSoc)}%</b>.`);
  let html = `<div class="stops-summary">${dcfc.length} DC fast stop${dcfc.length!==1?'s':''}${wpNote} · ~${Math.round(totalMin)} min total fast-charging · arrive ${roundTrip?'home':''} around <b>${Math.round(plan.arriveSoc)}%</b></div>`;
  let dividerShown = false, n = 0;
  plan.stops.forEach((s) => {
    // For round trips, drop a "turnaround" divider when stops cross into the return leg.
    if (roundTrip && oneWay && s.alongMi > oneWay && !dividerShown){
      html += `<div class="stops-summary" style="margin-top:6px">↩︎ turnaround at destination — return leg</div>`;
      dividerShown = true;
    }
    const onReturn = roundTrip && oneWay && s.alongMi > oneWay;
    const mileLabel = onReturn ? `${Math.round(2*oneWay - s.alongMi)} mi from home` : `mile ${Math.round(s.alongMi)}`;
    if (s.waypoint){
      html += `<div class="stop wp-stop">
        <div class="stop-num">★</div>
        <div class="stop-main">
          <div class="stop-name">${s.name}<span class="net-badge net-wp">${s.net==='AC'?'charge here':s.net}</span></div>
          <div class="stop-sub">${mileLabel}</div>
          <div class="stop-charge">Arrive <b>${Math.round(s.arriveSoc)}%</b> → charge to <b>${Math.round(s.target)}%</b> here</div>
        </div>
      </div>`;
    } else {
      n++;
      html += `<div class="stop">
        <div class="stop-num">${n}</div>
        <div class="stop-main">
          <div class="stop-name">${s.name}<span class="net-badge ${NET_CLASS[s.net]}">${s.net}</span>${onReturn?'<span class="net-badge" style="background:#6b728020;color:#6b7280">return</span>':''}</div>
          <div class="stop-sub">${s.town ? s.town + ' · ' : ''}${mileLabel} · up to ${Math.round(s.maxKW)} kW${s.offMi>1?` · ${s.offMi.toFixed(1)} mi off route`:''}</div>
          <div class="stop-charge">Arrive <b>${Math.round(s.arriveSoc)}%</b> → charge to <b>${Math.round(s.target)}%</b> &nbsp;·&nbsp; +${s.addedKWh.toFixed(0)} kWh &nbsp;·&nbsp; ~${Math.round(s.mins)} min &nbsp;·&nbsp; ~$${(s.addedKWh * ((COST[s.net]!=null)?COST[s.net]:COST.publicAvg)).toFixed(2)}${s.overCap?` <span style="color:#eab308">⚠ above 80% — no closer charger</span>`:''}</div>
        </div>
      </div>`;
    }
  });
  body.innerHTML = html;
}

function clearChargerMarkers(){ if (MAP && CHARGER_LAYER.length){ CHARGER_LAYER.forEach(m => MAP.removeLayer(m)); } CHARGER_LAYER = []; }
async function drawChargerMarkers(stops, waypoints){
  await loadLeaflet();
  if (!MAP) return;
  const colors = { 'Tesla':'#e82222', 'Electrify America':'#00963f', 'ChargePoint':'#f97316' };
  let n = 0;
  (stops || []).forEach(s => {
    if (s.waypoint){
      const m = L.circleMarker([s.lat, s.lon], { radius: 9, color: '#fff', weight: 2, fillColor: '#16a34a', fillOpacity: 1 })
        .addTo(MAP).bindPopup(`<b>★ ${s.name}</b><br>Waypoint · AC charge to ${Math.round(s.target)}%`);
      CHARGER_LAYER.push(m);
    } else {
      n++;
      const m = L.circleMarker([s.lat, s.lon], { radius: 9, color: '#fff', weight: 2, fillColor: colors[s.net]||'#5d3fd3', fillOpacity: 1 })
        .addTo(MAP).bindPopup(`<b>Stop ${n}: ${s.name}</b><br>${s.net} · up to ${Math.round(s.maxKW)} kW<br>Charge to ${Math.round(s.target)}% (~${Math.round(s.mins)} min)`);
      CHARGER_LAYER.push(m);
    }
  });
  // Non-charging waypoints (routing-only) as hollow green markers
  (waypoints || []).filter(w => isNaN(w.chargeTo) || !(w.chargeTo > 0)).forEach(w => {
    const m = L.circleMarker([w.lat, w.lon], { radius: 8, color: '#16a34a', weight: 2, fillColor: '#fff', fillOpacity: 1 })
      .addTo(MAP).bindPopup(`<b>★ ${w.addr}</b><br>Waypoint (no charge)`);
    CHARGER_LAYER.push(m);
  });
}

function buildVerdict(energy, batt, effEff){
  const socEl = document.getElementById('startSoc');
  const vEl = document.getElementById('verdict');
  const socCard = document.getElementById('socCard');
  const reserve = Math.max(0, Math.min(50, +document.getElementById('reserve').value || 0));

  if (socEl.value === '' || isNaN(+socEl.value)){
    socCard.style.display = 'none';
    const need = energy / batt * 100;
    vEl.className = 'verdict ok';
    vEl.innerHTML = `<span class="vicon">🔋</span><span>This trip needs about <b>${Math.round(need)}%</b> of a full charge. Enter your starting charge above for an arrival estimate.</span>`;
    return;
  }
  const startSoc = Math.max(0, Math.min(100, +socEl.value));
  const usedPct = energy / batt * 100;
  const endSoc = startSoc - usedPct;
  const endMiles = Math.max(0, endSoc) / 100 * batt * effEff;

  socCard.style.display = 'block';
  document.getElementById('socFill').style.width = Math.max(0, endSoc) + '%';
  document.getElementById('socUsed').style.width = Math.min(usedPct, Math.max(0, startSoc)) + '%';
  document.getElementById('socStartLbl').textContent = 'Start ' + Math.round(startSoc) + '%';
  document.getElementById('socEndLbl').textContent = endSoc >= 0 ? ('Arrive ' + Math.round(endSoc) + '%  ·  ' + Math.round(endMiles) + ' mi left') : ('Short by ' + Math.round(-endSoc) + '%');

  if (endSoc < 0){
    // Beyond a single charge — the charging planner (below) handles this and
    // will set the real verdict. The single-charge SoC bar doesn't apply.
    socCard.style.display = 'none';
    vEl.className = 'verdict tight';
    vEl.innerHTML = `<span class="vicon">🔌</span><span>This trip needs charging along the way — planning stops…</span>`;
  } else if (endSoc < reserve){
    vEl.className = 'verdict tight';
    vEl.innerHTML = `<span class="vicon">⚠️</span><span>Cutting it close — you'd arrive around <b>${endSoc.toFixed(0)}%</b>, below your ${reserve}% buffer. Doable, but top up if you can.</span>`;
  } else {
    vEl.className = 'verdict ok';
    vEl.innerHTML = `<span class="vicon">✅</span><span>You'll make it comfortably — arriving around <b>${endSoc.toFixed(0)}%</b> with ~${Math.round(endMiles)} mi of range to spare.</span>`;
  }
}

function fmtDur(h){
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return hh ? `${hh}h ${mm}m drive` : `${mm}m drive`;
}

// ============================================================
//  Map (Leaflet, lazy-loaded on first use)
// ============================================================
function loadLeaflet(){
  return new Promise(res => {
    if (window.L) return res();
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = res; document.body.appendChild(js);
  });
}
async function drawMap(A, B, geometry){
  await loadLeaflet();
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (!MAP){
    MAP = L.map('map', { scrollWheelZoom: false });
    L.tileLayer(dark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap, © CARTO', maxZoom: 19 }).addTo(MAP);
  }
  if (ROUTE_LAYER) ROUTE_LAYER.forEach(l => MAP.removeLayer(l));
  const line = L.geoJSON(geometry, { style: { color: '#5d3fd3', weight: 5, opacity: 0.85 } }).addTo(MAP);
  const mA = L.marker([A.lat, A.lon]).addTo(MAP).bindPopup('Start');
  const mB = L.marker([B.lat, B.lon]).addTo(MAP).bindPopup('Destination');
  ROUTE_LAYER = [line, mA, mB];
  MAP.fitBounds(line.getBounds(), { padding: [30, 30] });
  setTimeout(() => MAP.invalidateSize(), 100);
}

// (route-row Enter-to-submit + home-flag clearing are wired in makeStopRow)

// Tweaking vehicle / road / charge after a route is loaded → live re-estimate
// (no re-routing or weather call needed — same route, new numbers)
['vehSel','roadType','startSoc','reserve','roundTrip','effOverride','canChargeDest'].forEach(id => {
  document.getElementById(id).addEventListener('change', refresh);
});
document.getElementById('effOverride').addEventListener('input', refresh);

// Show the "can charge at destination" option only when round trip is on.
function onRoundTripToggle(){
  document.getElementById('destChargeWrap').style.display =
    document.getElementById('roundTrip').checked ? 'flex' : 'none';
}
</script>

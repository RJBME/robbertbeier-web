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

  .wp-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
  .wp-row input[type=text] { flex: 1; min-width: 0; padding: 8px 11px; border-radius: 8px; border: 1px solid var(--dash-border); background: var(--bg); color: var(--text); font-size: 0.82rem; }
  .wp-row .wp-charge { display: flex; align-items: center; gap: 4px; font-size: 0.68rem; color: #888; white-space: nowrap; }
  .wp-row .wp-charge input { width: 52px; padding: 8px 6px; border-radius: 8px; border: 1px solid var(--dash-border); background: var(--bg); color: var(--text); font-size: 0.82rem; text-align: center; }
  .wp-row .wp-del { border: none; background: none; color: #ef4444; font-size: 1.1rem; cursor: pointer; padding: 0 4px; line-height: 1; }
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
    <div class="field-grid">
      <div class="field full">
        <label>Start</label>
        <input id="startAddr" type="text" placeholder="Address, city, or place" autocomplete="off">
        <div class="quick-row"><button type="button" onclick="useHome('startAddr')">🏠 Home</button></div>
      </div>
      <div class="field full">
        <label>Destination</label>
        <input id="endAddr" type="text" placeholder="Address, city, or place" autocomplete="off">
        <div class="quick-row"><button type="button" onclick="useHome('endAddr')">🏠 Home</button></div>
      </div>
    </div>

    <div class="field full" style="margin-top:12px">
      <label>Waypoints <span style="font-weight:400;text-transform:none">(optional — e.g. an overnight hotel with charging)</span></label>
      <div id="waypointList"></div>
      <div class="quick-row"><button type="button" onclick="addWaypoint()">＋ Add waypoint</button></div>
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
      <label class="check" style="flex:1;min-width:130px"><input type="checkbox" id="roundTrip"> Round trip</label>
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
{% assign ss = site.charging | sort: "date" %}{% for s in ss %}{% if s.energy_kwh and s.energy_kwh != "" %}{"v":{{ s.vehicle | jsonify }},"kwh":{{ s.energy_kwh }},"mi":{% if s.miles_added and s.miles_added != "" %}{{ s.miles_added }}{% else %}0{% endif %},"tf":{% if s.temperature_f and s.temperature_f != "" %}{{ s.temperature_f }}{% else %}null{% endif %},"soc":{% if s.soc_added and s.soc_added != "" %}{{ s.soc_added }}{% else %}null{% endif %}},
{% endif %}{% endfor %}
];

// Known usable battery capacity (kWh) — fallback only; the model also derives
// this straight from your data (energy added ÷ %SoC added), so a new car
// self-calibrates as it logs sessions.
const BATTERY = { '2025 Mach-E GT': 91.7, "LRB's 2025 Mach-E GT": 91.7 };
const DEFAULT_BATTERY = 91.7;
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
})();

const HOME = { lat: 42.3714, lon: -83.4702, label: 'Home — Plymouth, MI' };
function useHome(id){ document.getElementById(id).value = HOME.label; document.getElementById(id).dataset.home = '1'; }

// ── Waypoints (optional intermediate stops, e.g. an overnight hotel) ──
function addWaypoint(addr, charge){
  const row = document.createElement('div');
  row.className = 'wp-row';
  row.innerHTML =
    `<input type="text" class="wp-addr" placeholder="Waypoint — address or place">`
    + `<span class="wp-charge">charge to <input type="number" class="wp-pct" min="0" max="100" placeholder="—">%</span>`
    + `<button type="button" class="wp-del" title="Remove">×</button>`;
  row.querySelector('.wp-addr').value = addr || '';
  if (charge != null) row.querySelector('.wp-pct').value = charge;
  row.querySelector('.wp-del').onclick = () => row.remove();
  document.getElementById('waypointList').appendChild(row);
}
function getWaypoints(){
  return [...document.querySelectorAll('#waypointList .wp-row')].map(r => ({
    addr: r.querySelector('.wp-addr').value.trim(),
    chargeTo: parseFloat(r.querySelector('.wp-pct').value)
  })).filter(w => w.addr);
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
  const startEl = document.getElementById('startAddr'), endEl = document.getElementById('endAddr');
  if (!startEl.value.trim() || !endEl.value.trim()){ setStatus('Enter a start and destination.', true); return; }
  btn.disabled = true;
  try {
    setStatus('Finding locations…');
    const [A, B] = await Promise.all([ geocode(startEl.value.trim(), startEl), geocode(endEl.value.trim(), endEl) ]);

    // Geocode any waypoints, keep their charge-to %
    const wpInputs = getWaypoints();
    const wpGeo = await Promise.all(wpInputs.map(w => geocode(w.addr)));
    const waypoints = wpInputs.map((w, i) => ({ addr: w.addr, chargeTo: w.chargeTo, lat: wpGeo[i].lat, lon: wpGeo[i].lon }));

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

// Greedy plan for ONE segment [fromMi, toMi]: stop as far along as range-to-buffer
// allows, prefer fast/preferred chargers, charge only enough to reach the next stop
// or the segment end + buffer.
const DCFC_TOP = 80;       // never charge past this on DC fast (charge curve too slow above)
const TESLA_REACH_TOL = 40; // mi — prefer Tesla unless a non-Tesla gets you this much farther
function planSegment(fromMi, toMi, startSoc, reserve, chargers, effEff, batt, maxTop){
  maxTop = maxTop || DCFC_TOP;
  const milesPerPct = batt * effEff / 100;
  const peak = Math.max(...CAR_CURVE.map(p => p[1]));
  const espeed = c => Math.min(c.maxKW, peak);
  const stops = [];
  let pos = fromMi, soc = startSoc, guard = 0;
  const usable = chargers.filter(c => c.alongMi > fromMi + 1 && c.alongMi < toMi - 1);
  while (guard++ < 30){  // enough for cross-country
    const reach = pos + (soc - reserve) * milesPerPct;
    if (toMi <= reach){
      return { feasible: true, stops, arriveSoc: soc - (toMi - pos)/milesPerPct };
    }
    // Candidates: reachable while keeping a 2% cushion above reserve; if none,
    // relax to the hard reserve floor before giving up.
    let all = usable.filter(c => c.alongMi > pos + 4 && c.alongMi <= pos + (soc - reserve - 2) * milesPerPct);
    if (!all.length) all = usable.filter(c => c.alongMi > pos + 4 && c.alongMi <= reach);
    if (!all.length){
      return { feasible: false, stops, gapFrom: Math.round(pos), reachMi: Math.round(reach) };
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
    const arriveSoc = soc - (c.alongMi - pos)/milesPerPct;
    const remAfter = toMi - c.alongMi;
    const finishSoc = reserve + remAfter / milesPerPct;        // charge needed to reach segment end + buffer
    // Charge only enough to reach the segment end + buffer, but never above the
    // DCFC cap (default 80%). If 80% can't reach the end, the loop adds a stop.
    let target = finishSoc <= maxTop ? Math.ceil(finishSoc) : maxTop;
    target = Math.min(maxTop, Math.max(target, arriveSoc + 1));
    stops.push({ ...c, arriveSoc, target, addedKWh: (target-arriveSoc)/100*batt,
      mins: chargeMinutes(arriveSoc, target, batt, c.maxKW) });
    pos = c.alongMi; soc = target;
  }
  return { feasible: false, stops, gapFrom: Math.round(pos), reachMi: Math.round(pos + (soc-reserve)*milesPerPct) };
}

// Plan a segment with the 80% DCFC cap; only if that's infeasible (a leg with no
// charger in range) raise the cap in small steps and use the lowest that works,
// flagging any stop forced above 80%.
function planSegmentCapped(fromMi, toMi, soc, reserve, chargers, effEff, batt){
  for (const cap of [DCFC_TOP, 85, 90, 95, 100]){
    const r = planSegment(fromMi, toMi, soc, reserve, chargers, effEff, batt, cap);
    if (r.feasible){
      if (cap > DCFC_TOP) r.stops.forEach(s => { if (s.target > DCFC_TOP) s.overCap = true; });
      return r;
    }
  }
  return planSegment(fromMi, toMi, soc, reserve, chargers, effEff, batt, 100); // infeasible → gap info
}

// Full journey: split into segments at charging waypoints (e.g. an overnight
// hotel where you AC-charge to X%). Each charging waypoint resets SoC for the
// next segment. DCFC stops and waypoint charges are returned in route order.
function planJourney(totalMi, legMiles, waypoints, effEff, batt, startSoc, reserve, chargers){
  const anchors = (waypoints || [])
    .map((w, i) => ({ ...w, mile: (legMiles && legMiles[i+1] != null) ? legMiles[i+1] : null }))
    .filter(w => w.mile != null && !isNaN(w.chargeTo) && w.chargeTo > 0)
    .sort((a,b) => a.mile - b.mile);
  const all = [];
  let segStart = 0, soc = startSoc, overCap = false;
  for (const wp of anchors){
    const r = planSegmentCapped(segStart, wp.mile, soc, reserve, chargers, effEff, batt);
    r.stops.forEach(s => { all.push(s); if (s.overCap) overCap = true; });
    if (!r.feasible) return { needed: true, feasible: false, stops: all, gapFrom: r.gapFrom, reachMi: r.reachMi };
    all.push({ waypoint: true, name: wp.addr, net: 'AC', alongMi: wp.mile,
      arriveSoc: r.arriveSoc, target: wp.chargeTo, lat: wp.lat, lon: wp.lon });
    soc = wp.chargeTo;
    segStart = wp.mile;
  }
  const rf = planSegmentCapped(segStart, totalMi, soc, reserve, chargers, effEff, batt);
  rf.stops.forEach(s => { all.push(s); if (s.overCap) overCap = true; });
  if (!rf.feasible) return { needed: true, feasible: false, stops: all, gapFrom: rf.gapFrom, reachMi: rf.reachMi };
  return { needed: all.length > 0, feasible: true, stops: all, arriveSoc: rf.arriveSoc, overCap };
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
  // Reachable without charging AND no charge-waypoints? Then no key/API call needed.
  if (!chargingWps.length && e.miles <= (startSoc - reserve)/100 * e.batt * e.effEff){
    card.style.display = 'block';
    body.innerHTML = `<div class="stops-note">✅ No charging stop needed — you can do this on the starting charge.</div>`;
    return;
  }

  if (!getOCMKey()){
    card.style.display = 'block';
    body.innerHTML = `<div class="stops-summary">Charging-stop suggestions need a free <a href="https://openchargemap.org/site/profile/applications" target="_blank" rel="noopener">Open Charge Map API key</a> (kept only in this browser).</div>`
      + `<div class="stops-key"><input id="ocmKeyInput" type="text" placeholder="Paste OCM API key"><button onclick="saveOCMKey()">Save key</button></div>`;
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
    body.innerHTML = `<div class="stops-note">No preferred DCFC (Tesla / EA / ChargePoint, ≥50 kW) found near this route in Open Charge Map.</div>`;
    return;
  }
  // Plan the one-way journey (segment by segment across any charge-waypoints)
  const plan = planJourney(rt.miles, rt.legMiles, waypoints, e.effEff, e.batt, startSoc, reserve, chargers);
  renderStops(plan, e, reserve, document.getElementById('roundTrip').checked);
  drawChargerMarkers(plan.stops, waypoints);
  rerouteThroughStops(rt, plan, e);
}

// Redraw the map route so it actually passes through the chosen stops + waypoints
// (the energy plan is computed on the direct corridor; detours are a few mi each).
let DRIVE_DIST_NOTE = null;
async function rerouteThroughStops(rt, plan, e){
  if (!STATE || !plan || !plan.feasible) return;
  const via = [];
  plan.stops.forEach(s => { if (s.lat && s.lon && !s.waypoint) via.push({ lat: s.lat, lon: s.lon, mi: s.alongMi }); });
  (STATE.waypoints || []).forEach((w, i) => { if (w.lat && w.lon) via.push({ lat: w.lat, lon: w.lon, mi: (rt.legMiles && rt.legMiles[i+1]) || 0 }); });
  via.sort((a,b) => a.mi - b.mi);
  if (!via.length || via.length > 12) return; // OSRM via limit; skip very long trips
  try {
    const rr = (await route([STATE.A, ...via.map(v => ({ lat: v.lat, lon: v.lon })), STATE.B]))[0];
    await loadLeaflet();
    if (MAP && ROUTE_LAYER && ROUTE_LAYER[0]){
      MAP.removeLayer(ROUTE_LAYER[0]);
      const line = L.geoJSON(rr.geometry, { style: { color: '#5d3fd3', weight: 5, opacity: 0.85 } }).addTo(MAP);
      ROUTE_LAYER[0] = line;
      MAP.fitBounds(line.getBounds(), { padding: [30, 30] });
    }
    // Show the true via-stops driving distance next to the hero distance
    const mult = e.round ? 2 : 1;
    const driven = Math.round(rr.miles * mult);
    if (Math.abs(driven - Math.round(e.miles)) >= 3)
      document.getElementById('rDistSub').textContent = `${driven} mi via stops`;
  } catch(err){ /* keep the direct route */ }
}

function setVerdict(cls, icon, html){
  const vEl = document.getElementById('verdict');
  vEl.className = 'verdict ' + cls;
  vEl.innerHTML = `<span class="vicon">${icon}</span><span>${html}</span>`;
}

function renderStops(plan, e, reserve, roundTrip){
  const body = document.getElementById('stopsBody');
  if (plan.needed && !plan.feasible){
    let msg = `<div class="stops-note">⚠️ Couldn't build a complete plan with your preferred networks`;
    if (plan.gapFrom != null) msg += ` — no compatible DCFC (Tesla open-to-NACS / EA / ChargePoint, ≥50 kW) between mile ${plan.gapFrom} and your range limit (~mile ${plan.reachMi})`;
    msg += `. The gap may be too long for one charge.</div>`;
    body.innerHTML = msg + (plan.stops.length ? `<div class="stops-summary">Partial plan: ${plan.stops.length} stop(s) before the gap.</div>` : '');
    setVerdict('no', '🛑', `Couldn't complete a charging plan${plan.gapFrom!=null?` — gap near mile ${plan.gapFrom}`:''}. You may need a non-preferred charger or a waypoint there.`);
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
  let html = `<div class="stops-summary">${dcfc.length} DC fast stop${dcfc.length!==1?'s':''}${wpNote} · ~${Math.round(totalMin)} min total fast-charging · arrive around <b>${Math.round(plan.arriveSoc)}%</b></div>`;
  plan.stops.forEach((s,i) => {
    if (s.waypoint){
      html += `<div class="stop wp-stop">
        <div class="stop-num">★</div>
        <div class="stop-main">
          <div class="stop-name">${s.name}<span class="net-badge net-wp">Waypoint · AC</span></div>
          <div class="stop-sub">your stop · mile ${Math.round(s.alongMi)}</div>
          <div class="stop-charge">Arrive <b>${Math.round(s.arriveSoc)}%</b> → charge to <b>${Math.round(s.target)}%</b> here (Level 2 / overnight)</div>
        </div>
      </div>`;
    } else {
      html += `<div class="stop">
        <div class="stop-num">${i+1}</div>
        <div class="stop-main">
          <div class="stop-name">${s.name}<span class="net-badge ${NET_CLASS[s.net]}">${s.net}</span></div>
          <div class="stop-sub">${s.town ? s.town + ' · ' : ''}mile ${Math.round(s.alongMi)} · up to ${Math.round(s.maxKW)} kW${s.offMi>1?` · ${s.offMi.toFixed(1)} mi off route`:''}</div>
          <div class="stop-charge">Arrive <b>${Math.round(s.arriveSoc)}%</b> → charge to <b>${Math.round(s.target)}%</b> &nbsp;·&nbsp; +${s.addedKWh.toFixed(0)} kWh &nbsp;·&nbsp; ~${Math.round(s.mins)} min${s.overCap?` <span style="color:#eab308">⚠ above 80% — no closer charger</span>`:''}</div>
        </div>
      </div>`;
    }
  });
  if (roundTrip) html += `<div class="stops-summary" style="margin-top:10px">↩︎ Stops shown for the outbound leg only.</div>`;
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

// Enter key submits
['startAddr','endAddr'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') planTrip(); });
  document.getElementById(id).addEventListener('input', e => { delete e.target.dataset.home; });
});

// Tweaking vehicle / road / charge after a route is loaded → live re-estimate
// (no re-routing or weather call needed — same route, new numbers)
['vehSel','roadType','startSoc','reserve','roundTrip','effOverride'].forEach(id => {
  document.getElementById(id).addEventListener('change', refresh);
});
document.getElementById('effOverride').addEventListener('input', refresh);
</script>

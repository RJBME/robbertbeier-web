---
layout: page
title: Look Back
permalink: /lookback/
---

{% comment %}
=============================================================
  VEHICLE "LOOK BACK" — a graphical retrospective one-pager.
  Query-param driven: /lookback/?v=<vehicle name>
  Reuses the SAME cost / gas-savings / CO2 logic as
  charging-analytics.md so the numbers match. If you change a
  rate rule there, mirror it here.
  SRI NOTE: bumping a CDN version below requires regenerating its
  integrity hash — see charging-analytics.md for the one-liner.
=============================================================
{% endcomment %}

<style>
  .lb-wrap { max-width: 1000px; margin: 0 auto; }
  .lb-back { display:inline-block; font-size:0.72rem; color:var(--link); text-decoration:none; margin-bottom:14px; opacity:0.8; }
  .lb-back:hover { opacity:1; }
  .lb-head { border-left: 6px solid var(--lb-accent,#888); padding: 4px 0 4px 18px; margin-bottom: 6px; }
  .lb-eyebrow { font-size:0.66rem; text-transform:uppercase; letter-spacing:0.14em; color:#999; font-weight:700; }
  .lb-title { font-size: 2.1rem; font-weight: 900; margin: 2px 0 4px; color: var(--lb-accent,#333); line-height:1.03; }
  .lb-sub { font-size:0.82rem; color:#888; }
  .lb-lede { font-size:0.98rem; line-height:1.65; color:var(--text,#333); margin: 18px 2px 4px; }
  .lb-lede b { color:var(--lb-accent,#333); }
  .lb-hero { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; margin: 20px 0; }
  @media (max-width: 720px){ .lb-hero { grid-template-columns: repeat(2, minmax(0,1fr)); } }
  .lb-card { background:var(--dash-card,#fff); border:1px solid var(--dash-border,#e5e5e5); border-radius:14px; padding:16px 14px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.05); min-width:0; }
  .lb-card.hero2 { border-top: 3px solid var(--lb-accent,#888); }
  .lb-k { font-size:0.6rem; text-transform:uppercase; letter-spacing:0.09em; color:#999; font-weight:700; display:block; margin-bottom:6px; }
  .lb-v { font-size:1.5rem; font-weight:900; color:var(--text,#222); line-height:1.05; }
  .lb-v small { font-size:0.62rem; font-weight:600; color:#999; display:block; margin-top:3px; letter-spacing:0.02em; }
  .lb-v.green { color:#2ecc71; }
  /* Story sections */
  .lb-sec { margin: 34px 0 10px; }
  .lb-sec-h { font-size:1.15rem; font-weight:800; color:var(--text,#222); margin:0 0 2px; }
  .lb-sec-p { font-size:0.86rem; color:#888; line-height:1.6; margin:0 0 14px; max-width:70ch; }
  .lb-sec-p b { color:var(--text,#444); }
  .lb-chart-grid { display:grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap:16px; }
  @media (max-width: 760px){ .lb-chart-grid { grid-template-columns: minmax(0,1fr); } }
  .lb-chart-card { background:var(--dash-card,#fff); border:1px solid var(--dash-border,#e5e5e5); border-radius:14px; padding:16px 18px; min-width:0; box-shadow:0 2px 8px rgba(0,0,0,0.05); }
  .lb-chart-title { font-size:0.7rem; text-transform:uppercase; letter-spacing:0.07em; color:#888; font-weight:700; margin:0 0 12px; }
  .lb-chart-wrap { position:relative; height:240px; }
  .lb-map { height:300px; border-radius:10px; overflow:hidden; z-index:0; }
  .lb-row { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; margin: 16px 0; }
  @media (max-width: 560px){ .lb-row { grid-template-columns: 1fr; } }
  .lb-fact { background:var(--dash-card,#fff); border:1px solid var(--dash-border,#e5e5e5); border-radius:12px; padding:14px 16px; font-size:0.82rem; color:var(--text,#333); }
  .lb-fact b { color:var(--lb-accent,#333); }
  .lb-fact .lb-k { margin-bottom:5px; }
  .lb-close { text-align:center; font-size:0.95rem; color:#888; margin:30px 0 10px; line-height:1.7; }
  .lb-picker { background:var(--dash-card,#fff); border:1px solid var(--dash-border,#e5e5e5); border-radius:12px; padding:20px; }
  .lb-picker a { display:inline-block; margin:6px 8px 6px 0; padding:8px 14px; border:1px solid var(--dash-border,#ddd); border-radius:20px; text-decoration:none; color:var(--text,#333); font-weight:700; font-size:0.85rem; }
  .lb-foot { font-size:0.62rem; color:#aaa; text-align:center; margin-top:22px; line-height:1.5; }
</style>

<div class="lb-wrap">
  <a class="lb-back" href="/charging/">← Back to Dashboard</a>
  <div id="lbContent"></div>
</div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css" integrity="sha384-b8ANgTJvdlAnWM5YGMpKn7Kodm+1k7NYNG9zdjTCcZcKatzYHwZ0RLdWarbJJVzU" crossorigin="anonymous" />
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js" integrity="sha384-JUh163oCRItcbPme8pYnROHQMC6fNKTBWtRG3I3I0erJkzNgL7uxKlNwcrcFKeqF" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js" integrity="sha384-y49Zu59jZHJL/PLKgZPv3k2WI9c0Yp3pWB76V8OBVCb0QBKS8l4Ff3YslzHVX76Y" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js" integrity="sha384-u5N8qJeJOO2iqNjIKTdl6KeKsEikMAmCUBPc6sC6uGpgL34aPJ4VgNhuhumedpEk" crossorigin="anonymous"></script>

<script>
/* ── Data (same sources as the analytics page) ─────────────────────────── */
const sessions = [
{% assign sorted_sessions = site.charging | sort: 'date' %}
  {% for e in sorted_sessions %}{ date:"{{ e.date | date: '%Y-%m-%d' }}", location:"{{ e.location | replace: '"', "'" }}", vehicle:"{{ e.vehicle | default: '2025 Mach-E GT' | replace: '"', "'" }}", kwh:{{ e.energy_kwh | times: 1.0 }}, rawCost:{{ e.cost | times: 1.0 }}, batteryKwh:{{ e.battery_kwh | default: "null" }}, milesAdded:{{ e.miles_added | default: 0 }}, solar:{{ e.solar | default: false }} }{% unless forloop.last %},{% endunless %}
  {% endfor %}
];
const homeRates          = {{ site.data.rates.home_electricity | jsonify }};
const HOME_CHARGE_UPLIFT = 1 + ({{ site.data.rates.home_charge_uplift | default: 0.10 }});
const gasSavingsRates    = {{ site.data.rates.gas_savings | jsonify }};
const memberships        = {{ site.data.memberships.memberships | jsonify }} || [];
const mileageHistory     = {{ site.data.mileage | jsonify }};
const locationData       = {{ site.data.locations | jsonify }} || [];

/* ── Constants + lookups (copied from charging-analytics.md — keep in sync) ── */
const VEHICLE_MPG = { '2025 Mach-E GT':27, '2026 Mach-E SR':27, "LRB's 2025 Mach-E GT":23.0, "LRB's 2026 Mach-E SR":23.0 };
const VEHICLE_COLORS = { '2025 Mach-E GT':'#C2A76C', '2026 Mach-E SR':'#E31E2E', "LRB's 2025 Mach-E GT":'#B5176B', "LRB's 2026 Mach-E SR":'#2E7D9E' };
const BUCKET_COLORS = { 'Work':'#0288d1','Home':'#7b1fa2','Tesla SC':'#CC0000','ChargePoint':'#FF7A14','Blink':'#65A844','Rivian':'#ffa500','Electrify America':'#00963f','WeCharge':'#51A950','BP Pulse':'#8DC63F','Other':'#909090' };
const CO2_GAS_KG_PER_GAL = 8.887, CO2_TREE_KG_PER_YEAR = 21;
const EGRID_FACTORS = { RFCM:970.6*0.4536/1000, MROE:1397.3*0.4536/1000, MROW:920.1*0.4536/1000, RFCW:911.4*0.4536/1000, RFCE:596.9*0.4536/1000 };
const EGRID_DEFAULT = EGRID_FACTORS.RFCM;
const STATE_TO_EGRID = { MI:'RFCM', WI:'MROE', MN:'MROW', IL:'RFCW', OH:'RFCW', IN:'RFCW', PA:'RFCE', NY:'RFCE' };
function getStepRate(arr, date, field, fallback){ if(!Array.isArray(arr)||!arr.length) return fallback; let v=fallback; for(const r of arr){ if(r.date<=date) v=r[field]; } return (v==null)?fallback:v; }
function getGasSavingsObj(date, vehicle){
  const def={mpg:27, gas_price:3.26, mi_per_kwh:3.0};
  if(!Array.isArray(gasSavingsRates)||!gasSavingsRates.length) return def;
  let obj=gasSavingsRates[0]; for(const r of gasSavingsRates){ if(r.date<=date) obj=r; }
  const mpg = (vehicle||'').includes('LRB') ? 23 : (obj.mpg||27);
  return { mpg, gas_price:obj.gas_price||3.26, mi_per_kwh:obj.mi_per_kwh||3.0 };
}
function getEgridFactor(locStr){
  const entry=(locationData||[]).find(l=>l.location===locStr);
  if(entry && entry.solar) return 0;
  const m1=locStr.match(/\b([A-Z]{2})\s*$/), m2=!m1 && locStr.match(/,\s*([A-Z]{2})\b/);
  const st=(m1||m2||[])[1];
  return (st && STATE_TO_EGRID[st]) ? EGRID_FACTORS[STATE_TO_EGRID[st]] : EGRID_DEFAULT;
}
function getBucket(loc){ const l=loc.toLowerCase();
  return l.includes('work')?'Work':l.includes('home')?'Home':l.includes('tesla')?'Tesla SC':l.includes('chargepoint')?'ChargePoint':l.includes('blink')?'Blink':l.includes('rivian')?'Rivian':l.includes('electrify')?'Electrify America':l.includes('wecharge')?'WeCharge':l.includes('bp pulse')?'BP Pulse':'Other'; }

/* ── Enrich ALL sessions, then amortize memberships (matches analytics) ──── */
sessions.forEach(s=>{
  const loc=s.location.toLowerCase();
  const hRate=getStepRate(homeRates, s.date, 'rate', 0.196);
  s.cost = loc.includes('home') ? s.kwh*hRate*HOME_CHARGE_UPLIFT : s.rawCost;
  const gs=getGasSavingsObj(s.date, s.vehicle);
  // battery-side energy can't exceed delivered — ignore an over-estimating Ford SOC reading (see charging-analytics)
  const effKwh=(s.batteryKwh && s.batteryKwh>0 && s.batteryKwh<=s.kwh)?s.batteryKwh:s.kwh;
  const rawEff = s.milesAdded>0 && effKwh>0 ? s.milesAdded/effKwh : null;
  s.hasRealEff = rawEff!==null && rawEff>=1.5 && rawEff<=4.75;
  s.effKwh = effKwh; s.realEff = s.hasRealEff ? rawEff : null;
  const estMiles = s.hasRealEff ? s.milesAdded : s.kwh*(gs.mi_per_kwh||3.0);
  s.gasEquiv = estMiles/(gs.mpg||27)*(gs.gas_price||3.26);
  s.saving = s.gasEquiv - s.cost;
  s.bucket = getBucket(s.location);
  s.month = s.date.slice(0,7);
  const egrid = s.solar ? 0 : getEgridFactor(s.location);
  s.co2GasCould = (estMiles/(VEHICLE_MPG[s.vehicle]||27))*CO2_GAS_KG_PER_GAL;
  s.co2Avoided = s.co2GasCould - s.kwh*egrid;
});
(memberships||[]).forEach(m=>{
  if(!m||!m.network||!m.fee||!m.start||!m.end) return;
  const net=String(m.network).toLowerCase();
  const inWin=sessions.filter(s=>s.location.toLowerCase().includes(net) && s.date>=m.start && s.date<=m.end);
  const wk=inWin.reduce((a,s)=>a+(s.kwh||0),0);
  if(wk<=0) return;
  inWin.forEach(s=>{ const share=m.fee*(s.kwh/wk); s.cost+=share; s.saving-=share; });
});

/* ── Pick the vehicle from ?v= (robust normalized match) ──────────────────── */
const allVehicles=[...new Set(sessions.map(s=>s.vehicle))];
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
const param=new URLSearchParams(location.search).get('v')||'';
const vehicle=allVehicles.find(v=>norm(v)===norm(param.replace(/\+/g,' ')));
const el=document.getElementById('lbContent');
let _charts=[], _map=null;  // declared before renderLookback() runs (avoids TDZ)

const isDark=()=>document.documentElement.getAttribute('data-theme')==='dark';
const tc=()=>isDark()?'#c8c8c8':'#555';
const gc=()=>isDark()?'#3a3a3a':'#e8e8e8';
function fmtUSD(n){ return '$'+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
function esc(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function fmtMonth(m){ const [y,mo]=m.split('-'); return new Date(y,mo-1,1).toLocaleDateString(undefined,{month:'short',year:'2-digit'}); }
function fmtDate(d){ return d ? new Date(d+'T12:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '—'; }

if(!vehicle){
  el.innerHTML = '<div class="lb-picker"><div class="lb-k" style="margin-bottom:10px">Pick a vehicle to look back on</div>'
    + allVehicles.sort((a,b)=>{const y=s=>{const m=String(s).match(/\b(20\d\d)\b/);return m?+m[1]:0;};const yb=y(b),ya=y(a);if(yb!==ya)return yb-ya;const la=/LRB/.test(a)?1:0,lb=/LRB/.test(b)?1:0;if(la!==lb)return la-lb;return String(a).localeCompare(String(b));})
        .map(v=>`<a href="/lookback/?v=${encodeURIComponent(v)}">${esc(v)}</a>`).join('')
    + '</div>';
} else {
  renderLookback(vehicle);
}

function renderLookback(veh){
  const accent = VEHICLE_COLORS[veh] || '#7b7b7b';
  document.documentElement.style.setProperty('--lb-accent', accent);
  const ss = sessions.filter(s=>s.vehicle===veh);

  const mh = (mileageHistory||[]).filter(m=>m.vehicle===veh).slice().sort((a,b)=>a.date.localeCompare(b.date));
  const lastOdo = mh.length?+mh[mh.length-1].odometer:0;
  const dates = ss.map(s=>s.date).sort();
  const firstDate = dates[0] || (mh[0]&&mh[0].date) || null;
  const lastDate  = dates[dates.length-1] || (mh.length?mh[mh.length-1].date:null) || null;
  let monthsOwned = 1;
  if(firstDate && lastDate){ const d0=new Date(firstDate+'T12:00'), d1=new Date(lastDate+'T12:00'); monthsOwned = Math.max(1, Math.round((d1-d0)/2629800000)); }

  const totKwh  = ss.reduce((a,s)=>a+s.kwh,0);
  const totCost = ss.reduce((a,s)=>a+s.cost,0);
  const totSave = ss.reduce((a,s)=>a+s.saving,0);
  const totCO2  = ss.reduce((a,s)=>a+s.co2Avoided,0);
  const freeKwh = ss.filter(s=>s.cost<0.005).reduce((a,s)=>a+s.kwh,0);
  const homeKwh = ss.filter(s=>s.bucket==='Home').reduce((a,s)=>a+s.kwh,0);
  const publicKwh = ss.filter(s=>s.bucket!=='Home' && s.bucket!=='Work').reduce((a,s)=>a+s.kwh,0);
  const _re=ss.filter(s=>s.hasRealEff), _reMi=_re.reduce((a,s)=>a+s.milesAdded,0), _reKw=_re.reduce((a,s)=>a+s.effKwh,0);
  const miPerKwh = _reKw>0 ? _reMi/_reKw : 0;
  const trees = totCO2/CO2_TREE_KG_PER_YEAR;

  const byLoc={}; ss.forEach(s=>{ (byLoc[s.location]=byLoc[s.location]||{n:0,kwh:0}); byLoc[s.location].n++; byLoc[s.location].kwh+=s.kwh; });
  const favEntry = Object.entries(byLoc).sort((a,b)=> b[1].n-a[1].n || b[1].kwh-a[1].kwh)[0];
  const fav = favEntry ? { loc:favEntry[0], n:favEntry[1].n } : null;
  const biggest = ss.slice().sort((a,b)=>b.kwh-a.kwh)[0];
  const distinctPlaces = Object.keys(byLoc).length;
  const roadTripKwh = ss.filter(s=>{ const b=s.bucket; return b!=='Home' && b!=='Work'; }).length;

  const gasCar = veh.includes('LRB') ? 'her 2023 Explorer' : 'the 2023 Escape it replaced';
  const owner  = veh.includes('LRB') ? "Leah's" : 'your';

  el.innerHTML = `
    <div class="lb-head">
      <div class="lb-eyebrow">A Look Back</div>
      <div class="lb-title">${esc(veh)}</div>
      <div class="lb-sub">${fmtDate(firstDate)} – ${fmtDate(lastDate)} · ${monthsOwned} month${monthsOwned===1?'':'s'} on the road</div>
    </div>

    <p class="lb-lede">Over <b>${monthsOwned} months</b>, ${esc(veh)} was plugged in <b>${ss.length} times</b> across
      <b>${distinctPlaces} places</b>, drank <b>${(totKwh/1000).toFixed(2)} MWh</b> of electrons, and quietly kept about
      <b>${fmtUSD(totSave)}</b> out of a gas tank. Here's how it went.</p>

    <div class="lb-hero">
      <div class="lb-card hero2"><span class="lb-k">Final Odometer</span><span class="lb-v">${Math.round(lastOdo).toLocaleString()}<small>miles on the clock</small></span></div>
      <div class="lb-card hero2"><span class="lb-k">Energy Charged</span><span class="lb-v">${(totKwh/1000).toFixed(2)}<small>MWh · ${Math.round(totKwh).toLocaleString()} kWh</small></span></div>
      <div class="lb-card hero2"><span class="lb-k">Gas Savings</span><span class="lb-v green">${fmtUSD(totSave)}<small>vs ${esc(gasCar)}</small></span></div>
      <div class="lb-card hero2"><span class="lb-k">CO₂ Avoided</span><span class="lb-v green">${Math.round(totCO2).toLocaleString()} kg<small>≈ ${trees.toFixed(1)} trees / yr</small></span></div>
    </div>
    <div class="lb-hero">
      <div class="lb-card"><span class="lb-k">Sessions</span><span class="lb-v">${ss.length}</span></div>
      <div class="lb-card"><span class="lb-k">Total Cost</span><span class="lb-v">${fmtUSD(totCost)}</span></div>
      <div class="lb-card"><span class="lb-k">Efficiency</span><span class="lb-v">${miPerKwh.toFixed(2)}<small>mi / kWh · FordPass</small></span></div>
      <div class="lb-card"><span class="lb-k">Free Energy</span><span class="lb-v">${totKwh>0?Math.round(freeKwh/totKwh*100):0}%<small>${Math.round(homeKwh/(totKwh||1)*100)}% at home</small></span></div>
    </div>

    <div class="lb-sec">
      <h3 class="lb-sec-h">⚡ Month by month</h3>
      <p class="lb-sec-p">Every kWh it charged, coloured by where it plugged in — the rhythm of daily driving, punctuated by the odd road trip.</p>
      <div class="lb-chart-grid">
        <div class="lb-chart-card"><p class="lb-chart-title">Energy per month, by source (kWh)</p><div class="lb-chart-wrap"><canvas id="lbMonthly"></canvas></div></div>
        <div class="lb-chart-card"><p class="lb-chart-title">Sessions per month</p><div class="lb-chart-wrap"><canvas id="lbSessions"></canvas></div></div>
      </div>
    </div>

    <div class="lb-sec">
      <h3 class="lb-sec-h">💸 The savings added up</h3>
      <p class="lb-sec-p">Running total of what ${owner} Mach-E saved versus filling up ${esc(gasCar)} — one charge at a time.</p>
      <div class="lb-chart-card"><p class="lb-chart-title">Cumulative gas savings ($)</p><div class="lb-chart-wrap"><canvas id="lbCumSave"></canvas></div></div>
    </div>

    <div class="lb-sec">
      <h3 class="lb-sec-h">🗺️ Where it charged</h3>
      <p class="lb-sec-p"><b>${Math.round(homeKwh/(totKwh||1)*100)}%</b> at home, <b>${Math.round(publicKwh/(totKwh||1)*100)}%</b> out in the wild. ${roadTripKwh>0?`It found public chargers ${roadTripKwh} times on the road.`:''}</p>
      <div class="lb-chart-grid">
        <div class="lb-chart-card"><p class="lb-chart-title">Energy by charging spot (kWh)</p><div class="lb-chart-wrap"><canvas id="lbLocation"></canvas></div></div>
        <div class="lb-chart-card"><p class="lb-chart-title">Its map — circle size ∝ energy</p><div id="lbMap" class="lb-map"></div></div>
      </div>
    </div>

    ${_re.length>=3 ? `
    <div class="lb-sec">
      <h3 class="lb-sec-h">🎯 How it drove</h3>
      <p class="lb-sec-p">Real efficiency from FordPass, month by month — how many miles it wrung out of each kWh.</p>
      <div class="lb-chart-card"><p class="lb-chart-title">Efficiency (mi / kWh)</p><div class="lb-chart-wrap"><canvas id="lbEff"></canvas></div></div>
    </div>` : ''}

    <div class="lb-row">
      ${fav?`<div class="lb-fact"><span class="lb-k">Favorite Spot</span><b>${esc(fav.loc)}</b> — ${fav.n} session${fav.n===1?'':'s'}, more than anywhere else.</div>`:''}
      ${biggest?`<div class="lb-fact"><span class="lb-k">Biggest Single Charge</span><b>${biggest.kwh.toFixed(1)} kWh</b> at ${esc(biggest.location)} on ${fmtDate(biggest.date)}.</div>`:''}
      <div class="lb-fact"><span class="lb-k">First Charge</span>${fmtDate(firstDate)} at <b>${esc((ss.find(s=>s.date===firstDate)||{}).location||'—')}</b>.</div>
      <div class="lb-fact"><span class="lb-k">Places Visited</span><b>${distinctPlaces}</b> distinct charging spots over its ${monthsOwned} months.</div>
    </div>

    <p class="lb-close">${Math.round(lastOdo).toLocaleString()} miles on the clock, ${(totKwh/1000).toFixed(1)} MWh charged, and about <b style="color:#2ecc71">${fmtUSD(totSave)}</b> kept out of a gas tank.<br>Thanks for the ride. 🚗⚡</p>

    <p class="lb-foot">Same cost, gas-savings and CO₂ methodology as the Analytics page. Home cost includes the +10% wall-side uplift; CO₂ vs the ${VEHICLE_MPG[veh]||27} mpg baseline and eGRID regional grid factors. Private-residence map pins are coarsened for privacy.</p>
  `;

  buildCharts(veh, ss);
  buildMap(veh, ss, byLoc);

  // Rebuild charts on light/dark toggle so grid/label colours stay legible.
  const themeBtn = document.getElementById('theme-toggle');
  if(themeBtn && !themeBtn._lbWired){ themeBtn._lbWired=true; themeBtn.addEventListener('click', ()=>setTimeout(()=>buildCharts(veh, ss), 30)); }
}

function buildCharts(veh, ss){
  if(!window.Chart) return;
  Chart.register(ChartDataLabels);
  Chart.defaults.animation = false;
  _charts.forEach(c=>{ try{c.destroy();}catch(e){} }); _charts=[];
  const accent = VEHICLE_COLORS[veh] || '#7b7b7b';
  const months=[...new Set(ss.map(s=>s.month))].sort();
  const buckets=[...new Set(ss.map(s=>s.bucket))].sort((a,b)=> ss.filter(s=>s.bucket===b).reduce((x,s)=>x+s.kwh,0) - ss.filter(s=>s.bucket===a).reduce((x,s)=>x+s.kwh,0));

  // 1. Monthly energy by source (stacked bar)
  _charts.push(new Chart('lbMonthly', {
    type:'bar',
    data:{ labels:months.map(fmtMonth), datasets: buckets.map(b=>({
      label:b, backgroundColor:BUCKET_COLORS[b]||'#909090', stack:'e', borderRadius:2,
      data: months.map(m=> +ss.filter(s=>s.month===m && s.bucket===b).reduce((a,s)=>a+s.kwh,0).toFixed(1))
    })) },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'bottom', labels:{color:tc(), boxWidth:10, font:{size:10}, padding:8}}, datalabels:{display:false},
        tooltip:{callbacks:{label:c=>` ${c.dataset.label}: ${c.parsed.y} kWh`}} },
      scales:{ x:{stacked:true, grid:{display:false}, ticks:{color:tc(), font:{size:9}}},
        y:{stacked:true, grid:{color:gc()}, ticks:{color:tc(), callback:v=>v+' kWh'}} } }
  }));

  // 2. Sessions per month (bar)
  _charts.push(new Chart('lbSessions', {
    type:'bar',
    data:{ labels:months.map(fmtMonth), datasets:[{ data:months.map(m=>ss.filter(s=>s.month===m).length), backgroundColor:accent, borderRadius:3 }] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, datalabels:{display:false}, tooltip:{callbacks:{label:c=>` ${c.parsed.y} sessions`}} },
      scales:{ x:{grid:{display:false}, ticks:{color:tc(), font:{size:9}}}, y:{grid:{color:gc()}, ticks:{color:tc(), precision:0}, beginAtZero:true} } }
  }));

  // 3. Cumulative savings (filled line)
  const sorted=ss.slice().sort((a,b)=>a.date.localeCompare(b.date));
  let cum=0; const cumData=sorted.map(s=>{ cum+=s.saving; return +cum.toFixed(2); });
  _charts.push(new Chart('lbCumSave', {
    type:'line',
    data:{ labels:sorted.map(s=>s.date), datasets:[{ data:cumData, borderColor:'#2ecc71', backgroundColor:'rgba(46,204,113,0.15)', fill:true, tension:0.25, pointRadius:0, borderWidth:2 }] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, datalabels:{display:false}, tooltip:{callbacks:{title:c=>fmtDate(c[0].label), label:c=>' Saved '+fmtUSD(c.parsed.y)+' to date'}} },
      scales:{ x:{grid:{display:false}, ticks:{color:tc(), font:{size:9}, maxTicksLimit:8, autoSkip:true, callback:function(v){ const d=this.getLabelForValue(v); return fmtMonth(String(d).slice(0,7)); }}},
        y:{grid:{color:gc()}, ticks:{color:tc(), callback:v=>'$'+v}, beginAtZero:true} } }
  }));

  // 4. Energy by location bucket (horizontal bar, sorted)
  const bkKwh = buckets.map(b=>({b, kwh:+ss.filter(s=>s.bucket===b).reduce((a,s)=>a+s.kwh,0).toFixed(1)})).sort((a,b)=>b.kwh-a.kwh);
  _charts.push(new Chart('lbLocation', {
    type:'bar',
    data:{ labels:bkKwh.map(x=>x.b), datasets:[{ data:bkKwh.map(x=>x.kwh), backgroundColor:bkKwh.map(x=>BUCKET_COLORS[x.b]||'#909090'), borderRadius:5 }] },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, datalabels:{anchor:'end', align:'end', color:tc(), font:{size:10, weight:'bold'}, formatter:v=> v>=1000?(v/1000).toFixed(1)+'k':v+'' }, tooltip:{callbacks:{label:c=>' '+c.parsed.x+' kWh'}} },
      scales:{ x:{grid:{color:gc()}, ticks:{color:tc(), callback:v=>v>=1000?(v/1000)+'k':v}, beginAtZero:true, grace:'12%'}, y:{grid:{display:false}, ticks:{color:tc(), font:{size:11}}} } }
  }));

  // 5. Efficiency by month (line) — only if enough real-eff data
  if(document.getElementById('lbEff')){
    const effMonths = months.filter(m=> ss.some(s=>s.month===m && s.hasRealEff));
    const effData = effMonths.map(m=>{ const g=ss.filter(s=>s.month===m && s.hasRealEff); const mi=g.reduce((a,s)=>a+s.milesAdded,0), kw=g.reduce((a,s)=>a+s.effKwh,0); return kw>0?+(mi/kw).toFixed(2):null; });
    _charts.push(new Chart('lbEff', {
      type:'line',
      data:{ labels:effMonths.map(fmtMonth), datasets:[{ data:effData, borderColor:accent, backgroundColor:accent, tension:0.25, pointRadius:3, borderWidth:2, spanGaps:true }] },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, datalabels:{display:false}, tooltip:{callbacks:{label:c=>' '+c.parsed.y+' mi/kWh'}} },
        scales:{ x:{grid:{display:false}, ticks:{color:tc(), font:{size:9}}}, y:{grid:{color:gc()}, ticks:{color:tc(), callback:v=>v.toFixed(1)}} } }
    }));
  }
}

function buildMap(veh, ss, byLoc){
  const mapEl=document.getElementById('lbMap');
  if(!mapEl || !window.L) return;
  const pts = Object.keys(byLoc).map(loc=>{
    const c=(locationData||[]).find(l=>l.location===loc);
    if(!c || !c.lat || !c.lng) return null;
    return { loc, kwh:byLoc[loc].kwh, n:byLoc[loc].n, lat:+c.lat, lng:+c.lng, city:c.city||'', bucket:getBucket(loc) };
  }).filter(Boolean);
  if(!pts.length){ mapEl.parentElement.style.display='none'; return; }
  try { if(_map){ _map.remove(); _map=null; } } catch(e){}
  _map = L.map(mapEl, { scrollWheelZoom:false, attributionControl:false });
  const dark=isDark();
  L.tileLayer(dark?'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png':'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    { subdomains:'abcd', maxZoom:19 }).addTo(_map);
  const maxKwh=Math.max(...pts.map(p=>p.kwh));
  const grp=L.featureGroup();
  pts.forEach(p=>{
    const r = 6 + 22*Math.sqrt(p.kwh/maxKwh);
    L.circleMarker([p.lat,p.lng], { radius:r, color:BUCKET_COLORS[p.bucket]||'#909090', weight:1.5, fillColor:BUCKET_COLORS[p.bucket]||'#909090', fillOpacity:0.45 })
      .bindPopup(`<b>${esc(p.loc)}</b><br>${p.kwh.toFixed(1)} kWh · ${p.n} session${p.n===1?'':'s'}`)
      .addTo(grp);
  });
  grp.addTo(_map);
  _map.fitBounds(grp.getBounds().pad(0.25));
  setTimeout(()=>_map.invalidateSize(), 60);
}
</script>

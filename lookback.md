---
layout: page
title: Look Back
permalink: /lookback/
---

{% comment %}
=============================================================
  VEHICLE "LOOK BACK" — retrospective one-pager
  ─────────────────────────────────────────────────────────
  Query-param driven: /lookback/?v=<vehicle name>
  Reuses the SAME cost / gas-savings / CO2 logic as
  charging-analytics.md so the numbers match. If you change
  a rate rule there (home uplift, membership amortization,
  eGRID factors, baseline MPG), mirror it here.
=============================================================
{% endcomment %}

<style>
  .lb-wrap { max-width: 880px; margin: 0 auto; }
  .lb-back { display:inline-block; font-size:0.72rem; color:var(--link); text-decoration:none; margin-bottom:14px; opacity:0.8; }
  .lb-back:hover { opacity:1; }
  .lb-head { border-left: 6px solid var(--lb-accent,#888); padding: 4px 0 4px 18px; margin-bottom: 6px; }
  .lb-eyebrow { font-size:0.66rem; text-transform:uppercase; letter-spacing:0.14em; color:#999; font-weight:700; }
  .lb-title { font-size: 2rem; font-weight: 900; margin: 2px 0 4px; color: var(--lb-accent,#333); line-height:1.05; }
  .lb-sub { font-size:0.82rem; color:#888; }
  .lb-hero { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; margin: 22px 0; }
  @media (max-width: 720px){ .lb-hero { grid-template-columns: repeat(2, minmax(0,1fr)); } }
  .lb-card { background:var(--dash-card,#fff); border:1px solid var(--dash-border,#e5e5e5); border-radius:14px; padding:16px 14px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.05); min-width:0; }
  .lb-card.hero2 { border-top: 3px solid var(--lb-accent,#888); }
  .lb-k { font-size:0.6rem; text-transform:uppercase; letter-spacing:0.09em; color:#999; font-weight:700; display:block; margin-bottom:6px; }
  .lb-v { font-size:1.5rem; font-weight:900; color:var(--text,#222); line-height:1.05; }
  .lb-v small { font-size:0.62rem; font-weight:600; color:#999; display:block; margin-top:3px; letter-spacing:0.02em; }
  .lb-v.green { color:#2ecc71; }
  .lb-row { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; margin: 14px 0; }
  @media (max-width: 560px){ .lb-row { grid-template-columns: 1fr; } }
  .lb-fact { background:var(--dash-card,#fff); border:1px solid var(--dash-border,#e5e5e5); border-radius:12px; padding:14px 16px; font-size:0.82rem; color:var(--text,#333); }
  .lb-fact b { color:var(--lb-accent,#333); }
  .lb-fact .lb-k { margin-bottom:5px; }
  .lb-close { text-align:center; font-size:0.9rem; color:#888; margin:26px 0 10px; line-height:1.6; }
  .lb-picker { background:var(--dash-card,#fff); border:1px solid var(--dash-border,#e5e5e5); border-radius:12px; padding:20px; }
  .lb-picker a { display:inline-block; margin:6px 8px 6px 0; padding:8px 14px; border:1px solid var(--dash-border,#ddd); border-radius:20px; text-decoration:none; color:var(--text,#333); font-weight:700; font-size:0.85rem; }
  .lb-foot { font-size:0.62rem; color:#aaa; text-align:center; margin-top:20px; line-height:1.5; }
</style>

<div class="lb-wrap">
  <a class="lb-back" href="/charging/">← Back to Dashboard</a>
  <div id="lbContent"></div>
</div>

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
const CO2_GAS_KG_PER_GAL = 8.887, CO2_TREE_KG_PER_YEAR = 21;
const EGRID_FACTORS = { RFCM:970.6*0.4536/1000, MROE:1397.3*0.4536/1000, MROW:920.1*0.4536/1000, RFCW:911.4*0.4536/1000, RFCE:596.9*0.4536/1000 };
const EGRID_DEFAULT = EGRID_FACTORS.RFCM;
const STATE_TO_EGRID = { MI:'RFCM', WI:'MROE', MN:'MROW', IL:'RFCW', OH:'RFCW', IN:'RFCW', PA:'RFCE', NY:'RFCE' };
function getStepRate(arr, date, field, fallback){ if(!Array.isArray(arr)||!arr.length) return fallback; let v=fallback; for(const r of arr){ if(r.date<=date) v=r[field]; } return (v==null)?fallback:v; }
function getGasSavingsObj(date, vehicle){
  const def={mpg:27, gas_price:3.26, mi_per_kwh:3.0};
  if(!Array.isArray(gasSavingsRates)||!gasSavingsRates.length) return def;
  let obj=gasSavingsRates[0]; for(const r of gasSavingsRates){ if(r.date<=date) obj=r; }
  const mpg = (vehicle||'').includes('LRB') ? 23 : (obj.mpg||27);   // per-vehicle MPG override
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
  return l.includes('work')?'Work':l.includes('home')?'Home':l.includes('tesla')?'Tesla SC':l.includes('chargepoint')?'ChargePoint':l.includes('blink')?'Blink':l.includes('rivian')?'Rivian':l.includes('electrify')?'Electrify America':l.includes('wecharge')?'WeCharge':'Other'; }

/* ── Enrich ALL sessions, then amortize memberships (matches analytics) ──── */
sessions.forEach(s=>{
  const loc=s.location.toLowerCase();
  const hRate=getStepRate(homeRates, s.date, 'rate', 0.196);
  s.cost = loc.includes('home') ? s.kwh*hRate*HOME_CHARGE_UPLIFT : s.rawCost;
  const gs=getGasSavingsObj(s.date, s.vehicle);
  const effKwh=(s.batteryKwh && s.batteryKwh>0)?s.batteryKwh:s.kwh;
  const rawEff = s.milesAdded>0 && effKwh>0 ? s.milesAdded/effKwh : null;
  s.hasRealEff = rawEff!==null && rawEff>=1.5 && rawEff<=4.75;
  s.effKwh = effKwh;
  const estMiles = s.hasRealEff ? s.milesAdded : s.kwh*(gs.mi_per_kwh||3.0);
  s.gasEquiv = estMiles/(gs.mpg||27)*(gs.gas_price||3.26);
  s.saving = s.gasEquiv - s.cost;
  s.bucket = getBucket(s.location);
  const egrid = s.solar ? 0 : getEgridFactor(s.location);
  s.co2GasCould = (estMiles/(VEHICLE_MPG[s.vehicle]||27))*CO2_GAS_KG_PER_GAL;
  s.co2GridEmit = s.kwh*egrid;
  s.co2Avoided = s.co2GasCould - s.co2GridEmit;
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

function fmtUSD(n){ return '$'+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
function esc(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

if(!vehicle){
  // No/invalid vehicle → offer a picker (never inject the raw param into the DOM)
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

  // Mileage: earliest→latest reading for this car
  const mh = (mileageHistory||[]).filter(m=>m.vehicle===veh).slice().sort((a,b)=>a.date.localeCompare(b.date));
  const firstOdo = mh.length?+mh[0].odometer:0, lastOdo = mh.length?+mh[mh.length-1].odometer:0;
  const lastOdoDate = mh.length?mh[mh.length-1].date:null;
  // Lifetime driving efficiency from the sessions that logged FordPass miles.
  // (We show the final odometer as the headline "miles" — a plain fact — rather
  //  than dividing lifetime energy by a partial odometer window or by incomplete
  //  per-session miles, either of which produces a misleading mi/kWh.)
  const _re = ss.filter(s=>s.hasRealEff);
  const _reMi = _re.reduce((a,s)=>a+s.milesAdded,0), _reKw = _re.reduce((a,s)=>a+s.effKwh,0);

  // Ownership span from session dates (fallback to mileage dates)
  const dates = ss.map(s=>s.date).sort();
  const firstDate = dates[0] || (mh[0]&&mh[0].date) || null;
  const lastDate  = dates[dates.length-1] || lastOdoDate || null;
  let monthsOwned = 0;
  if(firstDate && lastDate){ const d0=new Date(firstDate+'T12:00'), d1=new Date(lastDate+'T12:00'); monthsOwned = Math.max(1, Math.round((d1-d0)/2629800000)); }

  // Aggregates
  const totKwh   = ss.reduce((a,s)=>a+s.kwh,0);
  const totCost  = ss.reduce((a,s)=>a+s.cost,0);
  const totSave  = ss.reduce((a,s)=>a+s.saving,0);
  const totCO2   = ss.reduce((a,s)=>a+s.co2Avoided,0);
  const freeKwh  = ss.filter(s=>s.cost<0.005).reduce((a,s)=>a+s.kwh,0);
  const homeKwh  = ss.filter(s=>s.bucket==='Home').reduce((a,s)=>a+s.kwh,0);
  const miPerKwh = _reKw>0 ? _reMi/_reKw : 0;
  const trees    = totCO2/CO2_TREE_KG_PER_YEAR;

  // Favorite spot (most sessions, tie→kWh) + biggest single charge
  const byLoc={}; ss.forEach(s=>{ (byLoc[s.location]=byLoc[s.location]||{n:0,kwh:0}); byLoc[s.location].n++; byLoc[s.location].kwh+=s.kwh; });
  const favEntry = Object.entries(byLoc).sort((a,b)=> b[1].n-a[1].n || b[1].kwh-a[1].kwh)[0];
  const fav = favEntry ? { loc:favEntry[0], n:favEntry[1].n } : null;
  const biggest = ss.slice().sort((a,b)=>b.kwh-a.kwh)[0];

  const gasCar = veh.includes('LRB') ? 'her 2023 Explorer' : 'the gas car it replaced';
  const owner  = veh.includes('LRB') ? "Leah's" : 'your';
  const fmtDate = d => d ? new Date(d+'T12:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '—';

  el.innerHTML = `
    <div class="lb-head">
      <div class="lb-eyebrow">A Look Back</div>
      <div class="lb-title">${esc(veh)}</div>
      <div class="lb-sub">${fmtDate(firstDate)} – ${fmtDate(lastDate)} · ${monthsOwned} month${monthsOwned===1?'':'s'} on the road</div>
    </div>

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
      <div class="lb-card"><span class="lb-k">Free Energy</span><span class="lb-v">${totKwh>0?Math.round(freeKwh/totKwh*100):0}%<small>${Math.round(homeKwh/ (totKwh||1) *100)}% at home</small></span></div>
    </div>

    <div class="lb-row">
      ${fav?`<div class="lb-fact"><span class="lb-k">Favorite Spot</span><b>${esc(fav.loc)}</b> — ${fav.n} session${fav.n===1?'':'s'}, the most of anywhere.</div>`:''}
      ${biggest?`<div class="lb-fact"><span class="lb-k">Biggest Single Charge</span><b>${biggest.kwh.toFixed(1)} kWh</b> at ${esc(biggest.location)} on ${fmtDate(biggest.date)}.</div>`:''}
    </div>

    <p class="lb-close">${Math.round(lastOdo).toLocaleString()} miles on the clock, ${(totKwh/1000).toFixed(1)} MWh charged, and about <b style="color:#2ecc71">${fmtUSD(totSave)}</b> kept out of a gas tank.<br>Thanks for the ride. 🚗⚡</p>

    <p class="lb-foot">Same cost, gas-savings, and CO₂ methodology as the Analytics page. Home cost includes the +10% wall-side uplift; CO₂ vs the ${VEHICLE_MPG[veh]||27} mpg baseline and eGRID regional grid factors.</p>
  `;
}
</script>

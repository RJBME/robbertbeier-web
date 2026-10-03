---
layout: default
title: Fuel History
permalink: /fuel-history/
---

<div class="fuel-wrap">
  <div class="fuel-header">
    <h1>📋 Fuel History <span class="gas-badge">Gas</span></h1>
    <p class="sub">Every logged fill-up, newest first.</p>
  </div>

  <div class="fuel-pagenav">
    <a href="/fuel/">⛽ Dashboard</a>
    <a href="/fuel-history/" class="here">📋 History</a>
    <a href="/fuel-analytics/">📊 Analytics</a>
    <a href="/charging-analytics/" style="opacity:.6">⚡ EV Analytics</a>
  </div>

  <div class="fuel-vfilter" id="fuelVFilter"><span class="lbl">Vehicle</span></div>

  <div id="fuelBody">
    <p class="fuel-note" id="fuelCount" style="margin:0 0 10px"></p>
    <div class="fuel-table-wrap">
      <table class="fuel-table" id="fuelAll">
        <thead><tr>
          <th>Date</th><th>Vehicle</th><th>Odometer</th><th>Miles</th><th>Gallons</th>
          <th>$/gal</th><th>Total</th><th>MPG</th><th>City%</th><th>Station</th>
        </tr></thead>
        <tbody></tbody>
      </table>
    </div>
  </div>

  <div class="fuel-empty" id="fuelEmpty" hidden>
    No fill-ups logged yet. Add one in CloudCannon (the <strong>Fuel-ups</strong> collection) and it'll appear here.
  </div>
</div>

{% include fuel-common.html %}

<script>
(function () {
  const F = window.FUEL;
  if (!F || !F.all.length) { document.getElementById('fuelBody').hidden = true; document.getElementById('fuelEmpty').hidden = false; return; }
  let activeVehicle = 'all';
  const filtered = () => activeVehicle === 'all' ? F.all : F.all.filter(e => e.vehicle === activeVehicle);

  (function buildFilter() {
    const host = document.getElementById('fuelVFilter');
    const mk = (v, label) => { const b = document.createElement('button'); b.className = 'vf-pill' + (v === 'all' ? ' active' : ''); b.textContent = label; b.dataset.v = v;
      b.style.setProperty('--dot', F.vehicleColor(v === 'all' ? null : v));
      b.onclick = () => { activeVehicle = v; document.querySelector('.fuel-wrap').style.setProperty('--ford', F.vehicleColor(v === 'all' ? null : v)); host.querySelectorAll('.vf-pill').forEach(p => p.classList.toggle('active', p.dataset.v === v)); render(); }; host.appendChild(b); };
    mk('all', 'All'); F.vehicles.forEach(v => mk(v, v)); if (F.vehicles.length < 2) host.hidden = true;
  })();

  function render() {
    const list = filtered().slice().reverse();   // newest first
    document.getElementById('fuelCount').textContent = `${list.length} fill-up${list.length === 1 ? '' : 's'}`;
    document.querySelector('#fuelAll tbody').innerHTML = list.map(e => {
      const tags = (e.partial ? ' <span class="tag part">partial</span>' : '') + (e.missed ? ' <span class="tag part">missed-prev</span>' : '');
      return `<tr>
        <td>${e.date}${tags}</td>
        <td>${e.vehicle}</td>
        <td>${e.odometer ? e.odometer.toLocaleString() : '—'}</td>
        <td>${e.milesThisTank ? Math.round(e.milesThisTank).toLocaleString() : '—'}</td>
        <td>${F.fmtNum(e.gallons, 2)}</td>
        <td>${e.ppg ? F.fmtUSD(e.ppg) : '—'}</td>
        <td>${F.fmtUSD(e.totalCost)}</td>
        <td class="mpg-cell">${e.mpg != null ? F.fmtNum(e.mpg, 1) : '—'}</td>
        <td>${e.cityPct >= 0 ? e.cityPct + '%' : '—'}</td>
        <td style="text-align:left">${e.station || e.brand || '—'}</td>
      </tr>`;
    }).join('');
  }
  render();
})();
</script>

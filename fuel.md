---
layout: default
title: Fuel
permalink: /fuel/
---

<div class="fuel-wrap">
  <div class="fuel-header">
    <h1>⛽ Fuel Log <span class="gas-badge">Gas</span></h1>
    <p class="sub">The family gas car — fuel economy and cost at a glance.</p>
  </div>

  <div class="fuel-pagenav">
    <a href="/fuel/" class="here">⛽ Dashboard</a>
    <a href="/fuel-history/">📋 History</a>
    <a href="/fuel-analytics/">📊 Analytics</a>
    <a href="/charging-analytics/" style="opacity:.6">⚡ EV Analytics</a>
  </div>

  <div class="fuel-vfilter" id="fuelVFilter"><span class="lbl">Vehicle</span></div>

  <div id="fuelBody">
    <div class="ev-guilt" id="evGuilt" hidden></div>
    <div class="fuel-kpis" id="fuelKpis"></div>

    <div class="fuel-card">
      <p class="chart-title">MPG over time</p>
      <div class="chart-box short"><canvas id="cMpg"></canvas></div>
    </div>

    <div class="fuel-sec-head"><h2>Recent fill-ups</h2><span class="hint"><a href="/fuel-history/" style="color:var(--ford)">see all →</a></span></div>
    <div class="fuel-table-wrap">
      <table class="fuel-table" id="fuelRecent">
        <thead><tr><th>Date</th><th>Vehicle</th><th>Odometer</th><th>Gallons</th><th>$/gal</th><th>Total</th><th>MPG</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
    <p class="fuel-note">Log a fill-up in CloudCannon → the <strong>Fuel-ups</strong> collection. Enter the odometer every time so MPG stays accurate.</p>
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
  Chart.register(ChartDataLabels);
  Chart.defaults.devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  Chart.defaults.plugins.datalabels = { display: false };
  let chart = null, activeVehicle = 'all';
  const FORD = () => F.vehicleColor(activeVehicle === 'all' ? null : activeVehicle);
  const filtered = () => activeVehicle === 'all' ? F.all : F.all.filter(e => e.vehicle === activeVehicle);

  (function buildFilter() {
    const host = document.getElementById('fuelVFilter');
    const mk = (v, label) => { const b = document.createElement('button'); b.className = 'vf-pill' + (v === 'all' ? ' active' : ''); b.textContent = label; b.dataset.v = v;
      b.style.setProperty('--dot', F.vehicleColor(v === 'all' ? null : v));
      b.onclick = () => { activeVehicle = v; host.querySelectorAll('.vf-pill').forEach(p => p.classList.toggle('active', p.dataset.v === v)); render(); }; host.appendChild(b); };
    mk('all', 'All'); F.vehicles.forEach(v => mk(v, v)); if (F.vehicles.length < 2) host.hidden = true;
  })();

  function render() {
    const list = filtered(); const A = F.aggregate(list);
    document.querySelector('.fuel-wrap').style.setProperty('--ford', FORD());
    // KPIs
    const tiles = [
      { v: A.avgMpg != null ? F.fmtNum(A.avgMpg, 1) : '—', l: 'Avg MPG' },
      { v: A.lastMpg != null ? F.fmtNum(A.lastMpg, 1) : '—', l: 'Last MPG' },
      { v: A.bestMpg != null ? F.fmtNum(A.bestMpg, 1) : '—', l: 'Best MPG' },
      { v: Math.round(A.miles).toLocaleString(), l: 'Miles tracked' },
      { v: F.fmtUSD0(A.cost), l: 'Total spent' },
      { v: A.avgPpg != null ? F.fmtUSD(A.avgPpg) : '—', l: 'Avg $/gal' },
      { v: A.costPerMile != null ? '$' + F.fmtNum(A.costPerMile, 3) : '—', l: 'Cost / mile' },
      { v: A.n, l: 'Fill-ups' },
    ];
    document.getElementById('fuelKpis').innerHTML = tiles.map(t => `<div class="fuel-kpi"><div class="v">${t.v}</div><div class="l">${t.l}</div></div>`).join('');
    // EV guilt
    const el = document.getElementById('evGuilt');
    if (A.miles && A.evSavingsForgone != null) { el.hidden = false;
      el.innerHTML = `🔌 These <strong>${Math.round(A.miles).toLocaleString()} miles</strong> would cost ~<span class="big">${F.fmtUSD0(A.evCost)}</span> as a home-charged EV vs. <strong>${F.fmtUSD0(A.cost)}</strong> in gas — about <strong>${F.fmtUSD0(A.evSavingsForgone)} more</strong>. <a href="/fuel-analytics/" style="color:var(--ford);font-weight:700">details →</a>`;
    } else el.hidden = true;
    // Recent
    const rows = list.slice().reverse().slice(0, 8);
    document.querySelector('#fuelRecent tbody').innerHTML = rows.map(e => `<tr><td>${e.date}${e.partial ? ' <span class="tag part">partial</span>' : ''}</td><td>${e.vehicle}</td><td>${e.odometer ? e.odometer.toLocaleString() : '—'}</td><td>${F.fmtNum(e.gallons, 2)}</td><td>${e.ppg ? F.fmtUSD(e.ppg) : '—'}</td><td>${F.fmtUSD(e.totalCost)}</td><td class="mpg-cell">${e.mpg != null ? F.fmtNum(e.mpg, 1) : '—'}</td></tr>`).join('');
    // MPG chart
    const pts = list.filter(e => e.mpg != null); const ford = FORD(), tc = F.tc(), gc = F.gc();
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('cMpg').getContext('2d'), {
      type: 'line', data: { labels: pts.map(e => e.date), datasets: [{ label: 'MPG', data: pts.map(e => +e.mpg.toFixed(1)), borderColor: ford, backgroundColor: 'rgba(6,111,239,0.10)', borderWidth: 2, tension: 0.3, fill: true, pointRadius: c => c.dataIndex === pts.length - 1 ? 5 : 2.5, pointHoverRadius: 6, pointBackgroundColor: ford, pointBorderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.parsed.y} MPG` } } }, scales: { x: { grid: { display: false }, ticks: { color: tc, maxRotation: 40, minRotation: 30 } }, y: { grid: { color: gc }, ticks: { color: tc, callback: v => v + ' mpg' } } } }
    });
  }
  render();
  new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
</script>

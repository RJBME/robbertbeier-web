---
layout: default
title: Fuel Analytics
permalink: /fuel-analytics/
---

<div class="fuel-wrap">
  <div class="fuel-header">
    <h1>⛽ Fuel Analytics <span class="gas-badge">Gas</span></h1>
    <p class="sub">Every angle on the family gas car's fuel economy, cost, and what it's costing you vs. going electric.</p>
  </div>

  <div class="fuel-pagenav">
    <a href="/fuel/">⛽ Dashboard</a>
    <a href="/fuel-history/">📋 History</a>
    <a href="/fuel-analytics/" class="here">📊 Analytics</a>
    <a href="/charging-analytics/" style="opacity:.6">⚡ EV Analytics</a>
  </div>

  <div class="fuel-vfilter" id="fuelVFilter"><span class="lbl">Vehicle</span></div>

  <div id="fuelBody">
    <div class="ev-guilt" id="evGuilt" hidden></div>

    <div class="fuel-kpis" id="fuelKpis"></div>

    <div class="fuel-sec-head"><h2>Fuel economy</h2><span class="hint">miles per gallon, per full tank</span></div>
    <div class="fuel-card">
      <p class="chart-title">MPG over time</p>
      <p class="chart-sub">Each point is a full fill-up; dashed line is the running average.</p>
      <div class="chart-box"><canvas id="cMpg"></canvas></div>
    </div>
    <div class="fuel-card">
      <p class="chart-title">City driving % vs. MPG</p>
      <p class="chart-sub">Does more city driving drag economy down? (only tanks with a city-% logged)</p>
      <div class="chart-box short"><canvas id="cCity"></canvas></div>
    </div>

    <div class="fuel-sec-head"><h2>What you're paying</h2><span class="hint">pump price &amp; cost</span></div>
    <div class="fuel-card">
      <p class="chart-title">Price per gallon — what you paid vs. the Detroit market</p>
      <p class="chart-sub">Your fill-ups against the monthly market average already tracked on the EV side.</p>
      <div class="chart-box"><canvas id="cPpg"></canvas></div>
    </div>
    <div class="fuel-card">
      <p class="chart-title">Monthly fuel spend</p>
      <div class="chart-box short"><canvas id="cMonthCost"></canvas></div>
    </div>
    <div class="fuel-card">
      <p class="chart-title">Cumulative spend — gas vs. the EV you didn't buy</p>
      <p class="chart-sub">Running total of what you've spent on gas, and what the same miles would've cost charged at home.</p>
      <div class="chart-box"><canvas id="cCumulative"></canvas></div>
    </div>
    <div class="fuel-card">
      <p class="chart-title">Cost per mile</p>
      <p class="chart-sub">Fuel cost ÷ miles, per full tank.</p>
      <div class="chart-box short"><canvas id="cCpm"></canvas></div>
    </div>

    <div class="fuel-sec-head"><h2>Consumption &amp; footprint</h2></div>
    <div class="fuel-card">
      <p class="chart-title">Gallons burned per month</p>
      <div class="chart-box short"><canvas id="cGal"></canvas></div>
    </div>
    <div class="fuel-card">
      <p class="chart-title">CO₂ emitted per month</p>
      <p class="chart-sub">Tailpipe CO₂ from fuel burned (8.887 kg per gallon).</p>
      <div class="chart-box short"><canvas id="cCo2"></canvas></div>
    </div>

    <div class="fuel-sec-head"><h2>Records</h2></div>
    <div class="fuel-kpis" id="fuelRecords"></div>

    <div class="fuel-sec-head"><h2>Recent fill-ups</h2><span class="hint">latest 12</span></div>
    <div class="fuel-table-wrap">
      <table class="fuel-table" id="fuelRecent">
        <thead><tr><th>Date</th><th>Vehicle</th><th>Odometer</th><th>Gallons</th><th>$/gal</th><th>Total</th><th>MPG</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>

    <p class="fuel-note" id="fuelMethod"></p>
  </div>

  <div class="fuel-empty" id="fuelEmpty" hidden>
    No fill-ups logged yet. Add one in CloudCannon (the <strong>Fuel-ups</strong> collection) and it'll appear here.
  </div>
</div>

{% include fuel-common.html %}

<script>
(function () {
  const F = window.FUEL;
  if (!F || !F.all.length) {
    document.getElementById('fuelBody').hidden = true;
    document.getElementById('fuelEmpty').hidden = false;
    return;
  }
  Chart.register(ChartDataLabels);
  Chart.defaults.devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  Chart.defaults.plugins.datalabels = { display: false };
  Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  const charts = {};
  let activeVehicle = 'all';
  const FORD = () => F.vehicleColor(activeVehicle === 'all' ? null : activeVehicle);

  function filtered() {
    return activeVehicle === 'all' ? F.all : F.all.filter(e => e.vehicle === activeVehicle);
  }

  // ── Vehicle filter pills ──
  (function buildFilter() {
    const host = document.getElementById('fuelVFilter');
    const mk = (v, label) => {
      const b = document.createElement('button');
      b.className = 'vf-pill' + (v === 'all' ? ' active' : '');
      b.textContent = label; b.dataset.v = v;
      b.style.setProperty('--dot', F.vehicleColor(v === 'all' ? null : v));
      b.onclick = () => { activeVehicle = v; host.querySelectorAll('.vf-pill').forEach(p => p.classList.toggle('active', p.dataset.v === v)); render(); };
      host.appendChild(b);
    };
    mk('all', 'All');
    F.vehicles.forEach(v => mk(v, v));
    if (F.vehicles.length < 2) host.hidden = true;   // only one car → no need for a filter
  })();

  function mkChart(id, cfg) {
    const el = document.getElementById(id); if (!el) return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(el.getContext('2d'), cfg);
  }

  function monthKeys(list) {
    const s = new Set(list.map(e => e.month).filter(Boolean));
    return [...s].sort();
  }
  const prettyMonth = m => { const [y, mo] = m.split('-'); return new Date(+y, +mo - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }); };

  function renderKpis(A) {
    const host = document.getElementById('fuelKpis');
    const tiles = [
      { v: Math.round(A.miles).toLocaleString(), l: 'Miles tracked' },
      { v: A.avgMpg != null ? F.fmtNum(A.avgMpg, 1) : '—', l: 'Avg MPG', d: A.lastMpg != null ? 'last ' + F.fmtNum(A.lastMpg, 1) : '' },
      { v: A.bestMpg != null ? F.fmtNum(A.bestMpg, 1) : '—', l: 'Best MPG' },
      { v: F.fmtUSD0(A.cost), l: 'Total fuel cost' },
      { v: F.fmtNum(A.gallons, 1), l: 'Total gallons' },
      { v: A.avgPpg != null ? F.fmtUSD(A.avgPpg) : '—', l: 'Avg $/gal' },
      { v: A.costPerMile != null ? '$' + F.fmtNum(A.costPerMile, 3) : '—', l: 'Cost / mile' },
      { v: A.n, l: 'Fill-ups', d: A.avgFillCost != null ? F.fmtUSD(A.avgFillCost) + ' avg' : '' },
    ];
    host.innerHTML = tiles.map(t => `<div class="fuel-kpi"><div class="v">${t.v}</div><div class="l">${t.l}</div>${t.d ? `<div class="d">${t.d}</div>` : ''}</div>`).join('');
  }

  function renderEvGuilt(A) {
    const el = document.getElementById('evGuilt');
    if (!A.miles || A.evSavingsForgone == null) { el.hidden = true; return; }
    const mult = A.evCost > 0 ? (A.cost / A.evCost) : null;
    el.hidden = false;
    el.innerHTML =
      `🔌 <strong>If this were a home-charged EV:</strong> the same <strong>${Math.round(A.miles).toLocaleString()} miles</strong> ` +
      `would cost about <span class="big">${F.fmtUSD0(A.evCost)}</span> in electricity ` +
      `(≈$${F.fmtNum(A.evPerMile, 3)}/mi) — vs. the <strong>${F.fmtUSD0(A.cost)}</strong> you spent on gas ` +
      `(≈$${F.fmtNum(A.costPerMile, 3)}/mi). That's about <strong>${F.fmtUSD0(A.evSavingsForgone)} more</strong>` +
      (mult ? ` (${F.fmtNum(mult, 1)}× the cost)` : '') + `. <span style="opacity:.75">Energy only — excludes the EV's purchase premium.</span>`;
  }

  function renderRecords(list) {
    const host = document.getElementById('fuelRecords');
    const withMpg = list.filter(e => e.mpg != null);
    const best = withMpg.length ? withMpg.reduce((a, b) => b.mpg > a.mpg ? b : a) : null;
    const worst = withMpg.length ? withMpg.reduce((a, b) => b.mpg < a.mpg ? b : a) : null;
    const priciest = list.reduce((a, b) => b.totalCost > a.totalCost ? b : a, list[0]);
    const cheapPpg = list.filter(e => e.ppg > 0);
    const lowPpg = cheapPpg.length ? cheapPpg.reduce((a, b) => b.ppg < a.ppg ? b : a) : null;
    const longest = withMpg.length ? withMpg.reduce((a, b) => (b.milesThisTank || 0) > (a.milesThisTank || 0) ? b : a) : null;
    const tiles = [
      best ? { v: F.fmtNum(best.mpg, 1), l: 'Best tank (MPG)', d: best.date } : null,
      worst ? { v: F.fmtNum(worst.mpg, 1), l: 'Worst tank (MPG)', d: worst.date } : null,
      longest ? { v: Math.round(longest.milesThisTank).toLocaleString(), l: 'Longest range (mi)', d: longest.date } : null,
      { v: F.fmtUSD(priciest.totalCost), l: 'Priciest fill-up', d: priciest.date },
      lowPpg ? { v: F.fmtUSD(lowPpg.ppg), l: 'Cheapest $/gal', d: lowPpg.date } : null,
    ].filter(Boolean);
    host.innerHTML = tiles.map(t => `<div class="fuel-kpi"><div class="v">${t.v}</div><div class="l">${t.l}</div><div class="d">${t.d}</div></div>`).join('');
  }

  function renderRecent(list) {
    const rows = list.slice().reverse().slice(0, 12);
    const body = document.querySelector('#fuelRecent tbody');
    body.innerHTML = rows.map(e => {
      const tag = e.partial ? '<span class="tag part">partial</span>' : '';
      return `<tr>
        <td>${e.date} ${tag}</td>
        <td>${e.vehicle}</td>
        <td>${e.odometer ? e.odometer.toLocaleString() : '—'}</td>
        <td>${F.fmtNum(e.gallons, 2)}</td>
        <td>${e.ppg ? F.fmtUSD(e.ppg) : '—'}</td>
        <td>${F.fmtUSD(e.totalCost)}</td>
        <td class="mpg-cell">${e.mpg != null ? F.fmtNum(e.mpg, 1) : '—'}</td>
      </tr>`;
    }).join('');
  }

  function renderCharts(list) {
    const tc = F.tc(), gc = F.gc(), ford = FORD();
    const mpgPts = list.filter(e => e.mpg != null);

    // MPG over time + running average
    let run = 0; const runAvg = mpgPts.map((e, i) => { run += e.mpg; return +(run / (i + 1)).toFixed(1); });
    mkChart('cMpg', {
      type: 'line',
      data: { labels: mpgPts.map(e => e.date), datasets: [
        { label: 'MPG', data: mpgPts.map(e => +e.mpg.toFixed(1)), borderColor: ford, backgroundColor: 'rgba(6,111,239,0.10)', borderWidth: 2, tension: 0.3, fill: true,
          pointRadius: c => c.dataIndex === mpgPts.length - 1 ? 5 : 2.5, pointHoverRadius: 6, pointBackgroundColor: ford, pointBorderWidth: 0 },
        { label: 'Running avg', data: runAvg, borderColor: '#f39c12', borderWidth: 1.5, borderDash: [5, 4], tension: 0.3, pointRadius: 0, fill: false },
      ]},
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: tc } }, tooltip: { callbacks: { label: c => ` ${c.parsed.y} MPG` } } },
        scales: { x: { grid: { display: false }, ticks: { color: tc, maxRotation: 40, minRotation: 30 } }, y: { grid: { color: gc }, ticks: { color: tc, callback: v => v + ' mpg' } } } }
    });

    // City % vs MPG scatter
    const cityPts = list.filter(e => e.mpg != null && e.cityPct >= 0).map(e => ({ x: e.cityPct, y: +e.mpg.toFixed(1) }));
    mkChart('cCity', {
      type: 'scatter',
      data: { datasets: [{ label: 'tank', data: cityPts, backgroundColor: ford, pointRadius: 5, pointHoverRadius: 7 }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.parsed.y} MPG @ ${c.parsed.x}% city` } } },
        scales: { x: { min: 0, max: 100, grid: { color: gc }, ticks: { color: tc, callback: v => v + '%' }, title: { display: true, text: '% city driving', color: '#888' } },
                  y: { grid: { color: gc }, ticks: { color: tc, callback: v => v + ' mpg' } } } }
    });

    // $/gal paid vs market
    const paid = list.filter(e => e.ppg > 0);
    mkChart('cPpg', {
      type: 'line',
      data: { labels: paid.map(e => e.date), datasets: [
        { label: 'You paid', data: paid.map(e => +e.ppg.toFixed(2)), borderColor: ford, backgroundColor: 'rgba(6,111,239,0.08)', borderWidth: 2, tension: 0.3, fill: true, pointRadius: 3, pointBackgroundColor: ford, pointBorderWidth: 0 },
        { label: 'Detroit market avg', data: paid.map(e => +F.marketGas(e.date).toFixed(2)), borderColor: '#f39c12', borderWidth: 1.5, borderDash: [5, 4], tension: 0.3, pointRadius: 0 },
      ]},
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: tc } }, tooltip: { callbacks: { label: c => ` $${c.parsed.y.toFixed(2)}/gal` } } },
        scales: { x: { grid: { display: false }, ticks: { color: tc, maxRotation: 40, minRotation: 30 } }, y: { grid: { color: gc }, ticks: { color: tc, callback: v => '$' + v.toFixed(2) } } } }
    });

    // Monthly spend / gallons / CO2
    const mk = monthKeys(list);
    const byMonth = f => mk.map(m => +list.filter(e => e.month === m).reduce((s, e) => s + f(e), 0).toFixed(2));
    const barOpts = (fmt) => ({ responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + fmt(c.parsed.y) } } },
      scales: { x: { grid: { display: false }, ticks: { color: tc } }, y: { grid: { color: gc }, ticks: { color: tc } } } });
    mkChart('cMonthCost', { type: 'bar', data: { labels: mk.map(prettyMonth), datasets: [{ data: byMonth(e => e.totalCost), backgroundColor: ford, borderRadius: 5 }] }, options: barOpts(v => '$' + v.toFixed(0)) });
    mkChart('cGal', { type: 'bar', data: { labels: mk.map(prettyMonth), datasets: [{ data: byMonth(e => e.gallons), backgroundColor: '#8e44ad', borderRadius: 5 }] }, options: barOpts(v => v.toFixed(1) + ' gal') });
    mkChart('cCo2', { type: 'bar', data: { labels: mk.map(prettyMonth), datasets: [{ data: byMonth(e => e.co2), backgroundColor: '#6b7280', borderRadius: 5 }] }, options: barOpts(v => v.toFixed(0) + ' kg') });

    // Cumulative gas vs EV-equivalent
    let cg = 0, ce = 0; const cumL = [], cumG = [], cumE = [];
    list.forEach(e => { cg += e.totalCost; ce += (e.milesThisTank ? e.milesThisTank * F.evRatePerMile(e.date) : 0); cumL.push(e.date); cumG.push(+cg.toFixed(2)); cumE.push(+ce.toFixed(2)); });
    mkChart('cCumulative', {
      type: 'line',
      data: { labels: cumL, datasets: [
        { label: 'Gas spent', data: cumG, borderColor: ford, backgroundColor: 'rgba(6,111,239,0.10)', borderWidth: 2.5, tension: 0.25, fill: true, pointRadius: 0 },
        { label: 'EV-equivalent (home)', data: cumE, borderColor: '#2ecc71', backgroundColor: 'rgba(46,204,113,0.10)', borderWidth: 2, tension: 0.25, fill: true, pointRadius: 0 },
      ]},
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: tc } }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: $${c.parsed.y.toFixed(0)}` } } },
        scales: { x: { grid: { display: false }, ticks: { color: tc, maxRotation: 40, minRotation: 30 } }, y: { grid: { color: gc }, ticks: { color: tc, callback: v => '$' + v.toLocaleString() } } } }
    });

    // Cost per mile per tank
    const cpm = mpgPts.filter(e => e.gallonsThisTank && e.milesThisTank);
    mkChart('cCpm', {
      type: 'line',
      data: { labels: cpm.map(e => e.date), datasets: [{ label: '$/mi', data: cpm.map(e => +(((e.gallonsThisTank * e.ppg) || (e.totalCost)) / e.milesThisTank).toFixed(3)), borderColor: ford, backgroundColor: 'rgba(6,111,239,0.08)', borderWidth: 2, tension: 0.3, fill: true, pointRadius: 2.5, pointBackgroundColor: ford, pointBorderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' $' + c.parsed.y.toFixed(3) + '/mi' } } },
        scales: { x: { grid: { display: false }, ticks: { color: tc, maxRotation: 40, minRotation: 30 } }, y: { grid: { color: gc }, ticks: { color: tc, callback: v => '$' + v.toFixed(2) } } } }
    });
  }

  function render() {
    const list = filtered();
    const A = F.aggregate(list);
    document.querySelector('.fuel-wrap').style.setProperty('--ford', FORD());   // recolor KPIs/section bars to the active car
    renderEvGuilt(A);
    renderKpis(A);
    renderRecords(list);
    renderRecent(list);
    renderCharts(list);
    const span = list.length ? `${list[0].date} → ${list[list.length - 1].date}` : '';
    document.getElementById('fuelMethod').textContent =
      `Methodology: MPG is computed full-tank to full-tank (partial fill-ups accumulate; a "missed fill-up" breaks the chain). ` +
      `Miles tracked = odometer span. EV-equivalent uses home electricity rate ÷ mi-per-kWh × (1 + wall-loss uplift) from the EV site's rate tables, energy only. Data ${span}.`;
  }

  render();
  // Re-render on dark-mode toggle so chart colors follow the theme
  new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
</script>

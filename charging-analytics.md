---
layout: default
title: EV Analytics
permalink: /charging-analytics/
---
{% assign sorted_sessions = site.charging | sort: "date" %}

<style>
  /* ── Page-level overrides ── */
  body { max-width: 1100px !important; }

  .analytics-container {
    font-family: -apple-system, sans-serif;
    max-width: 1060px;
    margin: auto;
    color: var(--text);
  }

  /* ── Back link ── */
  .back-link {
    display: inline-flex; align-items: center; gap: 6px;
    color: #888; font-size: 0.8rem; text-decoration: none;
    font-weight: 600; margin-bottom: 18px;
  }
  .back-link:hover { color: var(--link); }

  /* ── Page header ── */
  .analytics-header { margin-bottom: 22px; }
  .analytics-header h1 { font-size: 1.85rem; margin: 0 0 4px 0; }
  .analytics-header p  { color: #888; font-size: 0.85rem; margin: 0; }

  /* ── Section quick-nav pills ── */
  .section-nav { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
  .section-nav a {
    background: var(--dash-card); border: 1px solid var(--dash-border);
    padding: 6px 14px; border-radius: 20px; font-size: 0.76rem;
    color: var(--link); text-decoration: none; font-weight: 600;
    transition: all 0.15s;
  }
  .section-nav a:hover { background: var(--link); color: #fff; border-color: var(--link); }

  /* ── KPI strip ── */
  .kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px; margin-bottom: 28px;
  }
  @media (max-width: 767px) { .kpi-strip { grid-template-columns: repeat(4, 1fr); } }
  @media (max-width: 520px)  { .kpi-strip { grid-template-columns: repeat(2, 1fr); } }
  .kpi-card {
    background: var(--dash-card); border: 1px solid var(--dash-border);
    border-radius: 12px; padding: 18px 16px; text-align: center;
    display: flex; flex-direction: column; justify-content: center; gap: 4px;
  }
  .kpi-label {
    font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.08em;
    color: #888; display: block; line-height: 1.3;
  }
  .kpi-value {
    font-size: 1.5rem; font-weight: 900; display: block;
    line-height: 1.1; white-space: nowrap;
  }

  /* ── Section headers ── */
  .section-header {
    margin: 36px 0 16px; display: flex; align-items: baseline; gap: 12px;
    border-bottom: 2px solid var(--dash-border); padding-bottom: 8px;
  }
  .section-header h2 { margin: 0; font-size: 1.05rem; }
  .section-header span { font-size: 0.75rem; color: #888; }

  /* ── Chart grids ── */
  .chart-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; }
  .chart-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; margin-bottom: 18px; }
  .chart-full  { margin-bottom: 18px; }

  /* ── Chart card ── */
  .chart-card {
    background: var(--dash-card); border: 1px solid var(--dash-border);
    border-radius: 12px; padding: 18px 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  .chart-title {
    font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.07em; color: #888; margin: 0 0 14px 0;
  }
  .chart-wrap { position: relative; }

  /* ── Top sessions table ── */
  .top-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; color: var(--text); }
  .top-table th {
    text-align: left; padding: 7px 10px; background: var(--table-head);
    border-bottom: 2px solid var(--dash-border); font-size: 0.68rem;
    text-transform: uppercase; letter-spacing: 0.05em; color: #888;
  }
  .top-table td { padding: 7px 10px; border-bottom: 1px solid var(--dash-border); }
  .top-table tr:last-child td { border-bottom: none; }

  /* ── Badges (same as dashboard) ── */
  .badge { padding: 3px 9px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; display: inline-block; }
  .badge-work   { background: #e3f2fd; color: #0288d1; }
  .badge-home   { background: #f3e5f5; color: #7b1fa2; }
  .badge-tesla  { background: #ffebee; color: #CC0000; }
  .badge-cp     { background: #fff3e0; color: #FF7A14; }
  .badge-blink  { background: #e8f5e9; color: #65A844; }
  .badge-rivian { background: #fffde7; color: #ffa500; }
  .badge-other  { background: #f5f5f5; color: #616161; }

  /* ── Insight callout ── */
  .insight-row { display: flex; gap: 14px; margin-bottom: 18px; flex-wrap: wrap; }
  .insight-chip {
    background: var(--dash-card); border: 1px solid var(--dash-border);
    border-radius: 8px; padding: 10px 14px; font-size: 0.78rem;
    flex: 1 1 180px;
  }
  .insight-chip strong { color: var(--link); }

  /* ── Vehicle filter pills ── */
  #vehicleFilterBtns {
    display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;
  }
  .vf-btn {
    background: var(--dash-card); border: 1px solid var(--dash-border);
    padding: 5px 14px; border-radius: 20px; font-size: 0.76rem;
    color: var(--text); cursor: pointer; font-weight: 600;
    font-family: inherit; transition: all 0.15s; white-space: nowrap;
  }
  .vf-btn:hover { border-color: var(--link); color: var(--link); }
  .vf-btn.active { background: var(--link); color: #fff; border-color: var(--link); }

  /* ── Sticky vehicle filter bar ── */
  #vehicleFilterSticky {
    display: none; /* JS shows this when scrolled past page header */
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 500;
    background: var(--bg);
    border-bottom: 2px solid var(--dash-border);
    box-shadow: 0 3px 16px rgba(0,0,0,0.12);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transform: translateY(-110%);
    transition: transform 0.22s ease;
    flex-direction: column;
    gap: 0;
  }
  #vehicleFilterSticky.visible { transform: translateY(0); }
  #stickyNavRow {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 6px 20px 5px;
    border-bottom: 1px solid var(--dash-border);
    background: rgba(0,0,0,0.03);
  }
  #stickyNavRow a {
    font-size: 0.68rem; font-weight: 600; color: var(--link);
    text-decoration: none; padding: 3px 10px;
    border-radius: 12px; border: 1px solid transparent;
    transition: all 0.12s; white-space: nowrap;
  }
  #stickyNavRow a:hover { background: var(--link); color: #fff; border-color: var(--link); }
  #stickyVehicleRow {
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
    padding: 6px 20px 7px;
  }
  #vehicleFilterSticky .vf-sticky-label {
    font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.12em;
    color: #888; margin-right: 4px; white-space: nowrap;
  }

  /* ── Back-to-top pill ── */
  .back-top-pill {
    margin-left: auto;
    font-size: 0.68rem;
    color: #888;
    text-decoration: none;
    font-weight: 600;
    padding: 3px 9px;
    border: 1px solid var(--dash-border);
    border-radius: 20px;
    transition: all 0.15s;
    white-space: nowrap;
    align-self: center;
  }
  .back-top-pill:hover { color: var(--link); border-color: var(--link); }

  /* ── Responsive ── */
  @media (max-width: 767px) {
    .chart-grid-2, .chart-grid-3 { grid-template-columns: 1fr; }
    .section-nav a { padding: 5px 10px; font-size: 0.72rem; }
    .chart-card { padding: 12px 14px; }
  }

  /* ── Personal records ── */
  .records-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px; margin-bottom: 18px;
  }
  @media (max-width: 767px) { .records-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 420px) { .records-grid { grid-template-columns: 1fr; } }
  .record-card {
    background: var(--dash-card); border: 1px solid var(--dash-border);
    border-radius: 12px; padding: 20px 18px;
    display: flex; flex-direction: column; gap: 6px;
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .record-card:hover { border-color: var(--link); box-shadow: 0 4px 16px rgba(93,63,211,0.12); }
  .record-icon  { font-size: 1.6rem; line-height: 1; }
  .record-label { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-top: 2px; }
  .record-value { font-size: 1.6rem; font-weight: 900; color: var(--link); line-height: 1.1; }
  .record-sub   { font-size: 0.75rem; color: #888; margin-top: 2px; }

  /* ── Location stats table ── */
  .loc-sort-hdr { cursor: pointer; user-select: none; white-space: nowrap; }
  .loc-sort-hdr:hover { color: var(--link); }
  .loc-sort-active { color: var(--link); }
  .loc-view-btn {
    background: var(--dash-card); border: 1px solid var(--dash-border);
    padding: 4px 12px; border-radius: 16px; font-size: 0.72rem; font-weight: 600;
    color: var(--text); cursor: pointer; transition: all 0.15s;
  }
  .loc-view-btn:hover { border-color: var(--link); color: var(--link); }
  .loc-view-active { background: var(--link) !important; color: #fff !important; border-color: var(--link) !important; }

  /* ── Heatmap ── */
  .heatmap-scroll { overflow-x: auto; padding-bottom: 4px; }

  /* ── Break-even hero ── */
  #breakevenHero { border-top: 3px solid #2ecc71; border-radius: 0 0 12px 12px; }

  /* ── Road trip cards ── */
  .trip-card { transition: box-shadow 0.2s; }
  .trip-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }

  /* ── Charging locations map ── */
  .ev-map-icon { background: transparent !important; border: none !important; overflow: visible !important; }
  .ev-pulse { position: relative; overflow: visible; }
  .ev-dot { position: absolute; inset: 0; border-radius: 50%; opacity: 0.35; box-shadow: 0 2px 8px rgba(0,0,0,0.18); }
  .ev-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid; opacity: 0.55; animation: ev-pulse 2.2s ease-out infinite; }
  .ev-pin { position: absolute; bottom: 50%; left: 50%; transform: translateX(-50%); filter: drop-shadow(0 1px 3px rgba(0,0,0,0.4)); pointer-events: none; }
  @keyframes ev-pulse { 0% { transform: scale(1); opacity: 0.75; } 100% { transform: scale(2.8); opacity: 0; } }
  #chargingMap { border-radius: 10px; }
  #chargingMap .leaflet-popup-content-wrapper { background: var(--dash-card,#fff); color: var(--text,#333); border: 1px solid var(--dash-border,#ddd); box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
  #chargingMap .leaflet-popup-tip { background: var(--dash-card,#fff); }
</style>

<div class="analytics-container" id="top">

  <a href="/charging/" class="back-link">← Charging Dashboard</a>

  <div class="analytics-header">
    <h1>⚡ EV Analytics</h1>
    <p>Data nerd's paradise — every angle on your charging data</p>
  </div>

  <div class="section-nav">
    <a href="#records">Records</a>
    <a href="#heatmap">Heatmap</a>
    <a href="#monthly">Monthly</a>
    <a href="#sources">Sources</a>
    <a href="#economics">Economics</a>
    <a href="#trends">Trends</a>
    <a href="#sessions">Session Dive</a>
    <a href="#seasonal">Season/Year</a>
    <a href="#economics2">Break-Even</a>
    <a href="#roadtrips">Road Trips</a>
    <a href="#sessiondetail" id="navSessionDetail">Detail</a>
    <a href="#efficiency" id="navEfficiency">Efficiency</a>
    <a href="#vehiclecomp" id="navVehicleComp" style="display:none">Vehicles</a>
    <a href="#map">Map</a>
  </div>

  <!-- Sticky bar: section nav on top row, vehicle filter on bottom row -->
  <div id="vehicleFilterSticky">
    <div id="stickyNavRow">
      <a href="#records">Records</a>
      <a href="#heatmap">Heatmap</a>
      <a href="#monthly">Monthly</a>
      <a href="#sources">Sources</a>
      <a href="#economics">Economics</a>
      <a href="#trends">Trends</a>
      <a href="#sessions">Sessions</a>
      <a href="#seasonal">Season/Year</a>
      <a href="#economics2">Break-Even</a>
      <a href="#roadtrips">Road Trips</a>
      <a href="#sessiondetail" id="stickyNavDetail">Detail</a>
      <a href="#efficiency" id="stickyNavEff">Efficiency</a>
      <a href="#vehiclecomp" id="stickyNavVehicle" style="display:none">Vehicles</a>
      <a href="#map">Map</a>
    </div>
    <div id="stickyVehicleRow">
      <span class="vf-sticky-label">Vehicle</span>
    </div>
  </div>

  <div id="vehicleFilterBtns" style="display:none"></div>

  <!-- KPI Strip — populated by JS -->
  <div class="kpi-strip">
    <div class="kpi-card"><span class="kpi-label">Total Energy</span><span class="kpi-value" id="kpi-kwh">—</span></div>
    <div class="kpi-card"><span class="kpi-label">Total Cost</span><span class="kpi-value" id="kpi-cost">—</span></div>
    <div class="kpi-card"><span class="kpi-label">Gas Savings</span><span class="kpi-value" id="kpi-savings" style="color:#2ecc71">—</span></div>
    <div class="kpi-card"><span class="kpi-label">Free Energy</span><span class="kpi-value" id="kpi-free" style="color:#2ecc71">—</span></div>
    <div class="kpi-card"><span class="kpi-label">Sessions</span><span class="kpi-value" id="kpi-sessions">—</span></div>
    <div class="kpi-card"><span class="kpi-label">Avg ¢/kWh</span><span class="kpi-value" id="kpi-cpkwh">—</span></div>
    <div class="kpi-card"><span class="kpi-label">Avg kWh/Session</span><span class="kpi-value" id="kpi-avg-session">—</span></div>
    <div class="kpi-card"><span class="kpi-label">Months Active</span><span class="kpi-value" id="kpi-months">—</span></div>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  PERSONAL RECORDS                                  -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div class="section-header" id="records">
    <h2>Personal Records</h2>
    <span>your all-time bests</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <div class="records-grid" id="recordsGrid"></div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  YEAR AT A GLANCE HEATMAP                          -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div class="section-header" id="heatmap">
    <h2>Year at a Glance</h2>
    <span>every charging day since day one</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <div class="chart-card chart-full">
    <p class="chart-title">Charging Activity Heatmap — kWh per day</p>
    <div class="heatmap-scroll">
      <div id="heatmapContainer"></div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 1: MONTHLY BREAKDOWN                      -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div class="section-header" id="monthly">
    <h2>Monthly Breakdown</h2>
    <span>energy, cost &amp; sessions over time</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <div class="chart-full chart-card">
    <p class="chart-title">Monthly kWh by Charging Source</p>
    <div class="chart-wrap" style="height:300px">
      <canvas id="chartMonthlyKwh"></canvas>
    </div>
  </div>

  <div class="chart-grid-2" style="margin-top:18px">
    <div class="chart-card">
      <p class="chart-title">Sessions per Month</p>
      <div class="chart-wrap" style="height:230px">
        <canvas id="chartMonthlySessions"></canvas>
      </div>
    </div>
    <div class="chart-card">
      <p class="chart-title">Free vs. Paid kWh per Month</p>
      <div class="chart-wrap" style="height:230px">
        <canvas id="chartFreeVsPaid"></canvas>
      </div>
    </div>
  </div>

  <div class="chart-grid-2" style="margin-top:18px">
    <div class="chart-card">
      <p class="chart-title">Free vs. Paid Sessions per Month — count</p>
      <div class="chart-wrap" style="height:230px">
        <canvas id="chartFreeVsPaidSessions"></canvas>
      </div>
    </div>
    <div class="chart-card">
      <p class="chart-title">Monthly Savings vs. Gas (†)</p>
      <div class="chart-wrap" style="height:230px">
        <canvas id="chartMonthlySavings"></canvas>
      </div>
    </div>
  </div>

  <div class="chart-full chart-card" style="margin-top:18px">
    <p class="chart-title">Monthly Cost vs. Gas Equivalent — what you spent vs. what a gas car would have cost</p>
    <div class="chart-wrap" style="height:280px">
      <canvas id="chartMonthlyCostVsGas"></canvas>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 2: CHARGING SOURCES                       -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div class="section-header" id="sources">
    <h2>Charging Sources</h2>
    <span>where you plug in</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <div class="chart-grid-2">
    <div class="chart-card">
      <p class="chart-title">All-Time Energy by Location</p>
      <div class="chart-wrap" style="height:280px">
        <canvas id="chartLocationDonut"></canvas>
      </div>
    </div>
    <div class="chart-card">
      <p class="chart-title">kWh by Location (Ranked)</p>
      <div class="chart-wrap" style="height:280px">
        <canvas id="chartLocationBar"></canvas>
      </div>
    </div>
  </div>

  <div class="chart-full chart-card" style="margin-top:18px">
    <p class="chart-title">Monthly kWh Split — Work (free) vs. Home vs. Public</p>
    <div class="chart-wrap" style="height:260px">
      <canvas id="chartMonthlySourceSplit"></canvas>
    </div>
  </div>

  <div class="chart-full chart-card" style="margin-top:18px">
    <div style="display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:10px">
      <p class="chart-title" style="margin:0">Location Stats — sessions, energy &amp; cost per charging site</p>
      <div style="display:flex;gap:6px;margin-left:auto;flex-wrap:wrap" id="locViewBtns">
        <button onclick="setLocView('location')" class="loc-view-btn loc-view-active" data-view="location">By Location</button>
        <button onclick="setLocView('provider')" class="loc-view-btn" data-view="provider">By Provider</button>
      </div>
    </div>
    <!-- Legend -->
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
      <span class="badge badge-work">Work</span>
      <span class="badge badge-home">Home</span>
      <span class="badge badge-tesla">Tesla SC</span>
      <span class="badge badge-cp">ChargePoint</span>
      <span class="badge badge-blink">Blink</span>
      <span class="badge badge-rivian">Rivian</span>
      <span class="badge badge-other">Other</span>
    </div>
    <div style="overflow-x:auto">
      <table class="top-table loc-sort-table" id="locationStatsTable">
        <thead>
          <tr>
            <th data-col="#" style="cursor:default">#</th>
            <th data-col="name"     data-label="Location"  class="loc-sort-hdr loc-sort-active">Location ▲</th>
            <th data-col="sessions" data-label="Sessions"  class="loc-sort-hdr" style="text-align:center">Sessions</th>
            <th data-col="free"     data-label="Free"      class="loc-sort-hdr" style="text-align:center">Free</th>
            <th data-col="kwh"      data-label="Total kWh" class="loc-sort-hdr" style="text-align:right">Total kWh</th>
            <th data-col="avgKwh"   data-label="Avg kWh"   class="loc-sort-hdr" style="text-align:right">Avg kWh</th>
            <th data-col="cost"     data-label="Total Cost" class="loc-sort-hdr" style="text-align:right">Total Cost</th>
            <th data-col="avgCost"  data-label="Avg Cost"  class="loc-sort-hdr" style="text-align:right">Avg Cost</th>
          </tr>
        </thead>
        <tbody id="locationStatsBody"></tbody>
      </table>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 3: ECONOMICS                              -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div class="section-header" id="economics">
    <h2>Economics</h2>
    <span>rates, costs &amp; cumulative savings</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <div class="chart-grid-2">
    <div class="chart-card">
      <p class="chart-title">Gas Price History ($/gal)</p>
      <div class="chart-wrap" style="height:230px">
        <canvas id="chartGasPrice"></canvas>
      </div>
    </div>
    <div class="chart-card">
      <p class="chart-title">Home Electricity Rate (¢/kWh)</p>
      <div class="chart-wrap" style="height:230px">
        <canvas id="chartElecRate"></canvas>
      </div>
    </div>
  </div>

  <div class="chart-full chart-card" style="margin-top:18px">
    <p class="chart-title">Cumulative Cost vs. Gas Equivalent — the growing savings gap</p>
    <div class="chart-wrap" style="height:280px">
      <canvas id="chartCumulative"></canvas>
    </div>
  </div>

  <div class="chart-full chart-card" style="margin-top:18px">
    <p class="chart-title">Net Cumulative Savings Over Time</p>
    <div class="chart-wrap" style="height:220px">
      <canvas id="chartNetSavings"></canvas>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 4: TRENDS                                 -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div class="section-header" id="trends">
    <h2>Trends</h2>
    <span>patterns over time</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <div class="chart-grid-2">
    <div class="chart-card">
      <p class="chart-title">Effective ¢/kWh Paid — monthly average (paid sessions only)</p>
      <div class="chart-wrap" style="height:240px">
        <canvas id="chartEffCpkwh"></canvas>
      </div>
    </div>
    <div class="chart-card">
      <p class="chart-title">Monthly Savings Rate — savings as % of gas equivalent</p>
      <div class="chart-wrap" style="height:240px">
        <canvas id="chartSavingsPct"></canvas>
      </div>
    </div>
  </div>

  <div class="chart-grid-2" style="margin-top:18px">
    <div class="chart-card">
      <p class="chart-title">Average kWh per Session — monthly trend</p>
      <div class="chart-wrap" style="height:240px">
        <canvas id="chartAvgSession"></canvas>
      </div>
    </div>
    <div class="chart-card">
      <p class="chart-title">Energy by Day of Week</p>
      <div class="chart-wrap" style="height:240px">
        <canvas id="chartDayOfWeek"></canvas>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 5: SESSION DEEP DIVE                      -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div class="section-header" id="sessions">
    <h2>Session Deep Dive</h2>
    <span>individual session analysis</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <div class="chart-full chart-card">
    <p class="chart-title">Session kWh Over Time — colored by charging source</p>
    <div class="chart-wrap" style="height:280px">
      <canvas id="chartSessionScatter"></canvas>
    </div>
  </div>

  <div class="chart-grid-2" style="margin-top:18px">
    <div class="chart-card">
      <p class="chart-title">Session Size Distribution (kWh histogram)</p>
      <div class="chart-wrap" style="height:250px">
        <canvas id="chartHistogram"></canvas>
      </div>
    </div>
    <div class="chart-card">
      <p class="chart-title">Top 10 Largest Sessions</p>
      <div style="overflow-x:auto; margin-top:4px">
        <table class="top-table">
          <thead>
            <tr><th>#</th><th>Date</th><th>Location</th><th>kWh</th><th>Cost</th><th>Saved †</th></tr>
          </thead>
          <tbody id="topSessionsBody"></tbody>
        </table>
        <p style="font-size:0.68rem;color:#888;margin:8px 4px 0">† <strong>Saved</strong> = (kWh × mi/kWh ÷ mpg) × $/gal − actual cost &nbsp;—&nbsp; i.e. what equivalent gas miles would have cost at historical rates, minus what you paid for electricity. Fuel rates from <code>_data/rates.yml → gas_savings</code>.</p>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 6: SEASON OVER SEASON                     -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div class="section-header" id="seasonal">
    <h2>Season Over Season</h2>
    <span>winter cold vs. summer efficiency — year by year</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <div class="chart-full chart-card">
    <p class="chart-title">Monthly kWh — Year Over Year Overlay</p>
    <div class="chart-wrap" style="height:260px"><canvas id="chartYoY"></canvas></div>
  </div>

  <div class="chart-grid-2" style="margin-top:18px">
    <div class="chart-card">
      <p class="chart-title">Avg kWh/Session by Season</p>
      <div class="chart-wrap" style="height:220px"><canvas id="chartSeasonAvg"></canvas></div>
    </div>
    <div class="chart-card">
      <p class="chart-title">Free Charging Index — % of kWh from Work per Month</p>
      <div class="chart-wrap" style="height:220px"><canvas id="chartFreeIndex"></canvas></div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 7: ECONOMICS DEEP DIVE                    -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div class="section-header" id="economics2">
    <h2>Economics Deep Dive</h2>
    <span>break-even, projections &amp; cost per mile</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <!-- Break-even hero card -->
  <div class="chart-card chart-full" style="margin-bottom:18px">
    <div id="breakevenHero" style="display:flex;flex-wrap:wrap;gap:24px;align-items:center;padding:8px 0">
      <div style="flex:1;min-width:200px">
        <div style="font-size:0.62rem;text-transform:uppercase;letter-spacing:0.1em;color:#888;margin-bottom:6px">Total Gas Savings Since Day One</div>
        <div id="breakevenValue" style="font-size:2.6rem;font-weight:900;color:#2ecc71;line-height:1">—</div>
        <div id="breakevenSub" style="font-size:0.78rem;color:#888;margin-top:6px">saved vs. driving a gas car</div>
      </div>
      <div style="flex:2;min-width:260px">
        <div style="font-size:0.62rem;text-transform:uppercase;letter-spacing:0.1em;color:#888;margin-bottom:8px">Monthly Savings Projection (trailing 3-month avg)</div>
        <div id="projectionRow" style="display:flex;gap:16px;flex-wrap:wrap">
          <div><span style="font-size:1.3rem;font-weight:800;color:var(--text)" id="projMonthly">—</span><br><span style="font-size:0.7rem;color:#888">avg/month</span></div>
          <div><span style="font-size:1.3rem;font-weight:800;color:var(--link)" id="projYear">—</span><br><span style="font-size:0.7rem;color:#888">projected full year</span></div>
          <div><span style="font-size:1.3rem;font-weight:800;color:#f39c12" id="projLifetime">—</span><br><span style="font-size:0.7rem;color:#888">projected 5-yr savings</span></div>
        </div>
      </div>
    </div>
  </div>

  <div class="chart-full chart-card" style="margin-bottom:18px">
    <p class="chart-title">Cost Per Mile — Monthly Trend (charging cost ÷ estimated miles driven)</p>
    <div class="chart-wrap" style="height:240px"><canvas id="chartCostPerMile"></canvas></div>
    <p style="font-size:0.68rem;color:#888;margin-top:8px">† Miles estimated from kWh charged × assumed mi/kWh efficiency for that period. Treat as directional, not odometer-precise.</p>
  </div>

  <div class="chart-grid-2">
    <div class="chart-card">
      <p class="chart-title">Savings Rate — % of Gas Equivalent Saved Each Month</p>
      <div class="chart-wrap" style="height:230px"><canvas id="chartSavingsRate2"></canvas></div>
    </div>
    <div class="chart-card">
      <p class="chart-title">Monthly Savings Projection Trend</p>
      <div class="chart-wrap" style="height:230px"><canvas id="chartProjection"></canvas></div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 8: ROAD TRIPS                             -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div class="section-header" id="roadtrips">
    <h2>Road Trips</h2>
    <span>public charging stops &gt;50 miles from home, clustered within 5-day windows</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <div class="chart-card chart-full" style="margin-bottom:18px">
    <div id="roadTripContainer">
      <p style="color:#888;font-size:0.85rem">Detecting trips…</p>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 9: VEHICLE COMPARISON (multi-vehicle only) -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div id="vehicleCompSection" style="display:none">
    <div class="section-header" id="vehiclecomp">
      <h2>Vehicle Comparison</h2>
      <span>head-to-head — only shown when multiple vehicles have data</span>
      <a href="#top" class="back-top-pill">↑ top</a>
    </div>

    <div id="vehicleCompCards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:18px"></div>

    <div class="chart-grid-2">
      <div class="chart-card">
        <p class="chart-title">Monthly kWh by Vehicle</p>
        <div class="chart-wrap" style="height:240px"><canvas id="chartVehicleKwh"></canvas></div>
      </div>
      <div class="chart-card">
        <p class="chart-title">Avg kWh/Session by Vehicle</p>
        <div class="chart-wrap" style="height:240px"><canvas id="chartVehicleAvgSession"></canvas></div>
      </div>
    </div>

    <div class="chart-grid-2" style="margin-top:18px">
      <div class="chart-card">
        <p class="chart-title">Cost per Estimated Mile — Vehicle Comparison</p>
        <div class="chart-wrap" style="height:240px"><canvas id="chartVehicleCpm"></canvas></div>
      </div>
      <div class="chart-card">
        <p class="chart-title">Session Size Distribution — Vehicle Comparison (histogram)</p>
        <div class="chart-wrap" style="height:240px"><canvas id="chartVehicleHistogram"></canvas></div>
      </div>
    </div>

    <div class="chart-full chart-card" style="margin-top:18px;margin-bottom:18px">
      <p class="chart-title">Efficiency Comparison — kWh per Estimated Mile, Monthly</p>
      <div class="chart-wrap" style="height:240px"><canvas id="chartVehicleEfficiency"></canvas></div>
      <p style="font-size:0.68rem;color:#888;margin-top:8px">LFP (Standard Range) chemistry maintains better capacity in cold vs. NCM (GT). Watch for winter divergence.</p>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 10: SESSION DETAIL ANALYTICS              -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div id="detailSection">
    <div class="section-header" id="sessiondetail">
      <h2>Session Detail</h2>
      <span id="detailSessionCount">charging behavior — timing, SOC &amp; battery health</span>
      <a href="#top" class="back-top-pill">↑ top</a>
    </div>

    <!-- SOC behaviour row -->
    <div class="chart-grid-3" style="margin-bottom:18px">
      <div class="chart-card">
        <p class="chart-title">Plug-in SOC Distribution</p>
        <span class="chart-sub">How depleted before you charge</span>
        <div class="chart-wrap" style="height:220px"><canvas id="chartSocStart"></canvas></div>
      </div>
      <div class="chart-card">
        <p class="chart-title">Unplug SOC Distribution</p>
        <span class="chart-sub">How full when you leave</span>
        <div class="chart-wrap" style="height:220px"><canvas id="chartSocEnd"></canvas></div>
      </div>
      <div class="chart-card">
        <p class="chart-title">SOC Added Distribution</p>
        <span class="chart-sub">How much % added per session</span>
        <div class="chart-wrap" style="height:220px"><canvas id="chartSocAdded"></canvas></div>
      </div>
    </div>

    <!-- Duration & rate row -->
    <div class="chart-grid-2" style="margin-bottom:18px">
      <div class="chart-card">
        <p class="chart-title">Charge Duration Distribution</p>
        <span class="chart-sub">How long sessions typically run (hours)</span>
        <div class="chart-wrap" style="height:230px"><canvas id="chartDuration"></canvas></div>
      </div>
      <div class="chart-card">
        <p class="chart-title">Avg Charge Rate by Location (kW)</p>
        <span class="chart-sub">energy_kwh ÷ duration — includes idle time for Work &amp; Home overnight</span>
        <div class="chart-wrap" style="height:230px"><canvas id="chartAvgRate"></canvas></div>
      </div>
    </div>

    <!-- Time of day -->
    <div class="chart-grid-2" style="margin-bottom:18px">
      <div class="chart-card">
        <p class="chart-title">Plug-in Time of Day</p>
        <span class="chart-sub">What hour you typically start charging</span>
        <div class="chart-wrap" style="height:250px"><canvas id="chartPluginHour"></canvas></div>
      </div>
      <div class="chart-card">
        <p class="chart-title">SOC at Plug-in vs kWh Added</p>
        <span class="chart-sub">Lower SOC → bigger charge — scatter plot</span>
        <div class="chart-wrap" style="height:250px"><canvas id="chartSocScatter"></canvas></div>
      </div>
    </div>

    <!-- Battery health -->
    <div class="chart-full chart-card" style="margin-bottom:18px">
      <p class="chart-title">Estimated Usable Battery — Session by Session</p>
      <span class="chart-sub">energy_kwh ÷ (soc_added ÷ 100) — should stay near rated UBE. Downward drift = degradation. ⚠ Noise expected; trend matters more than individual points.</span>
      <div style="display:flex;gap:20px;flex-wrap:wrap;margin:12px 0 16px">
        <div id="ubeCardGT" style="display:none;background:var(--dash-card);border:1px solid var(--dash-border);border-radius:10px;padding:12px 18px;min-width:180px">
          <div style="font-size:0.6rem;text-transform:uppercase;color:#888;margin-bottom:4px">GT Rated UBE</div>
          <div style="font-size:1.4rem;font-weight:900;color:#0288d1">91.7 kWh</div>
          <div style="font-size:0.68rem;color:#888;margin-top:2px">NCM extended range</div>
        </div>
        <div id="ubeCardSR" style="display:none;background:var(--dash-card);border:1px solid var(--dash-border);border-radius:10px;padding:12px 18px;min-width:180px">
          <div style="font-size:0.6rem;text-transform:uppercase;color:#888;margin-bottom:4px">SR Rated UBE</div>
          <div style="font-size:1.4rem;font-weight:900;color:#7b1fa2">72.6 kWh</div>
          <div style="font-size:0.68rem;color:#888;margin-top:2px">LFP 2026</div>
        </div>
      </div>
      <div class="chart-wrap" style="height:280px"><canvas id="chartBatteryHealth"></canvas></div>
    </div>

    <!-- Avg SOC start/end by location -->
    <div class="chart-grid-2" style="margin-bottom:18px">
      <div class="chart-card">
        <p class="chart-title">Avg Plug-in vs Unplug SOC by Location</p>
        <span class="chart-sub">Where do you charge hardest?</span>
        <div class="chart-wrap" style="height:240px"><canvas id="chartSocByLoc"></canvas></div>
      </div>
      <div class="chart-card">
        <p class="chart-title">SOC Start Over Time</p>
        <span class="chart-sub">Are you letting it get lower over time?</span>
        <div class="chart-wrap" style="height:240px"><canvas id="chartSocStartTrend"></canvas></div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION 11: REAL-WORLD EFFICIENCY                 -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div id="efficiencySection" style="display:none">
    <div class="section-header" id="efficiency">
      <h2>Real-World Efficiency</h2>
      <span id="effSessionCount">from FordPass miles_added data</span>
      <a href="#top" class="back-top-pill">↑ top</a>
    </div>

    <!-- KPI row -->
    <div class="kpi-strip" style="grid-template-columns:repeat(4,1fr);margin-bottom:18px" id="effKpiStrip">
      <div class="kpi-card"><span class="kpi-label">Avg mi/kWh</span><span class="kpi-value" id="effAvgMiKwh">—</span></div>
      <div class="kpi-card"><span class="kpi-label">Avg Wh/mi</span><span class="kpi-value" id="effAvgWhMi">—</span></div>
      <div class="kpi-card"><span class="kpi-label">Best Session</span><span class="kpi-value" id="effBest">—</span></div>
      <div class="kpi-card"><span class="kpi-label">Worst Session</span><span class="kpi-value" id="effWorst">—</span></div>
    </div>

    <!-- Trend + scatter -->
    <div class="chart-full chart-card" style="margin-bottom:18px">
      <p class="chart-title">Real Efficiency Over Time — mi/kWh per session</p>
      <span class="chart-sub">Rolling 5-session average overlaid. Seasonal dips show winter range loss clearly.</span>
      <div class="chart-wrap" style="height:260px"><canvas id="chartEffTrend"></canvas></div>
    </div>

    <div class="chart-grid-2" style="margin-bottom:18px">
      <div class="chart-card">
        <p class="chart-title">Efficiency Distribution</p>
        <span class="chart-sub">How often you hit each efficiency band (mi/kWh histogram)</span>
        <div class="chart-wrap" style="height:230px"><canvas id="chartEffHist"></canvas></div>
      </div>
      <div class="chart-card">
        <p class="chart-title">Wh/mi Distribution</p>
        <span class="chart-sub">Energy cost per mile — lower is better</span>
        <div class="chart-wrap" style="height:230px"><canvas id="chartWhMiHist"></canvas></div>
      </div>
    </div>

    <!-- By month + by location -->
    <div class="chart-grid-2" style="margin-bottom:18px">
      <div class="chart-card">
        <p class="chart-title">Avg Real Efficiency by Month</p>
        <span class="chart-sub">Seasonal pattern — summer vs. winter delta</span>
        <div class="chart-wrap" style="height:230px"><canvas id="chartEffByMonth"></canvas></div>
      </div>
      <div class="chart-card">
        <p class="chart-title">Avg Real Efficiency by Location</p>
        <span class="chart-sub">DC fast charging vs. Level 2 vs. Home</span>
        <div class="chart-wrap" style="height:230px"><canvas id="chartEffByLoc"></canvas></div>
      </div>
    </div>

    <!-- Miles added cumulative + vs assumed -->
    <div class="chart-grid-2" style="margin-bottom:18px">
      <div class="chart-card">
        <p class="chart-title">Cumulative Miles Added via Charging</p>
        <span class="chart-sub">Running total of FordPass-reported miles added</span>
        <div class="chart-wrap" style="height:230px"><canvas id="chartCumMiles"></canvas></div>
      </div>
      <div class="chart-card">
        <p class="chart-title">Real vs. Assumed Efficiency — Session by Session</p>
        <span class="chart-sub">Real (FordPass) vs. rates.yml assumption — shows where assumption drifts</span>
        <div class="chart-wrap" style="height:230px"><canvas id="chartEffVsAssumed"></canvas></div>
      </div>
    </div>

    <!-- Efficiency vs SOC start scatter -->
    <div class="chart-grid-2" style="margin-bottom:18px">
      <div class="chart-card">
        <p class="chart-title">Efficiency vs. SOC at Plug-in</p>
        <span class="chart-sub">Does starting charge level affect efficiency?</span>
        <div class="chart-wrap" style="height:240px"><canvas id="chartEffVsSoc"></canvas></div>
      </div>
      <div class="chart-card">
        <p class="chart-title">Efficiency vs. kWh Added</p>
        <span class="chart-sub">Larger charges vs. smaller top-ups — any pattern?</span>
        <div class="chart-wrap" style="height:240px"><canvas id="chartEffVsKwh"></canvas></div>
      </div>
    </div>

    <!-- Gas savings accuracy note -->
    <div class="chart-card chart-full" style="margin-bottom:18px">
      <p class="chart-title">Gas Savings: Real vs. Assumed Efficiency</p>
      <span class="chart-sub">Cumulative savings calculated with real mi/kWh (where available) vs. always using the assumed rate — shows how much the assumption matters</span>
      <div class="chart-wrap" style="height:240px"><canvas id="chartSavingsRealVsAssumed"></canvas></div>
      <p style="font-size:0.68rem;color:#888;margin-top:8px">† Sessions without miles_added data use the assumed rate from _data/rates.yml for both lines.</p>
    </div>
  <!-- ─── hm-tip tooltip (heatmap hover) ─── -->
  <div id="hm-tip" style="position:fixed;background:rgba(0,0,0,0.82);color:#fff;padding:5px 10px;border-radius:6px;font-size:11px;pointer-events:none;display:none;z-index:9999;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>

  <div class="section-header" id="map">
    <h2>Charging Locations Map</h2>
    <span>energy added at each location — circle size ∝ kWh</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <div class="chart-card">
    <div id="mapNoCoords" style="padding:36px 20px;text-align:center;color:#888;font-size:0.88rem;line-height:1.6;display:none">
      <div style="font-size:2rem;margin-bottom:8px">📍</div>
      <strong>No coordinates set yet</strong><br>
      Add <code>lat</code> / <code>lng</code> values to <code>_data/locations.yml</code> to enable this map.<br>
      <span style="font-size:0.78rem">Circles are sized and colored by total kWh added at each location, with a pulsing ring indicating relative activity.</span>
    </div>
    <div id="chargingMap" style="height:420px"></div>
  </div>

</div><!-- .analytics-container -->

<!-- ─────────────────────────────────────────────────── -->
<!--  SCRIPTS                                           -->
<!-- ─────────────────────────────────────────────────── -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css" />
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js"></script>

<script>
/* ════════════════════════════════════════════════════════
   RAW DATA FROM JEKYLL LIQUID
   ════════════════════════════════════════════════════════ */
const sessions = [
  {% for entry in sorted_sessions %}{ date: "{{ entry.date | date: '%Y-%m-%d' }}", location: "{{ entry.location | replace: '"', "'" }}", vehicle: "{{ entry.vehicle | default: '2025 Mach-E GT' | replace: '"', "'" }}", kwh: {{ entry.energy_kwh | times: 1.0 }}, rawCost: {{ entry.cost | times: 1.0 }}, startDate: "{{ entry.start_date | date: '%Y-%m-%d' }}", startTime: "{{ entry.start_time }}", endTime: "{{ entry.end_time }}", socStart: {{ entry.soc_start | default: 0 }}, socEnd: {{ entry.soc_end | default: 0 }}, socAdded: {{ entry.soc_added | default: 0 }}, milesAdded: {{ entry.miles_added | default: 0 }} }{% unless forloop.last %},{% endunless %}
  {% endfor %}
];

// Usable battery capacity by vehicle (kWh) — corrected specs
// GT (NCM extended range): 91.7 kWh usable
// SR LFP (2026): 72.6 kWh usable
const VEHICLE_UBE = {
  '2025 Mach-E GT':        91.7,
  '2026 Mach-E SR':        72.6,
  "LRB's 2025 Mach-E GT":  91.7,
  "LRB's 2026 Mach-E SR":  72.6
};

const homeRates       = {{ site.data.rates.home_electricity | jsonify }};
const gasSavingsRates = {{ site.data.rates.gas_savings       | jsonify }};
const locationData    = {{ site.data.locations | jsonify }} || [];

/* ── Location table state — declared here so nothing runs before these exist ── */
let _locSortCol = 'name', _locSortDir = 'asc', _locView = 'location', _locSl = [];

/* ════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════ */
const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
const tc     = () => isDark() ? '#c0c0c0' : '#444';   // tick / label color
const gc     = () => isDark() ? '#3a3a3a' : '#e8e8e8'; // grid color

function getStepRate(arr, date, field, fallback) {
  if (!Array.isArray(arr) || !arr.length) return fallback;
  let val = fallback;
  // Walk the full array — do NOT break early, rates may not be perfectly contiguous
  for (const r of arr) { if (r.date <= date) val = r[field]; }
  return (val !== undefined && val !== null) ? val : fallback;
}
// Per-vehicle MPG override for gas savings comparison.
// Keys must exactly match vehicle field values in session files.
// If a vehicle isn't listed here, the mpg from rates.yml is used.
const VEHICLE_MPG = {
  '2025 Mach-E GT':        27,
  '2026 Mach-E SR':        27,
  "LRB's 2025 Mach-E GT":  23,
  "LRB's 2026 Mach-E SR":  23,
};

function getGasSavingsObj(date, vehicle) {
  if (!Array.isArray(gasSavingsRates) || !gasSavingsRates.length) {
    return { mpg: 27, gas_price: 3.26, mi_per_kwh: 3.0 };
  }
  let obj = { ...gasSavingsRates[0] };
  for (const r of gasSavingsRates) { if (r.date <= date) obj = { ...r }; }
  // Override mpg with per-vehicle value if defined
  if (vehicle && VEHICLE_MPG[vehicle] !== undefined) {
    obj = { ...obj, mpg: VEHICLE_MPG[vehicle] };
  }
  return obj;
}
function getBucket(loc) {
  const l = loc.toLowerCase();
  if (l.includes('work'))        return 'Work';
  if (l.includes('home'))        return 'Home';
  if (l.includes('tesla'))       return 'Tesla SC';
  if (l.includes('chargepoint')) return 'ChargePoint';
  if (l.includes('blink'))       return 'Blink';
  if (l.includes('rivian'))      return 'Rivian';
  return 'Other';
}
function monthLabel(m) {
  const [y, mo] = m.split('-');
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+mo - 1] + " '" + y.slice(2);
}
function fmtUSD(v) {
  const neg = v < 0;
  const rounded = Math.round(Math.abs(v) * 100);
  const dollars = Math.floor(rounded / 100);
  const cents   = rounded % 100;
  return (neg ? '-$' : '$') + dollars + '.' + String(cents).padStart(2, '0');
}
function badgeClass(b) {
  return { Work:'badge-work', Home:'badge-home', 'Tesla SC':'badge-tesla',
           ChargePoint:'badge-cp', Blink:'badge-blink', Rivian:'badge-rivian', Other:'badge-other' }[b] || 'badge-other';
}

const BUCKET_COLORS = {
  'Work':       '#0288d1',
  'Home':       '#7b1fa2',
  'Tesla SC':   '#CC0000',
  'ChargePoint':'#FF7A14',
  'Blink':      '#65A844',
  'Rivian':     '#ffa500',
  'Other':      '#909090'
};

/*
  ── SITE PALETTE (use these everywhere, nothing else) ──────────────
  C_BLUE    #0288d1  Work, rates, electricity, infrastructure
  C_PURPLE  #7b1fa2  Home, primary brand accent
  C_GREEN   #2ecc71  Savings, free energy, positive outcomes
  C_AMBER   #f39c12  Gas equivalent, fuel cost, old-world comparison
  C_RED     #e74c3c  Actual costs paid, money out
  C_VIOLET  #5D3FD3  Paid sessions, analytics accent, trend lines
  ───────────────────────────────────────────────────────────────────
*/
const C_BLUE   = '#0288d1';
const C_PURPLE = '#7b1fa2';
const C_GREEN  = '#2ecc71';
const C_AMBER  = '#f39c12';
const C_RED    = '#e74c3c';
const C_VIOLET = '#5D3FD3';

/* ════════════════════════════════════════════════════════
   ENRICH SESSIONS
   ════════════════════════════════════════════════════════ */
sessions.forEach(s => {
  try {
    const loc   = s.location.toLowerCase();
    const hRate = getStepRate(homeRates, s.date, 'rate', 0.196);
    s.cost      = loc.includes('home') ? s.kwh * hRate : s.rawCost;
    const gs    = getGasSavingsObj(s.date, s.vehicle) || { mpg: 27, gas_price: 3.26, mi_per_kwh: 3.0 };

    // Real efficiency from FordPass miles_added — more accurate than assumed mi/kWh
    // Falls back to rates.yml assumption if miles_added not recorded
    s.hasRealEff = s.milesAdded > 0 && s.kwh > 0;
    s.realMiPerKwh = s.hasRealEff ? s.milesAdded / s.kwh : null;
    s.realWhPerMi  = s.hasRealEff ? (s.kwh * 1000) / s.milesAdded : null;

    // Use real efficiency for gas savings if available, otherwise fall back to assumed
    const effMiPerKwh = s.hasRealEff ? s.realMiPerKwh : (gs.mi_per_kwh || 3.0);
    s.gasEquiv  = s.kwh * effMiPerKwh / (gs.mpg || 27) * (gs.gas_price || 3.26);
    s.saving    = s.gasEquiv - s.cost;
    s.bucket    = getBucket(s.location);
    s.isFree    = s.cost < 0.005;
    s.month     = s.date.substring(0, 7);
    s.dow       = new Date(s.date + 'T12:00:00').getDay();
  } catch(e) {
    console.error('[EV] Session enrichment failed for', s.date, s.location, e);
    s.cost     = s.rawCost || 0;
    s.gasEquiv = 0; s.saving = 0;
    s.bucket   = getBucket(s.location || '');
    s.isFree   = s.cost < 0.005;
    s.month    = (s.date || '').substring(0, 7);
    s.dow      = 0;
    s.hasRealEff = false; s.realMiPerKwh = null; s.realWhPerMi = null;
  }
});

/* ════════════════════════════════════════════════════════
   CHART FACTORY + ANIMATION HELPERS
   ════════════════════════════════════════════════════════ */
Chart.register(ChartDataLabels);

/* Cubic ease-out count-up animation */
function countUp(el, target, fmt, dur) {
  dur = dur || 900;
  const t0 = performance.now();
  (function tick(now) {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = fmt((1 - Math.pow(1 - p, 3)) * target);
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

const allVehicles = [...new Set(sessions.map(s => s.vehicle))].sort();
let activeVehicle = 'all';
let allCharts = [];

function mkChart(id, config) {
  const c = new Chart(document.getElementById(id), config);
  allCharts.push(c);
  return c;
}

/* ════════════════════════════════════════════════════════
   VEHICLE FILTER
   ════════════════════════════════════════════════════════ */
function buildVehicleFilter() {
  const el        = document.getElementById('vehicleFilterBtns');
  const stickyBar = document.getElementById('vehicleFilterSticky');
  const stickyRow = document.getElementById('stickyVehicleRow');
  if (!el) return;

  // Sticky bar always shows (has section nav regardless of vehicle count)
  if (stickyBar) stickyBar.style.display = 'flex';

  if (allVehicles.length < 2) {
    el.style.display = 'none';
    // Hide only the vehicle row, keep nav row
    if (stickyRow) stickyRow.style.display = 'none';
  } else {
    // Build inline vehicle buttons
    el.style.display = 'flex';
    el.innerHTML = '';
    ['all', ...allVehicles].forEach(v => {
      const btn = document.createElement('button');
      btn.className = 'vf-btn' + (v === activeVehicle ? ' active' : '');
      btn.textContent = v === 'all' ? 'All Vehicles' : v;
      btn.dataset.vehicle = v;
      btn.onclick = () => setVehicle(v);
      el.appendChild(btn);
    });

    // Build sticky vehicle row buttons
    if (stickyRow) {
      stickyRow.style.display = 'flex';
      stickyRow.querySelectorAll('.vf-btn').forEach(b => b.remove());
      ['all', ...allVehicles].forEach(v => {
        const btn = document.createElement('button');
        btn.className = 'vf-btn' + (v === activeVehicle ? ' active' : '');
        btn.textContent = v === 'all' ? 'All Vehicles' : v;
        btn.dataset.vehicle = v;
        btn.onclick = () => setVehicle(v);
        stickyRow.appendChild(btn);
      });
    }
  }

  // Show sticky bar after scrolling 120px — scroll event is more reliable
  // than IntersectionObserver for this use case across browsers
  if (stickyBar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 120) {
        stickyBar.classList.add('visible');
      } else {
        stickyBar.classList.remove('visible');
      }
    }, { passive: true });
  }
}

function setVehicle(v) {
  activeVehicle = v;
  // Sync active state on ALL .vf-btn elements (inline + sticky)
  document.querySelectorAll('.vf-btn').forEach(b => {
    const label = v === 'all' ? 'All Vehicles' : v;
    b.classList.toggle('active', b.textContent === label);
  });
  _lastSl = v === 'all' ? sessions : sessions.filter(s => s.vehicle === v);
  rebuild(_lastSl);
  if (_leafletMap) buildMap(_lastSl);
}

/* ════════════════════════════════════════════════════════
   REBUILD — called on init and on vehicle filter change
   ════════════════════════════════════════════════════════ */
function rebuild(sl) {
  allCharts.forEach(c => c.destroy());
  allCharts = [];

  // Drop any sessions that failed enrichment (missing month = bad date)
  sl = sl.filter(s => s.month && s.month.length === 7);
  if (!sl.length) {
    console.warn('[EV] rebuild() called with no valid sessions');
    return;
  }

  /* MONTHLY AGGREGATES */
  const allMonths = [...new Set(sl.map(s => s.month))].sort();
  const monthly   = {};
  allMonths.forEach(m => {
    monthly[m] = { kwh:0, cost:0, saving:0, gasEquiv:0,
                   sessions:0, freeSessions:0, freeKwh:0, paidKwh:0,
                   workKwh:0, homeKwh:0, pubKwh:0 };
  });
  sl.forEach(s => {
    const m = monthly[s.month];
    m.kwh     += s.kwh;     m.cost    += s.cost;
    m.saving  += s.saving;  m.gasEquiv += s.gasEquiv;
    m.sessions++;
    if (s.isFree) { m.freeKwh += s.kwh; m.freeSessions++; } else m.paidKwh += s.kwh;
    if      (s.bucket === 'Work') m.workKwh += s.kwh;
    else if (s.bucket === 'Home') m.homeKwh += s.kwh;
    else                           m.pubKwh  += s.kwh;
  });

  /* KPI STRIP */
  const totalKwh     = sl.reduce((a,s) => a + s.kwh,     0);
  const totalCost    = sl.reduce((a,s) => a + s.cost,    0);
  const totalSavings = sl.reduce((a,s) => a + s.saving,  0);
  const freeKwh      = sl.filter(s => s.isFree).reduce((a,s) => a + s.kwh, 0);

  countUp(document.getElementById('kpi-kwh'),         totalKwh / 1000,                                function(v){ return v.toFixed(2) + ' MWh'; });
  countUp(document.getElementById('kpi-cost'),        totalCost,                                      function(v){ return fmtUSD(v); });
  countUp(document.getElementById('kpi-savings'),     totalSavings,                                   function(v){ return fmtUSD(v); });
  countUp(document.getElementById('kpi-free'),        totalKwh > 0 ? freeKwh / totalKwh * 100 : 0,   function(v){ return Math.round(v) + '%'; });
  countUp(document.getElementById('kpi-sessions'),    sl.length,                                      function(v){ return Math.round(v); });
  countUp(document.getElementById('kpi-cpkwh'),       totalKwh > 0 ? totalCost / totalKwh * 100 : 0, function(v){ return v.toFixed(1) + '¢'; });
  countUp(document.getElementById('kpi-avg-session'), sl.length > 0 ? totalKwh / sl.length : 0,      function(v){ return v.toFixed(1) + ' kWh'; });
  countUp(document.getElementById('kpi-months'),      allMonths.length,                               function(v){ return Math.round(v); });



/* ════════════════════════════════════════════════════════
   CHART 1 — Monthly kWh stacked by source
   ════════════════════════════════════════════════════════ */
mkChart('chartMonthlyKwh', {
  type: 'bar',
  data: {
    labels: allMonths.map(monthLabel),
    datasets: [
      { label: 'Work',   data: allMonths.map(m => +monthly[m].workKwh.toFixed(1)),
        backgroundColor: '#0288d1', stack: 's' },
      { label: 'Home',   data: allMonths.map(m => +monthly[m].homeKwh.toFixed(1)),
        backgroundColor: '#7b1fa2', stack: 's' },
      { label: 'Public', data: allMonths.map(m => +monthly[m].pubKwh.toFixed(1)),
        backgroundColor: '#FF7A14', stack: 's' }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 14 } },
      datalabels: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} kWh` } }
    },
    scales: {
      x: { stacked: true, grid: { color: gc() }, ticks: { color: tc() } },
      y: { stacked: true, grid: { color: gc() }, ticks: { color: tc() },
           title: { display: true, text: 'kWh', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 2 — Sessions per month
   ════════════════════════════════════════════════════════ */
mkChart('chartMonthlySessions', {
  type: 'bar',
  data: {
    labels: allMonths.map(monthLabel),
    datasets: [{
      label: 'Sessions',
      data: allMonths.map(m => monthly[m].sessions),
      backgroundColor: '#5D3FD3',
      borderRadius: 4
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 18 } },
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true, anchor: 'end', align: 'top',
        color: tc(), font: { size: 10, weight: 'bold' },
        formatter: v => v
      },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} session${ctx.parsed.y !== 1 ? 's' : ''}` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tc() } },
      y: { grid: { color: gc() }, ticks: { color: tc(), stepSize: 5 }, min: 0,
           title: { display: true, text: 'Sessions', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 3 — Free vs Paid kWh per month
   ════════════════════════════════════════════════════════ */
mkChart('chartFreeVsPaid', {
  type: 'bar',
  data: {
    labels: allMonths.map(monthLabel),
    datasets: [
      { label: 'Free', data: allMonths.map(m => +monthly[m].freeKwh.toFixed(1)),
        backgroundColor: '#2ecc71', stack: 's' },
      { label: 'Paid', data: allMonths.map(m => +monthly[m].paidKwh.toFixed(1)),
        backgroundColor: '#5D3FD3', stack: 's' }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: tc(), boxWidth: 12 } },
      datalabels: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} kWh` } }
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: tc() } },
      y: { stacked: true, grid: { color: gc() }, ticks: { color: tc() },
           title: { display: true, text: 'kWh', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 4 — Monthly Cost vs Gas Equivalent
   ════════════════════════════════════════════════════════ */
mkChart('chartMonthlyCostVsGas', {
  type: 'bar',
  data: {
    labels: allMonths.map(monthLabel),
    datasets: [
      { label: 'Actual Cost',    data: allMonths.map(m => +monthly[m].cost.toFixed(2)),
        backgroundColor: '#e74c3c', borderRadius: 3 },
      { label: 'Gas Equivalent', data: allMonths.map(m => +monthly[m].gasEquiv.toFixed(2)),
        backgroundColor: '#f39c12', borderRadius: 3 }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: tc(), boxWidth: 12 } },
      datalabels: { display: false },
      tooltip: {
        callbacks: {
          label: (item) => ` ${item.dataset.label}: ${fmtUSD(item.parsed.y)}`,
          afterBody: (items) => {
            const m = allMonths[items[0].dataIndex];
            const saved = monthly[m].saving;
            const monthSess = sl.filter(s => s.month === m);
            const gs = monthSess.length ? getGasSavingsObj(monthSess[monthSess.length - 1].date, monthSess[monthSess.length - 1].vehicle) : null;
            const lines = [`Saved vs. gas: ${fmtUSD(saved)}`];
            if (gs) lines.push(`Fuel rate: $${gs.gas_price.toFixed(2)}/gal · ${gs.mpg} mpg (last session) · ${gs.mi_per_kwh} mi/kWh`);
            return lines;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tc() } },
      y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => '$' + v.toFixed(0) },
           title: { display: true, text: 'USD ($)', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 5 — All-time location donut
   ════════════════════════════════════════════════════════ */
  const bucketTotals = {};
  sl.forEach(s => { bucketTotals[s.bucket] = (bucketTotals[s.bucket] || 0) + s.kwh; });
  const bucketEntries = Object.entries(bucketTotals).sort((a,b) => b[1] - a[1]);

  buildRecords(sl, allMonths, monthly, bucketEntries);
  buildHeatmap(sl);

mkChart('chartLocationDonut', {
  type: 'doughnut',
  data: {
    labels: bucketEntries.map(e => e[0]),
    datasets: [{
      data: bucketEntries.map(e => +e[1].toFixed(1)),
      backgroundColor: bucketEntries.map(e => BUCKET_COLORS[e[0]] || '#999'),
      borderWidth: 3,
      borderColor: isDark() ? '#252525' : '#ffffff'
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: tc(), padding: 12, boxWidth: 14, font: { size: 11 },
          generateLabels: chart => {
            const ds  = chart.data.datasets[0];
            const tot = ds.data.reduce((a, v) => a + v, 0);
            return chart.data.labels.map((label, i) => ({
              text: `${label}  ${(ds.data[i] / tot * 100).toFixed(1)}%  (${ds.data[i].toFixed(0)} kWh)`,
              fillStyle: ds.backgroundColor[i],
              strokeStyle: ds.backgroundColor[i],
              lineWidth: 0,
              hidden: false
            }));
          }
        }
      },
      datalabels: {
        // Only show pills when a segment is large enough to hold one legibly
        // For crowded donuts (many small slices), suppress labels entirely
        display: ctx => {
          const total = ctx.dataset.data.reduce((a, v) => a + v, 0);
          const pct   = total > 0 ? ctx.dataset.data[ctx.dataIndex] / total * 100 : 0;
          return pct >= 12; // only label segments that own ≥12% of the donut
        },
        color: '#fff',
        font: { weight: '700', size: 11 },
        formatter: v => v.toFixed(0) + ' kWh',
        backgroundColor: ctx => bucketEntries[ctx.dataIndex]
          ? (BUCKET_COLORS[bucketEntries[ctx.dataIndex][0]] || '#666')
          : '#666',
        borderRadius: 6,
        padding: { top: 4, bottom: 4, left: 8, right: 8 },
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowBlur: 4,
      },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw.toFixed(1)} kWh` } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 6 — kWh by location ranked (horizontal bar)
   ════════════════════════════════════════════════════════ */
mkChart('chartLocationBar', {
  type: 'bar',
  data: {
    labels: bucketEntries.map(e => e[0]),
    datasets: [{
      data: bucketEntries.map(e => +e[1].toFixed(1)),
      backgroundColor: ctx => BUCKET_COLORS[bucketEntries[ctx.dataIndex]?.[0]] || '#909090',
      borderRadius: 4
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true, anchor: 'end', align: 'right',
        color: tc(), font: { size: 11 },
        formatter: v => v.toFixed(0) + ' kWh'
      },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed.x.toFixed(1)} kWh` } }
    },
    scales: {
      x: { grid: { color: gc() }, ticks: { color: '#888' } },
      y: { grid: { display: false }, ticks: { color: tc() } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 7 — Monthly kWh source split (area)
   ════════════════════════════════════════════════════════ */
mkChart('chartMonthlySourceSplit', {
  type: 'line',
  data: {
    labels: allMonths.map(monthLabel),
    datasets: [
      { label: 'Work',   data: allMonths.map(m => +monthly[m].workKwh.toFixed(1)), borderColor: '#0288d1', backgroundColor: 'rgba(2,136,209,0.15)', fill: true, tension: 0.35, borderWidth: 2, pointRadius: 3 },
      { label: 'Home',   data: allMonths.map(m => +monthly[m].homeKwh.toFixed(1)), borderColor: '#7b1fa2', backgroundColor: 'rgba(123,31,162,0.13)', fill: true, tension: 0.35, borderWidth: 2, pointRadius: 3 },
      { label: 'Public', data: allMonths.map(m => +monthly[m].pubKwh.toFixed(1)),  borderColor: '#FF7A14', backgroundColor: 'rgba(255,122,20,0.12)', fill: true, tension: 0.35, borderWidth: 2, pointRadius: 3 }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 14 } },
      datalabels: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} kWh` } }
    },
    scales: {
      x: { grid: { color: gc() }, ticks: { color: tc() } },
      y: { grid: { color: gc() }, ticks: { color: tc() },
           title: { display: true, text: 'kWh', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 8 — Gas price history (step line)
   ════════════════════════════════════════════════════════ */
mkChart('chartGasPrice', {
  type: 'line',
  data: {
    labels: gasSavingsRates.map(r => r.date),
    datasets: [{
      label: '$/gal',
      data: gasSavingsRates.map(r => r.gas_price),
      borderColor: '#f39c12',
      backgroundColor: 'rgba(243,156,18,0.12)',
      borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: '#f39c12',
      fill: true, stepped: true
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 18, right: 36 } },
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true, anchor: 'top', align: 'top',
        color: tc(), font: { size: 10 },
        formatter: v => '$' + v.toFixed(2)
      },
      tooltip: { callbacks: { label: ctx => ` $${ctx.parsed.y.toFixed(2)}/gal` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tc(), maxRotation: 40, minRotation: 30 } },
      y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => '$' + v.toFixed(2) },
           title: { display: true, text: '$/gal', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 9 — Home electricity rate history (step line)
   ════════════════════════════════════════════════════════ */
mkChart('chartElecRate', {
  type: 'line',
  data: {
    labels: homeRates.map(r => r.date),
    datasets: [{
      label: '¢/kWh',
      data: homeRates.map(r => +(r.rate * 100).toFixed(1)),
      borderColor: '#0288d1',
      backgroundColor: 'rgba(2,136,209,0.15)',
      borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: '#0288d1',
      fill: true, stepped: true
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 18, right: 36 } },
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true, anchor: 'top', align: 'top',
        color: tc(), font: { size: 10 },
        formatter: v => v + '¢'
      },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(1)} ¢/kWh` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tc(), maxRotation: 40, minRotation: 30 } },
      y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v + '¢' },
           title: { display: true, text: '¢/kWh', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 10 — Cumulative cost vs gas equivalent
   ════════════════════════════════════════════════════════ */
let cumCost = 0, cumGas = 0;
  const cumLabels = [], cumCostArr = [], cumGasArr = [];
  sl.forEach(s => {
  cumCost += s.cost; cumGas += s.gasEquiv;
  cumLabels.push(s.date);
  cumCostArr.push(+cumCost.toFixed(2));
  cumGasArr.push(+cumGas.toFixed(2));
});

mkChart('chartCumulative', {
  type: 'line',
  data: {
    labels: cumLabels,
    datasets: [
      { label: 'Gas Equivalent', data: cumGasArr,  borderColor: '#f39c12', backgroundColor: 'rgba(243,156,18,0.12)', fill: true, borderWidth: 2.5, pointRadius: 0, tension: 0.3 },
      { label: 'Actual Cost',    data: cumCostArr, borderColor: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.15)', fill: true, borderWidth: 2.5, pointRadius: 0, tension: 0.3 }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: tc(), boxWidth: 12 } },
      datalabels: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${fmtUSD(ctx.parsed.y)}`,
          afterBody: items => {
            const i = items[0].dataIndex;
            const gap = cumGasArr[i] - cumCostArr[i];
            return `Saved so far: ${fmtUSD(gap)}`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tc(), maxTicksLimit: 14 } },
      y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => '$' + v.toFixed(0) },
           title: { display: true, text: 'USD ($)', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 11 — Net cumulative savings
   ════════════════════════════════════════════════════════ */
  let cumSaving = 0;
  const cumSavingsArr = [];
  sl.forEach(s => { cumSaving += s.saving; cumSavingsArr.push(+cumSaving.toFixed(2)); });

mkChart('chartNetSavings', {
  type: 'line',
  data: {
    labels: cumLabels,
    datasets: [{
      label: 'Net Savings',
      data: cumSavingsArr,
      borderColor: '#2ecc71',
      backgroundColor: 'rgba(46,204,113,0.15)',
      fill: true, borderWidth: 2.5, pointRadius: 0, tension: 0.3
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: { callbacks: { label: ctx => ` Net Savings: ${fmtUSD(ctx.parsed.y)}` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tc(), maxTicksLimit: 14 } },
      y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => '$' + v.toFixed(0) },
           title: { display: true, text: 'Net Savings ($)', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 12 — Effective ¢/kWh per month (paid sessions)
   ════════════════════════════════════════════════════════ */
const effMonths = allMonths.filter(m => monthly[m].paidKwh > 0.5);
mkChart('chartEffCpkwh', {
  type: 'line',
  data: {
    labels: effMonths.map(monthLabel),
    datasets: [{
      label: '¢/kWh',
      data: effMonths.map(m => +(monthly[m].cost / monthly[m].paidKwh * 100).toFixed(2)),
      borderColor: '#5D3FD3',
      backgroundColor: 'rgba(93,63,211,0.12)',
      fill: true, borderWidth: 2.5,
      pointRadius: 5, pointBackgroundColor: '#5D3FD3',
      tension: 0.3
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 18 } },
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true, anchor: 'top', align: 'top',
        color: tc(), font: { size: 9 },
        formatter: v => v + '¢'
      },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(1)} ¢/kWh` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tc() } },
      y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v + '¢' },
           title: { display: true, text: '¢/kWh', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 13 — Monthly savings rate (savings as % of gas equiv)
   ════════════════════════════════════════════════════════ */
mkChart('chartSavingsPct', {
  type: 'bar',
  data: {
    labels: allMonths.map(monthLabel),
    datasets: [{
      label: 'Savings %',
      data: allMonths.map(m => {
        const ge = monthly[m].gasEquiv;
        return ge > 0 ? +(monthly[m].saving / ge * 100).toFixed(1) : 0;
      }),
      backgroundColor: ctx => {
        const m   = allMonths[ctx.dataIndex];
        const pct = m && monthly[m]?.gasEquiv > 0 ? monthly[m].saving / monthly[m].gasEquiv * 100 : 0;
        return pct >= 60 ? '#2ecc71' : pct >= 30 ? '#f39c12' : '#e74c3c';
      },
      borderRadius: 4
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 18 } },
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true, anchor: 'end', align: 'top',
        color: tc(), font: { size: 9 },
        formatter: v => v + '%'
      },
      tooltip: { callbacks: { label: ctx => ` Savings: ${ctx.parsed.y.toFixed(1)}% vs. gas cost` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tc() } },
      y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v + '%' },
           title: { display: true, text: '% vs gas cost', color: '#888' }, max: 100 }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 18 — Monthly savings in dollars (absolute)
   ════════════════════════════════════════════════════════ */
mkChart('chartMonthlySavings', {
  type: 'bar',
  data: {
    labels: allMonths.map(monthLabel),
    datasets: [{
      label: 'Savings vs. Gas',
      data: allMonths.map(m => +monthly[m].saving.toFixed(2)),
      backgroundColor: ctx => {
        const m   = allMonths[ctx.dataIndex];
        const s   = m ? monthly[m].saving : 0;
        return s >= 20 ? '#2ecc71' : s >= 5 ? '#f39c12' : '#e74c3c';
      },
      borderRadius: 4
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 18 } },
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true, anchor: 'end', align: 'top',
        color: tc(), font: { size: 9 },
        formatter: v => v < 0 ? '-$' + Math.abs(v).toFixed(0) : '$' + v.toFixed(0)
      },
      tooltip: { callbacks: { label: ctx => ` Saved: ${fmtUSD(ctx.parsed.y)} vs. gas` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tc() } },
      y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => '$' + v.toFixed(0) },
           title: { display: true, text: 'USD ($)', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 19 — Free vs Paid session COUNT per month
   ════════════════════════════════════════════════════════ */
mkChart('chartFreeVsPaidSessions', {
  type: 'bar',
  data: {
    labels: allMonths.map(monthLabel),
    datasets: [
      { label: 'Free', data: allMonths.map(m => monthly[m].freeSessions || 0),
        backgroundColor: '#2ecc71', stack: 's' },
      { label: 'Paid', data: allMonths.map(m => monthly[m].sessions - (monthly[m].freeSessions || 0)),
        backgroundColor: '#5D3FD3', stack: 's' }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: tc(), boxWidth: 12 } },
      datalabels: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} session${ctx.parsed.y !== 1 ? 's' : ''}` } }
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: tc() } },
      y: { stacked: true, grid: { color: gc() }, ticks: { color: tc(), stepSize: 1 },
           title: { display: true, text: 'Sessions', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 14 — Avg kWh per session by month
   ════════════════════════════════════════════════════════ */
mkChart('chartAvgSession', {
  type: 'line',
  data: {
    labels: allMonths.map(monthLabel),
    datasets: [{
      label: 'Avg kWh/session',
      data: allMonths.map(m => +(monthly[m].kwh / monthly[m].sessions).toFixed(1)),
      borderColor: C_VIOLET,
      backgroundColor: 'rgba(93,63,211,0.12)',
      fill: true, borderWidth: 2.5,
      pointRadius: 4, pointBackgroundColor: C_VIOLET,
      tension: 0.35
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true, anchor: 'top', align: 'top',
        color: tc(), font: { size: 9 },
        formatter: v => v
      },
      tooltip: { callbacks: { label: ctx => ` Avg: ${ctx.parsed.y.toFixed(1)} kWh/session` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tc() } },
      y: { grid: { color: gc() }, ticks: { color: tc() },
           title: { display: true, text: 'kWh', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 15 — Energy by day of week (polar area)
   ════════════════════════════════════════════════════════ */
  const DOW_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dowKwh = [0,0,0,0,0,0,0];
  sl.forEach(s => dowKwh[s.dow] += s.kwh);

mkChart('chartDayOfWeek', {
  type: 'polarArea',
  data: {
    labels: DOW_LABELS,
    datasets: [{
      data: dowKwh.map(v => +v.toFixed(1)),
      backgroundColor: [
        'rgba(93,63,211,0.70)',
        'rgba(2,136,209,0.70)',
        'rgba(46,204,113,0.70)',
        'rgba(243,156,18,0.70)',
        'rgba(231,76,60,0.70)',
        'rgba(123,31,162,0.70)',
        'rgba(101,168,68,0.70)'
      ],
      borderColor: isDark() ? '#252525' : '#ffffff',
      borderWidth: 2
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: tc(), boxWidth: 11, padding: 9,
          generateLabels: chart => {
            const ds = chart.data.datasets[0];
            const tot = ds.data.reduce((a,v) => a+v, 0);
            return chart.data.labels.map((lbl, i) => ({
              text: `${lbl}  ${(ds.data[i]/tot*100).toFixed(0)}%`,
              fillStyle: ds.backgroundColor[i],
              strokeStyle: ds.borderColor,
              lineWidth: 0
            }));
          }
        }
      },
      datalabels: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${(+ctx.raw).toFixed(1)} kWh` } }
    },
    scales: {
      r: {
        grid: { color: gc() },
        ticks: { color: '#999', font: { size: 8 }, backdropColor: 'transparent' },
        pointLabels: { color: tc(), font: { size: 11 } }
      }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 16 — Session scatter (kWh over time, by source)
   ════════════════════════════════════════════════════════ */
  const buckets = Object.keys(BUCKET_COLORS);
  const scatterDatasets = buckets.map(b => ({
    label: b,
    data: sl.map((s, i) => s.bucket === b ? { x: i, y: s.kwh, date: s.date } : null).filter(Boolean),
  backgroundColor: BUCKET_COLORS[b] + 'cc',
  pointRadius: 4,
  pointHoverRadius: 7
})).filter(ds => ds.data.length > 0);

mkChart('chartSessionScatter', {
  type: 'scatter',
  data: { datasets: scatterDatasets },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: tc(), boxWidth: 10, padding: 14 } },
      datalabels: { display: false },
      tooltip: { callbacks: { label: ctx => `${ctx.raw.date}: ${ctx.raw.y} kWh` } }
    },
    scales: {
      x: {
        grid: { display: false }, ticks: { display: false },
        title: { display: true, text: 'Sessions (chronological →)', color: '#888' }
      },
      y: {
        grid: { color: gc() }, ticks: { color: tc() },
        title: { display: true, text: 'kWh per session', color: '#888' }
      }
    }
  }
});

/* ════════════════════════════════════════════════════════
   CHART 17 — Session size histogram
   ════════════════════════════════════════════════════════ */
  const bins     = [[0,5],[5,10],[10,15],[15,20],[20,25],[25,30],[30,35],[35,40],[40,45],[45,50],[50,9999]];
  const binLabels = bins.map(([a,b]) => b === 9999 ? '50+' : `${a}–${b}`);
  const binCounts = bins.map(([a,b]) => sl.filter(s => s.kwh >= a && s.kwh < b).length);
const binPalette = [
  '#0288d1','#1878be','#2e68ab','#445898','#5D3FD3',
  '#7230b8','#87219d','#9c1282','#b10367','#f39c12','#FF7A14'
];

mkChart('chartHistogram', {
  type: 'bar',
  data: {
    labels: binLabels,
    datasets: [{
      label: 'Sessions',
      data: binCounts,
      backgroundColor: binPalette,
      borderRadius: 3
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true, anchor: 'end', align: 'top',
        color: tc(), font: { size: 10, weight: 'bold' },
        formatter: v => v || ''
      },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} session${ctx.parsed.y !== 1 ? 's' : ''} (${ctx.label} kWh)` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tc(), font: { size: 9 } } },
      y: { grid: { color: gc() }, ticks: { color: tc() },
           title: { display: true, text: 'Sessions', color: '#888' } }
    }
  }
});

/* ════════════════════════════════════════════════════════
   TOP 10 SESSIONS TABLE
   ════════════════════════════════════════════════════════ */
  const top10 = [...sl].sort((a,b) => b.kwh - a.kwh).slice(0, 10);
  document.getElementById('topSessionsBody').innerHTML = top10.map((s, i) => `
  <tr>
    <td style="color:#888;font-size:0.7rem">#${i+1}</td>
    <td>${s.date}</td>
    <td><span class="badge ${badgeClass(s.bucket)}">${s.bucket}</span></td>
    <td><strong>${s.kwh}</strong></td>
    <td>${s.cost < 0.005 ? '<span style="color:#2ecc71">Free</span>' : fmtUSD(s.cost)}</td>
    <td style="color:#2ecc71;font-weight:700">${fmtUSD(s.saving)}</td>
  </tr>
`).join('');

  /* ════════════════════════════════════════
     NEW SECTION 6 — SEASON OVER SEASON
  ════════════════════════════════════════ */

  // Year-over-year overlay — one line per calendar year, x-axis = month (Jan-Dec)
  const years = [...new Set(sl.map(s => s.month.slice(0,4)))].sort();
  // YoY lines use palette colors in order — always readable on light and dark
  const YEAR_COLORS = [C_BLUE, C_AMBER, C_GREEN, C_VIOLET, C_RED];
  const monthNums = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  mkChart('chartYoY', {
    type: 'line',
    data: {
      labels: MONTH_NAMES,
      datasets: years.map((yr, i) => ({
        label: yr,
        data: monthNums.map(mn => {
          const key = yr + '-' + mn;
          return monthly[key] ? +monthly[key].kwh.toFixed(1) : null;
        }),
        borderColor: YEAR_COLORS[i % YEAR_COLORS.length],
        backgroundColor: YEAR_COLORS[i % YEAR_COLORS.length] + '20',
        borderWidth: 2.5, pointRadius: 4, tension: 0.35,
        spanGaps: false
      }))
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 14 } },
        datalabels: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)} kWh` } }
      },
      scales: {
        x: { grid: { color: gc() }, ticks: { color: tc() } },
        y: { grid: { color: gc() }, ticks: { color: tc() }, beginAtZero: true,
             title: { display: true, text: 'kWh', color: '#888' } }
      }
    }
  });

  // Season avg kWh/session — bucket months into Winter/Spring/Summer/Fall
  function getSeason(m) {
    const mo = parseInt(m.slice(5,7));
    if ([12,1,2].includes(mo))  return 'Winter';
    if ([3,4,5].includes(mo))   return 'Spring';
    if ([6,7,8].includes(mo))   return 'Summer';
    return 'Fall';
  }
  const SEASONS = ['Winter','Spring','Summer','Fall'];
  // Winter=blue (cold), Spring=green (fresh), Summer=amber (warm), Fall=red (cooling)
  const SEASON_COLORS = [C_BLUE, C_GREEN, C_AMBER, C_RED];
  const seasonData = {};
  SEASONS.forEach(s => { seasonData[s] = { kwh: 0, sessions: 0 }; });
  sl.forEach(s => {
    const sn = getSeason(s.month);
    seasonData[sn].kwh += s.kwh;
    seasonData[sn].sessions += 1;
  });
  mkChart('chartSeasonAvg', {
    type: 'bar',
    data: {
      labels: SEASONS,
      datasets: [{
        data: SEASONS.map(s => seasonData[s].sessions ? +(seasonData[s].kwh / seasonData[s].sessions).toFixed(1) : 0),
        backgroundColor: ctx => SEASON_COLORS[ctx.dataIndex] || '#888',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: { display: true, anchor: 'end', align: 'top', color: tc(), font: { size: 11, weight: 'bold' }, formatter: v => v + ' kWh' },
        tooltip: { callbacks: { label: ctx => ` Avg ${ctx.parsed.y.toFixed(1)} kWh/session` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: tc() } },
        y: { grid: { color: gc() }, ticks: { color: tc() }, beginAtZero: true,
             title: { display: true, text: 'Avg kWh/session', color: '#888' } }
      }
    }
  });

  // Free charging index — % of kWh from Work each month
  mkChart('chartFreeIndex', {
    type: 'line',
    data: {
      labels: allMonths.map(monthLabel),
      datasets: [{
        label: '% Free (Work)',
        data: allMonths.map(m => {
          const tot = monthly[m].kwh;
          return tot > 0 ? +((monthly[m].workKwh / tot) * 100).toFixed(1) : 0;
        }),
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46,204,113,0.15)',
        fill: true, borderWidth: 2.5, pointRadius: 3, tension: 0.35
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false }, datalabels: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(1)}% from Work` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: tc() } },
        y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v + '%' },
             min: 0, max: 100, title: { display: true, text: '% Free', color: '#888' } }
      }
    }
  });

  /* ════════════════════════════════════════
     NEW SECTION 7 — ECONOMICS DEEP DIVE
  ════════════════════════════════════════ */

  // Break-even hero
  const totalSavingsAll = sl.reduce((a,s) => a + s.saving, 0);
  const breakEl = document.getElementById('breakevenValue');
  const breakSub = document.getElementById('breakevenSub');
  if (breakEl) {
    countUp(breakEl, totalSavingsAll, v => fmtUSD(v));
    if (breakSub) breakSub.textContent = 'saved vs. driving a ' +
      (gasSavingsRates[0]?.mpg || 27) + 'mpg gas car since ' + (sl[0]?.date || '');
  }

  // 3-month trailing avg for projection
  const last3Months = allMonths.slice(-3);
  const avg3Saving  = last3Months.length
    ? last3Months.reduce((a,m) => a + monthly[m].saving, 0) / last3Months.length
    : 0;
  const el_pM = document.getElementById('projMonthly');
  const el_pY = document.getElementById('projYear');
  const el_pL = document.getElementById('projLifetime');
  if (el_pM) el_pM.textContent = fmtUSD(avg3Saving);
  if (el_pY) el_pY.textContent = fmtUSD(avg3Saving * 12);
  if (el_pL) el_pL.textContent = fmtUSD(avg3Saving * 60);

  // Cost per mile (estimated: kWh × mi/kWh for that month's gs period)
  const cpmData = allMonths.map(m => {
    const monthSessions = sl.filter(s => s.month === m);
    if (!monthSessions.length) return 0;
    const gs       = getGasSavingsObj(monthSessions[monthSessions.length-1].date, monthSessions[monthSessions.length-1].vehicle);
    const kwhTotal = monthly[m].kwh;
    const milesEst = kwhTotal * (gs.mi_per_kwh || 3.0);
    return milesEst > 0 ? +(monthly[m].cost / milesEst * 100).toFixed(2) : 0; // ¢/mile
  });
  mkChart('chartCostPerMile', {
    type: 'line',
    data: {
      labels: allMonths.map(monthLabel),
      datasets: [{
        label: '¢/mile',
        data: cpmData,
        borderColor: C_VIOLET,
        backgroundColor: 'rgba(93,63,211,0.12)',
        fill: true, borderWidth: 2.5, pointRadius: 4, tension: 0.35
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false }, datalabels: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(2)}¢/mile (est.)` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: tc() } },
        y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v + '¢' }, beginAtZero: true,
             title: { display: true, text: '¢/mile (est.)', color: '#888' } }
      }
    }
  });

  // Savings rate % (savings / gasEquiv)
  mkChart('chartSavingsRate2', {
    type: 'bar',
    data: {
      labels: allMonths.map(monthLabel),
      datasets: [{
        data: allMonths.map(m => {
          const ge = monthly[m].gasEquiv;
          return ge > 0 ? +((monthly[m].saving / ge) * 100).toFixed(1) : 0;
        }),
        backgroundColor: ctx => {
          const m   = allMonths[ctx.dataIndex];
          const pct = m && monthly[m]?.gasEquiv > 0 ? monthly[m].saving / monthly[m].gasEquiv * 100 : 0;
          return pct >= 70 ? '#2ecc71' : pct >= 40 ? '#f39c12' : '#e74c3c';
        },
        borderRadius: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false }, datalabels: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(1)}% saved vs. gas` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: tc() } },
        y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v + '%' }, beginAtZero: true,
             title: { display: true, text: '% of gas cost saved', color: '#888' } }
      }
    }
  });

  // Projection trend — trailing 3-month rolling avg savings
  const projTrend = allMonths.map((m, i) => {
    const window = allMonths.slice(Math.max(0, i-2), i+1);
    const avg = window.reduce((a, wm) => a + monthly[wm].saving, 0) / window.length;
    return +avg.toFixed(2);
  });
  mkChart('chartProjection', {
    type: 'line',
    data: {
      labels: allMonths.map(monthLabel),
      datasets: [
        { label: 'Monthly Savings', data: allMonths.map(m => +monthly[m].saving.toFixed(2)),
          borderColor: '#2ecc71', backgroundColor: 'rgba(46,204,113,0.15)', fill: true, borderWidth: 1.5, pointRadius: 2, tension: 0.2 },
        { label: '3-Mo Rolling Avg', data: projTrend,
          borderColor: '#f39c12', borderWidth: 2.5, pointRadius: 0, tension: 0.4, borderDash: [6,3] }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 10 } },
        datalabels: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtUSD(ctx.parsed.y)}` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: tc() } },
        y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => '$' + v.toFixed(0) },
             title: { display: true, text: 'Savings ($)', color: '#888' } }
      }
    }
  });

  /* ════════════════════════════════════════
     NEW SECTION 8 — ROAD TRIP DETECTION
  ════════════════════════════════════════ */
  (function buildRoadTrips(sl) {
    const container = document.getElementById('roadTripContainer');
    if (!container) return;

    // ── Haversine distance in miles between two lat/lng points ──
    function haversineMiles(lat1, lng1, lat2, lng2) {
      const R  = 3958.8; // Earth radius in miles
      const dL = (lat2 - lat1) * Math.PI / 180;
      const dG = (lng2 - lng1) * Math.PI / 180;
      const a  = Math.sin(dL/2)**2
               + Math.cos(lat1 * Math.PI/180)
               * Math.cos(lat2 * Math.PI/180)
               * Math.sin(dG/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    // Home coordinates from _data/locations.yml (first Home entry)
    const homeLoc = (locationData || []).find(l => l.location === 'Home');
    const homeLat = homeLoc?.lat || 42.3714;
    const homeLng = homeLoc?.lng || -83.4702;
    const TRIP_RADIUS_MI = 50; // sessions closer than this aren't "road trips"
    const TRIP_WINDOW_DAYS = 5; // sessions within this many days cluster into one trip

    // Build a fast distance lookup: location name → miles from home
    const distCache = {};
    function distFromHome(locationName) {
      if (distCache[locationName] !== undefined) return distCache[locationName];
      const entry = (locationData || []).find(l => l.location === locationName);
      if (!entry || !entry.lat || !entry.lng) {
        // Unknown coords — include by default (don't accidentally hide real trips)
        return distCache[locationName] = 999;
      }
      return distCache[locationName] = haversineMiles(homeLat, homeLng, entry.lat, entry.lng);
    }

    // Public sessions = not Home and not Work, AND >50 miles from home
    const pubSessions = sl
      .filter(s => s.bucket !== 'Home' && s.bucket !== 'Work')
      .filter(s => distFromHome(s.location) >= TRIP_RADIUS_MI)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!pubSessions.length) {
      container.innerHTML = '<p style="color:#888;font-size:0.85rem">No road trips detected yet — public charging sessions more than 50 miles from home will appear here.</p>';
      return;
    }

    // Group sessions within TRIP_WINDOW_DAYS of each other into one trip
    const trips = [];
    let currentTrip = [pubSessions[0]];
    for (let i = 1; i < pubSessions.length; i++) {
      const prev    = new Date(pubSessions[i-1].date + 'T12:00:00');
      const curr    = new Date(pubSessions[i].date   + 'T12:00:00');
      const diffDays = (curr - prev) / 86400000;
      if (diffDays <= TRIP_WINDOW_DAYS) {
        currentTrip.push(pubSessions[i]);
      } else {
        trips.push(currentTrip);
        currentTrip = [pubSessions[i]];
      }
    }
    trips.push(currentTrip);

    // Build trip cards HTML — most recent first
    const tripHTML = trips.slice().reverse().map((trip, ti, arr) => {
      const tripNum   = arr.length - ti; // descending number so Trip 9 stays Trip 9
      const kwh       = trip.reduce((a,s) => a + s.kwh, 0);
      const cost      = trip.reduce((a,s) => a + s.cost, 0);
      const saving    = trip.reduce((a,s) => a + s.saving, 0);
      const locs      = [...new Set(trip.map(s => s.location))];
      const dateRange = trip.length === 1
        ? trip[0].date
        : trip[0].date + ' – ' + trip[trip.length-1].date;
      const isFree    = cost < 0.01;
      const savingColor = saving < 0 ? '#e74c3c' : '#2ecc71'; // red if electricity cost more than gas

      // Furthest stop distance for a fun stat
      const maxDist = Math.round(Math.max(...locs.map(l => distFromHome(l))));
      const distLabel = maxDist < 999 ? maxDist + ' mi from home' : '';

      return `<div style="background:var(--dash-card);border:1px solid var(--dash-border);border-radius:12px;padding:16px 20px;margin-bottom:12px;transition:box-shadow 0.2s" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow=''">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
          <div style="flex:1;min-width:200px">
            <div style="font-weight:700;font-size:0.92rem;display:flex;align-items:center;gap:8px">
              🚗 Trip ${tripNum}
              <span style="color:#888;font-weight:400;font-size:0.78rem">${dateRange}</span>
              ${distLabel ? `<span style="font-size:0.68rem;background:var(--dash-border);padding:2px 8px;border-radius:10px;color:#888">${distLabel}</span>` : ''}
            </div>
            <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:5px">
              ${locs.map(l => `<span class="badge ${badgeClass(getBucket(l))}">${l}</span>`).join('')}
            </div>
          </div>
          <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center">
            <div style="text-align:center">
              <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">Charged</div>
              <div style="font-weight:800;font-size:1.05rem">${kwh.toFixed(1)} kWh</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">Cost</div>
              <div style="font-weight:800;font-size:1.05rem">${isFree ? '<span style="color:#2ecc71">Free</span>' : fmtUSD(cost)}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">Saved vs Gas</div>
              <div style="font-weight:800;font-size:1.05rem;color:${savingColor}">${fmtUSD(saving)}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">Stops</div>
              <div style="font-weight:800;font-size:1.05rem">${trip.length}</div>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    container.innerHTML = tripHTML ||
      '<p style="color:#888;font-size:0.85rem">No qualifying road trips found.</p>';
  })(sl);

  /* ════════════════════════════════════════
     NEW SECTION 9 — VEHICLE COMPARISON
     Only shown when 2+ vehicles have data
  ════════════════════════════════════════ */
  (function buildVehicleComparison(sl) {
    const vehiclesInData = [...new Set(sl.map(s => s.vehicle))].sort();
    const section  = document.getElementById('vehicleCompSection');
    const navLink  = document.getElementById('navVehicleComp');
    if (vehiclesInData.length < 2) {
      if (section) section.style.display = 'none';
      if (navLink) navLink.style.display = 'none';
      return;
    }
    if (section) section.style.display = '';
    if (navLink) navLink.style.display = '';

    // Per-vehicle colors
    const VEH_COLORS = ['#3498db','#e74c3c','#2ecc71','#f39c12','#9b59b6','#1abc9c'];
    const vehColorMap = {};
    vehiclesInData.forEach((v, i) => { vehColorMap[v] = VEH_COLORS[i % VEH_COLORS.length]; });

    // Per-vehicle aggregates
    const vehStats = {};
    vehiclesInData.forEach(v => {
      const vs = sl.filter(s => s.vehicle === v);
      const kwh     = vs.reduce((a,s) => a + s.kwh, 0);
      const cost    = vs.reduce((a,s) => a + s.cost, 0);
      const saving  = vs.reduce((a,s) => a + s.saving, 0);
      const gs      = vs.length ? getGasSavingsObj(vs[vs.length-1].date, v) : { mi_per_kwh: 3.0 };
      const milesEst = kwh * (gs.mi_per_kwh || 3.0);
      vehStats[v] = { kwh, cost, saving, sessions: vs.length, milesEst,
        avgKwh: vs.length ? kwh / vs.length : 0,
        cpm: milesEst > 0 ? cost / milesEst * 100 : 0 };
    });

    // Comparison cards
    const cardsEl = document.getElementById('vehicleCompCards');
    if (cardsEl) {
      cardsEl.innerHTML = vehiclesInData.map(v => {
        const st = vehStats[v];
        const c  = vehColorMap[v];
        return `<div style="background:var(--dash-card);border:2px solid ${c}40;border-radius:12px;padding:18px 16px">
          <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${c};margin-bottom:12px;border-bottom:1px solid ${c}30;padding-bottom:8px">${v}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div><div style="font-size:0.58rem;text-transform:uppercase;color:#888">Total kWh</div><div style="font-weight:800;font-size:1.1rem">${st.kwh.toFixed(1)}</div></div>
            <div><div style="font-size:0.58rem;text-transform:uppercase;color:#888">Sessions</div><div style="font-weight:800;font-size:1.1rem">${st.sessions}</div></div>
            <div><div style="font-size:0.58rem;text-transform:uppercase;color:#888">Avg kWh</div><div style="font-weight:800;font-size:1.1rem">${st.avgKwh.toFixed(1)}</div></div>
            <div><div style="font-size:0.58rem;text-transform:uppercase;color:#888">¢/mile (est)</div><div style="font-weight:800;font-size:1.1rem">${st.cpm.toFixed(2)}¢</div></div>
            <div><div style="font-size:0.58rem;text-transform:uppercase;color:#888">Total Cost</div><div style="font-weight:800;font-size:1.1rem">${fmtUSD(st.cost)}</div></div>
            <div><div style="font-size:0.58rem;text-transform:uppercase;color:#888">Gas Savings</div><div style="font-weight:800;font-size:1.1rem;color:#2ecc71">${fmtUSD(st.saving)}</div></div>
          </div>
        </div>`;
      }).join('');
    }

    // Chart: Monthly kWh by vehicle
    mkChart('chartVehicleKwh', {
      type: 'bar',
      data: {
        labels: allMonths.map(monthLabel),
        datasets: vehiclesInData.map(v => ({
          label: v,
          data: allMonths.map(m => +sl.filter(s => s.vehicle === v && s.month === m).reduce((a,s) => a+s.kwh, 0).toFixed(1)),
          backgroundColor: vehColorMap[v], borderRadius: 3, stack: 's'
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 10 } },
          datalabels: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} kWh` } }
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: tc() } },
          y: { stacked: true, grid: { color: gc() }, ticks: { color: tc() }, beginAtZero: true }
        }
      }
    });

    // Chart: Avg kWh/session by vehicle (bar)
    mkChart('chartVehicleAvgSession', {
      type: 'bar',
      data: {
        labels: vehiclesInData,
        datasets: [{
          data: vehiclesInData.map(v => +vehStats[v].avgKwh.toFixed(1)),
          backgroundColor: vehiclesInData.map(v => vehColorMap[v]),
          borderRadius: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
          legend: { display: false },
          datalabels: { display: true, anchor: 'end', align: 'right', color: tc(), formatter: v => v + ' kWh' },
          tooltip: { callbacks: { label: ctx => ` Avg ${ctx.parsed.x.toFixed(1)} kWh/session` } }
        },
        scales: {
          x: { grid: { color: gc() }, ticks: { color: tc() }, beginAtZero: true },
          y: { grid: { display: false }, ticks: { color: tc() } }
        }
      }
    });

    // Chart: cost per mile comparison
    mkChart('chartVehicleCpm', {
      type: 'bar',
      data: {
        labels: vehiclesInData,
        datasets: [{
          data: vehiclesInData.map(v => +vehStats[v].cpm.toFixed(2)),
          backgroundColor: vehiclesInData.map(v => vehColorMap[v]),
          borderRadius: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
          legend: { display: false },
          datalabels: { display: true, anchor: 'end', align: 'right', color: tc(), formatter: v => v + '¢' },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x.toFixed(2)}¢/mile (est.)` } }
        },
        scales: {
          x: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v + '¢' }, beginAtZero: true },
          y: { grid: { display: false }, ticks: { color: tc() } }
        }
      }
    });

    // Chart: session size histogram per vehicle
    const BINS = [[0,10],[10,20],[20,30],[30,40],[40,50],[50,999]];
    const BIN_LABELS = BINS.map(([a,b]) => b===999 ? '50+' : `${a}–${b}`);
    mkChart('chartVehicleHistogram', {
      type: 'bar',
      data: {
        labels: BIN_LABELS,
        datasets: vehiclesInData.map(v => ({
          label: v,
          data: BINS.map(([a,b]) => sl.filter(s => s.vehicle === v && s.kwh >= a && s.kwh < b).length),
          backgroundColor: vehColorMap[v] + 'bb', borderRadius: 4
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 10 } },
          datalabels: { display: false }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: tc() } },
          y: { grid: { color: gc() }, ticks: { color: tc() }, beginAtZero: true,
               title: { display: true, text: 'Sessions', color: '#888' } }
        }
      }
    });

    // Chart: monthly efficiency (kWh/est-mile) per vehicle — shows LFP vs NCM winter divergence
    mkChart('chartVehicleEfficiency', {
      type: 'line',
      data: {
        labels: allMonths.map(monthLabel),
        datasets: vehiclesInData.map(v => {
          const data = allMonths.map(m => {
            const ms  = sl.filter(s => s.vehicle === v && s.month === m);
            if (!ms.length) return null;
            const gs  = getGasSavingsObj(ms[ms.length-1].date, v);
            const kwh = ms.reduce((a,s) => a+s.kwh, 0);
            const mi  = kwh * (gs.mi_per_kwh || 3.0);
            return mi > 0 ? +(kwh / mi * 100).toFixed(2) : null; // kWh/100mi
          });
          return { label: v, data, borderColor: vehColorMap[v], borderWidth: 2.5,
                   pointRadius: 4, tension: 0.35, spanGaps: false };
        })
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 10 } },
          datalabels: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(2)} kWh/100mi (est.)` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: tc() } },
          y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v + ' kWh/100mi' }, beginAtZero: false,
               title: { display: true, text: 'kWh / 100 miles (est.)', color: '#888' } }
        }
      }
    });

  })(sessions); // pass all sessions — vehicle comparison always uses full fleet data

  /* ════════════════════════════════════════
     SECTION 10 — SESSION DETAIL ANALYTICS
     Only uses sessions that have SOC data
  ════════════════════════════════════════ */
  (function buildSessionDetail(sl) {

    // Helper: parse datetime from stored fields
    // startDate + startTime → Date object
    // session date + endTime → Date object
    function parseStart(s) {
      if (!s.startDate || !s.startTime) return null;
      return new Date(s.startDate + 'T' + s.startTime + ':00');
    }
    function parseEnd(s) {
      if (!s.endTime) return null;
      // End is on session date
      return new Date(s.date + 'T' + s.endTime + ':00');
    }
    function durationHours(s) {
      const st = parseStart(s), en = parseEnd(s);
      if (!st || !en) return null;
      let diff = (en - st) / 3600000;
      // Handle overnight: if end < start, add 24h
      if (diff < 0) diff += 24;
      return diff > 0 ? diff : null;
    }

    // Sessions with SOC data
    const socSessions = sl.filter(s => s.socAdded > 0 && s.socStart >= 0 && s.socEnd > 0);
    // Sessions with timing data
    const timeSessions = sl.filter(s => parseStart(s) && parseEnd(s));

    // Update subtitle
    const countEl = document.getElementById('detailSessionCount');
    if (countEl) {
      countEl.textContent = `${socSessions.length} sessions with SOC data · ${timeSessions.length} with timing`;
    }

    // Show/hide UBE reference cards based on vehicles present
    const vehicles = [...new Set(sl.map(s => s.vehicle))];
    const hasGT = vehicles.some(v => v.includes('GT'));
    const hasSR = vehicles.some(v => v.includes('SR') || v.includes('LFP'));
    const gtCard = document.getElementById('ubeCardGT');
    const srCard = document.getElementById('ubeCardSR');
    if (gtCard) gtCard.style.display = hasGT ? '' : 'none';
    if (srCard) srCard.style.display = hasSR ? '' : 'none';

    if (!socSessions.length && !timeSessions.length) {
      document.getElementById('detailSection').style.display = 'none';
      document.getElementById('navSessionDetail').style.display = 'none';
      return;
    }
    document.getElementById('detailSection').style.display = '';
    document.getElementById('navSessionDetail').style.display = '';

    // ── Histogram helper ──
    function hist(values, binCount, min, max) {
      const step = (max - min) / binCount;
      const bins = Array.from({length: binCount}, (_, i) => ({
        label: Math.round(min + i * step) + '–' + Math.round(min + (i+1) * step),
        count: 0
      }));
      values.forEach(v => {
        let idx = Math.floor((v - min) / step);
        if (idx < 0) idx = 0;
        if (idx >= binCount) idx = binCount - 1;
        bins[idx].count++;
      });
      return bins;
    }

    // ── 1. SOC Start histogram ──
    if (socSessions.length) {
      const bins = hist(socSessions.map(s => s.socStart), 10, 0, 100);
      mkChart('chartSocStart', {
        type: 'bar',
        data: {
          labels: bins.map(b => b.label + '%'),
          datasets: [{ data: bins.map(b => b.count), backgroundColor: C_AMBER, borderRadius: 4 }]
        },
        options: { responsive:true, maintainAspectRatio:false,
          plugins: { legend:{display:false}, datalabels:{display:false},
            tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y} sessions`}} },
          scales: {
            x:{grid:{display:false},ticks:{color:tc(),font:{size:9}}},
            y:{grid:{color:gc()},ticks:{color:tc()},beginAtZero:true,
               title:{display:true,text:'Sessions',color:'#888'}}
          }
        }
      });

      // ── 2. SOC End histogram ──
      const binsEnd = hist(socSessions.map(s => s.socEnd), 10, 0, 100);
      mkChart('chartSocEnd', {
        type: 'bar',
        data: {
          labels: binsEnd.map(b => b.label + '%'),
          datasets: [{ data: binsEnd.map(b => b.count),
            backgroundColor: ctx => {
              const label = binsEnd[ctx.dataIndex]?.label || '';
              const mid = parseInt(label);
              return mid >= 90 ? C_GREEN : mid >= 70 ? C_BLUE : C_VIOLET;
            }, borderRadius: 4 }]
        },
        options: { responsive:true, maintainAspectRatio:false,
          plugins: { legend:{display:false}, datalabels:{display:false},
            tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y} sessions`}} },
          scales: {
            x:{grid:{display:false},ticks:{color:tc(),font:{size:9}}},
            y:{grid:{color:gc()},ticks:{color:tc()},beginAtZero:true,
               title:{display:true,text:'Sessions',color:'#888'}}
          }
        }
      });

      // ── 3. SOC Added histogram ──
      const binsAdded = hist(socSessions.map(s => s.socAdded), 10, 0, 100);
      mkChart('chartSocAdded', {
        type: 'bar',
        data: {
          labels: binsAdded.map(b => b.label + '%'),
          datasets: [{ data: binsAdded.map(b => b.count), backgroundColor: C_VIOLET, borderRadius: 4 }]
        },
        options: { responsive:true, maintainAspectRatio:false,
          plugins: { legend:{display:false}, datalabels:{display:false},
            tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y} sessions`}} },
          scales: {
            x:{grid:{display:false},ticks:{color:tc(),font:{size:9}}},
            y:{grid:{color:gc()},ticks:{color:tc()},beginAtZero:true,
               title:{display:true,text:'Sessions',color:'#888'}}
          }
        }
      });

      // ── 7. SOC Start vs kWh Scatter ──
      const scatterData = socSessions.map(s => ({ x: s.socStart, y: s.kwh, loc: s.bucket }));
      mkChart('chartSocScatter', {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Sessions',
            data: scatterData,
            backgroundColor: scatterData.map(d => (BUCKET_COLORS[d.loc] || '#888') + 'cc'),
            pointRadius: 5, pointHoverRadius: 7
          }]
        },
        options: { responsive:true, maintainAspectRatio:false,
          plugins: { legend:{display:false}, datalabels:{display:false},
            tooltip:{callbacks:{label:ctx=>` SOC ${ctx.parsed.x}% → ${ctx.parsed.y.toFixed(1)} kWh`}} },
          scales: {
            x:{grid:{color:gc()},ticks:{color:tc(),callback:v=>v+'%'},
               title:{display:true,text:'SOC at Plug-in (%)',color:'#888'},min:0,max:100},
            y:{grid:{color:gc()},ticks:{color:tc()},beginAtZero:true,
               title:{display:true,text:'kWh Added',color:'#888'}}
          }
        }
      });

      // ── 8. Avg SOC start/end by location grouped bar ──
      const locBuckets = [...new Set(socSessions.map(s => s.bucket))];
      mkChart('chartSocByLoc', {
        type: 'bar',
        data: {
          labels: locBuckets,
          datasets: [
            { label: 'Avg Plug-in SOC',
              data: locBuckets.map(b => {
                const g = socSessions.filter(s => s.bucket === b);
                return g.length ? +(g.reduce((a,s)=>a+s.socStart,0)/g.length).toFixed(1) : null;
              }),
              backgroundColor: C_AMBER, borderRadius: 4 },
            { label: 'Avg Unplug SOC',
              data: locBuckets.map(b => {
                const g = socSessions.filter(s => s.bucket === b);
                return g.length ? +(g.reduce((a,s)=>a+s.socEnd,0)/g.length).toFixed(1) : null;
              }),
              backgroundColor: C_GREEN, borderRadius: 4 }
          ]
        },
        options: { responsive:true, maintainAspectRatio:false,
          plugins: {
            legend:{display:true,position:'top',labels:{color:tc(),boxWidth:12,padding:10}},
            datalabels:{display:false},
            tooltip:{callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}%`}}
          },
          scales: {
            x:{grid:{display:false},ticks:{color:tc()}},
            y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>v+'%'},min:0,max:100,
               title:{display:true,text:'SOC (%)',color:'#888'}}
          }
        }
      });

      // ── 9. SOC Start over time trend ──
      const socTimeSorted = [...socSessions].sort((a,b) => a.date.localeCompare(b.date));
      mkChart('chartSocStartTrend', {
        type: 'line',
        data: {
          labels: socTimeSorted.map(s => s.date),
          datasets: [{
            label: 'SOC at Plug-in',
            data: socTimeSorted.map(s => s.socStart),
            borderColor: C_AMBER,
            backgroundColor: 'rgba(243,156,18,0.08)',
            fill: true, pointRadius: 3, tension: 0.2, borderWidth: 1.5
          }]
        },
        options: { responsive:true, maintainAspectRatio:false,
          plugins:{legend:{display:false},datalabels:{display:false},
            tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y}% at plug-in`}}},
          scales:{
            x:{grid:{display:false},ticks:{color:tc(),maxTicksLimit:8,maxRotation:45}},
            y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>v+'%'},min:0,max:100,
               title:{display:true,text:'SOC at Plug-in (%)',color:'#888'}}
          }
        }
      });

      // ── Battery health (UBE estimate) ──
      const ubeSessions = socSessions.filter(s => s.socAdded >= 5); // filter tiny charges — too noisy
      if (ubeSessions.length) {
        const vehColors = {'2025 Mach-E GT':C_BLUE,'2026 Mach-E SR':C_BLUE,
                          "LRB's 2025 Mach-E GT":C_PURPLE,"LRB's 2026 Mach-E SR":C_PURPLE};
        const ubeByVeh = {};
        ubeSessions.forEach(s => {
          if (!ubeByVeh[s.vehicle]) ubeByVeh[s.vehicle] = [];
          const est = s.kwh / (s.socAdded / 100);
          if (est > 40 && est < 130) ubeByVeh[s.vehicle].push({ date: s.date, ube: +est.toFixed(1) });
        });
        const ubeDatasets = Object.entries(ubeByVeh).map(([v, pts]) => ({
          label: v,
          data: pts.map(p => ({ x: p.date, y: p.ube })),
          borderColor: vehColors[v] || C_VIOLET,
          backgroundColor: (vehColors[v] || C_VIOLET) + '22',
          pointRadius: 4, tension: 0.2, borderWidth: 1.5, fill: false
        }));
        // Add rated UBE reference lines
        const allVehs = [...new Set(ubeSessions.map(s => s.vehicle))];
        const ratedLines = [...new Set(allVehs.map(v => VEHICLE_UBE[v] || 91.7))];
        ratedLines.forEach(ube => {
          const label = ube === 91.7 ? 'GT Rated 91.7 kWh' : 'SR Rated 72.6 kWh';
          const allDates = ubeSessions.map(s => s.date).sort();
          ubeDatasets.push({
            label,
            data: [{ x: allDates[0], y: ube }, { x: allDates[allDates.length-1], y: ube }],
            borderColor: ube === 91.7 ? C_BLUE : C_PURPLE,
            borderDash: [8, 4], borderWidth: 2, pointRadius: 0, fill: false
          });
        });
        mkChart('chartBatteryHealth', {
          type: 'line',
          data: { datasets: ubeDatasets },
          options: { responsive:true, maintainAspectRatio:false,
            plugins:{
              legend:{display:true,position:'top',labels:{color:tc(),boxWidth:12,padding:10}},
              datalabels:{display:false},
              tooltip:{callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)} kWh`}}
            },
            scales:{
              x:{type:'category',grid:{color:gc()},ticks:{color:tc(),maxTicksLimit:10,maxRotation:45}},
              y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>v+' kWh'},
                 title:{display:true,text:'Estimated UBE (kWh)',color:'#888'},min:40}
            }
          }
        });
      }
    }

    // ── 4 & 5. Duration and Rate charts (need timing data) ──
    if (timeSessions.length) {
      const durations = timeSessions.map(s => durationHours(s)).filter(Boolean);

      const durBins = hist(durations, 10, 0, Math.min(Math.ceil(Math.max(...durations)), 24));
      mkChart('chartDuration', {
        type: 'bar',
        data: {
          labels: durBins.map(b => b.label + 'h'),
          datasets: [{ data: durBins.map(b => b.count), backgroundColor: C_VIOLET, borderRadius: 4 }]
        },
        options: { responsive:true, maintainAspectRatio:false,
          plugins:{legend:{display:false},datalabels:{display:false},
            tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y} sessions`}}},
          scales:{
            x:{grid:{display:false},ticks:{color:tc(),font:{size:9}}},
            y:{grid:{color:gc()},ticks:{color:tc()},beginAtZero:true,
               title:{display:true,text:'Sessions',color:'#888'}}
          }
        }
      });

      // Avg charge rate by location (kW = kWh / hours)
      const rateBuckets = [...new Set(timeSessions.map(s => s.bucket))];
      const rateByBucket = rateBuckets.map(b => {
        const g = timeSessions.filter(s => s.bucket === b);
        const rates = g.map(s => {
          const h = durationHours(s);
          return h && h > 0 ? s.kwh / h : null;
        }).filter(Boolean);
        return rates.length ? +(rates.reduce((a,v)=>a+v,0)/rates.length).toFixed(1) : 0;
      });
      mkChart('chartAvgRate', {
        type: 'bar',
        data: {
          labels: rateBuckets,
          datasets: [{
            data: rateByBucket,
            backgroundColor: rateBuckets.map(b => BUCKET_COLORS[b] || '#888'),
            borderRadius: 6
          }]
        },
        options: { responsive:true, maintainAspectRatio:false, indexAxis:'y',
          plugins:{legend:{display:false},datalabels:{display:false},
            tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.x.toFixed(1)} kW avg (incl. idle)`}}},
          scales:{
            x:{grid:{color:gc()},ticks:{color:tc(),callback:v=>v+' kW'},beginAtZero:true,
               title:{display:true,text:'kW (avg, includes idle time)',color:'#888'}},
            y:{grid:{display:false},ticks:{color:tc()}}
          }
        }
      });

      // ── 6. Plug-in hour polar/bar chart ──
      const hours = timeSessions.map(s => {
        const st = parseStart(s);
        return st ? st.getHours() : null;
      }).filter(h => h !== null);
      const hourBins = Array(24).fill(0);
      hours.forEach(h => hourBins[h]++);
      const hourLabels = Array.from({length:24}, (_,i) =>
        i === 0 ? '12am' : i < 12 ? i+'am' : i === 12 ? '12pm' : (i-12)+'pm'
      );
      mkChart('chartPluginHour', {
        type: 'bar',
        data: {
          labels: hourLabels,
          datasets: [{
            data: hourBins,
            backgroundColor: hourBins.map((_, i) => {
              // Color by time of day: night=purple, morning=amber, day=blue, evening=violet
              if (i >= 22 || i < 6)  return C_PURPLE;
              if (i >= 6  && i < 10) return C_AMBER;
              if (i >= 10 && i < 17) return C_BLUE;
              return C_VIOLET;
            }),
            borderRadius: 3
          }]
        },
        options: { responsive:true, maintainAspectRatio:false,
          plugins:{legend:{display:false},datalabels:{display:false},
            tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y} plug-ins at ${hourLabels[ctx.dataIndex]}`}}},
          scales:{
            x:{grid:{display:false},ticks:{color:tc(),font:{size:9},maxRotation:45}},
            y:{grid:{color:gc()},ticks:{color:tc()},beginAtZero:true,
               title:{display:true,text:'Sessions',color:'#888'}}
          }
        }
      });
    }

  })(sl);

  /* ════════════════════════════════════════
     SECTION 11 — REAL-WORLD EFFICIENCY
     Only sessions with milesAdded > 0
  ════════════════════════════════════════ */
  (function buildEfficiency(sl) {
    const effSl = sl.filter(s => s.hasRealEff);
    const section = document.getElementById('efficiencySection');
    const navEl   = document.getElementById('navEfficiency');
    const stickyNavEl = document.getElementById('stickyNavEff');

    if (!effSl.length) {
      if (section) section.style.display = 'none';
      if (navEl)   navEl.style.display = 'none';
      if (stickyNavEl) stickyNavEl.style.display = 'none';
      return;
    }
    if (section) section.style.display = '';
    if (navEl)   navEl.style.display = '';
    if (stickyNavEl) stickyNavEl.style.display = '';

    // Count label
    const countEl = document.getElementById('effSessionCount');
    if (countEl) countEl.textContent = `${effSl.length} of ${sl.length} sessions have FordPass miles data`;

    // ── KPI values ──
    const effValues = effSl.map(s => s.realMiPerKwh);
    const avgMiKwh  = effValues.reduce((a,v) => a+v, 0) / effValues.length;
    const avgWhMi   = 1000 / avgMiKwh;
    const bestSess  = effSl.reduce((a,s) => s.realMiPerKwh > a.realMiPerKwh ? s : a, effSl[0]);
    const worstSess = effSl.reduce((a,s) => s.realMiPerKwh < a.realMiPerKwh ? s : a, effSl[0]);

    const setKpi = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setKpi('effAvgMiKwh', avgMiKwh.toFixed(2) + ' mi/kWh');
    setKpi('effAvgWhMi',  Math.round(avgWhMi)  + ' Wh/mi');
    setKpi('effBest',     bestSess.realMiPerKwh.toFixed(2)  + ' mi/kWh');
    setKpi('effWorst',    worstSess.realMiPerKwh.toFixed(2) + ' mi/kWh');

    // Sort by date for trend charts
    const sorted = [...effSl].sort((a,b) => a.date.localeCompare(b.date));
    const dates  = sorted.map(s => s.date);
    const miKwhArr = sorted.map(s => +s.realMiPerKwh.toFixed(3));

    // Rolling 5-session average
    const rolling5 = miKwhArr.map((_, i) => {
      const w = miKwhArr.slice(Math.max(0, i-4), i+1);
      return +(w.reduce((a,v) => a+v, 0) / w.length).toFixed(3);
    });

    // ── 1. Efficiency trend + rolling avg ──
    mkChart('chartEffTrend', {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          { label: 'Session mi/kWh', data: miKwhArr,
            borderColor: C_BLUE, backgroundColor: 'rgba(2,136,209,0.08)',
            fill: true, pointRadius: 3, tension: 0.2, borderWidth: 1.5 },
          { label: '5-session avg', data: rolling5,
            borderColor: C_AMBER, borderWidth: 2.5, pointRadius: 0,
            tension: 0.4, borderDash: [5,3] }
        ]
      },
      options: { responsive:true, maintainAspectRatio:false,
        plugins: {
          legend:{display:true,position:'top',labels:{color:tc(),boxWidth:12,padding:10}},
          datalabels:{display:false},
          tooltip:{callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} mi/kWh`}}
        },
        scales: {
          x:{grid:{display:false},ticks:{color:tc(),maxTicksLimit:10,maxRotation:45}},
          y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>parseFloat(v).toFixed(2)+' mi/kWh'},
             title:{display:true,text:'mi/kWh',color:'#888'},beginAtZero:false}
        }
      }
    });

    // ── 2. mi/kWh histogram ──
    const step = 0.25;
    const minE = Math.floor(Math.min(...miKwhArr) / step) * step;
    const maxE = Math.ceil( Math.max(...miKwhArr) / step) * step;
    const numBins = Math.round((maxE - minE) / step);
    const effBins = Array.from({length: numBins}, (_, i) => ({
      label: (minE + i*step).toFixed(2) + '–' + (minE + (i+1)*step).toFixed(2),
      count: 0
    }));
    miKwhArr.forEach(v => {
      let idx = Math.floor((v - minE) / step);
      if (idx < 0) idx = 0;
      if (idx >= numBins) idx = numBins - 1;
      effBins[idx].count++;
    });
    mkChart('chartEffHist', {
      type: 'bar',
      data: {
        labels: effBins.map(b => b.label),
        datasets: [{ data: effBins.map(b => b.count),
          backgroundColor: effBins.map(b => {
            const mid = parseFloat(b.label);
            return mid >= 3.5 ? C_GREEN : mid >= 2.5 ? C_BLUE : mid >= 1.8 ? C_AMBER : C_RED;
          }), borderRadius: 4 }]
      },
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false},datalabels:{display:false},
          tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y} sessions`}}},
        scales:{
          x:{grid:{display:false},ticks:{color:tc(),font:{size:9},maxRotation:45}},
          y:{grid:{color:gc()},ticks:{color:tc()},beginAtZero:true,
             title:{display:true,text:'Sessions',color:'#888'}}
        }
      }
    });

    // ── 3. Wh/mi histogram ──
    const whMiArr = sorted.map(s => Math.round(s.realWhPerMi));
    const wStep = 50;
    const minW = Math.floor(Math.min(...whMiArr) / wStep) * wStep;
    const maxW = Math.ceil( Math.max(...whMiArr) / wStep) * wStep;
    const wBins = Math.round((maxW - minW) / wStep);
    const whBins = Array.from({length: wBins}, (_, i) => ({
      label: (minW + i*wStep) + '–' + (minW + (i+1)*wStep),
      count: 0
    }));
    whMiArr.forEach(v => {
      let idx = Math.floor((v - minW) / wStep);
      if (idx < 0) idx = 0;
      if (idx >= wBins) idx = wBins - 1;
      whBins[idx].count++;
    });
    mkChart('chartWhMiHist', {
      type: 'bar',
      data: {
        labels: whBins.map(b => b.label),
        datasets: [{ data: whBins.map(b => b.count),
          backgroundColor: whBins.map(b => {
            const mid = parseInt(b.label);
            return mid <= 250 ? C_GREEN : mid <= 350 ? C_BLUE : mid <= 450 ? C_AMBER : C_RED;
          }), borderRadius: 4 }]
      },
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false},datalabels:{display:false},
          tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y} sessions`}}},
        scales:{
          x:{grid:{display:false},ticks:{color:tc(),font:{size:9},maxRotation:45}},
          y:{grid:{color:gc()},ticks:{color:tc()},beginAtZero:true,
             title:{display:true,text:'Sessions',color:'#888'}}
        }
      }
    });

    // ── 4. Avg efficiency by month ──
    const effMonths = [...new Set(effSl.map(s => s.month))].sort();
    mkChart('chartEffByMonth', {
      type: 'bar',
      data: {
        labels: effMonths.map(monthLabel),
        datasets: [{
          data: effMonths.map(m => {
            const g = effSl.filter(s => s.month === m);
            return g.length ? +(g.reduce((a,s)=>a+s.realMiPerKwh,0)/g.length).toFixed(3) : null;
          }),
          backgroundColor: effMonths.map(m => {
            const mo = parseInt(m.slice(5));
            return [12,1,2].includes(mo) ? C_BLUE :
                   [3,4,5].includes(mo)  ? C_GREEN :
                   [6,7,8].includes(mo)  ? C_AMBER : C_VIOLET;
          }),
          borderRadius: 5
        }]
      },
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false},datalabels:{display:false},
          tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y?.toFixed(2)} mi/kWh avg`}}},
        scales:{
          x:{grid:{display:false},ticks:{color:tc()}},
          y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>parseFloat(v).toFixed(2)+' mi/kWh'},beginAtZero:false,
             title:{display:true,text:'Avg mi/kWh',color:'#888'}}
        }
      }
    });

    // ── 5. Avg efficiency by location ──
    const effBuckets = [...new Set(effSl.map(s => s.bucket))];
    mkChart('chartEffByLoc', {
      type: 'bar',
      data: {
        labels: effBuckets,
        datasets: [{
          data: effBuckets.map(b => {
            const g = effSl.filter(s => s.bucket === b);
            return g.length ? +(g.reduce((a,s)=>a+s.realMiPerKwh,0)/g.length).toFixed(3) : null;
          }),
          backgroundColor: effBuckets.map(b => BUCKET_COLORS[b] || '#888'),
          borderRadius: 5
        }]
      },
      options: { responsive:true, maintainAspectRatio:false, indexAxis:'y',
        plugins:{legend:{display:false},datalabels:{display:false},
          tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.x?.toFixed(2)} mi/kWh avg`}}},
        scales:{
          x:{grid:{color:gc()},ticks:{color:tc(),callback:v=>parseFloat(v).toFixed(2)+' mi/kWh'},beginAtZero:false,
             title:{display:true,text:'Avg mi/kWh',color:'#888'}},
          y:{grid:{display:false},ticks:{color:tc()}}
        }
      }
    });

    // ── 6. Cumulative miles added ──
    let cumMi = 0;
    const cumMiData = sorted.map(s => { cumMi += s.milesAdded; return +cumMi.toFixed(1); });
    mkChart('chartCumMiles', {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Cumulative miles',
          data: cumMiData,
          borderColor: C_GREEN,
          backgroundColor: 'rgba(46,204,113,0.1)',
          fill: true, pointRadius: 0, tension: 0.1, borderWidth: 2
        }]
      },
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false},datalabels:{display:false},
          tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y.toFixed(0)} mi cumulative`}}},
        scales:{
          x:{grid:{display:false},ticks:{color:tc(),maxTicksLimit:8,maxRotation:45}},
          y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>v+' mi'},beginAtZero:true,
             title:{display:true,text:'Miles',color:'#888'}}
        }
      }
    });

    // ── 7. Real vs assumed efficiency per session ──
    const assumedArr = sorted.map(s => {
      const gs = getGasSavingsObj(s.date, s.vehicle);
      return +(gs.mi_per_kwh || 3.0).toFixed(3);
    });
    mkChart('chartEffVsAssumed', {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          { label: 'Real (FordPass)', data: miKwhArr,
            borderColor: C_BLUE, backgroundColor: 'rgba(2,136,209,0.08)',
            fill: true, pointRadius: 3, tension: 0.2, borderWidth: 1.5 },
          { label: 'Assumed (rates.yml)', data: assumedArr,
            borderColor: C_AMBER, borderWidth: 2, pointRadius: 0,
            tension: 0, borderDash: [6,3] }
        ]
      },
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{display:true,position:'top',labels:{color:tc(),boxWidth:12,padding:10}},
          datalabels:{display:false},
          tooltip:{callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} mi/kWh`}}
        },
        scales:{
          x:{grid:{display:false},ticks:{color:tc(),maxTicksLimit:8,maxRotation:45}},
          y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>parseFloat(v).toFixed(2)+' mi/kWh'},beginAtZero:false,
             title:{display:true,text:'mi/kWh',color:'#888'}}
        }
      }
    });

    // ── 8. Efficiency vs SOC at plug-in scatter ──
    const socEffSl = effSl.filter(s => s.socStart > 0);
    if (socEffSl.length) {
      mkChart('chartEffVsSoc', {
        type: 'scatter',
        data: { datasets: [{
          label: 'Sessions',
          data: socEffSl.map(s => ({ x: s.socStart, y: +s.realMiPerKwh.toFixed(3) })),
          backgroundColor: socEffSl.map(s => (BUCKET_COLORS[s.bucket] || '#888') + 'cc'),
          pointRadius: 5, pointHoverRadius: 7
        }] },
        options: { responsive:true, maintainAspectRatio:false,
          plugins:{legend:{display:false},datalabels:{display:false},
            tooltip:{callbacks:{label:ctx=>` SOC ${ctx.parsed.x}% → ${ctx.parsed.y.toFixed(2)} mi/kWh`}}},
          scales:{
            x:{grid:{color:gc()},ticks:{color:tc(),callback:v=>v+'%'},min:0,max:100,
               title:{display:true,text:'SOC at Plug-in (%)',color:'#888'}},
            y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>parseFloat(v).toFixed(2)+' mi/kWh'},beginAtZero:false,
               title:{display:true,text:'Real mi/kWh',color:'#888'}}
          }
        }
      });
    }

    // ── 9. Efficiency vs kWh added scatter ──
    mkChart('chartEffVsKwh', {
      type: 'scatter',
      data: { datasets: [{
        label: 'Sessions',
        data: sorted.map(s => ({ x: s.kwh, y: +s.realMiPerKwh.toFixed(3) })),
        backgroundColor: sorted.map(s => (BUCKET_COLORS[s.bucket] || '#888') + 'cc'),
        pointRadius: 5, pointHoverRadius: 7
      }] },
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false},datalabels:{display:false},
          tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.x.toFixed(1)} kWh → ${ctx.parsed.y.toFixed(2)} mi/kWh`}}},
        scales:{
          x:{grid:{color:gc()},ticks:{color:tc(),callback:v=>v+' kWh'},beginAtZero:true,
             title:{display:true,text:'kWh Added',color:'#888'}},
          y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>parseFloat(v).toFixed(2)+' mi/kWh'},beginAtZero:false,
             title:{display:true,text:'Real mi/kWh',color:'#888'}}
        }
      }
    });

    // ── 10. Gas savings: real vs assumed cumulative ──
    let cumReal = 0, cumAssumed = 0;
    const cumRealArr     = [];
    const cumAssumedArr  = [];
    sorted.forEach(s => {
      const gs = getGasSavingsObj(s.date, s.vehicle);
      const realEff     = s.hasRealEff ? s.realMiPerKwh : (gs.mi_per_kwh || 3.0);
      const assumedEff  = gs.mi_per_kwh || 3.0;
      const gasPrice    = gs.gas_price || 3.26;
      const mpg         = gs.mpg || 27;
      cumReal    += (s.kwh * realEff    / mpg * gasPrice) - s.cost;
      cumAssumed += (s.kwh * assumedEff / mpg * gasPrice) - s.cost;
      cumRealArr.push(+cumReal.toFixed(2));
      cumAssumedArr.push(+cumAssumed.toFixed(2));
    });
    mkChart('chartSavingsRealVsAssumed', {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          { label: 'Real efficiency', data: cumRealArr,
            borderColor: C_GREEN, backgroundColor: 'rgba(46,204,113,0.1)',
            fill: true, pointRadius: 0, tension: 0.2, borderWidth: 2.5 },
          { label: 'Assumed rate', data: cumAssumedArr,
            borderColor: C_AMBER, borderWidth: 2, pointRadius: 0,
            tension: 0.2, borderDash: [6,3] }
        ]
      },
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{display:true,position:'top',labels:{color:tc(),boxWidth:12,padding:10}},
          datalabels:{display:false},
          tooltip:{callbacks:{label:ctx=>` ${ctx.dataset.label}: ${fmtUSD(ctx.parsed.y)} saved`}}
        },
        scales:{
          x:{grid:{display:false},ticks:{color:tc(),maxTicksLimit:8,maxRotation:45}},
          y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>'$'+v.toFixed(0)},
             title:{display:true,text:'Cumulative Savings ($)',color:'#888'}}
        }
      }
    });

  })(sl);

  // ── end section 11 ──

  buildLocationStats(sl);

} // ── end rebuild ──

/* ════════════════════════════════════════════════════════
   INITIALIZE
   ════════════════════════════════════════════════════════ */
let _leafletMap = null;
let _lastSl     = sessions;

buildVehicleFilter();
rebuild(sessions);

// Use window.onload so all external scripts (Leaflet) are guaranteed loaded
// and the DOM is fully painted with real dimensions before we call L.map()
window.addEventListener('load', function() {
  var geoLocs  = Array.isArray(locationData) ? locationData.filter(function(l){ return l.lat && l.lng; }) : [];
  var noCoords = document.getElementById('mapNoCoords');
  var mapEl    = document.getElementById('chargingMap');

  if (!geoLocs.length) {
    if (noCoords) noCoords.style.display = '';
    if (mapEl)    mapEl.style.display    = 'none';
    return;
  }

  try {
    _leafletMap = L.map('chargingMap', { preferCanvas: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(_leafletMap);
    _leafletMap.invalidateSize();
    buildMap(_lastSl);
  } catch(e) {
    console.error('[EV Map] init failed:', e);
    if (noCoords) noCoords.style.display = '';
    if (mapEl)    mapEl.style.display    = 'none';
  }
});

/* ════════════════════════════════════════════════════════
   CHARGING LOCATIONS MAP
   ════════════════════════════════════════════════════════ */
function buildMap(sl) {
  if (!_leafletMap) return; // not yet initialised (window load not fired)

  // Per-location stats
  const stats = {};
  sl.forEach(s => {
    if (!stats[s.location]) stats[s.location] = { kwh: 0, sessions: 0, bucket: s.bucket };
    stats[s.location].kwh      += s.kwh;
    stats[s.location].sessions += 1;
  });

  const geoLocs = (locationData || []).filter(l => l.lat && l.lng);
  if (!geoLocs.length) return;

  // Clear old markers
  _leafletMap.eachLayer(l => { if (!(l instanceof L.TileLayer)) _leafletMap.removeLayer(l); });

  const maxKwh = Math.max(...geoLocs.map(l => (stats[l.location] || {}).kwh || 0), 1);
  const bounds = [];

  geoLocs.forEach(loc => {
    const st    = stats[loc.location] || { kwh: 0, sessions: 0, bucket: getBucket(loc.location) };
    const color = BUCKET_COLORS[st.bucket] || '#888';
    const sz    = Math.round(24 + (st.kwh / maxKwh) * 40);
    const avg   = st.sessions ? (st.kwh / st.sessions).toFixed(1) : '0';
    const popup = `<b>${loc.location}</b>` +
      (loc.city ? `<br><small style="color:#888">${loc.city}</small>` : '') +
      `<br>${st.kwh.toFixed(1)} kWh &nbsp;·&nbsp; ${st.sessions} session${st.sessions !== 1 ? 's' : ''}` +
      `<br>Avg: ${avg} kWh/session`;
    const pin = `<svg class="ev-pin" xmlns="http://www.w3.org/2000/svg" width="18" height="26" viewBox="0 0 18 26"><path d="M9 0C4.03 0 0 4.03 0 9c0 6.75 9 17 9 17s9-10.25 9-17C18 4.03 13.97 0 9 0z" fill="${color}"/><circle cx="9" cy="9" r="4" fill="white" opacity="0.85"/></svg>`;
    const icon = L.divIcon({
      className: 'ev-map-icon',
      html: `<div class="ev-pulse" style="width:${sz}px;height:${sz}px"><div class="ev-dot" style="background:${color}"></div><div class="ev-ring" style="border-color:${color}"></div>${pin}</div>`,
      iconSize:   [sz, sz],
      iconAnchor: [sz / 2, sz / 2]
    });
    L.marker([loc.lat, loc.lng], { icon }).bindPopup(popup).addTo(_leafletMap);
    bounds.push([loc.lat, loc.lng]);
  });

  if (bounds.length === 1) {
    _leafletMap.setView(bounds[0], 13);
  } else if (bounds.length > 1) {
    _leafletMap.fitBounds(bounds, { padding: [40, 40] });
  }
}

/* ════════════════════════════════════════════════════════
   LOCATION STATS TABLE  (sortable + provider grouping)
   ════════════════════════════════════════════════════════ */

function setLocView(v) {
  _locView = v;
  document.querySelectorAll('.loc-view-btn').forEach(b => {
    b.classList.toggle('loc-view-active', b.dataset.view === v);
  });
  renderLocationStats();
}

function buildLocationStats(sl) {
  _locSl = sl;
  // wire sort headers once
  document.querySelectorAll('.loc-sort-hdr').forEach(th => {
    th.onclick = () => {
      const col = th.dataset.col;
      if (_locSortCol === col) {
        _locSortDir = _locSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        _locSortCol = col;
        _locSortDir = col === 'name' ? 'asc' : 'desc';
      }
      renderLocationStats();
    };
  });
  renderLocationStats();
}

function renderLocationStats() {
  const tbody = document.getElementById('locationStatsBody');
  if (!tbody) { console.warn('[LocStats] tbody not found'); return; }
  if (!_locSl.length) { console.warn('[LocStats] _locSl is empty'); return; }
  console.log('[LocStats] rendering', _locSl.length, 'sessions, view:', _locView);

  // Aggregate
  const agg = {};
  _locSl.forEach(s => {
    const key = _locView === 'provider' ? s.bucket : s.location;
    if (!agg[key]) agg[key] = { kwh:0, cost:0, sessions:0, free:0, bucket: s.bucket };
    agg[key].kwh      += s.kwh;
    agg[key].cost     += s.cost;
    agg[key].sessions += 1;
    if (s.isFree) agg[key].free += 1;
    if (_locView === 'provider') agg[key].bucket = s.bucket;
  });

  // Build rows
  let rows = Object.entries(agg).map(([name, d]) => ({
    name,
    bucket:   d.bucket,
    sessions: d.sessions,
    free:     d.free,
    kwh:      d.kwh,
    avgKwh:   d.sessions ? d.kwh  / d.sessions : 0,
    cost:     d.cost,
    avgCost:  d.sessions ? d.cost / d.sessions : 0
  }));

  // Sort
  const col = _locSortCol, dir = _locSortDir === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    const av = col === 'name' ? a.name.toLowerCase() : a[col];
    const bv = col === 'name' ? b.name.toLowerCase() : b[col];
    return av < bv ? -dir : av > bv ? dir : 0;
  });

  // Update header arrows using data-label attribute (avoids textContent mutation)
  document.querySelectorAll('.loc-sort-hdr').forEach(th => {
    const c     = th.dataset.col;
    const base  = th.dataset.label || th.dataset.col; // fall back to col key
    const arrow = c === _locSortCol ? (_locSortDir === 'asc' ? ' ▲' : ' ▼') : '';
    th.textContent = base + arrow;
    th.classList.toggle('loc-sort-active', c === _locSortCol);
  });

  tbody.innerHTML = rows.map((d, i) => {
    const freeCell = d.free > 0
      ? `<span style="color:#2ecc71">${d.free} (${Math.round(d.free/d.sessions*100)}%)</span>`
      : '<span style="color:#888">—</span>';
    const rowColor = 'color:inherit';
    return `<tr style="${rowColor}">
      <td style="color:#888;font-size:0.7rem">#${i+1}</td>
      <td><span class="badge ${badgeClass(d.bucket)}">${d.name}</span></td>
      <td style="text-align:center">${d.sessions}</td>
      <td style="text-align:center">${freeCell}</td>
      <td style="text-align:right"><strong>${d.kwh.toFixed(1)}</strong> kWh</td>
      <td style="text-align:right">${d.avgKwh.toFixed(1)} kWh</td>
      <td style="text-align:right">${d.cost < 0.01 ? '<span style="color:#2ecc71">Free</span>' : fmtUSD(d.cost)}</td>
      <td style="text-align:right">${d.avgCost < 0.005 ? '<span style="color:#2ecc71">Free</span>' : fmtUSD(d.avgCost)}</td>
    </tr>`;
  }).join('');
}

/* ════════════════════════════════════════════════════════
   PERSONAL RECORDS
   ════════════════════════════════════════════════════════ */
function buildRecords(sl, allMonths, monthly, bucketEntries) {
  if (!sl.length) return;
  const bigSession      = [...sl].sort(function(a,b){ return b.kwh - a.kwh; })[0];
  const bestMonthKwh    = allMonths.reduce(function(b,m){ return monthly[m].kwh      > monthly[b].kwh      ? m : b; });
  const bestMonthSaving = allMonths.reduce(function(b,m){ return monthly[m].saving   > monthly[b].saving   ? m : b; });
  const mostSessionsMo  = allMonths.reduce(function(b,m){ return monthly[m].sessions > monthly[b].sessions ? m : b; });

  function fmtKwh(v) {
    return v >= 1000 ? (v / 1000).toFixed(2) + ' MWh' : v.toFixed(0) + ' kWh';
  }

  /* Longest consecutive-day charging streak with date range */
  var uniqDates = [...new Set(sl.map(function(s){ return s.date; }))].sort();
  var maxStreak = 1, curS = 1, maxStreakEnd = uniqDates[0];
  for (var i = 1; i < uniqDates.length; i++) {
    var diff = (new Date(uniqDates[i]+'T12:00:00') - new Date(uniqDates[i-1]+'T12:00:00')) / 86400000;
    if (diff === 1) { curS++; } else { curS = 1; }
    if (curS > maxStreak) { maxStreak = curS; maxStreakEnd = uniqDates[i]; }
  }
  var streakEndDt   = new Date(maxStreakEnd + 'T12:00:00');
  var streakStartDt = new Date(streakEndDt);
  streakStartDt.setDate(streakStartDt.getDate() - (maxStreak - 1));
  var SMONS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmtD(dt) { return SMONS[dt.getMonth()] + ' ' + dt.getDate(); }
  var streakSub = fmtD(streakStartDt) + ' – ' + fmtD(streakEndDt) + ', ' + streakEndDt.getFullYear();

  var recs = [
    { icon:'🔋', label:'Biggest Session',         value: fmtKwh(bigSession.kwh),                          sub: bigSession.date + ' · ' + bigSession.bucket },
    { icon:'📅', label:'Peak Energy Month',        value: fmtKwh(monthly[bestMonthKwh].kwh),               sub: monthLabel(bestMonthKwh) },
    { icon:'💰', label:'Largest Monthly Savings',  value: fmtUSD(monthly[bestMonthSaving].saving),         sub: monthLabel(bestMonthSaving) },
    { icon:'📆', label:'Busiest Month',            value: monthly[mostSessionsMo].sessions + ' sessions',  sub: monthLabel(mostSessionsMo) },
    { icon:'🔌', label:'Longest Streak',           value: maxStreak + (maxStreak === 1 ? ' day' : ' days'), sub: streakSub },
    { icon:'⚡', label:'Favorite Spot',            value: bucketEntries[0][0],                             sub: fmtKwh(bucketEntries[0][1]) + ' all-time' },
  ];

  document.getElementById('recordsGrid').innerHTML = recs.map(function(r){
    return '<div class="record-card">'
      + '<span class="record-icon">'  + r.icon  + '</span>'
      + '<span class="record-label">' + r.label + '</span>'
      + '<span class="record-value">' + r.value + '</span>'
      + '<span class="record-sub">'   + r.sub   + '</span>'
      + '</div>';
  }).join('');
}

/* ════════════════════════════════════════════════════════
   ACTIVITY HEATMAP
   ════════════════════════════════════════════════════════ */
function buildHeatmap(sl) {
  var el = document.getElementById('heatmapContainer');
  if (!el || !sl.length) return;

  var CELL = 16, GAP = 4, W = CELL + GAP;
  var dayMap = {};
  sl.forEach(function(s){ dayMap[s.date] = (dayMap[s.date] || 0) + s.kwh; });

  // Find max kWh in a day for dynamic scaling
  var maxDay = Math.max.apply(null, Object.values(dayMap).concat([1]));

  var first  = new Date(sl[0].date + 'T12:00:00');
  var today  = new Date();
  var origin = new Date(first);
  origin.setDate(origin.getDate() - origin.getDay()); // back to Sunday

  var weeks = [];
  var d = new Date(origin);
  while (d <= today) {
    var wk = [];
    for (var i = 0; i < 7; i++) { wk.push(new Date(d)); d.setDate(d.getDate() + 1); }
    weeks.push(wk);
  }

  // 5-stop palettes with strong contrast between levels
  var PALS = {
    light: ['#e8e8e8', '#d4baf5', '#a67ce0', '#7b1fa2', '#3d0066'],
    dark:  ['#2a2a2a', '#3b2060', '#6a2fa0', '#9c27b0', '#e040fb']
  };

  function cellCol(kwh) {
    var p = isDark() ? PALS.dark : PALS.light;
    if (!kwh || kwh === 0) return p[0];
    var ratio = kwh / maxDay;
    if (ratio < 0.20) return p[1];
    if (ratio < 0.45) return p[2];
    if (ratio < 0.75) return p[3];
    return p[4];
  }

  function localDate(dt) {
    return dt.getFullYear() + '-'
      + String(dt.getMonth()+1).padStart(2,'0') + '-'
      + String(dt.getDate()).padStart(2,'0');
  }

  var MONS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DOWS = ['S','M','T','W','T','F','S'];
  var DOW_LEFT = 24; // px width of day-of-week label column

  function render() {
    var p = isDark() ? PALS.dark : PALS.light;

    /* Month labels — positioned to align with first week of that month */
    var mHtml = '<div style="display:flex;margin-left:' + DOW_LEFT + 'px;margin-bottom:4px;">';
    var lastM = -1;
    weeks.forEach(function(wk) {
      var m = wk[0].getMonth();
      var label = (m !== lastM) ? MONS[m] : '';
      mHtml += '<div style="width:' + W + 'px;flex-shrink:0;font-size:10px;font-weight:600;'
             + 'color:' + (isDark() ? '#aaa' : '#666') + ';white-space:nowrap;overflow:visible;">'
             + label + '</div>';
      lastM = m;
    });
    mHtml += '</div>';

    /* Grid row */
    var gHtml = '<div style="display:flex;align-items:flex-start;">';

    /* Day-of-week labels */
    gHtml += '<div style="display:flex;flex-direction:column;gap:' + GAP + 'px;'
           + 'width:' + DOW_LEFT + 'px;flex-shrink:0;padding-top:0;">';
    DOWS.forEach(function(l, i) {
      var show = [1, 3, 5].indexOf(i) > -1; // Mon, Wed, Fri
      gHtml += '<div style="height:' + CELL + 'px;font-size:10px;font-weight:500;'
             + 'color:' + (isDark() ? '#888' : '#999') + ';'
             + 'line-height:' + CELL + 'px;text-align:right;padding-right:5px;">'
             + (show ? l : '') + '</div>';
    });
    gHtml += '</div>';

    /* Week columns */
    weeks.forEach(function(wk) {
      gHtml += '<div style="display:flex;flex-direction:column;gap:' + GAP + 'px;'
             + 'margin-right:' + GAP + 'px;flex-shrink:0;">';
      wk.forEach(function(day) {
        var ds     = localDate(day);
        var kwh    = dayMap[ds] || 0;
        var future = day > today;
        var tip    = kwh > 0
          ? ds + ': ' + kwh.toFixed(1) + ' kWh'
          : ds;
        var bg = future ? 'transparent' : cellCol(kwh);
        var border = (!future && kwh === 0)
          ? 'border:1px solid ' + (isDark() ? '#3a3a3a' : '#ddd') + ';'
          : '';
        gHtml += '<div data-tip="' + tip + '" style="width:' + CELL + 'px;height:' + CELL + 'px;'
               + 'background:' + bg + ';border-radius:3px;box-sizing:border-box;' + border
               + (kwh ? 'cursor:pointer;' : '') + '"></div>';
      });
      gHtml += '</div>';
    });
    gHtml += '</div>';

    /* Legend — shows actual thresholds */
    var thresh = [0, Math.round(maxDay*0.20), Math.round(maxDay*0.45), Math.round(maxDay*0.75), Math.round(maxDay)];
    var leg = '<div style="display:flex;align-items:center;gap:6px;margin-top:12px;'
            + 'margin-left:' + DOW_LEFT + 'px;flex-wrap:wrap;">';
    leg += '<span style="font-size:10px;color:#888;margin-right:2px;">Less</span>';
    p.forEach(function(c, i) {
      leg += '<div title="' + (i===0 ? 'No charge' : '≥'+thresh[i]+' kWh') + '" style="'
           + 'width:' + CELL + 'px;height:' + CELL + 'px;background:' + c + ';'
           + 'border-radius:3px;flex-shrink:0;box-sizing:border-box;'
           + (i===0 ? 'border:1px solid '+(isDark()?'#3a3a3a':'#ddd')+';' : '')
           + '"></div>';
    });
    leg += '<span style="font-size:10px;color:#888;margin-left:2px;">More</span>';
    leg += '<span style="font-size:10px;color:#aaa;margin-left:16px;">Hover cell for kWh</span>';
    leg += '</div>';

    el.innerHTML = mHtml + gHtml + leg;
  }

  render();
  window.addEventListener('themeChanged', render);

  /* Tooltip */
  var hmTip = document.getElementById('hm-tip');
  el.addEventListener('mouseover', function(e) {
    var t = e.target.dataset.tip;
    if (t) { hmTip.textContent = t; hmTip.style.display = 'block'; }
  });
  el.addEventListener('mousemove', function(e) {
    hmTip.style.left = (e.clientX + 14) + 'px';
    hmTip.style.top  = (e.clientY - 34) + 'px';
  });
  el.addEventListener('mouseout', function(e) {
    if (e.target.dataset.tip) hmTip.style.display = 'none';
  });
  el.addEventListener('touchstart', function(e) {
    var t = e.target.dataset.tip;
    if (t) {
      var touch = e.touches[0];
      hmTip.textContent = t;
      hmTip.style.left = (touch.clientX + 14) + 'px';
      hmTip.style.top  = (touch.clientY - 44) + 'px';
      hmTip.style.display = 'block';
    }
  }, {passive: true});
  el.addEventListener('touchend', function() { hmTip.style.display = 'none'; }, {passive: true});
}

/* ════════════════════════════════════════════════════════
   THEME REACTIVITY
   ════════════════════════════════════════════════════════ */
window.addEventListener('themeChanged', () => {
  allCharts.forEach(chart => {
    // Update plugin colors
    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = tc();
    }
    if (chart.options.plugins?.datalabels) {
      const dl = chart.options.plugins.datalabels;
      if (dl.color !== undefined && dl.color !== '#fff' && dl.color !== '#ffffff') {
        dl.color = tc();
      }
    }
    // Update scale colors
    ['x','y','r'].forEach(axis => {
      const sc = chart.options.scales?.[axis];
      if (!sc) return;
      if (sc.ticks)         sc.ticks.color = axis === 'r' ? '#999' : tc();
      if (sc.grid)          sc.grid.color  = gc();
      if (sc.pointLabels)   sc.pointLabels.color = tc();
      if (sc.title)         sc.title.color = '#888';
    });
    // Update dataset borderColor for donut/polar (segment borders match background)
    chart.data.datasets.forEach(ds => {
      if (typeof ds.borderColor === 'string' &&
          (ds.borderColor === '#252525' || ds.borderColor === '#ffffff')) {
        ds.borderColor = isDark() ? '#252525' : '#ffffff';
      }
    });
    chart.update('none');
  });
});
</script>
---
layout: default
title: EV Analytics
permalink: /charging-analytics/
---
{% assign sorted_sessions = site.charging | sort: "date" %}

<style>
  /* ── Page-level overrides ── */
  body { max-width: 1100px !important; overflow-x: clip; }
  /* NOTE: do NOT set overflow on <html> — it breaks position:sticky on the site nav.
     overflow-x:clip on body clips horizontal bleed without creating a scroll container. */
  /* offset hash-jump targets so they clear both sticky bars */
  :root { scroll-padding-top: var(--scroll-pad, 70px); }

  .analytics-container {
    font-family: -apple-system, sans-serif;
    max-width: 1060px;
    width: 100%;
    margin: auto;
    color: var(--text);
    box-sizing: border-box;
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
  @media (max-width: 520px)  { .kpi-strip { grid-template-columns: repeat(2, 1fr); } }
  .kpi-card {
    background: var(--dash-card); border: 1px solid var(--dash-border);
    border-top: 3px solid var(--link);
    border-radius: 12px; padding: 18px 16px; text-align: center;
    display: flex; flex-direction: column; justify-content: center; gap: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s;
  }
  .kpi-card:hover {
    box-shadow: 0 6px 20px rgba(93,63,211,0.14);
    transform: translateY(-2px);
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
    max-width: 100%; box-sizing: border-box;
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
    display: none;          /* only shown via .visible class after scrolling */
    position: fixed;
    top: var(--sticky-bar-top, -200px); /* JS sets this after measuring site nav */
    left: 0; right: 0;
    z-index: 490;           /* intentionally BELOW site nav (z-index:500) */
    background: var(--bg);
    border-bottom: 2px solid var(--dash-border);
    box-shadow: 0 3px 16px rgba(0,0,0,0.12);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    flex-direction: column;
    gap: 0;
  }
  /* Show via display only — no transform trick (breaks when height is 0 on init) */
  #vehicleFilterSticky.visible { display: flex; }
  #stickyNavRow {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 6px 20px 5px;
    border-bottom: 1px solid var(--dash-border);
    /* constrain to same width as page body so rows align with site nav content */
    max-width: 1060px; margin: 0 auto; box-sizing: border-box; width: 100%;
  }
  #stickyNavRow a {
    font-size: 0.68rem; font-weight: 600; color: var(--link);
    text-decoration: none; padding: 3px 10px;
    border-radius: 12px; border: 1px solid transparent;
    transition: all 0.12s; white-space: nowrap;
  }
  #stickyNavRow a:hover { background: var(--link); color: #fff; border-color: var(--link); }
  #stickyNavRow a.nav-active { border-color: var(--link); color: var(--link); background: rgba(93,63,211,0.08); }
  #stickyVehicleRow {
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
    padding: 6px 20px 7px;
    max-width: 1060px; margin: 0 auto; box-sizing: border-box; width: 100%;
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
    /* Fix: was repeat(4,1fr) — same as desktop, a no-op. Collapse to 2 cols on tablet/large-phone */
    .kpi-strip { grid-template-columns: repeat(2, 1fr); }
    /* Allow title + subtitle + back-to-top pill to wrap on narrow screens */
    .section-header { flex-wrap: wrap; }
    /* CO2 hero: reduce side padding so content isn't cramped */
    .co2-hero { padding: 20px 16px 18px; }
    /* Slightly smaller page title */
    .analytics-header h1 { font-size: 1.4rem; }
  }
  @media (max-width: 480px) {
    /* KPI values + cards: reduce size to fit comfortably in 2-col layout */
    .kpi-value { font-size: 1.2rem; }
    .kpi-card  { padding: 12px 10px; }
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
    border-left: 4px solid var(--link);
    border-radius: 12px; padding: 16px 18px;
    display: flex; flex-direction: row; align-items: flex-start;
    gap: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s;
  }
  .record-card:hover {
    border-left-color: var(--link);
    box-shadow: 0 6px 22px rgba(93,63,211,0.16);
    transform: translateY(-2px);
  }
  .record-icon  {
    font-size: 1.3rem; line-height: 1; flex-shrink: 0;
    width: 2.4rem; height: 2.4rem;
    display: flex; align-items: center; justify-content: center;
    background: rgba(93,63,211,0.08); border-radius: 10px;
  }
  .record-body  { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .record-label { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: #888; }
  .record-value { font-size: 1.55rem; font-weight: 900; color: var(--link); line-height: 1.1; }
  .record-sub   { font-size: 0.75rem; color: #888; }

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

  /* ── CO2 Avoidance section ── */
  .co2-hero {
    background: linear-gradient(135deg, #0d2b1a 0%, #1a3d2b 50%, #0d2b1a 100%);
    border: 1px solid #2ecc7155;
    border-radius: 16px; padding: 28px 28px 24px; margin-bottom: 18px;
    position: relative; overflow: hidden;
  }
  .co2-hero::before {
    content: '🌿'; position: absolute; right: 24px; top: 16px;
    font-size: 4rem; opacity: 0.12; pointer-events: none;
  }
  [data-theme="dark"] .co2-hero { background: linear-gradient(135deg, #0a1f12 0%, #142b1e 50%, #0a1f12 100%); }
  .co2-headline {
    font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.14em;
    color: #2ecc71; margin-bottom: 6px; font-weight: 700;
  }
  .co2-number {
    font-size: 3rem; font-weight: 900; color: #2ecc71; line-height: 1;
    margin-bottom: 4px; font-variant-numeric: tabular-nums;
  }
  .co2-unit { font-size: 1rem; font-weight: 400; opacity: 0.7; margin-left: 4px; }
  .co2-sub { font-size: 0.8rem; color: #86efac; opacity: 0.8; margin-bottom: 20px; }
  .co2-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px; margin-bottom: 0;
  }
  @media (max-width: 767px) { .co2-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 420px)  { .co2-grid { grid-template-columns: 1fr 1fr; } }
  .co2-stat {
    background: rgba(46,204,113,0.08); border: 1px solid rgba(46,204,113,0.2);
    border-radius: 10px; padding: 12px 14px;
  }
  .co2-stat-label { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.09em; color: #86efac; opacity: 0.75; display: block; margin-bottom: 4px; }
  .co2-stat-value { font-size: 1.15rem; font-weight: 800; color: #fff; display: block; line-height: 1.15; }
  .co2-stat-sub   { font-size: 0.65rem; color: #86efac; opacity: 0.65; display: block; margin-top: 2px; }

  .co2-honesty {
    background: rgba(243,156,18,0.08); border: 1px solid rgba(243,156,18,0.25);
    border-radius: 10px; padding: 12px 16px; margin-top: 14px;
    font-size: 0.75rem; color: #f39c12; line-height: 1.5;
  }
  .co2-honesty strong { color: #f5c842; }

  .co2-chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; }
  @media (max-width: 767px) { .co2-chart-row { grid-template-columns: 1fr; } }

  /* CO2 badge on trip cards */
  .co2-trip-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(46,204,113,0.12); border: 1px solid rgba(46,204,113,0.3);
    border-radius: 8px; padding: 5px 10px; font-size: 0.72rem; color: #2ecc71;
    font-weight: 700;
  }
  .co2-trip-badge .co2-trip-num { font-size: 1rem; font-weight: 900; }

  /* ── Charging locations map ── */
  .ev-map-icon { background: transparent !important; border: none !important; overflow: visible !important; }
  .ev-pulse { position: relative; overflow: visible; }
  .ev-dot { position: absolute; top: 0; right: 0; bottom: 0; left: 0; inset: 0; border-radius: 50%; opacity: 0.35; box-shadow: 0 2px 8px rgba(0,0,0,0.18); }
  .ev-ring { position: absolute; top: 0; right: 0; bottom: 0; left: 0; inset: 0; border-radius: 50%; border: 2px solid; opacity: 0; animation: ev-pulse 2.2s ease-out 3; }
  .ev-pin { position: absolute; bottom: 50%; left: 50%; transform: translateX(-50%); filter: drop-shadow(0 1px 3px rgba(0,0,0,0.4)); pointer-events: none; }
  @keyframes ev-pulse { 0% { transform: scale(1); opacity: 0.75; } 100% { transform: scale(2.8); opacity: 0; } }
  #chargingMap { border-radius: 10px; }
  #chargingMap .leaflet-popup-content-wrapper { background: var(--dash-card,#fff); color: var(--text,#333); border: 1px solid var(--dash-border,#ddd); box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
  #chargingMap .leaflet-popup-tip { background: var(--dash-card,#fff); }

  /* Tighten gap between site nav and charging sub-nav */
  nav { margin-bottom: 0.75rem !important; }

  /* ── Print / PDF Report ── */
  #printFab   { display: flex; }
  #printPanel { display: none; flex-direction: column; }
  #printPanel.open { display: flex; }

  @media print {
    @page { size: 11in 8.5in landscape; margin: 0.4in 0.45in; }

    /* Hide all UI chrome */
    nav, #chargingPageNav, #vehicleFilterSticky, #vehicleFilterBtns,
    .section-nav, .back-top-pill, .back-link,
    #printFab, #printPanel, #hm-tip, #locViewBtns, .loc-view-btn,
    .analytics-header > p { display: none !important; }

    /* Reset layout for full-width print */
    body  { padding: 0 !important; max-width: none !important; background: #fff !important; overflow: visible !important; }
    html  { overflow: visible !important; }
    nav   { margin-bottom: 0 !important; }
    .analytics-container { max-width: none !important; width: 100% !important; margin: 0 !important; }

    /* Charts: fixed height keeps them on-page in landscape */
    .chart-wrap { height: 200px !important; }
    canvas { max-width: 100% !important; }

    /* Print-friendly cards */
    .chart-card, .record-card, .kpi-card { box-shadow: none !important; border: 1px solid #ccc !important; }
    .chart-card { break-inside: avoid; page-break-inside: avoid; }

    /* Page breaks: each section starts on a new page */
    .section-header { break-before: page; page-break-before: always; break-inside: avoid; page-break-inside: avoid; }
    /* First visible section — no leading blank page */
    .section-header.print-first-sec { break-before: avoid !important; page-break-before: avoid !important; }

    /* Preserve colours in PDF */
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
</style>

<div class="analytics-container" id="top">

  <!-- Cross-page charging nav -->
  <div id="chargingPageNav" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--dash-border);align-items:center;">
    <a href="/charging/"         style="font-size:0.78rem;font-weight:600;color:#888;text-decoration:none;padding:5px 14px;border:1px solid var(--dash-border);border-radius:20px;background:var(--dash-card);transition:all 0.15s" onmouseover="this.style.borderColor='var(--link)';this.style.color='var(--link)'" onmouseout="this.style.borderColor='var(--dash-border)';this.style.color='#888'">⚡ Dashboard</a>
    <a href="/charging-history/" style="font-size:0.78rem;font-weight:600;color:#888;text-decoration:none;padding:5px 14px;border:1px solid var(--dash-border);border-radius:20px;background:var(--dash-card);transition:all 0.15s" onmouseover="this.style.borderColor='var(--link)';this.style.color='var(--link)'" onmouseout="this.style.borderColor='var(--dash-border)';this.style.color='#888'">📋 History</a>
    <a href="/charging-analytics/" style="font-size:0.78rem;font-weight:700;color:#fff;text-decoration:none;padding:5px 14px;border:1px solid var(--link);border-radius:20px;background:var(--link)">📊 Analytics</a>
  </div>
  <script>
    /* Early theme init — prevents flash of wrong theme before layout JS runs */
    (function(){
      var stored = localStorage.getItem('theme');
      var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      /* Battery emoji favicon for charging pages */
      var lnk = document.querySelector("link[rel~='icon']") || document.createElement('link');
      lnk.rel = 'icon';
      lnk.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔋</text></svg>";
      if (!lnk.parentNode) document.head.appendChild(lnk);
    })();
  </script>

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
    <a href="#co2">🌿 CO₂</a>
    <a href="#roadtrips">Road Trips</a>
    <a href="#sessiondetail" id="navSessionDetail">Detail</a>
    <a href="#efficiency" id="navEfficiency">Efficiency</a>
    <a href="#vehiclecomp" id="navVehicleComp" style="display:none">Vehicles</a>
    <a href="#map">Map</a>
  </div>

  <!-- Sticky bar: section nav on top row, vehicle filter on bottom row -->
  <div id="vehicleFilterSticky">
    <div id="stickyNavRow">
      <!-- Cross-page shortcuts (compact, separated from section nav) -->
      <a href="/charging/" style="opacity:0.55;font-size:0.62rem;padding:2px 7px">⚡ Dash</a>
      <a href="/charging-history/" style="opacity:0.55;font-size:0.62rem;padding:2px 7px">📋 History</a>
      <span style="color:var(--dash-border);margin:0 4px;align-self:center">│</span>
      <a href="#records">Records</a>
      <a href="#heatmap">Heatmap</a>
      <a href="#monthly">Monthly</a>
      <a href="#sources">Sources</a>
      <a href="#economics">Economics</a>
      <a href="#trends">Trends</a>
      <a href="#sessions">Sessions</a>
      <a href="#seasonal">Season/Year</a>
      <a href="#economics2">Break-Even</a>
      <a href="#co2">🌿 CO₂</a>
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
  <!--  SECTION CO2: EMISSIONS AVOIDANCE                  -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div class="section-header" id="co2">
    <h2>🌿 CO₂ Avoidance</h2>
    <span>net emissions avoided vs. your gas car — Michigan grid honest</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <!-- Hero card -->
  <div class="co2-hero">
    <div class="co2-headline">Net CO₂ Avoided vs. Gas</div>
    <div class="co2-number" id="co2HeroNum">—<span class="co2-unit">kg</span></div>
    <div class="co2-sub" id="co2HeroSub">calculating…</div>
    <div class="co2-grid" id="co2StatGrid">
      <div class="co2-stat"><span class="co2-stat-label">Gallons Not Burned</span><span class="co2-stat-value" id="co2Gallons">—</span><span class="co2-stat-sub">equivalent</span></div>
      <div class="co2-stat"><span class="co2-stat-label">Trees Absorbing 1 Year</span><span class="co2-stat-value" id="co2Trees">—</span><span class="co2-stat-sub">@ 21 kg CO₂/tree/yr</span></div>
      <div class="co2-stat"><span class="co2-stat-label">Gas Car Miles Avoided</span><span class="co2-stat-value" id="co2Miles">—</span><span class="co2-stat-sub">equivalent distance</span></div>
      <div class="co2-stat"><span class="co2-stat-label">Barrels of Oil</span><span class="co2-stat-value" id="co2Barrels">—</span><span class="co2-stat-sub">not refined for fuel</span></div>
      <div class="co2-stat"><span class="co2-stat-label">Homes Powered</span><span class="co2-stat-value" id="co2Homes">—</span><span class="co2-stat-sub">days of avg US home</span></div>
      <div class="co2-stat"><span class="co2-stat-label">Grid CO₂ Emitted</span><span class="co2-stat-value" id="co2GridEmit">—</span><span class="co2-stat-sub">indirect, via Michigan grid</span></div>
      <div class="co2-stat"><span class="co2-stat-label">Gas CO₂ Would Have Been</span><span class="co2-stat-value" id="co2GasWould">—</span><span class="co2-stat-sub">if still driving gas car</span></div>
      <div class="co2-stat"><span class="co2-stat-label">Emission Reduction</span><span class="co2-stat-value" id="co2Pct">—</span><span class="co2-stat-sub">vs. gas baseline</span></div>
    </div>
    <div class="co2-honesty" id="co2Honesty">
      ⚡ <strong>Michigan-honest calculation:</strong> Grid CO₂ subtracted using eGRID 2023 subregion rates.
      Road trip sessions use location-specific grid factors where available — Madison WI (MROE) charges at
      <strong>1,397 lbs/MWh</strong>, nearly 44% dirtier than home (RFCM, 971 lbs/MWh).
      Comparison vehicle: <span id="co2BaselineNote">RJB → 2023 Escape (24.8 MPG actual) · LRB → 2016 Explorer (23.0 MPG)</span>.
    </div>

    <!-- Solar scenario footnote -->
    <div id="co2SolarBox" style="margin-top:14px;background:rgba(2,136,209,0.07);border:1px solid rgba(2,136,209,0.25);border-radius:10px;padding:14px 16px">
      <div style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.12em;color:#0288d1;font-weight:700;margin-bottom:10px">☀️ Solar What-If Scenarios — Home Charging</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
        <div style="background:rgba(2,136,209,0.06);border:1px solid rgba(2,136,209,0.18);border-radius:8px;padding:10px 12px">
          <div style="font-size:0.58rem;text-transform:uppercase;color:#888;margin-bottom:3px">Current (grid-tied)</div>
          <div style="font-size:1.2rem;font-weight:900;color:#2ecc71" id="co2SolarBase">—</div>
          <div style="font-size:0.65rem;color:#888;margin-top:2px">kg net CO₂ avoided</div>
        </div>
        <div style="background:rgba(2,136,209,0.06);border:1px solid rgba(2,136,209,0.18);border-radius:8px;padding:10px 12px">
          <div style="font-size:0.58rem;text-transform:uppercase;color:#888;margin-bottom:3px">50% home solar</div>
          <div style="font-size:1.2rem;font-weight:900;color:#0288d1" id="co2Solar50">—</div>
          <div style="font-size:0.65rem;color:#888;margin-top:2px">kg avoided · <span id="co2Solar50delta" style="color:#0288d1">—</span> more</div>
        </div>
        <div style="background:rgba(2,136,209,0.06);border:1px solid rgba(2,136,209,0.18);border-radius:8px;padding:10px 12px">
          <div style="font-size:0.58rem;text-transform:uppercase;color:#888;margin-bottom:3px">100% home solar</div>
          <div style="font-size:1.2rem;font-weight:900;color:#0288d1" id="co2Solar100">—</div>
          <div style="font-size:0.65rem;color:#888;margin-top:2px">kg avoided · <span id="co2Solar100delta" style="color:#0288d1">—</span> more</div>
        </div>
        <div style="background:rgba(2,136,209,0.06);border:1px solid rgba(2,136,209,0.18);border-radius:8px;padding:10px 12px">
          <div style="font-size:0.58rem;text-transform:uppercase;color:#888;margin-bottom:3px">100% solar, all sites</div>
          <div style="font-size:1.2rem;font-weight:900;color:#7b1fa2" id="co2SolarAll">—</div>
          <div style="font-size:0.65rem;color:#888;margin-top:2px">kg avoided · <span id="co2SolarAlldelta" style="color:#7b1fa2">—</span> more</div>
        </div>
      </div>
      <p id="co2SolarNote" style="font-size:0.63rem;color:#888;margin:10px 0 0;line-height:1.55"></p>
    </div>
  </div><!-- /.co2-hero -->

  <!-- Monthly CO2 chart + grid factor breakdown -->
  <div class="co2-chart-row">
    <div class="chart-card">
      <p class="chart-title">Monthly CO₂ Avoided (net kg)</p>
      <div class="chart-wrap" style="height:240px"><canvas id="chartCo2Monthly"></canvas></div>
    </div>
    <div class="chart-card">
      <p class="chart-title">Grid CO₂ Emitted vs. Gas CO₂ Avoided — by Month</p>
      <div class="chart-wrap" style="height:240px"><canvas id="chartCo2GrossNet"></canvas></div>
    </div>
  </div>

  <!-- Cumulative CO2 + per-location grid factor breakdown -->
  <div class="co2-chart-row">
    <div class="chart-card">
      <p class="chart-title">Cumulative CO₂ Avoided Over Time</p>
      <div class="chart-wrap" style="height:240px"><canvas id="chartCo2Cumulative"></canvas></div>
    </div>
    <div class="chart-card">
      <p class="chart-title">CO₂ by Charging Location — grid intensity matters</p>
      <div class="chart-wrap" style="height:240px"><canvas id="chartCo2ByLocation"></canvas></div>
      <div id="co2LocLegend" style="font-size:0.62rem;color:#888;margin-top:6px;display:none"></div>
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
  </div><!-- /#efficiencySection -->

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

<!-- ─── Print Report FAB + Panel ─── -->
<button id="printFab" title="Generate PDF Report"
  style="position:fixed;bottom:28px;right:28px;z-index:600;width:52px;height:52px;border-radius:50%;background:var(--link);color:#fff;border:none;font-size:1.35rem;cursor:pointer;box-shadow:0 4px 18px rgba(93,63,211,0.42);transition:transform 0.15s,box-shadow 0.15s;align-items:center;justify-content:center"
  onmouseover="this.style.transform='scale(1.1)';this.style.boxShadow='0 6px 26px rgba(93,63,211,0.58)'"
  onmouseout="this.style.transform='';this.style.boxShadow='0 4px 18px rgba(93,63,211,0.42)'">📄</button>

<div id="printPanel" style="position:fixed;bottom:92px;right:28px;z-index:601;width:290px;background:var(--dash-card);border:1px solid var(--dash-border);border-radius:16px;box-shadow:0 8px 36px rgba(0,0,0,0.18);overflow:hidden">
  <div style="padding:13px 16px;border-bottom:1px solid var(--dash-border);display:flex;align-items:center;justify-content:space-between">
    <span style="font-weight:800;font-size:0.88rem">📄 Print Report</span>
    <button id="printClose" style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:#888;padding:2px 6px;border-radius:6px;line-height:1" onmouseover="this.style.background='var(--dash-border)'" onmouseout="this.style.background=''">✕</button>
  </div>
  <div style="padding:8px 10px;border-bottom:1px solid var(--dash-border);display:flex;gap:8px">
    <button id="printSelectAll"  style="flex:1;background:var(--dash-card);border:1px solid var(--dash-border);border-radius:8px;padding:5px;font-size:0.72rem;font-weight:700;cursor:pointer;color:var(--link);font-family:inherit" onmouseover="this.style.borderColor='var(--link)'" onmouseout="this.style.borderColor='var(--dash-border)'">All</button>
    <button id="printSelectNone" style="flex:1;background:var(--dash-card);border:1px solid var(--dash-border);border-radius:8px;padding:5px;font-size:0.72rem;font-weight:700;cursor:pointer;color:#888;font-family:inherit">None</button>
  </div>
  <div id="printSectionList" style="padding:6px 8px;max-height:340px;overflow-y:auto"></div>
  <div style="padding:10px 12px;border-top:1px solid var(--dash-border)">
    <button id="doPrint" style="width:100%;background:var(--link);color:#fff;border:none;border-radius:10px;padding:10px;font-size:0.86rem;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity 0.15s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">🖨️ Print / Save as PDF</button>
    <p style="font-size:0.64rem;color:#888;margin:7px 0 0;text-align:center;line-height:1.45">Print dialog → <strong>Save as PDF</strong> · set <strong>Landscape</strong></p>
  </div>
</div>

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
const locationData    = {{ site.data.locations  | jsonify }} || [];
const tripNotes       = {{ site.data.trip_notes | jsonify }} || [];

/* ── Location table state — declared here so nothing runs before these exist ── */
let _locSortCol = 'name', _locSortDir = 'asc', _locView = 'location', _locSl = [];
let _locHdrsWired = false; // guard: only wire sort-header onclick once

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
  '2025 Mach-E GT':        24.8,   // RJB real-world from Fuelly (2023 Escape, 26 fill-ups)
  '2026 Mach-E SR':        24.8,
  "LRB's 2025 Mach-E GT":  23.0,   // LRB real-world (2016 Explorer 2.3L EcoBoost, per dash computer)
  "LRB's 2026 Mach-E SR":  23.0,
};

/* ════════════════════════════════════════════════════════
   CO2 CONSTANTS — eGRID 2023, EPA sources
   ════════════════════════════════════════════════════════
   Grid factors: lbs CO2/MWh → kg CO2/kWh = lbs/MWh × 0.4536 / 1000
   Gas:  8.887 kg CO2/gallon (EPA)
   Tree: 21 kg CO2/year absorption (EPA equivalencies)
   Home: 10,649 kWh/year avg US home (EIA 2022)
   Barrel of oil: ~42 gallons → ~131 kg CO2 when burned for fuel
*/
const CO2_GAS_KG_PER_GAL   = 8.887;
const CO2_TREE_KG_PER_YEAR = 21;
const CO2_HOME_KWH_YEAR    = 10649;
const CO2_BARREL_KG        = 131;   // kg CO2 per barrel of crude → gasoline

// eGRID 2023 subregion factors (kg CO2/kWh)
// Source: EPA eGRID 2023 Summary Tables Rev2, June 2025
const EGRID_FACTORS = {
  RFCM: 970.6  * 0.4536 / 1000,   // Michigan (Lower Peninsula) — 0.4402 kg/kWh
  MROE: 1397.3 * 0.4536 / 1000,   // MRO East (E. Wisconsin/Madison) — 0.6338 kg/kWh
  MROW: 920.1  * 0.4536 / 1000,   // MRO West (Minnesota/Bloomington) — 0.4173 kg/kWh
  RFCW: 911.4  * 0.4536 / 1000,   // RFC West (Illinois/Ohio) — 0.4134 kg/kWh
  RFCE: 596.9  * 0.4536 / 1000,   // RFC East (Mid-Atlantic) — 0.2707 kg/kWh
};
const EGRID_DEFAULT = EGRID_FACTORS.RFCM; // fallback = home grid

// State → eGRID subregion mapping (dominant subregion for each state)
const STATE_TO_EGRID = {
  MI: 'RFCM', WI: 'MROE', MN: 'MROW', IL: 'RFCW',
  OH: 'RFCW', IN: 'RFCW', PA: 'RFCE', NY: 'RFCE',
};

// Derive eGRID factor from a session location string
// 1. Check locationData for explicit egrid_region field
// 2. Try to infer state from location string (e.g. "Tesla, Madison WI" → WI)
// 3. Fall back to RFCM (home grid)
function getEgridFactor(locationStr) {
  // Check explicit override in _data/locations.yml
  const locEntry = (locationData || []).find(l =>
    l.name && l.name.toLowerCase() === locationStr.toLowerCase()
  );
  if (locEntry && locEntry.egrid_region && EGRID_FACTORS[locEntry.egrid_region]) {
    return EGRID_FACTORS[locEntry.egrid_region];
  }
  // Infer state from two-letter abbreviation at end of location string
  const stateMatch = locationStr.match(/\b([A-Z]{2})\s*$/);
  if (stateMatch && STATE_TO_EGRID[stateMatch[1]]) {
    return EGRID_FACTORS[STATE_TO_EGRID[stateMatch[1]]];
  }
  // Also try "City ST" pattern mid-string
  const stateMatch2 = locationStr.match(/,\s*([A-Z]{2})\b/);
  if (stateMatch2 && STATE_TO_EGRID[stateMatch2[1]]) {
    return EGRID_FACTORS[STATE_TO_EGRID[stateMatch2[1]]];
  }
  return EGRID_DEFAULT;
}

// Get baseline MPG for a vehicle (for CO2 comparison)
function getBaselineMpg(vehicle) {
  return VEHICLE_MPG[vehicle] || 24.8;
}

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
    // Filter outliers: <1.5 mi/kWh (>667 Wh/mi) or >4.75 mi/kWh (<211 Wh/mi) are physically implausible
    const rawMiPerKwh = s.milesAdded > 0 && s.kwh > 0 ? s.milesAdded / s.kwh : null;
    s.hasRealEff   = rawMiPerKwh !== null && rawMiPerKwh >= 1.5 && rawMiPerKwh <= 4.75;
    s.realMiPerKwh = s.hasRealEff ? rawMiPerKwh : null;
    s.realWhPerMi  = s.hasRealEff ? (s.kwh * 1000) / s.milesAdded : null;

    // Use real efficiency for gas savings if available, otherwise fall back to assumed
    const effMiPerKwh = s.hasRealEff ? s.realMiPerKwh : (gs.mi_per_kwh || 3.0);
    s.gasEquiv  = s.kwh * effMiPerKwh / (gs.mpg || 27) * (gs.gas_price || 3.26);
    s.saving    = s.gasEquiv - s.cost;
    s.bucket    = getBucket(s.location);
    s.isFree    = s.cost < 0.005;
    s.month     = s.date.substring(0, 7);
    s.dow       = new Date(s.date + 'T12:00:00').getDay();

    // CO2 calculations — reuse effMiPerKwh already computed above; cache egridFactor
    const mpg        = getBaselineMpg(s.vehicle);
    const estMiles   = s.kwh * effMiPerKwh;
    const egridFactor = getEgridFactor(s.location);
    s.co2GasCould    = (estMiles / mpg) * CO2_GAS_KG_PER_GAL;   // kg CO2 if driven on gas
    s.co2GridEmit    = s.kwh * egridFactor;                        // kg CO2 from grid
    s.co2NetAvoided  = s.co2GasCould - s.co2GridEmit;             // net kg CO2 avoided
    s.egridFactor    = egridFactor;                                 // store for display
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
Chart.defaults.animation = false; // disable all chart animations — prevents CPU spike on rebuild

/* Cubic ease-out count-up animation — RAF ID tracked per element so rapid
   vehicle-filter clicks cancel in-flight animations instead of stacking */
const _cuRAF = new Map();
function countUp(el, target, fmt, dur) {
  if (_cuRAF.has(el)) { cancelAnimationFrame(_cuRAF.get(el)); _cuRAF.delete(el); }
  dur = dur || 900;
  const t0 = performance.now();
  (function tick(now) {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = fmt((1 - Math.pow(1 - p, 3)) * target);
    if (p < 1) { _cuRAF.set(el, requestAnimationFrame(tick)); }
    else        { _cuRAF.delete(el); }
  })(t0);
}

const allVehicles = [...new Set(sessions.map(s => s.vehicle))].sort();
let activeVehicle = 'all';
let allCharts = [];
let _hmRender = null;        // current heatmap render fn — updated on each rebuild
let _heatmapWired = false;  // event listeners on heatmapContainer wired only once

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

  // Sticky bar starts hidden. Only show it when the user has scrolled past the header.
  // Do NOT call stickyBar.style.display = 'flex' unconditionally here — that was the
  // root cause of the bar appearing at the top of the page on load.

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

  // Sticky bar positioning and show/hide are handled by initStickyBar() (called once at init).

  // Active section highlight in sticky nav via IntersectionObserver
  const navLinks = document.querySelectorAll('#stickyNavRow a[href^="#"]');
  const sectionEls = Array.from(navLinks)
    .map(a => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);

  if (sectionEls.length && 'IntersectionObserver' in window) {
    let activeId = null;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const vh = window.innerHeight;
          // Read all rects in a single pass — avoids repeated forced layout
          const rects = sectionEls.map(el => ({ el, rect: el.getBoundingClientRect() }));
          const visible = rects.filter(({ rect }) => rect.top < vh * 0.55 && rect.bottom > 0);
          if (visible.length) {
            visible.sort((a, b) => Math.abs(a.rect.top) - Math.abs(b.rect.top));
            activeId = visible[0].el.id;
          } else {
            activeId = id;
          }
          navLinks.forEach(a => {
            a.classList.toggle('nav-active', a.getAttribute('href') === '#' + activeId);
          });
        }
      });
    }, { rootMargin: '-10% 0px -50% 0px', threshold: 0 });
    sectionEls.forEach(el => obs.observe(el));
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

  // Preserve scroll position across rebuild.
  // Toggling section visibility (efficiencySection, detailSection, vehicleCompSection)
  // shifts all content below those sections. Anchoring to a fixed element (like the map)
  // overcorrects when the user is near the TOP of the page — the map is far below
  // the viewport and its delta gets applied even though nothing shifted in view.
  //
  // Instead: find the topmost section-header or kpi-strip that's currently AT or
  // BELOW the viewport top. Record its distance from the viewport top. After rebuild,
  // scroll by the delta so that element stays exactly where it was.
  // If everything is above the fold (user at very top), there's no visible shift,
  // so delta will be 0 and no scroll correction fires.
  const _savedY = window.scrollY;
  let _anchorEl = null, _anchorTopBefore = 0;
  const _candidates = document.querySelectorAll(
    '.analytics-container .kpi-strip, .analytics-container .section-header'
  );
  for (const el of _candidates) {
    const r = el.getBoundingClientRect();
    if (r.bottom > 0) { // first element at or overlapping the viewport top
      _anchorEl = el;
      _anchorTopBefore = r.top;
      break;
    }
  }

  rebuild(_lastSl);

  if (_anchorEl) {
    const delta = _anchorEl.getBoundingClientRect().top - _anchorTopBefore;
    if (delta !== 0) window.scrollTo(0, _savedY + delta);
  }

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
     CO2 AVOIDANCE SECTION
  ════════════════════════════════════════ */
  (function buildCo2Section(sl) {
    const totalNetAvoided = sl.reduce((a, s) => a + (s.co2NetAvoided || 0), 0);
    const totalGasCould   = sl.reduce((a, s) => a + (s.co2GasCould   || 0), 0);
    const totalGridEmit   = sl.reduce((a, s) => a + (s.co2GridEmit    || 0), 0);

    // Hero number
    const heroEl = document.getElementById('co2HeroNum');
    if (heroEl) heroEl.innerHTML = totalNetAvoided.toFixed(0) + '<span class="co2-unit">kg</span>';
    const subEl = document.getElementById('co2HeroSub');
    if (subEl) subEl.textContent = `≈ ${(totalNetAvoided / 1000).toFixed(2)} metric tons of CO₂ not released into the atmosphere`;

    // Stat cards
    const effTotalMiles = sl.reduce((a,s) => {
      const eff = s.hasRealEff ? s.realMiPerKwh : (getGasSavingsObj(s.date, s.vehicle).mi_per_kwh || 3.0);
      return a + s.kwh * eff;
    }, 0);
    const gallons = totalGasCould / CO2_GAS_KG_PER_GAL;
    const trees   = totalNetAvoided / CO2_TREE_KG_PER_YEAR;
    const barrels = gallons / 42;
    const homeDays = (sl.reduce((a,s) => a + s.kwh, 0) / CO2_HOME_KWH_YEAR) * 365;
    const pct = totalGasCould > 0 ? (totalNetAvoided / totalGasCould * 100) : 0;

    function setStatEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
    setStatEl('co2Gallons',  gallons.toFixed(0));
    setStatEl('co2Trees',    trees.toFixed(1));
    setStatEl('co2Miles',    Math.round(effTotalMiles).toLocaleString());
    setStatEl('co2Barrels',  barrels.toFixed(1));
    setStatEl('co2Homes',    homeDays.toFixed(0) + ' days');
    setStatEl('co2GridEmit', totalGridEmit.toFixed(0) + ' kg');
    setStatEl('co2GasWould', totalGasCould.toFixed(0) + ' kg');
    setStatEl('co2Pct',      pct.toFixed(0) + '%');

    // ── Solar what-if scenarios ──
    // Solar lifecycle emissions: ~20–40 g CO₂/kWh (IPCC median 41 g/kWh for rooftop PV)
    // Battery storage adds ~5–10 g/kWh; combined solar+battery ≈ 50 g CO₂/kWh lifecycle.
    // Home grid (RFCM): 970.6 lbs/MWh = 440.2 g CO₂/kWh
    // Solar+battery: 50 g CO₂/kWh (lifecycle median, NREL/IPCC)
    const SOLAR_BATT_G_PER_KWH = 50;  // g CO₂/kWh — solar PV + home battery system lifecycle
    const SOLAR_BATT_KG        = SOLAR_BATT_G_PER_KWH / 1000;

    // Identify home sessions and their grid emissions
    const homeSessions    = sl.filter(s => s.bucket === 'Home');
    const homeKwh         = homeSessions.reduce((a, s) => a + s.kwh, 0);
    const homeGridEmit    = homeSessions.reduce((a, s) => a + (s.co2GridEmit || 0), 0);
    // Grid CO₂ for non-home sessions stays unchanged in all scenarios
    const nonHomeGridEmit = totalGridEmit - homeGridEmit;

    // Replace home grid emissions with solar+battery lifecycle emissions
    function solarNetAvoided(homeSolarFrac, allSolarFrac) {
      // homeSolarFrac: fraction of home kWh covered by solar+battery (0–1)
      // allSolarFrac: fraction of ALL kWh covered by solar (for the all-sites scenario)
      const homeEmit    = homeKwh * (homeSolarFrac * SOLAR_BATT_KG + (1 - homeSolarFrac) * EGRID_FACTORS.RFCM);
      const otherEmit   = allSolarFrac > 0
        ? (totalGridEmit - homeGridEmit) * (1 - allSolarFrac) + (totalGridEmit - homeGridEmit) * allSolarFrac * (SOLAR_BATT_KG / EGRID_DEFAULT)
        : nonHomeGridEmit;
      return totalGasCould - homeEmit - otherEmit;
    }

    // Scenario values
    const base       = totalNetAvoided;                    // current grid
    const solar50    = solarNetAvoided(0.50, 0);           // 50% home solar
    const solar100   = solarNetAvoided(1.00, 0);           // 100% home solar
    // All-sites solar: replace ALL grid CO₂ with solar+battery lifecycle
    const solarAllVal = totalGasCould - (sl.reduce((a, s) => a + s.kwh, 0) * SOLAR_BATT_KG);

    const fmtKg = v => v >= 1000 ? (v/1000).toFixed(2) + ' t' : Math.round(v) + ' kg';
    const fmtDelta = (v, base) => {
      const d = v - base;
      return (d >= 0 ? '+' : '') + fmtKg(d);
    };

    setStatEl('co2SolarBase',      fmtKg(base));
    setStatEl('co2Solar50',        fmtKg(solar50));
    setStatEl('co2Solar100',       fmtKg(solar100));
    setStatEl('co2SolarAll',       fmtKg(solarAllVal));
    setStatEl('co2Solar50delta',   fmtDelta(solar50,    base));
    setStatEl('co2Solar100delta',  fmtDelta(solar100,   base));
    setStatEl('co2SolarAlldelta',  fmtDelta(solarAllVal, base));

    const noteEl = document.getElementById('co2SolarNote');
    if (noteEl) {
      const homeKwhPct = totalGridEmit > 0 ? (homeGridEmit / totalGridEmit * 100).toFixed(0) : 0;
      noteEl.innerHTML =
        `<strong>Home charging</strong> accounts for ${fmtKg(homeGridEmit)} of ${fmtKg(totalGridEmit)} total grid CO₂ (${homeKwhPct}%). ` +
        `Solar+battery lifecycle factor used: <strong>${SOLAR_BATT_G_PER_KWH} g CO₂/kWh</strong> ` +
        `(vs. Michigan grid ${(EGRID_FACTORS.RFCM * 1000).toFixed(0)} g/kWh — ` +
        `${Math.round((1 - SOLAR_BATT_KG / EGRID_FACTORS.RFCM) * 100)}% cleaner). ` +
        `"All sites" scenario assumes solar/storage at every charging location — theoretical best-case. ` +
        `Source: IPCC AR6 WG3 §6.4, NREL lifecycle LCA 2022.`;
    }
    const isLRB   = activeVehicle && activeVehicle.includes('LRB');
    const isMixed = !activeVehicle || activeVehicle === 'all';
    const baseNote = document.getElementById('co2BaselineNote');
    if (baseNote) {
      if (isMixed)    baseNote.textContent = 'RJB → 2023 Escape (24.8 MPG actual) · LRB → 2016 Explorer (23.0 MPG)';
      else if (isLRB) baseNote.textContent = 'LRB → 2016 Explorer 2.3L EcoBoost (23.0 MPG real-world)';
      else            baseNote.textContent = 'RJB → 2023 Ford Escape (24.8 MPG actual — 26 Fuelly fill-ups)';
    }

    // Monthly buckets
    const co2Monthly = {};
    sl.forEach(s => {
      if (!co2Monthly[s.month]) co2Monthly[s.month] = { net: 0, gas: 0, grid: 0 };
      co2Monthly[s.month].net  += s.co2NetAvoided || 0;
      co2Monthly[s.month].gas  += s.co2GasCould   || 0;
      co2Monthly[s.month].grid += s.co2GridEmit    || 0;
    });
    const co2Months = Object.keys(co2Monthly).sort();

    // Chart: Monthly net avoided
    if (document.getElementById('chartCo2Monthly')) {
      mkChart('chartCo2Monthly', {
        type: 'bar',
        data: {
          labels: co2Months.map(monthLabel),
          datasets: [{
            label: 'Net CO₂ Avoided (kg)',
            data: co2Months.map(m => +co2Monthly[m].net.toFixed(1)),
            backgroundColor: '#2ecc7188', borderColor: '#2ecc71',
            borderWidth: 1.5, borderRadius: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false }, datalabels: { display: false },
            tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(1)} kg CO₂ avoided` } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: tc(), font: { size: 9 } } },
            y: { grid: { color: gc() }, ticks: { color: tc() }, beginAtZero: true,
                 title: { display: true, text: 'kg CO₂', color: '#888' } }
          }
        }
      });
    }

    // Chart: Grid emitted vs Gas avoided
    if (document.getElementById('chartCo2GrossNet')) {
      mkChart('chartCo2GrossNet', {
        type: 'bar',
        data: {
          labels: co2Months.map(monthLabel),
          datasets: [
            { label: 'Grid CO₂ Emitted', data: co2Months.map(m => +co2Monthly[m].grid.toFixed(1)),
              backgroundColor: '#e74c3c99', borderColor: '#e74c3c', borderWidth: 1, borderRadius: 4 },
            { label: 'Gas CO₂ Avoided', data: co2Months.map(m => +co2Monthly[m].gas.toFixed(1)),
              type: 'line', borderColor: '#2ecc71', backgroundColor: '#2ecc7120',
              borderWidth: 2, fill: false, tension: 0.35, pointRadius: 3 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 10, font: { size: 10 } } },
            datalabels: { display: false },
            tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)} kg` } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: tc(), font: { size: 9 } } },
            y: { grid: { color: gc() }, ticks: { color: tc() }, beginAtZero: true,
                 title: { display: true, text: 'kg CO₂', color: '#888' } }
          }
        }
      });
    }

    // Chart: Cumulative
    if (document.getElementById('chartCo2Cumulative')) {
      let cumCo2 = 0;
      const cumData = co2Months.map(m => { cumCo2 += co2Monthly[m].net; return +cumCo2.toFixed(1); });
      mkChart('chartCo2Cumulative', {
        type: 'line',
        data: {
          labels: co2Months.map(monthLabel),
          datasets: [{
            label: 'Cumulative kg CO₂ Avoided',
            data: cumData, borderColor: '#2ecc71', backgroundColor: '#2ecc7120',
            borderWidth: 2.5, fill: true, tension: 0.35, pointRadius: 3
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false }, datalabels: { display: false },
            tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(0)} kg CO₂ avoided to date` } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: tc(), font: { size: 9 } } },
            y: { grid: { color: gc() }, ticks: { color: tc() }, beginAtZero: true,
                 title: { display: true, text: 'kg CO₂', color: '#888' } }
          }
        }
      });
    }

    // Chart: By location (colored by grid intensity)
    if (document.getElementById('chartCo2ByLocation')) {
      const locCo2 = {};
      sl.forEach(s => {
        if (!locCo2[s.location]) locCo2[s.location] = { net: 0, grid: 0, kwh: 0, factor: s.egridFactor };
        locCo2[s.location].net  += s.co2NetAvoided || 0;
        locCo2[s.location].grid += s.co2GridEmit    || 0;
        locCo2[s.location].kwh  += s.kwh;
      });
      const locSorted = Object.entries(locCo2).sort((a,b) => b[1].net - a[1].net).slice(0, 10);
      const minFactor = Math.min(...locSorted.map(([,v]) => v.factor));
      const maxFactor = Math.max(...locSorted.map(([,v]) => v.factor));
      const factorRange = maxFactor - minFactor || 1;
      // Green (clean grid) → Amber (dirtier grid): avoids the muddy brown mid-range
      const locColors = locSorted.map(([,v]) => {
        const t = (v.factor - minFactor) / factorRange;
        return `rgba(${Math.round(46 + 199*t)},${Math.round(204 - 46*t)},${Math.round(113 - 102*t)},0.80)`;
      });
      mkChart('chartCo2ByLocation', {
        type: 'bar',
        data: {
          labels: locSorted.map(([loc]) => loc.length > 22 ? loc.slice(0,20)+'…' : loc),
          datasets: [{
            label: 'Net CO₂ Avoided (kg)',
            data: locSorted.map(([,v]) => +v.net.toFixed(1)),
            backgroundColor: locColors, borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false }, datalabels: { display: false },
            tooltip: { callbacks: { label: (ctx) => {
              const [,v] = locSorted[ctx.dataIndex];
              return [` ${v.net.toFixed(1)} kg net avoided`,
                      ` Grid: ${(v.factor*1000).toFixed(0)} g CO₂/kWh`,
                      ` ${v.kwh.toFixed(1)} kWh charged`];
            }}}
          },
          scales: {
            x: { grid: { color: gc() }, ticks: { color: tc() }, beginAtZero: true,
                 title: { display: true, text: 'kg CO₂ avoided', color: '#888' } },
            y: { grid: { display: false }, ticks: { color: tc(), font: { size: 9 } } }
          }
        }
      });
      // Tiny legend below the chart
      const legendEl = document.getElementById('co2LocLegend');
      if (legendEl && factorRange > 0.01) {
        legendEl.style.display = '';
        legendEl.innerHTML =
          '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:rgba(46,204,113,0.85);margin-right:4px;vertical-align:middle"></span>Cleaner grid' +
          '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:rgba(245,158,11,0.85);margin:0 4px 0 14px;vertical-align:middle"></span>Dirtier grid' +
          ' &nbsp;·&nbsp; colour = relative grid CO₂ intensity';
      } else if (legendEl) {
        legendEl.style.display = 'none';
      }
    }
  })(sl);

  /* ════════════════════════════════════════
     NEW SECTION 8 — ROAD TRIP DETECTION
  ════════════════════════════════════════ */
  (function buildRoadTrips(sl) {
    const container = document.getElementById('roadTripContainer');
    if (!container) return;

    // ── Haversine distance in miles ──
    function haversineMiles(lat1, lng1, lat2, lng2) {
      const R  = 3958.8;
      const dL = (lat2 - lat1) * Math.PI / 180;
      const dG = (lng2 - lng1) * Math.PI / 180;
      const a  = Math.sin(dL/2)**2
               + Math.cos(lat1 * Math.PI/180)
               * Math.cos(lat2 * Math.PI/180)
               * Math.sin(dG/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    const homeLoc = (locationData || []).find(l => l.location === 'Home');
    const homeLat = homeLoc?.lat || 42.3714;
    const homeLng = homeLoc?.lng || -83.4702;
    const TRIP_RADIUS_MI  = 50;
    const TRIP_WINDOW_DAYS = 5;
    const DCFC_KW_THRESHOLD = 25; // avg kW threshold to classify as DCFC en-route
    const DCFC_NETWORKS = ['Tesla SC', 'ChargePoint', 'Rivian', 'Blink'];
    const GAS_STOP_MIN  = 6; // minutes per gas fill-up (midpoint 5–7 min)

    // Per-vehicle gas car comparison specs
    // key: substring to match vehicle name — LRB = Explorer, else = Escape
    const GAS_SPECS = {
      lrb: { name: '2023 Explorer AWD', mpg: 23, tank: 17.9 },
      rjb: { name: '2023 Escape AWD',   mpg: 27, tank: 15.7 }
    };
    function gasSpecForVehicle(vehicleName) {
      return (vehicleName || '').includes('LRB') ? GAS_SPECS.lrb : GAS_SPECS.rjb;
    }

    // Distance lookup cache: location name → miles from home
    const distCache = {};
    function distFromHome(locationName) {
      if (distCache[locationName] !== undefined) return distCache[locationName];
      const entry = (locationData || []).find(l => l.location === locationName);
      if (!entry || !entry.lat || !entry.lng) return distCache[locationName] = 999;
      return distCache[locationName] = haversineMiles(homeLat, homeLng, entry.lat, entry.lng);
    }

    // Location coords lookup
    function locCoords(locationName) {
      const entry = (locationData || []).find(l => l.location === locationName);
      return (entry && entry.lat && entry.lng) ? { lat: entry.lat, lng: entry.lng } : null;
    }

    // Trip annotation lookup from _data/trip_notes.yml
    function tripNote(firstDate) {
      return (tripNotes || []).find(n => n.key === firstDate) || null;
    }

    // Determine if a session is likely DCFC en-route (not destination/overnight)
    function isDCFC(s) {
      const isDCFCNetwork = DCFC_NETWORKS.some(n =>
        (s.bucket || '').toLowerCase().includes(n.toLowerCase()) ||
        s.bucket === 'Tesla SC'
      );
      // If we have timing data, use avg kW
      if (s.startTime && s.endTime && s.startDate) {
        const st = new Date(s.startDate + 'T' + s.startTime + ':00');
        const en = new Date(s.date      + 'T' + s.endTime   + ':00');
        let hrs  = (en - st) / 3600000;
        if (hrs < 0) hrs += 24; // overnight wrap
        if (hrs > 0 && hrs < 24) {
          const avgKw = s.kwh / hrs;
          return avgKw >= DCFC_KW_THRESHOLD;
        }
      }
      // Fallback: DCFC network + substantial charge = likely en-route
      return isDCFCNetwork && s.kwh >= 20;
    }

    // Charge duration in minutes for a DCFC session
    function chargeMinutes(s) {
      if (s.startTime && s.endTime && s.startDate) {
        const st = new Date(s.startDate + 'T' + s.startTime + ':00');
        const en = new Date(s.date      + 'T' + s.endTime   + ':00');
        let hrs = (en - st) / 3600000;
        if (hrs < 0) hrs += 24;
        if (hrs > 0 && hrs < 24) return Math.round(hrs * 60);
      }
      // Estimate from kWh if no timing: assume 150 kW average for Tesla SC
      if (s.bucket === 'Tesla SC') return Math.round(s.kwh / 150 * 60);
      return null; // unknown
    }

    // Estimate trip distance from sequential stop coordinates
    // If trip note has dest_lat/dest_lng, insert destination after last charger
    function estimateTripMiles(locs, note) {
      const points = [{ lat: homeLat, lng: homeLng }];
      locs.forEach(l => { const c = locCoords(l); if (c) points.push(c); });
      // Insert actual destination if provided
      if (note && note.dest_lat && note.dest_lng &&
          parseFloat(note.dest_lat) !== 0 && parseFloat(note.dest_lng) !== 0) {
        points.push({ lat: parseFloat(note.dest_lat), lng: parseFloat(note.dest_lng) });
      }
      points.push({ lat: homeLat, lng: homeLng });
      let total = 0;
      for (let i = 1; i < points.length; i++) {
        total += haversineMiles(points[i-1].lat, points[i-1].lng, points[i].lat, points[i].lng);
      }
      return Math.round(total);
    }

    // Filter sessions: public, >50mi from home
    const pubSessions = sl
      .filter(s => s.bucket !== 'Home' && s.bucket !== 'Work')
      .filter(s => distFromHome(s.location) >= TRIP_RADIUS_MI)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!pubSessions.length) {
      container.innerHTML = '<p style="color:#888;font-size:0.85rem">No road trips detected yet — public charging sessions more than 50 miles from home will appear here.</p>';
      return;
    }

    // Cluster into trips
    const trips = [];
    let cur = [pubSessions[0]];
    for (let i = 1; i < pubSessions.length; i++) {
      const diffDays = (new Date(pubSessions[i].date + 'T12:00:00') - new Date(pubSessions[i-1].date + 'T12:00:00')) / 86400000;
      if (diffDays <= TRIP_WINDOW_DAYS) { cur.push(pubSessions[i]); }
      else { trips.push(cur); cur = [pubSessions[i]]; }
    }
    trips.push(cur);

    // Build cards — most recent first
    function fmtMins(m) {
      if (m < 60) return `${m} min`;
      const h = Math.floor(m / 60), rem = m % 60;
      return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
    }
    const tripHTML = trips.slice().reverse().map((trip, ti, arr) => {
      const tripNum    = arr.length - ti;
      const firstDate  = trip[0].date;
      const kwh        = trip.reduce((a,s) => a + s.kwh, 0);
      const cost       = trip.reduce((a,s) => a + s.cost, 0);
      const saving     = trip.reduce((a,s) => a + s.saving, 0);
      const locs       = [...new Set(trip.map(s => s.location))];
      const dateRange  = trip.length === 1 ? firstDate : firstDate + ' – ' + trip[trip.length-1].date;
      const isFree     = cost < 0.01;
      const savingColor = saving < 0 ? C_RED : C_GREEN;

      // Trip annotation
      const note = tripNote(firstDate);

      // Distance stats
      const maxDist    = Math.round(Math.max(...locs.map(l => distFromHome(l))));
      const distLabel  = maxDist < 999 ? maxDist + ' mi from home' : '';
      const estMiles   = estimateTripMiles(locs, note);

      // Vehicle attribution (most common vehicle in trip)
      const vehCounts = {};
      trip.forEach(s => { vehCounts[s.vehicle] = (vehCounts[s.vehicle] || 0) + 1; });
      const tripVehicle = Object.entries(vehCounts).sort((a,b) => b[1]-a[1])[0][0];
      const spec = gasSpecForVehicle(tripVehicle);
      const isLRB = (tripVehicle || '').includes('LRB');

      // DCFC sessions only — for charge time
      const dcfcSessions  = trip.filter(s => isDCFC(s));
      const dcfcMins      = dcfcSessions.map(s => chargeMinutes(s)).filter(m => m !== null);
      const totalChargeMins = dcfcMins.reduce((a,v) => a+v, 0);
      const hasChargeTimes  = dcfcMins.length > 0;
      const hasUnknownTimes = dcfcSessions.length > dcfcMins.length;

      // Gas comparison
      const tankRange   = spec.mpg * spec.tank; // miles per tank
      const gasStops    = Math.max(0, Math.ceil(estMiles / tankRange) - 1);
      const gasMins     = gasStops * GAS_STOP_MIN;
      const timeDiff    = hasChargeTimes ? totalChargeMins - gasMins : null;
      const timeDiffStr = timeDiff === null ? '—'
        : timeDiff > 0
          ? `+${fmtMins(timeDiff)} vs gas`
          : timeDiff === 0
            ? 'Same as gas'
            : `${fmtMins(Math.abs(timeDiff))} faster than gas`;
      const timeDiffColor = timeDiff === null ? '#888'
        : timeDiff > 0 ? C_AMBER
        : C_GREEN;

      // Format charge time
      const chargeTimeStr = !hasChargeTimes
        ? (dcfcSessions.length ? '⚠ add timing data' : '—')
        : (totalChargeMins >= 60
            ? `${Math.floor(totalChargeMins/60)}h ${totalChargeMins%60}m`
            : `${totalChargeMins} min`)
          + (hasUnknownTimes ? '*' : '');

      // CO2 for this trip
      const tripMpg         = getBaselineMpg(tripVehicle);
      const tripNetAvoided  = trip.reduce((a,s) => a + (s.co2NetAvoided || 0), 0);
      const tripGridEmit    = trip.reduce((a,s) => a + (s.co2GridEmit    || 0), 0);
      const tripGasCould    = trip.reduce((a,s) => a + (s.co2GasCould    || 0), 0);
      const co2BadgeHtml = tripNetAvoided > 0.5 ? `
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px">
          <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(46,204,113,0.1);border:1px solid rgba(46,204,113,0.25);border-radius:6px;padding:3px 8px;font-size:0.68rem;color:#2ecc71;font-weight:700">
            🌿 ${tripNetAvoided.toFixed(1)} kg CO₂ avoided
          </span>
          <span style="font-size:0.63rem;color:#aaa">grid: ${tripGridEmit.toFixed(1)} kg · gas equiv: ${tripGasCould.toFixed(1)} kg</span>
        </div>` : '';

      const vehBadgeColor = isLRB ? '#f39c12' : '#7b1fa2';

      return `<div style="background:var(--dash-card);border:1px solid var(--dash-border);border-left:4px solid ${vehBadgeColor};border-radius:12px;padding:16px 20px;margin-bottom:14px;transition:box-shadow 0.2s" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow=''">

        <!-- Header row -->
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
          <span style="font-weight:800;font-size:0.95rem">🚗 Trip ${tripNum}</span>
          <span style="color:#888;font-size:0.78rem">${dateRange}</span>
          ${distLabel ? `<span style="font-size:0.68rem;background:var(--dash-border);padding:2px 8px;border-radius:10px;color:#888">${distLabel}</span>` : ''}
          <span style="font-size:0.68rem;padding:2px 8px;border-radius:10px;background:${vehBadgeColor}22;color:${vehBadgeColor};font-weight:600">${tripVehicle}</span>
          ${note?.destination ? `<span style="font-size:0.82rem;font-weight:700;color:var(--text)">📍 ${note.destination}</span>` : `<span style="font-size:0.7rem;color:#bbb;font-style:italic">add destination in _data/trip_notes.yml</span>`}
        </div>

        ${note?.description ? `<p style="font-size:0.78rem;color:#888;margin:0 0 6px">${note.description}</p>` : ''}
        ${note?.notes ? `<p style="font-size:0.75rem;color:#aaa;margin:0 0 8px;font-style:italic">${note.notes}</p>` : ''}

        ${note?.arrive || note?.depart ? `
        <div style="font-size:0.72rem;color:#888;margin-bottom:8px">
          ${note.arrive ? `<span>✈️ Arrived: <strong style="color:var(--text)">${note.arrive}</strong></span>` : ''}
          ${note.arrive && note.depart ? ' &nbsp;·&nbsp; ' : ''}
          ${note.depart ? `<span>🏠 Departed: <strong style="color:var(--text)">${note.depart}</strong></span>` : ''}
        </div>` : ''}

        ${note?.itinerary && note.itinerary.length ? `
        <details style="margin-bottom:10px">
          <summary style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.1em;color:#888;cursor:pointer;list-style:none;display:flex;align-items:center;gap:5px;user-select:none;padding:4px 0" onclick="this.parentElement.open ? this.querySelector('.itin-arrow').style.transform='rotate(0deg)' : this.querySelector('.itin-arrow').style.transform='rotate(90deg)'">
            <span class="itin-arrow" style="display:inline-block;transition:transform 0.2s;transform:rotate(0deg);font-style:normal;font-size:0.75rem">▶</span>
            Itinerary <span style="font-weight:400;opacity:0.6">(${note.itinerary.length} stops)</span>
          </summary>
          <div style="margin-top:8px;padding:10px 12px;background:rgba(0,0,0,0.03);border-radius:8px;border-left:3px solid var(--dash-border)">
            ${note.itinerary.map((stop, si) => `
              <div style="display:flex;gap:10px;align-items:flex-start;${si < note.itinerary.length-1 ? 'margin-bottom:6px' : ''}">
                <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:2px">
                  <div style="width:8px;height:8px;border-radius:50%;background:var(--link);margin-top:3px"></div>
                  ${si < note.itinerary.length-1 ? '<div style="width:1px;height:100%;min-height:12px;background:var(--dash-border);flex:1"></div>' : ''}
                </div>
                <div style="flex:1;padding-bottom:${si < note.itinerary.length-1 ? '4px' : '0'}">
                  <span style="font-size:0.68rem;color:#aaa;margin-right:6px">${stop.date}</span>
                  <span style="font-size:0.78rem;font-weight:600;color:var(--text)">${stop.place}</span>
                  ${stop.note ? `<span style="font-size:0.7rem;color:#888;margin-left:6px">— ${stop.note}</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </details>` : ''}

        <!-- CO2 badge -->
        ${co2BadgeHtml}

        <!-- Location badges -->
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px">
          ${locs.map(l => `<span class="badge ${badgeClass(getBucket(l))}">${l}</span>`).join('')}
        </div>

        <!-- Stats row -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:12px;padding-top:10px;border-top:1px solid var(--dash-border)">
          <div style="text-align:center">
            <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">Charged</div>
            <div style="font-weight:800;font-size:1rem">${kwh.toFixed(1)} kWh</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">Cost</div>
            <div style="font-weight:800;font-size:1rem">${isFree ? '<span style="color:'+C_GREEN+'">Free</span>' : fmtUSD(cost)}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">Saved vs Gas</div>
            <div style="font-weight:800;font-size:1rem;color:${savingColor}">${fmtUSD(saving)}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">DCFC Time</div>
            <div style="font-weight:800;font-size:1rem">${chargeTimeStr}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">Est. Miles</div>
            <div style="font-weight:800;font-size:1rem">${estMiles > 0 ? '~'+estMiles : '—'}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">Gas Stops (${spec.mpg}mpg)</div>
            <div style="font-weight:800;font-size:1rem">${gasStops} × ${GAS_STOP_MIN}min = ${gasMins}min</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">Time vs Gas</div>
            <div style="font-weight:700;font-size:0.9rem;color:${timeDiffColor}">${timeDiffStr}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">Stops</div>
            <div style="font-weight:800;font-size:1rem">${trip.length}</div>
          </div>
        </div>
        ${hasUnknownTimes ? '<p style="font-size:0.65rem;color:#888;margin:8px 0 0">* Some DCFC sessions missing start/end time — add to session in CloudCannon for accurate charge time.</p>' : ''}
      </div>`;
    }).join('');

    container.innerHTML = tripHTML || '<p style="color:#888;font-size:0.85rem">No qualifying road trips found.</p>';
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
      // Require ≥15% SOC added — tiny charges (e.g. 5% SOC + 6 kWh) produce wildly inflated estimates
      const ubeSessions = socSessions.filter(s => s.socAdded >= 15);
      if (ubeSessions.length) {
        const vehColors = {
          '2025 Mach-E GT':       C_BLUE,
          '2026 Mach-E SR':       C_GREEN,
          "LRB's 2025 Mach-E GT": C_PURPLE,
          "LRB's 2026 Mach-E SR": C_AMBER
        };

        // Build per-vehicle arrays of valid UBE estimates, sorted by date
        const ubeByVeh = {};
        ubeSessions.forEach(s => {
          const est = s.kwh / (s.socAdded / 100);
          // Clamp to physically plausible range: GT ≤~115, SR ≤~95; both ≥ 60
          if (est < 60 || est > 115) return;
          if (!ubeByVeh[s.vehicle]) ubeByVeh[s.vehicle] = [];
          ubeByVeh[s.vehicle].push({ date: s.date, ube: +est.toFixed(1) });
        });
        Object.values(ubeByVeh).forEach(pts => pts.sort((a,b) => a.date.localeCompare(b.date)));

        // Shared sorted x-axis — all unique dates across all vehicles
        const allDates = [...new Set(ubeSessions.map(s => s.date))].sort();

        const ubeDatasets = [];
        Object.entries(ubeByVeh).forEach(([v, pts]) => {
          if (!pts.length) return;
          const color = vehColors[v] || C_VIOLET;

          // Map each date to its UBE value (null if no data for that date)
          const ptMap = Object.fromEntries(pts.map(p => [p.date, p.ube]));
          const aligned = allDates.map(d => ptMap[d] ?? null);

          // Rolling 5-session trend (computed on non-null points only, mapped back)
          const nonNull = pts; // already sorted
          const rollingMap = {};
          nonNull.forEach((p, i) => {
            const window = nonNull.slice(Math.max(0, i-4), i+1).map(q => q.ube);
            rollingMap[p.date] = +(window.reduce((a,v)=>a+v,0)/window.length).toFixed(2);
          });
          const rollingAligned = allDates.map(d => rollingMap[d] ?? null);

          // Raw session dots — small & semi-transparent
          ubeDatasets.push({
            label: v,
            data: aligned,
            borderColor: color + '55',
            backgroundColor: color + '22',
            pointRadius: 3, pointHoverRadius: 6,
            tension: 0, borderWidth: 1, fill: false, spanGaps: false
          });
          // Bold rolling trend line
          ubeDatasets.push({
            label: v + ' (5-sess avg)',
            data: rollingAligned,
            borderColor: color,
            backgroundColor: 'transparent',
            pointRadius: 0, tension: 0.35, borderWidth: 2.5,
            fill: false, spanGaps: true
          });
        });

        // Rated UBE reference lines — neutral grey dashes, one per unique UBE value
        const allVehs = [...new Set(ubeSessions.map(s => s.vehicle))];
        const ratedLines = [...new Map(allVehs.map(v => [VEHICLE_UBE[v] || 91.7, v])).entries()];
        ratedLines.forEach(([ube, v]) => {
          const label = ube === 91.7 ? 'GT Rated 91.7 kWh' : 'SR Rated 72.6 kWh';
          ubeDatasets.push({
            label,
            data: allDates.map(() => ube),
            borderColor: '#aaa',
            borderDash: [8, 4], borderWidth: 1.5, pointRadius: 0, fill: false
          });
        });

        mkChart('chartBatteryHealth', {
          type: 'line',
          data: { labels: allDates, datasets: ubeDatasets },
          options: { responsive:true, maintainAspectRatio:false,
            plugins:{
              legend:{
                display:true, position:'top',
                labels:{ color:tc(), boxWidth:12, padding:10,
                  // Hide the raw-dot series from the legend (keep trend + rated lines)
                  filter: item => item.text.includes('avg') || item.text.includes('Rated')
                }
              },
              datalabels:{display:false},
              tooltip:{callbacks:{
                label: ctx => ctx.parsed.y !== null
                  ? ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} kWh`
                  : null
              }}
            },
            scales:{
              x:{grid:{color:gc()},ticks:{color:tc(),maxTicksLimit:10,maxRotation:45}},
              y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>v+' kWh'},
                 title:{display:true,text:'Estimated UBE (kWh)',color:'#888'},
                 min:60, suggestedMax:115}
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
   STICKY BAR — one-time setup (called after first rebuild)
   ════════════════════════════════════════════════════════ */
function initStickyBar() {
  const stickyBar    = document.getElementById('vehicleFilterSticky');
  const inlineFilter = document.getElementById('vehicleFilterBtns');
  if (!stickyBar) return;

  // ── Measure site nav position → set CSS custom property ──
  // Use getBoundingClientRect().bottom: gives the EXACT viewport Y of the nav's
  // bottom edge regardless of whether the nav is sticky or not. This eliminates
  // the 'gap' caused by margin offsets when measuring .height alone.
  function _updateTop() {
    const nav    = document.querySelector('body > nav');
    const bottom = nav ? nav.getBoundingClientRect().bottom : 0;
    const top    = bottom > 0 ? Math.round(bottom) - 1 : 62;
    document.documentElement.style.setProperty('--sticky-bar-top', top + 'px');
    // Keep scroll-padding-top in sync so hash jumps always clear both sticky bars
    const barH = stickyBar.classList.contains('visible') ? stickyBar.offsetHeight : 0;
    document.documentElement.style.setProperty('--scroll-pad', (top + barH + 6) + 'px');
  }
  _updateTop();
  window.addEventListener('load',   _updateTop, { once: true });
  window.addEventListener('resize', _updateTop, { passive: true });
  // Re-measure on scroll too: if the nav is not sticky (e.g. page not yet scrolled to
  // its threshold) the nav bottom changes with scroll. rAF-throttled to stay smooth.
  var _utRaf = null;
  window.addEventListener('scroll', function() {
    if (_utRaf) return;
    _utRaf = requestAnimationFrame(function() { _utRaf = null; _updateTop(); });
  }, { passive: true });

  // ── Show/hide: only after inline filter has scrolled off the top ──
  // Using IntersectionObserver is far more reliable than a hardcoded scrollY
  // threshold (the old 140px fired while the inline filter was still on screen).
  function _toggle(visible) {
    stickyBar.classList.toggle('visible', visible);
    _updateTop(); // recompute scroll-pad whenever visibility changes
  }

  if (inlineFilter && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(([entry]) => {
      // Show sticky bar only when the inline filter has scrolled ABOVE the viewport.
      // entry.boundingClientRect.top < 0  → element is above the viewport top.
      const offTop = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      _toggle(offTop);
    }, { root: null, threshold: 0 });
    obs.observe(inlineFilter);
  } else {
    // Fallback for browsers without IntersectionObserver
    window.addEventListener('scroll', function() {
      if (!inlineFilter) return;
      _toggle(inlineFilter.getBoundingClientRect().bottom < 0);
    }, { passive: true });
  }
}

/* ════════════════════════════════════════════════════════
   INITIALIZE
   ════════════════════════════════════════════════════════ */
let _leafletMap = null;
let _lastSl     = sessions;

buildVehicleFilter();
rebuild(sessions);
initStickyBar();
initPrint();

// Use window.onload so all external scripts (Leaflet) are guaranteed loaded
// and the DOM is fully painted with real dimensions before we call L.map()
window.addEventListener('load', function() {
  // Initialise Leaflet map after DOM is fully painted
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

  // Only show locations that have sessions in the current (possibly vehicle-filtered) set
  const geoLocs = (locationData || []).filter(l => l.lat && l.lng && stats[l.location]);
  if (!geoLocs.length) return;

  // Clear old markers
  _leafletMap.eachLayer(l => { if (!(l instanceof L.TileLayer)) _leafletMap.removeLayer(l); });

  // maxKwh from the filtered set so pin sizes scale relative to the active vehicle
  const maxKwh = Math.max(...geoLocs.map(l => stats[l.location].kwh), 1);
  const bounds = [];

  geoLocs.forEach(loc => {
    const st    = stats[loc.location];
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
  // Wire sort headers once — onclick is a property assignment so no accumulation,
  // but querying and reassigning on every rebuild() is wasteful.
  if (!_locHdrsWired) {
    _locHdrsWired = true;
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
  }
  renderLocationStats();
}

function renderLocationStats() {
  const tbody = document.getElementById('locationStatsBody');
  if (!tbody) { console.warn('[LocStats] tbody not found'); return; }
  if (!_locSl.length) { console.warn('[LocStats] _locSl is empty'); return; }

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
    { icon:'🔋', label:'Biggest Session',        value: fmtKwh(bigSession.kwh),                         sub: bigSession.date + ' · ' + bigSession.bucket },
    { icon:'📅', label:'Peak Energy Month',       value: fmtKwh(monthly[bestMonthKwh].kwh),              sub: monthLabel(bestMonthKwh) },
    { icon:'💰', label:'Largest Monthly Savings', value: fmtUSD(monthly[bestMonthSaving].saving),        sub: monthLabel(bestMonthSaving) },
    { icon:'📅', label:'Busiest Month',           value: monthly[mostSessionsMo].sessions + ' sessions', sub: monthLabel(mostSessionsMo) },
    { icon:'🔌', label:'Longest Streak',          value: maxStreak + (maxStreak === 1 ? ' day' : ' days'), sub: streakSub },
    { icon:'⚡', label:'Favorite Spot',           value: bucketEntries[0][0],                            sub: fmtKwh(bucketEntries[0][1]) + ' all-time' },
  ];

  document.getElementById('recordsGrid').innerHTML = recs.map(function(r){
    return '<div class="record-card">'
      + '<span class="record-icon">'  + r.icon  + '</span>'
      + '<div class="record-body">'
      + '<span class="record-label">' + r.label + '</span>'
      + '<span class="record-value">' + r.value + '</span>'
      + '<span class="record-sub">'   + r.sub   + '</span>'
      + '</div>'
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

  // Build dayMap (total kWh) and dayBucketMap (kWh per bucket per day)
  var dayMap = {};
  var dayBucketMap = {}; // { 'YYYY-MM-DD': { Work:0, Home:0, 'Tesla SC':0, ... } }
  sl.forEach(function(s) {
    dayMap[s.date] = (dayMap[s.date] || 0) + s.kwh;
    if (!dayBucketMap[s.date]) dayBucketMap[s.date] = {};
    dayBucketMap[s.date][s.bucket] = (dayBucketMap[s.date][s.bucket] || 0) + s.kwh;
  });

  // Determine dominant bucket for a day (most kWh)
  function dominantBucket(ds) {
    var bm = dayBucketMap[ds];
    if (!bm) return null;
    return Object.keys(bm).reduce(function(a, b) { return bm[a] >= bm[b] ? a : b; });
  }

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

  // Generic purple palette (all-vehicles mode)
  var PALS = {
    light: ['#e8e8e8', '#d4baf5', '#a67ce0', '#7b1fa2', '#3d0066'],
    dark:  ['#2a2a2a', '#3b2060', '#6a2fa0', '#9c27b0', '#e040fb']
  };

  // Per-bucket palettes for single-vehicle mode
  // Each has 5 stops: [empty, faint, light, mid, strong]
  var BUCKET_PALS = {
    light: {
      'Work':       ['#e8e8e8', '#bbdefb', '#64b5f6', '#0288d1', '#01579b'],
      'Home':       ['#e8e8e8', '#d4baf5', '#a67ce0', '#7b1fa2', '#3d0066'],
      'Tesla SC':   ['#e8e8e8', '#ffcdd2', '#ef9a9a', '#e53935', '#7f0000'],
      'ChargePoint':['#e8e8e8', '#ffe0b2', '#ffb74d', '#FF7A14', '#bf360c'],
      'Blink':      ['#e8e8e8', '#c8e6c9', '#81c784', '#43a047', '#1b5e20'],
      'Rivian':     ['#e8e8e8', '#fff9c4', '#fff176', '#fdd835', '#f57f17'],
      'Other':      ['#e8e8e8', '#e0e0e0', '#bdbdbd', '#757575', '#424242'],
    },
    dark: {
      'Work':       ['#2a2a2a', '#0d2744', '#1565c0', '#1e88e5', '#64b5f6'],
      'Home':       ['#2a2a2a', '#3b2060', '#6a2fa0', '#9c27b0', '#e040fb'],
      'Tesla SC':   ['#2a2a2a', '#4a1010', '#c62828', '#ef5350', '#ff8a80'],
      'ChargePoint':['#2a2a2a', '#3a1a00', '#bf360c', '#f4511e', '#ff8a65'],
      'Blink':      ['#2a2a2a', '#0a2a0a', '#2e7d32', '#43a047', '#81c784'],
      'Rivian':     ['#2a2a2a', '#332600', '#f57f17', '#fdd835', '#fff176'],
      'Other':      ['#2a2a2a', '#333333', '#555555', '#888888', '#bdbdbd'],
    }
  };

  // Map bucket → label for legend
  var BUCKET_LABELS = {
    'Work': 'Work', 'Home': 'Home', 'Tesla SC': 'Tesla SC',
    'ChargePoint': 'ChargePoint', 'Blink': 'Blink', 'Rivian': 'Rivian', 'Other': 'Public/Other'
  };

  // Are we in single-vehicle mode?
  var singleVehicle = activeVehicle && activeVehicle !== 'all';

  function getPalette(bucket) {
    var theme = isDark() ? 'dark' : 'light';
    if (!singleVehicle) return PALS[theme];
    var b = bucket || 'Home';
    return (BUCKET_PALS[theme][b] || BUCKET_PALS[theme]['Home']);
  }

  function cellCol(kwh, bucket) {
    var p = getPalette(bucket);
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
    singleVehicle = activeVehicle && activeVehicle !== 'all';

    /* Month labels */
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
        var ds      = localDate(day);
        var kwh     = dayMap[ds] || 0;
        var bucket  = dominantBucket(ds);
        var future  = day > today;

        // Build tooltip: show kWh and, in single-vehicle mode, dominant location type
        var tipParts = [];
        if (kwh > 0) {
          tipParts.push(ds + ': ' + kwh.toFixed(1) + ' kWh');
          if (singleVehicle && bucket) tipParts.push(BUCKET_LABELS[bucket] || bucket);
          // If multiple buckets on same day, note it
          var bm = dayBucketMap[ds];
          if (bm && Object.keys(bm).length > 1) {
            var parts = Object.keys(bm).map(function(b) { return (BUCKET_LABELS[b]||b) + ' ' + bm[b].toFixed(1) + ' kWh'; });
            tipParts.push('(' + parts.join(' + ') + ')');
          }
        } else {
          tipParts.push(ds);
        }
        var tip = tipParts.join(' · ');

        var bg = future ? 'transparent' : cellCol(kwh, bucket);
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

    /* Legend */
    var leg = '<div style="display:flex;align-items:center;gap:6px;margin-top:12px;'
            + 'margin-left:' + DOW_LEFT + 'px;flex-wrap:wrap;">';

    if (singleVehicle) {
      // Show one swatch per bucket that is the DOMINANT bucket on at least one day
      var bucketsInData = [...new Set(Object.keys(dayBucketMap).map(dominantBucket).filter(Boolean))].sort();
      leg += '<span style="font-size:10px;color:#888;margin-right:4px;">Location:</span>';
      bucketsInData.forEach(function(b) {
        var pal = isDark() ? BUCKET_PALS.dark[b] : BUCKET_PALS.light[b];
        if (!pal) return;
        leg += '<div style="display:flex;align-items:center;gap:3px;margin-right:6px;">'
             + '<div style="width:' + CELL + 'px;height:' + CELL + 'px;background:' + pal[3] + ';'
             + 'border-radius:3px;flex-shrink:0;"></div>'
             + '<span style="font-size:10px;color:' + (isDark() ? '#aaa' : '#666') + '">' + (BUCKET_LABELS[b]||b) + '</span>'
             + '</div>';
      });
      leg += '<span style="font-size:10px;color:#aaa;margin-left:8px;">color = dominant location · intensity = kWh</span>';
    } else {
      // Generic intensity legend
      var thresh = [0, Math.round(maxDay*0.20), Math.round(maxDay*0.45), Math.round(maxDay*0.75), Math.round(maxDay)];
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
    }
    leg += '</div>';

    el.innerHTML = mHtml + gHtml + leg;
  }

  // Store current render fn so the single themeChanged listener always uses fresh data
  _hmRender = render;
  render();

  // Wire events exactly once — guards against listener accumulation on each rebuild()
  if (!_heatmapWired) {
    _heatmapWired = true;
    window.addEventListener('themeChanged', function() { if (_hmRender) _hmRender(); });

    /* Tooltip — delegated on the container, wired once */
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

/* ════════════════════════════════════════════════════════
   PRINT / PDF REPORT
   ════════════════════════════════════════════════════════ */
const PRINT_SECTIONS = [
  { id: 'kpi',          label: 'KPI Summary',            icon: '📊' },
  { id: 'records',      label: 'Personal Records',       icon: '🏆' },
  { id: 'heatmap',      label: 'Year at a Glance',       icon: '📅' },
  { id: 'monthly',      label: 'Monthly Breakdown',      icon: '📊' },
  { id: 'sources',      label: 'Charging Sources',       icon: '📍' },
  { id: 'economics',    label: 'Economics',              icon: '💰' },
  { id: 'trends',       label: 'Trends',                 icon: '📈' },
  { id: 'sessions',     label: 'Session Deep Dive',      icon: '🔍' },
  { id: 'seasonal',     label: 'Season Over Season',     icon: '❄️' },
  { id: 'economics2',   label: 'Economics Deep Dive',    icon: '💎' },
  { id: 'co2',          label: 'CO₂ Avoidance',          icon: '🌿' },
  { id: 'roadtrips',    label: 'Road Trips',             icon: '🚗' },
  { id: 'vehiclecomp',  label: 'Vehicle Comparison',     icon: '🔄' },
  { id: 'sessiondetail',label: 'Session Detail',         icon: '🔬' },
  { id: 'efficiency',   label: 'Real-World Efficiency',  icon: '⚡' },
  { id: 'map',          label: 'Locations Map',          icon: '🗺️' },
];

// Wrapped section id → DOM element id (these are already container divs)
const _WRAPPED_IDS = {
  vehiclecomp:   'vehicleCompSection',
  sessiondetail: 'detailSection',
  efficiency:    'efficiencySection',
};

// Tag every direct child of .analytics-container with its section id once at init
function tagPrintSections() {
  const container = document.querySelector('.analytics-container');
  if (!container) return;
  const WRAPPED = { vehicleCompSection:'vehiclecomp', detailSection:'sessiondetail', efficiencySection:'efficiency' };
  let cur = null;
  Array.from(container.children).forEach(el => {
    // Wrapped container divs: assign their own section id
    if (el.id && WRAPPED[el.id]) { cur = WRAPPED[el.id]; el.dataset.printSec = cur; return; }
    // Section-header marks start of a new section
    if (el.classList.contains('section-header') && el.id) cur = el.id;
    // KPI strip sits before the first section-header
    if (!cur && el.classList.contains('kpi-strip')) { el.dataset.printSec = 'kpi'; return; }
    if (cur) el.dataset.printSec = cur;
  });
}

// Populate the section checklist — called each time the panel opens
function buildPrintPanel() {
  const list = document.getElementById('printSectionList');
  if (!list) return;
  list.innerHTML = PRINT_SECTIONS.map(s => {
    // Conditional sections: skip if currently hidden (no data for active vehicle)
    if (_WRAPPED_IDS[s.id]) {
      const el = document.getElementById(_WRAPPED_IDS[s.id]);
      if (!el || el.style.display === 'none') return '';
    }
    if (s.id === 'kpi' && !document.querySelector('[data-print-sec="kpi"]')) return '';
    return `<label style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;cursor:pointer" onmouseover="this.style.background='var(--dash-border)'" onmouseout="this.style.background=''">
      <input type="checkbox" class="print-cb" value="${s.id}" checked style="width:15px;height:15px;accent-color:var(--link);flex-shrink:0;cursor:pointer">
      <span style="width:1.3em;text-align:center">${s.icon}</span>
      <span style="font-weight:600;color:var(--text);font-size:0.85rem">${s.label}</span>
    </label>`;
  }).join('');
}

const _printOrig = new Map();

function applyPrintState() {
  const selected = new Set(
    Array.from(document.querySelectorAll('.print-cb:checked')).map(cb => cb.value)
  );
  _printOrig.clear();

  // Hide all section elements not in the selected set
  document.querySelectorAll('[data-print-sec]').forEach(el => {
    if (!selected.has(el.dataset.printSec)) {
      _printOrig.set(el, el.style.display);
      el.style.display = 'none';
    }
  });

  // Mark the first visible section-header so print CSS suppresses its page-break
  document.querySelectorAll('.print-first-sec').forEach(el => el.classList.remove('print-first-sec'));
  let firstFound = false;
  document.querySelectorAll('.section-header').forEach(hdr => {
    if (firstFound) return;
    const sec = hdr.closest('[data-print-sec]')?.dataset.printSec;
    if (sec && selected.has(sec)) { hdr.classList.add('print-first-sec'); firstFound = true; }
  });
}

function clearPrintState() {
  _printOrig.forEach((val, el) => {
    el.style.removeProperty('display');
    if (val) el.style.display = val;
  });
  _printOrig.clear();
  document.querySelectorAll('.print-first-sec').forEach(el => el.classList.remove('print-first-sec'));
}

function initPrint() {
  tagPrintSections();
  const fab   = document.getElementById('printFab');
  const panel = document.getElementById('printPanel');
  if (!fab || !panel) return;

  fab.onclick   = () => { buildPrintPanel(); panel.classList.toggle('open'); };
  document.getElementById('printClose').onclick     = () => panel.classList.remove('open');
  document.getElementById('printSelectAll').onclick  = () => document.querySelectorAll('.print-cb').forEach(cb => cb.checked = true);
  document.getElementById('printSelectNone').onclick = () => document.querySelectorAll('.print-cb').forEach(cb => cb.checked = false);
  document.getElementById('doPrint').onclick = () => {
    panel.classList.remove('open');
    // Brief delay so panel closes before browser opens the print dialog
    setTimeout(() => { applyPrintState(); window.print(); }, 80);
  };
  window.addEventListener('afterprint', clearPrintState);
}
</script>
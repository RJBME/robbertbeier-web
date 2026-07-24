---
layout: default
title: EV Analytics
permalink: /charging-analytics/
---
{% assign sorted_sessions = site.charging | sort: "date" %}

<style>
  /* ── Page-level overrides ── */
  body { max-width: 1100px !important; overflow-x: clip; overflow-x: hidden; }
  /* overflow-x:clip preferred (doesn't create scroll container, safer for sticky);
     overflow-x:hidden is the Safari 15 fallback — both declarations are intentional,
     browsers take the last valid one they understand. clip is supported in Safari 16+. */
  /* NOTE: do NOT set overflow on <html> — it breaks position:sticky on the site nav.
     overflow-x:clip on body clips horizontal bleed without creating a scroll container. */
  /* offset hash-jump targets so they clear both sticky bars */
  :root { scroll-padding-top: var(--scroll-pad, 70px); }

  /* On mobile (< 768px) the Jekyll nav is position:relative — it scrolls away.
     The sticky bar must sit at top:0 on mobile, not below the nav. */
  /* Safe area inset as CSS variable — works once viewport-fit=cover is set */
  :root { --sat: env(safe-area-inset-top, 0px); }

  @media (max-width: 767px) {
    #vehicleFilterSticky { top: var(--sat) !important; }
  }

  .analytics-container {
    font-family: -apple-system, sans-serif;
    max-width: 1060px;
    width: 100%;
    margin: auto;
    color: var(--text);
    box-sizing: border-box;
    overflow-x: clip;
    /* Smooth opacity transition masks the chart destroy/rebuild flash */
    transition: opacity 0.15s ease;
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
  .analytics-header p  { color: #666; font-size: 0.85rem; margin: 0; }
  [data-theme="dark"] .analytics-header p { color: #aaa; }

  /* ── Section quick-nav pills ── */
  .section-nav { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
  .section-nav a { background: var(--dash-card); border: 1px solid var(--dash-border); padding: 5px 14px; border-radius: 20px; font-size: 0.76rem; color: #888; text-decoration: none; font-weight: 600; transition: all 0.15s; }
  .section-nav a:hover  { border-color: var(--link); color: var(--link); }
  .section-nav a.active { background: var(--link); border-color: var(--link); color: #fff; font-weight: 700; }

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
  .section-header span { font-size: 0.75rem; color: #666; }
  [data-theme="dark"] .section-header span { color: #aaa; }

  /* ── New-feature badge ── */
  .new-badge {
    display: inline-block;
    font-size: 0.6rem; font-weight: 600; letter-spacing: 0.04em;
    color: #888; margin-left: 6px; vertical-align: middle;
    white-space: nowrap;
  }

  /* ── Chart grids ── */
  /* minmax(0,1fr) (not 1fr) so tracks can shrink below child min-content —
     otherwise a Chart.js canvas with an inline pixel width forces the track
     wider than the viewport and the chart is clipped on narrow screens. */
  .chart-grid-2 { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 18px; margin-bottom: 18px; }
  .chart-grid-3 { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr) minmax(0,1fr); gap: 18px; margin-bottom: 18px; }
  .chart-full  { margin-bottom: 18px; }

  /* ── Chart card ── */
  .chart-card {
    background: var(--dash-card); border: 1px solid var(--dash-border);
    border-radius: 12px; padding: 18px 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    max-width: 100%; min-width: 0; box-sizing: border-box;
    /* CSS containment: layout+style prevents child changes from
       causing reflow outside the card. Safe in all modern browsers. */
    contain: layout style;
  }
  /* Promote chart canvases to their own compositor layer only when
     actively rendering — avoids permanent VRAM usage for static charts */
  .chart-wrap canvas { will-change: auto; }
  .chart-title {
    font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.07em; color: #666; margin: 0 0 14px 0;
  }
  [data-theme="dark"] .chart-title { color: #bbb; }
  .chart-wrap { position: relative; }

  /* ── Top sessions table ── */
  .top-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; color: var(--text); }
  .top-table th {
    text-align: left; padding: 7px 10px; background: var(--table-head);
    border-bottom: 2px solid var(--dash-border); font-size: 0.68rem;
    text-transform: uppercase; letter-spacing: 0.05em; color: #666;
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
  .badge-ea     { background: #e0f6ec; color: #00963f; }
  .badge-wc     { background: #e9f5e8; color: #3d8b3c; }
  .badge-other  { background: #f5f5f5; color: #616161; }

  /* ── Insight callout ── */
  .insight-row { display: flex; gap: 14px; margin-bottom: 18px; flex-wrap: wrap; }
  .insight-chip {
    background: var(--dash-card); border: 1px solid var(--dash-border);
    border-radius: 8px; padding: 10px 14px; font-size: 0.78rem;
    flex: 1 1 180px;
  }
  .insight-chip strong { color: var(--link); }

  /* ── Chart subtitle (was used in markup but never defined) ── */
  .chart-sub {
    display: block;
    font-size: 0.68rem;
    color: #888;
    margin: 2px 0 0;
    line-height: 1.4;
  }

  /* ── Scroll progress bar ── */
  #scrollProgress {
    position: fixed; top: 0; left: 0; height: 3px; width: 0;
    background: linear-gradient(90deg, var(--link), #a389f4);
    z-index: 700; pointer-events: none; transition: width 0.08s linear;
  }

  /* ── Raw session data table ── */
  .data-table-wrap {
    overflow: auto; max-height: 540px;
    border: 1px solid var(--dash-border); border-radius: 10px;
    -webkit-overflow-scrolling: touch;
  }
  .data-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; min-width: 760px; }
  .data-table thead th {
    position: sticky; top: 0; z-index: 1; background: var(--dash-card);
    border-bottom: 2px solid var(--dash-border); padding: 9px 12px; text-align: left;
    font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.06em;
    color: #888; cursor: pointer; white-space: nowrap; user-select: none;
  }
  .data-table thead th[data-active="true"] { color: var(--link); }
  .data-table tbody td { padding: 7px 12px; border-bottom: 1px solid var(--dash-border); white-space: nowrap; }
  .data-table tbody tr:hover { background: rgba(93,63,211,0.06); }
  .data-table .dt-num { text-align: right; font-variant-numeric: tabular-nums; }
  #dataTableMeta { font-size: 0.72rem; color: #888; margin: 0 0 10px; }

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
  /* Active pill uses its car's paint colour (--vf-color) — "All Vehicles" falls back to purple. */
  .vf-btn.active { background: var(--vf-color, var(--link)); color: var(--vf-text, #fff); border-color: var(--vf-color, var(--link)); }

  /* ── Sticky vehicle filter bar ── */
  #vehicleFilterSticky {
    display: none;          /* only shown via .visible class after scrolling */
    position: fixed;
    top: var(--sticky-bar-top, -200px); /* JS sets this after measuring site nav */
    left: 0; right: 0;
    z-index: 490;           /* intentionally BELOW site nav (z-index:500) */
    background: var(--bg);
    border-bottom: 2px solid var(--dash-border);
    flex-direction: column;
    gap: 0;
  }
  /* Show via display only — no transform trick (breaks when height is 0 on init) */
  #vehicleFilterSticky.visible { display: flex; }
  #stickyNavRow {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 6px 20px 5px;
    border-bottom: 1px solid var(--dash-border);
    max-width: 1060px; margin: 0 auto; box-sizing: border-box; width: 100%;
  }
  @media (max-width: 767px) {
    #stickyNavRow {
      flex-wrap: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none; /* Firefox */
      padding: 6px 12px 5px;
      gap: 4px;
    }
    #stickyNavRow::-webkit-scrollbar { display: none; } /* Safari/Chrome */
    #stickyVehicleRow { padding: 5px 12px 6px; gap: 6px; }
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
    .chart-grid-2, .chart-grid-3 { grid-template-columns: minmax(0,1fr); }
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

  /* ── Perspective Hero Cards ── */
  .perspective-section {
    margin-bottom: 32px;
  }
  .perspective-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }
  @media (max-width: 900px) { .perspective-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .perspective-grid { grid-template-columns: 1fr 1fr; gap: 10px; } }

  .hero-card {
    background: var(--dash-card);
    border: 1px solid var(--dash-border);
    border-radius: 14px;
    padding: 18px 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
    overflow: hidden;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .hero-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(93,63,211,0.15);
  }
  .hero-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 14px 14px 0 0;
  }
  .hero-card.c-purple::before { background: linear-gradient(90deg, #5D3FD3, #a389f4); }
  .hero-card.c-green::before  { background: linear-gradient(90deg, #2ecc71, #1a9e54); }
  .hero-card.c-blue::before   { background: linear-gradient(90deg, #0288d1, #4fc3f7); }
  .hero-card.c-amber::before  { background: linear-gradient(90deg, #f39c12, #f5c842); }
  .hero-card.c-red::before    { background: linear-gradient(90deg, #e74c3c, #f1948a); }
  .hero-card.c-teal::before   { background: linear-gradient(90deg, #1abc9c, #76d7c4); }
  .hero-card.c-pink::before   { background: linear-gradient(90deg, #9b59b6, #d7bde2); }
  .hero-card.c-orange::before { background: linear-gradient(90deg, #FF7A14, #ffb347); }

  .hero-icon { font-size: 1.6rem; line-height: 1; margin-bottom: 2px; }
  .hero-number {
    font-size: 1.9rem;
    font-weight: 900;
    color: var(--text);
    line-height: 1.1;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }
  .hero-number sup { font-size: 0.55em; font-weight: 600; vertical-align: super; opacity: 0.7; }
  .hero-label {
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888;
    font-weight: 700;
  }
  .hero-desc {
    font-size: 0.78rem;
    color: var(--text);
    line-height: 1.45;
    margin-top: 2px;
    flex: 1;
  }
  .hero-footnote {
    font-size: 0.62rem;
    color: #aaa;
    margin-top: 4px;
    line-height: 1.4;
  }

  /* ── Mobile overrides ── */
  @media (max-width: 600px) {
    /* Gas sensitivity KPIs: 4-col → 2×2 */
    #sensitivityKpis { grid-template-columns: repeat(2, 1fr) !important; }
    /* Top-10 table: allow horizontal scroll instead of truncating */
    .top-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .top-table { min-width: 480px; }
    /* Perspective hero cards: 2-col on small screens */
    .perspective-grid { grid-template-columns: repeat(2, 1fr) !important; }
    /* KPI strips: 2-col on small screens */
    .kpi-strip { grid-template-columns: repeat(2, 1fr) !important; }
    /* Chart grid: single col */
    .chart-grid-2 { grid-template-columns: minmax(0,1fr) !important; }
  }
  .ev-map-icon { background: transparent !important; border: none !important; overflow: visible !important; }
  /* Proportional-symbol marker: translucent fill + crisp colored ring (size =
     kWh) with a small white-outlined center dot marking the exact location. */
  .ev-sym  { position: relative; }
  .ev-fill { position: absolute; inset: 0; border-radius: 50%; opacity: 0.32; }
  .ev-edge { position: absolute; inset: 0; border-radius: 50%; border: 2px solid; opacity: 0.9; box-shadow: 0 1px 5px rgba(0,0,0,0.22); }
  .ev-core { position: absolute; top: 50%; left: 50%; width: 7px; height: 7px; margin: -3.5px 0 0 -3.5px; border-radius: 50%; box-shadow: 0 0 0 2px #fff, 0 1px 2px rgba(0,0,0,0.45); }
  .ev-map-icon { cursor: pointer; }
  .ev-sym { transition: transform 0.12s ease; }
  .ev-map-icon:hover { z-index: 1000 !important; }
  .ev-map-icon:hover .ev-sym { transform: scale(1.14); }
  #chargingMap .leaflet-tooltip { background: var(--dash-card,#fff); color: var(--text,#333); border: 1px solid var(--dash-border,#ddd); box-shadow: 0 2px 8px rgba(0,0,0,0.18); font-weight: 600; font-size: 11px; padding: 3px 8px; }
  #chargingMap .leaflet-tooltip-top::before { border-top-color: var(--dash-border,#ddd); }
  #chargingMap { border-radius: 10px; }
  #chargingMap .leaflet-popup-content-wrapper { background: var(--dash-card,#fff); color: var(--text,#333); border: 1px solid var(--dash-border,#ddd); box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
  #chargingMap .leaflet-popup-tip { background: var(--dash-card,#fff); }
  /* Map controls: Fit-all button, size legend, scroll hint */
  .ev-fit-btn svg { vertical-align: middle; }
  .ev-size-legend { background: var(--dash-card,#fff); color: var(--text,#333); border: 1px solid var(--dash-border,#ddd); border-radius: 8px; padding: 6px 9px; font-size: 10px; line-height: 1.3; box-shadow: 0 1px 6px rgba(0,0,0,0.18); }
  .ev-lg-scale { display: flex; align-items: flex-end; gap: 4px; margin-top: 5px; }
  .ev-lg-c { display: inline-block; border-radius: 50%; background: #6b7280; opacity: 0.4; }
  .ev-map-hint { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); z-index: 1000; background: rgba(0,0,0,0.72); color: #fff; font-size: 11px; font-weight: 600; padding: 3px 11px; border-radius: 14px; pointer-events: none; opacity: 0; transition: opacity 0.15s; white-space: nowrap; }
  .ev-map-hint.show { opacity: 1; }

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
    #scrollProgress,
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
    <a href="/trip-calculator/"   style="font-size:0.78rem;font-weight:600;color:#888;text-decoration:none;padding:5px 14px;border:1px solid var(--dash-border);border-radius:20px;background:var(--dash-card);transition:all 0.15s" onmouseover="this.style.borderColor='var(--link)';this.style.color='var(--link)'" onmouseout="this.style.borderColor='var(--dash-border)';this.style.color='#888'">🧭 Trip</a>
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
    <a href="#perspective">🌍 Perspective</a>
    <a href="#heatmap">Heatmap</a>
    <a href="#monthly">Monthly</a>
    <a href="#sources">Sources</a>
    <a href="#mileage">🚗 Mileage</a>
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
      <a href="/trip-calculator/" style="opacity:0.55;font-size:0.62rem;padding:2px 7px">🧭 Trip</a>
      <span style="color:var(--dash-border);margin:0 4px;align-self:center">│</span>
      <a href="#records">Records</a>
      <a href="#perspective">🌍 Perspective</a>
      <a href="#heatmap">Heatmap</a>
      <a href="#monthly">Monthly</a>
      <a href="#sources">Sources</a>
      <a href="#mileage">🚗 Mileage</a>
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
  <p style="font-size:0.64rem;color:#888;margin:10px 4px 0;line-height:1.55">
    <strong>Avg ¢/kWh</strong> is total cost ÷ energy added to the car. <strong>Home charging cost includes an
    estimated +10%</strong> for wall-side losses (AC→DC): you pay for a little more energy than actually reaches
    the battery, so home ¢/kWh sits ~10% above the raw electricity rate. Adjust <code>home_charge_uplift</code>
    in <code>_data/rates.yml</code> to change it. Public fast-charging cost is the billed amount (no uplift).
  </p>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  MONTHLY AI SUMMARY                                -->
  <!-- ═══════════════════════════════════════════════════ -->
  {% if site.data.monthly_summaries and site.data.monthly_summaries.size > 0 %}
  {% assign latest = site.data.monthly_summaries | first %}
  {% if latest.summary and latest.summary != "" and latest.summary != "Paste your first generated summary here after running the tool." %}
  <div style="background:linear-gradient(135deg,rgba(93,63,211,0.08),rgba(93,63,211,0.04));border:1px solid rgba(93,63,211,0.25);border-radius:14px;padding:20px 22px;margin-bottom:24px;position:relative;overflow:hidden">
    <div style="position:absolute;top:0;right:0;width:120px;height:120px;background:radial-gradient(circle at top right,rgba(93,63,211,0.15),transparent 70%);pointer-events:none"></div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
      <span style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--link);font-weight:700">⚡ Monthly Snapshot</span>
      <span style="background:rgba(93,63,211,0.15);border:1px solid rgba(93,63,211,0.3);border-radius:6px;font-size:0.68rem;font-family:monospace;color:var(--link);padding:2px 10px">{{ latest.label }}</span>
      <div style="margin-left:auto;display:flex;gap:14px;flex-wrap:wrap">
        {% if latest.kwh > 0 %}<span style="font-size:0.72rem;color:#888"><strong style="color:var(--text)">{{ latest.kwh }}</strong> kWh</span>{% endif %}
        {% if latest.saving > 0 %}<span style="font-size:0.72rem;color:#888">saved <strong style="color:#2ecc71">${{ latest.saving }}</strong></span>{% endif %}
        {% if latest.co2_avoided > 0 %}<span style="font-size:0.72rem;color:#888"><strong style="color:#2ecc71">{{ latest.co2_avoided }}</strong> kg CO₂ avoided</span>{% endif %}
      </div>
    </div>
    <p style="font-size:0.92rem;line-height:1.75;color:var(--text);margin:0">{{ latest.summary }}</p>
    {% if site.data.monthly_summaries.size > 1 %}
    <details style="margin-top:14px">
      <summary style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.1em;color:#888;cursor:pointer;list-style:none;display:flex;align-items:center;gap:6px">
        <span style="transition:transform 0.2s" id="summaryArrow">▶</span> Previous months
      </summary>
      <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px" onclick="this.previousElementSibling.querySelector('#summaryArrow').style.transform='rotate(90deg)'">
        {% for entry in site.data.monthly_summaries offset:1 limit:5 %}
        {% if entry.summary and entry.summary != "" %}
        <div style="border-left:2px solid rgba(93,63,211,0.3);padding:8px 14px;opacity:0.8">
          <div style="font-size:0.65rem;font-family:monospace;color:var(--link);margin-bottom:5px;text-transform:uppercase;letter-spacing:0.08em">{{ entry.label }}{% if entry.kwh > 0 %} · {{ entry.kwh }} kWh{% endif %}{% if entry.saving > 0 %} · ${{ entry.saving }} saved{% endif %}</div>
          <p style="font-size:0.84rem;line-height:1.65;color:var(--text);margin:0">{{ entry.summary }}</p>
        </div>
        {% endif %}
        {% endfor %}
      </div>
    </details>
    {% endif %}
  </div>
  {% endif %}
  {% endif %}

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
  <!--  PERSPECTIVE: WHAT DOES IT ALL MEAN?               -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div class="section-header" id="perspective">
    <h2>🌍 Perspective</h2>
    <span>putting your numbers in context</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <div class="perspective-section">
    <div class="perspective-grid" id="heroCardGrid">
      <!-- populated by JS -->
    </div>
    <p style="font-size:0.68rem;color:#777;margin-top:12px;line-height:1.6" id="heroFootnote"></p>
  </div>

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
      <span class="badge badge-ea">Electrify America</span>
      <span class="badge badge-wc">WeCharge</span>
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
    <p id="membershipNote" style="font-size:0.68rem;color:#777;margin:10px 4px 0;line-height:1.6;display:none"></p>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!--  SECTION: MILEAGE & GAS PRICE                      -->
  <!-- ═══════════════════════════════════════════════════ -->
  <div class="section-header" id="mileage">
    <h2>🚗 Mileage & Fuel Rates</h2>
    <span>odometer history, miles driven, and gas price over time</span>
    <a href="#top" class="back-top-pill">↑ top</a>
  </div>

  <div class="chart-grid-2">
    <div class="chart-card">
      <p class="chart-title">Odometer History — miles over time</p>
      <p class="chart-sub" style="font-size:0.68rem;color:#888">All recorded readings per vehicle</p>
      <div class="chart-wrap" style="height:230px"><canvas id="chartOdometer"></canvas></div>
    </div>
    <div class="chart-card">
      <p class="chart-title">Miles Driven Per Month (estimated from readings)</p>
      <p class="chart-sub" style="font-size:0.68rem;color:#888">Interpolated between odometer readings</p>
      <div class="chart-wrap" style="height:230px"><canvas id="chartMilesPerMonth"></canvas></div>
    </div>
  </div>

  <div class="chart-grid-2" style="margin-top:18px">
    <div class="chart-card">
      <p class="chart-title">Gas Price History ($/gal)</p>
      <p class="chart-sub" style="font-size:0.68rem;color:#888">Assumed price used for savings calculations — update in _data/rates.yml</p>
      <div class="chart-wrap" style="height:230px"><canvas id="chartGasPriceMileage"></canvas></div>
    </div>
    <div class="chart-card">
      <p class="chart-title">Real Efficiency — mi/kWh (left) · Wh/mi (right)</p>
      <p class="chart-sub" style="font-size:0.68rem;color:#888">From sessions with FordPass miles_added data · tooltip shows both units</p>
      <div class="chart-wrap" style="height:230px"><canvas id="chartEfficiencyReal"></canvas></div>
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

  <!-- Charging cadence -->
  <div class="chart-grid-2" style="margin-top:18px">
    <div class="chart-card">
      <p class="chart-title">Charging Cadence — Days Between Plug-ins<span class="new-badge">✨ new</span></p>
      <span class="chart-sub" id="cadenceAvgNote">How frequently a charging day follows another</span>
      <div class="chart-wrap" style="height:240px"><canvas id="chartCadenceHist"></canvas></div>
    </div>
    <div class="chart-card">
      <p class="chart-title">Charging Cadence Over Time</p>
      <span class="chart-sub">Avg gap between charging days, by month — lower = charging more often</span>
      <div class="chart-wrap" style="height:240px"><canvas id="chartCadenceTrend"></canvas></div>
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
      <div class="top-table-wrap" style="overflow-x:auto; margin-top:4px">
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
      <p class="chart-title">Free Charging Index — % of kWh Charged Free per Month</p>
      <p class="chart-sub" style="font-size:0.68rem;color:#888;margin:-4px 0 6px">Stacked: Work vs. other free charging</p>
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

  <!-- Gas price sensitivity slider -->
  <div class="chart-full chart-card" style="margin-top:18px;margin-bottom:18px">
    <p class="chart-title">⛽ Gas Price Sensitivity — What If Gas Was $X/gal?</p>
    <span class="chart-sub">Drag the slider to see how your total savings change at different gas prices</span>
    <div style="display:flex;align-items:center;gap:16px;margin:16px 0 8px;flex-wrap:wrap">
      <span style="font-size:0.72rem;color:#888;white-space:nowrap">Gas price:</span>
      <input type="range" id="gasPriceSlider" min="2.00" max="6.00" step="0.05"
        style="flex:1;min-width:160px;max-width:340px;accent-color:var(--link)">
      <span style="font-size:1.4rem;font-weight:900;color:#f39c12;min-width:60px" id="gasPriceLabel">$3.26</span>
      <span style="font-size:0.72rem;color:#aaa">vs. your actual avg</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;container-type:inline-size" id="sensitivityKpis">
      <div style="background:var(--dash-card);border:1px solid var(--dash-border);border-radius:10px;padding:12px 14px;text-align:center">
        <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:4px">Total Savings</div>
        <div style="font-size:1.25rem;font-weight:900;color:#2ecc71" id="sensTotal">—</div>
      </div>
      <div style="background:var(--dash-card);border:1px solid var(--dash-border);border-radius:10px;padding:12px 14px;text-align:center">
        <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:4px">vs. Actual Rates</div>
        <div style="font-size:1.25rem;font-weight:900" id="sensDelta">—</div>
      </div>
      <div style="background:var(--dash-card);border:1px solid var(--dash-border);border-radius:10px;padding:12px 14px;text-align:center">
        <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:4px">Avg/Month</div>
        <div style="font-size:1.25rem;font-weight:900;color:var(--link)" id="sensMonthly">—</div>
      </div>
      <div style="background:var(--dash-card);border:1px solid var(--dash-border);border-radius:10px;padding:12px 14px;text-align:center">
        <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:4px">5-yr Projection</div>
        <div style="font-size:1.25rem;font-weight:900;color:#f39c12" id="sens5yr">—</div>
      </div>
    </div>
    <div class="chart-wrap" style="height:220px"><canvas id="chartGasSensitivity"></canvas></div>
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
      Comparison vehicle: <span id="co2BaselineNote">RJB → 2023 Escape (27 MPG) · LRB → 2016 Explorer (23 MPG)</span>.
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
        <p class="chart-title">Cost per Estimated Mile — Vehicle Comparison<span class="new-badge">✨ new · Jun '26</span></p>
        <div class="chart-wrap" style="height:240px"><canvas id="chartVehicleCpm"></canvas></div>
      </div>
      <div class="chart-card">
        <p class="chart-title">Session Size Distribution — Vehicle Comparison (histogram)</p>
        <div class="chart-wrap" style="height:240px"><canvas id="chartVehicleHistogram"></canvas></div>
      </div>
    </div>

    <div class="chart-full chart-card" style="margin-top:18px;margin-bottom:18px">
      <p class="chart-title">Efficiency Comparison — mi/kWh (left) · Wh/mi (right)</p>
      <p class="chart-sub" style="font-size:0.68rem;color:#888">Only months with FordPass miles_added data — gaps = no real data · hover for both units</p>
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
        <p class="chart-title">Avg Charge Rate by Location (kW)<span class="new-badge">✨ new · Jun '26</span></p>
        <span class="chart-sub">energy_kwh ÷ duration — includes idle time for Work &amp; Home overnight</span>
        <div class="chart-wrap" style="height:230px"><canvas id="chartAvgRate"></canvas></div>
      </div>
    </div>

    <!-- Charging speed spectrum -->
    <div class="chart-grid-2" style="margin-bottom:18px">
      <div class="chart-card">
        <p class="chart-title">Charging Speed Mix — Energy by Tier<span class="new-badge">✨ new</span></p>
        <span class="chart-sub">kWh delivered in each speed band — Level 2 vs DC fast (avg kW incl. idle)</span>
        <div class="chart-wrap" style="height:240px"><canvas id="chartSpeedMixEnergy"></canvas></div>
      </div>
      <div class="chart-card">
        <p class="chart-title">Sessions by Charging Speed</p>
        <span class="chart-sub">how many plug-ins land in each speed band</span>
        <div class="chart-wrap" style="height:240px"><canvas id="chartSpeedTierCount"></canvas></div>
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

    <!-- When do I charge — day × hour heatmap -->
    <div class="chart-full chart-card" style="margin-bottom:18px">
      <p class="chart-title">When Do I Charge? — Hour × Day of Week<span class="new-badge">✨ new · Jun '26</span></p>
      <span class="chart-sub">Darker = more sessions starting at that hour/day — only sessions with recorded start time</span>
      <div id="chargingWhenGrid" style="margin-top:14px;overflow-x:auto"></div>
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

    <div class="chart-full chart-card" style="margin-bottom:18px">
      <p class="chart-title">Energy In vs. Range Added — efficiency cloud<span class="new-badge">✨ new</span></p>
      <span class="chart-sub">Each dot is one session. Diagonal guides mark 2 / 3 / 4 mi/kWh — dots above a line beat that efficiency.</span>
      <div class="chart-wrap" style="height:300px"><canvas id="chartEnergyVsRange"></canvas></div>
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

    <!-- Temperature charts — only shown when temperature data is available -->
    <div id="tempChartsSection" style="display:none">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.82rem;color:var(--text)">
          <input type="checkbox" id="tempExcludeHome" style="accent-color:var(--link);width:15px;height:15px">
          Exclude Home sessions from scatter
          <span style="font-size:0.72rem;color:#888">(garage temp ≠ outdoor temp)</span>
        </label>
      </div>
      <div class="chart-grid-2" style="margin-bottom:18px">
        <div class="chart-card">
          <p class="chart-title">🌡️ Efficiency vs. Temperature<span class="new-badge">✨ new · Jun '26</span></p>
          <p class="chart-sub" style="font-size:0.68rem;color:#888">mi/kWh at each session's ambient temperature — cold weather penalty clearly visible</p>
          <div class="chart-wrap" style="height:260px"><canvas id="chartEffVsTemp"></canvas></div>
          <p style="font-size:0.62rem;color:#aaa;margin-top:6px">† Temperatures from Open-Meteo ERA5 outdoor ambient. Home sessions charged in garage — actual battery temp may be warmer in winter, cooler in summer.</p>
        </div>
        <div class="chart-card">
          <p class="chart-title">🌡️ Monthly Avg Temperature vs. Efficiency</p>
          <p class="chart-sub" style="font-size:0.68rem;color:#888">Seasonal pattern — both axes move together in winter</p>
          <div class="chart-wrap" style="height:260px"><canvas id="chartTempVsEffMonth"></canvas></div>
        </div>
      </div>

      <div class="chart-full chart-card" style="margin-bottom:18px">
        <p class="chart-title">🌡️ Temperature at Charging — Monthly Distribution</p>
        <p class="chart-sub" style="font-size:0.68rem;color:#888">What outdoor temperatures you've charged in — min, avg, max per month</p>
        <div class="chart-wrap" style="height:240px"><canvas id="chartTempByMonth"></canvas></div>
        <p style="font-size:0.62rem;color:#aaa;margin-top:6px">† All sessions included regardless of location. Outdoor ambient temperature from Open-Meteo ERA5 historical archive.</p>
      </div>
    </div>

  </div><!-- /#efficiencySection -->

  <!-- ─── hm-tip tooltip (heatmap hover) — position via transform not top/left ─── -->
  <div id="hm-tip" style="position:fixed;top:0;left:0;background:rgba(0,0,0,0.82);color:#fff;padding:5px 10px;border-radius:6px;font-size:11px;pointer-events:none;display:none;z-index:9999;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);will-change:transform;"></div>

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
      <span style="font-size:0.78rem">Each location is a circle sized by total kWh added and colored by network.</span>
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
<!-- SRI NOTE: each integrity="sha384-…" is a fingerprint of that EXACT file version.
     If you bump a version (e.g. chart.js@4.4.3 → 4.5.0) you MUST regenerate its hash,
     or the browser blocks the file and the chart/map silently breaks. Regenerate with:
       curl -sSL "<url>" | openssl dgst -sha384 -binary | openssl base64 -A
     then prefix the result with "sha384-". -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js" integrity="sha384-JUh163oCRItcbPme8pYnROHQMC6fNKTBWtRG3I3I0erJkzNgL7uxKlNwcrcFKeqF" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js" integrity="sha384-y49Zu59jZHJL/PLKgZPv3k2WI9c0Yp3pWB76V8OBVCb0QBKS8l4Ff3YslzHVX76Y" crossorigin="anonymous"></script>
{% assign has_geo = false %}
{% for loc in site.data.locations %}{% if loc.lat and loc.lng %}{% assign has_geo = true %}{% break %}{% endif %}{% endfor %}
{% if has_geo %}<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css" integrity="sha384-b8ANgTJvdlAnWM5YGMpKn7Kodm+1k7NYNG9zdjTCcZcKatzYHwZ0RLdWarbJJVzU" crossorigin="anonymous" />
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js" integrity="sha384-u5N8qJeJOO2iqNjIKTdl6KeKsEikMAmCUBPc6sC6uGpgL34aPJ4VgNhuhumedpEk" crossorigin="anonymous"></script>{% endif %}

<script>
/* ════════════════════════════════════════════════════════
   RAW DATA FROM JEKYLL LIQUID
   ════════════════════════════════════════════════════════ */
const sessions = [
  {% for entry in sorted_sessions %}{ date: "{{ entry.date | date: '%Y-%m-%d' }}", location: "{{ entry.location | replace: '"', "'" }}", vehicle: "{{ entry.vehicle | default: '2025 Mach-E GT' | replace: '"', "'" }}", kwh: {{ entry.energy_kwh | times: 1.0 }}, rawCost: {{ entry.cost | times: 1.0 }}, startDate: "{{ entry.start_date | date: '%Y-%m-%d' }}", startTime: "{{ entry.start_time }}", endTime: "{{ entry.end_time }}", socStart: {{ entry.soc_start | default: 0 }}, socEnd: {{ entry.soc_end | default: 0 }}, socAdded: {{ entry.soc_added | default: 0 }}, milesAdded: {{ entry.miles_added | default: 0 }}, batteryKwh: {{ entry.battery_kwh | default: "null" }}, solar: {{ entry.solar | default: false }}, tempC: {{ entry.temperature_c | default: "null" }}, tempF: {{ entry.temperature_f | default: "null" }} }{% unless forloop.last %},{% endunless %}
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
// Wall-side vs battery-side charging loss — applied to HOME cost only (energy stays as-reported).
const HOME_CHARGE_UPLIFT = 1 + ({{ site.data.rates.home_charge_uplift | default: 0.10 }});
const gasSavingsRates = {{ site.data.rates.gas_savings       | jsonify }};
const mileageHistory  = {{ site.data.mileage | jsonify }};
// Network membership passes (e.g. Electrify America Pass+). Each pass's flat fee
// is amortized across its network's sessions inside its window — see the
// "MEMBERSHIP FEE AMORTIZATION" pass right after session enrichment below.
const memberships     = {{ site.data.memberships.memberships | jsonify }} || [];
const locationData    = {{ site.data.locations  | jsonify }} || [];
const tripNotes       = {{ site.data.trip_notes | jsonify }} || [];

/* ── Location table state — declared here so nothing runs before these exist ── */
let _locSortCol = 'name', _locSortDir = 'asc', _locView = 'location', _locSl = [];
let _locHdrsWired = false; // guard: only wire sort-header onclick once

/* ════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════ */
const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
const tc     = () => isDark() ? '#c8c8c8' : '#555';   // tick / label color
const gc     = () => isDark() ? '#3a3a3a' : '#e8e8e8'; // grid color

function getStepRate(arr, date, field, fallback) {
  if (!Array.isArray(arr) || !arr.length) return fallback;
  let val = fallback;
  for (const r of arr) { if (r.date <= date) val = r[field]; }
  return (val !== undefined && val !== null) ? val : fallback;
}

// ── Memoized rate lookups — called per-session during enrichment ──────────
// getGasSavingsObj: cache by "date|vehicle" key since rates change on step boundaries
const _gasSavingsCache = new Map();
function getGasSavingsObj(date, vehicle) {
  const key = date + '|' + (vehicle || '');
  if (_gasSavingsCache.has(key)) return _gasSavingsCache.get(key);
  if (!Array.isArray(gasSavingsRates) || !gasSavingsRates.length) {
    const def = { mpg: 27, gas_price: 3.26, mi_per_kwh: 3.0 };
    _gasSavingsCache.set(key, def);
    return def;
  }
  let obj = gasSavingsRates[0];
  for (const r of gasSavingsRates) { if (r.date <= date) obj = r; }
  // Shallow-clone only once, override mpg per vehicle
  const result = vehicle && VEHICLE_MPG[vehicle] !== undefined
    ? { ...obj, mpg: VEHICLE_MPG[vehicle] }
    : obj;
  _gasSavingsCache.set(key, result);
  return result;
}

// getEgridFactor: memoized by location string — regex + array scan is expensive per-session
const _egridCache = new Map();
function getEgridFactor(locationStr) {
  if (_egridCache.has(locationStr)) return _egridCache.get(locationStr);
  let factor = EGRID_DEFAULT;
  // Solar sites (own panels + net metering, self-generating) charge on sun
  // energy → zero grid emissions. Flagged per location in _data/locations.yml
  // (solar: true). Otherwise derive the eGRID subregion from the 2-letter state
  // suffix (e.g. "…, WI" → MROE); Home/Work/Cabin have none → default (MI).
  const entry = (locationData || []).find(l => l.location === locationStr);
  if (entry && entry.solar) {
    factor = 0;
  } else {
    const m1 = locationStr.match(/\b([A-Z]{2})\s*$/);
    const m2 = !m1 && locationStr.match(/,\s*([A-Z]{2})\b/);
    const st = (m1 || m2 || [])[1];
    if (st && STATE_TO_EGRID[st]) factor = EGRID_FACTORS[STATE_TO_EGRID[st]];
  }
  _egridCache.set(locationStr, factor);
  return factor;
}

// getBucket: memoized since location strings repeat constantly
const _bucketCache = new Map();
function getBucket(loc) {
  if (_bucketCache.has(loc)) return _bucketCache.get(loc);
  const l = loc.toLowerCase();
  const b = l.includes('work') ? 'Work'
          : l.includes('home') ? 'Home'
          : l.includes('tesla') ? 'Tesla SC'
          : l.includes('chargepoint') ? 'ChargePoint'
          : l.includes('blink') ? 'Blink'
          : l.includes('rivian') ? 'Rivian'
          : l.includes('electrify') ? 'Electrify America'
          : l.includes('wecharge') ? 'WeCharge'
          : 'Other';
  _bucketCache.set(loc, b);
  return b;
}
// Per-vehicle MPG override for gas savings comparison.
// Keys must exactly match vehicle field values in session files.
// If a vehicle isn't listed here, the mpg from rates.yml is used.
const VEHICLE_MPG = {
  '2025 Mach-E GT':        27,     // RJB — compared to the 2023 Escape it replaced (~27 mpg)
  '2026 Mach-E SR':        27,     // RJB future car — same 27 mpg baseline
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

// Get baseline MPG for a vehicle (for CO2 comparison)
function getBaselineMpg(vehicle) {
  return VEHICLE_MPG[vehicle] || 27;
}

// (getGasSavingsObj, getEgridFactor, getBucket defined above with memoization)
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
           ChargePoint:'badge-cp', Blink:'badge-blink', Rivian:'badge-rivian',
           'Electrify America':'badge-ea', 'WeCharge':'badge-wc', Other:'badge-other' }[b] || 'badge-other';
}

const BUCKET_COLORS = {
  'Work':       '#0288d1',
  'Home':       '#7b1fa2',
  'Tesla SC':   '#CC0000',
  'ChargePoint':'#FF7A14',
  'Blink':      '#65A844',
  'Rivian':     '#ffa500',
  'Electrify America': '#00963f',
  'WeCharge':   '#51A950',
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

/* ── Per-vehicle colors — ONE source of truth so a given car is the SAME color
   in every chart across the page. Set to each car's ACTUAL paint colour as a
   real-world visual cue. Unknown vehicles fall back to the palette by index. ── */
const VEHICLE_COLORS = {
  '2025 Mach-E GT':        '#C2A76C',  // Desert Sand
  '2026 Mach-E SR':        '#E31E2E',  // Race Red
  "LRB's 2025 Mach-E GT":  '#B5176B',  // Molten Magenta
  "LRB's 2026 Mach-E SR":  '#2E7D9E'   // Adriatic Blue (teal-leaning)
};
const VEH_FALLBACK = [C_VIOLET, C_RED, C_BLUE, C_GREEN, C_AMBER, C_PURPLE];
function vehColor(v, i) {
  return VEHICLE_COLORS[v] || VEH_FALLBACK[((i || 0) % VEH_FALLBACK.length)];
}

/* ════════════════════════════════════════════════════════
   ENRICH SESSIONS
   ════════════════════════════════════════════════════════ */
sessions.forEach(s => {
  try {
    const loc   = s.location.toLowerCase();
    const hRate = getStepRate(homeRates, s.date, 'rate', 0.196);
    s.cost      = loc.includes('home') ? s.kwh * hRate * HOME_CHARGE_UPLIFT : s.rawCost;
    const gs    = getGasSavingsObj(s.date, s.vehicle) || { mpg: 27, gas_price: 3.26, mi_per_kwh: 3.0 };

    // Real efficiency from FordPass miles_added — more accurate than assumed mi/kWh.
    // EFFICIENCY uses BATTERY-SIDE energy (batteryKwh, from the Ford app) when the
    // session provides it — for public DC fast charging, energy_kwh is the
    // charger-DELIVERED/billed energy (drives cost & grid CO2), while batteryKwh is
    // what actually reached the battery (drives mi/kWh). When batteryKwh is absent
    // (home + most sessions) energy_kwh already IS battery-side, so it falls back to it.
    // Filter outliers: <1.5 mi/kWh (>667 Wh/mi) or >4.75 mi/kWh (<211 Wh/mi) are physically implausible
    const effKwh = (s.batteryKwh && s.batteryKwh > 0) ? s.batteryKwh : s.kwh;
    const rawMiPerKwh = s.milesAdded > 0 && effKwh > 0 ? s.milesAdded / effKwh : null;
    s.hasRealEff   = rawMiPerKwh !== null && rawMiPerKwh >= 1.5 && rawMiPerKwh <= 4.75;
    s.realMiPerKwh = s.hasRealEff ? rawMiPerKwh : null;
    s.realWhPerMi  = s.hasRealEff ? (effKwh * 1000) / s.milesAdded : null;

    // Miles used for gas-equivalent & CO2: the ACTUAL FordPass miles when we have
    // them, otherwise estimate from delivered energy × assumed mi/kWh. (When real,
    // this equals miles_added exactly — independent of the delivered-vs-battery split.)
    const estMiles = s.hasRealEff ? s.milesAdded : s.kwh * (gs.mi_per_kwh || 3.0);
    s.gasEquiv  = estMiles / (gs.mpg || 27) * (gs.gas_price || 3.26);
    s.saving    = s.gasEquiv - s.cost;
    s.bucket    = getBucket(s.location);
    s.isFree    = s.cost < 0.005;
    s.month     = s.date.substring(0, 7);
    // DOW: parse YYYY-MM-DD directly to avoid locale issues; T12:00:00 prevents DST boundary issues
    const dp    = s.date.split('-');
    s.dow       = new Date(+dp[0], +dp[1]-1, +dp[2], 12).getDay();

    // CO2 calculations — reuse estMiles already computed above; cache egridFactor
    const mpg        = getBaselineMpg(s.vehicle);
    // Per-session solar flag (solar: true in the session file) → zero grid CO2,
    // regardless of location. Lets a single Work charge on a solar array count as
    // clean without making all Work charging solar. Location-level solar (e.g.
    // Paul & Carol's) is still handled inside getEgridFactor.
    const egridFactor = s.solar ? 0 : getEgridFactor(s.location);
    s.co2GasCould    = (estMiles / mpg) * CO2_GAS_KG_PER_GAL;
    s.co2GridEmit    = s.kwh * egridFactor;
    s.co2NetAvoided  = s.co2GasCould - s.co2GridEmit;
    s.egridFactor    = egridFactor;

    // Temperature — from backfill_temperature.py via Open-Meteo ERA5
    s.tempC   = (s.tempC !== null && s.tempC !== undefined && s.tempC !== '' && !isNaN(+s.tempC)) ? +s.tempC : null;
    s.tempF   = (s.tempF !== null && s.tempF !== undefined && s.tempF !== '' && !isNaN(+s.tempF)) ? +s.tempF : null;
    s.hasTemp = s.tempC !== null;
  } catch(e) {
    console.error('[EV] Session enrichment failed for', s.date, s.location, e);
    s.cost     = s.rawCost || 0;
    s.gasEquiv = 0; s.saving = 0;
    s.bucket   = getBucket(s.location || '');
    s.isFree   = s.cost < 0.005;
    s.month    = (s.date || '').substring(0, 7);
    s.dow      = 0;
    s.hasRealEff = false; s.realMiPerKwh = null; s.realWhPerMi = null;
    s.tempC = null; s.tempF = null; s.hasTemp = false;
  }
});

/* ════════════════════════════════════════════════════════
   MEMBERSHIP FEE AMORTIZATION
   ────────────────────────────────────────────────────────
   A network pass (e.g. Electrify America Pass+, $7/mo) is a flat fee that buys
   a lower per-kWh rate. We spread that fee across every session on the pass's
   network inside its [start, end] window, weighted by each session's energy
   (kWh), and ADD the share to that session's cost. So `s.cost` becomes the true
   all-in cost and every downstream metric (total cost, avg ¢/kWh, savings,
   cost/kWh charts, per-session tables) reflects the pass automatically.

   Because this runs on every page load over the CURRENT session set, adding
   more sessions inside an active window later automatically re-spreads the fee
   — older sessions' effective ¢/kWh drop, with no edits to old files. Defined
   in _data/memberships.yml; add a row per renewal or new pass (any network).
   ════════════════════════════════════════════════════════ */
const _membershipNotes = [];
(memberships || []).forEach(m => {
  if (!m || !m.network || !m.fee || !m.start || !m.end) return;
  const net = String(m.network).toLowerCase();
  const inWindow = sessions.filter(s =>
    s.location && s.location.toLowerCase().includes(net) &&
    s.date >= m.start && s.date <= m.end
  );
  const windowKwh = inWindow.reduce((a, s) => a + (s.kwh || 0), 0);
  if (windowKwh <= 0) return; // fee can't be spread until there's ≥1 session
  inWindow.forEach(s => {
    const share = m.fee * (s.kwh / windowKwh); // kWh-weighted share of the flat fee
    s.membershipFee   = (s.membershipFee || 0) + share;
    s.membershipLabel = m.label || net;
    s.cost   += share;          // all-in cost
    s.saving -= share;          // saving = gasEquiv - cost, keep consistent
    s.isFree  = s.cost < 0.005; // (unchanged for paid EA sessions, but stay correct)
  });
  // Build a transparency note (so the amortized fee isn't invisible).
  const todayStr   = new Date().toISOString().slice(0, 10);
  const active     = todayStr >= m.start && todayStr <= m.end;
  const addPerKwh  = (m.fee / windowKwh) * 100;                 // ¢/kWh added on average
  const windowCost = inWindow.reduce((a, s) => a + s.cost, 0);  // all-in (incl. fee)
  const blended    = (windowCost / windowKwh) * 100;            // ¢/kWh all-in
  _membershipNotes.push(
    `💳 <strong>${m.label || net}</strong> ($${m.fee.toFixed(2)}${active ? '' : ', ended'}) — ` +
    `amortized across ${inWindow.length} session${inWindow.length === 1 ? '' : 's'} ` +
    `(${windowKwh.toFixed(1)} kWh, ${m.start}→${m.end}), adding ~${addPerKwh.toFixed(1)}¢/kWh. ` +
    `Effective all-in rate this window: <strong>${blended.toFixed(1)}¢/kWh</strong>. ` +
    `Adding more sessions in this window re-spreads the fee automatically.`
  );
});
(function renderMembershipNote() {
  const el = document.getElementById('membershipNote');
  if (!el || !_membershipNotes.length) return;
  el.innerHTML = _membershipNotes.join('<br>');
  el.style.display = '';
})();

/* ════════════════════════════════════════════════════════
   CHART FACTORY + ANIMATION HELPERS
   ════════════════════════════════════════════════════════ */
Chart.register(ChartDataLabels);
Chart.defaults.animation = false; // disable all chart animations — prevents CPU spike on rebuild

/* Cubic ease-out count-up animation — WeakMap keyed by element so detached
   DOM nodes can be garbage collected. RAF IDs also tracked in _cuRAFIds Set
   for bulk cancellation on tab hide. */
const _cuRAF    = new WeakMap();
const _cuRAFIds = new Set(); // parallel Set of active RAF IDs for bulk cancel
function countUp(el, target, fmt, dur) {
  if (_cuRAF.has(el)) {
    const old = _cuRAF.get(el);
    cancelAnimationFrame(old);
    _cuRAFIds.delete(old);
    _cuRAF.delete(el);
  }
  dur = dur || 900;
  const t0 = performance.now();
  (function tick(now) {
    if (document.hidden) {
      el.textContent = fmt(target);
      _cuRAF.delete(el);
      return;
    }
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = fmt((1 - Math.pow(1 - p, 3)) * target);
    if (p < 1) {
      const id = requestAnimationFrame(tick);
      _cuRAF.set(el, id);
      _cuRAFIds.add(id);
    } else {
      _cuRAF.delete(el);
    }
  })(t0);
}

// Order vehicles newest-model-year first, and RJB's (mine) before LRB's (Leah's).
// Used for the filter pills and the per-vehicle chart series so they stay consistent.
function vehicleSort(a, b) {
  const yr = s => { const m = String(s).match(/\b(20\d\d)\b/); return m ? +m[1] : 0; };
  const yb = yr(b), ya = yr(a);
  if (yb !== ya) return yb - ya;                    // newer model year first
  const la = /LRB/.test(a) ? 1 : 0, lb = /LRB/.test(b) ? 1 : 0;
  if (la !== lb) return la - lb;                    // RJB's (mine) before LRB's (Leah's)
  return String(a).localeCompare(String(b));
}
const allVehicles = [...new Set(sessions.map(s => s.vehicle))].sort(vehicleSort);
let activeVehicles = new Set(['all']); // 'all' means no individual filter
let allCharts = [];
let _hmRender = null;        // current heatmap render fn — updated on each rebuild
let _heatmapWired = false;  // event listeners on heatmapContainer wired only once
let _whenChargeWired = false; // when-do-I-charge grid tooltip listeners wired only once
let _whenChargeSl = null;     // last data for the when-do-I-charge grid (re-render on theme)
let _gasSensWired = false;    // gas-sensitivity slider + theme listeners wired only once
let _gasSensUpdate = null;    // latest rebuild's updateSensitivity fn (so the once-wired slider drives fresh data)

function mkChart(id, config) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  // Destroy any existing Chart instance on this canvas — prevents
  // "Canvas is already in use" error if rebuild() is called before destroy completes
  const existing = Chart.getChart(canvas);
  if (existing) {
    const idx = allCharts.indexOf(existing);
    if (idx >= 0) allCharts.splice(idx, 1);   // drop the stale ref so allCharts stays live-only
    existing.destroy();
  }
  const c = new Chart(canvas, config);
  allCharts.push(c);
  return c;
}

/* ════════════════════════════════════════════════════════
   VEHICLE FILTER
   ════════════════════════════════════════════════════════ */
// Readable text on an active pill: dark on light paint (e.g. Desert Sand), else white.
function vfTextColor(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
  return (0.299*r + 0.587*g + 0.114*b) / 255 > 0.6 ? '#1a1a1a' : '#fff';
}
// Build one vehicle-filter pill, tinted with its paint colour when active.
function makeVfBtn(v) {
  const btn = document.createElement('button');
  btn.className = 'vf-btn' + (isVehicleActive(v) ? ' active' : '');
  btn.textContent = v === 'all' ? 'All Vehicles' : v;
  btn.dataset.vehicle = v;
  btn.onclick = () => toggleVehicle(v);
  if (v !== 'all' && VEHICLE_COLORS[v]) {
    btn.style.setProperty('--vf-color', VEHICLE_COLORS[v]);
    btn.style.setProperty('--vf-text', vfTextColor(VEHICLE_COLORS[v]));
  }
  return btn;
}

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
    ['all', ...allVehicles].forEach(v => el.appendChild(makeVfBtn(v)));

    // Build sticky vehicle row buttons
    if (stickyRow) {
      stickyRow.style.display = 'flex';
      stickyRow.querySelectorAll('.vf-btn').forEach(b => b.remove());
      ['all', ...allVehicles].forEach(v => stickyRow.appendChild(makeVfBtn(v)));
    }
  }

  // Sticky bar positioning and show/hide are handled by initStickyBar() (called once at init).

  // Active section highlight in sticky nav via IntersectionObserver
  // Disconnect previous observer if buildVehicleFilter is ever called again
  if (window._sectionObs) { window._sectionObs.disconnect(); window._sectionObs = null; }
  const navLinks = document.querySelectorAll('#stickyNavRow a[href^="#"]');
  const sectionEls = Array.from(navLinks)
    .map(a => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);

  if (sectionEls.length && 'IntersectionObserver' in window) {
    let activeId = null;
    // Cache rects outside the callback; refresh on each intersection event
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const vh = window.innerHeight;
          const rects = sectionEls.map(el => ({ el, top: el.getBoundingClientRect().top }));
          const visible = rects.filter(({ top }) => top < vh * 0.55 && top > -100);
          if (visible.length) {
            visible.sort((a, b) => Math.abs(a.top) - Math.abs(b.top));
            activeId = visible[0].el.id;
          } else {
            activeId = entry.target.id;
          }
          navLinks.forEach(a => {
            a.classList.toggle('nav-active', a.getAttribute('href') === '#' + activeId);
          });
        }
      });
    }, { rootMargin: '-10% 0px -50% 0px', threshold: 0 });
    sectionEls.forEach(el => obs.observe(el));
    window._sectionObs = obs;
  }
}

function isVehicleActive(v) {
  if (v === 'all') return activeVehicles.has('all');
  return !activeVehicles.has('all') && activeVehicles.has(v);
}

function toggleVehicle(v) {
  if (v === 'all') {
    // Reset to all-vehicles mode
    activeVehicles = new Set(['all']);
  } else {
    // Remove the 'all' sentinel and toggle this vehicle
    activeVehicles.delete('all');
    if (activeVehicles.has(v)) {
      activeVehicles.delete(v);
      // If nothing selected, fall back to all
      if (activeVehicles.size === 0) activeVehicles = new Set(['all']);
    } else {
      activeVehicles.add(v);
    }
    // If every individual vehicle is selected, treat as 'all'
    if (allVehicles.every(veh => activeVehicles.has(veh))) {
      activeVehicles = new Set(['all']);
    }
  }

  // Sync active state on ALL .vf-btn elements (inline + sticky)
  document.querySelectorAll('.vf-btn').forEach(b => {
    b.classList.toggle('active', isVehicleActive(b.dataset.vehicle));
  });

  _lastSl = activeVehicles.has('all')
    ? sessions
    : sessions.filter(s => activeVehicles.has(s.vehicle));

  // ── Scroll preservation across rebuild ──
  // Strategy: find the section-header currently closest to (but below) the sticky
  // bar top edge. Record its viewport Y before rebuild. After two rAF frames
  // (ensuring browser has painted the new layout), scroll so that element
  // returns to the same Y. Two frames needed: first rAF fires after JS,
  // second fires after the browser's layout/paint pass completes.
  const stickyBar  = document.getElementById('vehicleFilterSticky');
  const stickyH    = (stickyBar && stickyBar.classList.contains('visible'))
                     ? stickyBar.offsetHeight : 0;
  const navTop     = window.innerWidth >= 768
                     ? parseInt(getComputedStyle(document.documentElement)
                       .getPropertyValue('--sticky-bar-top') || '62', 10)
                     : 0;
  const topEdge    = navTop + stickyH + 4;

  // Find the section-header or chart-card whose top is closest to topEdge
  // (i.e. the section currently "leading" the visible area)
  let _anchorEl = null, _anchorTopBefore = 0;
  let _bestDist = Infinity;
  document.querySelectorAll(
    '.analytics-container .section-header, .analytics-container .kpi-strip'
  ).forEach(el => {
    const r    = el.getBoundingClientRect();
    const dist = Math.abs(r.top - topEdge);
    // Only consider elements that are within the lower two-thirds of the viewport
    // (anything above topEdge - 20px is already scrolled past)
    if (r.top > topEdge - 20 && dist < _bestDist) {
      _bestDist    = dist;
      _anchorEl    = el;
      _anchorTopBefore = r.top;
    }
  });

  const _savedY = window.scrollY;
  const _container = document.querySelector('.analytics-container');

  // Fade out → rebuild → fade in. The 150ms fade-out matches the CSS transition
  // duration and completely masks the chart destroy/recreate flash.
  if (_container) _container.style.opacity = '0.15';

  // Use setTimeout to let the fade-out paint before the synchronous rebuild runs
  setTimeout(() => {
    rebuild(_lastSl);

    // Defer scroll correction + fade-in to after layout settles (two rAF frames)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (_anchorEl) {
          const topAfter = _anchorEl.getBoundingClientRect().top;
          const delta    = topAfter - _anchorTopBefore;
          if (Math.abs(delta) > 1) {
            try {
              window.scrollTo({ top: _savedY + delta, behavior: 'instant' });
            } catch(e) {
              window.scrollTo(0, _savedY + delta);
            }
          }
        }
        if (_leafletMap) buildMap(_lastSl);
        // Fade back in — CSS transition handles the smooth reveal
        if (_container) _container.style.opacity = '1';
      });
    });
  }, 120); // 120ms matches ~80% of the 150ms fade-out transition
}

/* ════════════════════════════════════════════════════════
   REBUILD — called on init and on vehicle filter change
   ════════════════════════════════════════════════════════ */
function rebuild(sl) {
  // Destroy all tracked chart instances — null plugin callbacks first to drop
  // any closures holding DOM/data references before Chart.js teardown runs
  allCharts.forEach(c => {
    try {
      if (c.options?.plugins?.legend) c.options.plugins.legend.onClick = null;
      if (c.options?.plugins?.tooltip) c.options.plugins.tooltip.callbacks = {};
      c.destroy();
    } catch(e) {}
  });
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
                   freeWorkKwh:0, freeOtherKwh:0,
                   workKwh:0, homeKwh:0, pubKwh:0 };
  });
  sl.forEach(s => {
    const m = monthly[s.month];
    m.kwh     += s.kwh;     m.cost    += s.cost;
    m.saving  += s.saving;  m.gasEquiv += s.gasEquiv;
    m.sessions++;
    if (s.isFree) {
      m.freeKwh += s.kwh; m.freeSessions++;
      if (s.bucket === 'Work') m.freeWorkKwh += s.kwh; else m.freeOtherKwh += s.kwh;
    } else m.paidKwh += s.kwh;
    if      (s.bucket === 'Work') m.workKwh += s.kwh;
    else if (s.bucket === 'Home') m.homeKwh += s.kwh;
    else                           m.pubKwh  += s.kwh;
  });

  /* KPI STRIP — single pass over sl (was 4 separate reduces/filter) */
  let totalKwh = 0, totalCost = 0, totalSavings = 0, freeKwh = 0;
  sl.forEach(s => {
    totalKwh += s.kwh; totalCost += s.cost; totalSavings += s.saving;
    if (s.isFree) freeKwh += s.kwh;
  });

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
              text: `${label}  ${tot > 0 ? (ds.data[i] / tot * 100).toFixed(1) : '0.0'}%  (${ds.data[i].toFixed(0)} kWh)`,
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
   MILEAGE CHARTS — odometer history, miles/month, gas price, real efficiency
   ════════════════════════════════════════════════════════ */
(function buildMileageCharts(sl) {
  if (!mileageHistory || !mileageHistory.length) return;

  // Per-vehicle color map
  const vehColors = {};
  const vehList = [...new Set(mileageHistory.map(e => e.vehicle))].sort();
  vehList.forEach((v, i) => { vehColors[v] = vehColor(v, i); });

  // Sort all readings by date asc
  const sorted = [...mileageHistory].sort((a,b) => a.date.localeCompare(b.date));

  // Chart 1: Odometer history — one line per vehicle
  if (document.getElementById('chartOdometer')) {
    const datasets = vehList.map(v => {
      const pts = sorted.filter(e => e.vehicle === v);
      return {
        label: v,
        data: pts.map(e => e.odometer),
        borderColor: vehColors[v],
        backgroundColor: vehColors[v] + '22',
        borderWidth: 2.5, pointRadius: 5, tension: 0.2, fill: false
      };
    });
    // Use union of all dates as labels
    const allDates = [...new Set(sorted.map(e => e.date))].sort();
    // For each vehicle, fill null for dates with no reading
    const filledDatasets = vehList.map((v, vi) => {
      const ptMap = {};
      sorted.filter(e => e.vehicle === v).forEach(e => { ptMap[e.date] = e.odometer; });
      return {
        label: v,
        data: allDates.map(d => ptMap[d] !== undefined ? ptMap[d] : null),
        borderColor: vehColors[v],
        backgroundColor: vehColors[v] + '22',
        borderWidth: 2.5, pointRadius: 5, tension: 0.2, fill: false, spanGaps: true
      };
    });
    mkChart('chartOdometer', {
      type: 'line',
      data: { labels: allDates, datasets: filledDatasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 10, font: { size: 10 } } },
          datalabels: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toLocaleString()} mi` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: tc(), font: { size: 9 } } },
          y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v.toLocaleString() + ' mi' },
               title: { display: true, text: 'odometer (mi)', color: '#888' } }
        }
      }
    });
  }

  // Chart 2: Miles driven per month — interpolate between readings
  // For each month in data range, estimate miles driven per vehicle
  // from the delta between bracketing odometer readings
  if (document.getElementById('chartMilesPerMonth')) {
    // Build month range from first to last reading
    const firstDate = new Date(sorted[0].date + 'T12:00:00');
    const lastDate  = new Date(sorted[sorted.length-1].date + 'T12:00:00');
    const months = [];
    const d = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    while (d <= lastDate) {
      months.push(d.toISOString().slice(0,7));
      d.setMonth(d.getMonth() + 1);
    }

    function getOdoAt(vehicle, dateStr) {
      const pts = sorted.filter(e => e.vehicle === vehicle && e.date <= dateStr);
      if (!pts.length) return null;
      return pts[pts.length-1].odometer;
    }

    const datasets = vehList.map(v => {
      const data = months.map((m, i) => {
        if (i === 0) return null;
        const endDate   = m + '-28';
        const startDate = months[i-1] + '-28';
        const odoEnd    = getOdoAt(v, endDate);
        const odoStart  = getOdoAt(v, startDate);
        if (odoEnd === null || odoStart === null) return null;
        return Math.max(0, odoEnd - odoStart);
      });
      return {
        label: v,
        data,
        backgroundColor: vehColors[v],
        borderColor: vehColors[v],
        borderWidth: 1, borderRadius: 4
      };
    });

    mkChart('chartMilesPerMonth', {
      type: 'bar',
      data: { labels: months.map(monthLabel), datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 10, font: { size: 10 } } },
          datalabels: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ~${ctx.parsed.y?.toLocaleString()} mi` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: tc(), font: { size: 9 } }, stacked: false },
          y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v.toLocaleString() },
               title: { display: true, text: 'miles (est.)', color: '#888' }, beginAtZero: true }
        }
      }
    });
  }

  // Chart 3: Gas price history (duplicate of chartGasPrice in economics, here in mileage section)
  if (document.getElementById('chartGasPriceMileage')) {
    mkChart('chartGasPriceMileage', {
      type: 'line',
      data: {
        labels: gasSavingsRates.map(r => r.date),
        datasets: [{
          label: '$/gal assumed for savings calc',
          data: gasSavingsRates.map(r => r.gas_price),
          borderColor: '#f39c12', backgroundColor: 'rgba(243,156,18,0.1)',
          borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: '#f39c12',
          fill: true, stepped: true
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: { display: true, anchor: 'top', align: 'top', color: tc(), font: { size: 10 },
                        formatter: v => '$' + v.toFixed(2) },
          tooltip: { callbacks: { label: ctx => ` $${ctx.parsed.y.toFixed(2)}/gal` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: tc(), maxRotation: 40, minRotation: 30 } },
          y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => '$' + v.toFixed(2) },
               title: { display: true, text: '$/gal', color: '#888' },
               suggestedMin: 2.5, suggestedMax: 5.0 }
        }
      }
    });
  }

  // Chart 4: Real efficiency — dual axis: mi/kWh (left) and Wh/mi (right)
  // Data is stored as kWh/100mi; convert: mi/kWh = 100/x, Wh/mi = x*10
  if (document.getElementById('chartEfficiencyReal')) {
    const vehiclesInData = [...new Set(sl.map(s => s.vehicle))].sort(vehicleSort);
    const allMonths = [...new Set(sl.map(s => s.month))].sort();
    const vehColorMap = {};
    vehiclesInData.forEach((v, i) => { vehColorMap[v] = vehColor(v, i); });

    const datasets = vehiclesInData.map(v => {
      const data = allMonths.map(m => {
        const ms = sl.filter(s => s.vehicle === v && s.month === m && s.hasRealEff);
        if (!ms.length) return null;
        const kwh = ms.reduce((a,s) => a + s.kwh, 0);
        const mi  = ms.reduce((a,s) => a + (s.milesAdded || 0), 0);
        if (mi <= 0) return null;
        // Store as mi/kWh for left axis
        return +(mi / kwh).toFixed(3);
      });
      return {
        label: v, data, borderColor: vehColorMap[v], backgroundColor: vehColorMap[v] + '22',
        borderWidth: 2.5, pointRadius: 4, tension: 0.35, spanGaps: false, fill: false,
        yAxisID: 'yMiKwh'
      };
    });

    mkChart('chartEfficiencyReal', {
      type: 'line',
      data: { labels: allMonths.map(monthLabel), datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 10, font: { size: 10 } } },
          datalabels: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const miKwh = ctx.parsed.y;
                if (miKwh == null) return '';
                const whMi = Math.round(1000 / miKwh);
                return ` ${ctx.dataset.label}: ${miKwh.toFixed(2)} mi/kWh  ·  ${whMi} Wh/mi`;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: tc(), font: { size: 9 } } },
          yMiKwh: {
            position: 'left',
            grid: { color: gc() },
            ticks: { color: tc(), callback: v => v.toFixed(2) + ' mi/kWh' },
            title: { display: true, text: 'mi / kWh  ↑ better', color: '#888' },
            beginAtZero: false
          },
          yWhMi: {
            position: 'right',
            grid: { drawOnChartArea: false },
            // Mirror of left axis: Wh/mi = 1000 / mi/kWh
            // We define min/max to match the left axis range inverted
            ticks: {
              color: '#888',
              callback: v => Math.round(1000 / v) + ' Wh/mi'
            },
            title: { display: true, text: 'Wh / mi  ↓ better', color: '#888' },
            // Sync with left axis using afterBuildTicks
            afterDataLimits: axis => {
              // Right axis shows same tick positions as left, labels converted
              const left = axis.chart.scales.yMiKwh;
              if (left) { axis.min = left.min; axis.max = left.max; }
            },
            beginAtZero: false
          }
        }
      }
    });
  }
})(sl);

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
              text: `${lbl}  ${tot > 0 ? (ds.data[i]/tot*100).toFixed(0) : '0'}%`,
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
   CHART 15b — Charging cadence (gaps between distinct charging days)
   ════════════════════════════════════════════════════════ */
  const chargeDays = [...new Set(sl.map(s => s.date))].sort();
  const gapBuckets = [
    { label: 'Every day', test: g => g === 1 },
    { label: '2 days',    test: g => g === 2 },
    { label: '3 days',    test: g => g === 3 },
    { label: '4–7 days',  test: g => g >= 4 && g <= 7 },
    { label: '8+ days',   test: g => g >= 8 }
  ];
  const gapCounts  = gapBuckets.map(() => 0);
  const gapByMonth = {}; // month of the later day -> { sum, n }
  let gapSum = 0, gapN = 0;
  for (let i = 1; i < chargeDays.length; i++) {
    const g = Math.round((new Date(chargeDays[i]+'T12:00:00') - new Date(chargeDays[i-1]+'T12:00:00')) / 86400000);
    if (g < 1) continue;
    const bi = gapBuckets.findIndex(b => b.test(g));
    if (bi >= 0) gapCounts[bi]++;
    gapSum += g; gapN++;
    const mo = chargeDays[i].slice(0, 7);
    (gapByMonth[mo] = gapByMonth[mo] || { sum: 0, n: 0 });
    gapByMonth[mo].sum += g; gapByMonth[mo].n++;
  }
  const avgCadence = gapN ? gapSum / gapN : 0;
  const cadNote = document.getElementById('cadenceAvgNote');
  if (cadNote) cadNote.textContent = gapN
    ? `Avg ${avgCadence.toFixed(1)} days between charging days · ${chargeDays.length} charging days total`
    : 'How frequently a charging day follows another';

  mkChart('chartCadenceHist', {
    type: 'bar',
    data: {
      labels: gapBuckets.map(b => b.label),
      datasets: [{
        data: gapCounts,
        backgroundColor: [C_GREEN, '#7bc96f', C_AMBER, '#FF7A14', C_RED],
        borderRadius: 5
      }]
    },
    options: { responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false },
        datalabels:{ anchor:'end', align:'end', offset:4, color:tc(), font:{ size:11, weight:'bold' }, formatter:v=>v>0?v:'' },
        tooltip:{ callbacks:{ label:ctx=>` ${ctx.parsed.y} times` } }
      },
      scales:{
        x:{ grid:{ display:false }, ticks:{ color:tc() } },
        y:{ grid:{ color:gc() }, ticks:{ color:tc(), precision:0 }, beginAtZero:true,
            title:{ display:true, text:'Occurrences', color:'#888' } }
      }
    }
  });

  const cadMonths = allMonths.filter(m => gapByMonth[m]);
  mkChart('chartCadenceTrend', {
    type: 'line',
    data: {
      labels: cadMonths.map(monthLabel),
      datasets: [{
        label: 'Avg days between charges',
        data: cadMonths.map(m => +(gapByMonth[m].sum / gapByMonth[m].n).toFixed(2)),
        borderColor: C_VIOLET, backgroundColor: 'rgba(93,63,211,0.10)',
        fill:true, tension:0.3, pointRadius:3, borderWidth:2
      }]
    },
    options: { responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false }, datalabels:{ display:false },
        tooltip:{ callbacks:{ label:ctx=>` ${ctx.parsed.y.toFixed(1)} days between charges` } } },
      scales:{
        x:{ grid:{ display:false }, ticks:{ color:tc(), maxRotation:45, font:{ size:9 } } },
        y:{ grid:{ color:gc() }, ticks:{ color:tc(), callback:v=>v+'d' }, beginAtZero:true,
            title:{ display:true, text:'Avg gap (days)', color:'#888' } }
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
    layout: { padding: { top: 24 } },
    plugins: {
      legend: { display: false },
      datalabels: {
        display: ctx => ctx.dataset.data[ctx.dataIndex] > 0,
        anchor: 'end', align: 'end', offset: 2,
        color: tc(), font: { size: 10, weight: 'bold' },
        formatter: v => v || ''
      },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} session${ctx.parsed.y !== 1 ? 's' : ''} (${ctx.label} kWh)` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tc(), font: { size: 9 } } },
      y: { grid: { color: gc() }, ticks: { color: tc() },
           title: { display: true, text: 'Sessions', color: '#888' },
           grace: '15%' }
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

  // Free charging index — % of kWh charged free each month, split Work vs Other,
  // stacked so the top of the area is the total free share.
  const pctOf = (part, tot) => tot > 0 ? +((part / tot) * 100).toFixed(1) : 0;
  mkChart('chartFreeIndex', {
    type: 'line',
    data: {
      labels: allMonths.map(monthLabel),
      datasets: [
        { label: 'Work',
          data: allMonths.map(m => pctOf(monthly[m].freeWorkKwh, monthly[m].kwh)),
          borderColor: '#0288d1', backgroundColor: 'rgba(2,136,209,0.30)',
          fill: 'origin', borderWidth: 2, pointRadius: 3, tension: 0.35 },
        { label: 'Other free',
          data: allMonths.map(m => pctOf(monthly[m].freeOtherKwh, monthly[m].kwh)),
          borderColor: '#2ecc71', backgroundColor: 'rgba(46,204,113,0.40)',
          // fill to the PREVIOUS dataset, not zero — otherwise the green area
          // overlays the blue Work band and muddies it
          fill: '-1', borderWidth: 2, pointRadius: 3, tension: 0.35 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { color: tc(), boxWidth: 12, padding: 12, font: { size: 11 } } },
        datalabels: { display: false },
        tooltip: {
          mode: 'index', intersect: false,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%`,
            footer: items => `Total free: ${items.reduce((a, i) => a + i.parsed.y, 0).toFixed(1)}%`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: tc() }, stacked: true },
        y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v + '%' },
             min: 0, max: 100, stacked: true, title: { display: true, text: '% Free', color: '#888' } }
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
    if (breakSub) {
      // Baseline gas-car MPG follows the current vehicle selection — each EV is
      // compared to the specific gas car it replaced (RJB 27, LRB 23). One value
      // if a single baseline is in play, else a kWh-weighted average of the mix.
      const mpgVals = [...new Set(sl.map(s => VEHICLE_MPG[s.vehicle] || 27))];
      let mpgLabel;
      if (mpgVals.length === 1) {
        mpgLabel = mpgVals[0] + ' mpg';
      } else {
        let wSum = 0, w = 0;
        sl.forEach(s => { const m = VEHICLE_MPG[s.vehicle] || 27; wSum += m * s.kwh; w += s.kwh; });
        mpgLabel = (w ? (wSum / w) : 27).toFixed(1) + ' mpg avg';
      }
      breakSub.textContent = 'saved vs. driving a ' + mpgLabel + ' gas car since ' + (sl[0]?.date || '');
    }
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
    const isLRB   = !activeVehicles.has('all') && activeVehicles.size === 1 && [...activeVehicles][0].includes('LRB');
    const isMixed = activeVehicles.has('all') || activeVehicles.size > 1;
    const baseNote = document.getElementById('co2BaselineNote');
    if (baseNote) {
      if (isMixed)    baseNote.textContent = 'RJB → 2023 Escape (27 MPG) · LRB → 2016 Explorer (23 MPG)';
      else if (isLRB) baseNote.textContent = 'LRB → 2016 Explorer 2.3L EcoBoost (23.0 MPG real-world)';
      else            baseNote.textContent = 'RJB → 2023 Ford Escape (27 MPG)';
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
      // Colour scale spans ACTUAL grid factors only — solar sites (factor 0) are a
      // separate zero-emission category; folding them in would drag the whole grid
      // gradient toward amber and wash out the real MI/IL/WI grid differences.
      const gridFactors = locSorted.map(([,v]) => v.factor).filter(f => f > 0);
      const minFactor = gridFactors.length ? Math.min(...gridFactors) : 0;
      const maxFactor = gridFactors.length ? Math.max(...gridFactors) : 1;
      const factorRange = maxFactor - minFactor || 1;
      const hasSolar = locSorted.some(([,v]) => v.factor <= 0);
      const SOLAR_COLOR = 'rgba(0,170,75,0.92)';  // vivid green — zero-emission / solar
      // Green (clean grid) → Amber (dirtier grid); solar gets its own vivid green.
      const locColors = locSorted.map(([,v]) => {
        if (v.factor <= 0) return SOLAR_COLOR;
        const t = Math.max(0, Math.min(1, (v.factor - minFactor) / factorRange));
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
      if (legendEl && (factorRange > 0.01 || hasSolar)) {
        legendEl.style.display = '';
        const dot = 'display:inline-block;width:10px;height:10px;border-radius:2px;vertical-align:middle';
        legendEl.innerHTML =
          (hasSolar
            ? '<span style="' + dot + ';background:rgba(0,170,75,0.92);margin-right:4px"></span>☀️ Solar' +
              '<span style="' + dot + ';background:rgba(46,204,113,0.85);margin:0 4px 0 16px"></span>Cleaner grid'
            : '<span style="' + dot + ';background:rgba(46,204,113,0.85);margin-right:4px"></span>Cleaner grid') +
          '<span style="' + dot + ';background:rgba(245,158,11,0.85);margin:0 4px 0 16px"></span>Dirtier grid' +
          ' &nbsp;·&nbsp; colour = grid CO₂ intensity' + (hasSolar ? ' (solar = zero)' : '');
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
    const DCFC_NETWORKS = ['Tesla SC', 'ChargePoint', 'Rivian', 'Blink', 'Electrify America', 'WeCharge'];
    const GAS_STOP_MIN  = 6; // minutes per gas fill-up (midpoint 5–7 min)

    // Per-vehicle gas car comparison specs
    // key: substring to match vehicle name — LRB = Explorer, else = Escape
    const GAS_SPECS = {
      lrb: { name: '2016 Explorer AWD', mpg: 23,   tank: 17.9 },
      rjb: { name: '2023 Escape AWD',   mpg: 27,   tank: 15.7 }
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

      // Distance stats — use actual trip computer miles if available, else estimate
      const maxDist    = Math.round(Math.max(...locs.map(l => distFromHome(l))));
      const distLabel  = maxDist < 999 ? maxDist + ' mi from home' : '';
      const actualMiles = note?.trip_miles ? parseFloat(note.trip_miles) : 0;
      const estMiles   = actualMiles > 0 ? actualMiles : estimateTripMiles(locs, note);
      const milesLabel = actualMiles > 0 ? estMiles.toLocaleString() : (estMiles > 0 ? '~'+estMiles : '—');
      const milesTitle = actualMiles > 0 ? 'Trip Miles' : 'Est. Miles';

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
            <div style="font-size:0.58rem;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">${milesTitle}</div>
            <div style="font-weight:800;font-size:1rem">${milesLabel}</div>
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

        ${note?.energy_screen ? (() => {
          const mi      = note.trip_miles;
          const hrs     = note.trip_hours;
          const eff     = note.trip_mi_per_kwh;
          const drv     = note.energy_driving_pct    || 0;
          const clm     = note.energy_climate_pct    || 0;
          const acc     = note.energy_accessories_pct|| 0;
          const ext     = note.energy_ext_temp_pct   || 0;
          const sAcc    = note.score_acceleration;
          const sDec    = note.score_deceleration;
          const sSpd    = note.score_speed;
          const scoreColor = s => s >= 80 ? '#2ecc71' : s >= 60 ? '#f39c12' : '#e74c3c';
          return `
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--dash-border)">
          <div style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.12em;color:#888;font-weight:700;margin-bottom:10px">📊 Trip Computer — Where did my energy go?</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">

            <!-- Left: trip stats + energy bar -->
            <div>
              <div style="display:flex;gap:14px;margin-bottom:10px;flex-wrap:wrap">
                ${mi ? `<div style="text-align:center"><div style="font-size:0.58rem;color:#888;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:2px">Trip Miles</div><div style="font-weight:800;font-size:1rem">${mi.toLocaleString()}</div></div>` : ''}
                ${hrs ? `<div style="text-align:center"><div style="font-size:0.58rem;color:#888;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:2px">Drive Time</div><div style="font-weight:800;font-size:1rem">${hrs}</div></div>` : ''}
                ${eff ? `<div style="text-align:center"><div style="font-size:0.58rem;color:#888;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:2px">Efficiency</div><div style="font-weight:800;font-size:1rem;color:${eff >= 3.0 ? '#2ecc71' : eff >= 2.5 ? '#f39c12' : '#e74c3c'}">${eff} mi/kWh</div></div>` : ''}
              </div>

              <!-- Stacked energy bar -->
              <div style="font-size:0.6rem;color:#888;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.07em">Energy breakdown</div>
              <div style="height:18px;border-radius:6px;overflow:hidden;display:flex;margin-bottom:8px;background:var(--dash-border)">
                ${drv ? `<div style="width:${drv}%;background:#0288d1;display:flex;align-items:center;justify-content:center" title="Driving ${drv}%"><span style="font-size:9px;color:#fff;font-weight:700;white-space:nowrap;overflow:hidden;padding:0 3px">${drv > 10 ? drv+'%' : ''}</span></div>` : ''}
                ${clm ? `<div style="width:${clm}%;background:#7b1fa2;display:flex;align-items:center;justify-content:center" title="Climate ${clm}%"><span style="font-size:9px;color:#fff;font-weight:700;white-space:nowrap;overflow:hidden;padding:0 3px">${clm > 6 ? clm+'%' : ''}</span></div>` : ''}
                ${acc ? `<div style="width:${acc}%;background:#f39c12;display:flex;align-items:center;justify-content:center" title="Accessories ${acc}%"><span style="font-size:9px;color:#fff;font-weight:700;white-space:nowrap;overflow:hidden;padding:0 3px">${acc > 6 ? acc+'%' : ''}</span></div>` : ''}
                ${ext ? `<div style="width:${ext}%;background:#e74c3c;display:flex;align-items:center;justify-content:center" title="Ext Temp ${ext}%"><span style="font-size:9px;color:#fff;font-weight:700;white-space:nowrap;overflow:hidden;padding:0 3px">${ext > 6 ? ext+'%' : ''}</span></div>` : ''}
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                ${drv ? `<span style="font-size:0.65rem;display:flex;align-items:center;gap:3px"><span style="display:inline-block;width:8px;height:8px;background:#0288d1;border-radius:2px"></span>Driving ${drv}%</span>` : ''}
                ${clm ? `<span style="font-size:0.65rem;display:flex;align-items:center;gap:3px"><span style="display:inline-block;width:8px;height:8px;background:#7b1fa2;border-radius:2px"></span>Climate ${clm}%</span>` : ''}
                ${acc ? `<span style="font-size:0.65rem;display:flex;align-items:center;gap:3px"><span style="display:inline-block;width:8px;height:8px;background:#f39c12;border-radius:2px"></span>Accessories ${acc}%</span>` : ''}
                ${ext ? `<span style="font-size:0.65rem;display:flex;align-items:center;gap:3px"><span style="display:inline-block;width:8px;height:8px;background:#e74c3c;border-radius:2px"></span>Ext Temp ${ext}%</span>` : ''}
              </div>
            </div>

            <!-- Right: driving scores -->
            <div>
              <div style="font-size:0.6rem;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.07em">How is my driving?</div>
              ${[['Acceleration', sAcc], ['Deceleration', sDec], ['Speed', sSpd]].map(([label, score]) => score != null ? `
              <div style="margin-bottom:7px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                  <span style="font-size:0.72rem;color:var(--text)">${label}</span>
                  <span style="font-size:0.72rem;font-weight:700;color:${scoreColor(score)}">${score}%</span>
                </div>
                <div style="height:7px;background:var(--dash-border);border-radius:4px;overflow:hidden">
                  <div style="height:100%;width:${score}%;background:${scoreColor(score)};border-radius:4px;transition:width 0.6s ease"></div>
                </div>
              </div>` : '').join('')}
              <div style="font-size:0.62rem;color:#aaa;margin-top:6px">From Mach-E trip computer</div>
            </div>

          </div>
        </div>`;
        })() : ''}
      </div>`;
    }).join('');

    container.innerHTML = tripHTML || '<p style="color:#888;font-size:0.85rem">No qualifying road trips found.</p>';
  })(sl);

  /* ════════════════════════════════════════
     NEW SECTION 9 — VEHICLE COMPARISON
     Only shown when 2+ vehicles have data
  ════════════════════════════════════════ */
  (function buildVehicleComparison(sl) {
    const vehiclesInData = [...new Set(sl.map(s => s.vehicle))].sort(vehicleSort);
    const section  = document.getElementById('vehicleCompSection');
    const navLink  = document.getElementById('navVehicleComp');
    if (vehiclesInData.length < 2) {
      if (section) section.style.display = 'none';
      if (navLink) navLink.style.display = 'none';
      return;
    }
    if (section) section.style.display = '';
    if (navLink) navLink.style.display = '';

    // Per-vehicle colors (shared map → same color for a car everywhere)
    const vehColorMap = {};
    vehiclesInData.forEach((v, i) => { vehColorMap[v] = vehColor(v, i); });

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
          // grace adds right-side headroom so the end-aligned value labels aren't clipped
          x: { grid: { color: gc() }, ticks: { color: tc() }, beginAtZero: true, grace: '15%' },
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
          // grace adds right-side headroom so the end-aligned value labels aren't clipped
          x: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v + '¢' }, beginAtZero: true, grace: '15%' },
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
          backgroundColor: vehColorMap[v], borderRadius: 4
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

    // Chart: monthly real efficiency (kWh/100mi) per vehicle
    // Only uses sessions with actual miles_added from FordPass — not assumed constants.
    // Months with no real data are shown as gaps (spanGaps: false).
    mkChart('chartVehicleEfficiency', {
      type: 'line',
      data: {
        labels: allMonths.map(monthLabel),
        datasets: vehiclesInData.map(v => {
          const data = allMonths.map(m => {
            const ms = sl.filter(s => s.vehicle === v && s.month === m && s.hasRealEff);
            if (!ms.length) return null;
            const kwh = ms.reduce((a,s) => a + s.kwh, 0);
            const mi  = ms.reduce((a,s) => a + s.milesAdded, 0);
            // Store as mi/kWh — the natural EV driver unit (higher = better)
            return mi > 0 ? +(mi / kwh).toFixed(3) : null;
          });
          return { label: v, data, borderColor: vehColorMap[v], borderWidth: 2.5,
                   pointRadius: 4, tension: 0.35, spanGaps: false, yAxisID: 'yMiKwh' };
        })
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 10 } },
          datalabels: { display: false },
          tooltip: { callbacks: { label: ctx => {
            const v = ctx.parsed.y;
            if (v == null) return '';
            return ` ${ctx.dataset.label}: ${v.toFixed(2)} mi/kWh  ·  ${Math.round(1000/v)} Wh/mi`;
          }}}
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: tc() } },
          yMiKwh: {
            position: 'left',
            grid: { color: gc() },
            ticks: { color: tc(), callback: v => v.toFixed(2) + ' mi/kWh' },
            title: { display: true, text: 'mi / kWh  ↑ better', color: '#888' },
            beginAtZero: false
          },
          yWhMi: {
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#888', callback: v => Math.round(1000/v) + ' Wh/mi' },
            title: { display: true, text: 'Wh / mi  ↓ better', color: '#888' },
            afterDataLimits: axis => {
              const left = axis.chart.scales.yMiKwh;
              if (left) { axis.min = left.min; axis.max = left.max; }
            },
            beginAtZero: false
          }
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
        const vehColors = VEHICLE_COLORS;

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

      // durations can be empty even when timeSessions isn't (all zero/invalid) —
      // Math.max(...[]) would be -Infinity and corrupt the bin range.
      const durMax = durations.length ? Math.min(Math.ceil(Math.max(...durations)), 24) : 1;
      const durBins = hist(durations, 10, 0, durMax);
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
      // Build {bucket, avg} rows and sort largest → smallest so the chart reads
      // top-to-bottom by charge rate. Runs on every render, so it re-sorts
      // automatically if the underlying data changes (index 0 draws at the top).
      const rateBuckets = [...new Set(timeSessions.map(s => s.bucket))];
      const rateRows = rateBuckets.map(b => {
        const g = timeSessions.filter(s => s.bucket === b);
        const rates = g.map(s => {
          const h = durationHours(s);
          return h && h > 0 ? s.kwh / h : null;
        }).filter(Boolean);
        const avg = rates.length ? +(rates.reduce((a,v)=>a+v,0)/rates.length).toFixed(1) : 0;
        return { bucket: b, avg };
      }).sort((a, b) => b.avg - a.avg);
      mkChart('chartAvgRate', {
        type: 'bar',
        data: {
          labels: rateRows.map(r => r.bucket),
          datasets: [{
            data: rateRows.map(r => r.avg),
            backgroundColor: rateRows.map(r => BUCKET_COLORS[r.bucket] || '#888'),
            borderRadius: 6
          }]
        },
        options: { responsive:true, maintainAspectRatio:false, indexAxis:'y',
          plugins:{
            legend:{display:false},
            datalabels:{
              display: ctx => ctx.dataset.data[ctx.dataIndex] > 0,
              // Put label inside bar if value ≥ 20kW, outside if smaller
              anchor: ctx => ctx.dataset.data[ctx.dataIndex] >= 20 ? 'end' : 'end',
              align: ctx => ctx.dataset.data[ctx.dataIndex] >= 20 ? 'start' : 'end',
              offset: ctx => ctx.dataset.data[ctx.dataIndex] >= 20 ? 8 : 4,
              color: ctx => ctx.dataset.data[ctx.dataIndex] >= 20 ? '#fff' : tc(),
              font: { size: 11, weight: 'bold' },
              formatter: v => {
                if (!v) return '';
                return v >= 100
                  ? v.toPrecision(3) + ' kW'
                  : v.toPrecision(2) + ' kW';
              }
            },
            tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.x.toFixed(1)} kW avg (incl. idle)`}}
          },
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

      // ── 7. Charging speed spectrum — classify each timed session into a power tier ──
      // avg kW = kWh / duration (includes idle, so AC overnights correctly land low and
      // short DC fast-charges land high → a clean Level 2 vs DC-fast split).
      const SPEED_TIERS = [
        { label: 'Level 1 (<1.9 kW)', max: 1.9,      color: '#90a4ae' },
        { label: 'Level 2 (2–19 kW)', max: 19,       color: '#0288d1' },
        { label: 'DC 20–49 kW',       max: 49,       color: '#f39c12' },
        { label: 'DC 50–149 kW',      max: 149,      color: '#FF7A14' },
        { label: 'DC 150+ kW',        max: Infinity, color: '#e74c3c' }
      ];
      const tierEnergy = SPEED_TIERS.map(() => 0);
      const tierCount  = SPEED_TIERS.map(() => 0);
      timeSessions.forEach(s => {
        const h = durationHours(s);
        if (!h || h <= 0) return;
        const kw  = s.kwh / h;
        let idx = SPEED_TIERS.findIndex(t => kw < t.max);
        if (idx === -1) idx = SPEED_TIERS.length - 1;
        tierEnergy[idx] += s.kwh;
        tierCount[idx]  += 1;
      });
      // Drop empty tiers so the legend/axis only shows bands you've actually used
      const tierIdx = SPEED_TIERS.map((_, i) => i).filter(i => tierCount[i] > 0);
      const tLabels = tierIdx.map(i => SPEED_TIERS[i].label);
      const tColors = tierIdx.map(i => SPEED_TIERS[i].color);

      mkChart('chartSpeedMixEnergy', {
        type: 'doughnut',
        data: {
          labels: tLabels,
          datasets: [{
            data: tierIdx.map(i => +tierEnergy[i].toFixed(1)),
            backgroundColor: tColors,
            borderWidth: 0
          }]
        },
        options: { responsive:true, maintainAspectRatio:false, cutout:'58%',
          plugins:{
            legend:{ position:'right', labels:{ color: tc(), boxWidth: 12, padding: 8, font:{ size: 10 },
              generateLabels: chart => {
                const ds  = chart.data.datasets[0];
                const tot = ds.data.reduce((a,v) => a+v, 0);
                return chart.data.labels.map((label, i) => ({
                  text: `${label}  ${tot > 0 ? (ds.data[i]/tot*100).toFixed(0) : '0'}%`,
                  fillStyle: ds.backgroundColor[i], strokeStyle: ds.backgroundColor[i], lineWidth: 0
                }));
              }
            }},
            datalabels:{ display:false },
            tooltip:{ callbacks:{ label: ctx => ` ${ctx.label}: ${(+ctx.raw).toFixed(0)} kWh` } }
          }
        }
      });

      mkChart('chartSpeedTierCount', {
        type: 'bar',
        data: {
          labels: tLabels,
          datasets: [{ data: tierIdx.map(i => tierCount[i]), backgroundColor: tColors, borderRadius: 5 }]
        },
        options: { responsive:true, maintainAspectRatio:false, indexAxis:'y',
          plugins:{ legend:{ display:false },
            datalabels:{ anchor:'end', align:'end', offset:4, color: tc(), font:{ size:11, weight:'bold' },
              formatter: v => v > 0 ? v : '' },
            tooltip:{ callbacks:{ label: ctx => ` ${ctx.parsed.x} sessions` } }
          },
          scales:{
            x:{ grid:{ color: gc() }, ticks:{ color: tc(), precision:0 }, beginAtZero:true,
                title:{ display:true, text:'Sessions', color:'#888' } },
            y:{ grid:{ display:false }, ticks:{ color: tc(), font:{ size:10 } } }
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

    // ── 1b. Energy In vs Range Added — efficiency cloud with 2/3/4 mi/kWh iso-lines ──
    const effVehList = [...new Set(effSl.map(s => s.vehicle))];
    const maxKwhEff  = Math.ceil(Math.max(...effSl.map(s => s.kwh)) / 5) * 5 || 60;
    const isoLine = (mikwh, color) => ({
      type: 'line', label: mikwh.toFixed(0) + ' mi/kWh',
      data: [{ x:0, y:0 }, { x:maxKwhEff, y:mikwh*maxKwhEff }],
      borderColor: color, borderWidth: 1.25, borderDash: [6,4],
      pointRadius: 0, pointHoverRadius: 0, fill: false, tension: 0, order: 1
    });
    const cloudDatasets = effVehList.map((v, i) => ({
      label: v,
      data: effSl.filter(s => s.vehicle === v).map(s => ({ x: s.kwh, y: s.milesAdded, e: s.realMiPerKwh, d: s.date })),
      backgroundColor: vehColor(v, i) + 'bb',
      borderColor: vehColor(v, i),
      pointRadius: 4, pointHoverRadius: 7, order: 0
    }));
    mkChart('chartEnergyVsRange', {
      type: 'scatter',
      data: { datasets: [...cloudDatasets, isoLine(2, C_RED), isoLine(3, C_GREEN), isoLine(4, C_BLUE)] },
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{ position:'top', labels:{ color:tc(), boxWidth:10, padding:12, font:{ size:10 } } },
          datalabels:{ display:false },
          tooltip:{ callbacks:{ label:ctx=>{
            const r = ctx.raw;
            return (r && r.e != null)
              ? ` ${r.d}: ${r.y} mi from ${r.x} kWh (${r.e.toFixed(2)} mi/kWh)`
              : ` ${ctx.dataset.label}`;
          } } }
        },
        scales:{
          x:{ grid:{ color:gc() }, ticks:{ color:tc(), callback:v=>v+' kWh' }, beginAtZero:true,
              title:{ display:true, text:'Energy added (kWh)', color:'#888' } },
          y:{ grid:{ color:gc() }, ticks:{ color:tc(), callback:v=>v+' mi' }, beginAtZero:true,
              title:{ display:true, text:'Range added (mi)', color:'#888' } }
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
      const assumedEff  = gs.mi_per_kwh || 3.0;
      const gasPrice    = gs.gas_price || 3.26;
      const mpg         = gs.mpg || 27;
      // Real line: actual FordPass miles when known (so it's independent of the
      // delivered-vs-battery energy split); Assumed line: delivered energy × assumed mi/kWh.
      const realMiles   = s.hasRealEff ? s.milesAdded : s.kwh * assumedEff;
      cumReal    += (realMiles   / mpg * gasPrice) - s.cost;
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

  // ── Temperature charts (only when temp data available) ──────────────────
  const tempSl    = sl.filter(s => s.hasTemp);
  const tempEffSl = tempSl.filter(s => s.hasRealEff);
  const tempSection = document.getElementById('tempChartsSection');
  if (tempSl.length >= 5 && tempSection) {
    tempSection.style.display = '';

    // Redefine locally — these are inside the efficiency IIFE and not in scope here
    const tempVehicles = [...new Set(sl.map(s => s.vehicle))].sort(vehicleSort);
    const tempPalette  = ['#7b1fa2','#f39c12','#0288d1','#2ecc71'];
    const vehColors2   = {};
    tempVehicles.forEach((v, i) => { vehColors2[v] = tempPalette[i % tempPalette.length]; });

    // Chart 1: Efficiency vs temperature scatter
    const buildTempScatter = () => {
      const excludeHome = document.getElementById('tempExcludeHome')?.checked;
      const scatterSl = excludeHome ? tempEffSl.filter(s => s.bucket !== 'Home') : tempEffSl;
      if (document.getElementById('chartEffVsTemp')) {
        mkChart('chartEffVsTemp', {
          type: 'scatter',
          data: {
            datasets: tempVehicles.map(v => ({
              label: v,
              data: scatterSl.filter(s => s.vehicle === v)
                             .map(s => ({ x: Math.round(s.tempC*9/5+32), y: s.realMiPerKwh })),
              backgroundColor: vehColors2[v] + 'aa',
              borderColor: vehColors2[v],
              borderWidth: 1, pointRadius: 4, pointHoverRadius: 6
            }))
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 10, font: { size: 10 } } },
              datalabels: { display: false },
              tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(2)} mi/kWh @ ${ctx.parsed.x}°F` } }
            },
            scales: {
              x: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v + '°F' },
                   title: { display: true, text: `Ambient temp (°F)${excludeHome ? ' — home excluded' : ''}`, color: '#888' } },
              y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v.toFixed(2) + ' mi/kWh' },
                   title: { display: true, text: 'mi / kWh  ↑ better', color: '#888' }, beginAtZero: false }
            }
          }
        });
      }
    };
    buildTempScatter();
    const toggleEl = document.getElementById('tempExcludeHome');
    if (toggleEl) {
      // Remove old listener if rebuild fires (vehicle filter change)
      const newToggle = toggleEl.cloneNode(true);
      toggleEl.parentNode.replaceChild(newToggle, toggleEl);
      newToggle.addEventListener('change', buildTempScatter);
    }

    // Chart 2: Monthly avg temp vs avg efficiency — dual axis line
    if (document.getElementById('chartTempVsEffMonth')) {
      const monthData = {};
      tempSl.forEach(s => {
        if (!monthData[s.month]) monthData[s.month] = { temps: [], effs: [] };
        monthData[s.month].temps.push(s.tempC);
      });
      tempEffSl.forEach(s => {
        if (!monthData[s.month]) monthData[s.month] = { temps: [], effs: [] };
        monthData[s.month].effs.push(s.realMiPerKwh);
      });
      const tempMonths = Object.keys(monthData).sort();
      const avgTemps = tempMonths.map(m => {
        const t = monthData[m].temps;
        return +((t.reduce((a,v)=>a+v,0)/t.length)*9/5+32).toFixed(1);
      });
      const avgEffs = tempMonths.map(m => {
        const e = monthData[m].effs;
        return e.length ? +(e.reduce((a,v)=>a+v,0)/e.length).toFixed(3) : null;
      });
      mkChart('chartTempVsEffMonth', {
        type: 'line',
        data: {
          labels: tempMonths.map(monthLabel),
          datasets: [
            { label: 'Avg temp (°F)', data: avgTemps, borderColor: '#f39c12',
              backgroundColor: 'rgba(243,156,18,0.1)', borderWidth: 2.5,
              pointRadius: 4, tension: 0.35, yAxisID: 'yTemp', fill: true },
            { label: 'Avg efficiency (mi/kWh)', data: avgEffs, borderColor: '#7b1fa2',
              backgroundColor: 'transparent', borderWidth: 2.5,
              pointRadius: 4, tension: 0.35, yAxisID: 'yEff', spanGaps: true }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 10, font: { size: 10 } } },
            datalabels: { display: false },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: tc(), font: { size: 9 } } },
            yTemp: { position: 'left', grid: { color: gc() },
                     ticks: { color: '#f39c12', callback: v => v + '°F' },
                     title: { display: true, text: 'Avg temp (°F)', color: '#f39c12' } },
            yEff:  { position: 'right', grid: { drawOnChartArea: false },
                     ticks: { color: '#7b1fa2', callback: v => v.toFixed(2) + ' mi/kWh' },
                     title: { display: true, text: 'mi/kWh', color: '#7b1fa2' }, beginAtZero: false }
          }
        }
      });
    }

    // Chart 3: Temperature distribution by month — min/avg/max bar chart
    if (document.getElementById('chartTempByMonth')) {
      const mTempData = {};
      tempSl.forEach(s => {
        if (!mTempData[s.month]) mTempData[s.month] = [];
        mTempData[s.month].push(s.tempC);
      });
      const tMonths = Object.keys(mTempData).sort();
      const tMin  = tMonths.map(m => Math.round(Math.min(...mTempData[m])*9/5+32));
      const tMax  = tMonths.map(m => Math.round(Math.max(...mTempData[m])*9/5+32));
      const tAvg  = tMonths.map(m => {
        const arr = mTempData[m];
        return +((arr.reduce((a,v)=>a+v,0)/arr.length)*9/5+32).toFixed(1);
      });
      mkChart('chartTempByMonth', {
        type: 'bar',
        data: {
          labels: tMonths.map(monthLabel),
          datasets: [
            { label: 'Min °F', data: tMin, backgroundColor: C_BLUE,   borderRadius: 3 },
            { label: 'Avg °F', data: tAvg, backgroundColor: C_VIOLET, borderRadius: 3 },
            { label: 'Max °F', data: tMax, backgroundColor: C_AMBER,  borderRadius: 3 },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 10, font: { size: 10 } } },
            datalabels: { display: false },
            tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}°F` } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: tc(), font: { size: 9 } } },
            y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => v + '°F' },
                 title: { display: true, text: 'Temperature (°F)', color: '#888' } }
          }
        }
      });
    }
  } else if (tempSection) {
    tempSection.style.display = 'none';
  }

  // ── end section 11 ──

  buildLocationStats(sl);
  buildPerspectiveCards(sl);
  buildWhenDoICharge(sl);
  buildGasSensitivity(sl);

} // ── end rebuild ──

/* ════════════════════════════════════════════════════════
   WHEN DO I CHARGE — Hour × Day of Week heatmap
   ════════════════════════════════════════════════════════ */
function buildWhenDoICharge(sl) {
  const grid = document.getElementById('chargingWhenGrid');
  if (!grid) return;
  _whenChargeSl = sl;   // remember so we can re-render on theme toggle

  const timed = sl.filter(s => s.startTime && s.startTime.match(/^\d{1,2}:\d{2}/));
  if (!timed.length) {
    grid.innerHTML = '<p style="color:#888;font-size:0.84rem;padding:12px 0">No sessions with recorded start time yet — start times are captured automatically by the iPhone Shortcut.</p>';
    return;
  }

  const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const HOURS = Array.from({length: 24}, (_,i) => i);
  const dark  = document.documentElement.getAttribute('data-theme') === 'dark';

  // Count sessions per (hour, dow) + the dominant charging type (for the tooltip).
  const counts = {}, byType = {};
  let maxCount = 0;
  timed.forEach(s => {
    const hour = parseInt(s.startTime.split(':')[0], 10);
    const key  = `${hour}_${s.dow}`;
    counts[key] = (counts[key] || 0) + 1;
    (byType[key] ??= {})[s.bucket] = (byType[key][s.bucket] || 0) + 1;
    if (counts[key] > maxCount) maxCount = counts[key];
  });
  const domType = k => byType[k] ? Object.entries(byType[k]).sort((a,b)=>b[1]-a[1])[0][0] : '';

  // Single-hue intensity (frequency is the whole point — "darker = more"). Empty
  // cells are transparent so they blend into the card: dark in dark mode, light in
  // light mode — no more glaring white grid.
  const ACCENT = '124,92,246'; // on-brand violet
  const cellColor = count => count ? `rgba(${ACCENT},${(0.16 + 0.84 * count / maxCount).toFixed(3)})` : 'transparent';

  const hourLabel = h => h === 0 ? '12a' : h === 12 ? '12p' : (h < 12 ? h+'a' : (h-12)+'p');
  const txtColor  = dark ? '#6f6f6f' : '#999';
  const hdrColor  = dark ? '#9a9a9a' : '#666';
  const cellBorder = dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #ececec';

  let html = `<div style="display:grid;grid-template-columns:32px repeat(7,1fr);grid-auto-rows:13px;gap:2px;width:100%">`;
  html += `<div></div>`;
  DAYS.forEach(d => { html += `<div style="text-align:center;font-size:9.5px;font-weight:600;color:${hdrColor};padding-bottom:2px">${d}</div>`; });
  HOURS.forEach(h => {
    html += `<div style="font-size:9px;color:${txtColor};text-align:right;padding-right:5px;display:flex;align-items:center;justify-content:flex-end">${h % 3 === 0 ? hourLabel(h) : ''}</div>`;
    DAYS.forEach((_, dow) => {
      const key = `${h}_${dow}`, count = counts[key] || 0;
      const tip = count > 0 ? `${hourLabel(h)} ${DAYS[dow]} — ${count} session${count!==1?'s':''}${domType(key)?` · mostly ${domType(key)}`:''}` : '';
      html += `<div data-tip="${tip}" style="border-radius:2px;background:${cellColor(count)};border:${cellBorder}"></div>`;
    });
  });
  html += '</div>';

  // Compact intensity legend (fewer → more), type detail moves to hover.
  const swatch = t => `<div style="width:13px;height:13px;border-radius:2px;background:${t ? `rgba(${ACCENT},${(0.16+0.84*t).toFixed(2)})` : 'transparent'};border:${cellBorder}"></div>`;
  html += `<div style="display:flex;align-items:center;gap:6px;margin-top:12px;font-size:10px;color:${hdrColor}">
    <span>Fewer</span>${swatch(0)}${swatch(0.34)}${swatch(0.67)}${swatch(1)}<span>More</span>
    <span style="margin-left:auto;color:#888">hover a cell for the charging type</span></div>`;

  grid.innerHTML = html;

  // Tooltip wiring — the #chargingWhenGrid element persists across rebuilds (only its
  // innerHTML is replaced), so wire the hover listeners ONCE to avoid accumulating a new
  // set on every vehicle-filter toggle. dataset.tip is read live from the current DOM.
  if (!_whenChargeWired) {
    _whenChargeWired = true;
    // Re-render on theme toggle so the grid colors follow light/dark.
    window.addEventListener('themeChanged', () => { if (_whenChargeSl) buildWhenDoICharge(_whenChargeSl); });
    const hmTip = document.getElementById('hm-tip');
    let _hmRafId = null;
    grid.addEventListener('mouseover', e => {
      const t = e.target.dataset.tip;
      if (t) { hmTip.textContent = t; hmTip.style.display = 'block'; }
    });
    grid.addEventListener('mousemove', e => {
      if (_hmRafId) return;
      _hmRafId = requestAnimationFrame(() => {
        _hmRafId = null;
        hmTip.style.transform = `translate3d(${e.clientX+14}px,${e.clientY-34}px,0)`;
      });
    });
    grid.addEventListener('mouseout', e => {
      if (e.target.dataset.tip) hmTip.style.display = 'none';
    });
  }
}

/* ════════════════════════════════════════════════════════
   GAS PRICE SENSITIVITY SLIDER
   ════════════════════════════════════════════════════════ */
function buildGasSensitivity(sl) {
  const slider    = document.getElementById('gasPriceSlider');
  const label     = document.getElementById('gasPriceLabel');
  const chartEl   = document.getElementById('chartGasSensitivity');
  if (!slider || !chartEl) return;

  // Pre-compute per-session: miles driven and electricity cost (fixed)
  // Savings at price P = (miles / mpg) * P - electricityCost
  const sessionData = sl.map(s => {
    const gs    = getGasSavingsObj(s.date, s.vehicle);
    const mpg   = VEHICLE_MPG[s.vehicle] || 27;
    const mi    = s.hasRealEff ? s.milesAdded : s.kwh * (gs.mi_per_kwh || 3.0);
    const gallons = mi / mpg;
    return { date: s.date, month: s.month, gallons, elecCost: s.cost, actualGasPrice: gs.gas_price };
  });

  // Actual total savings (using historical gas prices)
  const actualSavings = sessionData.reduce((a, s) => a + (s.gallons * s.actualGasPrice - s.elecCost), 0);

  // All unique months for chart x-axis
  const allMonths = [...new Set(sl.map(s => s.month))].sort();
  const monthCount = allMonths.length || 1;

  function computeAtPrice(gasPrice) {
    const total = sessionData.reduce((a,s) => a + (s.gallons * gasPrice - s.elecCost), 0);
    const byMonth = {};
    allMonths.forEach(m => { byMonth[m] = 0; });
    sessionData.forEach(s => { byMonth[s.month] = (byMonth[s.month]||0) + (s.gallons * gasPrice - s.elecCost); });
    let cum = 0;
    const cumData = allMonths.map(m => { cum += byMonth[m]; return +cum.toFixed(2); });
    const monthlyAvg = total / monthCount;
    const proj5yr = monthlyAvg * 60;
    return { total, byMonth, cumData, monthlyAvg, proj5yr };
  }

  // Set slider to actual avg gas price initially
  const avgGasPrice = sessionData.length
    ? sessionData.reduce((a,s)=>a+s.actualGasPrice,0)/sessionData.length
    : 3.26;
  slider.value = avgGasPrice.toFixed(2);
  label.textContent = '$' + parseFloat(slider.value).toFixed(2);

  // Build initial chart with actual prices as baseline
  const initData = computeAtPrice(parseFloat(slider.value));

  // Also plot actual (historical variable) cumulative as a reference line
  const actualCum = [];
  let cumAct = 0;
  allMonths.forEach(m => {
    const mSavings = sessionData.filter(s=>s.month===m).reduce((a,s)=>a+(s.gallons*s.actualGasPrice-s.elecCost),0);
    cumAct += mSavings;
    actualCum.push(+cumAct.toFixed(2));
  });

  let sensitivityChart = mkChart('chartGasSensitivity', {
    type: 'line',
    data: {
      labels: allMonths.map(monthLabel),
      datasets: [
        {
          label: 'At slider price',
          data: initData.cumData,
          borderColor: '#f39c12', backgroundColor: 'rgba(243,156,18,0.1)',
          borderWidth: 2.5, fill: true, tension: 0.35, pointRadius: 2
        },
        {
          label: 'Actual (historical rates)',
          data: actualCum,
          borderColor: '#2ecc71', backgroundColor: 'transparent',
          borderWidth: 2, borderDash: [6,3], fill: false, tension: 0.35, pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: tc(), boxWidth: 12, padding: 10, font: { size: 10 } } },
        datalabels: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: tc(), font: { size: 9 } } },
        y: { grid: { color: gc() }, ticks: { color: tc(), callback: v => '$'+v.toFixed(0) },
             title: { display: true, text: 'Cumulative savings ($)', color: '#888' } }
      }
    }
  });

  function updateSensitivity(gasPrice) {
    label.textContent = '$' + gasPrice.toFixed(2);
    const d = computeAtPrice(gasPrice);
    const delta = d.total - actualSavings;
    const deltaEl = document.getElementById('sensDelta');
    const safe = (v, fn) => (!isNaN(v) && isFinite(v)) ? fn(v) : '—';

    const totEl = document.getElementById('sensTotal');
    const moEl  = document.getElementById('sensMonthly');
    const yrEl  = document.getElementById('sens5yr');
    if (totEl) totEl.textContent = safe(d.total, fmtUSD);
    if (deltaEl) {
      deltaEl.textContent = safe(delta, v => (v >= 0 ? '+' : '') + fmtUSD(v));
      deltaEl.style.color = delta >= 0 ? '#2ecc71' : '#e74c3c';
    }
    if (moEl) moEl.textContent = safe(d.monthlyAvg, v => fmtUSD(v) + '/mo');
    if (yrEl) yrEl.textContent = safe(d.proj5yr, fmtUSD);

    // Update chart data — re-fetch from allCharts since sensitivityChart ref may be stale
    const canvas = document.getElementById('chartGasSensitivity');
    const liveChart = canvas ? Chart.getChart(canvas) : null;
    if (liveChart) {
      liveChart.data.datasets[0].data = d.cumData;
      liveChart.data.datasets[0].label = `At $${gasPrice.toFixed(2)}/gal`;
      liveChart.update('none');
    }
  }

  // Expose the current updater so the once-wired slider listener always drives the
  // LATEST rebuild's data/chart instead of a stale first-rebuild closure.
  _gasSensUpdate = updateSensitivity;

  // Init KPIs
  updateSensitivity(parseFloat(slider.value));

  // Wire listeners ONCE — the slider element + chart canvas persist across rebuilds, so
  // re-adding handlers on every vehicle-filter toggle would leak them (and fire N times).
  if (!_gasSensWired) {
    _gasSensWired = true;
    let _sensRaf = null;
    slider.addEventListener('input', () => {
      if (_sensRaf) return;
      _sensRaf = requestAnimationFrame(() => {
        _sensRaf = null;
        if (_gasSensUpdate) _gasSensUpdate(parseFloat(slider.value));
      });
    });
    window.addEventListener('themeChanged', () => {
      const canvas2 = document.getElementById('chartGasSensitivity');
      const liveChart2 = canvas2 ? Chart.getChart(canvas2) : null;
      if (liveChart2) {
        liveChart2.data.datasets[0].borderColor = '#f39c12';
        liveChart2.data.datasets[1].borderColor = '#2ecc71';
        liveChart2.options.scales.x.ticks.color = tc();
        liveChart2.options.scales.y.ticks.color = tc();
        liveChart2.options.scales.y.grid.color  = gc();
        liveChart2.update('none');
      }
    });
  }
}

/* ════════════════════════════════════════════════════════
   PERSPECTIVE HERO CARDS
   ════════════════════════════════════════════════════════
   Reference constants (all peer-reviewed / official sources):
   • Coast-to-coast: 2,800 mi (NY→LA via I-40, AAA)
   • Earth circumference: 24,901 mi (equatorial, NASA)
   • Avg US home: 10,649 kWh/yr = 887 kWh/mo (EIA 2022)
   • Tree CO₂ absorption: 21 kg/yr (EPA Greenhouse Gas Equivalencies)
   • Party balloon CO₂: ~11 L @ 1.98 g/L = 21.8 g CO₂/balloon
   • Avg fuel tanker: 9,000 gallons (DOT standard tanker)
   • Avg gas fill: 15 gal (avg of Escape 14 gal + Explorer 18 gal)
   • iPhone charge: 13.6 Wh (iPhone 15 Pro Max battery, Apple spec)
   • Olympic swimming pool: 2,500 m³ = 2,500,000 L
   • Gas CO₂: 8.887 kg/gallon (EPA)
   ════════════════════════════════════════════════════════ */
function buildPerspectiveCards(sl) {
  const grid = document.getElementById('heroCardGrid');
  if (!grid) return;

  // ── Compute total miles ──────────────────────────────
  // Smart: use odometer interpolation if we have ≥2 readings spanning >30 days,
  // otherwise fall back to sum of miles_added + kWh-estimated remainder
  // All-time miles driven — sum real FordPass miles_added per session where
  // available, and fill the rest with a kWh × mi/kWh estimate. This matches the
  // energy / gas / CO2 cards (all all-time) and respects the vehicle filter (sl).
  // The odometer readings only cover a partial window, so a delta would badly
  // undercount actual driving; they still power the precise Mileage-tab charts.
  let totalMiles = 0;
  const milesMethod = 'estimated';
  sl.forEach(s => {
    if (s.milesAdded && s.milesAdded > 0) {
      totalMiles += s.milesAdded;
    } else {
      const gs = getGasSavingsObj(s.date, s.vehicle);
      totalMiles += s.kwh * (gs.mi_per_kwh || 3.0);
    }
  });

  // ── Core stats ───────────────────────────────────────
  const totalKwh     = sl.reduce((a,s) => a + s.kwh, 0);
  const totalGasEquiv= sl.reduce((a,s) => a + s.gasEquiv, 0);
  const totalGallons = totalGasEquiv / 3.26;
  // gallons = what we would have pumped = gasEquiv $ / avg gas price
  // More accurately: sum of (estMiles / mpg) per session
  const totalGallonsAvoided = sl.reduce((a,s) => {
    const gs = getGasSavingsObj(s.date, s.vehicle);
    const mi = (s.milesAdded > 0 ? s.milesAdded : s.kwh * (gs.mi_per_kwh || 3.0));
    const mpg = VEHICLE_MPG[s.vehicle] || 27;
    return a + mi / mpg;
  }, 0);
  const totalCo2Avoided = sl.reduce((a,s) => a + (s.co2NetAvoided || 0), 0);

  // ── Reference constants ──────────────────────────────
  const COAST_TO_COAST  = 2800;
  const EARTH_CIRC      = 24901;
  const HOME_KWH_YEAR   = 10649;
  const HOME_KWH_MONTH  = HOME_KWH_YEAR / 12;
  const TREE_KG_YEAR    = 21;
  const BALLOON_G_CO2   = 21.8;
  const TANKER_GALLONS  = 9000;
  const AVG_FILL_GALLONS= 15;
  const IPHONE_WH       = 13.6;
  const CO2_GAS_KG_GAL  = 8.887;

  // ── Computed values ──────────────────────────────────
  const coastTrips    = totalMiles / COAST_TO_COAST;
  const earthPct      = (totalMiles / EARTH_CIRC) * 100;
  const homeMonths    = totalKwh / HOME_KWH_MONTH;
  const treesYear     = totalCo2Avoided / TREE_KG_YEAR;
  const tankersAvoided= totalGallonsAvoided / TANKER_GALLONS;
  const fillsAvoided  = totalGallonsAvoided / AVG_FILL_GALLONS;
  const iphoneCharges = (totalKwh * 1000) / IPHONE_WH;
  const balloons      = (totalCo2Avoided * 1000000) / (BALLOON_G_CO2 * 1000);

  // ── Format helpers ───────────────────────────────────
  function fmt(n, decimals=1) {
    if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
    if (n >= 10000)   return Math.round(n).toLocaleString();
    if (n >= 1000)    return (n/1000).toFixed(1) + 'K';
    return n.toFixed(decimals);
  }
  function fmtBig(n) {
    if (n >= 1000000) return (n/1000000).toFixed(2) + 'M';
    if (n >= 1000)    return Math.round(n/1000)*1000 < n*1.01
      ? Math.round(n).toLocaleString()
      : (n/1000).toFixed(1) + 'K';
    return Math.round(n).toLocaleString();
  }

  // ── Card definitions ─────────────────────────────────
  const cards = [
    {
      color: 'c-blue',
      icon: '🗺️',
      number: fmt(coastTrips, 1),
      unit: 'coast-to-coast trips',
      label: 'Miles Driven Equivalent',
      desc: `Your ${Math.round(totalMiles).toLocaleString()} estimated miles would take you from New York to Los Angeles <strong>${fmt(coastTrips,1)}×</strong> — one-way via I-40.`,
      footnote: `Miles source: ${milesMethod === 'odometer' ? 'odometer readings' : 'FordPass miles_added + kWh estimate'}`
    },
    {
      color: 'c-teal',
      icon: '🌍',
      number: fmt(earthPct, 1) + '%',
      unit: 'of Earth\'s circumference',
      label: 'Global Scale',
      desc: `You've driven the equivalent of <strong>${fmt(earthPct,1)}%</strong> of the way around the Earth at the equator (24,901 miles).`,
      footnote: ''
    },
    {
      color: 'c-purple',
      icon: '🏠',
      number: fmt(homeMonths, 1),
      unit: 'months of home electricity',
      label: 'Energy in Context',
      desc: `Your ${Math.round(totalKwh).toLocaleString()} kWh of charging energy equals <strong>${fmt(homeMonths,1)} months</strong> of electricity for an average American home.`,
      footnote: 'Based on EIA 2022 avg US home: 10,649 kWh/yr'
    },
    {
      color: 'c-green',
      icon: '🌳',
      number: fmt(treesYear, 0),
      unit: 'trees working for a year',
      label: 'CO₂ Absorbed',
      desc: `Your net ${Math.round(totalCo2Avoided)} kg of avoided CO₂ equals a year of carbon absorption by <strong>${fmt(treesYear,0)} trees</strong>.`,
      footnote: 'EPA: avg tree absorbs 21 kg CO₂/year'
    },
    {
      color: 'c-amber',
      icon: '⛽',
      number: fmt(fillsAvoided, 0),
      unit: 'gas station fill-ups skipped',
      label: 'Pump Visits Avoided',
      desc: `You've skipped <strong>${fmt(fillsAvoided,0)} trips to the gas station</strong>, based on ${Math.round(totalGallonsAvoided).toLocaleString()} gallons avoided at 15 gal per fill.`,
      footnote: `Avg of Escape (14 gal) + Explorer (18 gal) tanks`
    },
    {
      color: 'c-red',
      icon: '🚛',
      number: fmt(tankersAvoided, 2),
      unit: 'fuel tanker trucks',
      label: 'Gasoline Not Pumped',
      desc: `${Math.round(totalGallonsAvoided).toLocaleString()} gallons of gasoline not burned — that's <strong>${fmt(tankersAvoided,2)} tanker trucks</strong> worth of fuel.`,
      footnote: 'Standard DOT fuel tanker capacity: 9,000 gallons'
    },
    {
      color: 'c-pink',
      icon: '📱',
      number: fmtBig(iphoneCharges),
      unit: 'iPhone charges',
      label: 'Energy in Micro Scale',
      desc: `Your total charging energy could have charged an iPhone 15 Pro Max <strong>${fmtBig(iphoneCharges)} times</strong> (13.6 Wh per charge).`,
      footnote: 'Apple iPhone 15 Pro Max battery spec'
    },
    {
      color: 'c-orange',
      icon: '🎈',
      number: fmtBig(balloons),
      unit: 'party balloons of CO₂',
      label: 'CO₂ Kept Out of the Air',
      desc: `Your avoided CO₂ would fill <strong>${fmtBig(balloons)} party balloons</strong> — each holds about 11 liters of CO₂ gas.`,
      footnote: 'CO₂ density: 1.98 g/L at standard conditions'
    }
  ];

  // ── Render ───────────────────────────────────────────
  grid.innerHTML = cards.map(c => `
    <div class="hero-card ${c.color}">
      <div class="hero-icon">${c.icon}</div>
      <div class="hero-label">${c.label}</div>
      <div class="hero-number">${c.number}</div>
      <div style="font-size:0.7rem;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px">${c.unit}</div>
      <div class="hero-desc">${c.desc}</div>
      ${c.footnote ? `<div class="hero-footnote">† ${c.footnote}</div>` : ''}
    </div>
  `).join('');

  // Footnote about method
  const footnoteEl = document.getElementById('heroFootnote');
  if (footnoteEl) {
    footnoteEl.textContent = `Calculations reflect the current vehicle filter. Miles: ${milesMethod === 'odometer' ? 'from odometer readings in _data/mileage.yml' : 'estimated from FordPass miles_added data and kWh × mi/kWh assumption — add more odometer readings to mileage.yml for greater accuracy'}. All equivalency figures from EPA, EIA, Apple, and DOT published data.`;
  }
}

/* ════════════════════════════════════════════════════════
   STICKY BAR — one-time setup (called after first rebuild)
   ════════════════════════════════════════════════════════ */
function initStickyBar() {
  const stickyBar    = document.getElementById('vehicleFilterSticky');
  const inlineFilter = document.getElementById('vehicleFilterBtns');
  if (!stickyBar) return;

  // ── Measure site nav height for sticky bar positioning ──
  // Key insight from default.html:
  //   mobile < 768px: nav is position:relative → scrolls away → sticky bar at top:0
  //   desktop ≥ 768px: nav is position:sticky; top:0 → sticky bar sits below it
  // CSS already sets #vehicleFilterSticky { top:0 !important } on mobile,
  // so _updateTop() only needs to do real work on desktop.
  function _updateTop() {
    let top = 0;
    if (window.innerWidth >= 768) {
      const nav = document.querySelector('nav');
      if (nav) {
        top = Math.max(nav.offsetHeight - 1, 44);
      } else {
        top = 62;
      }
    } else {
      // On mobile, respect the safe area inset (Dynamic Island, notch, etc.)
      // Read the CSS variable we set from env(safe-area-inset-top)
      const sat = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0;
      top = sat; // CSS also sets top: var(--sat) !important so these stay in sync
    }
    document.documentElement.style.setProperty('--sticky-bar-top', top + 'px');
    const barH = stickyBar.classList.contains('visible') ? stickyBar.offsetHeight : 0;
    document.documentElement.style.setProperty('--scroll-pad', (top + barH + 8) + 'px');
  }

  _updateTop();
  window.addEventListener('load', () => {
    _updateTop();
    setTimeout(_updateTop, 500);
  }, { once: true });
  window.addEventListener('resize', _updateTop, { passive: true });

  // ── Show/hide sticky bar ──
  // Both IntersectionObserver AND a scroll listener run in parallel.
  // IO can miss fast-scroll events on Android Chrome; the scroll listener
  // catches those. The guard prevents them fighting each other.
  function _toggle(visible) {
    if (stickyBar.classList.contains('visible') === visible) return;
    stickyBar.classList.toggle('visible', visible);
    _updateTop();
  }

  function _check() {
    if (!inlineFilter) return;
    _toggle(inlineFilter.getBoundingClientRect().bottom < 0);
  }

  if (inlineFilter && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(([entry]) => {
      _toggle(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    }, { root: null, threshold: 0 });
    obs.observe(inlineFilter);
  }

  // Parallel scroll listener for Android Chrome fast-scroll
  // Skip processing when tab is hidden — saves CPU in background
  var _raf = null;
  window.addEventListener('scroll', function() {
    if (document.hidden) return;
    if (_raf) return;
    _raf = requestAnimationFrame(function() { _raf = null; _check(); });
  }, { passive: true });

  _check(); // check immediately in case page loads already scrolled
}

/* ════════════════════════════════════════════════════════
   INITIALIZE
   ════════════════════════════════════════════════════════ */
let _leafletMap   = null;
let _markerGroup  = null;
let _tileLayer    = null; // tracked so we can swap light/dark tiles on theme change
let _lastSl       = sessions;
let _mapBounds    = null; // latlngs of currently-shown markers — used by the Fit-all button

// Tile layer — single OSM source, CSS filter for dark mode
// CartoDB dark tiles caused blank map issues; CSS invert is simpler and more reliable
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function _applyTiles() {
  if (!_leafletMap) return;
  if (_tileLayer) { _tileLayer.remove(); }
  _tileLayer = L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 });
  _tileLayer.addTo(_leafletMap);
  // Apply CSS invert+hue-rotate for dark mode — reliable cross-browser approach
  const mapEl = document.getElementById('chargingMap');
  if (mapEl) {
    const tiles = mapEl.querySelector('.leaflet-tile-pane');
    if (tiles) {
      tiles.style.filter = isDark() ? 'invert(1) hue-rotate(180deg)' : '';
    }
  }
}

buildVehicleFilter();
rebuild(sessions);
initStickyBar();
initPrint();

/* ── Page Visibility API — reduce resource usage in background tabs ──────
   When the tab is hidden: suppress rAF-based animations, sticky bar scroll
   listeners continue (passive, negligible cost) but we skip redraws.
   Chart.js animations are already disabled (Chart.defaults.animation = false)
   so no work needed there. The main cost in background is the sticky bar's
   rAF scroll handler — we let it idle since it's already passive+rAF-gated.
   ──────────────────────────────────────────────────────────────────────── */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Cancel all in-flight countUp animations to free RAF slots
    _cuRAFIds.forEach(id => cancelAnimationFrame(id));
    _cuRAFIds.clear();
  }
}, { passive: true });

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
    // scrollWheelZoom off by default so scrolling the page doesn't get hijacked
    // into map zoom; it's enabled once the user clicks the map (see below).
    _leafletMap = L.map('chargingMap', { preferCanvas: true, scrollWheelZoom: false });
    _applyTiles();
    // Reapply dark filter after tiles finish loading
    _tileLayer.on('load', () => _applyTiles());
    // Create marker group once — clearLayers() on rebuild keeps tile cache alive
    _markerGroup = L.layerGroup().addTo(_leafletMap);

    // ── "Fit all" control — re-frames the map to every currently-shown location ──
    const FitAllControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function(map) {
        const c = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const a = L.DomUtil.create('a', 'ev-fit-btn', c);
        a.href = '#'; a.title = 'Fit all locations'; a.setAttribute('role', 'button');
        a.setAttribute('aria-label', 'Zoom out to fit all locations');
        a.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/></svg>';
        L.DomEvent.on(a, 'click', function(e) {
          L.DomEvent.stop(e);
          if (_mapBounds && _mapBounds.length > 1)        map.fitBounds(_mapBounds, { padding: [40, 40] });
          else if (_mapBounds && _mapBounds.length === 1)  map.setView(_mapBounds[0], 13);
        });
        return c;
      }
    });
    _leafletMap.addControl(new FitAllControl());

    // ── Size legend — reminds readers the circle area encodes kWh ──
    const SizeLegend = L.Control.extend({
      options: { position: 'bottomleft' },
      onAdd: function() {
        const d = L.DomUtil.create('div', 'ev-size-legend');
        d.innerHTML = '<b>Circle size</b> = kWh added' +
          '<span class="ev-lg-scale">' +
          '<i class="ev-lg-c" style="width:9px;height:9px"></i>' +
          '<i class="ev-lg-c" style="width:15px;height:15px"></i>' +
          '<i class="ev-lg-c" style="width:23px;height:23px"></i>' +
          '<span style="margin-left:3px">more</span></span>';
        L.DomEvent.disableClickPropagation(d);
        return d;
      }
    });
    _leafletMap.addControl(new SizeLegend());

    // ── Don't hijack page scroll: wheel-zoom only after the map is clicked, and
    //    release it when the pointer leaves. A hint tells the user what to do. ──
    const _mapEl = _leafletMap.getContainer();
    const hint = L.DomUtil.create('div', 'ev-map-hint', _mapEl);
    hint.textContent = 'Click map to zoom';
    _leafletMap.on('click', () => { _leafletMap.scrollWheelZoom.enable(); hint.classList.remove('show'); });
    // Native enter/leave fire only on the container itself (no bubbling over markers)
    _mapEl.addEventListener('mouseenter', () => { if (!_leafletMap.scrollWheelZoom.enabled()) hint.classList.add('show'); });
    _mapEl.addEventListener('mouseleave', () => { _leafletMap.scrollWheelZoom.disable(); hint.classList.remove('show'); });

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
  if (!_leafletMap || !_markerGroup) return;

  const stats = {};
  sl.forEach(s => {
    if (!stats[s.location]) stats[s.location] = { kwh: 0, cost: 0, sessions: 0, bucket: s.bucket };
    stats[s.location].kwh      += s.kwh;
    stats[s.location].cost     += (s.cost || 0);
    stats[s.location].sessions += 1;
  });

  const geoLocs = (locationData || []).filter(l => l.lat && l.lng && stats[l.location]);

  // clearLayers() removes only our markers — base tile layer stays in memory
  // This is far more efficient than eachLayer/removeLayer on vehicle filter change
  _markerGroup.clearLayers();

  if (!geoLocs.length) { _mapBounds = null; return; }

  const maxKwh = Math.max(...geoLocs.map(l => stats[l.location].kwh), 1);
  const bounds = [];

  // Circle AREA ∝ kWh, so diameter ∝ √kWh — a location with 4× the energy reads
  // as 4× the area (not 4× the width). √ also spreads out the many small road-trip
  // stops that linear scaling squashed to the minimum size next to Home/Work.
  const MIN_SZ = 16, MAX_SZ = 76;
  geoLocs.forEach(loc => {
    const st    = stats[loc.location];
    const color = BUCKET_COLORS[st.bucket] || '#888';
    const sz    = Math.round(MIN_SZ + Math.sqrt(st.kwh / maxKwh) * (MAX_SZ - MIN_SZ));
    const avg     = st.sessions ? (st.kwh / st.sessions).toFixed(1) : '0';
    const netName = st.bucket;  // already human-readable (Tesla SC, ChargePoint, Home, …)
    const costStr = st.cost > 0 ? `$${st.cost.toFixed(2)}` : 'Free';
    const popup = `<b>${loc.location}</b>` +
      (loc.city ? `<br><small style="color:#888">${loc.city}</small>` : '') +
      `<br><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:5px;vertical-align:middle"></span>${netName}` +
      `<br><b>${st.kwh.toFixed(1)} kWh</b> &nbsp;·&nbsp; ${costStr}` +
      `<br>${st.sessions} session${st.sessions !== 1 ? 's' : ''} &nbsp;·&nbsp; avg ${avg} kWh`;
    const icon = L.divIcon({
      className: 'ev-map-icon',
      html: `<div class="ev-sym" style="width:${sz}px;height:${sz}px"><span class="ev-fill" style="background:${color}"></span><span class="ev-edge" style="border-color:${color}"></span><span class="ev-core" style="background:${color}"></span></div>`,
      iconSize:   [sz, sz],
      iconAnchor: [sz / 2, sz / 2]
    });
    L.marker([loc.lat, loc.lng], { icon })
      .bindPopup(popup)
      .bindTooltip(`${loc.location} · ${Math.round(st.kwh)} kWh`, { direction: 'top', offset: [0, -sz / 2 - 3], opacity: 0.96 })
      .addTo(_markerGroup);
    bounds.push([loc.lat, loc.lng]);
  });

  _mapBounds = bounds.length ? bounds : null;
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
      'Electrify America': ['#e8e8e8', '#a7e8c5', '#3fca86', '#00963f', '#00532a'],
      'WeCharge':   ['#e8e8e8', '#c8e6c8', '#8ccb8a', '#51A950', '#245e23'],
      'Other':      ['#e8e8e8', '#e0e0e0', '#bdbdbd', '#757575', '#424242'],
    },
    dark: {
      'Work':       ['#2a2a2a', '#0d2744', '#1565c0', '#1e88e5', '#64b5f6'],
      'Home':       ['#2a2a2a', '#3b2060', '#6a2fa0', '#9c27b0', '#e040fb'],
      'Tesla SC':   ['#2a2a2a', '#4a1010', '#c62828', '#ef5350', '#ff8a80'],
      'ChargePoint':['#2a2a2a', '#3a1a00', '#bf360c', '#f4511e', '#ff8a65'],
      'Blink':      ['#2a2a2a', '#0a2a0a', '#2e7d32', '#43a047', '#81c784'],
      'Rivian':     ['#2a2a2a', '#332600', '#f57f17', '#fdd835', '#fff176'],
      'Electrify America': ['#2a2a2a', '#052a17', '#0a7a3a', '#00b04f', '#7ee6a8'],
      'WeCharge':   ['#2a2a2a', '#12300f', '#2f7d2d', '#51A950', '#9fd89e'],
      'Other':      ['#2a2a2a', '#333333', '#555555', '#888888', '#bdbdbd'],
    }
  };

  // Map bucket → label for legend
  var BUCKET_LABELS = {
    'Work': 'Work', 'Home': 'Home', 'Tesla SC': 'Tesla SC',
    'ChargePoint': 'ChargePoint', 'Blink': 'Blink', 'Rivian': 'Rivian',
    'Electrify America': 'Electrify America', 'WeCharge': 'WeCharge', 'Other': 'Public/Other'
  };

  // Are we in single-vehicle mode? (exactly one vehicle selected, not 'all')
  var singleVehicle = !activeVehicles.has('all') && activeVehicles.size === 1;

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
    singleVehicle = !activeVehicles.has('all') && activeVehicles.size === 1;

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
    var _tipRaf = null;
    el.addEventListener('mouseover', function(e) {
      var t = e.target.dataset.tip;
      if (t) { hmTip.textContent = t; hmTip.style.display = 'block'; }
    });
    el.addEventListener('mousemove', function(e) {
      if (_tipRaf) return;
      _tipRaf = requestAnimationFrame(function() {
        _tipRaf = null;
        hmTip.style.transform = 'translate3d(' + (e.clientX + 14) + 'px,' + (e.clientY - 34) + 'px,0)';
      });
    });
    el.addEventListener('mouseout', function(e) {
      if (e.target.dataset.tip) hmTip.style.display = 'none';
    });
    el.addEventListener('touchstart', function(e) {
      var t = e.target.dataset.tip;
      if (t) {
        var touch = e.touches[0];
        hmTip.textContent = t;
        hmTip.style.transform = 'translate3d(' + (touch.clientX + 14) + 'px,' + (touch.clientY - 44) + 'px,0)';
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
  // Swap map tiles light ↔ dark
  _applyTiles();
  allCharts.forEach(chart => {
   try {
    if (!chart || !chart.data) return;   // skip any stale/destroyed instance
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
   } catch(e){ /* one bad chart must never block the rest */ }
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

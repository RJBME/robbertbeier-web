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
  .trip-container { font-family: -apple-system, sans-serif; max-width: 1000px; margin: auto; color: var(--text); overflow-x: clip;
    /* Match native form-control chrome (date/time picker icons, number spinners,
       select carets) to the page theme. Without this the calendar/clock glyphs
       render as a fixed dark icon that's nearly invisible on the dark input bg. */
    color-scheme: light;
    /* Theme-aware muted text — derived from --text so it stays legible in BOTH
       light and dark mode (the old fixed #888 was too dim on dark). Static
       fallback first for browsers without color-mix. */
    --tc-muted: #6b7280;
    --tc-muted: color-mix(in srgb, var(--text) 70%, transparent); }
  [data-theme="dark"] .trip-container { color-scheme: dark; }

  .charge-nav { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--dash-border); align-items: center; }
  .charge-nav a { font-size: 0.78rem; font-weight: 600; text-decoration: none; padding: 5px 14px; border-radius: 20px; border: 1px solid var(--dash-border); background: var(--dash-card); color: var(--tc-muted); transition: all 0.15s; }
  .charge-nav a:hover  { border-color: var(--link); color: var(--link); }
  .charge-nav a.active { background: var(--link); border-color: var(--link); color: #fff; font-weight: 700; }

  .trip-header h1 { margin: 0 0 4px 0; }
  .trip-header p  { margin: 0 0 20px 0; color: var(--tc-muted); font-size: 0.85rem; }

  .trip-card { background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 12px; padding: 20px; margin-bottom: 20px; }

  .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
  .field.full { grid-column: 1 / -1; }
  .field label { font-size: 0.65rem; text-transform: uppercase; font-weight: 700; color: var(--tc-muted); letter-spacing: 0.06em; }
  .field input, .field select {
    padding: 9px 12px; border-radius: 8px; border: 1px solid var(--dash-border);
    background: var(--bg); color: var(--text); font-size: 0.85rem; box-sizing: border-box; width: 100%;
  }
  .trip-container input::placeholder, .trip-container textarea::placeholder { color: var(--tc-muted); opacity: 1; }
  .field .hint { font-size: 0.62rem; color: var(--tc-muted); }
  .quick-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .quick-row button {
    font-size: 0.68rem; padding: 3px 10px; border-radius: 14px; cursor: pointer;
    border: 1px solid var(--dash-border); background: var(--dash-card); color: var(--tc-muted); transition: all 0.15s;
  }
  .quick-row button:hover { border-color: var(--link); color: var(--link); }

  /* Google-Maps-style reorderable route list */
  #routeStops { display: flex; flex-direction: column; }
  .route-row { display: grid; grid-template-columns: 18px 16px 1fr auto auto auto auto auto; align-items: center; gap: 7px; padding: 4px 0; position: relative; }
  .route-row.dragging { opacity: 0.5; }
  .rs-handle { cursor: grab; color: #aaa; font-size: 0.95rem; text-align: center; user-select: none; touch-action: none; }
  .rs-handle:active { cursor: grabbing; }
  .rs-dot { width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; }
  .rs-dot::before { content: ''; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #888; box-sizing: border-box; }
  .rs-dot.rs-dest::before { content: '📍'; border: none; font-size: 13px; width: auto; height: auto; }
  /* dotted connector between rows */
  .route-row:not(:last-child) .rs-dot::after { content: ''; position: absolute; left: 25px; top: 24px; height: calc(100% - 14px); border-left: 2px dotted var(--dash-border); }
  .rs-addr { min-width: 0; padding: 9px 11px; border-radius: 8px; border: 1px solid var(--dash-border); background: var(--bg); color: var(--text); font-size: 0.84rem; }
  .rs-btn { border: 1px solid var(--dash-border); background: var(--dash-card); color: var(--tc-muted); border-radius: 8px; padding: 6px 8px; cursor: pointer; font-size: 0.8rem; line-height: 1; }
  .rs-btn:hover { border-color: var(--link); color: var(--link); }
  .rs-charge.on { background: var(--link); border-color: var(--link); color: #fff; }
  .rs-clock.on { background: var(--link); border-color: var(--link); color: #fff; }
  .rs-loc.locating { opacity: 0.55; pointer-events: none; }
  .rs-del { visibility: hidden; }
  .route-row.removable .rs-del { visibility: visible; color: #ef4444; }
  /* charge slider row (full width under the stop) */
  .rs-slider { grid-column: 3 / -1; display: none; align-items: center; flex-wrap: wrap; gap: 10px; padding: 4px 2px 8px; }
  .rs-slider.show { display: flex; }
  .rs-slider input[type=range] {
    flex: 1; margin: 0; height: 18px; cursor: pointer;
    -webkit-appearance: none; appearance: none; background: transparent;
  }
  .rs-slider input[type=range]:focus { outline: none; }
  /* WebKit: track is a neutral bar with a green fill sized by --fill (set in JS) */
  .rs-slider input[type=range]::-webkit-slider-runnable-track {
    height: 6px; border-radius: 4px; background-color: var(--dash-border);
    background-image: linear-gradient(#16a34a, #16a34a);
    background-repeat: no-repeat; background-size: var(--fill, 60%) 100%;
  }
  .rs-slider input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none; margin-top: -5px;
    width: 16px; height: 16px; border-radius: 50%;
    background: #16a34a; border: 2px solid var(--dash-card); box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }
  /* Firefox: native progress + track + thumb */
  .rs-slider input[type=range]::-moz-range-track { height: 6px; border-radius: 4px; background: var(--dash-border); }
  .rs-slider input[type=range]::-moz-range-progress { height: 6px; border-radius: 4px; background: #16a34a; }
  .rs-slider input[type=range]::-moz-range-thumb {
    width: 16px; height: 16px; border-radius: 50%;
    background: #16a34a; border: 2px solid var(--dash-card); box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }
  .rs-slider .rs-pct { font-size: 0.78rem; font-weight: 700; color: #16a34a; min-width: 56px; }
  .rs-slider .rs-pct small { font-weight: 400; color: var(--tc-muted); }
  /* optional $/kWh cost for charging at this stop (default free) */
  .rs-slider .rs-cost { display: flex; align-items: center; gap: 3px; font-size: 0.72rem; color: var(--tc-muted); white-space: nowrap; cursor: text; }
  .rs-slider .rs-cost-input {
    width: 56px; padding: 4px 6px; border-radius: 6px; border: 1px solid var(--dash-border);
    background: var(--bg); color: var(--text); font-size: 0.74rem; text-align: right;
  }
  /* Scheduled-departure + charge sub-rows inside the stop panel. The schedule
     row (a leave date/time) shows whenever the 🕒 button is on; the charge row
     (mode toggle + slider/power + cost) shows whenever ⚡ is on. */
  .rs-sched, .rs-chg { flex: 1 1 100%; display: none; align-items: center; gap: 8px; flex-wrap: wrap; }
  .route-row.scheduled .rs-sched { display: flex; }
  .route-row.charging .rs-chg { display: flex; }
  .rs-sched .rs-sched-lbl, .rs-chg .rs-mode-lbl { font-size: 0.72rem; color: var(--tc-muted); font-weight: 600; }
  .rs-dep-date, .rs-dep-time, .rs-power {
    padding: 4px 6px; border-radius: 6px; border: 1px solid var(--dash-border);
    background: var(--bg); color: var(--text); font-size: 0.74rem;
  }
  .rs-dep-date { flex: 0 0 8.75rem; }
  .rs-dep-time { flex: 0 0 6.5rem; }
  .rs-power { width: 64px; text-align: right; }
  .rs-dwell, .rs-pow-out { font-size: 0.7rem; color: var(--tc-muted); white-space: nowrap; }
  /* Per-stop charge-mode toggle: "Charge to %" (slider) vs "From time here" (kW). */
  .rs-mode { display: inline-flex; border: 1px solid var(--dash-border); border-radius: 7px; overflow: hidden; }
  .rs-mode-btn { border: none; background: var(--dash-card); color: var(--tc-muted); font-size: 0.68rem; padding: 5px 8px; cursor: pointer; line-height: 1; }
  .rs-mode-btn + .rs-mode-btn { border-left: 1px solid var(--dash-border); }
  .rs-mode-btn.on { background: var(--link); color: #fff; }
  .rs-pctwrap { flex: 1 1 auto; display: flex; align-items: center; gap: 10px; min-width: 55%; }
  .rs-powwrap { display: none; align-items: center; gap: 6px; }
  .route-row.powmode .rs-pctwrap { display: none; }
  .route-row.powmode .rs-powwrap { display: flex; }
  .stop.wp-stop .stop-num { background: #16a34a; }
  .net-wp { background: #16a34a20; color: #16a34a; }

  .opt-row { display: flex; gap: 18px; flex-wrap: wrap; align-items: flex-end; margin-top: 16px; }
  .opt-row .field { flex: 1; min-width: 130px; }
  /* Departure holds the most (a date + two time inputs) so give it more room and a
     date field wide enough to show MM/DD/YYYY without being squeezed. The two time
     inputs share a fixed width so they line up vertically under each other. */
  .opt-row .dep-field { flex: 1.6 1 17rem; min-width: 16.5rem; }
  .dep-row { display: flex; gap: 6px; align-items: center; }
  .dep-row + .dep-row { margin-top: 6px; }
  .dep-date { flex: 1 1 9rem; min-width: 8.5rem; }
  .dep-time { flex: 0 0 7.25rem; }
  .dep-arrive-lbl { flex: 1 1 auto; text-align: right; font-size: 0.62rem; color: var(--tc-muted); font-weight: 600; text-transform: none; letter-spacing: 0; white-space: nowrap; }
  .check { display: flex; align-items: center; gap: 7px; font-size: 0.8rem; color: var(--text); }
  .check input { width: auto; }

  .go-btn {
    width: 100%; margin-top: 18px; padding: 13px; border: none; border-radius: 10px;
    background: var(--link); color: #fff; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s;
  }
  .go-btn:hover { opacity: 0.9; }
  .go-btn:disabled { opacity: 0.5; cursor: progress; }

  .status-msg { font-size: 0.78rem; color: var(--tc-muted); margin-top: 10px; text-align: center; min-height: 1em; }
  .status-msg.err { color: #ef4444; }

  /* Save / recall trips toolbar */
  .saved-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--dash-border); }
  .saved-bar select { padding: 7px 10px; border-radius: 8px; border: 1px solid var(--dash-border); background: var(--bg); color: var(--text); font-size: 0.8rem; min-width: 140px; max-width: 100%; }
  .saved-bar button, .saved-import { font-size: 0.74rem; padding: 6px 12px; border-radius: 14px; cursor: pointer; border: 1px solid var(--dash-border); background: var(--dash-card); color: var(--tc-muted); transition: all 0.15s; line-height: 1.2; }
  .saved-bar button:hover, .saved-import:hover { border-color: var(--link); color: var(--link); }
  .saved-import { display: inline-flex; align-items: center; }
  .saved-spacer { flex: 1 1 auto; }
  @media (max-width: 600px) { .saved-spacer { display: none; } .saved-bar select { flex: 1 1 100%; } }

  /* Self-tuning (log actual result) */
  .tune-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
  .tune-row .field { flex: 1 1 120px; min-width: 0; gap: 5px; }
  .tune-row .field input { padding: 9px 11px; border-radius: 8px; border: 1px solid var(--dash-border); background: var(--bg); color: var(--text); font-size: 0.85rem; width: 100%; }
  .tune-save { background: var(--link); border-color: var(--link); color: #fff; cursor: pointer; font-family: inherit; flex: 0 0 auto; }
  .tune-save:hover { background: #4d33b8; }
  .tune-status { font-size: 0.74rem; color: var(--tc-muted); margin-top: 12px; line-height: 1.5; }
  .tune-list { margin-top: 12px; display: flex; flex-direction: column; }
  .tune-list-head { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--tc-muted); font-weight: 700; margin-bottom: 4px; }
  .tune-rec { display: flex; gap: 10px; align-items: center; font-size: 0.74rem; color: var(--text); padding: 5px 0; border-top: 1px solid var(--dash-border); }
  .tune-rec > span:first-child { flex: 0 0 5.5rem; color: var(--tc-muted); }
  .tune-rec > span:nth-child(2) { color: var(--tc-muted); }
  .tune-ratio { margin-left: auto; font-weight: 700; font-variant-numeric: tabular-nums; }
  .tune-ratio.pos { color: #16a34a; }
  .tune-ratio.neg { color: #d97706; }
  .tune-del { border: none; background: none; color: var(--tc-muted); cursor: pointer; font-size: 1.05rem; line-height: 1; padding: 0 2px; }
  .tune-del:hover { color: #ef4444; }

  /* Results */
  #results { display: none; }
  .result-hero { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
  .hero-stat { flex: 1; min-width: 130px; background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 12px; padding: 16px; text-align: center; }
  .hero-stat .big { font-size: 1.7rem; font-weight: 800; line-height: 1.1; }
  .hero-stat .lbl { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--tc-muted); margin-top: 4px; }
  .hero-stat .sub { font-size: 0.7rem; color: var(--tc-muted); margin-top: 3px; }

  /* Departure → arrival estimate */
  .eta-banner { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: var(--text);
    background: rgba(93,63,211,0.08); border: 1px solid rgba(93,63,211,0.35); border-radius: 12px;
    padding: 12px 16px; margin-bottom: 18px; }
  .eta-ico { font-size: 1.4rem; line-height: 1; }
  .eta-text b { font-weight: 800; }
  .eta-sub { display: block; font-size: 0.7rem; color: var(--tc-muted); margin-top: 3px; }

  /* Route options */
  .routes-title { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--tc-muted); font-weight: 700; margin-bottom: 8px; }
  .routes-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
  .route-card {
    flex: 1; min-width: 140px; text-align: left; cursor: pointer; font-family: inherit;
    background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 12px;
    padding: 12px 14px; transition: all 0.15s; color: var(--text);
  }
  .route-card:hover { border-color: var(--link); }
  .route-card.sel { border-color: var(--link); box-shadow: inset 0 0 0 1px var(--link); background: rgba(93,63,211,0.06); }
  .route-card .rc-top { font-size: 1.05rem; font-weight: 700; }
  .route-card .rc-dim { color: var(--tc-muted); font-weight: 400; font-size: 0.8rem; }
  .route-card .rc-energy { font-size: 0.8rem; color: var(--link); font-weight: 600; margin-top: 3px; }
  .route-card .rc-tags { margin-top: 7px; display: flex; gap: 5px; flex-wrap: wrap; }
  .rtag { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; padding: 2px 7px; border-radius: 10px; background: var(--dash-border); color: var(--tc-muted); }
  .rtag.eff { background: #22c55e22; color: #16a34a; }
  .route-card .rc-role { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }
  .rc-role-quickest { color: #2563eb; }
  .rc-role-efficient { color: #16a34a; }
  .rc-role-scenic { color: #b45309; }
  .ors-save { padding: 0 14px; border: 1px solid var(--link); background: var(--link); color: #fff; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.85rem; }
  .ors-save:hover { filter: brightness(1.07); }
  /* Collapsed "key saved" confirmation (key itself stays hidden) */
  .ors-saved { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; min-height: 38px; }
  .ors-on { font-size: 0.82rem; font-weight: 700; color: #16a34a; white-space: nowrap; }
  .ors-link { background: none; border: none; padding: 0; font: inherit; font-size: 0.74rem; font-weight: 600; color: var(--link); cursor: pointer; text-decoration: underline; }
  .ors-link.ors-remove { color: var(--tc-muted); }
  .ors-link:hover { filter: brightness(1.15); }

  .fleet-note { font-size: 0.74rem; color: var(--text); background: #3b82f614; border: 1px solid #3b82f640; border-radius: 10px; padding: 10px 14px; margin-bottom: 18px; }

  /* Road-Trips-style stat grid (matches charging-analytics.md) */
  .summary-card { padding: 16px 18px; }
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px; }
  .summary-grid > div { text-align: center; }
  .sg-lbl { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--tc-muted); margin-bottom: 3px; }
  .sg-val { font-weight: 800; font-size: 1rem; }
  .sg-green { color: #2ecc71; }
  .sg-amber { color: #f39c12; }
  /* cost-breakdown caption under the stat grid (e.g. "$29 home + $17 DCFC") */
  .sg-costnote { text-align: center; font-size: 0.7rem; color: var(--tc-muted); margin-top: 12px; }
  .sg-costnote b { color: var(--text); font-weight: 600; }
  /* Charging stops */
  .stop { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--dash-border); }
  .stop:last-child { border-bottom: none; }
  .stop-num { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: var(--link); color: #fff; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .stop-main { flex: 1; min-width: 0; }
  .stop-name { font-weight: 600; font-size: 0.9rem; }
  .stop-sub { font-size: 0.72rem; color: var(--tc-muted); margin-top: 1px; }
  .stop-charge { font-size: 0.8rem; margin-top: 5px; }
  .stop-charge b { color: var(--link); }
  /* Address + map deep-links under each suggested DC fast stop */
  .stop-links { margin-top: 6px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 0.72rem; }
  .stop-addr { color: var(--tc-muted); }
  .stop-links a { color: var(--link); text-decoration: none; font-weight: 600; border: 1px solid var(--dash-border); border-radius: 999px; padding: 2px 9px; transition: all 0.15s; }
  .stop-links a:hover { border-color: var(--link); background: rgba(93,63,211,0.08); }
  /* Hand-off to a phone maps app */
  .export-btns { display: flex; flex-wrap: wrap; gap: 10px; }
  .export-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 700;
    text-decoration: none; padding: 9px 16px; border-radius: 10px; border: 1px solid var(--dash-border); transition: all 0.15s; }
  .export-btn.gmaps { background: #1a73e8; border-color: #1a73e8; color: #fff; }
  .export-btn.gmaps:hover { background: #1666cf; }
  .export-btn.amaps { background: var(--dash-card); color: var(--text); }
  .export-btn.amaps:hover { border-color: var(--link); background: rgba(93,63,211,0.06); }
  .export-btn.tlog { background: var(--link); border-color: var(--link); color: #fff; cursor: pointer; font-family: inherit; }
  .export-btn.tlog:hover { background: #4d33b8; }
  .export-btn.cheat { background: #0f766e; border-color: #0f766e; color: #fff; cursor: pointer; font-family: inherit; }
  .export-btn.cheat:hover { background: #0c5e57; }
  .export-note { font-size: 0.7rem; color: var(--tc-muted); margin-top: 10px; line-height: 1.5; }
  .net-badge { display: inline-block; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; padding: 2px 7px; border-radius: 10px; margin-left: 6px; vertical-align: middle; }
  .net-tesla { background: #e8222220; color: #e82222; }
  .net-ea    { background: #00b04f20; color: #00963f; }
  .net-cp    { background: #f9731620; color: #f97316; }
  .net-other { background: #6b728020; color: #6b7280; }
  .stops-summary { font-size: 0.78rem; color: var(--tc-muted); margin: 6px 0 14px; }
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
  .breakdown .factor-src { font-size: 0.62rem; color: var(--tc-muted); display: block; margin-top: 1px; }
  .src-data  { color: #22c55e; }
  .src-model { color: #eab308; }

  .soc-bar-wrap { margin-top: 4px; }
  .soc-bar { height: 22px; border-radius: 6px; background: var(--dash-border); overflow: hidden; position: relative; display: flex; }
  .soc-fill { background: linear-gradient(90deg, #22c55e, #16a34a); transition: width 0.4s; }
  .soc-used { background: repeating-linear-gradient(45deg, #ef444455, #ef444455 6px, transparent 6px, transparent 12px); }
  .soc-labels { display: flex; justify-content: space-between; font-size: 0.62rem; color: var(--tc-muted); margin-top: 4px; }

  .disclaimer { font-size: 0.66rem; color: var(--tc-muted); line-height: 1.5; margin-top: 6px; }
  .disclaimer b { color: var(--text); }

  .dev-banner { font-size: 0.76rem; background: #eab30818; border: 1px solid #eab30855; color: var(--text); border-radius: 10px; padding: 10px 14px; margin-bottom: 18px; line-height: 1.45; }
  .dev-banner b { color: #b45309; }

  /* Long third-party strings (place names, addresses) must wrap, never widen the page */
  .stop-name, .stop-sub, .stop-addr, .eta-text, .verdict, .status-msg,
  .export-note, .sg-costnote, .breakdown td:first-child { overflow-wrap: anywhere; }

  /* ── In-app printable trip log ──
     Full-screen in-app sheet (replaces window.open) so it works inside an installed
     Home-Screen app, where a new tab drops you into Safari with no way back to the
     planner. Print / Save-as-PDF still works via the @media print block below. */
  .tlog-overlay { position: fixed; inset: 0; z-index: 4000; background: #fff; color: #111;
    display: flex; flex-direction: column; overscroll-behavior: contain; }
  .tlog-overlay[hidden] { display: none; }
  body.tlog-open { overflow: hidden; }
  .tlog-bar { flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between;
    gap: 10px; padding: calc(env(safe-area-inset-top, 0px) + 10px) 14px 10px;
    background: #f5f5f7; border-bottom: 1px solid #d0d0d5; }
  .tlog-bar button { font-family: inherit; font-size: 0.95rem; font-weight: 700; padding: 9px 14px;
    border-radius: 9px; cursor: pointer; border: 1px solid transparent; }
  .tlog-back { background: #fff; border-color: #c4c4cc; color: #1a1a1a; }
  .tlog-print { background: #1a73e8; color: #fff; }
  .tlog-sheet { flex: 1 1 auto; overflow: auto; -webkit-overflow-scrolling: touch; width: 100%;
    max-width: 820px; margin: 0 auto;
    padding: 16px calc(env(safe-area-inset-right, 0px) + 16px)
             calc(env(safe-area-inset-bottom, 0px) + 28px)
             calc(env(safe-area-inset-left, 0px) + 16px); }
  .tlog-sheet, .tlog-sheet * { box-sizing: border-box; }
  .tlog-sheet h1 { font-size: 20px; margin: 0; }
  .tlog-sheet h2 { font-size: 13px; margin: 18px 0 4px; border-bottom: 2px solid #111; padding-bottom: 2px; }
  .tlog-sheet .sub { color: #444; margin-top: 2px; font-size: 12px; }
  .tlog-sheet .route { font-weight: 600; margin-top: 5px; font-size: 13px; }
  .tlog-sheet .kv { display: grid; grid-template-columns: 1fr 1fr; gap: 0 28px; margin-top: 10px; font-size: 12px; }
  .tlog-sheet .kv > div { display: flex; justify-content: space-between; gap: 10px; border-bottom: 1px dotted #bbb; padding: 3px 0; }
  .tlog-sheet .kv span { color: #555; }
  .tlog-sheet .boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
  .tlog-sheet .box { border: 1px solid #888; border-radius: 6px; padding: 8px 10px; font-size: 12px; }
  .tlog-sheet .bx-t { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px; }
  .tlog-sheet .line { padding: 5px 0; }
  .tlog-sheet .blank { display: inline-block; border-bottom: 1px solid #111; min-width: 120px; }
  .tlog-sheet .blank.short { min-width: 60px; }
  .tlog-tablewrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin-top: 6px; }
  .tlog-sheet table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .tlog-sheet th, .tlog-sheet td { border: 1px solid #999; padding: 5px 6px; text-align: left; vertical-align: top; }
  .tlog-sheet th { background: #eee; font-size: 9.5px; text-transform: uppercase; letter-spacing: .03em; }
  .tlog-sheet td.fill { height: 30px; min-width: 54px; }
  .tlog-sheet .cname { font-weight: 600; }
  .tlog-sheet .plan, .tlog-sheet .addr { color: #555; font-size: 10px; margin-top: 1px; }
  .tlog-sheet tr.divider td { background: #f3f3f3; font-style: italic; font-size: 10px; }
  .tlog-sheet .notes { border: 1px solid #888; border-radius: 6px; height: 150px; margin-top: 4px;
    background-image: repeating-linear-gradient(#fff, #fff 27px, #ddd 28px); }
  .tlog-sheet .foot { margin-top: 14px; color: #777; font-size: 9.5px; text-align: center; }

  /* ── Co-driver "cheat sheet" — plain-language guidance, shares the .tlog-sheet shell ── */
  .tlog-sheet .cheat-bottom { border: 2px solid #111; border-radius: 8px; padding: 12px 14px; margin-top: 12px;
    font-size: 14px; line-height: 1.5; background: #f7f7f9; }
  .tlog-sheet .cheat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 22px; margin-top: 6px; font-size: 13px; }
  .tlog-sheet .cheat-grid > div { border-bottom: 1px dotted #bbb; padding: 4px 0; }
  .tlog-sheet .cheat-stop { border: 1px solid #999; border-radius: 8px; padding: 10px 12px; margin-top: 10px; }
  .tlog-sheet .cs-head { font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .tlog-sheet .cheat-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em;
    border-radius: 999px; padding: 2px 9px; white-space: nowrap; }
  .tlog-sheet .cheat-badge.fast { background: #fde2e2; color: #b42318; }
  .tlog-sheet .cheat-badge.slow { background: #def7ec; color: #03543f; }
  .tlog-sheet .cs-where { color: #444; font-size: 12px; margin-top: 3px; }
  .tlog-sheet .cs-do { margin-top: 7px; font-size: 13px; line-height: 1.45; }
  .tlog-sheet .cs-how { margin-top: 7px; font-size: 12px; line-height: 1.45; background: #f1f5f9; border-radius: 6px; padding: 7px 9px; }
  .tlog-sheet .cs-links { margin-top: 7px; font-size: 12px; }
  .tlog-sheet .cs-links a { color: #1a4fd6; text-decoration: none; margin-right: 16px; white-space: nowrap; }
  .tlog-sheet .cheat-basics { border: 1px solid #888; border-radius: 8px; padding: 6px 12px 4px; margin-top: 6px; font-size: 12px; }
  .tlog-sheet .cheat-basics ul { margin: 6px 0 4px; padding-left: 18px; }
  .tlog-sheet .cheat-basics li { margin: 0 0 6px 0; line-height: 1.45; }
  .tlog-sheet .cheat-call { margin-top: 12px; font-size: 13px; border: 1px dashed #888; border-radius: 8px; padding: 11px 13px; }
  .tlog-sheet .cheat-call .blank { display: inline-block; border-bottom: 1px solid #111; min-width: 190px; }

  @media (max-width: 600px) {
    .field-grid { grid-template-columns: 1fr; }
    .hero-stat .big { font-size: 1.4rem; }
    /* keep the option rows from ever exceeding the screen width on phones */
    .opt-row { gap: 12px; }
    .opt-row > .field, .opt-row > div { flex: 1 1 100%; min-width: 0; }
    .tlog-sheet .kv, .tlog-sheet .boxes, .tlog-sheet .cheat-grid { grid-template-columns: 1fr; }
  }

  @media print {
    @page { size: letter; margin: 0.5in; }
    body.tlog-open > *:not(.tlog-overlay) { display: none !important; }
    body.tlog-open .tlog-overlay { position: static; }
    body.tlog-open .tlog-bar { display: none !important; }
    body.tlog-open .tlog-sheet { overflow: visible; max-width: none; padding: 0; margin: 0; }
    body.tlog-open .tlog-tablewrap { overflow: visible; }
    /* Keep logical blocks from being split across a page boundary. */
    body.tlog-open .tlog-sheet h1, body.tlog-open .tlog-sheet h2,
    body.tlog-open .tlog-sheet .cs-head { break-after: avoid; page-break-after: avoid; }
    body.tlog-open .tlog-sheet .box, body.tlog-open .tlog-sheet .boxes,
    body.tlog-open .tlog-sheet .kv, body.tlog-open .tlog-sheet .notes,
    body.tlog-open .tlog-sheet tr, body.tlog-open .tlog-sheet .cheat-bottom,
    body.tlog-open .tlog-sheet .cheat-grid, body.tlog-open .tlog-sheet .cheat-stop,
    body.tlog-open .tlog-sheet .cheat-basics, body.tlog-open .tlog-sheet .cheat-call {
      break-inside: avoid; page-break-inside: avoid; }
    body.tlog-open .tlog-sheet thead { display: table-header-group; }
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
      <div class="field dep-field">
        <label>Departure</label>
        <div class="dep-row">
          <input id="depDate" type="date" class="dep-date" title="Departure date">
          <input id="depTime" type="time" step="300" title="Departure time (24-hour clock)" class="dep-time">
        </div>
        <div class="dep-row">
          <label for="arriveByTime" class="dep-arrive-lbl">…or arrive by</label>
          <input id="arriveByTime" type="time" step="300" title="Target arrival (24h) — shows your latest departure time" class="dep-time">
        </div>
        <span class="hint">Set a departure time for an arrival estimate, or an “arrive by” time for a leave-by time</span>
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
        <label class="check" id="destChargeWrap" style="display:none"><input type="checkbox" id="canChargeDest" onchange="onRoundTripToggle()"> Can charge at destination</label>
        <label class="check" id="destRateWrap" style="display:none;gap:4px"><small style="color:var(--tc-muted)">$</small><input id="destRate" type="number" min="0" step="0.01" style="width:64px"><small style="color:var(--tc-muted)">/kWh at destination</small></label>
      </div>
    </div>

    <div class="opt-row">
      <div class="field" style="flex:1;min-width:240px">
        <label>Route alternatives <span style="font-weight:400;text-transform:none">(optional)</span></label>
        <div id="orsKeyBox"></div>
      </div>
    </div>

    <div class="saved-bar">
      <select id="savedTripSel" title="Your saved trips"><option value="">Saved trips…</option></select>
      <button type="button" onclick="loadSelectedTrip()" title="Load the selected saved trip">Load</button>
      <button type="button" onclick="deleteSelectedTrip()" title="Delete the selected saved trip">Delete</button>
      <span class="saved-spacer"></span>
      <button type="button" onclick="saveTripPrompt()" title="Save the current trip in this browser">💾 Save</button>
      <button type="button" onclick="exportTripFile()" title="Save / share this trip as a .md file">⬇ Export .md</button>
      <label class="saved-import" title="Load a trip from a .md file">⬆ Import<input type="file" accept=".md,.json,text/markdown,application/json" onchange="importTripFile(this)" hidden></label>
    </div>

    <button class="go-btn" id="goBtn" onclick="planTrip()">Estimate trip ⚡</button>
    <div class="status-msg" id="status"></div>
  </div>

  <div id="results">
    <!-- Headline answer first: the verdict, a data caveat if relevant, then the key numbers. -->
    <div class="verdict" id="verdict"></div>
    <div class="fleet-note" id="fleetNote" style="display:none"></div>

    <div class="result-hero">
      <div class="hero-stat"><div class="big" id="rDist">–</div><div class="lbl">Distance</div><div class="sub" id="rDistSub"></div></div>
      <div class="hero-stat"><div class="big" id="rEnergy">–</div><div class="lbl">Energy needed</div><div class="sub" id="rEnergySub"></div></div>
      <div class="hero-stat"><div class="big" id="rEff">–</div><div class="lbl">Est. efficiency</div><div class="sub" id="rEffSub"></div></div>
      <div class="hero-stat"><div class="big" id="rTemp">–</div><div class="lbl">Trip temp</div><div class="sub" id="rTempSub"></div></div>
    </div>

    <!-- The route: pick an alternative, see it drawn, then the timing. The map sits
         high, right under the headline stats; routeOptions is empty without an
         openrouteservice key, so the map stays directly under the stats in that case. -->
    <div id="routeOptions"></div>
    <div id="map"></div>

    <div class="eta-banner" id="etaBanner" style="display:none"></div>

    <!-- The charging plan: the battery arc across the trip, then the stop-by-stop detail. -->
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

    <!-- Bottom line: cost and gas comparison for the whole trip. -->
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
      <div class="sg-costnote" id="sgCostNote"></div>
    </div>

    <!-- Act on it: send the route to a maps app, then printable sheets. -->
    <div class="trip-card" id="exportCard" style="display:none">
      <h4 style="margin:0 0 10px 0;font-size:0.9rem;">📲 Send route to your maps app</h4>
      <div class="export-btns" id="exportBtns"></div>
      <div class="export-note" id="exportNote"></div>
    </div>

    <div class="trip-card" id="logCard" style="display:none">
      <h4 style="margin:0 0 10px 0;font-size:0.9rem;">📝 Printable sheets</h4>
      <div class="export-btns">
        <button type="button" class="export-btn tlog" onclick="printTripLog()">🖨 Trip log (record actuals)</button>
        <button type="button" class="export-btn cheat" onclick="printGuidanceSheet()">🧭 Co-driver cheat sheet</button>
      </div>
      <div class="export-note"><b>Trip log</b> — your plan plus blank fields to record real numbers on the road (odometer &amp; battery % at each stop, leg efficiency, trip totals, notes).<br><b>Co-driver cheat sheet</b> — a simple, plain-language guide for anyone who doesn't usually fast-charge: where to stop, when, and exactly how to charge at each one. Print it or open it on a phone.</div>
    </div>

    <div class="trip-card" id="tuneCard" style="display:none">
      <h4 style="margin:0 0 6px 0;font-size:0.9rem;">🎯 Self-tuning — log your actual result</h4>
      <div class="export-note" style="margin-top:0;margin-bottom:14px">After you drive it, enter the <b>actual miles</b> and <b>kWh used</b>. The model compares that to what it predicted for <b id="tuneVeh">this car</b> and nudges future estimates toward your real-world driving. Stored only in this browser.</div>
      <div class="tune-row">
        <div class="field"><label>Actual miles</label><input id="tuneMiles" type="number" min="0" step="1" inputmode="decimal" placeholder="actual"></div>
        <div class="field"><label>Actual kWh used</label><input id="tuneKwh" type="number" min="0" step="0.1" inputmode="decimal" placeholder="actual"></div>
        <button type="button" class="export-btn tune-save" onclick="logActualResult()">Save result</button>
      </div>
      <div class="tune-status" id="tuneStatus"></div>
      <div class="tune-list" id="tuneList"></div>
    </div>

    <div class="trip-card breakdown">
      <h4>How this estimate was built</h4>
      <table>
        <tr><td>Base efficiency <span class="factor-src src-data">✓ from your sessions</span></td><td id="bBase"></td></tr>
        <tr><td>Temperature adjustment <span class="factor-src src-model">≈ EV temp curve, anchored to your data</span></td><td id="bTemp"></td></tr>
        <tr><td>Road-type adjustment <span class="factor-src src-model">≈ physics estimate</span></td><td id="bRoad"></td></tr>
        <tr id="bWxRow" style="display:none"><td>Wind &amp; weather <span class="factor-src src-model">≈ forecast-based penalty</span></td><td id="bWx"></td></tr>
        <tr id="bCalRow" style="display:none"><td>Self-tuning <span class="factor-src src-data">✓ from your logged trips</span></td><td id="bCal"></td></tr>
        <tr id="bElevRow" style="display:none"><td>Elevation <span class="factor-src src-model">≈ physics (m·g·h, partial regen)</span></td><td id="bElev"></td></tr>
        <tr><td>Effective efficiency</td><td id="bEff"></td></tr>
        <tr><td>Usable battery</td><td id="bBatt"></td></tr>
      </table>
      <p class="disclaimer">
        <b>Base efficiency is straight from your data</b> — the median mi/kWh across your real charging sessions, at the temperature they typically happened.
        <b>The temperature adjustment</b> uses a published EV range-vs-temperature curve, anchored to that number — your logged range estimates are too noisy to fit the cold-weather slope directly, so the <i>magnitude</i> is yours and the <i>direction</i> is the curve's.
        <b>Road-type</b> is a physics estimate (aero drag rises with speed²) — your logs don't record driving style.
        <b>Wind &amp; weather</b> adds a forecast-based penalty on days with notable wind (extra aero drag) or rain/snow (wet-road rolling resistance, wipers and lights).
        Routing &amp; geocoding via OpenStreetMap (Nominatim + OSRM) — an optional openrouteservice key adds quickest / most efficient / scenic alternatives; temperature, wind &amp; precipitation via Open-Meteo. Estimates only — your mileage will vary.
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
const MIN_CAL_SAMPLES = 2;  // logged real trips needed before self-tuning kicks in
const CAL_CLAMP = 0.25;     // cap the self-tuning nudge at ±25% (guards fat-finger entries)

// SE-Michigan monthly avg temp (°F) — last-resort fallback for temperature
const MI_MONTHLY_F = [26,29,38,49,60,70,75,73,65,53,41,31];

// Canonical EV efficiency vs ambient temp, relative to ~70°F peak (=1.00).
// Shape from published EV range-vs-temperature studies (Geotab/Recurrent).
const TEMP_CURVE = [[0,0.62],[20,0.72],[32,0.78],[50,0.90],[65,0.99],[72,1.00],[86,0.95],[100,0.88]];
// Road-type / speed multiplier relative to ~40 mph mixed driving (=1.00).
const SPEED_CURVE = [[20,1.10],[30,1.06],[40,1.00],[50,0.95],[60,0.89],[70,0.83],[80,0.78]];

// Wind & precipitation penalties (heuristic, applied ON TOP of the temp curve).
// Wind: aero drag rises with air speed²; with the trip direction unknown the
// EXPECTED extra drag over a leg ≈ ½·(wind/cruise)² of aero's share of energy —
// so a stiff wind costs a few %, a gale more (capped). Precip: wet/snow roads
// raise rolling resistance and you run wipers, lights and defrost.
const WIND_AERO_SHARE = 0.55;  // aero's share of highway energy at the ref speed
const WIND_REF_MPH    = 65;    // reference cruising speed that share is gauged at
const WIND_CAP        = 0.12;  // cap the wind penalty at 12%
const RAIN_MM_MIN     = 2;     // ≥ this much daily precip → treat as a wet drive
const SNOW_CM_MIN     = 1;     // ≥ this much daily snowfall → snow/slush penalty
const RAIN_PENALTY    = 0.05;  // wet roads + wipers / lights
const SNOW_PENALTY    = 0.10;  // snow/slush rolling resistance (beyond ambient cold)

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
//  SELF-TUNING — close the loop with your real results
//  After a trip you log the ACTUAL miles + kWh used. We compare that to what the
//  RAW (un-tuned) model predicted for that car and store the ratio. The median
//  ratio per vehicle becomes a calibration multiplier on future model estimates,
//  so the tool learns your real-world driving over time. Comparing against the
//  RAW model (not the already-tuned number) keeps it idempotent and stable.
//  Stored only in this browser (localStorage 'evTuning'); never leaves the device.
// ============================================================
const TUNE_KEY = 'evTuning';
function getTuningLog(){ try { return JSON.parse(localStorage.getItem(TUNE_KEY) || '[]'); } catch(e){ return []; } }
function setTuningLog(arr){ try { localStorage.setItem(TUNE_KEY, JSON.stringify(arr)); } catch(e){} }

// Per-vehicle calibration multiplier from your logged actual-vs-model ratios.
// Returns { mult, n }; mult === 1 (no change) until you've logged MIN_CAL_SAMPLES.
function vehicleCalibration(veh){
  const recs = getTuningLog().filter(r => r.veh === veh && r.ratio > 0);
  if (recs.length < MIN_CAL_SAMPLES) return { mult: 1, n: recs.length };
  let m = median(recs.map(r => r.ratio)) || 1;
  m = Math.max(1 - CAL_CLAMP, Math.min(1 + CAL_CLAMP, m));   // clamp to ±CAL_CLAMP
  return { mult: m, n: recs.length };
}

// Record one completed trip's actuals and re-tune. Pulls the model context from
// the last estimate shown (LAST_EST) so the ratio is against the raw prediction.
function logActualResult(){
  if (!LAST_EST){ setStatus('Estimate a trip first, then log what actually happened.', true); return; }
  const milesEl = document.getElementById('tuneMiles'), kwhEl = document.getElementById('tuneKwh');
  const miles = parseFloat(milesEl.value) || LAST_EST.miles;   // blank miles → the estimated distance
  const kwh = parseFloat(kwhEl.value);
  if (!(kwh > 0)){ setStatus('Enter the actual kWh you used for this trip.', true); return; }
  if (!(miles > 0)){ setStatus('Enter the actual miles you drove.', true); return; }
  const actualEff = miles / kwh;
  if (actualEff < 0.5 || actualEff > 8){
    setStatus(`That works out to ${actualEff.toFixed(1)} mi/kWh — double-check the miles and kWh.`, true); return;
  }
  const rec = {
    veh: LAST_EST.veh, date: new Date().toISOString().slice(0, 10),
    miles: +miles.toFixed(1), kwh: +kwh.toFixed(2), actualEff: +actualEff.toFixed(3),
    modelEff: +LAST_EST.rawModelEff.toFixed(3), ratio: +(actualEff / LAST_EST.rawModelEff).toFixed(4),
    tempF: Math.round(LAST_EST.tempF)
  };
  const log = getTuningLog(); log.unshift(rec); setTuningLog(log);
  milesEl.value = ''; kwhEl.value = '';
  const veh = LAST_EST.veh;
  if (STATE) refresh();   // re-estimate with the new calibration + re-render the card
  const cal = vehicleCalibration(veh);
  const tail = cal.n >= MIN_CAL_SAMPLES
    ? ` ${veh} now self-tuned ${(cal.mult-1)*100>=0?'+':''}${((cal.mult-1)*100).toFixed(0)}% from ${cal.n} trips.`
    : ` ${MIN_CAL_SAMPLES - cal.n} more trip${MIN_CAL_SAMPLES-cal.n===1?'':'s'} to start self-tuning.`;
  const sEl = document.getElementById('tuneStatus');
  if (sEl) sEl.textContent = `Logged ${actualEff.toFixed(2)} mi/kWh actual.` + tail;
}

function deleteTuningRecord(i){
  const log = getTuningLog();
  if (i < 0 || i >= log.length) return;
  log.splice(i, 1); setTuningLog(log);
  if (STATE) refresh();   // recompute calibration + re-render
}

// Show + populate the self-tuning card for the current estimate `e`.
function renderTuning(e){
  const card = document.getElementById('tuneCard');
  if (!card) return;
  card.style.display = 'block';
  const veh = e.vehName;
  document.getElementById('tuneVeh').textContent = veh;
  document.getElementById('tuneMiles').placeholder = 'actual — est ' + e.miles.toFixed(0);
  document.getElementById('tuneKwh').placeholder = 'actual — est ' + e.energy.toFixed(1);
  const statusEl = document.getElementById('tuneStatus');
  if (e.calN === 0){
    statusEl.textContent = `No actual results logged for ${veh} yet — after you drive a trip, enter the real miles and kWh to start self-tuning.`;
  } else if (e.calN < MIN_CAL_SAMPLES){
    statusEl.textContent = `${e.calN} result logged for ${veh} — ${MIN_CAL_SAMPLES - e.calN} more and the model begins self-tuning.`;
  } else {
    const pct = (e.calMult - 1) * 100;
    statusEl.textContent = `Self-tuned from ${e.calN} logged trips: ${veh} estimates ${pct>=0?'raised':'lowered'} ${Math.abs(pct).toFixed(0)}% to match your real driving.`;
  }
  const recs = getTuningLog();
  const mine = recs.map((r, i) => ({ r, i })).filter(o => o.r.veh === veh);
  const list = document.getElementById('tuneList');
  list.innerHTML = mine.length
    ? `<div class="tune-list-head">Logged results for ${esc(veh)}</div>` + mine.slice(0, 8).map(o => {
        const pct = (o.r.ratio - 1) * 100;
        return `<div class="tune-rec"><span>${o.r.date}</span>`
          + `<span>${o.r.miles} mi · ${o.r.kwh} kWh</span>`
          + `<span><b>${o.r.actualEff.toFixed(2)}</b> mi/kWh</span>`
          + `<span class="tune-ratio ${pct>=0?'pos':'neg'}" title="vs the raw model that day">${pct>=0?'+':''}${pct.toFixed(0)}%</span>`
          + `<button type="button" class="tune-del" title="Remove this result" onclick="deleteTuningRecord(${o.i})">×</button></div>`;
      }).join('')
    : '';
}

// ============================================================
//  UI setup
//  Defined as a hoisted function and invoked at the END of this script (the
//  initUI() call at the very bottom). Running it last guarantees every
//  top-level `let`/`const` it touches (STOP_UID, TRIPS_KEY, HOME, …) is already
//  initialized — otherwise seeding the first rows hits a temporal-dead-zone
//  ReferenceError that aborts the whole setup (blank form, dead buttons).
// ============================================================
function initUI(){
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
  // Default departure time to 08:00 (24h). Drives the arrival estimate.
  document.getElementById('depTime').value = '08:00';
  // Restore a previously-saved openrouteservice key (unlocks route alternatives).
  // Collapses to a compact "on" chip when a key already exists.
  renderORSKeyUI();
  // Default the destination-charge rate to your average public $/kWh (so a
  // round-trip top-up is billed like a public charger, not free — editable).
  document.getElementById('destRate').value = COST.publicAvg.toFixed(2);
  // Seed the route with a Start and a Destination row, enable drag reordering.
  addStop(); addStop();
  renderStopKinds();
  enableStopDrag();
  renderSavedTrips();
  // Recompute the leave-by time instantly when the "arrive by" target changes
  // (pure local math — no re-plan / network call needed).
  const abEl = document.getElementById('arriveByTime');
  if (abEl) abEl.addEventListener('input', () => { if (LAST_ETA) renderETA(LAST_ETA.plan, LAST_ETA.rt, LAST_ETA.round, LAST_ETA.oneWay); });
}

const HOME = { lat: 42.3714, lon: -83.4702, label: 'Home — Plymouth, MI' };

// ── Reorderable route list (Google-Maps style) ──
// One ordered column of rows: first = start, last = destination, middle = stops.
// Any row can toggle "charge here" (a slider sets the target %, plus an optional
// $/kWh cost — default free — that feeds the trip-cost estimate).
let STOP_UID = 0;
function makeStopRow(addr, charge, cost, opts){
  opts = opts || {};
  const row = document.createElement('div');
  row.className = 'route-row';
  // Give every address field its OWN autofill section so Safari/Chrome offer
  // independent home/work contact autofill on each stop — start AND destination.
  // Without a unique section-* token they're treated as parts of one combined
  // address, so a contact only fills the first (start) field. street-address is
  // the token that triggers the "use a contact's address" suggestion.
  const ac = `section-stop${++STOP_UID} street-address`;
  const powVal = (opts.powerKW != null && opts.powerKW !== '' && +opts.powerKW > 0) ? +opts.powerKW : '';
  row.innerHTML =
      `<span class="rs-handle" title="Drag to reorder">⠿</span>`
    + `<span class="rs-dot"></span>`
    + `<input class="rs-addr" type="text" placeholder="Address or place" autocomplete="${ac}">`
    + `<button type="button" class="rs-btn rs-loc" title="Use my current location">📍</button>`
    + `<button type="button" class="rs-btn rs-home" title="Use home">🏠</button>`
    + `<button type="button" class="rs-btn rs-clock" title="Set a leave date/time (delays arrival)">🕒</button>`
    + `<button type="button" class="rs-btn rs-charge" title="Charge here">⚡</button>`
    + `<button type="button" class="rs-btn rs-del" title="Remove stop">×</button>`
    + `<div class="rs-slider">`
    +   `<div class="rs-sched">`
    +     `<span class="rs-sched-lbl">Leave this stop</span>`
    +     `<input class="rs-dep-date" type="date">`
    +     `<input class="rs-dep-time" type="time">`
    +     `<span class="rs-dwell"></span>`
    +   `</div>`
    +   `<div class="rs-chg">`
    +     `<div class="rs-mode"><button type="button" class="rs-mode-btn rs-mode-pct" title="Set the target charge level">Charge to %</button>`
    +       `<button type="button" class="rs-mode-btn rs-mode-pow" title="Compute the charge from power × time parked here">From time here</button></div>`
    +     `<div class="rs-pctwrap"><input type="range" min="50" max="100" step="5" value="${charge||80}"><span class="rs-pct"></span></div>`
    +     `<div class="rs-powwrap"><input class="rs-power" type="number" min="0" step="1" placeholder="kW" value="${powVal}"><small style="color:var(--tc-muted)">kW</small><span class="rs-pow-out"></span></div>`
    +     `<label class="rs-cost" title="Cost to charge at this stop ($/kWh) — default free"><small>$</small><input class="rs-cost-input" type="number" min="0" step="0.01" value="${cost!=null?cost:0}"><small>/kWh</small></label>`
    +   `</div>`
    + `</div>`;
  row.querySelector('.rs-addr').value = addr || '';
  const range = row.querySelector('input[type=range]'), pct = row.querySelector('.rs-pct');
  const updatePct = () => {
    pct.innerHTML = `${range.value}% <small>charge here</small>`;
    // Keep the WebKit track fill aligned with the thumb (track-relative %).
    const f = (range.value - range.min) / (range.max - range.min) * 100;
    range.style.setProperty('--fill', f + '%');
  };
  updatePct();
  // Restore saved state: charge target, leave date/time, charging power, and an
  // explicit charge-mode override (otherwise the mode is auto-chosen — see below).
  if (charge != null) row.classList.add('charging');
  if (opts.depDate) row.querySelector('.rs-dep-date').value = opts.depDate;
  if (opts.depTime) row.querySelector('.rs-dep-time').value = opts.depTime;
  if (opts.depDate || opts.depTime || opts.scheduled) row.classList.add('scheduled');
  if (opts.chargeMode === 'pct' || opts.chargeMode === 'power') row.dataset.modeSet = opts.chargeMode;
  // ⚡ toggles charging; 🕒 toggles a scheduled leave time (which on its own just
  // delays arrival — a waypoint with a dwell but no charge).
  row.querySelector('.rs-charge').onclick = () => { row.classList.toggle('charging'); updateStopUI(row); syncCharges(); };
  row.querySelector('.rs-clock').onclick  = () => { row.classList.toggle('scheduled'); updateStopUI(row); syncCharges(); };
  // Charge-mode toggle. "From time here" also reveals the leave-time row, since
  // power-based charging needs an arrival (calculated) and a departure (entered).
  row.querySelector('.rs-mode-pct').onclick = () => { row.dataset.modeSet = 'pct'; updateStopUI(row); syncCharges(); };
  row.querySelector('.rs-mode-pow').onclick = () => { row.dataset.modeSet = 'power'; row.classList.add('scheduled'); updateStopUI(row); syncCharges(); };
  range.oninput = updatePct;
  range.onchange = syncCharges;
  // Optional per-stop charging cost ($/kWh) — re-cost the trip when it changes.
  row.querySelector('.rs-cost-input').onchange = syncCharges;
  // Leave date/time + charging power feed the timeline; live-update on change.
  row.querySelector('.rs-dep-date').onchange = () => { updateStopUI(row); syncCharges(); };
  row.querySelector('.rs-dep-time').onchange = () => { updateStopUI(row); syncCharges(); };
  row.querySelector('.rs-power').oninput = () => updateStopUI(row);
  row.querySelector('.rs-power').onchange = () => { updateStopUI(row); syncCharges(); };
  row.querySelector('.rs-home').onclick = () => { const i = row.querySelector('.rs-addr'); i.value = HOME.label; i.dataset.home = '1'; delete i.dataset.lat; delete i.dataset.lon; };
  row.querySelector('.rs-loc').onclick = () => useCurrentLocation(row);
  row.querySelector('.rs-del').onclick = () => { row.remove(); renderStopKinds(); };
  // Typing a real address invalidates a "home" or GPS pin so the text re-geocodes.
  row.querySelector('.rs-addr').addEventListener('input', e => { delete e.target.dataset.home; delete e.target.dataset.lat; delete e.target.dataset.lon; });
  row.querySelector('.rs-addr').addEventListener('keydown', e => { if (e.key === 'Enter') planTrip(); });
  updateStopUI(row);
  return row;
}
// The effective charge mode for a stop: 'pct' (slider target) or 'power' (kW ×
// dwell). An explicit per-stop toggle wins; otherwise auto-use power once BOTH a
// charging power and a leave time are set (so the calculated charge is possible).
function stopEffectiveMode(row){
  const powEl = row.querySelector('.rs-power');
  const powerKW = parseFloat(powEl ? powEl.value : '') || 0;
  const dd = row.querySelector('.rs-dep-date'), dt = row.querySelector('.rs-dep-time');
  const hasTime = !!(dd && dd.value && dt && dt.value);
  const override = row.dataset.modeSet;
  if (override === 'power') return powerKW > 0 ? 'power' : 'pct';
  if (override === 'pct') return 'pct';
  return (powerKW > 0 && hasTime) ? 'power' : 'pct';
}
// Sync a stop row's panel to its current toggles: show the panel when charging OR
// scheduled, switch the charge sub-row between slider and power inputs, light the
// active mode button, and refresh the leave-time / power hints.
function updateStopUI(row){
  const charging = row.classList.contains('charging');
  const scheduled = row.classList.contains('scheduled');
  row.querySelector('.rs-charge').classList.toggle('on', charging);
  row.querySelector('.rs-clock').classList.toggle('on', scheduled);
  const slider = row.querySelector('.rs-slider');
  if (slider) slider.classList.toggle('show', charging || scheduled);
  const mode = stopEffectiveMode(row);
  row.classList.toggle('powmode', charging && mode === 'power');
  const bPct = row.querySelector('.rs-mode-pct'), bPow = row.querySelector('.rs-mode-pow');
  if (bPct) bPct.classList.toggle('on', mode === 'pct');
  if (bPow) bPow.classList.toggle('on', mode === 'power');
  const dd = row.querySelector('.rs-dep-date'), dt = row.querySelector('.rs-dep-time');
  const dwellEl = row.querySelector('.rs-dwell');
  if (dwellEl){
    if (dd && dd.value && dt && dt.value){
      const d = new Date(`${dd.value}T${dt.value}`);
      dwellEl.textContent = isNaN(d.getTime()) ? '' : '→ leave ' + d.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric' }) + ' ' + dt.value;
    } else if (dt && dt.value){
      dwellEl.textContent = '→ leave ' + dt.value;
    } else {
      dwellEl.textContent = 'optional — delays arrival';
    }
  }
  const powEl = row.querySelector('.rs-power'), powOut = row.querySelector('.rs-pow-out');
  if (powOut){
    const kw = parseFloat(powEl ? powEl.value : '') || 0;
    const hasTime = !!(dd && dd.value && dt && dt.value);
    powOut.textContent = kw > 0 ? (hasTime ? '· fills from arrival to leave time' : '· add a leave time to compute charge') : '';
  }
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
    wp.chargeCost = parseFloat(row.querySelector('.rs-cost-input').value) || 0;
    const dd = row.querySelector('.rs-dep-date'), dt = row.querySelector('.rs-dep-time'), pw = row.querySelector('.rs-power');
    wp.depDate = dd ? dd.value : '';
    wp.depTime = dt ? dt.value : '';
    wp.powerKW = parseFloat(pw ? pw.value : '') || 0;
    wp.chargeMode = stopEffectiveMode(row);
  });
  refresh();
}
function addStop(addr, charge, cost){
  const list = document.getElementById('routeStops');
  list.appendChild(makeStopRow(addr, charge, cost));
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
    row.querySelector('.rs-clock').style.display = endpoint ? 'none' : '';
    // Endpoints can't charge or hold a leave-time dwell (the start uses the start
    // %, and a final-destination charge/dwell doesn't affect the plan).
    if (endpoint && (row.classList.contains('charging') || row.classList.contains('scheduled'))){
      row.classList.remove('charging', 'scheduled');
      updateStopUI(row);
    }
    row.classList.toggle('removable', rows.length > 2);
  });
}
function getRouteStops(){
  return [...document.querySelectorAll('#routeStops .route-row')].map(row => {
    const addrEl = row.querySelector('.rs-addr');
    // A GPS pin (from "use my current location") stores exact coords on the input
    // so planning skips geocoding the text; null when the field is a plain address.
    const lat = parseFloat(addrEl.dataset.lat), lon = parseFloat(addrEl.dataset.lon);
    const depDateEl = row.querySelector('.rs-dep-date'), depTimeEl = row.querySelector('.rs-dep-time'), powEl = row.querySelector('.rs-power');
    return {
      addr: addrEl.value.trim(),
      isHome: addrEl.dataset.home === '1',
      lat: isFinite(lat) ? lat : null,
      lon: isFinite(lon) ? lon : null,
      chargeHere: row.classList.contains('charging'),
      chargeTo: +row.querySelector('input[type=range]').value,
      chargeCost: parseFloat(row.querySelector('.rs-cost-input').value) || 0,
      scheduled: row.classList.contains('scheduled'),
      depDate: depDateEl ? depDateEl.value : '',
      depTime: depTimeEl ? depTimeEl.value : '',
      powerKW: parseFloat(powEl ? powEl.value : '') || 0,
      chargeMode: stopEffectiveMode(row)
    };
  });
}
// Lazy-load SortableJS for drag reordering (works on touch too).
function enableStopDrag(){
  const init = () => { if (window.Sortable && !document.getElementById('routeStops')._sortable){
    document.getElementById('routeStops')._sortable = Sortable.create(document.getElementById('routeStops'), {
      handle: '.rs-handle', animation: 150, ghostClass: 'dragging',
      onEnd: (evt) => {
        renderStopKinds();
        // SortableJS fires onEnd even when a row is dropped back in its original
        // slot — don't discard a still-valid plan for a no-op drag.
        if (evt && evt.oldIndex === evt.newIndex) return;
        // A real reorder changes the route itself, so the loaded plan and its
        // waypoint anchors no longer line up with the row order. Invalidate it
        // so live charge-slider syncing can't apply to stale coordinates; the
        // user re-runs Estimate to replan.
        if (STATE){ STATE = null; setStatus('Route order changed — tap “Estimate trip” to replan.'); }
      }
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
async function geocode(q){
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q);
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  const j = await r.json();
  if (!j.length) throw new Error('Could not find "' + q + '"');
  return { lat: +j[0].lat, lon: +j[0].lon, name: j[0].display_name };
}

// Reverse-geocode a coordinate to a human-readable address (same free Nominatim
// service as the forward geocoder). Returns null if nothing sensible comes back.
async function reverseGeocode(lat, lon){
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=${lat}&lon=${lon}`;
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  const j = await r.json();
  return (j && j.display_name) ? j.display_name : null;
}

// Fill a stop row from the device's location via the browser Geolocation API.
// The exact coordinates are pinned on the input's dataset so planning uses them
// directly (no geocoding round-trip); we then try to show a friendly address.
function useCurrentLocation(row){
  const input = row.querySelector('.rs-addr');
  const btn   = row.querySelector('.rs-loc');
  if (!navigator.geolocation){ setStatus('This browser can’t share your location.', true); return; }
  btn.classList.add('locating');
  setStatus('Getting your current location…');
  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    input.dataset.lat = lat; input.dataset.lon = lon;
    delete input.dataset.home;
    input.value = `Current location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    try { const name = await reverseGeocode(lat, lon); if (name) input.value = name; }
    catch(e){ /* keep the coordinate label — planning still uses the exact pin */ }
    btn.classList.remove('locating');
    setStatus('');
  }, err => {
    btn.classList.remove('locating');
    setStatus(err && err.code === err.PERMISSION_DENIED
      ? 'Location permission denied — allow it in your browser settings, or type the address.'
      : 'Couldn’t get your location. Type the address instead.', true);
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
}

// openrouteservice route roles (needs a free key, stored in this browser only).
// Each role is a separate request; we keep whichever succeed and drop near-dupes.
// The public ORS server caps the native `alternative_routes` feature to short
// trips, so we derive distinct routes from preference/avoid options instead.
const ORS_ROLES = [
  { role: 'quickest',  label: 'Quickest',       body: { preference: 'fastest' } },
  { role: 'efficient', label: 'Most efficient', body: { preference: 'shortest' } },
  { role: 'scenic',    label: 'Scenic',         body: { options: { avoid_features: ['highways'] } } },
];
const ROLE_ICON = { quickest: '⏱', efficient: '🍃', scenic: '🌄' };

async function routeORS(points, key){
  const coordinates = points.map(p => [p.lon, p.lat]);
  const out = await Promise.all(ORS_ROLES.map(async r => {
    try {
      const resp = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
        method: 'POST',
        headers: { 'Authorization': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates, instructions: false, ...r.body })
      });
      if (!resp.ok) return null;
      const j = await resp.json();
      const f = (j.features || [])[0];
      if (!f || !f.geometry) return null;
      const s = f.properties.summary || {};
      const segs = f.properties.segments || [];
      const legMiles = [0]; let acc = 0;
      segs.forEach(l => { acc += (l.distance || 0) / 1609.34; legMiles.push(acc); });
      // One segment per leg between input points; fall back to a single leg.
      if (legMiles.length < points.length){ legMiles.length = 0; legMiles.push(0, (s.distance || 0) / 1609.34); }
      return { miles: (s.distance || 0) / 1609.34, hours: (s.duration || 0) / 3600,
               geometry: f.geometry, legMiles, role: r.role, roleLabel: r.label };
    } catch(e){ return null; }
  }));
  // Keep successes in role-priority order, dropping near-identical duplicates
  // (e.g. a short trip where shortest == fastest).
  const uniq = [];
  for (const rt of out){
    if (!rt) continue;
    const dup = uniq.find(u =>
      Math.abs(u.miles - rt.miles) / Math.max(u.miles, 1) < 0.01 &&
      Math.abs(u.hours - rt.hours) / Math.max(u.hours, 0.01) < 0.02);
    if (!dup) uniq.push(rt);
  }
  return uniq;
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
  const num = v => (v != null && isFinite(v)) ? +v : null;
  try {
    // Within forecast/recent window → exact daily forecast (temp + wind + precip)
    if (diffDays >= -60 && diffDays <= 15){
      const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,windspeed_10m_max,precipitation_sum,snowfall_sum&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
      const j = await (await fetch(u)).json();
      const mx = num(j.daily?.temperature_2m_max?.[0]), mn = num(j.daily?.temperature_2m_min?.[0]);
      if (mx != null && mn != null) return { f: (mx + mn) / 2, src: 'forecast',
        windMph: num(j.daily?.windspeed_10m_max?.[0]),
        precipMm: num(j.daily?.precipitation_sum?.[0]) || 0,
        snowCm:  num(j.daily?.snowfall_sum?.[0]) || 0 };
    }
    // Otherwise → climatology from the same calendar date, prior years (archive),
    // averaging temp, wind and precipitation across the years we get back.
    const yr = d.getFullYear();
    const md = dateStr.slice(5);
    const temps = [], winds = [], precips = [], snows = [];
    for (let y = yr - 1; y >= yr - 3; y--){
      const ds = y + '-' + md;
      const u = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${ds}&end_date=${ds}&daily=temperature_2m_mean,windspeed_10m_max,precipitation_sum,snowfall_sum&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto`;
      const j = await (await fetch(u)).json();
      const t = num(j.daily?.temperature_2m_mean?.[0]); if (t != null) temps.push(t);
      const w = num(j.daily?.windspeed_10m_max?.[0]);   if (w != null) winds.push(w);
      const p = num(j.daily?.precipitation_sum?.[0]);   if (p != null) precips.push(p);
      const s = num(j.daily?.snowfall_sum?.[0]);        if (s != null) snows.push(s);
    }
    const avg = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : null;
    if (temps.length) return { f: avg(temps), src: 'historical avg',
      windMph: avg(winds), precipMm: avg(precips) || 0, snowCm: avg(snows) || 0 };
  } catch(e){ /* fall through */ }
  return { f: MI_MONTHLY_F[d.getMonth()], src: 'seasonal est', windMph: null, precipMm: 0, snowCm: 0 };
}

// ============================================================
//  Main flow
// ============================================================
let MAP, ROUTE_LAYER, STATE = null, LAST_ETA = null, LAST_EST = null;
async function planTrip(){
  const btn = document.getElementById('goBtn');
  const stops = getRouteStops().filter(s => s.addr);
  if (stops.length < 2){ setStatus('Enter at least a start and a destination.', true); return; }
  btn.disabled = true;
  try {
    setStatus('Finding locations…');
    const geo = await Promise.all(stops.map(s =>
      (s.lat != null && s.lon != null) ? Promise.resolve({ lat: s.lat, lon: s.lon, name: s.addr || 'Current location' })
      : s.isHome ? Promise.resolve({ lat: HOME.lat, lon: HOME.lon, name: HOME.label })
      : geocode(s.addr)));
    const A = geo[0], B = geo[geo.length - 1];
    // Intermediate stops become waypoints, carrying their "charge here" target
    // and optional $/kWh cost (default free), plus any scheduled leave date/time
    // and charging power used to time the trip / compute an overnight charge.
    const waypoints = [];
    for (let i = 1; i < stops.length - 1; i++){
      waypoints.push({ addr: stops[i].addr, lat: geo[i].lat, lon: geo[i].lon,
        chargeTo: stops[i].chargeHere ? stops[i].chargeTo : NaN,
        chargeCost: stops[i].chargeCost,
        depDate: stops[i].depDate || '', depTime: stops[i].depTime || '',
        powerKW: stops[i].powerKW || 0, chargeMode: stops[i].chargeMode || 'pct' });
    }

    setStatus('Planning route…');
    // With an openrouteservice key, fetch up to three role-based routes
    // (quickest / most efficient / scenic). Otherwise fall back to OSRM.
    const orsKey = getORSKey();
    let routes = null;
    if (orsKey){
      setStatus('Finding route alternatives…');
      try { routes = await routeORS([A, ...waypoints, B], orsKey); } catch(e){ routes = null; }
    }
    if (!routes || !routes.length) routes = await route([A, ...waypoints, B]);

    const mid = { lat: (A.lat + B.lat) / 2, lon: (A.lon + B.lon) / 2 };
    setStatus('Checking the weather…');
    // Guard a cleared date field — an empty/invalid date makes tripTemp fall
    // through to MI_MONTHLY_F[NaN] (undefined) and show NaN°F.
    const depEl = document.getElementById('depDate');
    if (!depEl.value) depEl.value = new Date().toISOString().slice(0,10);
    const temp = await tripTemp(mid.lat, mid.lon, depEl.value);

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
  const wx       = weatherPenalty(temp);           // wind + precipitation multiplier (≤ 1)
  const rawModelEff = tempEff * road.f * wx.mult;  // model prediction BEFORE self-tuning
  const cal      = vehicleCalibration(vehName);    // {mult,n} learned from your logged actuals
  const modelEff = rawModelEff * cal.mult;         // self-tuned to your real-world results
  const ovr      = parseFloat(document.getElementById('effOverride').value);
  const hasOvr   = !isNaN(ovr) && ovr > 0;
  const effEff   = hasOvr ? ovr : modelEff;
  const energy   = miles / effEff;
  return { round, miles, hours: rt.hours * (round ? 2 : 1), vehName, m, batt: m.battery,
           baseEff: m.baseEff, tempEff, tempMult: tempEff / m.baseEff, road, wx,
           rawModelEff, modelEff, calMult: cal.mult, calN: cal.n,
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
    const roleHead = rt.roleLabel
      ? `<div class="rc-role rc-role-${rt.role}">${ROLE_ICON[rt.role] || ''} ${rt.roleLabel}</div>` : '';
    card.innerHTML = roleHead
      + `<div class="rc-top">${e.miles.toFixed(0)} mi <span class="rc-dim">· ${fmtDur(e.hours)}</span></div>`
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

// Combine wind + precipitation into one efficiency multiplier (≤ 1) plus a short
// label. Wind drag scales with air speed²; with trip direction unknown the
// expected extra drag over a leg ≈ ½·(wind/ref)² of aero's energy share. Precip
// adds a flat wet- or snow-road penalty. Returns mult 1 / '' when nothing notable.
function weatherPenalty(temp){
  let windPen = 0;
  if (temp && temp.windMph != null && temp.windMph > 0){
    windPen = Math.min(WIND_CAP, WIND_AERO_SHARE * 0.5 * Math.pow(temp.windMph / WIND_REF_MPH, 2));
  }
  let precipPen = 0, precipKind = '';
  if (temp && temp.snowCm >= SNOW_CM_MIN){ precipPen = SNOW_PENALTY; precipKind = 'snow'; }
  else if (temp && temp.precipMm >= RAIN_MM_MIN){ precipPen = RAIN_PENALTY; precipKind = 'rain'; }
  const mult = (1 - windPen) * (1 - precipPen);
  const parts = [];
  if (windPen > 0.005) parts.push(`${Math.round(temp.windMph)} mph wind`);
  if (precipKind) parts.push(precipKind);
  return { mult, windPen, precipPen, label: parts.join(' · ') };
}

function compute(A, B, rt, temp){
  const e = estimate(rt, temp);
  // Remember this estimate's context so a later "actual result" is compared to
  // what the RAW (un-tuned) model predicted — keeps self-tuning idempotent.
  LAST_EST = { veh: e.vehName, rawModelEff: e.rawModelEff, miles: e.miles, energy: e.energy, tempF: temp.f };

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
  // Wind & precipitation row — shown only when the day's weather actually moves
  // the number (model in use, ≥ ~0.5% penalty).
  const wxRow = document.getElementById('bWxRow');
  if (!e.hasOvr && e.wx && (1 - e.wx.mult) >= 0.005){
    wxRow.style.display = '';
    document.getElementById('bWx').textContent = ((e.wx.mult - 1) * 100).toFixed(0) + '%  · ' + e.wx.label;
  } else {
    wxRow.style.display = 'none';
  }
  // Self-tuning row — shown only when it's actually moving the number (model in
  // use, enough samples, non-trivial nudge).
  const calRow = document.getElementById('bCalRow');
  if (!e.hasOvr && e.calN >= MIN_CAL_SAMPLES && Math.abs(e.calMult - 1) >= 0.005){
    calRow.style.display = '';
    const pct = (e.calMult - 1) * 100;
    document.getElementById('bCal').textContent = (pct>=0?'+':'') + pct.toFixed(0) + '%  (from ' + e.calN + ' logged trips)';
  } else {
    calRow.style.display = 'none';
  }
  document.getElementById('bBatt').textContent = e.batt.toFixed(1) + ' kWh  (' + e.m.battSrc + ')';

  // SoC + verdict
  buildVerdict(e.energy, e.batt, e.effEff);
  renderTuning(e);

  drawMap(A, B, rt.geometry);
  updateChargingPlan(rt, e, temp);
}

// ============================================================
//  CHARGING-STOP PLANNER
//  Data: Open Charge Map (your free key, kept in localStorage).
//  Only DCFC >= 50 kW on your preferred networks are considered.
// ============================================================
const NET_DEFAULT_KW = { 'Tesla': 250, 'Electrify America': 150, 'ChargePoint': 62.5, 'Other': 50 };
const NET_CLASS = { 'Tesla': 'net-tesla', 'Electrify America': 'net-ea', 'ChargePoint': 'net-cp', 'Other': 'net-other' };
const NET_PREF = { 'Tesla': 3, 'Electrify America': 2, 'ChargePoint': 1, 'Other': 0 }; // tie-break order
const MIN_DCFC_KW = 50;

// Friendly, plain-language "how to fast-charge here" notes for the co-driver cheat
// sheet — written for someone who rarely DC fast-charges. Keyed by network; falls
// back to NET_GUIDE_GENERIC. NET_GUIDE_AC covers the slow "charge here" waypoints.
const NET_GUIDE = {
  'Tesla': 'Superchargers need your NACS adapter. Park so the charge port (back driver-side) is near the post, plug the adapter onto the Tesla cable and into the car, then open the Tesla app, pick this location and your stall number, and tap to start. It begins on its own — the car screen shows the percentage.',
  'Electrify America': 'Open the charge door and plug the big CCS connector into the car (push until it clicks). Start it with the Electrify America app — pick your plug number — or tap a credit card on the screen. The screen shows the progress.',
  'ChargePoint': 'Tap your ChargePoint card or the app on the reader, then plug the big CCS connector into the car (push until it clicks). The screen shows the progress.',
};
const NET_GUIDE_GENERIC = 'Open the car\u2019s charge door and plug in the big CCS connector (push until it clicks). Start the session by tapping the network\u2019s app or a credit card on the screen. If it hasn\u2019t started in a minute, there\u2019s a help phone number printed on the charger.';
const NET_GUIDE_AC = 'This is normal, slow charging \u2014 use the cable that came with the car (or one provided). Plug it into the car and the outlet/station, and leave it plugged in the whole time you\u2019re parked. No app or rush needed.';
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

function getORSKey(){ try { return localStorage.getItem('orsKey') || ''; } catch(e){ return ''; } }
// Route-alternatives key UI: once saved it COLLAPSES to a compact "on" confirmation
// (the key stays hidden in localStorage) instead of sitting in a visible field —
// same idea as the Open Charge Map key. Pass editing=true to re-open the input.
function renderORSKeyUI(editing){
  const box = document.getElementById('orsKeyBox');
  if (!box) return;
  const key = getORSKey();
  if (key && !editing){
    box.innerHTML =
        '<div class="ors-saved">'
      +   '<span class="ors-on">✓ Route alternatives on</span>'
      +   '<button type="button" class="ors-link" onclick="editORSKey()">Change</button>'
      +   '<button type="button" class="ors-link ors-remove" onclick="removeORSKey()">Remove</button>'
      + '</div>';
  } else {
    box.innerHTML =
        '<div style="display:flex;gap:6px">'
      +   '<input id="orsKeyInput" type="password" autocomplete="off" placeholder="openrouteservice API key" style="flex:1 1 auto;min-width:0" value="' + esc(key)
      +     '" onkeydown="if(event.key===\'Enter\'){event.preventDefault();saveORSKey();}">'
      +   '<button type="button" class="ors-save" onclick="saveORSKey()">Save</button>'
      + '</div>'
      + '<span class="hint">Free key from <a href="https://openrouteservice.org/dev/#/signup" target="_blank" rel="noopener">openrouteservice.org</a> — adds quickest / most efficient / scenic routes (kept only in this browser)</span>';
    if (editing){ const inp = document.getElementById('orsKeyInput'); if (inp){ inp.focus(); inp.select(); } }
  }
}
function saveORSKey(){
  const el = document.getElementById('orsKeyInput');
  const v = el ? el.value.trim() : '';
  try { localStorage.setItem('orsKey', v); } catch(e){}
  renderORSKeyUI();
  setStatus(v ? 'Route-alternatives key saved (this browser only). Click Estimate to use it.' : 'Route-alternatives key cleared.');
}
function editORSKey(){ renderORSKeyUI(true); }
function removeORSKey(){ try { localStorage.removeItem('orsKey'); } catch(e){} renderORSKeyUI(); setStatus('Route-alternatives key removed.'); }

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

// Does this DC connector set include a CCS (SAE Combo) plug the Mach-E can use?
// OCM ConnectionTypeID 32 = CCS1, 33 = CCS2; Title is the reliable fallback. US
// DC fast is overwhelmingly CCS, so a site whose connectors carry NO recognizable
// type info gets the benefit of the doubt; only an all-CHAdeMO / all-Tesla-
// proprietary site (typed, no CCS) is rejected as incompatible.
function dcHasCCS(conns){
  let sawType = false;
  for (const c of conns){
    const id = c.ConnectionTypeID;
    const t = ((c.ConnectionType && c.ConnectionType.Title) || '').toLowerCase();
    if (id === 32 || id === 33 || t.includes('ccs') || t.includes('combo')) return true;
    if (id != null || t) sawType = true;
  }
  return !sawType;
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
    const matched = matchNetwork(opTitle) || matchNetwork(p.AddressInfo.Title || '');  // fall back to the site name
    const preferred = matched != null;          // Tesla / EA / ChargePoint — have how-tos + rates
    const net = matched || 'Other';
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
    // The Mach-E charges on CCS. EA/ChargePoint (and Tesla via the adapter) are
    // known-compatible; for any OTHER operator only trust it when it actually has
    // a CCS plug, so we never route to a CHAdeMO- or Tesla-proprietary-only site.
    if (!preferred && !dcHasCCS(dc)) return;
    const pr = projectCharger(coords, cum, p.AddressInfo.Latitude, p.AddressInfo.Longitude);
    if (pr.offMi > 8) return; // keep it reasonably close to the route
    out.push({ id: p.ID, name: p.AddressInfo.Title, net, preferred, maxKW,
      town: p.AddressInfo.Town || p.AddressInfo.StateOrProvince || '',
      addr: p.AddressInfo.AddressLine1 || '',
      city: p.AddressInfo.Town || '',
      state: p.AddressInfo.StateOrProvince || '',
      zip: p.AddressInfo.Postcode || '',
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
    // Arrived already at/above the DCFC cap (e.g. only a nearby charger was
    // reachable) → charging here can't add range at this cap. Bail so
    // planSegmentCapped raises the cap (or reports a real gap) instead of
    // recording a negative charge.
    if (target <= arriveSoc){
      return { feasible: false, stops, gapFrom: Math.round(pos), reachMi: Math.round(chargerReach) };
    }
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
      arriveSoc: r.arriveSoc, target: wp.chargeTo, lat: wp.lat, lon: wp.lon,
      addedKWh: Math.max(0, wp.chargeTo - r.arriveSoc) / 100 * nrg.batt, rate: wp.rate || 0,
      depMs: wp.depMs != null ? wp.depMs : null, mode: wp.mode || null, powerKW: wp.powerKW || 0 });
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
// you leave from home) + each DCFC stop at that network's average rate, plus any
// waypoint (e.g. hotel) charges at their own $/kWh — default free.
// Cost / gas report in the same stat-grid format as Road Trips on Analytics.
function renderSummary(plan, energyTrip, fromHome, miles){
  const stops = (plan && plan.stops) || [];
  const dcfc = stops.filter(s => !s.waypoint);
  let dcfcKWh = 0, dcfcCost = 0, dcfcMin = 0;
  dcfc.forEach(s => {
    const r = (COST[s.net] != null) ? COST[s.net] : COST.publicAvg;
    dcfcKWh += s.addedKWh; dcfcCost += s.addedKWh * r; dcfcMin += s.mins || 0;
  });
  // Waypoint charges (hotels, etc.) bill at their own rate — default $0/kWh.
  let wpKWh = 0, wpCost = 0;
  stops.filter(s => s.waypoint).forEach(s => {
    const kwh = s.addedKWh || 0;
    wpKWh += kwh; wpCost += kwh * (s.rate || 0);
  });
  const startKWh  = Math.max(0, energyTrip - dcfcKWh - wpKWh);
  const startRate = fromHome ? COST.home : COST.publicAvg;
  const startCost = startKWh * startRate;
  const total = startCost + dcfcCost + wpCost;
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
  // Breakdown caption: which dollars came from where (only non-zero parts).
  const parts = [];
  if (startCost > 0.005) parts.push(`<b>$${startCost.toFixed(2)}</b> ${fromHome ? 'home' : 'start'} charge`);
  if (dcfcCost  > 0.005) parts.push(`<b>$${dcfcCost.toFixed(2)}</b> DC fast`);
  if (wpCost    > 0.005) parts.push(`<b>$${wpCost.toFixed(2)}</b> stop charging`);
  document.getElementById('sgCostNote').innerHTML = parts.length > 1 ? parts.join(' + ') : '';
}

// Two views of the same trip-time math (one-way driving time + the suggested DC
// fast-charging time; round trips count the OUTBOUND leg only, and AC/hotel
// waypoint charges don't add en-route time):
//   • Departure mode (default): departure date/time → estimated arrival.
//   • "Arrive by" mode: enter a target arrival and it inverts the math to the
//     latest you can leave. Driving time (OSRM) and charging time don't depend
//     on the departure clock, so the leave-by time is exact. Durations are
//     typical free-flow (no live/historical traffic without a keyed routing API).
// Walk the trip clock to get real arrival times, accounting for driving, DC fast
// charging, AND any explicit "leave this stop" departures (an overnight hotel
// charge, a meal stop, etc.). Driving time is spread evenly along the route
// (hours per mile) so a stop's arrival is when you'd reach its mileage. A stop
// with an explicit leave time held later than its arrival adds a dwell (which
// can push the final arrival to the next day). Returns null when no departure
// date is set. Also annotates each plan stop with _arriveMs/_depMs/_dwellH and
// returns a per-mile map so the renderers can show arrive/leave times.
function walkTimeline(plan, rt, round, oneWay){
  const dEl = document.getElementById('depDate'), tEl = document.getElementById('depTime');
  if (!dEl || !dEl.value) return null;
  const startMs = new Date(`${dEl.value}T${tEl && tEl.value ? tEl.value : '08:00'}`).getTime();
  if (isNaN(startMs)) return null;
  const hpm = oneWay > 0 ? rt.hours / oneWay : 0;            // hours per mile (avg)
  const driveMs = mi => hpm * Math.max(0, mi) * 3600000;
  const totalMi = round ? oneWay * 2 : oneWay;

  // Ordered events along the route: DCFC + charging waypoints from the plan, plus
  // any non-charging but TIME-scheduled waypoints (outbound) carried on STATE.
  const events = [];
  ((plan && plan.stops) || []).forEach(s => {
    if (s.alongMi == null) return;
    events.push({ mile: s.alongMi, mins: s.waypoint ? 0 : (s.mins || 0),
      depMs: (s.waypoint && s.depMs != null) ? s.depMs : null, ref: s });
  });
  const seen = new Set(events.map(e => Math.round(e.mile)));
  ((STATE && STATE.waypoints) || []).forEach(w => {
    if (w.alongMi == null || seen.has(Math.round(w.alongMi))) return;
    const dm = (w.depDate && w.depTime) ? new Date(`${w.depDate}T${w.depTime}`).getTime() : null;
    if (dm == null || isNaN(dm)) return;
    events.push({ mile: w.alongMi, mins: 0, depMs: dm, ref: { timeOnly: true, name: w.addr, alongMi: w.alongMi } });
  });
  events.sort((a, b) => a.mile - b.mile);

  let clock = startMs, pos = 0;
  let driveMin = 0, outChargeMin = 0, outDwellMin = 0, totalChargeMin = 0, totalDwellMin = 0, destMs = null;
  const stopTimes = new Map();
  for (const e of events){
    // Capture destination arrival the moment we'd reach mile oneWay (before any
    // return-leg events), so round trips report when you GET there.
    if (destMs == null && e.mile >= oneWay - 0.01) destMs = clock + driveMs(oneWay - pos);
    const dmin = hpm * Math.max(0, e.mile - pos) * 60;
    clock += dmin * 60000; driveMin += dmin;
    const arriveMs = clock;
    let dwellH = 0;
    if (e.depMs != null && e.depMs > arriveMs){ clock = e.depMs; dwellH = (e.depMs - arriveMs) / 3600000; }
    if (e.mins) clock += e.mins * 60000;
    const outbound = e.mile <= oneWay + 0.01;
    if (dwellH > 0){ totalDwellMin += dwellH * 60; if (outbound) outDwellMin += dwellH * 60; }
    if (e.mins){ totalChargeMin += e.mins; if (outbound) outChargeMin += e.mins; }
    stopTimes.set(e.mile, { arriveMs, depMs: clock, dwellH });
    if (e.ref){ e.ref._arriveMs = arriveMs; e.ref._depMs = clock; e.ref._dwellH = dwellH; }
    pos = e.mile;
  }
  if (destMs == null) destMs = clock + driveMs(oneWay - pos);
  const endMs = clock + driveMs(totalMi - pos);
  driveMin += hpm * Math.max(0, totalMi - pos) * 60;
  return { startMs, destArriveMs: destMs, endArriveMs: endMs, driveMin,
    outChargeMin, outDwellMin, totalChargeMin, totalDwellMin, stopTimes };
}

function renderETA(plan, rt, round, oneWay){
  const banner = document.getElementById('etaBanner');
  LAST_ETA = { plan, rt, round, oneWay };          // cache so "arrive by" can recompute live
  const tl = walkTimeline(plan, rt, round, oneWay);
  if (!tl){ banner.style.display = 'none'; return; }
  const dep = new Date(tl.startMs);
  const driveMin = rt.hours * 60;                 // one-way driving time
  const chargeMins = tl.outChargeMin;             // outbound DC fast-charging
  const dwellMins  = tl.outDwellMin;              // outbound scheduled stopovers (e.g. overnight)
  const totalMin = (tl.destArriveMs - tl.startMs) / 60000;
  const clock = d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dayTime = d => d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + clock(d);
  const partsArr = [`${fmtMinsShort(driveMin)} drive`];
  if (chargeMins > 0.5) partsArr.push(`${fmtMinsShort(chargeMins)} charging`);
  if (dwellMins  > 0.5) partsArr.push(`${fmtMinsShort(dwellMins)} stopover`);
  const breakdown = partsArr.join(' + ');

  // "Arrive by" optimizer: the latest you can leave is target − total trip time.
  // It assumes the trip duration is independent of the departure clock, so it's
  // only offered when there's NO explicit scheduled stopover — an overnight charge
  // pins the schedule to an absolute time and breaks that assumption.
  const abEl = document.getElementById('arriveByTime');
  const arriveBy = abEl ? abEl.value : '';
  if (arriveBy && dwellMins <= 0.5){
    const dEl = document.getElementById('depDate');
    const target = new Date(`${dEl.value}T${arriveBy}`);
    if (!isNaN(target.getTime())){
      const leaveBy = new Date(target.getTime() - totalMin * 60000);
      const targetLbl = (leaveBy.toDateString() === target.toDateString()) ? clock(target) : dayTime(target);
      const passed = leaveBy.getTime() < Date.now();
      banner.innerHTML =
        `<span class="eta-ico">⏰</span>`
        + `<span class="eta-text">Leave by <b>${dayTime(leaveBy)}</b> to arrive${round ? ' at destination' : ''} by <b>${targetLbl}</b>`
        + `<span class="eta-sub">${fmtMinsShort(totalMin)} total · ${breakdown}${passed ? ' · ⚠ that departure time has already passed' : ''}</span></span>`;
      banner.style.display = 'flex';
      return;
    }
  }

  // Departure mode: chosen departure → estimated arrival (next-day if an overnight
  // stop pushes it past midnight).
  const arr = new Date(tl.destArriveMs);
  const arrLbl = (arr.toDateString() === dep.toDateString()) ? clock(arr) : dayTime(arr);
  banner.innerHTML =
    `<span class="eta-ico">🕜</span>`
    + `<span class="eta-text">Depart <b>${dayTime(dep)}</b> → arrive${round ? ' at destination' : ''} <b>${arrLbl}</b>`
    + `<span class="eta-sub">${fmtMinsShort(totalMin)} total · ${breakdown}</span></span>`;
  banner.style.display = 'flex';
}

// ── Hand the planned route off to a phone maps app ──
// Build the ordered list of stops for navigation: start → charging stops /
// waypoints (in route order) → destination; a round trip puts the destination
// mid-list as a turnaround with the return-leg stops after it, ending back home.
// Mirrors rerouteThroughStops so the exported route matches the drawn one.
function buildRoutePoints(plan, round, oneWay){
  if (!STATE || !STATE.A || !STATE.B) return [];
  const A = STATE.A, B = STATE.B;
  const pts = [{ lat: A.lat, lon: A.lon }];
  const withLatLon = ((plan && plan.stops) || []).filter(s => s.lat != null && s.lon != null);
  if (round){
    const out = withLatLon.filter(s => s.alongMi <= oneWay).sort((a,b)=>a.alongMi-b.alongMi);
    const ret = withLatLon.filter(s => s.alongMi >  oneWay).sort((a,b)=>a.alongMi-b.alongMi);
    out.forEach(s => pts.push({ lat: s.lat, lon: s.lon }));
    pts.push({ lat: B.lat, lon: B.lon });            // turnaround
    ret.forEach(s => pts.push({ lat: s.lat, lon: s.lon }));
    pts.push({ lat: A.lat, lon: A.lon });            // back home
  } else {
    // Merge the charging stops with the user's NON-charging routing waypoints
    // (charging waypoints are already represented in plan.stops as anchors), all
    // ordered by distance along the route, so the drawn line and the maps export
    // pass through EVERY stop the user added — not just the charging ones.
    const seq = withLatLon.map(s => ({ lat: s.lat, lon: s.lon, alongMi: s.alongMi }));
    (STATE.waypoints || []).forEach(w => {
      const charging = !isNaN(w.chargeTo) && w.chargeTo > 0;
      if (!charging && w.lat != null && w.lon != null)
        seq.push({ lat: w.lat, lon: w.lon, alongMi: w.alongMi != null ? w.alongMi : Infinity });
    });
    seq.sort((a, b) => a.alongMi - b.alongMi).forEach(s => pts.push({ lat: s.lat, lon: s.lon }));
    pts.push({ lat: B.lat, lon: B.lon });
  }
  return pts;
}
const ll = p => `${p.lat},${p.lon}`;

// Google Maps Directions URL (api=1): origin + destination + pipe-separated
// intermediate waypoints — imports the WHOLE multi-stop route in one tap.
function gmapsUrl(pts){
  if (pts.length < 2) return '';
  const origin = pts[0], dest = pts[pts.length-1], mids = pts.slice(1, -1);
  let u = `https://www.google.com/maps/dir/?api=1&origin=${ll(origin)}&destination=${ll(dest)}&travelmode=driving`;
  if (mids.length) u += `&waypoints=${mids.map(ll).join('|')}`;
  return u;
}
// Apple Maps URL scheme supports only a single origin → destination (saddr /
// daddr); it has no multi-waypoint parameter, so the intermediate charging stops
// can't be carried. The Apple link covers start → destination (the outbound leg
// for a round trip) — Google Maps is the one that gets the full stop list.
function applemapsUrl(pts){
  if (pts.length < 2 || !STATE || !STATE.A || !STATE.B) return '';
  return `https://maps.apple.com/?saddr=${STATE.A.lat},${STATE.A.lon}&daddr=${STATE.B.lat},${STATE.B.lon}&dirflg=d`;
}

function renderExport(plan, round, oneWay){
  const card = document.getElementById('exportCard');
  const logCard = document.getElementById('logCard');
  if (!card) return;
  const pts = buildRoutePoints(plan, round, oneWay);
  if (pts.length < 2){ card.style.display = 'none'; if (logCard) logCard.style.display = 'none'; LAST_TRIP = null; return; }
  const g = gmapsUrl(pts), a = applemapsUrl(pts);
  const nMid = pts.length - 2;                       // intermediate stops
  document.getElementById('exportBtns').innerHTML =
      `<a class="export-btn gmaps" href="${g}" target="_blank" rel="noopener">▶ Open in Google Maps</a>`
    + `<a class="export-btn amaps" href="${a}" target="_blank" rel="noopener">  Open in Apple Maps</a>`;
  document.getElementById('exportNote').innerHTML = nMid > 0
    ? `Google Maps imports the full route — ${nMid} stop${nMid>1?'s':''} plus start &amp; destination${round?' and back':''}. Apple Maps links can't carry intermediate stops, so its button opens start → destination only.`
    : `Opens turn-by-turn directions from start to destination.`;
  card.style.display = 'block';
  // Capture context for the printable trip log, and reveal its button.
  LAST_TRIP = { plan, round, oneWay };
  if (logCard) logCard.style.display = 'block';
}

// ── Printable trip log ──
// Opens a clean, self-contained sheet in a new tab: the planned trip up top, then
// blank fill-in fields to record real numbers on the road (odometer + battery %
// at each stop, leg efficiency, totals) and a notes area. The new tab gets its
// own print stylesheet so "Save as PDF" / print is free of the site's chrome.
let LAST_TRIP = null;
function printTripLog(){
  if (!STATE || !STATE.A || !STATE.B || !STATE.routes){ setStatus('Plan a trip first, then generate the log.', true); return; }
  const E = esc;
  const plan   = LAST_TRIP ? LAST_TRIP.plan : null;
  const round  = LAST_TRIP ? LAST_TRIP.round : document.getElementById('roundTrip').checked;
  const rt     = STATE.routes[STATE.sel];
  const oneWay = rt.miles;

  // Display figures straight from the result hero (exactly what's on screen).
  const txt = id => { const el = document.getElementById(id); return el ? el.textContent.trim() : ''; };
  const dist = txt('rDist'), energy = txt('rEnergy'), eff = txt('rEff'), temp = txt('rTemp');
  const cost = txt('sgCost'), costNote = txt('sgCostNote');
  const costStr = (cost && cost !== '–' && cost !== '-') ? cost : '—';
  const veh = document.getElementById('vehSel').value;
  const startSoc = document.getElementById('startSoc').value;
  const reserve  = document.getElementById('reserve').value;
  const dd = document.getElementById('depDate').value;

  // Departure / estimated arrival via the trip timeline (drive + DC charging +
  // any scheduled stopovers, so an overnight charge pushes arrival to next day).
  // walkTimeline also annotates each plan stop with _arriveMs/_depMs/_dwellH.
  let depStr = '—', arrStr = '—';
  const tl = walkTimeline(plan, rt, round, oneWay);
  if (tl){
    const fmt = d => d.toLocaleString([], { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false });
    depStr = fmt(new Date(tl.startMs)); arrStr = fmt(new Date(tl.destArriveMs));
  }

  // Charging-stop rows: planned info shown, blank cells for the driver to fill.
  const stops = (plan && plan.stops) || [];
  let rows = '', n = 0, dividerShown = false;
  stops.forEach(s => {
    if (round && oneWay && s.alongMi > oneWay && !dividerShown){
      rows += `<tr class="divider"><td colspan="8">↩ Turnaround at destination — return leg</td></tr>`;
      dividerShown = true;
    }
    n++;
    const onReturn = round && oneWay && s.alongMi > oneWay;
    const mile = onReturn ? `${Math.round(2*oneWay - s.alongMi)} mi from home` : `mile ${Math.round(s.alongMi)}`;
    const stayLog = (s.waypoint && s._dwellH > 0)
      ? ` · stay ~${fmtMinsShort(s._dwellH*60)}${s._depMs!=null?`, leave ${new Date(s._depMs).toLocaleString([], { weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false })}`:''}`
      : '';
    const planLine = s.waypoint
      ? `${mile} · charge to ${Math.round(s.target)}%${s.addedKWh!=null?` · +${Math.round(s.addedKWh)} kWh`:''}${stayLog}`
      : `${mile} · arrive ${Math.round(s.arriveSoc)}% → ${Math.round(s.target)}% · +${Math.round(s.addedKWh)} kWh · ~${Math.round(s.mins)} min · up to ${Math.round(s.maxKW)} kW`;
    const lk = chargerLinks(s);
    const addr = lk.addrStr ? `<div class="addr">${E(lk.addrStr)}</div>` : '';
    rows += `<tr>
      <td>${n}</td>
      <td><div class="cname">${E(s.name)}${s.waypoint ? ' (charge here)' : ` — ${E(s.net)}`}</div><div class="plan">${E(planLine)}</div>${addr}</td>
      <td class="fill"></td><td class="fill"></td><td class="fill"></td><td class="fill"></td><td class="fill"></td><td class="fill"></td>
    </tr>`;
  });
  if (!rows) rows = `<tr><td colspan="8" style="text-align:center;color:#555">No charging stops planned — direct drive.</td></tr>`;

  const kv = [
    ['Distance', E(dist)],
    ['Est. energy', E(energy)],
    ['Est. efficiency', E(eff) + ' mi/kWh'],
    ['Trip temp', E(temp) + (STATE.temp && STATE.temp.src ? ' (' + E(STATE.temp.src) + ')' : '')],
    ['Departure', E(depStr)],
    ['Est. arrival' + (round ? ' (at dest.)' : ''), E(arrStr)],
    ['Planned start charge', startSoc !== '' ? Math.round(startSoc) + '%' : '—'],
    ['Reserve buffer', (reserve !== '' ? Math.round(reserve) : 10) + '%'],
  ];
  const kvHtml = kv.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  const endLabel = round ? 'Back home — arrival' : 'At destination — arrival';

  const doc = `
    <h1>EV Trip Log</h1>
    <div class="sub">${E(veh)}${dd ? ' · ' + E(dd) : ''}${round ? ' · round trip' : ''}</div>
    <div class="route">${E(STATE.A.name)} &rarr; ${E(STATE.B.name)}</div>

    <h2>Planned estimate</h2>
    <div class="kv">${kvHtml}</div>

    <div class="boxes">
      <div class="box">
        <div class="bx-t">Before departure</div>
        <div class="line">Start odometer <span class="blank"></span> mi</div>
        <div class="line">Start battery <span class="blank short"></span> %</div>
        <div class="line">Actual departure <span class="blank"></span></div>
        <div class="line">Weather / conditions <span class="blank"></span></div>
      </div>
      <div class="box">
        <div class="bx-t">Reference</div>
        <div class="line">Planned start charge: <b>${startSoc !== '' ? Math.round(startSoc) + '%' : '—'}</b></div>
        <div class="line">Reserve buffer: <b>${(reserve !== '' ? Math.round(reserve) : 10)}%</b></div>
        <div class="line">Est. efficiency: <b>${E(eff)} mi/kWh</b></div>
        <div class="line">Est. arrival: <b>${E(arrStr)}</b></div>
        <div class="line">Planned cost: <b>${E(costStr)}</b>${costNote ? ` <span style="color:#555;font-size:10px">(${E(costNote)})</span>` : ''}</div>
      </div>
    </div>

    <h2>Charging stops — record actuals</h2>
    <div class="tlog-tablewrap"><table>
      <thead><tr>
        <th>#</th><th>Charger (planned)</th><th>Odometer</th><th>Arrive %</th>
        <th>Depart %</th><th>kWh added</th><th>mi since last</th><th>mi / kWh</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>

    <div class="boxes">
      <div class="box">
        <div class="bx-t">${endLabel}</div>
        <div class="line">Final odometer <span class="blank"></span> mi</div>
        <div class="line">Final battery <span class="blank short"></span> %</div>
        <div class="line">Arrival time <span class="blank"></span></div>
      </div>
      <div class="box">
        <div class="bx-t">Trip totals</div>
        <div class="line">Total miles driven <span class="blank short"></span> mi</div>
        <div class="line">Total energy used <span class="blank short"></span> kWh</div>
        <div class="line">Overall efficiency <span class="blank short"></span> mi/kWh</div>
        <div class="line">Total charging cost $ <span class="blank short"></span></div>
      </div>
    </div>

    <h2>Notes</h2>
    <div class="notes"></div>

    <div class="foot">Planned with the EV Trip Calculator · estimates only — drive to real-world conditions.</div>`;

  openTripLog(doc);
}

// ── Co-driver "cheat sheet" ──
// A low-stress, plain-language guide for someone who rarely DC fast-charges: the
// bottom line, where/when to stop, exactly HOW to charge at each network, and a
// short fast-charging primer. Shares the in-app overlay + print stylesheet with
// the trip log, so "Print / Save as PDF" works the same — or open it on a phone
// and the map links are tappable.
function printGuidanceSheet(){
  if (!STATE || !STATE.A || !STATE.B || !STATE.routes){ setStatus('Plan a trip first, then make a guide.', true); return; }
  const E = esc;
  const plan   = LAST_TRIP ? LAST_TRIP.plan : null;
  const round  = LAST_TRIP ? LAST_TRIP.round : document.getElementById('roundTrip').checked;
  const rt     = STATE.routes[STATE.sel];
  const oneWay = rt.miles;
  const txt = id => { const el = document.getElementById(id); return el ? el.textContent.trim() : ''; };
  const dist = txt('rDist'), eff = txt('rEff'), temp = txt('rTemp');
  const veh = document.getElementById('vehSel').value;
  const startRaw = document.getElementById('startSoc').value;
  const startSoc = startRaw !== '' && !isNaN(+startRaw) ? Math.round(+startRaw) : null;
  const dd = document.getElementById('depDate').value;

  const stops = (plan && plan.stops) || [];
  const dcfc  = stops.filter(s => !s.waypoint);
  const acWp  = stops.filter(s => s.waypoint);
  // Total fast-charging across the whole trip (for the bottom line).
  const totalChargeMins = dcfc.reduce((sum, x) => sum + (x.mins || 0), 0);

  // Departure / arrival via the trip timeline (drive + DC charging + any
  // scheduled stopovers — an overnight charge pushes arrival to the next day).
  // Also annotates each plan stop with _arriveMs/_depMs/_dwellH for the cards.
  let depStr = '', arrStr = '';
  const tl = walkTimeline(plan, rt, round, oneWay);
  if (tl){
    const fmt = d => d.toLocaleString([], { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
    depStr = fmt(new Date(tl.startMs)); arrStr = fmt(new Date(tl.destArriveMs));
  }

  // One tap = the whole route (start → stops → destination, and back if round trip).
  let gUrl = '';
  try { gUrl = gmapsUrl(buildRoutePoints(plan, round, oneWay)); } catch(_){ gUrl = ''; }

  // Plain-English bottom line.
  let bottom;
  if (startSoc == null){
    bottom = `Add your <b>start charge %</b> in the planner to get exact charging guidance. For now, here's your route.`;
  } else if (!dcfc.length && !acWp.length){
    bottom = `Good news — <b>no charging stops</b> on the way. Top up before you leave and you'll arrive with room to spare.`;
  } else if (!dcfc.length){
    bottom = `<b>No fast-charging needed.</b> You'll just plug in ${acWp.length > 1 ? `${acWp.length} times` : 'once'} at a normal/Level-2 outlet while you're parked — slow and easy, no app or rush.`;
  } else {
    bottom = `You'll <b>fast-charge ${dcfc.length} time${dcfc.length > 1 ? 's' : ''}</b>${acWp.length ? ` (plus ${acWp.length} slow plug-in${acWp.length > 1 ? 's' : ''})` : ''}. That's about <b>${Math.round(totalChargeMins)} min</b> of charging total — enough for a coffee or a stretch each time.`;
  }

  // "Before you leave" quick facts.
  const facts = [];
  if (startSoc != null) facts.push(['Charge to before leaving', `<b>${startSoc}%</b>`]);
  if (depStr) facts.push(['Plan to leave', `<b>${E(depStr)}</b>`]);
  if (arrStr) facts.push([round ? 'Reach the destination' : "You'll arrive", `about <b>${E(arrStr)}</b>`]);
  if (dist) facts.push(['Distance', `${E(dist)}${round ? ' (round trip)' : ''}`]);
  if (temp) facts.push(['Weather that day', E(temp)]);
  const factsHtml = facts.map(([k, v]) => `<div><span style="color:#555">${k}:</span> ${v}</div>`).join('');

  // Stop cards, in route order, with a friendly round-trip turnaround divider.
  let cards = '', i = 0, dividerShown = false;
  stops.forEach(s => {
    if (round && oneWay && s.alongMi > oneWay && !dividerShown){
      cards += `<div class="cheat-stop" style="border-style:dashed;text-align:center;font-style:italic;color:#555">↩ You've reached ${E(STATE.B.name)} — turn around here. The stops below are on the way home.</div>`;
      dividerShown = true;
    }
    i++;
    const onReturn = round && oneWay && s.alongMi > oneWay;
    const whereMi = onReturn ? `about ${Math.round(2 * oneWay - s.alongMi)} mi from home` : `about ${Math.round(s.alongMi)} mi in`;
    const lk = chargerLinks(s);
    const where = [s.town ? E(s.town) : '', lk.addrStr ? E(lk.addrStr) : ''].filter(Boolean).join(' · ');
    const links = (lk.apple || lk.plug)
      ? `<div class="cs-links">${lk.apple ? `<a href="${lk.apple}" target="_blank" rel="noopener">📍 Open in Maps</a>` : ''}${lk.plug ? `<a href="${lk.plug}" target="_blank" rel="noopener">🔌 Check it on PlugShare</a>` : ''}</div>`
      : '';
    if (s.waypoint){
      const fmtT = ms => new Date(ms).toLocaleString([], { weekday:'short', hour:'numeric', minute:'2-digit' });
      const sched = (s._dwellH > 0 && s._arriveMs != null)
        ? `<div class="cs-where">Get in about <b>${fmtT(s._arriveMs)}</b>, leave <b>${s._depMs!=null?fmtT(s._depMs):'—'}</b> — about ${fmtMinsShort(s._dwellH*60)} parked${(s.mode==='power'&&s.powerKW>0)?`, charging at ~${Math.round(s.powerKW)} kW`:''}.</div>`
        : '';
      cards += `<div class="cheat-stop">
        <div class="cs-head">Stop ${i} of ${stops.length} — ${E(s.name)} <span class="cheat-badge slow">slow plug-in</span></div>
        <div class="cs-where">${whereMi}${where ? ` · ${where}` : ''}</div>
        ${sched}
        <div class="cs-do">Plug in here and <b>charge to ${Math.round(s.target)}%</b>${s.addedKWh != null ? ` (adds about ${Math.round(s.addedKWh)} kWh)` : ''}. Leave it plugged in while you're parked — no need to watch it.</div>
        <div class="cs-how"><b>How:</b> ${NET_GUIDE_AC}</div>
        ${links}
      </div>`;
    } else {
      const how = NET_GUIDE[s.net] || NET_GUIDE_GENERIC;
      const tip = s.mins >= 25 ? 'Plenty of time for a meal or a walk.' : s.mins >= 12 ? 'Good time for a coffee or a restroom break.' : 'Quick top-up — just a few minutes.';
      cards += `<div class="cheat-stop">
        <div class="cs-head">Stop ${i} of ${stops.length} — ${E(s.name)} <span class="cheat-badge fast">fast charge${s.net ? ` · ${E(s.net==='Other'?'another network':s.net)}` : ''}</span></div>
        <div class="cs-where">${whereMi}${where ? ` · ${where}` : ''}${s.maxKW ? ` · up to ${Math.round(s.maxKW)} kW` : ''}</div>
        <div class="cs-do">Pull in with around <b>${Math.round(s.arriveSoc)}%</b> and <b>charge to ${Math.round(s.target)}%</b> — about <b>${Math.round(s.mins)} min</b>. ${tip}</div>
        <div class="cs-how"><b>How to charge here:</b> ${how}</div>
        ${links}
      </div>`;
    }
  });
  if (!stops.length){
    cards = `<div class="cheat-stop" style="text-align:center">No stops to worry about — it's a straight shot.${startSoc != null ? ` Just leave with at least <b>${startSoc}%</b>.` : ''}</div>`;
  }

  const routeLink = gUrl
    ? `<div class="cs-links" style="margin-top:10px;font-size:13px"><a href="${gUrl}" target="_blank" rel="noopener" style="font-weight:700">▶ Tap to open the whole route in Google Maps</a></div>`
    : '';

  const doc = `
    <h1>🧭 Your trip guide</h1>
    <div class="sub">${E(veh)}${dd ? ' · ' + E(dd) : ''}${round ? ' · round trip' : ''}</div>
    <div class="route">${E(STATE.A.name)} &rarr; ${E(STATE.B.name)}${round ? ' &rarr; home' : ''}</div>

    <div class="cheat-bottom">${bottom}</div>
    ${routeLink}

    <h2>Before you leave</h2>
    <div class="cheat-grid">${factsHtml}</div>

    <h2>${stops.length ? 'Your stops, in order' : 'On the road'}</h2>
    ${cards}

    <h2>Fast-charging, the easy way</h2>
    <div class="cheat-basics"><ul>
      <li><b>Set up the app first.</b> Before you go, install and sign into each charger's app with a card on file — it's the simplest way to start a charge.</li>
      <li><b>Use the big plug.</b> Fast chargers use the large CCS connector. Open the car's charge door, line it up, and push until it clicks.</li>
      <li><b>It slows down near full.</b> Charging is fastest when the battery is low and slows as it fills — that's why the plan stops around 80%, not 100%. Don't wait for full.</li>
      <li><b>If it won't start</b> or a stall looks broken, try a different stall or call the help number on the charger. PlugShare (links above) shows which nearby chargers are working.</li>
      <li><b>No need to babysit it.</b> Once it's charging you can step away — the app shows progress and pings you when it's done.</li>
    </ul></div>

    <div class="cheat-call">If anything feels off or you get stuck, call: <span class="blank"></span></div>

    <div class="foot">Made with the EV Trip Calculator · estimates only — trust the car's range readout and real conditions first.</div>`;

  openTripLog(doc);
}

// In-app trip-log sheet — opens as a full-screen overlay inside the app (works in an
// installed Home-Screen PWA, where window.open would drop you into Safari with no way
// back). "Print / Save as PDF" prints only the sheet via the @media print rules.
function ensureTripLogOverlay(){
  let ov = document.getElementById('tripLogOverlay');
  if (ov) return ov;
  ov = document.createElement('div');
  ov.id = 'tripLogOverlay';
  ov.className = 'tlog-overlay';
  ov.hidden = true;
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'Printable sheet');
  ov.innerHTML =
      '<div class="tlog-bar">'
    +   '<button type="button" class="tlog-back" onclick="closeTripLog()">‹ Back to planner</button>'
    +   '<button type="button" class="tlog-print" onclick="printTripLogNow()">🖨 Print / Save as PDF</button>'
    + '</div>'
    + '<div class="tlog-sheet" id="tripLogSheet"></div>';
  document.body.appendChild(ov);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) closeTripLog(); });
  return ov;
}
function openTripLog(html){
  const ov = ensureTripLogOverlay();
  ov.querySelector('#tripLogSheet').innerHTML = html;
  ov.hidden = false;
  document.body.classList.add('tlog-open');
  const sheet = ov.querySelector('.tlog-sheet');
  if (sheet) sheet.scrollTop = 0;
  const back = ov.querySelector('.tlog-back');
  if (back) back.focus();
}
function closeTripLog(){
  const ov = document.getElementById('tripLogOverlay');
  if (ov) ov.hidden = true;
  document.body.classList.remove('tlog-open');
}
function printTripLogNow(){ window.print(); }

let CHARGER_LAYER = [];
async function updateChargingPlan(rt, e, temp){
  const card = document.getElementById('stopsCard');
  const body = document.getElementById('stopsBody');
  const socEl = document.getElementById('startSoc');
  clearChargerMarkers();
  document.getElementById('exportCard').style.display = 'none';
  document.getElementById('logCard').style.display = 'none';

  if (socEl.value === '' || isNaN(+socEl.value)){
    card.style.display = 'block';
    body.innerHTML = `<div class="stops-summary">Enter your <b>start charge %</b> above to plan charging stops.</div>`;
    return;
  }

  const startSoc = Math.max(0, Math.min(100, +socEl.value));
  const reserve = Math.max(0, Math.min(50, +document.getElementById('reserve').value || 0));
  const waypoints = (STATE && STATE.waypoints) || [];
  // A waypoint charges either to an explicit slider % OR via "from time here"
  // (a charging power that fills the battery during the parked dwell).
  const isChargingWp = w => (!isNaN(w.chargeTo) && w.chargeTo > 0) || (w.chargeMode === 'power' && w.powerKW > 0);
  const chargingWps = waypoints.filter(isChargingWp);
  // Position every waypoint along the route (cumulative miles) so NON-charging
  // routing waypoints can be re-inserted into the drawn line + maps export too —
  // buildRoutePoints used to keep only charging stops, dropping plain waypoints
  // from the route so the map detoured around them. legMiles[i+1] = miles at
  // waypoint i (the route input was [A, ...waypoints, B]).
  // Prefer PROJECTING each waypoint's own coordinates onto the route geometry
  // (the same nearest-vertex projection used for DC chargers). It's robust to
  // routing-provider segment quirks where legMiles can collapse to [0,total] and
  // silently push a charge anchor to the trip end, dropping it from the plan.
  const _wpCoords = rt.geometry && rt.geometry.coordinates;
  const _wpCum = _wpCoords ? routeCum(_wpCoords) : null;
  waypoints.forEach((w, i) => {
    let mile = (rt.legMiles && rt.legMiles[i + 1] != null) ? rt.legMiles[i + 1] : null;
    if (_wpCoords && w.lat != null && w.lon != null){
      const pr = projectCharger(_wpCoords, _wpCum, w.lat, w.lon);
      if (pr && isFinite(pr.alongMi)) mile = pr.alongMi;
    }
    w.alongMi = mile;
  });
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
  // AC "charge here" anchors from the user's waypoints, positioned along the route.
  // For round trips each is mirrored onto the return leg (an outbound charge at
  // mile X is used again at 2·oneWay − X), so a mid-route hotel / Level-2 charge
  // counts on BOTH legs — that's what makes many round trips feasible keyless.
  const acAnchorList = () => {
    const out = [];
    waypoints.forEach((w, i) => {
      const mile = w.alongMi;
      if (mile == null || !isChargingWp(w)) return;
      const dm = (w.depDate && w.depTime) ? new Date(`${w.depDate}T${w.depTime}`).getTime() : null;
      const provTo = (w.chargeTo > 0) ? w.chargeTo : 80;   // power mode resolves this below
      const base = { chargeTo: provTo, name: w.addr, lat: w.lat, lon: w.lon, rate: w.chargeCost,
        mode: w.chargeMode, powerKW: w.powerKW || 0, wpIndex: i };
      out.push({ ...base, mile, depMs: (dm != null && !isNaN(dm)) ? dm : null });
      // The return-leg twin reuses the same charge but NOT the (outbound-only)
      // scheduled departure — you don't overnight at the hotel on the way home.
      if (round && mile < oneWay - 0.5) out.push({ ...base, mile: 2 * oneWay - mile, returnLeg: true, depMs: null });
    });
    return out;
  };
  const destAnchor = () => ({ mile: oneWay, chargeTo: 90, name: 'Destination charge',
    lat: STATE.B.lat, lon: STATE.B.lon, rate: parseFloat(document.getElementById('destRate').value) || 0 });
  // Resolve "from time here" (power-mode) charges. The target % isn't known until
  // we know how long you're parked, which needs the ARRIVAL time, which needs a
  // plan. So run a provisional plan, walk its timeline for each power stop's
  // arrival + dwell, then set its target from power × dwell (no efficiency loss,
  // matching the simple onboard-energy model). Mutates anchors in place; the real
  // plan is built afterward with the resolved targets.
  const resolvePowerAnchors = (anchors, chargersForTiming) => {
    if (!anchors.some(a => a.mode === 'power' && a.powerKW > 0)) return;
    const prov = planJourney(planMi, anchors, planNrg, startSoc, reserve, chargersForTiming);
    const tl = walkTimeline(prov, rt, round, oneWay);
    if (!tl) return;   // no departure date set → can't time it; keep the fallback %
    anchors.forEach(a => {
      if (!(a.mode === 'power' && a.powerKW > 0) || a.depMs == null) return;
      const info = tl.stopTimes.get(a.mile);
      const provStop = (prov.stops || []).find(s => s.waypoint && s.alongMi === a.mile);
      if (!info || !provStop || !(info.dwellH > 0)) return;
      const added = a.powerKW * info.dwellH;                // kWh onboarded (100%)
      const target = Math.min(100, provStop.arriveSoc + added / planNrg.batt * 100);
      anchors.forEach(b => { if (b.wpIndex === a.wpIndex) b.chargeTo = target; });
    });
  };
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
      renderETA(null, rt, round, oneWay);
      renderExport(null, round, oneWay);
      return;
    }
    // Outbound must fit from the start charge, AND the return leg must fit from
    // the destination top-up (the planner charges the dest anchor to 90%) —
    // checked on the mirrored energy model. Otherwise fall through to the full
    // planner, which adds a return-leg stop if 90% can't get you home.
    if (round && canChargeDest && oneWay <= reachStart && planMi <= planNrg.reachMi(oneWay, 90, reserve)){
      card.style.display = 'block';
      body.innerHTML = `<div class="stops-note">✅ No DC fast stop needed en route — you'll charge at your destination before the return.</div>`;
      setVerdict('ok', '✅', `No stop needed each way — just top up at your destination before heading back.`);
      renderSummary(null, energyTrip, fromHome, planMi);
      renderETA(null, rt, round, oneWay);
      renderExport(null, round, oneWay);
      return;
    }
    if (round && !canChargeDest && planMi <= planNrg.reachMi(0, startSoc, reserve)){
      card.style.display = 'block';
      body.innerHTML = `<div class="stops-note">✅ No charging stop needed — the whole round trip fits on your starting charge.</div>`;
      setVerdict('ok', '✅', `No charging stop needed — the whole round trip is within range.`);
      renderSummary(null, energyTrip, fromHome, planMi);
      renderETA(null, rt, round, oneWay);
      renderExport(null, round, oneWay);
      return;
    }
  }

  // AC "charge here" waypoints can make a trip feasible with no DC fast stop at
  // all — and that needs no Open Charge Map key. Before asking for one, try a
  // keyless plan that uses only the waypoint charges; if it works without any
  // DC stop, render it and stop here.
  if (chargingWps.length){
    // Keyless attempt: can the AC "charge here" stops alone (plus a destination
    // top-up on round trips) carry the trip with NO DC fast stop? Round trips now
    // mirror each AC charge onto the return leg, so they get the same treatment
    // one-way trips always had — no Open Charge Map key needed.
    const acAnchors = acAnchorList();
    if (round && canChargeDest) acAnchors.push(destAnchor());
    resolvePowerAnchors(acAnchors, []);   // set "from time here" targets from dwell
    const acOnly = planJourney(planMi, acAnchors, planNrg, startSoc, reserve, []);
    if (acOnly.feasible && !acOnly.stops.some(s => !s.waypoint)){
      card.style.display = 'block';
      renderStops(acOnly, e, reserve, round, startSoc, planNrg, oneWay);
      renderSummary(acOnly, energyTrip, fromHome, planMi);
      renderETA(acOnly, rt, round, oneWay);
      renderExport(acOnly, round, oneWay);
      drawChargerMarkers(acOnly.stops, round ? [] : waypoints);
      rerouteThroughStops(rt, acOnly, e, round, oneWay);
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
    body.innerHTML = `<div class="stops-note">No compatible DC fast chargers (CCS, ≥50 kW) found near this route in Open Charge Map.</div>`;
    setVerdict('no', '🛑', `No compatible fast chargers found along this route.`);
    return;
  }
  // Build plan inputs. Round trips mirror the DC chargers onto the return leg;
  // the AC "charge here" anchors (also mirrored) and an optional destination
  // top-up are SoC-reset points. The mirrored energy model is already planNrg.
  const allChargers = round ? mirrorForRoundTrip(chargers, rt.elev, oneWay).chargers : chargers;
  const prefChargers = allChargers.filter(c => c.preferred);
  const anchors = acAnchorList();
  if (round && canChargeDest) anchors.push(destAnchor());
  resolvePowerAnchors(anchors, prefChargers);   // set "from time here" targets from dwell
  // Plan with your preferred networks (Tesla / EA / ChargePoint) first. If that
  // leaves a gap no single charge can bridge, replan allowing any compatible CCS
  // charger so a normal interstate route doesn't dead-end — and flag that some
  // stops fall outside the preferred networks.
  let plan = planJourney(planMi, anchors, planNrg, startSoc, reserve, prefChargers);
  if (!plan.feasible){
    const alt = planJourney(planMi, anchors, planNrg, startSoc, reserve, allChargers);
    if (alt.feasible){ alt.usedNonPreferred = true; plan = alt; }
  }
  renderStops(plan, e, reserve, round, startSoc, planNrg, oneWay);
  renderSummary(plan, energyTrip, fromHome, planMi);
  renderETA(plan, rt, round, oneWay);
  renderExport(plan, round, oneWay);
  drawChargerMarkers(plan.stops, round ? [] : waypoints);
  rerouteThroughStops(rt, plan, e, round, oneWay);
}

// Redraw the map route so it actually passes through the chosen stops. For a
// round trip we draw the FULL loop (A → stops → destination → return stops → A)
// and report the true driven round-trip mileage.
async function rerouteThroughStops(rt, plan, e, round, oneWay){
  if (!STATE || !plan || !plan.feasible) return;
  // Same ordered stop list the maps-export uses: start → stops → dest → return.
  const pts = buildRoutePoints(plan, round, oneWay);
  if (pts.length > 14) return; // OSRM waypoint limit
  // Cache the OSRM reroute on the route, keyed by the exact driven path. Tweaks
  // that don't change the stop set (reserve %, start charge, vehicle, temp…)
  // produce the same signature, so we reuse the geometry instead of re-fetching.
  const sig = pts.map(p => p.lat.toFixed(5) + ',' + p.lon.toFixed(5)).join(';');
  try {
    let rr = (rt._reroute && rt._reroute.sig === sig) ? rt._reroute.rr : null;
    if (!rr){
      rr = (await route(pts))[0];
      rt._reroute = { sig, rr };
    }
    await loadLeaflet();
    if (MAP && ROUTE_LAYER && ROUTE_LAYER[0]){
      // Add the new line BEFORE removing the old one so the route never blinks
      // out between the direct draw and the through-stops redraw.
      const old = ROUTE_LAYER[0];
      const line = L.geoJSON(rr.geometry, { style: { color: '#5d3fd3', weight: 5, opacity: 0.85 } }).addTo(MAP);
      MAP.removeLayer(old);
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

// Escape third-party text (OCM station names/addresses) before injecting into
// innerHTML, so a malicious site title can't run script.
function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// Build a charger's full street address (when OCM provides it) plus deep-links to
// Apple Maps (drops a labeled pin at the exact coordinate) and PlugShare (opens
// its map centered on the location). Coordinates always exist for OCM POIs.
function chargerLinks(s){
  const cityZip = [s.city, [s.state, s.zip].filter(Boolean).join(' ').trim()].filter(Boolean).join(', ');
  const addrStr = [s.addr, cityZip].map(x => (x || '').trim()).filter(Boolean).join(', ');
  const hasGeo  = s.lat != null && s.lon != null;
  const apple = hasGeo ? `https://maps.apple.com/?ll=${s.lat},${s.lon}&q=${encodeURIComponent(s.name || 'Charger')}` : '';
  const plug  = hasGeo ? `https://www.plugshare.com/?latitude=${s.lat}&longitude=${s.lon}&spanLat=0.05&spanLng=0.05` : '';
  return { addrStr, apple, plug };
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
    // A genuine mid-route gap between chargers — reached only after also trying
    // chargers outside the preferred networks, so the gap is real.
    let msg = `<div class="stops-note">⚠️ Couldn't build a complete charging plan`;
    if (plan.gapFrom != null) msg += ` — no compatible DC fast charger (CCS, ≥50 kW) between mile ${plan.gapFrom} and ~mile ${plan.reachMi}`;
    msg += `. That gap is longer than one charge can cover — add a stop/waypoint there to route past a charger.</div>`;
    body.innerHTML = msg + (plan.stops.length ? `<div class="stops-summary">Partial plan: ${plan.stops.length} stop(s) before the gap.</div>` : '');
    setVerdict('no', '🛑', `Couldn't complete a charging plan — gap near mile ${plan.gapFrom}. Add a waypoint there to route past a charger.`);
    return;
  }
  if (!plan.stops.length){
    body.innerHTML = `<div class="stops-note">✅ No charging stop needed — you'll arrive around ${Math.round(plan.arriveSoc)}%.</div>`;
    return;
  }
  const dcfc = plan.stops.filter(s => !s.waypoint);
  // Annotate each stop with arrival / leave times + dwell so a scheduled (e.g.
  // overnight) charge can show when you'll get there and when you'll leave.
  if (STATE && STATE.routes && STATE.routes[STATE.sel]) walkTimeline(plan, STATE.routes[STATE.sel], roundTrip, oneWay);
  const totalMin = dcfc.reduce((s,x)=>s+x.mins,0);
  const nWp = plan.stops.length - dcfc.length;
  const wpNote = nWp ? ` + ${nWp} waypoint charge${nWp>1?'s':''}` : '';
  const nNonPref = dcfc.filter(s => s.preferred === false).length;
  setVerdict('ok', '✅', `Doable with <b>${dcfc.length} DC fast stop${dcfc.length!==1?'s':''}</b>${wpNote} (~${Math.round(totalMin)} min fast-charging) — arrive around <b>${Math.round(plan.arriveSoc)}%</b>.`);
  let html = `<div class="stops-summary">${dcfc.length} DC fast stop${dcfc.length!==1?'s':''}${wpNote} · ~${Math.round(totalMin)} min total fast-charging · arrive ${roundTrip?'home':''} around <b>${Math.round(plan.arriveSoc)}%</b></div>`;
  if (nNonPref) html += `<div class="stops-note">ℹ️ To bridge a gap, ${nNonPref>1?`${nNonPref} stops use chargers`:'one stop uses a charger'} outside your preferred networks (Tesla / EA / ChargePoint), marked <b>other network</b> below. ${nNonPref>1?'They’re':'It’s'} a standard CCS station${nNonPref>1?'s':''} — start ${nNonPref>1?'them':'it'} with that network’s own app or a tap-to-pay card.</div>`;
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
      const stay = (s._dwellH > 0)
        ? ` &nbsp;·&nbsp; <small style="color:var(--tc-muted)">stay ~${fmtMinsShort(s._dwellH*60)}${s._depMs!=null?`, leave ${new Date(s._depMs).toLocaleString([], { weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false })}`:''}</small>`
        : '';
      const via = (s.mode === 'power' && s.powerKW > 0) ? ` <small style="color:var(--tc-muted)">via ~${Math.round(s.powerKW)} kW</small>` : '';
      html += `<div class="stop wp-stop">
        <div class="stop-num">★</div>
        <div class="stop-main">
          <div class="stop-name">${esc(s.name)}<span class="net-badge net-wp">${s.net==='AC'?'charge here':s.net}</span></div>
          <div class="stop-sub">${mileLabel}${stay}</div>
          <div class="stop-charge">Arrive <b>${Math.round(s.arriveSoc)}%</b> → charge to <b>${Math.round(s.target)}%</b> here${via}${s.addedKWh!=null?` &nbsp;·&nbsp; +${s.addedKWh.toFixed(0)} kWh &nbsp;·&nbsp; ${s.rate>0?`~$${(s.addedKWh*s.rate).toFixed(2)} <small style="color:var(--tc-muted)">@ $${s.rate.toFixed(2)}/kWh</small>`:`<span style="color:#16a34a">free</span>`}`:''}</div>
        </div>
      </div>`;
    } else {
      n++;
      const lk = chargerLinks(s);
      html += `<div class="stop">
        <div class="stop-num">${n}</div>
        <div class="stop-main">
          <div class="stop-name">${esc(s.name)}<span class="net-badge ${NET_CLASS[s.net]||'net-other'}">${esc(s.net==='Other'?'other network':s.net)}</span>${onReturn?'<span class="net-badge" style="background:#6b728020;color:#6b7280">return</span>':''}</div>
          <div class="stop-sub">${s.town ? esc(s.town) + ' · ' : ''}${mileLabel} · up to ${Math.round(s.maxKW)} kW${s.offMi>1?` · ${s.offMi.toFixed(1)} mi off route`:''}</div>
          <div class="stop-charge">Arrive <b>${Math.round(s.arriveSoc)}%</b> → charge to <b>${Math.round(s.target)}%</b> &nbsp;·&nbsp; +${s.addedKWh.toFixed(0)} kWh &nbsp;·&nbsp; ~${Math.round(s.mins)} min &nbsp;·&nbsp; ~$${(s.addedKWh * ((COST[s.net]!=null)?COST[s.net]:COST.publicAvg)).toFixed(2)}${s.overCap?` <span style="color:#eab308">⚠ above 80% — no closer charger</span>`:''}</div>
          <div class="stop-links">${lk.addrStr ? `<span class="stop-addr">${esc(lk.addrStr)}</span>` : ''}${lk.apple ? `<a href="${lk.apple}" target="_blank" rel="noopener">📍 Apple Maps</a>` : ''}${lk.plug ? `<a href="${lk.plug}" target="_blank" rel="noopener">🔌 PlugShare</a>` : ''}</div>
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
        .addTo(MAP).bindPopup(`<b>★ ${esc(s.name)}</b><br>Waypoint · AC charge to ${Math.round(s.target)}%`);
      CHARGER_LAYER.push(m);
    } else {
      n++;
      const m = L.circleMarker([s.lat, s.lon], { radius: 9, color: '#fff', weight: 2, fillColor: colors[s.net]||'#5d3fd3', fillOpacity: 1 })
        .addTo(MAP).bindPopup(`<b>Stop ${n}: ${esc(s.name)}</b><br>${s.net} · up to ${Math.round(s.maxKW)} kW<br>Charge to ${Math.round(s.target)}% (~${Math.round(s.mins)} min)`);
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
let _leafletPromise = null;
function loadLeaflet(){
  if (window.L) return Promise.resolve();
  // Cache the in-flight promise so the concurrent callers on one refresh (drawMap,
  // drawChargerMarkers, rerouteThroughStops) share a SINGLE script/CSS injection
  // instead of each appending another copy of Leaflet while the first is loading.
  if (_leafletPromise) return _leafletPromise;
  _leafletPromise = new Promise(res => {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = res; document.body.appendChild(js);
  });
  return _leafletPromise;
}
async function drawMap(A, B, geometry){
  await loadLeaflet();
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (!MAP){
    // preferCanvas: draw the route line + charger circle-markers on ONE <canvas>
    // instead of a separate SVG/DOM node each — fewer elements and less memory to
    // retain while the page sits open.
    MAP = L.map('map', { scrollWheelZoom: false, preferCanvas: true });
    L.tileLayer(dark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      // updateWhenIdle: only fetch tiles once a pan settles (not continuously mid-drag);
      // keepBuffer: 1 keeps fewer off-screen tiles in memory (Leaflet default is 2).
      { attribution: '© OpenStreetMap, © CARTO', maxZoom: 19, updateWhenIdle: true, keepBuffer: 1 }).addTo(MAP);
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
['vehSel','roadType','startSoc','reserve','roundTrip','effOverride','canChargeDest','destRate','depTime'].forEach(id => {
  document.getElementById(id).addEventListener('change', refresh);
});
// Live-update while typing the efficiency override, but DEBOUNCED — otherwise every
// keystroke re-runs the whole estimate + charging-plan pipeline. 'change' (blur /
// Enter / spinner) above still updates immediately.
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
document.getElementById('effOverride').addEventListener('input', debounce(refresh, 250));

// Show the "can charge at destination" option only when round trip is on, and the
// destination $/kWh rate field only when that box is checked.
function onRoundTripToggle(){
  const round = document.getElementById('roundTrip').checked;
  const canDest = document.getElementById('canChargeDest').checked;
  document.getElementById('destChargeWrap').style.display = round ? 'flex' : 'none';
  document.getElementById('destRateWrap').style.display = (round && canDest) ? 'flex' : 'none';
}

// ============================================================
//  SAVE / RECALL TRIPS
//  Two layers: (1) quick save/recall in THIS browser (localStorage), and
//  (2) export/import a portable .md file — a readable summary plus the exact
//  inputs in a hidden comment the importer reads back. Only the trip INPUTS are
//  stored (results are recomputed on load), and API keys are NEVER written into
//  an exported file.
// ============================================================
const TRIPS_KEY = 'evTrips';
function getSavedTrips(){ try { return JSON.parse(localStorage.getItem(TRIPS_KEY) || '[]'); } catch(e){ return []; } }
function setSavedTrips(arr){ try { localStorage.setItem(TRIPS_KEY, JSON.stringify(arr)); } catch(e){} }

// Snapshot every trip INPUT (not results). getRouteStops() already returns each
// row's address, home flag, and charge target/cost in route order.
function collectTrip(){
  const val = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  return {
    v: 1,
    stops: getRouteStops(),
    veh: val('vehSel'), depDate: val('depDate'), depTime: val('depTime'), arriveBy: val('arriveByTime'),
    roadType: val('roadType'), effOverride: val('effOverride'),
    startSoc: val('startSoc'), reserve: val('reserve'), destRate: val('destRate'),
    roundTrip: document.getElementById('roundTrip').checked,
    canChargeDest: document.getElementById('canChargeDest').checked
  };
}

// Rebuild the form from a saved snapshot. Returns false if the data is unusable.
function applyTrip(d){
  if (!d || !Array.isArray(d.stops) || !d.stops.length) return false;
  const list = document.getElementById('routeStops');
  list.innerHTML = '';
  d.stops.forEach(s => {
    const charge = (s.chargeHere && s.chargeTo > 0) ? s.chargeTo : null;
    const row = makeStopRow(s.addr || '', charge, s.chargeCost != null ? s.chargeCost : 0,
      { depDate: s.depDate, depTime: s.depTime, powerKW: s.powerKW, chargeMode: s.chargeMode, scheduled: s.scheduled });
    const addrEl = row.querySelector('.rs-addr');
    if (s.isHome){ addrEl.dataset.home = '1'; }
    if (s.lat != null && s.lon != null && isFinite(s.lat) && isFinite(s.lon)){ addrEl.dataset.lat = s.lat; addrEl.dataset.lon = s.lon; }
    list.appendChild(row);
  });
  renderStopKinds();
  const setV = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
  const vs = document.getElementById('vehSel');
  if (d.veh && [...vs.options].some(o => o.value === d.veh)) vs.value = d.veh;
  setV('depDate', d.depDate); setV('depTime', d.depTime); setV('arriveByTime', d.arriveBy); setV('roadType', d.roadType);
  setV('effOverride', d.effOverride); setV('startSoc', d.startSoc);
  setV('reserve', d.reserve); setV('destRate', d.destRate);
  document.getElementById('roundTrip').checked = !!d.roundTrip;
  document.getElementById('canChargeDest').checked = !!d.canChargeDest;
  onRoundTripToggle();
  return true;
}

// Friendly default name + a filesystem-safe filename, both from route + date.
function defaultTripName(d){
  const named = (d.stops || []).filter(s => s.addr);
  const head = a => (a || '').split(',')[0].trim().slice(0, 20);
  if (!named.length) return 'My trip';
  const a = head(named[0].addr), b = named.length > 1 ? head(named[named.length - 1].addr) : '';
  const base = b ? `${a} → ${b}` : a;
  return d.depDate ? `${base} (${d.depDate})` : base;
}
function tripFilename(d){
  const named = (d.stops || []).filter(s => s.addr);
  const slug = s => (s || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'stop';
  const a = named.length ? slug(named[0].addr) : 'trip';
  const b = named.length > 1 ? '-to-' + slug(named[named.length - 1].addr) : '';
  const date = d.depDate || new Date().toISOString().slice(0, 10);
  return `${a}${b}-${date}.md`;
}

// A readable Markdown summary with the canonical inputs in a hidden comment the
// importer reads back. Renders cleanly if the file is ever viewed as Markdown.
function tripToMarkdown(d, name){
  const named = (d.stops || []).filter(s => s.addr);
  const lines = [`# EV Trip — ${name}`, ''];
  if (named.length){
    lines.push('## Route');
    named.forEach((s, i) => {
      const role = i === 0 ? 'Start' : (i === named.length - 1 ? 'Destination' : 'Stop');
      const chargeBit = (s.chargeHere && s.chargeTo > 0)
        ? (s.chargeMode === 'power' && s.powerKW > 0
            ? ` — charge from time here at ${s.powerKW} kW${s.chargeCost > 0 ? ` @ $${(+s.chargeCost).toFixed(2)}/kWh` : ''}`
            : ` — charge to ${s.chargeTo}%${s.chargeCost > 0 ? ` @ $${(+s.chargeCost).toFixed(2)}/kWh` : ''}`)
        : '';
      const sched = (s.depDate || s.depTime) ? ` — leave ${[s.depDate, s.depTime].filter(Boolean).join(' ')}` : '';
      lines.push(`${i + 1}. **${role}:** ${s.addr}${chargeBit}${sched}`);
    });
    lines.push('');
  }
  lines.push('## Settings');
  const row = (k, v) => { if (v !== '' && v != null) lines.push(`- **${k}:** ${v}`); };
  row('Vehicle', d.veh);
  row('Departure', [d.depDate, d.depTime].filter(Boolean).join(' '));
  row('Arrive by', d.arriveBy);
  row('Road type', d.roadType);
  row('Efficiency override', d.effOverride ? d.effOverride + ' mi/kWh' : '');
  row('Start charge', d.startSoc !== '' ? d.startSoc + '%' : '');
  row('Reserve buffer', d.reserve !== '' ? d.reserve + '%' : '');
  row('Round trip', d.roundTrip ? 'yes' : '');
  row('Charge at destination', (d.roundTrip && d.canChargeDest) ? 'yes' : '');
  lines.push('', '> Open the EV Trip Calculator and use **Import** to load this trip.', '',
    `<!-- EVTRIP v1 ${JSON.stringify(d)} -->`, '');
  return lines.join('\n');
}

// Pull the trip data back out of an imported file: the hidden comment if present,
// otherwise a bare JSON file. Returns null if it isn't a valid trip.
function parseTripFile(text){
  const m = String(text || '').match(/<!--\s*EVTRIP v1\s*([\s\S]*?)-->/);
  const raw = m ? m[1] : String(text || '');
  try { const d = JSON.parse(raw.trim()); return (d && Array.isArray(d.stops)) ? d : null; }
  catch(e){ return null; }
}

// Rebuild the saved-trips dropdown from localStorage (newest first).
function renderSavedTrips(selName){
  const sel = document.getElementById('savedTripSel');
  if (!sel) return;
  const trips = getSavedTrips();
  sel.innerHTML = `<option value="">${trips.length ? 'Saved trips…' : 'No saved trips yet'}</option>`
    + trips.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join('');
  if (selName) sel.value = selName;
}

function saveTripPrompt(){
  const d = collectTrip();
  if (!(d.stops || []).some(s => s.addr)){ setStatus('Add at least a start and destination before saving.', true); return; }
  const name = (prompt('Name this trip:', defaultTripName(d)) || '').trim();
  if (!name) return;
  const trips = getSavedTrips().filter(t => t.name !== name);
  trips.unshift({ name, savedAt: Date.now(), data: d });
  setSavedTrips(trips);
  renderSavedTrips(name);
  setStatus(`Saved “${name}” in this browser.`);
}
function loadSelectedTrip(){
  const name = document.getElementById('savedTripSel').value;
  if (!name){ setStatus('Pick a saved trip to load.', true); return; }
  const t = getSavedTrips().find(x => x.name === name);
  if (!t){ setStatus('That saved trip is no longer available.', true); renderSavedTrips(); return; }
  loadTripData(t.data, name);
}
function deleteSelectedTrip(){
  const name = document.getElementById('savedTripSel').value;
  if (!name){ setStatus('Pick a saved trip to delete.', true); return; }
  if (!confirm(`Delete saved trip “${name}”?`)) return;
  setSavedTrips(getSavedTrips().filter(t => t.name !== name));
  renderSavedTrips();
  setStatus(`Deleted “${name}”.`);
}
// Apply a snapshot, then auto-estimate once it has enough to route.
function loadTripData(d, name){
  if (!applyTrip(d)){ setStatus('That trip couldn’t be loaded.', true); return; }
  const ready = (d.stops || []).filter(s => s.addr).length >= 2;
  if (ready){ setStatus(`Loaded “${name}” — estimating…`); planTrip(); }
  else setStatus(`Loaded “${name}”.`);
}

// Export the current trip as a .md file. On phones this routes through the system
// Share sheet (AirDrop / Messages / Save to Files); on desktop it downloads.
async function exportTripFile(){
  const d = collectTrip();
  if (!(d.stops || []).some(s => s.addr)){ setStatus('Add at least a start and destination before exporting.', true); return; }
  const name = defaultTripName(d);
  const md = tripToMarkdown(d, name);
  const fname = tripFilename(d);
  const mobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent || '');
  if (mobile && navigator.canShare && window.File){
    try {
      const file = new File([md], fname, { type: 'text/markdown' });
      if (navigator.canShare({ files: [file] })){
        await navigator.share({ files: [file], title: name });
        return;
      }
    } catch(e){ return; }   // share sheet dismissed/canceled
  }
  const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
  const a = document.createElement('a');
  a.href = url; a.download = fname;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus(`Exported “${fname}”.`);
}

// Import a previously exported trip file (or a bare JSON trip).
function importTripFile(input){
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const d = parseTripFile(reader.result);
    if (!d) setStatus('That file isn’t a saved EV trip.', true);
    else loadTripData(d, file.name.replace(/\.(md|json)$/i, ''));
    input.value = '';   // let the same file be re-imported later
  };
  reader.onerror = () => setStatus('Couldn’t read that file.', true);
  reader.readAsText(file);
}

// Everything above is now declared & initialized — build the UI last so the
// row-seeding in initUI() can't reference an uninitialized top-level binding.
initUI();
</script>

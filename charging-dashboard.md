---
layout: page
title: Charging
permalink: /charging/
---

{% comment %}
=============================================================
  RATE CONFIGURATION — edit _data/rates.yml, NOT this file
  ─────────────────────────────────────────────────────────
  All electricity rates and gas savings assumptions are now
  managed in a single place: _data/rates.yml

  To update rates: open _data/rates.yml and add a new entry.
  This file reads from that data automatically.
=============================================================
{% endcomment %}

{% comment %}
=============================================================
  ODOMETER / COST-PER-MILE CONFIGURATION
  ─────────────────────────────────────────────────────────
  Odometer history is now managed in _data/mileage.yml
  Add a new entry there whenever you check the odometer.
  This file reads the most recent reading per vehicle
  automatically — no changes needed here.

  WHEN YOU ADD A NEW VEHICLE:
    1. Add entries to _data/mileage.yml with the new vehicle name
    2. Update cloudcannon.config.yml vehicle dropdown
    3. Update the Shortcut VEHICLE_NAME/VEHICLE_SLUG options
    An "Overall" row appears automatically with 2+ vehicles.
=============================================================
{% endcomment %}

{% comment %} Build odometer_entries from _data/mileage.yml — latest per vehicle {% endcomment %}
{% assign _seen_vehicles = "" %}
{% assign odometer_entries = "" %}
{% assign _mileage_sorted = site.data.mileage | sort: "date" | reverse %}
{% assign _mileage_asc    = site.data.mileage | sort: "date" %}
{% for entry in _mileage_sorted %}
  {% assign _veh_key = entry.vehicle | downcase | replace: " ", "_" | replace: "'", "" | prepend: "|" | append: "|" %}
  {% unless _seen_vehicles contains _veh_key %}
    {% assign _seen_vehicles = _seen_vehicles | append: _veh_key %}

    {% comment %} Find first_session_date and first_odo for this vehicle {% endcomment %}
    {% assign _first_date = "9999-99-99" %}
    {% for log in site.charging %}
      {% if log.vehicle == entry.vehicle %}
        {% assign _log_date = log.date | date: "%Y-%m-%d" %}
        {% if _log_date < _first_date %}{% assign _first_date = _log_date %}{% endif %}
      {% endif %}
    {% endfor %}
    {% if _first_date == "9999-99-99" %}{% assign _first_date = entry.date %}{% endif %}

    {% comment %} Find the oldest odometer reading on or before first_session_date for this vehicle.
       Track its DATE too — that's the start of the period over which we can measure miles. {% endcomment %}
    {% assign _first_odo = 0 %}
    {% assign _first_odo_date = "" %}
    {% for mentry in _mileage_asc %}
      {% if mentry.vehicle == entry.vehicle and mentry.date <= _first_date %}
        {% assign _first_odo = mentry.odometer %}
        {% assign _first_odo_date = mentry.date | date: "%Y-%m-%d" %}
      {% endif %}
    {% endfor %}
    {% comment %} If no odo reading before first session, use earliest available reading {% endcomment %}
    {% if _first_odo == 0 %}
      {% for mentry in _mileage_asc %}
        {% if mentry.vehicle == entry.vehicle and _first_odo == 0 %}
          {% assign _first_odo = mentry.odometer %}
          {% assign _first_odo_date = mentry.date | date: "%Y-%m-%d" %}
        {% endif %}
      {% endfor %}
    {% endif %}

    {% comment %} Miles driven during tracked period = current odo - odo at first odometer reading {% endcomment %}
    {% assign _tracked_miles = entry.odometer | minus: _first_odo %}
    {% if _tracked_miles <= 0 %}{% assign _tracked_miles = entry.odometer %}{% endif %}

    {% assign _row = entry.vehicle | append: " | " | append: entry.odometer | append: " | " | append: entry.date | append: " | " | append: _first_date | append: " | " | append: _tracked_miles | append: " | " | append: _first_odo_date | append: " |" %}
    {% if odometer_entries == "" %}
      {% assign odometer_entries = _row %}
    {% else %}
      {% assign odometer_entries = odometer_entries | append: "
" | append: _row %}
    {% endif %}
  {% endunless %}
{% endfor %}
{% assign odometer_entries = odometer_entries | split: "
" %}

<style>
  .dash-container { font-family: -apple-system, sans-serif; max-width: 1000px; margin: auto; color: var(--text); }

  .status-bar { display: flex; background: var(--dash-card); color: var(--text); padding: 20px; border-radius: 12px; justify-content: space-around; text-align: center; margin-bottom: 25px; border: 1px solid var(--dash-border); }
  .status-item { flex: 1; border-right: 1px solid var(--dash-border); }
  .status-item:last-child { border-right: none; }
  .status-label { font-size: 0.7rem; text-transform: uppercase; color: #888; display: block; }
  .status-value { font-size: 1.5rem; font-weight: bold; display: block; margin-top: 5px; color: var(--text) !important; }
  .status-footnote { font-size: 0.65rem; color: #888; display: block; margin-top: 4px; line-height: 1.4; }

  .cpm-grid { display: grid; gap: 16px; margin-bottom: 25px; }
  .cpm-row { display: grid; grid-template-columns: 1.7fr repeat(5, 1fr); column-gap: 14px; row-gap: 10px; align-items: center; background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 12px; padding: 16px 20px; }
  .cpm-vehicle { font-weight: bold; font-size: 0.9rem; min-width: 0; }
  .cpm-vehicle small { display: block; font-weight: normal; color: #888; font-size: 0.65rem; margin-top: 2px; }
  .cpm-stat { text-align: center; min-width: 0; }
  .cpm-stat-label { font-size: 0.6rem; text-transform: uppercase; color: #888; display: block; }
  .cpm-stat-value { font-size: 1.1rem; font-weight: bold; display: block; margin-top: 3px; }
  .cpm-overall { border-top: 2px solid var(--dash-border); }

  /* Custom tooltip — works on desktop hover AND mobile tap (native title:
     attributes don't fire on touch and are flaky on desktop). */
  .cpm-tip { position: relative; cursor: help; text-decoration: underline dotted; text-decoration-color: #999; text-underline-offset: 3px; }
  .cpm-tip-bubble {
    position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
    margin-bottom: 7px; padding: 4px 9px; border-radius: 6px;
    background: var(--text); color: var(--dash-card);
    font-size: 0.7rem; font-weight: 600; letter-spacing: 0; text-decoration: none;
    white-space: nowrap; box-shadow: 0 3px 10px rgba(0,0,0,0.28);
    opacity: 0; visibility: hidden; transition: opacity 0.12s ease;
    z-index: 600; pointer-events: none;
  }
  .cpm-tip-bubble::after {
    content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
    border: 5px solid transparent; border-top-color: var(--text);
  }
  .cpm-tip:hover .cpm-tip-bubble,
  .cpm-tip:focus .cpm-tip-bubble,
  .cpm-tip.is-open .cpm-tip-bubble { opacity: 1; visibility: visible; }

  .assumptions-panel { display: none; background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 0.78rem; color: #888; }
  .assumptions-panel strong { color: var(--text); }
  .assumptions-panel table { width: 100%; margin-top: 8px; font-size: 0.75rem; border-collapse: collapse; }
  .assumptions-panel th { text-align: left; padding: 4px 8px; border-bottom: 1px solid var(--dash-border); color: var(--text); }
  .assumptions-panel td { padding: 4px 8px; }
  .assumptions-link { color: #888; font-size: 0.6rem; text-decoration: none; }

  .media-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
  .charge-nav { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--dash-border); align-items: center; }
  .charge-nav a { font-size: 0.78rem; font-weight: 600; text-decoration: none; padding: 5px 14px; border-radius: 20px; border: 1px solid var(--dash-border); background: var(--dash-card); color: #888; transition: all 0.15s; }
  .charge-nav a:hover  { border-color: var(--link); color: var(--link); }
  .charge-nav a.active { background: var(--link); border-color: var(--link); color: #fff; font-weight: 700; }

  .card { background: var(--dash-card); border: 1px solid var(--dash-border); padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

  .badge { padding: 3px 9px; border-radius: 20px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; display: inline-block; letter-spacing: 0.03em; }
  .badge-work   { background: #3b82f620; color: #3b82f6; }
  .badge-home   { background: #8b5cf620; color: #8b5cf6; }
  .badge-tesla  { background: #ef444420; color: #ef4444; }
  .badge-cp     { background: #f9731620; color: #f97316; }
  .badge-blink  { background: #22c55e20; color: #22c55e; }
  .badge-rivian { background: #eab30820; color: #d97706; }
  .badge-ea     { background: #00b04f20; color: #00963f; }
  .badge-wc     { background: #51A95020; color: #51A950; }
  .badge-other  { background: #6b728020; color: #6b7280; }

  .charging-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.84rem; color: var(--text) !important; }
  .charging-table th { background: var(--table-head); padding: 9px 12px; text-align: left; border-bottom: 1px solid var(--dash-border); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #888; font-weight: 700; }
  .charging-table td { padding: 9px 12px; border-bottom: 1px solid var(--dash-border); vertical-align: middle; }
  .charging-table tr:last-child td { border-bottom: none; }
  .charging-table tr:hover td { background: var(--dash-border); }
  .charging-table td:first-child { white-space: nowrap; font-size: 0.8rem; color: #888; }
  .charging-table td:nth-child(3) { white-space: nowrap; font-size: 0.72rem; color: #888; }
  .charging-table td:nth-child(4),
  .charging-table td:nth-child(5),
  .charging-table td:nth-child(6) { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .charging-table th:nth-child(4),
  .charging-table th:nth-child(5),
  .charging-table th:nth-child(6) { text-align: right; }
  .charging-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  /* ── Mobile layout ── */
  @media (max-width: 600px) {
    /* Status bar: 2×2 grid instead of 4 cramped columns */
    .status-bar {
      flex-wrap: wrap;
      padding: 14px 12px;
      gap: 0;
    }
    .status-item {
      flex: 1 1 50%;
      border-right: none;
      border-bottom: 1px solid var(--dash-border);
      padding: 10px 6px;
    }
    .status-item:nth-child(odd)  { border-right: 1px solid var(--dash-border); }
    .status-item:nth-child(3),
    .status-item:nth-child(4)    { border-bottom: none; }
    .status-value { font-size: 1.25rem; }

    /* Charts: stack vertically */
    .media-grid { grid-template-columns: 1fr; gap: 14px; }

    /* CPM cards: a clean label-left / value-right spec list (no awkward
       half-empty grid row). */
    .cpm-row { grid-template-columns: 1fr; padding: 6px 16px 12px; row-gap: 0; }
    .cpm-vehicle { grid-column: 1 / -1; padding: 10px 0 6px; }
    .cpm-stat { display: flex; justify-content: space-between; align-items: baseline; text-align: left; gap: 12px; padding: 10px 0; border-top: 1px solid var(--dash-border); }
    .cpm-stat-label { font-size: 0.72rem; margin: 0; }
    .cpm-stat-value { font-size: 1.05rem; margin: 0; }
    /* Right-anchor the tooltip so it can't overflow the card edge. */
    .cpm-tip-bubble { left: auto; right: 0; transform: none; }
    .cpm-tip-bubble::after { left: auto; right: 10px; transform: none; }

    /* Assumptions panel: scrollable tables */
    .assumptions-panel { padding: 10px 12px; }
  }
</style>

{% comment %} ── Initialize all accumulators ── {% endcomment %}
{% assign total_cost  = 0.0 %}
{% assign total_kwh   = 0.0 %}
{% assign gas_savings = 0.0 %}
{% assign work_kwh    = 0.0 %}
{% assign home_kwh    = 0.0 %}
{% assign tesla_kwh   = 0.0 %}
{% assign cp_kwh      = 0.0 %}
{% assign blink_kwh   = 0.0 %}
{% assign rivian_kwh  = 0.0 %}
{% assign ea_kwh      = 0.0 %}
{% assign wc_kwh      = 0.0 %}
{% assign other_kwh   = 0.0 %}
{% assign veh_cost_0  = 0.0 %}
{% assign veh_kwh_0   = 0.0 %}
{% assign veh_cost_1  = 0.0 %}
{% assign veh_kwh_1   = 0.0 %}
{% assign veh_cost_2  = 0.0 %}
{% assign veh_kwh_2   = 0.0 %}
{% assign veh_cost_3  = 0.0 %}
{% assign veh_kwh_3   = 0.0 %}
{% comment %} Windowed sums (only sessions WITHIN the odometer-tracked period) —
   used for cost/mile & kWh/mile so the numerator matches the tracked miles. {% endcomment %}
{% assign veh_wcost_0 = 0.0 %}{% assign veh_wkwh_0 = 0.0 %}
{% assign veh_wcost_1 = 0.0 %}{% assign veh_wkwh_1 = 0.0 %}
{% assign veh_wcost_2 = 0.0 %}{% assign veh_wkwh_2 = 0.0 %}
{% assign veh_wcost_3 = 0.0 %}{% assign veh_wkwh_3 = 0.0 %}

{% comment %} Home cost is billed wall-side; energy_kwh is battery-side. Uplift home ENERGY for COST only. {% endcomment %}
{% assign home_mult = site.data.rates.home_charge_uplift | default: 0.10 | plus: 1 %}

{% comment %}
  ── Membership pass amortization (mirrors the analytics page) ──
  A network pass (e.g. Electrify America Pass+) is a flat fee that buys a lower
  per-kWh rate. Spread that fee across every session on the pass's network inside
  its [start,end] window, weighted by each session's kWh, and add the share to
  that session's cost below — so total cost, per-vehicle cost, cost/mile, and gas
  savings all reflect the true all-in cost, exactly like _data/memberships.yml
  drives on the analytics page. PRE-PASS: sum each pass's window kWh first.
{% endcomment %}
{% assign memberships  = site.data.memberships.memberships %}
{% assign mbr_kwh_csv  = "" %}
{% if memberships %}
  {% for m in memberships %}
    {% assign m_net  = m.network | downcase %}
    {% assign m_wkwh = 0.0 %}
    {% for entry in site.charging %}
      {% assign e_loc  = entry.location | downcase %}
      {% assign e_date = entry.date | date: "%Y-%m-%d" %}
      {% if e_loc contains m_net and e_date >= m.start and e_date <= m.end %}
        {% assign m_wkwh = m_wkwh | plus: entry.energy_kwh %}
      {% endif %}
    {% endfor %}
    {% assign mbr_kwh_csv = mbr_kwh_csv | append: m_wkwh | append: "," %}
  {% endfor %}
{% endif %}
{% assign mbr_kwh_arr = mbr_kwh_csv | split: "," %}

{% for entry in site.charging %}
  {% assign k          = entry.energy_kwh | times: 1.0 %}
  {% assign loc        = entry.location | downcase %}
  {% assign entry_date = entry.date | date: "%Y-%m-%d" %}
  {% assign veh        = entry.vehicle | default: "2025 Mach-E GT" %}

  {% comment %}
    ── Resolve home electricity rate from _data/rates.yml ──
    period.rate is a Ruby float — no string conversion needed.
  {% endcomment %}
  {% assign h_rate = 0.196 %}
  {% for period in site.data.rates.home_electricity %}
    {% if period.date <= entry_date %}
      {% assign h_rate = period.rate %}
    {% endif %}
  {% endfor %}

  {% comment %} ── Effective cost for this session ── {% endcomment %}
  {% if loc contains "home" %}
    {% assign c = k | times: h_rate | times: home_mult %}
  {% else %}
    {% assign c = entry.cost | times: 1.0 %}
  {% endif %}

  {% comment %} ── Add this session's kWh-weighted share of any active membership fee ── {% endcomment %}
  {% if memberships %}
    {% for m in memberships %}
      {% assign m_net = m.network | downcase %}
      {% if loc contains m_net and entry_date >= m.start and entry_date <= m.end %}
        {% assign m_wkwh = mbr_kwh_arr[forloop.index0] | times: 1.0 %}
        {% if m_wkwh > 0 %}
          {% assign m_share = m.fee | times: 1.0 | times: k | divided_by: m_wkwh %}
          {% assign c = c | plus: m_share %}
        {% endif %}
      {% endif %}
    {% endfor %}
  {% endif %}

  {% assign total_cost = total_cost | plus: c %}
  {% assign total_kwh  = total_kwh  | plus: k %}

  {% comment %} ── kWh by location bucket (for charts) ── {% endcomment %}
  {% if loc contains "work" %}           {% assign work_kwh   = work_kwh   | plus: k %}
  {% elsif loc contains "home" %}        {% assign home_kwh   = home_kwh   | plus: k %}
  {% elsif loc contains "tesla" %}       {% assign tesla_kwh  = tesla_kwh  | plus: k %}
  {% elsif loc contains "chargepoint" %} {% assign cp_kwh     = cp_kwh     | plus: k %}
  {% elsif loc contains "blink" %}       {% assign blink_kwh  = blink_kwh  | plus: k %}
  {% elsif loc contains "rivian" %}      {% assign rivian_kwh = rivian_kwh | plus: k %}
  {% elsif loc contains "electrify" %}   {% assign ea_kwh     = ea_kwh     | plus: k %}
  {% elsif loc contains "wecharge" %}    {% assign wc_kwh     = wc_kwh     | plus: k %}
  {% else %}                             {% assign other_kwh  = other_kwh  | plus: k %}
  {% endif %}

  {% comment %}
    ── Per-session gas savings from _data/rates.yml ──
    All values are Ruby floats — math works cleanly.
    MPG is then overridden per vehicle so LRB's 23mpg car
    is compared correctly vs RJB's 27mpg baseline.
  {% endcomment %}
  {% assign p_mpg       = 27   %}
  {% assign p_gas_price = 3.26 %}
  {% assign p_mi_kwh    = 3.0  %}
  {% for period in site.data.rates.gas_savings %}
    {% if period.date <= entry_date %}
      {% assign p_mpg       = period.mpg %}
      {% assign p_gas_price = period.gas_price %}
      {% assign p_mi_kwh    = period.mi_per_kwh %}
    {% endif %}
  {% endfor %}
  {% comment %} Per-vehicle MPG override {% endcomment %}
  {% if veh contains "LRB" %}
    {% assign p_mpg = 23 %}
  {% endif %}
  {% assign gas_equiv      = k | times: p_mi_kwh | divided_by: p_mpg | times: p_gas_price %}
  {% assign session_saving = gas_equiv | minus: c %}
  {% assign gas_savings    = gas_savings | plus: session_saving %}

  {% comment %} ── Per-vehicle cost/kWh accumulation ── {% endcomment %}
  {% assign veh_clean = veh | strip | downcase %}
  {% for odo in odometer_entries %}
    {% assign op             = odo | strip | split: " | " %}
    {% assign odo_vehicle    = op[0] | strip %}
    {% assign odo_date       = op[2] | strip %}
    {% assign odo_win_start  = op[5] | strip %}
    {% assign odo_vehicle_clean = odo_vehicle | strip | downcase %}
    {% if veh_clean == odo_vehicle_clean %}
      {% assign odo_idx = forloop.index0 %}
      {% comment %} Lifetime totals (veh_kwh/veh_cost) count EVERY session for this
         vehicle so they reconcile with the all-time Overall row. The tracked
         window — used only for the per-mile stats — is [first reading, last
         reading], so it's bounded below by odo_win_start and above by odo_date. {% endcomment %}
      {% assign in_window = false %}
      {% if odo_win_start != "" and entry_date >= odo_win_start and entry_date <= odo_date %}{% assign in_window = true %}{% endif %}
      {% case odo_idx %}
        {% when 0 %}
          {% assign veh_cost_0 = veh_cost_0 | plus: c %}
          {% assign veh_kwh_0  = veh_kwh_0  | plus: k %}
          {% if in_window %}{% assign veh_wcost_0 = veh_wcost_0 | plus: c %}{% assign veh_wkwh_0 = veh_wkwh_0 | plus: k %}{% endif %}
        {% when 1 %}
          {% assign veh_cost_1 = veh_cost_1 | plus: c %}
          {% assign veh_kwh_1  = veh_kwh_1  | plus: k %}
          {% if in_window %}{% assign veh_wcost_1 = veh_wcost_1 | plus: c %}{% assign veh_wkwh_1 = veh_wkwh_1 | plus: k %}{% endif %}
        {% when 2 %}
          {% assign veh_cost_2 = veh_cost_2 | plus: c %}
          {% assign veh_kwh_2  = veh_kwh_2  | plus: k %}
          {% if in_window %}{% assign veh_wcost_2 = veh_wcost_2 | plus: c %}{% assign veh_wkwh_2 = veh_wkwh_2 | plus: k %}{% endif %}
        {% when 3 %}
          {% assign veh_cost_3 = veh_cost_3 | plus: c %}
          {% assign veh_kwh_3  = veh_kwh_3  | plus: k %}
          {% if in_window %}{% assign veh_wcost_3 = veh_wcost_3 | plus: c %}{% assign veh_wkwh_3 = veh_wkwh_3 | plus: k %}{% endif %}
      {% endcase %}
    {% endif %}
  {% endfor %}

{% endfor %}

{% assign gas_savings = gas_savings | round: 0 %}

<div class="dash-container">
<script>(function(){
  var lnk = document.querySelector("link[rel~='icon']") || document.createElement('link');
  lnk.rel = 'icon';
  lnk.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔋</text></svg>";
  if (!lnk.parentNode) document.head.appendChild(lnk);
})();</script>

  <nav class="charge-nav">
    <a href="/charging/"          class="active">⚡ Dashboard</a>
    <a href="/charging-history/"             >📋 History</a>
    <a href="/charging-analytics/"           >📊 Analytics</a>
    <a href="/trip-calculator/"              >🧭 Trip</a>
  </nav>

  <div class="status-bar">
    <div class="status-item">
      <span class="status-label">Total Energy</span>
      <span class="status-value">{{ total_kwh | divided_by: 1000.0 | round: 2 }} MWh</span>
    </div>
    <div class="status-item">
      <span class="status-label">Actual Cost</span>
      {% assign tc_cents = total_cost | times: 100 | round | modulo: 100 %}
      <span class="status-value">${{ total_cost | split: "." | first }}.{% if tc_cents < 10 %}0{{ tc_cents }}{% else %}{{ tc_cents }}{% endif %}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Gas Savings</span>
      <span class="status-value" style="color: #2ecc71 !important;">${{ gas_savings }}</span>
      <span class="status-footnote">
        vs. gas car — rates vary by season<br>
        <a class="assumptions-link" href="#"
           onclick="var p=document.getElementById('gas-assumptions');p.style.display=p.style.display==='none'?'block':'none';return false;">
          see assumptions ↕
        </a>
      </span>
    </div>
    <div class="status-item">
      <span class="status-label">Analytics</span>
      <span class="status-value" style="font-size:1.4rem;">📊</span>
      <span class="status-footnote"><a href="/charging-analytics/" style="color:#3498db;font-weight:bold;text-decoration:none;">Full Analytics →</a><br>charts, maps, trends</span>
    </div>
  </div>

  <div id="gas-assumptions" class="assumptions-panel">
    <strong>Gas Savings Assumptions by Period</strong>
    <p style="font-size:0.78rem;color:#888;margin:4px 0 8px">The <em>mpg</em> column is the baseline for your car (27 mpg). LRB's sessions automatically use <strong>23 mpg</strong> regardless of this table — that override is hardcoded per-vehicle in the analytics and dashboard code.</p>
    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
    <table>
      <tr><th>From date</th><th>Baseline MPG</th><th>Gas $/gal</th><th>mi/kWh</th></tr>
      {% for period in site.data.rates.gas_savings %}
        <tr>
          <td>{{ period.date }}</td>
          <td>{{ period.mpg }} <small style="color:#888">(LRB's: 23)</small></td>
          <td>${{ period.gas_price }}</td>
          <td>{{ period.mi_per_kwh }}</td>
        </tr>
      {% endfor %}
    </table>
    </div>
    <br>
    <strong>Home Electricity Rates by Period</strong>
    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
    <table>
      <tr><th>From date</th><th>Rate ($/kWh)</th></tr>
      {% for period in site.data.rates.home_electricity %}
        <tr>
          <td>{{ period.date }}</td>
          <td>${{ period.rate }}</td>
        </tr>
      {% endfor %}
    </table>
    </div>
    <br>
    <strong>Per-Vehicle Battery Capacity (Usable kWh)</strong>
    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
    <table>
      <tr><th>Vehicle</th><th>Usable kWh</th><th>Chemistry</th></tr>
      <tr><td>2025 Mach-E GT</td><td>91.7 kWh</td><td>NCM Extended Range</td></tr>
      <tr><td>2026 Mach-E SR</td><td>72.6 kWh</td><td>LFP Standard Range</td></tr>
      <tr><td>LRB's 2025 Mach-E GT</td><td>91.7 kWh</td><td>NCM Extended Range</td></tr>
      <tr><td>LRB's 2026 Mach-E SR</td><td>72.6 kWh</td><td>LFP Standard Range</td></tr>
    </table>
    </div>
  </div>

  {% comment %} ── Cost per mile / efficiency cards ── {% endcomment %}
  <div class="cpm-grid">
    {% assign overall_odo_miles = 0 %}

    {% for odo in odometer_entries %}
      {% assign op             = odo | strip | split: " | " %}
      {% assign odo_vehicle    = op[0] | strip %}
      {% assign odo_miles      = op[1] | strip | plus: 0 %}
      {% assign odo_date       = op[2] | strip %}
      {% assign tracked_miles  = op[4] | strip | plus: 0 %}
      {% assign idx            = forloop.index0 %}

      {% assign overall_odo_miles = overall_odo_miles | plus: tracked_miles %}

      {% case idx %}
        {% when 0 %}{% assign v_cost = veh_cost_0 %}{% assign v_kwh = veh_kwh_0 %}{% assign vw_cost = veh_wcost_0 %}{% assign vw_kwh = veh_wkwh_0 %}
        {% when 1 %}{% assign v_cost = veh_cost_1 %}{% assign v_kwh = veh_kwh_1 %}{% assign vw_cost = veh_wcost_1 %}{% assign vw_kwh = veh_wkwh_1 %}
        {% when 2 %}{% assign v_cost = veh_cost_2 %}{% assign v_kwh = veh_kwh_2 %}{% assign vw_cost = veh_wcost_2 %}{% assign vw_kwh = veh_wkwh_2 %}
        {% when 3 %}{% assign v_cost = veh_cost_3 %}{% assign v_kwh = veh_kwh_3 %}{% assign vw_cost = veh_wcost_3 %}{% assign vw_kwh = veh_wkwh_3 %}
      {% endcase %}

      {% comment %} Per-mile rates use the WINDOWED charging (same period as tracked_miles). {% endcomment %}
      {% if tracked_miles > 0 %}
        {% assign cpm = vw_cost | divided_by: tracked_miles %}
        {% assign whpm = vw_kwh | divided_by: tracked_miles | times: 1000 | round %}
        {% if vw_kwh > 0 %}{% assign mpk = tracked_miles | times: 1.0 | divided_by: vw_kwh %}{% else %}{% assign mpk = 0 %}{% endif %}
      {% else %}
        {% assign cpm = 0 %}{% assign whpm = 0 %}{% assign mpk = 0 %}
      {% endif %}

      {% comment %} Only show per-mile metrics if we have enough odometer coverage {% endcomment %}
      {% assign show_per_mile = false %}
      {% if tracked_miles >= 500 %}{% assign show_per_mile = true %}{% endif %}
      {% assign cpm_cents = cpm | times: 100 | round | modulo: 100 %}
      {% assign vc_cents  = v_cost | times: 100 | round | modulo: 100 %}

      {% comment %} Border + chip = the car's real paint colour (which specific car);
         name text = owner's favourite colour (whose car — RJB purple, LRB orange). {% endcomment %}
      {% case odo_vehicle %}
        {% when "2025 Mach-E GT" %}       {% assign paint = "#C2A76C" %}{% assign owner_color = "#7b1fa2" %}{% comment %}Desert Sand{% endcomment %}
        {% when "2026 Mach-E SR" %}       {% assign paint = "#E31E2E" %}{% assign owner_color = "#7b1fa2" %}{% comment %}Race Red{% endcomment %}
        {% when "LRB's 2025 Mach-E GT" %} {% assign paint = "#B5176B" %}{% assign owner_color = "#f39c12" %}{% comment %}Molten Magenta{% endcomment %}
        {% when "LRB's 2026 Mach-E SR" %} {% assign paint = "#2E7D9E" %}{% assign owner_color = "#f39c12" %}{% comment %}Adriatic Blue{% endcomment %}
        {% else %}{% assign paint = "#7b7b7b" %}{% if odo_vehicle contains "LRB" %}{% assign owner_color = "#f39c12" %}{% else %}{% assign owner_color = "#7b1fa2" %}{% endif %}
      {% endcase %}
      {% assign row_accent = "border-left: 4px solid " | append: paint | append: ";" %}
      {% assign veh_color  = "color: " | append: owner_color | append: ";" %}

      <div class="cpm-row" style="{{ row_accent }}">
        <div class="cpm-vehicle" style="{{ veh_color }}">
          <span title="Paint colour" style="display:inline-block;width:11px;height:11px;border-radius:50%;background:{{ paint }};margin-right:7px;vertical-align:middle;border:1px solid rgba(128,128,128,0.35)"></span>{{ odo_vehicle }}
          <small style="color:#888">{{ odo_miles }} mi as of {{ odo_date }} · {{ tracked_miles }} mi tracked</small>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Cost / Mile</span>
          {% if show_per_mile %}
            <span class="cpm-stat-value">${{ cpm | split: "." | first }}.{% if cpm_cents < 10 %}0{{ cpm_cents }}{% else %}{{ cpm_cents }}{% endif %}</span>
          {% else %}
            <span class="cpm-stat-value" title="Add more odometer readings to mileage.yml — need 500+ tracked miles" style="color:#aaa">—</span>
            <span style="font-size:0.62rem;color:#aaa">need more odo data</span>
          {% endif %}
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">mi / kWh</span>
          {% if show_per_mile %}
            <span class="cpm-stat-value">{{ mpk | round: 2 }}</span>
          {% else %}
            <span class="cpm-stat-value" style="color:#aaa">—</span>
          {% endif %}
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Wh / Mile</span>
          {% if show_per_mile %}
            <span class="cpm-stat-value">{{ whpm }}</span>
          {% else %}
            <span class="cpm-stat-value" title="Add more odometer readings to mileage.yml — need 500+ tracked miles" style="color:#aaa">—</span>
          {% endif %}
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Total Charged</span>
          {% comment %} Show MWh to a fixed 2 decimals (hundredths-of-MWh integer math, same idiom as the cents formatting). {% endcomment %}
          {% assign v_mwh_x100 = v_kwh | divided_by: 10.0 | round %}
          {% assign v_mwh_whole = v_mwh_x100 | divided_by: 100 %}
          {% assign v_mwh_frac = v_mwh_x100 | modulo: 100 %}
          <span class="cpm-stat-value cpm-tip" tabindex="0" role="button" aria-label="{{ v_kwh | round: 1 }} kilowatt hours">{{ v_mwh_whole }}.{% if v_mwh_frac < 10 %}0{% endif %}{{ v_mwh_frac }} MWh<span class="cpm-tip-bubble">{{ v_kwh | round: 1 }} kWh</span></span>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Total Cost</span>
          <span class="cpm-stat-value">${{ v_cost | split: "." | first }}.{% if vc_cents < 10 %}0{{ vc_cents }}{% else %}{{ vc_cents }}{% endif %}</span>
        </div>
      </div>
    {% endfor %}

    {% if odometer_entries.size > 1 and overall_odo_miles > 0 %}
      {% comment %} Overall per-mile rates also use windowed charging (sum of the
         per-vehicle windowed sums), to match the combined tracked miles. {% endcomment %}
      {% assign overall_wcost = veh_wcost_0 | plus: veh_wcost_1 | plus: veh_wcost_2 | plus: veh_wcost_3 %}
      {% assign overall_wkwh  = veh_wkwh_0  | plus: veh_wkwh_1  | plus: veh_wkwh_2  | plus: veh_wkwh_3 %}
      {% assign overall_cpm = overall_wcost | divided_by: overall_odo_miles %}
      {% assign overall_whpm = overall_wkwh | divided_by: overall_odo_miles | times: 1000 | round %}
      {% if overall_wkwh > 0 %}{% assign overall_mpk = overall_odo_miles | times: 1.0 | divided_by: overall_wkwh %}{% else %}{% assign overall_mpk = 0 %}{% endif %}
      {% assign overall_cpm_cents = overall_cpm | times: 100 | round | modulo: 100 %}
      {% assign show_overall_per_mile = false %}
      {% if overall_odo_miles >= 500 %}{% assign show_overall_per_mile = true %}{% endif %}
      <div class="cpm-row cpm-overall">
        <div class="cpm-vehicle">
          Overall (all vehicles)
          <small>{{ overall_odo_miles }} combined miles tracked</small>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Cost / Mile</span>
          {% if show_overall_per_mile %}
            <span class="cpm-stat-value">${{ overall_cpm | split: "." | first }}.{% if overall_cpm_cents < 10 %}0{{ overall_cpm_cents }}{% else %}{{ overall_cpm_cents }}{% endif %}</span>
          {% else %}
            <span class="cpm-stat-value" style="color:#aaa">—</span>
            <span style="font-size:0.62rem;color:#aaa">need more odo data</span>
          {% endif %}
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">mi / kWh</span>
          {% if show_overall_per_mile %}
            <span class="cpm-stat-value">{{ overall_mpk | round: 2 }}</span>
          {% else %}
            <span class="cpm-stat-value" style="color:#aaa">—</span>
          {% endif %}
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Wh / Mile</span>
          {% if show_overall_per_mile %}
            <span class="cpm-stat-value">{{ overall_whpm }}</span>
          {% else %}
            <span class="cpm-stat-value" style="color:#aaa">—</span>
          {% endif %}
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Total Charged</span>
          {% assign tot_mwh_x100 = total_kwh | divided_by: 10.0 | round %}
          {% assign tot_mwh_whole = tot_mwh_x100 | divided_by: 100 %}
          {% assign tot_mwh_frac = tot_mwh_x100 | modulo: 100 %}
          <span class="cpm-stat-value cpm-tip" tabindex="0" role="button" aria-label="{{ total_kwh | round: 1 }} kilowatt hours">{{ tot_mwh_whole }}.{% if tot_mwh_frac < 10 %}0{% endif %}{{ tot_mwh_frac }} MWh<span class="cpm-tip-bubble">{{ total_kwh | round: 1 }} kWh</span></span>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Total Cost</span>
          {% assign tc_cents2 = total_cost | times: 100 | round | modulo: 100 %}
          <span class="cpm-stat-value">${{ total_cost | split: "." | first }}.{% if tc_cents2 < 10 %}0{{ tc_cents2 }}{% else %}{{ tc_cents2 }}{% endif %}</span>
        </div>
      </div>
    {% endif %}
    <p style="font-size:0.66rem;color:#888;margin:10px 4px 0;line-height:1.5">Cost/mile, mi/kWh &amp; Wh/mile are measured over the <strong>odometer-tracked period</strong> (between your earliest and latest readings, where miles are known) — so the energy in the numerator matches those miles. <strong>Total charged</strong> &amp; <strong>total cost</strong> are all-time.</p>
  </div>

  <script>
    /* Total-Charged tooltip: tap toggles the exact-kWh bubble on touch
       devices (where hover never fires); desktop also gets hover via CSS. */
    (function(){
      function closeTips(except){
        document.querySelectorAll('.cpm-tip.is-open').forEach(function(t){ if (t !== except) t.classList.remove('is-open'); });
      }
      document.addEventListener('click', function(e){
        var tip = e.target.closest('.cpm-tip');
        if (tip){ e.preventDefault(); var open = tip.classList.contains('is-open'); closeTips(tip); tip.classList.toggle('is-open', !open); }
        else { closeTips(null); }
      });
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeTips(null); });
    })();
  </script>

  <div class="media-grid">
    <div class="card">
      <h4 style="margin:0 0 15px 0; font-size:0.9rem;">Energy Distribution (MWh)</h4>
      <div style="position:relative;display:inline-block;width:100%">
        <canvas id="energyChart" height="200"></canvas>
        <div id="donutCenter" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;line-height:1.2">
          <div style="font-size:1.3rem;font-weight:700;color:var(--text)" id="donutTotalVal"></div>
          <div style="font-size:0.7rem;color:#888">MWh total</div>
        </div>
      </div>
      <div id="donutLegend" style="display:flex;justify-content:center;gap:20px;margin-top:10px;flex-wrap:wrap"></div>
    </div>
    <div class="card">
      <h4 style="margin:0 0 15px 0; font-size:0.9rem;">Ranked Energy (kWh)</h4>
      <canvas id="locationBarChart" height="200"></canvas>
    </div>
  </div>

  <div class="card" style="padding: 0;">
    <div style="padding: 15px; border-bottom: 1px solid var(--dash-border); display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; font-size: 1.1rem;">Recent Sessions</h3>
      <a href="/charging-history/" style="color: #3498db; font-weight: bold; text-decoration: none; font-size: 0.8rem;">View All →</a>
    </div>
    <div class="charging-table-wrap">
    <table class="charging-table">
      <thead><tr><th>Date</th><th>Location</th><th>Energy</th><th>Cost</th></tr></thead>
      <tbody>
        {% assign sorted = site.charging | sort: 'date' | reverse %}
        {% for log in sorted limit: 8 %}
          {% assign log_date = log.date | date: "%Y-%m-%d" %}
          {% assign log_loc  = log.location | downcase %}

          {% assign h_rate = 0.196 %}
          {% for period in site.data.rates.home_electricity %}
            {% if period.date <= log_date %}
              {% assign h_rate = period.rate %}
            {% endif %}
          {% endfor %}

          {% if log_loc contains "home" %}
            {% assign display_cost = log.energy_kwh | times: h_rate | times: home_mult %}
          {% else %}
            {% assign display_cost = log.cost | times: 1.0 %}
          {% endif %}
          {% assign cents = display_cost | times: 100 | round | modulo: 100 %}
        <tr>
          <td>{{ log.date | date: "%Y-%m-%d" }}</td>
          <td>
            <span class="badge
              {% assign l = log.location | downcase %}
              {% if l contains 'work' %}badge-work
              {% elsif l contains 'home' %}badge-home
              {% elsif l contains 'tesla' %}badge-tesla
              {% elsif l contains 'chargepoint' %}badge-cp
              {% elsif l contains 'blink' %}badge-blink
              {% elsif l contains 'rivian' %}badge-rivian
              {% elsif l contains 'electrify' %}badge-ea
              {% elsif l contains 'wecharge' %}badge-wc
              {% else %}badge-other{% endif %}">
              {{ log.location | truncate: 20 }}
            </span>
          </td>
          <td>{{ log.energy_kwh }} kWh</td>
          <td>{% if display_cost == 0 %}Free{% else %}${{ display_cost | split: "." | first }}.{% if cents < 10 %}0{{ cents }}{% else %}{{ cents }}{% endif %}{% endif %}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
<script>
  Chart.register(ChartDataLabels);
  Chart.defaults.animation = false;
  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
  const getThemeColor = () => isDark() ? '#eee' : '#333';

  const donutData = [
    { label: 'Work',       val: {{ work_kwh | divided_by: 1000.0 }}, color: '#0288d1' },
    { label: 'Home/Other', val: {{ total_kwh | minus: work_kwh | divided_by: 1000.0 }}, color: '#7b1fa2' }
  ];
  const donutTotal = donutData.reduce((s, d) => s + d.val, 0);

  const donutChart = new Chart(document.getElementById('energyChart'), {
    type: 'doughnut',
    data: {
      labels: donutData.map(d => d.label),
      datasets: [{
        data: donutData.map(d => d.val),
        backgroundColor: donutData.map(d => d.color),
        borderWidth: 0
      }]
    },
    options: {
      cutout: '65%',
      layout: { padding: 8 },
      plugins: {
        legend: { display: false },
        datalabels: { display: false }
      }
    }
  });

  (function buildDonutLegend() {
    document.getElementById('donutTotalVal').textContent = donutTotal.toFixed(2);
    const legend = document.getElementById('donutLegend');
    donutData.forEach(d => {
      const pct = donutTotal > 0 ? Math.round(d.val / donutTotal * 100) : 0;
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:0.78rem;';
      item.innerHTML = `<span style="width:9px;height:9px;border-radius:2px;background:${d.color};flex-shrink:0;display:inline-block"></span>`
        + `<span style="color:var(--text)">${d.label}</span>`
        + `<span style="color:#888;font-weight:600">${d.val.toFixed(2)} MWh (${pct}%)</span>`;
      legend.appendChild(item);
    });
  })();

  const rawData = [
    { label: 'Work',   val: {{ work_kwh }},   color: '#0288d1' },
    { label: 'Home',   val: {{ home_kwh }},   color: '#7b1fa2' },
    { label: 'Tesla',  val: {{ tesla_kwh }},  color: '#CC0000' },
    { label: 'CP',     val: {{ cp_kwh }},     color: '#FF7A14' },
    { label: 'Blink',  val: {{ blink_kwh }},  color: '#65A844' },
    { label: 'Rivian', val: {{ rivian_kwh }}, color: '#ffa500' },
    { label: 'EA',     val: {{ ea_kwh }},     color: '#00963f' },
    { label: 'WeCharge', val: {{ wc_kwh }},   color: '#51A950' },
    { label: 'Other',  val: {{ other_kwh }},  color: '#616161' }
  ].filter(d => d.val > 0).sort((a, b) => b.val - a.val);

  const barChart = new Chart(document.getElementById('locationBarChart'), {
    type: 'bar',
    data: {
      labels: rawData.map(d => d.label),
      datasets: [{ data: rawData.map(d => d.val), backgroundColor: rawData.map(d => d.color), borderRadius: 6 }]
    },
    options: {
      indexAxis: 'y',
      layout: { padding: { right: 80 } },
      plugins: {
        legend: { display: false },
        datalabels: {
          display: true,
          anchor: ctx => {
            const max = Math.max(...rawData.map(d => d.val));
            return rawData[ctx.dataIndex].val / max > 0.55 ? 'center' : 'end';
          },
          align: ctx => {
            const max = Math.max(...rawData.map(d => d.val));
            return rawData[ctx.dataIndex].val / max > 0.55 ? 'center' : 'end';
          },
          offset: 6,
          color: ctx => {
            const max = Math.max(...rawData.map(d => d.val));
            const d = rawData[ctx.dataIndex];
            if (d.val / max <= 0.55) return d.color;
            const hex = d.color.replace('#','');
            const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
            return (0.299*r + 0.587*g + 0.114*b) / 255 > 0.45 ? '#222' : '#fff';
          },
          font: { weight: '600', size: 12 },
          formatter: v => v >= 1000 ? (v / 1000).toFixed(2) + ' MWh' : Math.round(v) + ' kWh'
        }
      },
      scales: {
        x: { display: false, grid: { display: false } },
        y: {
          grid: { display: false },
          ticks: {
            color: ctx => rawData[ctx.index]?.color ?? getThemeColor(),
            font: { weight: '600' }
          }
        }
      }
    }
  });

  window.addEventListener('themeChanged', () => {
    donutChart.update();
    barChart.update();
  });
</script>
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

    {% comment %} Find the oldest odometer reading on or before first_session_date for this vehicle {% endcomment %}
    {% assign _first_odo = 0 %}
    {% for mentry in _mileage_asc %}
      {% if mentry.vehicle == entry.vehicle and mentry.date <= _first_date %}
        {% assign _first_odo = mentry.odometer %}
      {% endif %}
    {% endfor %}
    {% comment %} If no odo reading before first session, use earliest available reading {% endcomment %}
    {% if _first_odo == 0 %}
      {% for mentry in _mileage_asc %}
        {% if mentry.vehicle == entry.vehicle and _first_odo == 0 %}
          {% assign _first_odo = mentry.odometer %}
        {% endif %}
      {% endfor %}
    {% endif %}

    {% comment %} Miles driven during tracked period = current odo - odo at first session {% endcomment %}
    {% assign _tracked_miles = entry.odometer | minus: _first_odo %}
    {% if _tracked_miles <= 0 %}{% assign _tracked_miles = entry.odometer %}{% endif %}

    {% assign _row = entry.vehicle | append: " | " | append: entry.odometer | append: " | " | append: entry.date | append: " | " | append: _first_date | append: " | " | append: _tracked_miles | append: " |" %}
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
  .cpm-row { display: flex; background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 12px; padding: 16px 20px; align-items: center; gap: 20px; flex-wrap: wrap; }
  .cpm-vehicle { font-weight: bold; font-size: 0.9rem; flex: 1 1 160px; }
  .cpm-vehicle small { display: block; font-weight: normal; color: #888; font-size: 0.65rem; margin-top: 2px; }
  .cpm-stat { text-align: center; flex: 1 1 100px; }
  .cpm-stat-label { font-size: 0.6rem; text-transform: uppercase; color: #888; display: block; }
  .cpm-stat-value { font-size: 1.1rem; font-weight: bold; display: block; margin-top: 3px; }
  .cpm-overall { border-top: 2px solid var(--dash-border); }

  .assumptions-panel { display: none; background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 0.78rem; color: #888; }
  .assumptions-panel strong { color: var(--text); }
  .assumptions-panel table { width: 100%; margin-top: 8px; font-size: 0.75rem; border-collapse: collapse; }
  .assumptions-panel th { text-align: left; padding: 4px 8px; border-bottom: 1px solid var(--dash-border); color: var(--text); }
  .assumptions-panel td { padding: 4px 8px; }
  .assumptions-link { color: #888; font-size: 0.6rem; text-decoration: none; }

  .media-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
  .card { background: var(--dash-card); border: 1px solid var(--dash-border); padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

  .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; display: inline-block; }
  .badge-work   { background: #e3f2fd; color: #0288d1; }
  .badge-home   { background: #f3e5f5; color: #7b1fa2; }
  .badge-tesla  { background: #ffebee; color: #CC0000; }
  .badge-cp     { background: #fff3e0; color: #FF7A14; }
  .badge-blink  { background: #e8f5e9; color: #65A844; }
  .badge-rivian { background: #fffde7; color: #ffa500; }
  .badge-other  { background: #f5f5f5; color: #616161; }

  .charging-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85rem; color: var(--text) !important; }
  .charging-table th { background: var(--table-head); padding: 12px; text-align: left; border-bottom: 2px solid var(--dash-border); }
  .charging-table td { padding: 12px; border-bottom: 1px solid var(--dash-border); }
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

    /* CPM cards: tighter padding, stats wrap to 2-per-row */
    .cpm-row { padding: 12px 14px; gap: 12px; }
    .cpm-stat { flex: 1 1 80px; }

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
{% assign other_kwh   = 0.0 %}
{% assign veh_cost_0  = 0.0 %}
{% assign veh_kwh_0   = 0.0 %}
{% assign veh_cost_1  = 0.0 %}
{% assign veh_kwh_1   = 0.0 %}
{% assign veh_cost_2  = 0.0 %}
{% assign veh_kwh_2   = 0.0 %}
{% assign veh_cost_3  = 0.0 %}
{% assign veh_kwh_3   = 0.0 %}

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
    {% assign c = k | times: h_rate %}
  {% else %}
    {% assign c = entry.cost | times: 1.0 %}
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
    {% assign op          = odo | strip | split: " | " %}
    {% assign odo_vehicle = op[0] | strip %}
    {% assign odo_date    = op[2] | strip %}
    {% assign odo_vehicle_clean = odo_vehicle | strip | downcase %}
    {% if veh_clean == odo_vehicle_clean and entry_date <= odo_date %}
      {% assign odo_idx = forloop.index0 %}
      {% case odo_idx %}
        {% when 0 %}
          {% assign veh_cost_0 = veh_cost_0 | plus: c %}
          {% assign veh_kwh_0  = veh_kwh_0  | plus: k %}
        {% when 1 %}
          {% assign veh_cost_1 = veh_cost_1 | plus: c %}
          {% assign veh_kwh_1  = veh_kwh_1  | plus: k %}
        {% when 2 %}
          {% assign veh_cost_2 = veh_cost_2 | plus: c %}
          {% assign veh_kwh_2  = veh_kwh_2  | plus: k %}
        {% when 3 %}
          {% assign veh_cost_3 = veh_cost_3 | plus: c %}
          {% assign veh_kwh_3  = veh_kwh_3  | plus: k %}
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

  <!-- Cross-page charging nav -->
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--dash-border);">
    <a href="/charging/"         style="font-size:0.78rem;font-weight:700;color:#fff;text-decoration:none;padding:5px 14px;border:1px solid var(--link);border-radius:20px;background:var(--link)">⚡ Dashboard</a>
    <a href="/charging-history/" style="font-size:0.78rem;font-weight:600;color:#888;text-decoration:none;padding:5px 14px;border:1px solid var(--dash-border);border-radius:20px;background:var(--dash-card);transition:all 0.15s" onmouseover="this.style.borderColor='var(--link)';this.style.color='var(--link)'" onmouseout="this.style.borderColor='var(--dash-border)';this.style.color='#888'">📋 History</a>
    <a href="/charging-analytics/" style="font-size:0.78rem;font-weight:600;color:#888;text-decoration:none;padding:5px 14px;border:1px solid var(--dash-border);border-radius:20px;background:var(--dash-card);transition:all 0.15s" onmouseover="this.style.borderColor='var(--link)';this.style.color='var(--link)'" onmouseout="this.style.borderColor='var(--dash-border)';this.style.color='#888'">📊 Analytics</a>
  </div>

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
        {% when 0 %}{% assign v_cost = veh_cost_0 %}{% assign v_kwh = veh_kwh_0 %}
        {% when 1 %}{% assign v_cost = veh_cost_1 %}{% assign v_kwh = veh_kwh_1 %}
        {% when 2 %}{% assign v_cost = veh_cost_2 %}{% assign v_kwh = veh_kwh_2 %}
        {% when 3 %}{% assign v_cost = veh_cost_3 %}{% assign v_kwh = veh_kwh_3 %}
      {% endcase %}

      {% if tracked_miles > 0 %}
        {% assign cpm = v_cost | divided_by: tracked_miles %}
        {% assign kpm = v_kwh  | divided_by: tracked_miles %}
      {% else %}
        {% assign cpm = 0 %}{% assign kpm = 0 %}
      {% endif %}

      {% comment %} Only show per-mile metrics if we have enough odometer coverage {% endcomment %}
      {% assign show_per_mile = false %}
      {% if tracked_miles >= 500 %}{% assign show_per_mile = true %}{% endif %}
      {% assign cpm_cents = cpm | times: 100 | round | modulo: 100 %}
      {% assign vc_cents  = v_cost | times: 100 | round | modulo: 100 %}

      {% assign is_lrb = false %}
      {% if odo_vehicle contains "LRB" %}{% assign is_lrb = true %}{% endif %}
      {% if is_lrb %}
        {% assign row_accent = "border-left: 4px solid #f39c12;" %}
        {% assign veh_color  = "color: #f39c12;" %}
      {% else %}
        {% assign row_accent = "border-left: 4px solid #7b1fa2;" %}
        {% assign veh_color  = "color: #7b1fa2;" %}
      {% endif %}

      <div class="cpm-row" style="{{ row_accent }}">
        <div class="cpm-vehicle" style="{{ veh_color }}">
          {{ odo_vehicle }}
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
          <span class="cpm-stat-label">kWh / Mile</span>
          {% if show_per_mile %}
            <span class="cpm-stat-value">{{ kpm | round: 3 }}</span>
          {% else %}
            <span class="cpm-stat-value" title="Add more odometer readings to mileage.yml — need 500+ tracked miles" style="color:#aaa">—</span>
          {% endif %}
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Total Charged</span>
          <span class="cpm-stat-value">{{ v_kwh | round: 1 }} kWh</span>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Total Cost</span>
          <span class="cpm-stat-value">${{ v_cost | split: "." | first }}.{% if vc_cents < 10 %}0{{ vc_cents }}{% else %}{{ vc_cents }}{% endif %}</span>
        </div>
      </div>
    {% endfor %}

    {% if odometer_entries.size > 1 and overall_odo_miles > 0 %}
      {% assign overall_cpm = total_cost | divided_by: overall_odo_miles %}
      {% assign overall_kpm = total_kwh  | divided_by: overall_odo_miles %}
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
          <span class="cpm-stat-label">kWh / Mile</span>
          {% if show_overall_per_mile %}
            <span class="cpm-stat-value">{{ overall_kpm | round: 3 }}</span>
          {% else %}
            <span class="cpm-stat-value" style="color:#aaa">—</span>
          {% endif %}
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Total Charged</span>
          <span class="cpm-stat-value">{{ total_kwh | round: 1 }} kWh</span>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Total Cost</span>
          {% assign tc_cents2 = total_cost | times: 100 | round | modulo: 100 %}
          <span class="cpm-stat-value">${{ total_cost | split: "." | first }}.{% if tc_cents2 < 10 %}0{{ tc_cents2 }}{% else %}{{ tc_cents2 }}{% endif %}</span>
        </div>
      </div>
    {% endif %}
  </div>

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
            {% assign display_cost = log.energy_kwh | times: h_rate %}
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
    { label: 'Other',  val: {{ other_kwh }},  color: '#616161' }
  ].filter(d => d.val > 0).sort((a, b) => b.val - a.val);

  const barChart = new Chart(document.getElementById('locationBarChart'), {
    type: 'bar',
    data: {
      labels: rawData.map(d => d.label),
      datasets: [{ data: rawData.map(d => d.val), backgroundColor: rawData.map(d => d.color), borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false }, datalabels: { display: false } },
      scales: {
        x: { grid: { color: isDark() ? '#444' : '#ddd' }, ticks: { color: '#888' }, display: true },
        y: { grid: { display: false }, ticks: { color: getThemeColor() } }
      }
    }
  });

  window.addEventListener('themeChanged', () => {
    const color = getThemeColor();
    donutChart.update();
    barChart.options.scales.y.ticks.color = color;
    barChart.options.scales.x.grid.color = isDark() ? '#444' : '#ddd';
    barChart.update();
  });
</script>
---
layout: page
title: Charging History
permalink: /charging-history/
---

{% comment %}
=============================================================
  HOME ELECTRICITY RATE CONFIGURATION
  Update the two values below when your rate changes:
    home_rate_per_kwh : your current rate in dollars per kWh
    home_rate_effective_date : the date (YYYY-MM-DD) from which
      this rate applies. Sessions at Home BEFORE this date will
      use the cost stored in the file. Sessions at Home ON OR
      AFTER this date will have their cost calculated automatically.
  When your rate changes again, update both values and set
  home_rate_effective_date to the date of the first new session.
=============================================================
{% endcomment %}
{% assign home_rate_per_kwh = 0.17 %}
{% assign home_rate_effective_date = "2025-08-22" %}

<style>
  .history-container { color: var(--text); }
  .summary-bar { display: flex; gap: 20px; background: #2c3e50; color: white; padding: 15px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
  .summary-item { flex: 1; text-align: center; }
  .summary-label { font-size: 0.6rem; text-transform: uppercase; color: #bdc3c7; }
  .summary-value { font-size: 1.2rem; font-weight: bold; display: block; }

  /* Filter bar — two rows: top for brand, bottom for the rest */
  .filter-bar { background: var(--dash-card); padding: 16px 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid var(--dash-border); }
  .filter-row { display: grid; gap: 12px; align-items: end; margin-bottom: 10px; }
  .filter-row:last-child { margin-bottom: 0; }
  .filter-row-brand { grid-template-columns: 1fr 1fr auto; }
  .filter-row-other  { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
  .filter-group { display: flex; flex-direction: column; gap: 5px; }
  .filter-group label { font-size: 0.65rem; text-transform: uppercase; font-weight: bold; color: #888; }
  select { padding: 8px; border-radius: 6px; border: 1px solid var(--dash-border); background: var(--bg); color: var(--text); font-size: 0.8rem; }
  .btn-reset { padding: 8px 15px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold; align-self: flex-end; }

  .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; display: inline-block; }
  .badge-work { background: #e3f2fd; color: #01579b; }
  .badge-home { background: #f3e5f5; color: #4a148c; }
  .badge-tesla { background: #ffebee; color: #CC0000; }
  .badge-cp { background: #fff3e0; color: #e65100; }
  .badge-blink { background: #e8f5e9; color: #65A844; }
  .badge-rivian { background: #fffde7; color: #ff8f00; }
  .badge-other { background: #f5f5f5; color: #424242; }

  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; color: var(--text) !important; margin-top: 10px; }
  th { background: var(--table-head); padding: 12px; border: 1px solid var(--dash-border); text-align: left; }
  td { padding: 12px; border: 1px solid var(--dash-border); }

  /* Notes tooltip — wider, shorter, horizontal */
  .note-icon { position: relative; cursor: default; font-size: 1rem; display: inline-block; }
  .note-tooltip {
    display: none;
    position: absolute;
    bottom: 130%;
    left: 50%;
    transform: translateX(-50%);
    background: #2c3e50;
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.78rem;
    line-height: 1.4;
    white-space: nowrap;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  .note-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #2c3e50;
  }
  .note-icon:hover .note-tooltip { display: block; }
</style>

<div class="history-container">
  <h1>Full Charging History</h1>

  <div class="summary-bar" id="filterSummary">
    <div class="summary-item"><span class="summary-label">Filtered Energy</span><span class="summary-value" id="sumEnergy">0 kWh</span></div>
    <div class="summary-item"><span class="summary-label">Filtered Cost</span><span class="summary-value" id="sumCost">$0.00</span></div>
    <div class="summary-item"><span class="summary-label">Sessions</span><span class="summary-value" id="sumCount">0</span></div>
  </div>

  <div class="filter-bar">
    <!-- Row 1: Brand + Location (nested under brand) + Reset -->
    <div class="filter-row filter-row-brand">
      <div class="filter-group">
        <label>Brand</label>
        <select id="brandFilter" onchange="onBrandChange()">
          <option value="">All Brands</option>
          <option value="home">Home</option>
          <option value="work">Work</option>
          <option value="tesla">Tesla</option>
          <option value="chargepoint">ChargePoint</option>
          <option value="rivian">Rivian</option>
          <option value="blink">Blink</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Location</label>
        <select id="locFilter" onchange="applyFilters()">
          <option value="">All Locations</option>
        </select>
      </div>
      <button class="btn-reset" onclick="resetFilters()">Reset All</button>
    </div>
    <!-- Row 2: Year, Vehicle, Cost -->
    <div class="filter-row filter-row-other">
      <div class="filter-group">
        <label>Year</label>
        <select id="yearFilter" onchange="applyFilters()">
          <option value="">All Years</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Vehicle</label>
        <select id="vehFilter" onchange="applyFilters()"><option value="">All Vehicles</option></select>
      </div>
      <div class="filter-group">
        <label>Cost</label>
        <select id="costFilter" onchange="applyFilters()">
          <option value="">All Types</option>
          <option value="free">Free Only</option>
          <option value="paid">Paid Only</option>
        </select>
      </div>
    </div>
  </div>

  <table id="history-table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Location</th>
        <th>Vehicle</th>
        <th>Energy (kWh)</th>
        <th>Cost</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      {% assign all_logs = site.charging | sort: 'date' | reverse %}
      {% for log in all_logs %}
        {% assign log_date = log.date | date: "%Y-%m-%d" %}
        {% assign log_loc = log.location | downcase %}

        {% comment %} Apply home rate for entries on or after the effective date {% endcomment %}
        {% if log_loc contains "home" and log_date >= home_rate_effective_date %}
          {% assign display_cost = log.energy_kwh | times: home_rate_per_kwh %}
          {% assign cost_data = display_cost %}
        {% else %}
          {% assign display_cost = log.cost | plus: 0 %}
          {% assign cost_data = log.cost %}
        {% endif %}

        {% comment %} Determine brand for filtering {% endcomment %}
        {% if log_loc contains "work" %}{% assign brand = "work" %}
        {% elsif log_loc contains "home" %}{% assign brand = "home" %}
        {% elsif log_loc contains "tesla" %}{% assign brand = "tesla" %}
        {% elsif log_loc contains "chargepoint" %}{% assign brand = "chargepoint" %}
        {% elsif log_loc contains "rivian" %}{% assign brand = "rivian" %}
        {% elsif log_loc contains "blink" %}{% assign brand = "blink" %}
        {% else %}{% assign brand = "other" %}{% endif %}

      <tr class="log-row"
        data-year="{{ log.date | date: '%Y' }}"
        data-loc="{{ log.location }}"
        data-brand="{{ brand }}"
        data-veh="{{ log.vehicle }}"
        data-kwh="{{ log.energy_kwh }}"
        data-cost="{{ cost_data }}"
        data-type="{% if cost_data > 0 %}paid{% else %}free{% endif %}">
        <td>{{ log.date | date: "%Y-%m-%d" }}</td>
        <td>{% assign l = log.location | downcase %}<span class="badge {% if l contains 'work' %}badge-work{% elsif l contains 'home' %}badge-home{% elsif l contains 'tesla' %}badge-tesla{% elsif l contains 'chargepoint' %}badge-cp{% elsif l contains 'blink' %}badge-blink{% elsif l contains 'rivian' %}badge-rivian{% else %}badge-other{% endif %}">{{ log.location }}</span></td>
        <td style="opacity: 0.6;">{{ log.vehicle | default: "2025 Mach-E GT" }}</td>
        <td>{{ log.energy_kwh }}</td>
        <td>{% if display_cost == 0 %}Free{% else %}${{ display_cost | round: 2 | append: "" | split: "." | first }}{% assign cents = display_cost | round: 2 | times: 100 | round | modulo: 100 %}{% if cents < 10 %}.0{{ cents }}{% else %}.{{ cents }}{% endif %}{% endif %}</td>
        <td>
          {% if log.notes and log.notes != "" %}
            <span class="note-icon">📝
              <span class="note-tooltip">{{ log.notes }}</span>
            </span>
          {% endif %}
        </td>
      </tr>
      {% endfor %}
    </tbody>
  </table>
</div>

<script>
// All unique locations keyed by brand — built from table rows
const brandLocMap = {};

function initFilters() {
  const vehicles = new Set();

  document.querySelectorAll('.log-row').forEach(row => {
    const brand = row.getAttribute('data-brand');
    const loc   = row.getAttribute('data-loc');
    const veh   = row.getAttribute('data-veh');

    if (!brandLocMap[brand]) brandLocMap[brand] = new Set();
    brandLocMap[brand].add(loc);
    vehicles.add(veh);
  });

  const vehSel = document.getElementById('vehFilter');
  Array.from(vehicles).sort().forEach(v => vehSel.add(new Option(v, v)));

  applyFilters();
}

function onBrandChange() {
  const brand = document.getElementById('brandFilter').value;
  const locSel = document.getElementById('locFilter');

  // Reset location dropdown
  locSel.innerHTML = '<option value="">All Locations</option>';

  if (brand && brandLocMap[brand]) {
    Array.from(brandLocMap[brand]).sort().forEach(loc => {
      locSel.add(new Option(loc, loc));
    });
  }

  applyFilters();
}

function applyFilters() {
  const year     = document.getElementById('yearFilter').value;
  const brand    = document.getElementById('brandFilter').value;
  const loc      = document.getElementById('locFilter').value;
  const veh      = document.getElementById('vehFilter').value;
  const costType = document.getElementById('costFilter').value;

  let totalKwh = 0, totalCost = 0, count = 0;

  document.querySelectorAll('.log-row').forEach(row => {
    const matchYear  = !year     || row.getAttribute('data-year')  === year;
    const matchBrand = !brand    || row.getAttribute('data-brand') === brand;
    const matchLoc   = !loc      || row.getAttribute('data-loc')   === loc;
    const matchVeh   = !veh      || row.getAttribute('data-veh')   === veh;
    const matchCost  = !costType || row.getAttribute('data-type')  === costType;

    if (matchYear && matchBrand && matchLoc && matchVeh && matchCost) {
      row.style.display = "";
      totalKwh  += parseFloat(row.getAttribute('data-kwh'));
      totalCost += parseFloat(row.getAttribute('data-cost'));
      count++;
    } else {
      row.style.display = "none";
    }
  });

  document.getElementById('sumEnergy').innerText = totalKwh.toFixed(1) + " kWh";
  document.getElementById('sumCost').innerText   = "$" + totalCost.toFixed(2);
  document.getElementById('sumCount').innerText  = count;
}

function resetFilters() {
  document.getElementById('brandFilter').value = '';
  document.getElementById('locFilter').innerHTML = '<option value="">All Locations</option>';
  document.querySelectorAll('#yearFilter, #vehFilter, #costFilter').forEach(s => s.value = '');
  applyFilters();
}

window.onload = initFilters;
</script>
---
layout: page
title: Charging History
permalink: /charging-history/
---

<style>
  .history-container { color: var(--text); }
  .filter-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; background: var(--dash-card); padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid var(--dash-border); align-items: end; }
  .filter-group { display: flex; flex-direction: column; gap: 5px; }
  .filter-group label { font-size: 0.65rem; text-transform: uppercase; font-weight: bold; color: #888; }
  select { padding: 8px; border-radius: 6px; border: 1px solid var(--dash-border); background: var(--bg); color: var(--text); font-size: 0.8rem; outline: none; }
  .btn-reset { padding: 8px 15px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold; transition: opacity 0.2s; }
  .btn-reset:hover { opacity: 0.8; }
  
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
</style>

<div class="history-container">
  <h1>Full Charging History</h1>
  
  <div class="filter-bar">
    <div class="filter-group"><label>Year</label><select id="yearFilter" onchange="applyFilters()"><option value="">All Years</option></select></div>
    <div class="filter-group"><label>Location</label><select id="locFilter" onchange="applyFilters()"><option value="">All Locations</option></select></div>
    <div class="filter-group"><label>Vehicle</label><select id="vehFilter" onchange="applyFilters()"><option value="">All Vehicles</option></select></div>
    <div class="filter-group"><label>Cost</label><select id="costFilter" onchange="applyFilters()"><option value="">All Types</option><option value="free">Free Only</option><option value="paid">Paid Only</option></select></div>
    <button class="btn-reset" onclick="resetFilters()">Reset All</button>
  </div>

  <table id="history-table">
    <thead><tr><th>Date</th><th>Location</th><th>Vehicle</th><th>Energy (kWh)</th><th>Cost</th></tr></thead>
    <tbody>
      {% assign all_logs = site.data.charging | sort: 'date' | reverse %}{% for log in all_logs %}
      <tr class="log-row" data-year="{{ log.date | slice: 0, 4 }}" data-loc="{{ log.location }}" data-veh="{{ log.vehicle | default: '2025 Mustang Mach-e GT' }}" data-cost="{% if log.cost > 0 %}paid{% else %}free{% endif %}">
        <td>{{ log.date }}</td>
        <td>{% assign l = log.location | downcase %}<span class="badge {% if l contains 'work' %}badge-work{% elsif l contains 'home' %}badge-home{% elsif l contains 'tesla' %}badge-tesla{% elsif l contains 'chargepoint' %}badge-cp{% elsif l contains 'blink' %}badge-blink{% elsif l contains 'rivian' %}badge-rivian{% else %}badge-other{% endif %}">{{ log.location }}</span></td>
        <td style="opacity: 0.6;">{{ log.vehicle | default: "2025 Mach-E GT" }}</td>
        <td>{{ log.energy_kwh }}</td>
        <td>{% if log.cost == 0 %}Free{% else %}${{ log.cost | plus: 0.0001 | round: 2 }}{% endif %}</td>
      </tr>{% endfor %}
    </tbody>
  </table>
</div>

<script>
function initFilters() {
  const years = new Set(); const locations = new Set(); const vehicles = new Set();
  document.querySelectorAll('.log-row').forEach(row => {
    years.add(row.getAttribute('data-year'));
    locations.add(row.getAttribute('data-loc'));
    vehicles.add(row.getAttribute('data-veh'));
  });
  
  const populate = (id, set) => {
    const s = document.getElementById(id);
    Array.from(set).sort().forEach(val => { s.add(new Option(val, val)); });
  };

  populate('yearFilter', years);
  populate('locFilter', locations);
  populate('vehFilter', vehicles);
}

function applyFilters() {
  const year = document.getElementById('yearFilter').value;
  const loc = document.getElementById('locFilter').value;
  const veh = document.getElementById('vehFilter').value;
  const cost = document.getElementById('costFilter').value;
  
  document.querySelectorAll('.log-row').forEach(row => {
    const matchYear = !year || row.getAttribute('data-year') === year;
    const matchLoc = !loc || row.getAttribute('data-loc') === loc;
    const matchVeh = !veh || row.getAttribute('data-veh') === veh;
    const matchCost = !cost || row.getAttribute('data-cost') === cost;
    row.style.display = (matchYear && matchLoc && matchVeh && matchCost) ? "" : "none";
  });
}

function resetFilters() {
  document.querySelectorAll('select').forEach(s => s.value = "");
  applyFilters();
}

window.onload = initFilters;
</script>
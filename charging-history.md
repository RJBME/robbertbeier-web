---
layout: page
title: Charging History
permalink: /charging-history/
---

<style>
  .history-container { color: var(--text); }
  .filter-bar { 
    display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; 
    background: var(--dash-card); padding: 20px; border-radius: 12px; margin-bottom: 25px; 
    border: 1px solid var(--dash-border);
  }
  .filter-group { display: flex; flex-direction: column; gap: 5px; }
  .filter-group label { font-size: 0.7rem; text-transform: uppercase; font-weight: bold; color: #888; }
  select { padding: 8px; border-radius: 6px; border: 1px solid var(--dash-border); background: var(--bg); color: var(--text); font-size: 0.85rem; }

  .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; display: inline-block; }
  .badge-work { background: #e3f2fd; color: #01579b; }
  .badge-home { background: #f3e5f5; color: #4a148c; }
  .badge-tesla { background: #ffebee; color: #CC0000; }
  .badge-cp { background: #fff3e0; color: #e65100; }
  .badge-blink { background: #e8f5e9; color: #65A844; }
  .badge-rivian { background: #fffde7; color: #ff8f00; }
  .badge-other { background: #f5f5f5; color: #424242; }

  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; color: var(--text) !important; }
  th { background: var(--table-head); padding: 12px; border: 1px solid var(--dash-border); text-align: left; }
  td { padding: 12px; border: 1px solid var(--dash-border); }
</style>

<div class="history-container">
  <h1>Charging History</h1>

  <div class="filter-bar">
    <div class="filter-group">
      <label>Year</label>
      <select id="yearFilter" onchange="applyFilters()">
        <option value="">All Years</option>
        <option value="2025">2025</option>
        <option value="2026">2026</option>
      </select>
    </div>
    <div class="filter-group">
      <label>Location</label>
      <select id="locFilter" onchange="applyFilters()">
        <option value="">All Locations</option>
        <option value="work">Work</option>
        <option value="home">Home</option>
        <option value="tesla">Tesla</option>
        <option value="chargepoint">ChargePoint</option>
        <option value="blink">Blink</option>
      </select>
    </div>
    <div class="filter-group">
      <label>Vehicle</label>
      <select id="vehFilter" onchange="applyFilters()">
        <option value="">All Vehicles</option>
        <option value="2025 Mustang Mach-e GT">2025 Mach-e GT</option>
        <option value="2026 Mach-e">2026 Mach-e (Future)</option>
      </select>
    </div>
    <div class="filter-group">
      <label>Type</label>
      <select id="costFilter" onchange="applyFilters()">
        <option value="">All Entries</option>
        <option value="free">Free Only</option>
        <option value="paid">Paid Only</option>
      </select>
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
      </tr>
    </thead>
    <tbody>
      {% assign all_logs = site.data.charging | sort: 'date' | reverse %}
      {% for log in all_logs %}
      <tr class="log-row" 
          data-year="{{ log.date | slice: 0, 4 }}" 
          data-loc="{{ log.location | downcase }}" 
          data-veh="{{ log.vehicle | default: '2025 Mustang Mach-e GT' | downcase }}"
          data-cost="{% if log.cost > 0 %}paid{% else %}free{% endif %}">
        <td>{{ log.date }}</td>
        <td>
          {% assign loc = log.location | downcase %}
          <span class="badge {% if loc contains 'work' %}badge-work{% elsif loc contains 'home' %}badge-home{% elsif loc contains 'tesla' %}badge-tesla{% elsif loc contains 'chargepoint' %}badge-cp{% elsif loc contains 'blink' %}badge-blink{% elsif loc contains 'rivian' %}badge-rivian{% else %}badge-other{% endif %}">
            {{ log.location }}
          </span>
        </td>
        <td style="opacity: 0.6;">{{ log.vehicle | default: "2025 Mach-E GT" }}</td>
        <td>{{ log.energy_kwh }}</td>
        <td>{% if log.cost == 0 %}Free{% else %}${{ log.cost | plus: 0.0001 | round: 2 }}{% endif %}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>
</div>

<script>
function applyFilters() {
  const year = document.getElementById('yearFilter').value;
  const loc = document.getElementById('locFilter').value;
  const veh = document.getElementById('vehFilter').value.toLowerCase();
  const cost = document.getElementById('costFilter').value;
  
  const rows = document.querySelectorAll('.log-row');

  rows.forEach(row => {
    const rYear = row.getAttribute('data-year');
    const rLoc = row.getAttribute('data-loc');
    const rVeh = row.getAttribute('data-veh');
    const rCost = row.getAttribute('data-cost');

    const matchYear = !year || rYear === year;
    const matchLoc = !loc || rLoc.includes(loc);
    const matchVeh = !veh || rVeh.includes(veh);
    const matchCost = !cost || rCost === cost;

    row.style.display = (matchYear && matchLoc && matchVeh && matchCost) ? "" : "none";
  });
}
</script>
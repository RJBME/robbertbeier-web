---
layout: page
title: Mach-E Charging Analytics
permalink: /charging/
---

<style>
  .dash-container { font-family: -apple-system, sans-serif; max-width: 1000px; margin: auto; }
  
  /* The Dark Bar from your sketch */
  .status-bar { 
    display: flex; background: #1a1a1a; color: white; padding: 20px; border-radius: 12px; 
    justify-content: space-around; text-align: center; margin-bottom: 25px;
  }
  .status-item { flex: 1; border-right: 1px solid #333; }
  .status-item:last-child { border-right: none; }
  .status-label { font-size: 0.7rem; text-transform: uppercase; color: #888; display: block; }
  .status-value { font-size: 1.5rem; font-weight: bold; display: block; margin-top: 5px; }

  /* Grid Layout for Chart + Placeholders */
  .media-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-bottom: 30px; }
  .card { background: #fff; border: 1px solid #eaeaea; padding: 20px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
  .placeholder-column { display: flex; flex-direction: column; gap: 20px; }
  .placeholder { background: #fafafa; border: 2px dashed #eee; color: #ccc; display: flex; align-items: center; justify-content: center; border-radius: 12px; min-height: 100px; }

  /* Formatted Table */
  .charging-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85rem; }
  .charging-table th { background: #f9f9f9; padding: 12px; text-align: left; border-bottom: 2px solid #eee; color: #666; }
  .charging-table td { padding: 12px; border-bottom: 1px solid #eee; }
  .vehicle-tag { font-size: 0.7rem; background: #eee; padding: 2px 6px; border-radius: 4px; color: #666; }
</style>

{% assign total_cost = 0.0 %}
{% assign total_kwh = 0.0 %}
{% assign work_kwh = 0.0 %}
{% assign home_kwh = 0.0 %}

{% for entry in site.data.charging %}
  {% assign c = entry.cost | plus: 0 %}
  {% assign k = entry.energy_kwh | plus: 0 %}
  {% assign total_cost = total_cost | plus: c %}
  {% assign total_kwh = total_kwh | plus: k %}
  {% if entry.location == "Work" %}{% assign work_kwh = work_kwh | plus: k %}{% else %}{% assign home_kwh = home_kwh | plus: k %}{% endif %}
{% endfor %}

{% assign mwh = total_kwh | divided_by: 1000.0 %}
{% assign gas_savings = total_kwh | times: 3.0 | divided_by: 23 | times: 2.50 | minus: total_cost %}

<div class="dash-container">
  
  <div class="status-bar">
    <div class="status-item">
      <span class="status-label">Lifetime Energy</span>
      <span class="status-value">{{ mwh | round: 2 }} MWh</span>
    </div>
    <div class="status-item">
      <span class="status-label">Total Cost</span>
      <span class="status-value">${{ total_cost | round: 2 }}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Gas Savings</span>
      <span class="status-value" style="color: #2ecc71;">${{ gas_savings | round: 0 }}</span>
    </div>
  </div>

  <div class="media-grid">
    <div class="card">
      <h4 style="margin: 0 0 15px 0; font-size: 0.9rem;">Work vs Home Energy</h4>
      <canvas id="energyChart" height="180"></canvas>
    </div>
    <div class="placeholder-column">
      <div class="placeholder card">Future Metric A</div>
      <div class="placeholder card">Future Metric B</div>
    </div>
  </div>

  <div class="card" style="padding: 0;">
    <div style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; font-size: 1.1rem;">Recent Sessions</h3>
      <span style="font-size: 0.8rem; color: #999;">Last 10 Entries</span>
    </div>
    <table class="charging-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Vehicle</th>
          <th>Location</th>
          <th>Energy</th>
          <th>Cost</th>
        </tr>
      </thead>
      <tbody>
        {% assign sorted = site.data.charging | reverse %}
        {% for log in sorted limit: 10 %}
        <tr>
          <td>{{ log.date }}</td>
          <td><span class="vehicle-tag">{{ log.vehicle | default: "2025 Mach-E GT" }}</span></td>
          <td>{{ log.location }}</td>
          <td>{{ log.energy_kwh }} kWh</td>
          <td>{% if log.cost == 0 %}FREE{% else %}${{ log.cost | plus: 0.0001 | round: 2 }}{% endif %}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
    <div style="padding: 20px; text-align: center; border-top: 1px solid #eee;">
       <a href="/charging-history/" style="color: #3498db; font-weight: bold; text-decoration: none;">View All Data →</a>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  new Chart(document.getElementById('energyChart'), {
    type: 'doughnut',
    data: {
      labels: ['Work', 'Home/Other'],
      datasets: [{ data: [{{ work_kwh }}, {{ home_kwh }}], backgroundColor: ['#3498db', '#9b59b6'], borderWidth: 0 }]
    },
    options: { cutout: '75%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } } }
  });
</script>
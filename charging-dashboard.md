---
layout: page
title: Mach-E Charging Analytics
permalink: /charging/
---

<style>
  .dash-container { font-family: -apple-system, sans-serif; max-width: 1000px; margin: auto; }
  
  /* The Dark Bar from Sketch */
  .status-bar { 
    display: flex; background: #2c3e50; color: white; padding: 20px; border-radius: 12px; 
    justify-content: space-around; text-align: center; margin-bottom: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }
  .status-item { flex: 1; border-right: 1px solid #455a64; }
  .status-item:last-child { border-right: none; }
  .status-label { font-size: 0.75rem; text-transform: uppercase; color: #bdc3c7; display: block; }
  .status-value { font-size: 1.6rem; font-weight: bold; display: block; margin-top: 5px; }

  /* The Grid from Sketch */
  .media-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-bottom: 30px; }
  .chart-card { background: white; border: 1px solid #eee; padding: 20px; border-radius: 12px; }
  .placeholder-column { display: flex; flex-direction: column; gap: 20px; }
  .placeholder-card { background: #f9f9f9; border: 2px dashed #ddd; padding: 30px; border-radius: 12px; text-align: center; color: #999; flex: 1; }

  /* Table Style */
  .charging-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; margin-top: 20px; }
  .charging-table th { background: #f1f1f1; padding: 12px; text-align: left; font-size: 0.8rem; }
  .charging-table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 0.9rem; }
</style>

{% assign total_cost = 0.0 %}
{% assign total_kwh = 0.0 %}
{% assign work_kwh = 0.0 %}
{% assign home_kwh = 0.0 %}

{% for entry in site.data.charging %}
  {% assign cost = entry.cost | plus: 0 %}
  {% assign kwh = entry.energy_kwh | plus: 0 %}
  {% assign total_cost = total_cost | plus: cost %}
  {% assign total_kwh = total_kwh | plus: kwh %}
  {% if entry.location == "Work" %}
    {% assign work_kwh = work_kwh | plus: kwh %}
  {% else %}
    {% assign home_kwh = home_kwh | plus: kwh %}
  {% endif %}
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
      <span class="status-label">Real Savings</span>
      <span class="status-value" style="color: #2ecc71;">${{ gas_savings | round: 0 }}</span>
    </div>
  </div>

  <div class="media-grid">
    <div class="chart-card">
      <h4 style="margin: 0 0 15px 0;">Energy Distribution</h4>
      <canvas id="energyChart" height="200"></canvas>
    </div>
    <div class="placeholder-column">
      <div class="placeholder-card">Placeholder Card A</div>
      <div class="placeholder-card">Placeholder Card B</div>
    </div>
  </div>

  <h3>Charging Logs</h3>
  <table class="charging-table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Location</th>
        <th>Energy</th>
        <th>Cost</th>
      </tr>
    </thead>
    <tbody>
      {% assign sorted = site.data.charging | reverse %}
      {% for log in sorted limit: 8 %}
      <tr>
        <td>{{ log.date }}</td>
        <td>{{ log.location }}</td>
        <td>{{ log.energy_kwh }} kWh</td>
        <td>{% if log.cost == 0 %}FREE{% else %}${{ log.cost | plus: 0.0001 | round: 2 }}{% endif %}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>

</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  const ctx = document.getElementById('energyChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Work (Free)', 'Home/Paid'],
      datasets: [{
        data: [{{ work_kwh }}, {{ home_kwh }}],
        backgroundColor: ['#3498db', '#9b59b6'],
        borderWidth: 0
      }]
    },
    options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
  });
</script>
---
layout: page
title: Charging
permalink: /charging/
nav_order: 3
---

<style>
  .dash-container { font-family: -apple-system, sans-serif; max-width: 1000px; margin: auto; }
  .status-bar { display: flex; background: #1a1a1a; color: white; padding: 20px; border-radius: 12px; justify-content: space-around; text-align: center; margin-bottom: 25px; }
  .status-item { flex: 1; border-right: 1px solid #333; }
  .status-item:last-child { border-right: none; }
  .status-label { font-size: 0.7rem; text-transform: uppercase; color: #888; display: block; }
  .status-value { font-size: 1.5rem; font-weight: bold; display: block; margin-top: 5px; }
  .media-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-bottom: 30px; }
  .card { background: #fff; border: 1px solid #eaeaea; padding: 20px; border-radius: 12px; }
  .charging-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85rem; }
  .charging-table th { background: #f9f9f9; padding: 12px; text-align: left; border-bottom: 2px solid #eee; color: #666; }
  .charging-table td { padding: 12px; border-bottom: 1px solid #eee; }
  
  .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; }
  .badge-work { background: #e1f5fe; color: #0288d1; }
  .badge-home { background: #f3e5f5; color: #7b1fa2; }
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
{% assign work_mwh = work_kwh | divided_by: 1000.0 %}
{% assign home_mwh = home_kwh | divided_by: 1000.0 %}
{% assign gas_savings = total_kwh | times: 3.0 | divided_by: 23 | times: 2.50 | minus: total_cost %}

<div class="dash-container">
  <div class="status-bar">
    <div class="status-item"><span class="status-label">Lifetime Energy</span><span class="status-value">{{ mwh | round: 2 }} MWh</span></div>
    <div class="status-item"><span class="status-label">Total Cost</span><span class="status-value">${{ total_cost | round: 2 }}</span></div>
    <div class="status-item"><span class="status-label">Gas Savings</span><span class="status-value" style="color: #2ecc71;">${{ gas_savings | round: 0 }}</span></div>
  </div>

  <div class="media-grid">
    <div class="card">
      <h4 style="margin: 0 0 15px 0; font-size: 0.9rem;">Energy Mix (MWh)</h4>
      <canvas id="energyChart" height="200"></canvas>
    </div>
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div class="card" style="text-align:center; color: #ccc;">Future Metric A</div>
      <div class="card" style="text-align:center; color: #ccc;">Future Metric B</div>
    </div>
  </div>

  <div class="card" style="padding: 0;">
    <div style="padding: 15px; border-bottom: 1px solid #eee;">
      <h3 style="margin: 0; font-size: 1.1rem;">Recent Sessions</h3>
    </div>
    <table class="charging-table">
      <thead>
        <tr><th>Date</th><th>Location</th><th>Vehicle</th><th>Energy</th><th>Cost</th></tr>
      </thead>
      <tbody>
        {% assign sorted = site.data.charging | reverse %}
        {% for log in sorted limit: 10 %}
        <tr>
          <td>{{ log.date }}</td>
          <td>
            <span class="badge {% if log.location == 'Work' %}badge-work{% else %}badge-home{% endif %}">
              {{ log.location }}
            </span>
          </td>
          <td style="color: #999; font-size: 0.75rem;">{{ log.vehicle | default: "2025 Mach-E GT" }}</td>
          <td>{{ log.energy_kwh }} kWh</td>
          <td>{% if log.cost == 0 %}FREE{% else %}${{ log.cost | plus: 0.0001 | round: 2 }}{% endif %}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
    <div style="padding: 20px; text-align: center; border-top: 1px solid #eee;">
       <a href="/charging-history/" style="color: #0288d1; font-weight: bold; text-decoration: none;">View Full History →</a>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>
<script>
  const ctx = document.getElementById('energyChart');
  new Chart(ctx, {
    type: 'doughnut',
    plugins: [ChartDataLabels],
    data: {
      labels: ['Work', 'Home/Other'],
      datasets: [{
        data: [{{ work_mwh }}, {{ home_mwh }}],
        backgroundColor: ['#0288d1', '#7b1fa2'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12 } },
        datalabels: {
          display: true,
          color: '#fff',
          formatter: (value) => value.toFixed(2) + ' MWh',
          font: { weight: 'bold', size: 12 }
        }
      }
    }
  });
</script>
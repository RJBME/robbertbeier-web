---
layout: page
title: Charging
permalink: /charging/
---

<style>
  .dash-container { font-family: -apple-system, sans-serif; max-width: 1000px; margin: auto; color: var(--text); }
  
  .status-bar { display: flex; background: #000000; color: #ffffff !important; padding: 20px; border-radius: 12px; justify-content: space-around; text-align: center; margin-bottom: 25px; }
  .status-item { flex: 1; border-right: 1px solid #333; }
  .status-item:last-child { border-right: none; }
  .status-label { font-size: 0.7rem; text-transform: uppercase; color: #888; display: block; }
  .status-value { font-size: 1.5rem; font-weight: bold; display: block; margin-top: 5px; color: #fff !important; }
  
  .media-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-bottom: 30px; }
  .card { background: var(--dash-card); border: 1px solid var(--dash-border); padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

  .charging-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85rem; color: var(--text); }
  .charging-table th { background: var(--table-head); padding: 12px; text-align: left; border-bottom: 2px solid var(--dash-border); color: var(--text); }
  .charging-table td { padding: 12px; border-bottom: 1px solid var(--dash-border); color: var(--text); }
  
  /* Brand Pills */
  .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; display: inline-block; }
  .badge-work { background: #e3f2fd; color: #0288d1; }
  .badge-home { background: #f3e5f5; color: #7b1fa2; }
  .badge-tesla { background: #ffebee; color: #CC0000; }
  .badge-cp { background: #fff3e0; color: #FF7A14; }
  .badge-blink { background: #f1f8e9; color: #65A844; }
  .badge-rivian { background: #fffde7; color: #ef6c00; }
  .badge-other { background: #f5f5f5; color: #616161; }
</style>

{% assign total_cost = 0.0 %}
{% assign total_kwh = 0.0 %}
{% assign work_kwh = 0.0 %}
{% assign home_kwh = 0.0 %}

{% for entry in site.data.charging %}
  {% assign c = entry.cost | plus: 0 %}{% assign k = entry.energy_kwh | plus: 0 %}
  {% assign total_cost = total_cost | plus: c %}{% assign total_kwh = total_kwh | plus: k %}
  {% if entry.location == "Work" %}{% assign work_kwh = work_kwh | plus: k %}{% else %}{% assign home_kwh = home_kwh | plus: k %}{% endif %}
{% endfor %}

<div class="dash-container">
  <div class="status-bar">
    <div class="status-item"><span class="status-label">Energy</span><span class="status-value">{{ total_kwh | divided_by: 1000.0 | round: 2 }} MWh</span></div>
    <div class="status-item"><span class="status-label">Cost</span><span class="status-value">${{ total_cost | round: 2 }}</span></div>
    <div class="status-item"><span class="status-label">Savings</span><span class="status-value" style="color: #2ecc71 !important;">${{ total_kwh | times: 3.0 | divided_by: 23 | times: 2.50 | minus: total_cost | round: 0 }}</span></div>
  </div>

  <div class="media-grid">
    <div class="card">
      <h4 style="margin: 0 0 15px 0; font-size: 0.9rem;">Energy Distribution</h4>
      <canvas id="energyChart" height="180"></canvas>
    </div>
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div class="card" style="text-align:center; opacity: 0.5;">Placeholder A</div>
      <div class="card" style="text-align:center; opacity: 0.5;">Placeholder B</div>
    </div>
  </div>

  <div class="card" style="padding: 0; overflow-x: auto;">
    <div style="padding: 15px; border-bottom: 1px solid var(--dash-border);">
      <h3 style="margin: 0; font-size: 1.1rem;">Recent Sessions</h3>
    </div>
    <table class="charging-table">
      <thead>
        <tr><th>Date</th><th>Location</th><th>Energy</th><th>Cost</th></tr>
      </thead>
      <tbody>
        {% assign sorted = site.data.charging | reverse %}
        {% for log in sorted limit: 10 %}
        <tr>
          <td>{{ log.date }}</td>
          <td>
            {% assign loc = log.location | downcase %}
            <span class="badge {% if loc contains 'work' %}badge-work{% elsif loc contains 'home' %}badge-home{% elsif loc contains 'tesla' %}badge-tesla{% elsif loc contains 'chargepoint' %}badge-cp{% elsif loc contains 'blink' %}badge-blink{% else %}badge-other{% endif %}">
              {{ log.location | truncate: 15 }}
            </span>
          </td>
          <td>{{ log.energy_kwh }} kWh</td>
          <td>{% if log.cost == 0 %}FREE{% else %}${{ log.cost | plus: 0.0001 | round: 2 }}{% endif %}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
    <div style="padding: 20px; text-align: center;">
       <a href="/charging-history/" style="color: #3498db; font-weight: bold; text-decoration: none;">View All Sessions →</a>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>
<script>
  Chart.register(ChartDataLabels);
  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
  
  const chargerChart = new Chart(document.getElementById('energyChart'), {
    type: 'doughnut',
    data: {
      labels: ['Work', 'Home/Other'],
      datasets: [{
        data: [{{ work_kwh }}, {{ home_kwh }}],
        backgroundColor: ['#0288d1', '#7b1fa2'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { color: isDark() ? '#eee' : '#333' } },
        datalabels: {
          display: true, color: '#fff',
          formatter: (v) => (v/1000).toFixed(2) + ' MWh',
          font: { weight: 'bold', size: 11 }
        }
      }
    }
  });

  // Listen for theme changes to update chart text color
  document.getElementById('theme-toggle').addEventListener('click', () => {
    setTimeout(() => {
      chargerChart.options.plugins.legend.labels.color = isDark() ? '#eee' : '#333';
      chargerChart.update();
    }, 100);
  });
</script>
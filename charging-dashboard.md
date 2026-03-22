---
layout: page
title: Charging
permalink: /charging/
---

<style>
  .dash-container { font-family: -apple-system, sans-serif; max-width: 1000px; margin: auto; color: var(--text); }
  .status-bar { display: flex; background: var(--dash-card); color: var(--text); padding: 20px; border-radius: 12px; justify-content: space-around; text-align: center; margin-bottom: 25px; border: 1px solid var(--dash-border); }
  .status-item { flex: 1; border-right: 1px solid var(--dash-border); }
  .status-item:last-child { border-right: none; }
  .status-label { font-size: 0.7rem; text-transform: uppercase; color: #888; display: block; }
  .status-value { font-size: 1.5rem; font-weight: bold; display: block; margin-top: 5px; color: var(--text) !important; }
  .media-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-bottom: 30px; }
  .card { background: var(--dash-card); border: 1px solid var(--dash-border); padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .charging-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85rem; color: var(--text) !important; }
  .charging-table th { background: var(--table-head); padding: 12px; text-align: left; border-bottom: 2px solid var(--dash-border); }
  .charging-table td { padding: 12px; border-bottom: 1px solid var(--dash-border); }
  
  .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; display: inline-block; }
  .badge-work { background: #e3f2fd; color: #0288d1; }
  .badge-home { background: #f3e5f5; color: #7b1fa2; }
  .badge-tesla { background: #ffebee; color: #CC0000; }
  .badge-cp { background: #fff3e0; color: #FF7A14; }
  .badge-blink { background: #e8f5e9; color: #65A844; }
  .badge-rivian { background: #fffde7; color: #ffa500; }
  .badge-other { background: #f5f5f5; color: #616161; }
</style>

{% assign total_cost = 0.0 %}{% assign total_kwh = 0.0 %}
{% assign work_kwh = 0.0 %}{% assign home_kwh = 0.0 %}{% assign tesla_kwh = 0.0 %}{% assign cp_kwh = 0.0 %}{% assign blink_kwh = 0.0 %}{% assign rivian_kwh = 0.0 %}{% assign other_kwh = 0.0 %}

{% for entry in site.data.charging %}
  {% assign c = entry.cost | plus: 0 %}{% assign k = entry.energy_kwh | plus: 0 %}
  {% assign total_cost = total_cost | plus: c %}{% assign total_kwh = total_kwh | plus: k %}
  {% assign loc = entry.location | downcase %}
  {% if loc contains "work" %}{% assign work_kwh = work_kwh | plus: k %}
  {% elsif loc contains "home" %}{% assign home_kwh = home_kwh | plus: k %}
  {% elsif loc contains "tesla" %}{% assign tesla_kwh = tesla_kwh | plus: k %}
  {% elsif loc contains "chargepoint" %}{% assign cp_kwh = cp_kwh | plus: k %}
  {% elsif loc contains "blink" %}{% assign blink_kwh = blink_kwh | plus: k %}
  {% elsif loc contains "rivian" %}{% assign rivian_kwh = rivian_kwh | plus: k %}
  {% else %}{% assign other_kwh = other_kwh | plus: k %}{% endif %}
{% endfor %}

<div class="dash-container">
  <div class="status-bar">
    <div class="status-item"><span class="status-label">Energy</span><span class="status-value">{{ total_kwh | divided_by: 1000.0 | round: 2 }} MWh</span></div>
    <div class="status-item"><span class="status-label">Actual Cost</span><span class="status-value">${{ total_cost | round: 2 }}</span></div>
    <div class="status-item"><span class="status-label">Gas Savings</span><span class="status-value" style="color: #2ecc71 !important;">${{ total_kwh | times: 3.0 | divided_by: 23 | times: 2.50 | minus: total_cost | round: 0 }}</span></div>
  </div>

  <div class="media-grid">
    <div class="card">
      <h4 style="margin: 0 0 15px 0; font-size: 0.9rem;">Energy Mix by Location (kWh)</h4>
      <canvas id="locationBarChart" height="150"></canvas>
    </div>
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div class="card">
        <h4 style="margin: 0 0 10px 0; font-size: 0.8rem; color: #888;">Charging Efficiency</h4>
        <div style="font-size: 1.8rem; font-weight: bold;">3.0 <span style="font-size: 0.9rem; color: #aaa;">mi/kWh</span></div>
      </div>
      <div class="card" style="text-align:center; opacity: 0.5;">Placeholder B</div>
    </div>
  </div>

  <div class="card" style="padding: 0;">
    <div style="padding: 15px; border-bottom: 1px solid var(--dash-border);">
      <h3 style="margin: 0; font-size: 1.1rem;">Recent Sessions</h3>
    </div>
    <table class="charging-table">
      <thead><tr><th>Date</th><th>Location</th><th>Energy</th><th>Cost</th></tr></thead>
      <tbody>
        {% assign sorted = site.data.charging | reverse %}{% for log in sorted limit: 8 %}
        <tr>
          <td>{{ log.date }}</td>
          <td><span class="badge {% assign l = log.location | downcase %}{% if l contains 'work' %}badge-work{% elsif l contains 'home' %}badge-home{% elsif l contains 'tesla' %}badge-tesla{% elsif l contains 'chargepoint' %}badge-cp{% elsif l contains 'blink' %}badge-blink{% elsif l contains 'rivian' %}badge-rivian{% else %}badge-other{% endif %}">{{ log.location | truncate: 15 }}</span></td>
          <td>{{ log.energy_kwh }} kWh</td>
          <td>{% if log.cost == 0 %}Free{% else %}${{ log.cost | plus: 0.0001 | round: 2 }}{% endif %}</td>
        </tr>{% endfor %}
      </tbody>
    </table>
    <div style="padding: 20px; text-align: center;"><a href="/charging-history/" style="color: #3498db; font-weight: bold; text-decoration: none;">View All Sessions →</a></div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
  const barCtx = document.getElementById('locationBarChart').getContext('2d');
  const barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['Work', 'Home', 'Tesla', 'CP', 'Blink', 'Rivian', 'Other'],
      datasets: [{
        data: [{{ work_kwh }}, {{ home_kwh }}, {{ tesla_kwh }}, {{ cp_kwh }}, {{ blink_kwh }}, {{ rivian_kwh }}, {{ other_kwh }}],
        backgroundColor: ['#0288d1', '#7b1fa2', '#CC0000', '#FF7A14', '#65A844', '#ffa500', '#616161'],
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: { 
        x: { grid: { display: false }, ticks: { color: '#888' } },
        y: { grid: { display: false }, ticks: { color: isDark() ? '#eee' : '#333' } }
      }
    }
  });
  window.addEventListener('themeChanged', () => { barChart.options.scales.y.ticks.color = isDark() ? '#eee' : '#333'; barChart.update(); });
</script>
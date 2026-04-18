---
layout: page
title: Charging
permalink: /charging/
---

{% comment %}
=============================================================
  HOME ELECTRICITY RATE CONFIGURATION
  ─────────────────────────────────────────────────────────
  Update the two values below when your electricity rate
  changes (e.g. after a new utility bill cycle).

  home_rate_per_kwh
    Your current home electricity rate in dollars per kWh.
    Check your DTE or Consumers Energy bill for the exact
    rate. It's usually listed as "Energy Charge" per kWh.

  home_rate_effective_date
    The date (YYYY-MM-DD) of the FIRST charging session
    that should use this new rate. Sessions at Home BEFORE
    this date use the cost already stored in the file.
    Sessions at Home ON OR AFTER this date have their cost
    calculated automatically using home_rate_per_kwh.

  HOW TO UPDATE WHEN YOUR RATE CHANGES:
    1. Find the date of your next Home charging session.
    2. Update home_rate_per_kwh to your new rate.
    3. Update home_rate_effective_date to that session date.
    4. Save, commit, and push. Done.
=============================================================
{% endcomment %}
{% assign home_rate_per_kwh        = 0.17 %}
{% assign home_rate_effective_date = "2025-08-22" %}

{% comment %}
=============================================================
  GAS SAVINGS CALCULATION — PERIOD-BASED CONFIGURATION
  ─────────────────────────────────────────────────────────
  Gas savings are calculated per session using the rates
  that were in effect on the date of that session. This
  lets you reflect seasonal changes in gas prices and
  Mach-E efficiency accurately over time.

  FORMULA (per session):
    gas_equivalent = kWh × miles_per_kwh ÷ mpg × gas_price
    session_saving = gas_equivalent − actual_session_cost
    total_savings  = sum of all session_savings

  THE PERIOD TABLE — gas_periods:
  ─────────────────────────────────────────────────────────
  Each line in gas_periods defines one time period.
  Format (one period per line, pipe-separated):
    YYYY-MM-DD | mpg | gas_$/gal | mi/kWh |

  RULES:
    • List periods in CHRONOLOGICAL ORDER, earliest first.
    • The first period covers all sessions from the very
      beginning of your data up until the next period starts.
    • Each session uses the LAST period whose start date is
      on or before the session date — i.e. the most recent
      applicable period.
    • Always keep a trailing pipe | at the end of each line.

  FIELD DESCRIPTIONS:
    YYYY-MM-DD   Start date of this period (YYYY-MM-DD).
    mpg          MPG of the gas car you're comparing against.
                 23 = US average mid-size sedan.
                 Use your old car's actual MPG for a personal
                 comparison (e.g. 28 if your old car got 28).
    gas_$/gal    Average gas price in dollars per gallon.
                 Update seasonally or when prices shift.
                 Check GasBuddy for current Michigan average.
    mi/kWh       Your Mach-E GT's real-world efficiency.
                 ~3.0 is a reasonable summer baseline.
                 Drop to ~2.5 in winter (cold reduces range).
                 Check FordPass for your rolling average.

  HOW TO ADD A NEW PERIOD:
    1. Decide the start date (first session under new rates).
    2. Add a new line in date order using the format above.
    3. Save, commit, push. The page recalculates automatically.

  EXAMPLE — if gas jumps to $3.50 on June 1 2026:
    2026-06-01 | 23 | 3.50 | 3.0 |
=============================================================
{% endcomment %}
{% assign gas_periods = "
2025-08-22 | 23 | 2.50 | 3.0 |
2025-11-01 | 23 | 2.75 | 2.5 |
2026-03-01 | 23 | 2.50 | 3.0 |
" | strip | split: "
" %}

<style>
  .dash-container { font-family: -apple-system, sans-serif; max-width: 1000px; margin: auto; color: var(--text); }
  .status-bar { display: flex; background: var(--dash-card); color: var(--text); padding: 20px; border-radius: 12px; justify-content: space-around; text-align: center; margin-bottom: 25px; border: 1px solid var(--dash-border); }
  .status-item { flex: 1; border-right: 1px solid var(--dash-border); }
  .status-item:last-child { border-right: none; }
  .status-label { font-size: 0.7rem; text-transform: uppercase; color: #888; display: block; }
  .status-value { font-size: 1.5rem; font-weight: bold; display: block; margin-top: 5px; color: var(--text) !important; }
  .status-footnote { font-size: 0.65rem; color: #888; display: block; margin-top: 4px; line-height: 1.4; }

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
</style>

{% comment %} ── Accumulate totals across all sessions ── {% endcomment %}
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

{% for entry in site.charging %}
  {% assign k          = entry.energy_kwh | plus: 0 %}
  {% assign loc        = entry.location | downcase %}
  {% assign entry_date = entry.date | date: "%Y-%m-%d" %}

  {% comment %} ── Effective electricity cost for this session ── {% endcomment %}
  {% if loc contains "home" and entry_date >= home_rate_effective_date %}
    {% assign c = k | times: home_rate_per_kwh %}
  {% else %}
    {% assign c = entry.cost | plus: 0 %}
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
    ── Per-session gas savings using period-aware rates ──
    Walk the gas_periods list and keep updating the period
    variables as long as the period start date <= session date.
    After the loop the variables hold the correct period for
    this session.
  {% endcomment %}
  {% assign p_mpg       = 23   %}
  {% assign p_gas_price = 2.50 %}
  {% assign p_mi_kwh    = 3.0  %}

  {% for period in gas_periods %}
    {% assign parts = period | strip | split: " | " %}
    {% if parts[0] <= entry_date %}
      {% assign p_mpg       = parts[1] | plus: 0 %}
      {% assign p_gas_price = parts[2] | plus: 0 %}
      {% assign p_mi_kwh    = parts[3] | plus: 0 %}
    {% endif %}
  {% endfor %}

  {% assign gas_equiv      = k | times: p_mi_kwh | divided_by: p_mpg | times: p_gas_price %}
  {% assign session_saving = gas_equiv | minus: c %}
  {% assign gas_savings    = gas_savings | plus: session_saving %}
{% endfor %}

{% assign gas_savings = gas_savings | round: 0 %}

<div class="dash-container">

  <div class="status-bar">
    <div class="status-item">
      <span class="status-label">Total Energy</span>
      <span class="status-value">{{ total_kwh | divided_by: 1000.0 | round: 2 }} MWh</span>
    </div>
    <div class="status-item">
      <span class="status-label">Actual Cost</span>
      <span class="status-value">${{ total_cost | round: 2 }}</span>
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
  </div>

  {% comment %} Expandable assumptions panel — lists every gas period {% endcomment %}
  <div id="gas-assumptions" class="assumptions-panel">
    <strong>Gas Savings Assumptions by Period</strong>
    <table>
      <tr>
        <th>From date</th>
        <th>vs. MPG</th>
        <th>Gas $/gal</th>
        <th>mi/kWh</th>
      </tr>
      {% for period in gas_periods %}
        {% assign parts = period | strip | split: " | " %}
        <tr>
          <td>{{ parts[0] }}</td>
          <td>{{ parts[1] }}</td>
          <td>${{ parts[2] }}</td>
          <td>{{ parts[3] }}</td>
        </tr>
      {% endfor %}
    </table>
  </div>

  <div class="media-grid">
    <div class="card">
      <h4 style="margin:0 0 15px 0; font-size:0.9rem;">Energy Distribution (MWh)</h4>
      <canvas id="energyChart" height="200"></canvas>
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
    <table class="charging-table">
      <thead><tr><th>Date</th><th>Location</th><th>Energy</th><th>Cost</th></tr></thead>
      <tbody>
        {% assign sorted = site.charging | reverse %}
        {% for log in sorted limit: 8 %}
          {% assign log_date = log.date | date: "%Y-%m-%d" %}
          {% assign log_loc  = log.location | downcase %}
          {% if log_loc contains "home" and log_date >= home_rate_effective_date %}
            {% assign display_cost = log.energy_kwh | times: home_rate_per_kwh %}
          {% else %}
            {% assign display_cost = log.cost | plus: 0 %}
          {% endif %}
          {% assign cents = display_cost | round: 2 | times: 100 | round | modulo: 100 %}
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
          <td>{% if display_cost == 0 %}Free{% else %}${{ display_cost | round: 2 | split: "." | first }}.{% if cents < 10 %}0{{ cents }}{% else %}{{ cents }}{% endif %}{% endif %}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>
<script>
  Chart.register(ChartDataLabels);
  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
  const getThemeColor = () => isDark() ? '#eee' : '#333';

  const donutChart = new Chart(document.getElementById('energyChart'), {
    type: 'doughnut',
    data: {
      labels: ['Work', 'Home/Other'],
      datasets: [{
        data: [{{ work_kwh | divided_by: 1000.0 }}, {{ total_kwh | minus: work_kwh | divided_by: 1000.0 }}],
        backgroundColor: ['#0288d1', '#7b1fa2'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getThemeColor(),
            usePointStyle: false,
            boxWidth: 14,
            padding: 16
          }
        },
        datalabels: {
          display: true,
          color: '#ffffff',
          formatter: (v) => v.toFixed(2) + ' MWh',
          font: { weight: 'bold', size: 13 },
          textShadowColor: 'rgba(0,0,0,0.6)',
          textShadowBlur: 4
        }
      }
    }
  });

  const rawData = [
    { label: 'Work',   val: {{ work_kwh }},   color: '#0288d1' },
    { label: 'Home',   val: {{ home_kwh }},   color: '#7b1fa2' },
    { label: 'Tesla',  val: {{ tesla_kwh }},  color: '#CC0000' },
    { label: 'CP',     val: {{ cp_kwh }},     color: '#FF7A14' },
    { label: 'Blink',  val: {{ blink_kwh }},  color: '#65A844' },
    { label: 'Rivian', val: {{ rivian_kwh }}, color: '#ffa500' },
    { label: 'Other',  val: {{ other_kwh }},  color: '#616161' }
  ].sort((a, b) => b.val - a.val);

  const barChart = new Chart(document.getElementById('locationBarChart'), {
    type: 'bar',
    data: {
      labels: rawData.map(d => d.label),
      datasets: [{
        data: rawData.map(d => d.val),
        backgroundColor: rawData.map(d => d.color),
        borderRadius: 4
      }]
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
    donutChart.options.plugins.legend.labels.color = color;
    donutChart.update();
    barChart.options.scales.y.ticks.color = color;
    barChart.options.scales.x.grid.color = isDark() ? '#444' : '#ddd';
    barChart.update();
  });
</script>
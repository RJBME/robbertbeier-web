---
layout: page
title: Charging
permalink: /charging/
---

{% comment %}
=============================================================
  HOME ELECTRICITY RATE — PERIOD-BASED CONFIGURATION
  ─────────────────────────────────────────────────────────
  Each Home charging session automatically uses the rate
  that was in effect on the date it occurred. Historical
  sessions are never recalculated when you add a new period.

  FORMAT (one period per line, pipe-separated):
    YYYY-MM-DD | rate_per_kwh |

  RULES:
    • List periods in CHRONOLOGICAL ORDER, earliest first.
    • The first period covers ALL Home sessions from the
      very beginning of your data up to the next period.
    • Each session uses the LAST period whose start date
      is on or before the session date.
    • Always keep a trailing pipe | at the end of each line.
    • Rate is in dollars per kWh. Check your DTE or
      Consumers Energy bill — look for "Energy Charge per kWh".
      If you have a tiered or time-of-use rate, use your
      blended average (total bill cost ÷ total kWh used).

  HOW TO ADD A NEW RATE PERIOD:
    1. Find the date of your next Home charging session.
    2. Add a new line at the bottom in date order.
    3. Save, commit, push. All future Home sessions use
       the new rate; all past ones stay unchanged.

  EXAMPLE — if your rate goes up to $0.19 on June 1 2026:
    2026-06-01 | 0.19 |
=============================================================
{% endcomment %}
{% assign home_rate_periods = "
2025-08-22 | 0.196 |
2025-09-18 | 0.191 |
2025-10-18 | 0.174 |
2025-11-18 | 0.181 |
2025-12-19 | 0.178 |
2026-01-21 | 0.181 |
2026-02-19 | 0.204 |
" | strip | split: "
" %}

{% comment %}
=============================================================
  GAS SAVINGS CALCULATION — PERIOD-BASED CONFIGURATION
  ─────────────────────────────────────────────────────────
  Gas savings are calculated per session using the rates
  that were in effect on the date of that session.

  FORMULA (per session):
    gas_equivalent = kWh × miles_per_kwh ÷ mpg × gas_price
    session_saving = gas_equivalent − actual_session_cost
    total_savings  = sum of all session_savings

  FORMAT (one period per line, pipe-separated):
    YYYY-MM-DD | mpg | gas_$/gal | mi/kWh |

  RULES:
    • List periods in CHRONOLOGICAL ORDER, earliest first.
    • Each session uses the LAST period whose start date
      is on or before the session date.
    • Always keep a trailing pipe | at the end of each line.

  FIELD DESCRIPTIONS:
    YYYY-MM-DD   Start date of this period.
    mpg          MPG of the gas car you're comparing against.
                 23 = US average mid-size sedan. Use your
                 old car's actual MPG for a personal comparison.
    gas_$/gal    Average gas price per gallon. Check GasBuddy
                 for current Michigan average.
    mi/kWh       Mach-E GT real-world efficiency.
                 ~3.0 summer baseline, ~2.5 winter.
                 Check FordPass for your rolling average.

  HOW TO ADD A NEW PERIOD:
    1. Decide the start date (first session under new rates).
    2. Add a new line in date order.
    3. Save, commit, push.

  EXAMPLE — if gas jumps to $3.50 on June 1 2026:
    2026-06-01 | 23 | 3.50 | 3.0 |
=============================================================
{% endcomment %}
{% assign gas_periods = "
2025-08-22 | 27 | 3.26 | 3.0 |
2025-09-01 | 27 | 3.29 | 2.5 |
2025-10-01 | 27 | 3.19 | 3.0 |
2025-11-01 | 27 | 3.04 | 3.0 |
2025-12-01 | 27 | 2.84 | 3.0 |
2026-01-01 | 27 | 2.80 | 3.0 |
2026-02-01 | 27 | 2.89 | 3.0 |
2026-03-01 | 27 | 3.60 | 3.0 |
2026-04-01 | 27 | 4.24 | 3.0 |
" | strip | split: "
" %}

{% comment %}
=============================================================
  ODOMETER / COST-PER-MILE CONFIGURATION
  ─────────────────────────────────────────────────────────
  Tracks cost-per-mile and efficiency per vehicle.

  FORMAT (one vehicle per line, pipe-separated):
    vehicle_name | odometer_miles | odometer_date | first_session_date |

  FIELD DESCRIPTIONS:
    vehicle_name       Must EXACTLY match the vehicle field in
                       your charging files. Case sensitive.
    odometer_miles     Current odometer reading in miles.
                       Update this and odometer_date monthly
                       or whenever you want fresh numbers.
    odometer_date      Date (YYYY-MM-DD) of the odometer reading.
                       Only sessions ON OR BEFORE this date count.
    first_session_date Date of your very first session for this
                       vehicle. Set once, don't change.

  HOW TO UPDATE:
    1. Check FordPass or your dashboard for current mileage.
    2. Update odometer_miles to the new reading.
    3. Update odometer_date to today's date.
    4. Save, commit, push.

  WHEN YOU GET YOUR 2026 MACH-E:
    1. Add a new line for "2026 Mach-E GT".
    2. Update the CloudCannon schema default vehicle field.
    3. An Overall row appears automatically once you have
       more than one vehicle listed here.
=============================================================
{% endcomment %}
{% assign odometer_entries = "
2025 Mach-E GT | 11195 | 2026-05-02 | 2025-08-22 |
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

{% for entry in site.charging %}
  {% assign k          = entry.energy_kwh | plus: 0 %}
  {% assign loc        = entry.location | downcase %}
  {% assign entry_date = entry.date | date: "%Y-%m-%d" %}
  {% assign veh        = entry.vehicle | default: "2025 Mach-E GT" %}

  {% comment %}
    ── Resolve home electricity rate for this session ──
    Walk home_rate_periods and keep updating h_rate as long
    as the period start date <= session date. After the loop
    h_rate holds the correct rate for this session.
  {% endcomment %}
{% assign h_rate = 0.17 %}
  {% for hp in home_rate_periods %}
    {% assign hp_parts = hp | strip | split: " | " %}
    {% assign hp_date = hp_parts[0] | strip %}
    {% assign hp_rate_str = hp_parts[1] | strip %}
    {% if hp_date <= entry_date %}
      {% assign h_rate = hp_rate_str | times: 1.0 %}
    {% endif %}
  {% endfor %}

  {% comment %} ── Effective cost for this session ── {% endcomment %}
  {% if loc contains "home" %}
    {% assign c = k | times: h_rate %}
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
    ── Per-session gas savings (period-aware) ──
    Walk gas_periods and keep updating p_* variables as
    long as the period start date <= session date.
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

  {% comment %}
    ── Per-vehicle cost/kWh accumulation ──
    For each odometer entry, if this session's vehicle matches
    and the session date is on or before the odometer date,
    accumulate into that vehicle's running total.
  {% endcomment %}
  {% for odo in odometer_entries %}
    {% assign op          = odo | strip | split: " | " %}
    {% assign odo_vehicle = op[0] %}
    {% assign odo_date    = op[2] %}
    {% if veh == odo_vehicle and entry_date <= odo_date %}
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

{% comment %} ── Default zero values for unset vehicle accumulators ── {% endcomment %}
{% unless veh_cost_0 %}{% assign veh_cost_0 = 0.0 %}{% endunless %}
{% unless veh_kwh_0  %}{% assign veh_kwh_0  = 0.0 %}{% endunless %}
{% unless veh_cost_1 %}{% assign veh_cost_1 = 0.0 %}{% endunless %}
{% unless veh_kwh_1  %}{% assign veh_kwh_1  = 0.0 %}{% endunless %}
{% unless veh_cost_2 %}{% assign veh_cost_2 = 0.0 %}{% endunless %}
{% unless veh_kwh_2  %}{% assign veh_kwh_2  = 0.0 %}{% endunless %}
{% unless veh_cost_3 %}{% assign veh_cost_3 = 0.0 %}{% endunless %}
{% unless veh_kwh_3  %}{% assign veh_kwh_3  = 0.0 %}{% endunless %}

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

  {% comment %} Expandable assumptions panels {% endcomment %}
  <div id="gas-assumptions" class="assumptions-panel">
    <strong>Gas Savings Assumptions by Period</strong>
    <table>
      <tr><th>From date</th><th>vs. MPG</th><th>Gas $/gal</th><th>mi/kWh</th></tr>
      {% for period in gas_periods %}
        {% assign parts = period | strip | split: " | " %}
        <tr>
          <td>{{ parts[0] }}</td><td>{{ parts[1] }}</td>
          <td>${{ parts[2] }}</td><td>{{ parts[3] }}</td>
        </tr>
      {% endfor %}
    </table>
    <br>
    <strong>Home Electricity Rates by Period</strong>
    <table>
      <tr><th>From date</th><th>Rate ($/kWh)</th></tr>
      {% for hp in home_rate_periods %}
        {% assign hp_parts = hp | strip | split: " | " %}
        <tr>
          <td>{{ hp_parts[0] }}</td><td>${{ hp_parts[1] }}</td>
        </tr>
      {% endfor %}
    </table>
  </div>

  {% comment %} ── Cost per mile / efficiency cards ── {% endcomment %}
  <div class="cpm-grid">
    {% assign overall_odo_miles = 0 %}

    {% for odo in odometer_entries %}
      {% assign op          = odo | strip | split: " | " %}
      {% assign odo_vehicle = op[0] %}
      {% assign odo_miles   = op[1] | plus: 0 %}
      {% assign odo_date    = op[2] %}
      {% assign idx         = forloop.index0 %}

      {% assign overall_odo_miles = overall_odo_miles | plus: odo_miles %}

      {% case idx %}
        {% when 0 %}{% assign v_cost = veh_cost_0 %}{% assign v_kwh = veh_kwh_0 %}
        {% when 1 %}{% assign v_cost = veh_cost_1 %}{% assign v_kwh = veh_kwh_1 %}
        {% when 2 %}{% assign v_cost = veh_cost_2 %}{% assign v_kwh = veh_kwh_2 %}
        {% when 3 %}{% assign v_cost = veh_cost_3 %}{% assign v_kwh = veh_kwh_3 %}
      {% endcase %}

      {% if odo_miles > 0 %}
        {% assign cpm = v_cost | divided_by: odo_miles %}
        {% assign kpm = v_kwh  | divided_by: odo_miles %}
      {% else %}
        {% assign cpm = 0 %}
        {% assign kpm = 0 %}
      {% endif %}
      {% assign cpm_cents = cpm | times: 100 | round | modulo: 100 %}

      <div class="cpm-row">
        <div class="cpm-vehicle">
          {{ odo_vehicle }}
          <small>{{ odo_miles }} mi as of {{ odo_date }}</small>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Cost / Mile</span>
          <span class="cpm-stat-value">${{ cpm | split: "." | first }}.{% if cpm_cents < 10 %}0{{ cpm_cents }}{% else %}{{ cpm_cents }}{% endif %}</span>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">kWh / Mile</span>
          <span class="cpm-stat-value">{{ kpm | round: 3 }}</span>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Total Charged</span>
          <span class="cpm-stat-value">{{ v_kwh | round: 1 }} kWh</span>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Total Cost</span>
          {% assign vc_cents = v_cost | times: 100 | round | modulo: 100 %}
          <span class="cpm-stat-value">${{ v_cost | split: "." | first }}.{% if vc_cents < 10 %}0{{ vc_cents }}{% else %}{{ vc_cents }}{% endif %}</span>
        </div>
      </div>
    {% endfor %}

    {% comment %} Overall row — only shown if more than one vehicle {% endcomment %}
    {% if odometer_entries.size > 1 and overall_odo_miles > 0 %}
      {% assign overall_cpm = total_cost | divided_by: overall_odo_miles %}
      {% assign overall_kpm = total_kwh  | divided_by: overall_odo_miles %}
      {% assign overall_cpm_cents = overall_cpm | times: 100 | round | modulo: 100 %}
      <div class="cpm-row cpm-overall">
        <div class="cpm-vehicle">
          Overall (all vehicles)
          <small>{{ overall_odo_miles }} combined miles</small>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Cost / Mile</span>
          <span class="cpm-stat-value">${{ overall_cpm | split: "." | first }}.{% if overall_cpm_cents < 10 %}0{{ overall_cpm_cents }}{% else %}{{ overall_cpm_cents }}{% endif %}</span>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">kWh / Mile</span>
          <span class="cpm-stat-value">{{ overall_kpm | round: 3 }}</span>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Total Charged</span>
          <span class="cpm-stat-value">{{ total_kwh | round: 1 }} kWh</span>
        </div>
        <div class="cpm-stat">
          <span class="cpm-stat-label">Total Cost</span>
          {% assign tc_cents = total_cost | times: 100 | round | modulo: 100 %}
          <span class="cpm-stat-value">${{ total_cost | split: "." | first }}.{% if tc_cents < 10 %}0{{ tc_cents }}{% else %}{{ tc_cents }}{% endif %}</span>
        </div>
      </div>
    {% endif %}
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

          {% comment %} ── Resolve home rate for this display row ── {% endcomment %}
          {% assign h_rate = 0.17 %}
          {% for hp in home_rate_periods %}
            {% assign hp_parts = hp | strip | split: " | " %}
            {% if hp_parts[0] <= log_date %}
              {% assign h_rate = hp_parts[1] | plus: 0 %}
            {% endif %}
          {% endfor %}

          {% if log_loc contains "home" %}
            {% assign display_cost = log.energy_kwh | times: h_rate %}
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
          labels: { color: getThemeColor(), usePointStyle: false, boxWidth: 14, padding: 16 }
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
    donutChart.options.plugins.legend.labels.color = color;
    donutChart.update();
    barChart.options.scales.y.ticks.color = color;
    barChart.options.scales.x.grid.color = isDark() ? '#444' : '#ddd';
    barChart.update();
  });
</script>
---
layout: page
title: Charging History
permalink: /charging-history/
---

<style>
  .history-container { color: var(--text); }
  .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; display: inline-block; }
  .badge-work { background: #e3f2fd; color: #01579b; }
  .badge-home { background: #f3e5f5; color: #4a148c; }
  .badge-tesla { background: #ffebee; color: #CC0000; }
  .badge-cp { background: #fff3e0; color: #e65100; }
  .badge-blink { background: #f1f8e9; color: #65A844; }
  .badge-other { background: #f5f5f5; color: #424242; }

  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; color: var(--text) !important; margin-top: 20px; }
  th { background: var(--table-head); padding: 12px; border: 1px solid var(--dash-border); text-align: left; color: var(--text); }
  td { padding: 12px; border: 1px solid var(--dash-border); color: var(--text); }
</style>

<div class="history-container">
  <h1>Full Charging History</h1>
  <table>
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
      <tr>
        <td>{{ log.date }}</td>
        <td>
          {% assign loc = log.location | downcase %}
          <span class="badge {% if loc contains 'work' %}badge-work{% elsif loc contains 'home' %}badge-home{% elsif loc contains 'tesla' %}badge-tesla{% elsif loc contains 'chargepoint' %}badge-cp{% elsif loc contains 'blink' %}badge-blink{% else %}badge-other{% endif %}">
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
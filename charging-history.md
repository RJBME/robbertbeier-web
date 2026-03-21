---
layout: page
title: Charging History
permalink: /charging-history/
nav_exclude: true
---

<style>
  .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; }
  .badge-work { background: #e1f5fe; color: #0288d1; }
  .badge-home { background: #f3e5f5; color: #7b1fa2; }
  .badge-other { background: #f5f5f5; color: #616161; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  th { background: #f4f4f4; padding: 12px; border: 1px solid #ddd; text-align: left; }
  td { padding: 12px; border: 1px solid #eee; }
</style>

# Deep Dive: All Charging Sessions

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
        <span class="badge {% if log.location == 'Work' %}badge-work{% else %}badge-home{% endif %}">
          {{ log.location }}
        </span>
      </td>
      <td style="color: #888;">{{ log.vehicle | default: "2025 Mach-E GT" }}</td>
      <td>{{ log.energy_kwh }}</td>
      <td>
        {% if log.cost == 0 or log.cost == 0.0 %}
          <span style="color: #aaa;">Free</span>
        {% else %}
          ${{ log.cost | plus: 0.0001 | round: 2 }}
        {% endif %}
      </td>
    </tr>
    {% endfor %}
  </tbody>
</table>
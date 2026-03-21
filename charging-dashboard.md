---
layout: page
title: Mach-E Charging Analytics
permalink: /charging/
---

<style>
  .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin: 30px 0; }
  .stat-card { background: #ffffff; border: 1px solid #e0e6ed; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
  .stat-label { color: #7f8c8d; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; display: block; margin-bottom: 10px; }
  .stat-value { font-size: 2.2rem; font-weight: 800; color: #2c3e50; }
  .stat-unit { font-size: 1rem; color: #95a5a6; font-weight: 400; }
  .savings-val { color: #27ae60; }
  
  table.charging-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.9rem; }
  .charging-table th { background: #f8f9fa; text-align: left; padding: 12px; border-bottom: 2px solid #dee2e6; color: #495057; }
  .charging-table td { padding: 12px; border-bottom: 1px solid #eee; vertical-align: middle; }
  .location-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
  .badge-work { background: #e1f5fe; color: #0288d1; }
  .badge-home { background: #f3e5f5; color: #7b1fa2; }
  .badge-other { background: #fff3e0; color: #f57c00; }
</style>

{% assign total_cost = 0.0 %}
{% assign total_kwh = 0.0 %}
{% assign work_kwh = 0.0 %}

{% for entry in site.data.charging %}
  {% assign cost = entry.cost | plus: 0 %}
  {% assign kwh = entry.energy_kwh | plus: 0 %}
  {% assign total_cost = total_cost | plus: cost %}
  {% assign total_kwh = total_kwh | plus: kwh %}
  {% if entry.location == "Work" %}
    {% assign work_kwh = work_kwh | plus: kwh %}
  {% endif %}
{% endfor %}

{% comment %} Excel Matching logic: 23mpg baseline at $2.50/gal {% endcomment %}
{% assign gas_cost_offset = total_kwh | times: 3.0 | divided_by: 23 | times: 2.50 %}
{% assign net_savings = gas_cost_offset | minus: total_cost %}
{% assign total_mwh = total_kwh | divided_by: 1000.0 %}

<div class="dashboard-grid">
  <div class="stat-card">
    <span class="stat-label">Total Energy</span>
    <span class="stat-value">{{ total_mwh | round: 2 }} <span class="stat-unit">MWh</span></span>
  </div>
  <div class="stat-card">
    <span class="stat-label">Paid Cost</span>
    <span class="stat-value">${{ total_cost | round: 2 }}</span>
  </div>
  <div class="stat-card">
    <span class="stat-label">Gas Savings</span>
    <span class="stat-value savings-val">${{ net_savings | round: 0 }}</span>
  </div>
  <div class="stat-card">
    <span class="stat-label">Work Contribution</span>
    <span class="stat-value">{{ work_kwh | round: 0 }} <span class="stat-unit">kWh</span></span>
  </div>
</div>

### Recent Charging Sessions
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
    {% assign sorted_logs = site.data.charging | reverse %}
    {% for log in sorted_logs limit: 15 %}
    <tr>
      <td>{{ log.date }}</td>
      <td>
        {% if log.location == "Work" %}
          <span class="location-badge badge-work">Work</span>
        {% elsif log.location == "Home" %}
          <span class="location-badge badge-home">Home</span>
        {% else %}
          <span class="location-badge badge-other">{{ log.location | truncate: 15 }}</span>
        {% endif %}
      </td>
      <td>{{ log.energy_kwh }} kWh</td>
      <td>
        {% if log.cost == 0 or log.cost == 0.0 %}
          <span style="color: #95a5a6;">Free</span>
        {% else %}
          ${{ log.cost | plus: 0.0001 | round: 2 }}
        {% endif %}
      </td>
    </tr>
    {% endfor %}
  </tbody>
</table>

<p style="margin-top: 30px; font-size: 0.8rem; color: #95a5a6; font-style: italic;">
  Savings calculated against a baseline of 23 MPG at $2.50/gal. Energy data is sourced from live telemetry logs.
</p>
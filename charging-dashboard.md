---
layout: page
title: Mach-E Charging Dashboard
permalink: /charging/
---

<style>
  .stat-box { background: #fdfdfd; border: 1px solid #e1e1e1; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
  .stat-number { display: block; font-size: 2em; font-weight: bold; color: #2c3e50; }
</style>

{% assign total_cost = 0.0 %}
{% assign total_kwh = 0.0 %}
{% for entry in site.data.charging %}
  {% assign entry_cost = entry.cost | plus: 0 %}
  {% assign entry_kwh = entry.energy_kwh | plus: 0 %}
  {% assign total_cost = total_cost | plus: entry_cost %}
  {% assign total_kwh = total_kwh | plus: entry_kwh %}
{% endfor %}

<div class="stat-box">
  <span>Lifetime Charging Cost</span>
  <span class="stat-number">${{ total_cost | round: 2 }}</span>
</div>

<div class="stat-box">
  <span>Total Energy Added</span>
  <span class="stat-number">{{ total_kwh | round: 1 }} kWh</span>
</div>

### Recent History
| Date | Location | Energy | Cost |
| :--- | :--- | :--- | :--- |
{% assign sorted = site.data.charging | reverse %}
{% for log in sorted limit: 10 %}
| {{ log.date }} | {{ log.location }} | {{ log.energy_kwh }} | ${{ log.cost }} |
{% endfor %}
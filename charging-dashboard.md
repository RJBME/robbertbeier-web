---
layout: page
title: Mach-E Charging Dashboard
permalink: /charging/
---

{% assign total_cost = 0.0 %}
{% assign total_kwh = 0.0 %}
{% for entry in site.data.charging %}
  {% assign total_cost = total_cost | plus: entry.cost %}
  {% assign total_kwh = total_kwh | plus: entry.energy_kwh %}
{% endfor %}

{% assign total_miles = total_kwh | times: 3.1 %}
{% assign gas_cost = total_miles | divided_by: 27 | times: 2.50 %}
{% assign net_savings = gas_cost | minus: total_cost %}

<div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px;">
  <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center;">
    <h4 style="margin:0;">Total Energy</h4>
    <p style="font-size: 2em; font-weight: bold; color: #2ecc71;">{{ total_kwh | round: 1 }} kWh</p>
  </div>
  <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center;">
    <h4 style="margin:0;">Total Cost</h4>
    <p style="font-size: 2em; font-weight: bold; color: #e74c3c;">${{ total_cost | round: 2 }}</p>
  </div>
  <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center;">
    <h4 style="margin:0;">Real Savings</h4>
    <p style="font-size: 2em; font-weight: bold; color: #3498db;">${{ net_savings | round: 2 }}</p>
  </div>
</div>

### Recent Charges
| Date | Location | Energy | Cost |
| :--- | :--- | :--- | :--- |
{% assign sorted_logs = site.data.charging | sort: 'date' | reverse %}
{% for log in sorted_logs limit: 10 %}
| {{ log.date }} | {{ log.location }} | {{ log.energy_kwh }} kWh | ${{ log.cost | plus: 0 | round: 2 }} |
{% endfor %}
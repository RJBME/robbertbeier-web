---
layout: page
title: Mach-E Charging Dashboard
permalink: /charging/
---

{% assign total_cost = 0.0 %}
{% assign total_kwh = 0.0 %}

{% for entry in site.data.charging %}
  {% assign entry_cost = entry.cost | plus: 0 %}
  {% assign entry_kwh = entry.energy_kwh | plus: 0 %}
  {% assign total_cost = total_cost | plus: entry_cost %}
  {% assign total_kwh = total_kwh | plus: entry_kwh %}
{% endfor %}

{% comment %} Matching your spreadsheet baseline: 23mpg at $2.50/gal {% endcomment %}
{% assign total_miles = total_kwh | times: 3.0 %}
{% assign gas_cost = total_miles | divided_by: 23 | times: 2.50 %}
{% assign net_savings = gas_cost | minus: total_cost %}
{% assign total_mwh = total_kwh | divided_by: 1000.0 %}

<div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #eee;">
    <h4 style="margin:0; color: #666; font-size: 0.8em; text-transform: uppercase;">Lifetime Energy</h4>
    <p style="font-size: 2em; font-weight: bold; color: #2ecc71; margin: 10px 0;">{{ total_mwh | round: 2 }} MWh</p>
  </div>
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #eee;">
    <h4 style="margin:0; color: #666; font-size: 0.8em; text-transform: uppercase;">Total Cost</h4>
    <p style="font-size: 2em; font-weight: bold; color: #e74c3c; margin: 10px 0;">${{ total_cost | round: 2 | append: "0" | truncate: 7, "" }}</p>
  </div>
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #eee;">
    <h4 style="margin:0; color: #666; font-size: 0.8em; text-transform: uppercase;">Gas Savings</h4>
    <p style="font-size: 2em; font-weight: bold; color: #3498db; margin: 10px 0;">${{ net_savings | round: 0 }}</p>
  </div>
</div>

### Recent Charges
| Date | Location | Energy | Cost |
| :--- | :--- | :--- | :--- |
{% assign sorted_logs = site.data.charging | reverse %}
{% for log in sorted_logs limit: 12 %}
| {{ log.date }} | {{ log.location }} | {{ log.energy_kwh }} kWh | ${{ log.cost | plus: 0.0001 | round: 2 }} |
{% endfor %}

<p style="text-align: center; margin-top: 20px;">
  <a href="/charging-history/" style="background: #3498db; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">View Full History</a>
</p>
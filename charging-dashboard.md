{\rtf1\ansi\ansicpg1252\cocoartf2868
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 ---\
layout: page\
title: Mach-E Charging Dashboard\
permalink: /charging/\
---\
\
\{% assign total_cost = 0.0 %\}\
\{% assign total_kwh = 0.0 %\}\
\{% for entry in site.data.charging %\}\
  \{% assign total_cost = total_cost | plus: entry.cost %\}\
  \{% assign total_kwh = total_kwh | plus: entry.energy_kwh %\}\
\{% endfor %\}\
\
\{% comment %\} Savings Calculation: 3.1 mi/kWh at $2.50/gal and 27mpg \{% endcomment %\}\
\{% assign total_miles = total_kwh | times: 3.1 %\}\
\{% assign gas_cost = total_miles | divided_by: 27 | times: 2.50 %\}\
\{% assign net_savings = gas_cost | minus: total_cost %\}\
\
<div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px;">\
  <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center;">\
    <h4 style="margin:0;">Total Energy</h4>\
    <p style="font-size: 2em; font-weight: bold; color: #2ecc71;">\{\{ total_kwh | round: 1 \}\} kWh</p>\
  </div>\
  <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center;">\
    <h4 style="margin:0;">Total Cost</h4>\
    <p style="font-size: 2em; font-weight: bold; color: #e74c3c;">$\{\{ total_cost | round: 2 \}\}</p>\
  </div>\
  <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center;">\
    <h4 style="margin:0;">Real Savings</h4>\
    <p style="font-size: 2em; font-weight: bold; color: #3498db;">$\{\{ net_savings | round: 2 \}\}</p>\
  </div>\
</div>\
\
### Recent Charges\
| Date | Location | Energy | Cost |\
| :--- | :--- | :--- | :--- |\
\{% assign sorted_logs = site.data.charging | sort: 'date' | reverse %\}\
\{% for log in sorted_logs limit: 10 %\}\
| \{\{ log.date \}\} | \{\{ log.location \}\} | \{\{ log.energy_kwh \}\} kWh | $\{\{ log.cost | float | printf: "%.2f" \}\} |\
\{% endfor %\}\
\
[View Full History](/charging-history/)}
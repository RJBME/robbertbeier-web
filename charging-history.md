---
layout: page
title: Charging History
permalink: /charging-history/
---

{% comment %}
=============================================================
  RATE CONFIGURATION — edit _data/rates.yml, NOT this file
  ─────────────────────────────────────────────────────────
  All electricity rates are managed in a single place:
  _data/rates.yml — open that file to add or update rates.
  This file reads from it automatically.
=============================================================
{% endcomment %}

<style>
  .history-container { color: var(--text); }

  /* ── Summary KPI strip ── */
  .summary-bar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 22px;
  }
  .summary-item {
    background: var(--dash-card);
    border: 1px solid var(--dash-border);
    border-top: 3px solid var(--link);
    border-radius: 12px;
    padding: 14px 16px;
    text-align: center;
  }
  .summary-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: #888; display: block; margin-bottom: 4px; }
  .summary-value { font-size: 1.3rem; font-weight: 900; display: block; line-height: 1.1; }

  /* ── Filter bar ── */
  .filter-bar { background: var(--dash-card); padding: 16px 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--dash-border); }
  .filter-row { display: grid; gap: 12px; align-items: end; margin-bottom: 10px; }
  .filter-row:last-child { margin-bottom: 0; }
  .filter-row-brand { grid-template-columns: 1fr 1fr auto; }
  .filter-row-other  { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
  @media (max-width: 520px) {
    .filter-row-brand { grid-template-columns: 1fr 1fr; }
    .filter-row-brand .btn-reset { grid-column: 1 / -1; }
    .summary-bar { grid-template-columns: repeat(3,1fr); gap: 8px; }
    .summary-value { font-size: 1rem; }
  }
  .filter-group { display: flex; flex-direction: column; gap: 5px; }
  .filter-group label { font-size: 0.65rem; text-transform: uppercase; font-weight: 700; color: #888; letter-spacing: 0.06em; }
  select {
    padding: 7px 10px; border-radius: 8px;
    border: 1px solid var(--dash-border);
    background: var(--bg); color: var(--text);
    font-size: 0.8rem; width: 100%; box-sizing: border-box;
    appearance: none; -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
    padding-right: 28px;
  }
  .btn-reset {
    padding: 7px 16px;
    background: var(--bg); color: #888;
    border: 1px solid var(--dash-border);
    border-radius: 8px; cursor: pointer;
    font-size: 0.78rem; font-weight: 600;
    align-self: flex-end; transition: all 0.15s;
    white-space: nowrap;
  }
  .btn-reset:hover { border-color: var(--link); color: var(--link); }

  /* ── Search box ── */
  .filter-search {
    padding: 8px 12px; border-radius: 8px; box-sizing: border-box; width: 100%;
    border: 1px solid var(--dash-border); background: var(--bg); color: var(--text);
    font-size: 0.85rem; font-family: inherit;
  }
  .filter-search:focus { outline: none; border-color: var(--link); }
  .filter-search::placeholder { color: #999; }

  /* ── Vehicle filter pills (match Analytics; active = car's paint colour) ── */
  .veh-pills { display: flex; flex-wrap: wrap; gap: 8px; }
  .vf-btn {
    background: var(--bg); border: 1px solid var(--dash-border);
    padding: 5px 14px; border-radius: 20px; font-size: 0.76rem;
    color: var(--text); cursor: pointer; font-weight: 600;
    font-family: inherit; transition: all 0.15s; white-space: nowrap;
  }
  .vf-btn:hover { border-color: var(--link); color: var(--link); }
  .vf-btn.active { background: var(--vf-color, var(--link)); color: var(--vf-text, #fff); border-color: var(--vf-color, var(--link)); }

  /* ── Location badges ── */
  .badge {
    padding: 3px 9px; border-radius: 20px;
    font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.04em;
    display: inline-block; white-space: nowrap;
    max-width: 160px; overflow: hidden; text-overflow: ellipsis;
    vertical-align: middle;
  }
  .badge-work   { background: #3b82f620; color: #3b82f6; }
  .badge-home   { background: #8b5cf620; color: #8b5cf6; }
  .badge-tesla  { background: #ef444420; color: #ef4444; }
  .badge-cp     { background: #f9731620; color: #f97316; }
  .badge-blink  { background: #22c55e20; color: #22c55e; }
  .badge-rivian { background: #eab30820; color: #d97706; }
  .badge-ea     { background: #00b04f20; color: #00963f; }
  .badge-wc     { background: #51A95020; color: #51A950; }
  .badge-other  { background: #6b728020; color: #6b7280; }

  /* ── Table ── */
  table { width: 100%; border-collapse: collapse; font-size: 0.84rem; color: var(--text) !important; margin-top: 10px; }
  th {
    background: var(--table-head);
    padding: 9px 12px;
    border-bottom: 2px solid var(--dash-border);
    text-align: left; font-size: 0.7rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.05em; color: #888;
    white-space: nowrap;
  }
  td { padding: 9px 12px; border-bottom: 1px solid var(--dash-border); vertical-align: middle; }
  tr.log-row:last-child td { border-bottom: none; }
  tr.log-row:hover td { background: var(--dash-border); }

  /* Column alignment */
  #history-table td:nth-child(1) { white-space: nowrap; font-size: 0.8rem; color: #888; }
  #history-table td:nth-child(2) { max-width: 180px; }
  #history-table td:nth-child(3) { white-space: nowrap; font-size: 0.72rem; color: #888; }
  #history-table td:nth-child(4),
  #history-table td:nth-child(5),
  #history-table td:nth-child(6) { white-space: nowrap; text-align: right; font-variant-numeric: tabular-nums; }
  #history-table td:nth-child(7) { text-align: center; width: 44px; }
  #history-table th:nth-child(4),
  #history-table th:nth-child(5),
  #history-table th:nth-child(6) { text-align: right; }

  /* Sortable header arrows */
  th[data-sort] { cursor: pointer; user-select: none; }
  th[data-sort]:hover { color: var(--link); }
  th[data-sort]::after { content: ' ⇅'; font-size: 0.6em; opacity: 0.4; }
  th[data-sort].sort-asc::after  { content: ' ↑'; opacity: 1; color: var(--link); }
  th[data-sort].sort-desc::after { content: ' ↓'; opacity: 1; color: var(--link); }

  /* ── Note tooltip ── */
  .note-icon { position: relative; cursor: default; font-size: 1rem; display: inline-block; }
  /* Fixed-position (coords set in JS) so long notes escape the table's
     horizontal-scroll wrapper, which also clips vertically (overflow-x:auto
     ⇒ overflow-y:auto per spec) and was cutting off the top of tall notes.
     pre-wrap preserves the note's own line breaks; it scrolls if very long. */
  .note-tooltip {
    display: none; position: fixed; top: 0; left: 0;
    background: var(--dash-card); color: var(--text);
    border: 1px solid var(--dash-border);
    padding: 9px 12px; border-radius: 8px;
    font-size: 0.78rem; line-height: 1.5; text-align: left;
    white-space: pre-wrap; overflow-wrap: break-word;
    width: max-content; max-width: min(340px, 88vw);
    max-height: min(60vh, 400px); overflow-y: auto;
    z-index: 1000; box-shadow: 0 6px 24px rgba(0,0,0,0.20);
  }
  .note-icon:hover .note-tooltip,
  .note-icon.tip-open .note-tooltip { display: block; }

  /* ── Cross-page nav ── */
  .charge-nav { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--dash-border); align-items: center; }
  .charge-nav a {
    font-size: 0.78rem; font-weight: 600; text-decoration: none;
    padding: 5px 14px; border-radius: 20px;
    border: 1px solid var(--dash-border);
    background: var(--dash-card); color: #888;
    transition: all 0.15s;
  }
  .charge-nav a:hover  { border-color: var(--link); color: var(--link); }
  .charge-nav a.active { background: var(--link); border-color: var(--link); color: #fff; font-weight: 700; }
</style>

<div class="history-container">
<script>(function(){
  var lnk = document.querySelector("link[rel~='icon']") || document.createElement('link');
  lnk.rel = 'icon';
  lnk.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔋</text></svg>";
  if (!lnk.parentNode) document.head.appendChild(lnk);
})();</script>

  <nav class="charge-nav">
    <a href="/charging/">⚡ Dashboard</a>
    <a href="/charging-history/" class="active">📋 History</a>
    <a href="/charging-analytics/">📊 Analytics</a>
    <a href="/trip-calculator/">🧭 Trip</a>
  </nav>

  <div class="summary-bar" id="filterSummary">
    <div class="summary-item"><span class="summary-label">Filtered Energy</span><span class="summary-value" id="sumEnergy">0 kWh</span></div>
    <div class="summary-item"><span class="summary-label">Filtered Cost</span><span class="summary-value" id="sumCost">$0.00</span></div>
    <div class="summary-item"><span class="summary-label">Sessions</span><span class="summary-value" id="sumCount">0</span></div>
  </div>

  <div class="filter-bar">
    <div class="filter-row" style="grid-template-columns:1fr;margin-bottom:12px">
      <div class="filter-group">
        <label>Search</label>
        <input type="search" id="searchFilter" class="filter-search" placeholder="Search location, date, brand, notes…" oninput="applyFilters()" aria-label="Search charging sessions">
      </div>
    </div>
    <div class="filter-row" style="grid-template-columns:1fr;margin-bottom:12px">
      <div class="filter-group">
        <label>Vehicle</label>
        <div id="vehPills" class="veh-pills"></div>
      </div>
    </div>
    <div class="filter-row filter-row-brand">
      <div class="filter-group">
        <label>Brand</label>
        <select id="brandFilter" onchange="onBrandChange()">
          <option value="">All Brands</option>
          <option value="home">Home</option>
          <option value="work">Work</option>
          <option value="tesla">Tesla</option>
          <option value="chargepoint">ChargePoint</option>
          <option value="rivian">Rivian</option>
          <option value="blink">Blink</option>
          <option value="electrify">Electrify America</option>
          <option value="wecharge">WeCharge</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Location</label>
        <select id="locFilter" onchange="applyFilters()">
          <option value="">All Locations</option>
        </select>
      </div>
      <button class="btn-reset" onclick="resetFilters()">Reset All</button>
    </div>
    <div class="filter-row filter-row-other">
      <div class="filter-group">
        <label>Year</label>
        <select id="yearFilter" onchange="applyFilters()">
          <option value="">All Years</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Cost</label>
        <select id="costFilter" onchange="applyFilters()">
          <option value="">All Types</option>
          <option value="free">Free Only</option>
          <option value="paid">Paid Only</option>
        </select>
      </div>
    </div>
  </div>

  <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
  <table id="history-table">
    <thead>
      <tr>
        <th data-sort="date">Date</th>
        <th>Location</th>
        <th>Vehicle</th>
        <th data-sort="kwh">Energy (kWh)</th>
        <th data-sort="miles">Miles Added</th>
        <th data-sort="cost">Cost</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      {% assign all_logs = site.charging | sort: 'date' | reverse %}
      {% comment %} Home cost billed wall-side; energy_kwh is battery-side. Uplift home ENERGY for COST only. {% endcomment %}
      {% assign home_mult = site.data.rates.home_charge_uplift | default: 0.10 | plus: 1 %}
      {% for log in all_logs %}
        {% assign log_date = log.date | date: "%Y-%m-%d" %}
        {% assign log_loc  = log.location | downcase %}

        {% comment %}
          ── Resolve home rate from _data/rates.yml ──
          period.rate is a Ruby float — no conversion needed.
          Walk the list; last matching period wins.
        {% endcomment %}
        {% assign h_rate = 0.196 %}
        {% for period in site.data.rates.home_electricity %}
          {% if period.date <= log_date %}
            {% assign h_rate = period.rate %}
          {% endif %}
        {% endfor %}

        {% comment %} ── Effective cost for display and JS filtering ── {% endcomment %}
        {% if log_loc contains "home" %}
          {% assign display_cost = log.energy_kwh | times: h_rate | times: home_mult %}
          {% assign cost_data    = display_cost %}
        {% else %}
          {% assign display_cost = log.cost | times: 1.0 %}
          {% assign cost_data    = log.cost | times: 1.0 %}
        {% endif %}

        {% assign cents = display_cost | times: 100 | round | modulo: 100 %}

        {% comment %} ── Brand for filter ── {% endcomment %}
        {% if log_loc contains "work" %}           {% assign brand = "work" %}
        {% elsif log_loc contains "home" %}        {% assign brand = "home" %}
        {% elsif log_loc contains "tesla" %}       {% assign brand = "tesla" %}
        {% elsif log_loc contains "chargepoint" %} {% assign brand = "chargepoint" %}
        {% elsif log_loc contains "rivian" %}      {% assign brand = "rivian" %}
        {% elsif log_loc contains "blink" %}       {% assign brand = "blink" %}
        {% elsif log_loc contains "electrify" %}   {% assign brand = "electrify" %}
        {% elsif log_loc contains "wecharge" %}    {% assign brand = "wecharge" %}
        {% else %}                                 {% assign brand = "other" %}
        {% endif %}

      <tr class="log-row"
        data-year="{{ log.date | date: '%Y' }}"
        data-loc="{{ log.location }}"
        data-brand="{{ brand }}"
        data-veh="{{ log.vehicle | default: '2025 Mach-E GT' }}"
        data-kwh="{{ log.energy_kwh }}"
        data-cost="{{ cost_data }}"
        data-miles="{{ log.miles_added }}"
        data-type="{% if cost_data > 0 %}paid{% else %}free{% endif %}"
        data-sort="{{ log.date | date: '%Y-%m-%d' }}T{{ log.end_time | default: '99:99' }}">
        <td>{{ log.date | date: "%b %-d, '%y" }}</td>
        <td>
          {% assign l = log.location | downcase %}
          <span title="{{ log.location }}" class="badge {% if l contains 'work' %}badge-work{% elsif l contains 'home' %}badge-home{% elsif l contains 'tesla' %}badge-tesla{% elsif l contains 'chargepoint' %}badge-cp{% elsif l contains 'blink' %}badge-blink{% elsif l contains 'rivian' %}badge-rivian{% elsif l contains 'electrify' %}badge-ea{% elsif l contains 'wecharge' %}badge-wc{% else %}badge-other{% endif %}">
            {{ log.location }}
          </span>
        </td>
        <td>{% assign veh = log.vehicle | default: "2025 Mach-E GT" %}{% if veh contains "LRB" %}LRB {% endif %}{% if veh contains "2025" %}'25{% elsif veh contains "2026" %}'26{% endif %} {% if veh contains "GT" %}GT{% elsif veh contains "SR" %}SR{% endif %}</td>
        <td>{{ log.energy_kwh | round: 1 }}</td>
        <td>{% if log.miles_added and log.miles_added != 0 and log.miles_added != "" %}{{ log.miles_added }}{% else %}—{% endif %}</td>
        <td>{% if display_cost == 0 %}Free{% else %}${{ display_cost | split: "." | first }}.{% if cents < 10 %}0{{ cents }}{% else %}{{ cents }}{% endif %}{% endif %}</td>
        <td>
          {% if log.notes and log.notes != "" %}
            <span class="note-icon">📝
              <span class="note-tooltip">{{ log.notes }}</span>
            </span>
          {% endif %}
        </td>
      </tr>
      {% endfor %}
    </tbody>
  </table>
  </div>
</div>

<script>
const brandLocMap = {};

// Vehicle paint colours (match the Analytics page) for the filter pills.
const VEHICLE_PAINT = {
  '2025 Mach-E GT':        '#C2A76C',  // Desert Sand
  '2026 Mach-E SR':        '#E31E2E',  // Race Red
  "LRB's 2025 Mach-E GT":  '#B5176B',  // Molten Magenta
  "LRB's 2026 Mach-E SR":  '#2E7D9E'   // Adriatic Blue
};
function vfTextColor(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
  return (0.299*r + 0.587*g + 0.114*b) / 255 > 0.6 ? '#1a1a1a' : '#fff';
}
let _vehFilter = '';  // '' = all vehicles; set by the pills

function initFilters() {
  // Sort rows by date+end_time descending (newest first).
  // Sessions without end_time get '99:99' so they sort last within their day.
  const tbody = document.querySelector('#history-table tbody');
  if (tbody) {
    const rows = Array.from(tbody.querySelectorAll('tr.log-row'));
    rows.sort((a, b) => {
      const sa = a.getAttribute('data-sort') || '';
      const sb = b.getAttribute('data-sort') || '';
      return sb.localeCompare(sa); // descending
    });
    rows.forEach(r => tbody.appendChild(r));
  }
  const vehicles = new Set();
  const allLocs  = new Set();
  document.querySelectorAll('.log-row').forEach(row => {
    const brand = row.getAttribute('data-brand');
    const loc   = row.getAttribute('data-loc');
    const veh   = row.getAttribute('data-veh');
    if (!brandLocMap[brand]) brandLocMap[brand] = new Set();
    brandLocMap[brand].add(loc);
    allLocs.add(loc);
    vehicles.add(veh);
  });
  // Populate location with all locations on load
  const locSel = document.getElementById('locFilter');
  Array.from(allLocs).sort().forEach(loc => locSel.add(new Option(loc, loc)));
  // Populate year filter dynamically from actual data
  const yearSel = document.getElementById('yearFilter');
  const years = new Set();
  document.querySelectorAll('.log-row').forEach(row => years.add(row.getAttribute('data-year')));
  Array.from(years).sort().forEach(y => yearSel.add(new Option(y, y)));

  // Build vehicle filter pills (tinted with each car's paint colour when active)
  const vehPills = document.getElementById('vehPills');
  const makeVehPill = (val, label) => {
    const btn = document.createElement('button');
    btn.className = 'vf-btn' + (val === _vehFilter ? ' active' : '');
    btn.textContent = label;
    btn.dataset.veh = val;
    if (val && VEHICLE_PAINT[val]) {
      btn.style.setProperty('--vf-color', VEHICLE_PAINT[val]);
      btn.style.setProperty('--vf-text', vfTextColor(VEHICLE_PAINT[val]));
    }
    btn.onclick = () => {
      _vehFilter = val;
      vehPills.querySelectorAll('.vf-btn').forEach(b => b.classList.toggle('active', b.dataset.veh === val));
      applyFilters();
    };
    return btn;
  };
  vehPills.innerHTML = '';
  vehPills.appendChild(makeVehPill('', 'All Vehicles'));
  Array.from(vehicles).sort().forEach(v => vehPills.appendChild(makeVehPill(v, v)));
  applyFilters();
}

function onBrandChange() {
  const brand  = document.getElementById('brandFilter').value;
  const locSel = document.getElementById('locFilter');
  locSel.innerHTML = '<option value="">All Locations</option>';
  if (brand && brandLocMap[brand]) {
    // Brand selected — show only matching locations
    Array.from(brandLocMap[brand]).sort().forEach(loc => locSel.add(new Option(loc, loc)));
  } else {
    // No brand — show all locations
    const allLocs = new Set();
    document.querySelectorAll('.log-row').forEach(row => allLocs.add(row.getAttribute('data-loc')));
    Array.from(allLocs).sort().forEach(loc => locSel.add(new Option(loc, loc)));
  }
  applyFilters();
}

function applyFilters() {
  const year     = document.getElementById('yearFilter').value;
  const brand    = document.getElementById('brandFilter').value;
  const loc      = document.getElementById('locFilter').value;
  const veh      = _vehFilter;
  const costType = document.getElementById('costFilter').value;
  const search   = (document.getElementById('searchFilter').value || '').trim().toLowerCase();

  let totalKwh = 0, totalCost = 0, count = 0;

  document.querySelectorAll('.log-row').forEach(row => {
    const matchYear  = !year     || row.getAttribute('data-year')  === year;
    const matchBrand = !brand    || row.getAttribute('data-brand') === brand;
    const matchLoc   = !loc      || row.getAttribute('data-loc')   === loc;
    const matchVeh   = !veh      || row.getAttribute('data-veh')   === veh;
    const matchCost  = !costType || row.getAttribute('data-type')  === costType;
    // Free-text search matches any visible cell text plus the note content.
    const matchSearch = !search || row.textContent.toLowerCase().includes(search);

    if (matchYear && matchBrand && matchLoc && matchVeh && matchCost && matchSearch) {
      row.style.display = "";
      totalKwh  += parseFloat(row.getAttribute('data-kwh'));
      totalCost += parseFloat(row.getAttribute('data-cost'));
      count++;
    } else {
      row.style.display = "none";
    }
  });

  document.getElementById('sumEnergy').innerText = totalKwh.toFixed(1) + " kWh";
  document.getElementById('sumCost').innerText   = "$" + totalCost.toFixed(2);
  document.getElementById('sumCount').innerText  = count;
}

function resetFilters() {
  document.getElementById('brandFilter').value = '';
  document.querySelectorAll('#yearFilter, #costFilter').forEach(s => s.value = '');
  document.getElementById('searchFilter').value = '';
  _vehFilter = '';
  document.querySelectorAll('#vehPills .vf-btn').forEach(b => b.classList.toggle('active', b.dataset.veh === ''));
  // Repopulate location with all locations
  const locSel = document.getElementById('locFilter');
  locSel.innerHTML = '<option value="">All Locations</option>';
  const allLocs = new Set();
  document.querySelectorAll('.log-row').forEach(row => allLocs.add(row.getAttribute('data-loc')));
  Array.from(allLocs).sort().forEach(loc => locSel.add(new Option(loc, loc)));
  applyFilters();
}

window.addEventListener('load', initFilters);

// Position a note tooltip with fixed viewport coords so it escapes the table's
// overflow wrapper. Prefers above the icon; flips below if there's no room.
function positionNoteTip(icon) {
  const tip = icon.querySelector('.note-tooltip');
  if (!tip) return;
  const pv = tip.style.visibility, pd = tip.style.display;
  tip.style.visibility = 'hidden'; tip.style.display = 'block';   // measure while hidden
  const r = icon.getBoundingClientRect();
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  const vw = window.innerWidth, vh = window.innerHeight, M = 8;
  const top  = (r.top - th - 8 >= M)         ? r.top - th - 8      // above
             : (r.bottom + th + 8 <= vh - M) ? r.bottom + 8        // below
             : Math.max(M, vh - th - M);                           // clamp
  const left = Math.max(M, Math.min(r.right - tw, vw - tw - M));   // right-align, clamp
  tip.style.top = top + 'px'; tip.style.left = left + 'px';
  tip.style.visibility = pv; tip.style.display = pd;
}
// Desktop hover: position once when entering each note icon
let _lastTipIcon = null;
document.addEventListener('mouseover', function(e) {
  const icon = e.target.closest('.note-icon');
  if (icon) { if (icon !== _lastTipIcon) { _lastTipIcon = icon; positionNoteTip(icon); } }
  else _lastTipIcon = null;
});
// Touch: tap note icon to toggle tooltip, tap elsewhere to close
document.addEventListener('click', function(e) {
  const icon = e.target.closest('.note-icon');
  document.querySelectorAll('.note-icon.tip-open').forEach(el => { if (el !== icon) el.classList.remove('tip-open'); });
  if (icon) { e.preventDefault(); icon.classList.toggle('tip-open'); if (icon.classList.contains('tip-open')) positionNoteTip(icon); }
});
// A fixed tooltip's coords go stale on scroll — close any tap-opened one
window.addEventListener('scroll', function() {
  document.querySelectorAll('.note-icon.tip-open').forEach(el => el.classList.remove('tip-open'));
}, { passive: true });

// Column sorting
(function() {
  let sortCol = 'date', sortDir = 'desc';
  const ATTR = { date: 'data-sort', kwh: 'data-kwh', miles: 'data-miles', cost: 'data-cost' };
  // 'data-sort' on rows holds the ISO date string used for sorting

  function sortTable(col) {
    if (sortCol === col) {
      sortDir = sortDir === 'desc' ? 'asc' : 'desc';
    } else {
      sortCol = col; sortDir = col === 'date' ? 'desc' : 'desc';
    }
    // Update header arrows
    document.querySelectorAll('th[data-sort]').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.sort === col) th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    });
    const tbody = document.querySelector('#history-table tbody');
    const rows  = Array.from(tbody.querySelectorAll('tr.log-row'));
    const attr  = ATTR[col];
    rows.sort((a, b) => {
      const av = a.getAttribute(attr) || '';
      const bv = b.getAttribute(attr) || '';
      // Date column: ISO string compare (YYYY-MM-DDThh:mm is lexicographically sortable)
      if (col === 'date') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      // Numeric columns: missing/empty treated as 0
      const an = parseFloat(av) || 0;
      const bn = parseFloat(bv) || 0;
      return sortDir === 'asc' ? an - bn : bn - an;
    });
    rows.forEach(r => tbody.appendChild(r));
  }

  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => sortTable(th.dataset.sort));
  });

  // Set initial sort indicator
  const dateTh = document.querySelector('th[data-sort="date"]');
  if (dateTh) dateTh.classList.add('sort-desc');
})();
</script>
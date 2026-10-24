// Subtle site menu for the standalone tool pages (driving log, filament tracker, …) that don't use
// _layouts/default.html. Include with: <script src="/site-nav.js" defer></script>
// Keep these lists in step with _data/navigation.yml and the Learning dropdown in _layouts/default.html.
(function () {
  const SITE = [
    ['Timeline', '/'], ['Gallery', '/gallery.html'], ['Charging', '/charging/'], ['Fuel', '/fuel/'], ['Blog', '/blog.html']
  ];
  const TOOLS = [
    ['🚗', 'Driving Dashboard', '/driving-dashboard.html'], ['📝', 'Driving Log', '/driving-log.html'],
    ['🧵', 'Filament Tracker', '/filament.html'], ['🚦', 'SOS Practice Test', '/practice.html'],
    ['📜', 'Ancient History Practice', '/history-practice.html'], ['📐', 'Scale Factor Practice', '/scale-practice.html'],
    ['🎃', 'Smart Halloween Sign', '/halloween-sign.html'], ['🌡️', 'Garage & Basement Sensors', '/climate-sensor.html']
  ];

  const css = `
    .sn-bar { max-width: 760px; margin: -8px auto 10px; display: flex; justify-content: space-between; align-items: center;
              font: 500 0.8rem/1.2 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; z-index: 40; }
    .sn-bar a.sn-home, .sn-bar button { color: var(--sn-muted); text-decoration: none; background: none; border: none; font: inherit;
              cursor: pointer; padding: 6px 8px; border-radius: 8px; -webkit-tap-highlight-color: transparent; }
    .sn-bar a.sn-home:hover, .sn-bar button:hover, .sn-bar button[aria-expanded=true] { color: var(--sn-text); background: var(--sn-hover); }
    .sn-panel { position: absolute; right: 0; top: calc(100% + 4px); width: min(300px, calc(100vw - 28px)); background: var(--sn-card);
              color: var(--sn-text); border-radius: 14px; box-shadow: 0 10px 34px rgba(0,0,0,.18); padding: 8px; display: none; }
    .sn-panel.open { display: block; }
    .sn-label { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--sn-muted); padding: 8px 10px 4px; }
    .sn-site { display: flex; flex-wrap: wrap; gap: 4px; padding: 0 6px 6px; }
    .sn-site a { color: var(--sn-text); text-decoration: none; padding: 6px 10px; border-radius: 16px; background: var(--sn-hover); font-size: 0.82rem; }
    .sn-panel a.sn-here { background: var(--sn-accent); color: #fff; }
    .sn-tools a { display: flex; gap: 10px; align-items: center; color: var(--sn-text); text-decoration: none; padding: 8px 10px; border-radius: 9px; font-size: 0.86rem; }
    .sn-tools a:hover { background: var(--sn-hover); }
    .sn-tools a.sn-here { font-weight: 700; }
    .sn-tools .sn-ic { width: 20px; text-align: center; }
    @media print { .sn-bar { display: none !important; } }
  `;

  function isDark() {
    // Follow the host page's actual background, not the OS setting (some tool pages are light-only).
    const m = getComputedStyle(document.body).backgroundColor.match(/\d+(\.\d+)?/g);
    if (!m) return false;
    const [r, g, b] = m.map(Number);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 110;
  }
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  function init() {
    const dark = isDark();
    const vars = dark
      ? '--sn-text:#e6eaf0;--sn-muted:#9aa4b2;--sn-card:#232a34;--sn-hover:rgba(255,255,255,.08);--sn-accent:#3b82f6;'
      : '--sn-text:#1f2733;--sn-muted:#778;--sn-card:#fff;--sn-hover:rgba(15,30,60,.06);--sn-accent:#0056b3;';
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const here = location.pathname.replace(/index\.html$/, '');
    const isHere = href => href === here;
    const bar = document.createElement('nav');
    bar.className = 'sn-bar';
    bar.setAttribute('aria-label', 'Site');
    bar.style.cssText = vars;
    bar.innerHTML = `
      <a class="sn-home" href="/">robertbeier.com</a>
      <button type="button" aria-expanded="false" aria-controls="sn-panel">☰ Menu</button>
      <div class="sn-panel" id="sn-panel">
        <div class="sn-label">Site</div>
        <div class="sn-site">${SITE.map(([n, h]) => `<a href="${h}"${isHere(h) ? ' class="sn-here" aria-current="page"' : ''}>${esc(n)}</a>`).join('')}</div>
        <div class="sn-label">Learning &amp; projects</div>
        <div class="sn-tools">${TOOLS.map(([ic, n, h]) => `<a href="${h}"${isHere(h) ? ' class="sn-here" aria-current="page"' : ''}><span class="sn-ic">${ic}</span>${esc(n)}</a>`).join('')}</div>
      </div>`;
    document.body.insertBefore(bar, document.body.firstChild);

    const btn = bar.querySelector('button'), panel = bar.querySelector('.sn-panel');
    const set = open => { panel.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); };
    btn.addEventListener('click', e => { e.stopPropagation(); set(!panel.classList.contains('open')); });
    document.addEventListener('click', e => { if (!bar.contains(e.target)) set(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

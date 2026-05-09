/* ═══════════════════════════════════════════════════════════════
   sw.js — EV Dashboard Service Worker
   Strategy:
     - App shell (HTML pages, CSS, JS, icons): Cache-first with
       background revalidation (stale-while-revalidate).
     - External CDN resources (Chart.js, Leaflet, etc.): Cache-first.
     - Jekyll-generated pages: Network-first with cache fallback so
       new charging data always shows when online.
     - Everything else: Network-first.
   ═══════════════════════════════════════════════════════════════ */

const CACHE_VERSION  = 'ev-dash-v1';
const SHELL_CACHE    = `${CACHE_VERSION}-shell`;
const DATA_CACHE     = `${CACHE_VERSION}-data`;
const CDN_CACHE      = `${CACHE_VERSION}-cdn`;

// App shell — cached on install, served immediately
const SHELL_URLS = [
  '/',
  '/charging/',
  '/charging-history/',
  '/charging-analytics/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
];

// CDN resources to cache aggressively
const CDN_HOSTS = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
];

// ── Install: pre-cache the app shell ──────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => {
      // Use individual requests so one failure doesn't block the rest
      return Promise.allSettled(
        SHELL_URLS.map(url =>
          cache.add(url).catch(err => console.warn(`[SW] Shell cache miss: ${url}`, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('ev-dash-') && k !== SHELL_CACHE && k !== DATA_CACHE && k !== CDN_CACHE)
          .map(k => { console.log(`[SW] Deleting old cache: ${k}`); return caches.delete(k); })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: routing logic ───────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET, browser extensions, or chrome-extension
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // GitHub API calls (from the Shortcut — not from the page, but just in case)
  if (url.host === 'api.github.com') return;

  // CDN resources → Cache-first, long-lived
  if (CDN_HOSTS.some(h => url.host.includes(h))) {
    event.respondWith(cdnFirst(request));
    return;
  }

  // Same-origin navigation (HTML pages) → Network-first, fall back to cache
  if (request.mode === 'navigate' || url.host === location.host) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Everything else → network only
});

// ── Strategy: Network-first, fall back to cache ───────────────
async function networkFirstWithFallback(request) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone before consuming — cache the fresh response
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline — try cache
    const cached = await cache.match(request)
               || await caches.match(request); // also check shell cache
    if (cached) return cached;

    // Offline and no cache — return offline page if it's a navigation
    if (request.mode === 'navigate') {
      return new Response(offlinePage(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    return new Response('Offline', { status: 503 });
  }
}

// ── Strategy: Cache-first for CDN assets ──────────────────────
async function cdnFirst(request) {
  const cache  = await caches.open(CDN_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('CDN resource unavailable offline', { status: 503 });
  }
}

// ── Offline fallback page ──────────────────────────────────────
function offlinePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Offline — EV Dashboard</title>
  <style>
    :root { --bg:#1a1a1a; --text:#f0f0f0; --link:#a389f4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text);
           font-family: -apple-system, sans-serif;
           display: flex; flex-direction: column; align-items: center;
           justify-content: center; min-height: 100vh; padding: 24px; text-align: center; }
    .icon { font-size: 4rem; margin-bottom: 20px; }
    h1 { font-size: 1.5rem; margin-bottom: 10px; }
    p  { color: #888; font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6; }
    a  { color: var(--link); text-decoration: none; font-weight: 600;
         padding: 10px 24px; border: 1px solid var(--link); border-radius: 24px;
         display: inline-block; }
  </style>
</head>
<body>
  <div class="icon">⚡</div>
  <h1>You're offline</h1>
  <p>The EV Dashboard needs a connection to load fresh data.<br>
     Previously visited pages may still be available below.</p>
  <a href="/charging/">Try Dashboard</a>
</body>
</html>`;
}

// ── Background sync hook (future: offline session queue) ───────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-sessions') {
    // Placeholder for future offline session queuing
    console.log('[SW] Background sync triggered:', event.tag);
  }
});
/* LifeOS — Service Worker v.7.096
   PWA mínimo y honesto.
   · Cachea la "concha" de la app (shell): HTML, CSS, JS, iconos.
   · No cachea llamadas a la API (Apps Script) — esas siempre van a la
     red, así los datos están frescos.
   · Estrategia: network-first para la navegación (HTML), cache-first
     para los assets estáticos. Si la red falla y hay caché, sirve
     caché; si no, falla limpio.
   · Cuando subas una versión nueva del SW, incrementa CACHE_NAME
     (cambiando el número) para que se invaliden los archivos viejos.
*/
const CACHE_NAME = 'lifeos-v8-8';
const SHELL = [
  '/LifeOS/',
  '/LifeOS/index.html',
  '/LifeOS/raw-tokens.css',
  '/LifeOS/raw-app.css',
  '/LifeOS/raw-core.js',
  '/LifeOS/raw-overlay.js',
  '/LifeOS/raw-overlay-dnd.js',
  '/LifeOS/raw-dashboard.js',
  '/LifeOS/raw-bitacora.js',
  '/LifeOS/raw-logros.js',
  '/LifeOS/raw-notas.js',
  '/LifeOS/raw-niveles.js',
  '/LifeOS/raw-coverflow.js',
  '/LifeOS/raw-timers.js',
  '/LifeOS/raw-loading.js',
  '/LifeOS/raw-carousel.js',
  '/LifeOS/icon-192.png',
  '/LifeOS/icon-512.png',
  '/LifeOS/manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(SHELL).catch(()=>{}))   // tolera fallos individuales
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                    // POST, etc. siempre red
  const url = new URL(req.url);

  // Apps Script / Google APIs / Sheets → siempre red, datos frescos.
  if (url.hostname.endsWith('googleusercontent.com') ||
      url.hostname.endsWith('script.google.com')     ||
      url.hostname.endsWith('googleapis.com')) {
    return;   // dejar al navegador hacer su petición normal
  }

  // Navegación (HTML): network-first → caché como respaldo.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/LifeOS/index.html')))
    );
    return;
  }

  // Assets estáticos: cache-first.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(()=>{});
      }
      return res;
    }).catch(() => caches.match(req)))
  );
});

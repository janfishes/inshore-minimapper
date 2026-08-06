/* Mini Mapper service worker.

   Stale-while-revalidate on the app shell, exactly like the tide board's:
   the first open after a push serves the SAVED copy and fetches the new one
   for the next open. That is BY DESIGN and it is why a new build always
   takes two opens — before assuming a deploy failed, check the build stamp
   in the footer.

   The Leaflet files and the depth blocks are cached on first use because
   this app is opened on the water with no signal, and a map with no
   library is not a map. */

const SHELL = 'minimapper-shell-v1';
const LIB   = 'minimapper-lib-v1';
const SHELL_URL = './index.html';

/* Cached the moment they are first fetched, then served from cache forever:
   pinned versions, so there is nothing to revalidate. */
const LIB_HOSTS = ['unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.add(SHELL_URL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== LIB && !k.startsWith('minimapper-data'))
                                    .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);

  if(LIB_HOSTS.includes(url.hostname)){
    e.respondWith(
      caches.open(LIB).then(async c => {
        const hit = await c.match(req);
        if(hit) return hit;
        const res = await fetch(req);
        if(res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
        return res;
      }).catch(() => fetch(req))
    );
    return;
  }

  if(req.mode === 'navigate'){
    e.respondWith(
      caches.open(SHELL).then(async c => {
        const hit = await c.match(SHELL_URL);
        /* no-store on the refetch: GitHub Pages sends max-age=600, and a
           default fetch here can be answered out of the browser's own HTTP
           cache — which made the tide board look stuck on an old build. */
        const net = fetch(SHELL_URL, {cache:'no-store'})
          .then(res => { if(res && res.ok) c.put(SHELL_URL, res.clone()); return res; })
          .catch(() => null);
        return hit || net || fetch(req);
      })
    );
  }
});

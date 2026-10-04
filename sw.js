// Background helper that lets the app open quickly and work on a spotty connection.
//
// Rules, chosen so people never get stuck on an old version:
// - Pages (HTML) always come from the network first; the saved copy is only used offline.
// - Scripts and styles with a version tag (?v=...) never change, so the saved copy is safe to reuse.
// - Firebase's own library files are versioned in their address too, so they're reused the same way.
// - Group data isn't handled here (Firebase keeps its own offline copy).
const CACHE = "ss-v1";
const PAGES = ["./", "./index.html", "./group.html", "./organize.html", "./privacy.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PAGES).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Pages: network first, saved copy when offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(url.origin + url.pathname, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(url.origin + url.pathname).then(r => r || caches.match("./index.html"))));
    return;
  }

  const sameOrigin = url.origin === location.origin;
  const versioned = sameOrigin && url.searchParams.has("v");
  const firebaseLib = url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/");
  const icon = sameOrigin && url.pathname.includes("/icons/");
  if (versioned || firebaseLib || icon) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === "opaque") {
        const copy = res.clone();
        caches.open(CACHE).then(async c => {
          // Drop older versions of this same file so the saved copies don't pile up.
          if (versioned) for (const k of await c.keys()) { const u = new URL(k.url); if (u.pathname === url.pathname && u.search !== url.search) c.delete(k); }
          await c.put(req, copy);
        }).catch(() => {});
      }
      return res;
    })));
  }
  // Everything else (Firebase data, fonts, address lookups) goes straight to the network.
});

// Secret Santa moved to https://secret-santa-draw.github.io.
// This replaces the old offline helper: it clears its saved files, removes itself,
// and reloads any open pages so they reach the forwarding page.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    await self.registration.unregister();
    for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url);
  })());
});

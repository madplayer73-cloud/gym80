const OFFLINE_CACHE='gym80-offline-v1';
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(OFFLINE_CACHE).then(cache=>cache.add('/offline.html')).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('gym80-offline-')&&key!==OFFLINE_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
// Always use the current server response. Never cache personal data, uploads,
// API responses or application bundles; updates take effect on the next launch.
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(url.pathname.startsWith('/sync/') || url.pathname.startsWith('/pb/')) return;
  if(event.request.method==='GET' && event.request.mode==='navigate' && url.origin===self.location.origin) {
    event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')));
  }
});

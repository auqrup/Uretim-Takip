// Üretim Takip – sayfanın internetsiz de açılması için önbellek
const C = 'uretim-v3';
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png']))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))); self.clients.claim(); });
const put = (req, res) => { if (res && res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(req, cp)); } return res; };
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // Sayfa: önce internet (güncel sürüm); zayıf bağlantıda 4 sn sonra önbellekten aç
  if (u.origin === location.origin) {
    const net = fetch(e.request).then(r => put(e.request, r));
    const cached = () => caches.match(e.request).then(r => r || caches.match('./index.html'));
    e.respondWith(new Promise(res => {
      const t = setTimeout(() => cached().then(r => r && res(r)), 4000);
      net.then(r => { clearTimeout(t); res(r); }).catch(() => { clearTimeout(t); cached().then(r => res(r || Response.error())); });
    }));
    return;
  }
  // Firebase kütüphanesi: önbellekten
  if (u.hostname === 'www.gstatic.com') {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => put(e.request, res))));
  }
});

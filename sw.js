// Leo Artes: deixa o aplicativo funcionar sem internet.
// Com internet, sempre busca a versão mais nova; sem internet, usa a guardada.
// As anotações da Leonilde NÃO ficam aqui (ficam no localStorage), então trocar
// a versão do cache nunca apaga os dados dela.
const CACHE = 'leo-artes-v1';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icone-192.png', './icone-512.png', './icone-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonte = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (fonte) {
    // fontes: usa a guardada, senão baixa e guarda
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return;

  // arquivos do app: tenta a internet primeiro (pega atualizações), senão usa o guardado
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});

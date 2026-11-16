// 서비스 워커: 한 번 열어본 화면을 저장해 두었다가 인터넷이 끊겨도 보여줍니다.
// 전략: 네트워크 우선 → 실패하면 저장본 사용 (수정 사항이 바로 반영됨)
const CACHE = 'hanoi-helper-v6';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'features.js', 'data.js', 'viet.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // 외부 요청(환율 API 등)은 그대로
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

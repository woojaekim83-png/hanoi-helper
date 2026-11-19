// 서비스 워커: 한 번 열어본 화면을 저장해 두었다가 인터넷이 끊겨도 보여줍니다.
// 전략: 항상 서버에 새 버전이 있는지 확인(no-cache) → 실패하면 저장본 사용
const CACHE = 'hanoi-helper-v64';
const FILES = ['./', 'index.html', 'weather.html', 'style.css', 'app.js', 'features.js', 'data.js', 'viet1.js', 'viet2.js', 'viet3.js', 'viet4.js', 'viet5.js', 'news.json', 'market.json', 'quiz.css', 'quiz.js', 'quiz-result.js', 'quiz1.js', 'quiz2.js', 'quiz-food.js', 'cities.js', 'city-extra.js', 'city.html', 'rate.html', 'back.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'images/10000-back.jpg', 'images/10000-front.jpg', 'images/100000-back.jpg', 'images/100000-front.jpg', 'images/20000-back.jpg', 'images/20000-front.jpg', 'images/200000-back.jpg', 'images/200000-front.jpg', 'images/50000-back.jpg', 'images/50000-front.jpg', 'images/500000-back.jpg', 'images/500000-front.jpg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // 외부 요청(환율 API, 지폐 사진 등)은 그대로
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

// 도시 안내·주간 날씨 페이지의 '← 도우미로' 버튼
// 앱에서 들어왔으면 뒤로 가기(휴대폰 뒤로가기와 같음), 링크로 바로 들어왔으면 앱 첫 화면으로 이동
(function () {
  const back = document.getElementById('back');
  if (!back) return;
  back.addEventListener('click', (e) => {
    let fromApp = false;
    try { fromApp = sessionStorage.getItem('returnTab') !== null; } catch {}
    if (fromApp && history.length > 1) { e.preventDefault(); history.back(); return; }
    try { if (back.dataset.tab) sessionStorage.setItem('returnTab', back.dataset.tab); } catch {}
  });

  // 탭 하나로 쓰이는 페이지(맛집: data-self="food")는 앱처럼 좌우로 쓸어 옆 탭으로 이동
  const self = back.dataset.self;
  if (!self) return;
  let order = null;
  try { order = JSON.parse(localStorage.getItem('tabOrder') || 'null'); } catch {}
  if (!Array.isArray(order) || !order.some((t) => t.id === self)) {
    order = ['rate', 'bank', 'news', 'viet', 'life', 'quiz'].map((id) => ({ id, href: '' })).concat({ id: self, href: '' });
  }
  const go = (dir) => {
    const i = order.findIndex((t) => t.id === self);
    const t = order[(i + dir + order.length) % order.length];
    if (!t || t.id === self) return;
    if (t.href) { location.href = t.href; return; }
    let fromApp = false;
    try { fromApp = sessionStorage.getItem('returnTab') !== null; sessionStorage.setItem('returnTab', t.id); } catch {}
    if (fromApp && history.length > 1) history.back(); // 앱으로 돌아가면 startTab()이 이 탭을 열어요
    else location.href = './';
  };
  let sx = 0, sy = 0, t0 = 0, skip = false;
  document.addEventListener('touchstart', (e) => {
    const t = e.touches[0]; sx = t.clientX; sy = t.clientY; t0 = Date.now();
    skip = e.touches.length > 1 || !!e.target.closest('input, select, textarea, [data-noswipe]');
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (skip) return;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    const ms = Math.max(Date.now() - t0, 1), adx = Math.abs(dx), ady = Math.abs(dy);
    const flick = adx >= 25 && adx / ms > 0.35; // 감도는 앱(app.js)과 같게
    if ((adx < 40 && !flick) || adx < ady * 1.2 || ms > 1000) return;
    go(dx < 0 ? 1 : -1);
  }, { passive: true });
})();

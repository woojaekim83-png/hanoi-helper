// 베트남 생활 도우미 — 베트남어 · 생활(시계·달력) · 하단 바

/* ───── 베트남어: 성조 화살표 ───── */
// 성조 부호(유니코드 결합 문자)로 6성조를 판별
const TONES = {
  ngang: { arrow: '→', name: '평평하게', cls: 't-ngang' },
  sac:   { arrow: '↗', name: '올리기', cls: 't-sac' },
  huyen: { arrow: '↘', name: '낮게 내리기', cls: 't-huyen' },
  hoi:   { arrow: '↘↗', name: '내렸다 올리기', cls: 't-hoi' },
  nga:   { arrow: '~↗', name: '끊었다 올리기', cls: 't-nga' },
  nang:  { arrow: '↓', name: '짧게 뚝', cls: 't-nang' },
};
function toneOf(syllable) {
  const s = syllable.normalize('NFD');
  if (s.includes('́')) return 'sac';
  if (s.includes('̀')) return 'huyen';
  if (s.includes('̉')) return 'hoi';
  if (s.includes('̃')) return 'nga';
  if (s.includes('̣')) return 'nang';
  return 'ngang';
}
// 한글 발음 각 음절 위에 화살표 올리기
function rubyLine(vi, ko) {
  const v = vi.split(/\s+/), k = ko.split(/\s+/);
  return k.map((syl, i) => {
    const t = TONES[toneOf(v[i] || '')];
    return `<span class="syl ${t.cls}"><span class="arrow" title="${t.name}">${t.arrow}</span><span class="kr">${esc(syl)}</span></span>`;
  }).join('');
}

let vietCat = store.get('vietCat') || VIET[0].id;
function renderViet() {
  $('#viet-cats').innerHTML = VIET.map((c) =>
    `<button class="chip" type="button" data-id="${c.id}" aria-pressed="${c.id === vietCat}">${c.icon} ${c.name}</button>`
  ).join('');
  const cat = VIET.find((c) => c.id === vietCat) || VIET[0];
  $('#viet-list').innerHTML = cat.items.map((row) => {
    // 형식: [베트남어, 한글 발음, 뜻, '단어:뜻|단어:뜻']  (옛 형식 {vi, ko, mean}도 지원)
    const [vi, ko, mean, words = ''] = Array.isArray(row) ? row : [row.vi, row.ko, row.mean, row.w];
    const wl = words.split('|').filter(Boolean).map((x) => {
      const [w, m] = x.split(':');
      return `<li><b>${esc(w)}</b><span>${esc(m || '')}</span></li>`;
    }).join('');
    return `
    <li><button class="phrase" type="button" data-vi="${esc(vi)}">
      <span class="ph-main">
        <span class="ph-mean">${esc(mean)}</span>
        <span class="ph-ko">${rubyLine(vi, ko)}</span>
        <span class="ph-vi">${esc(vi)} <span class="say" aria-hidden="true">🔊</span></span>
      </span>
      ${wl ? `<ul class="ph-words">${wl}</ul>` : ''}
    </button></li>`;
  }).join('');
}
$('#tone-legend').innerHTML = Object.values(TONES).map((t) =>
  `<span class="${t.cls}"><b>${t.arrow}</b>${t.name}</span>`
).join('');
$('#viet-cats').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  vietCat = b.dataset.id; store.set('vietCat', vietCat); renderViet();
});
// 발음 듣기: 음성 파일(구글 번역 음성)을 '미디어 볼륨'으로 재생 → 휴대폰 음량 버튼과 연동
// 음성 파일을 못 받으면 휴대폰 내장 음성(TTS)으로 대신 읽어요.
const player = new Audio();
player.preload = 'auto';
function speakTTS(text, done) {
  if (!('speechSynthesis' in window)) return done();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'vi-VN'; u.rate = 0.85; u.volume = 1;
  const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('vi'));
  if (voice) u.voice = voice;
  u.onend = done; u.onerror = done;
  speechSynthesis.speak(u);
}
$('#viet-list').addEventListener('click', (e) => {
  const b = e.target.closest('.phrase'); if (!b) return;
  document.querySelectorAll('.phrase.speaking').forEach((x) => x.classList.remove('speaking'));
  b.classList.add('speaking');
  const done = () => b.classList.remove('speaking');
  const text = b.dataset.vi;
  player.pause();
  player.src = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=' + encodeURIComponent(text);
  player.volume = 1;
  player.onended = done;
  player.onerror = () => speakTTS(text, done);
  player.play().catch(() => speakTTS(text, done));
});

/* ───── 생활: 시계 ───── */
function tick() {
  const opt = { hour: '2-digit', minute: '2-digit', hour12: false };
  $('#clock-vn').textContent = new Date().toLocaleTimeString('ko-KR', { ...opt, timeZone: 'Asia/Ho_Chi_Minh' });
  $('#clock-kr').textContent = new Date().toLocaleTimeString('ko-KR', { ...opt, timeZone: 'Asia/Seoul' });
}

/* ───── 생활: 공휴일 달력 ───── */
const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
// 날짜별 공휴일 표 만들기 (기간은 하루씩 펼침)
const HOL_MAP = {};
HOLIDAYS.days.forEach((h) => {
  const s = new Date(h.d + 'T00:00'), e = new Date((h.to || h.d) + 'T00:00');
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const k = ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
    (HOL_MAP[k] ||= []).push(h);
  }
});
const vnToday = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
// 오늘 날짜에서 시작해 연도를 넘어 계속 넘길 수 있어요 (12월 → 다음 해 1월)
let calYear = vnToday.getFullYear();
let calMonth = vnToday.getMonth() + 1;
function moveMonth(step) {
  calMonth += step;
  if (calMonth > 12) { calMonth = 1; calYear++; }
  if (calMonth < 1) { calMonth = 12; calYear--; }
  renderCalendar();
}

function gcalLink(h) {
  const s = h.d.replace(/-/g, '');
  const end = new Date((h.to || h.d) + 'T00:00'); end.setDate(end.getDate() + 1);
  const e = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}`;
  let url = 'https://calendar.google.com/calendar/render?action=TEMPLATE' + `&dates=${s}/${e}`;
  if (h.name) {
    url += '&text=' + encodeURIComponent('🇻🇳 ' + h.name)
      + '&details=' + encodeURIComponent((h.off ? '베트남 공휴일 (휴무)' : '베트남 기념일') + (h.memo ? ' · ' + h.memo : ''));
  }
  return url;
}
function renderCalendar() {
  $('#cal-title').textContent = `${calYear}년 ${calMonth}월`;
  $('#cal-months').innerHTML = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const hasOff = HOLIDAYS.days.some((h) => h.d.startsWith(`${calYear}-${pad(m)}`) && h.off);
    return `<button type="button" data-m="${m}" aria-pressed="${m === calMonth}" class="${hasOff ? 'has-off' : ''}">${m}월</button>`;
  }).join('');

  const first = new Date(calYear, calMonth - 1, 1).getDay();
  const days = new Date(calYear, calMonth, 0).getDate();
  const todayKey = ymd(vnToday.getFullYear(), vnToday.getMonth() + 1, vnToday.getDate());
  let html = ['일', '월', '화', '수', '목', '금', '토'].map((w, i) => `<span class="wd ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${w}</span>`).join('');
  html += '<span></span>'.repeat(first);
  for (let d = 1; d <= days; d++) {
    const k = ymd(calYear, calMonth, d), hs = HOL_MAP[k] || [], wd = (first + d - 1) % 7;
    const off = hs.some((h) => h.off), memo = hs.length && !off;
    const cls = [off ? 'off' : '', memo ? 'memo' : '', k === todayKey ? 'today' : '', wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''].join(' ');
    // 날짜를 누르면 그 날짜로 구글 캘린더 일정 만들기 화면이 열림 (공휴일이면 이름도 미리 채움)
    // 하루짜리 기념일(예: 설날)을 연휴 기간보다 먼저 보여줌
    const main = hs.slice().sort((a, b) => (a.to ? 1 : 0) - (b.to ? 1 : 0))[0];
    const href = gcalLink(main ? { ...main, d: k, to: null } : { d: k, name: '', off: null });
    html += `<a class="day ${cls}" href="${href}" target="_blank" rel="noopener" title="${esc(hs.map((h) => h.name).join(', ') || '구글 캘린더에 일정 추가')}">${d}${main ? `<em>${esc(main.short || main.name)}</em>` : ''}</a>`;
  }
  $('#cal-grid').innerHTML = html;
}
$('#cal-months').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  calMonth = +b.dataset.m; renderCalendar();
});
$('#cal-prev').addEventListener('click', () => moveMonth(-1));
$('#cal-next').addEventListener('click', () => moveMonth(1));

// 알아두면 좋은 것: 분야별로 접었다 펼치기 (첫 분야만 펼친 상태)
$('#facts').innerHTML = FACTS.map((g, i) => `
  <li><details class="fact-group" name="facts"${i === 0 ? ' open' : ''}>
    <summary><span class="fg-icon">${g.icon}</span><b>${esc(g.title)}</b><span class="fg-count">${g.items.length}</span></summary>
    <ul class="fact-items">${g.items.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ul>
  </details></li>`).join('');
// 한 분야를 펼치면 나머지는 자동으로 접힘 (예전 브라우저용 보조 코드 포함)
document.querySelectorAll('.fact-group').forEach((d) => d.addEventListener('toggle', () => {
  if (!d.open) return;
  document.querySelectorAll('.fact-group').forEach((o) => { if (o !== d) o.open = false; });
}));

/* ───── 생활: 베트남 지도 일러스트 ───── */
// 경도·위도를 그림 좌표로 바꿔 간단한 S자 국토 모양을 그림 (정확한 지도가 아닌 일러스트)
const MAP_K = 20, MAP_LON0 = 101.5, MAP_LAT0 = 23.6;
const mx = (lon) => ((lon - MAP_LON0) * MAP_K).toFixed(1);
const my = (lat) => ((MAP_LAT0 - lat) * MAP_K).toFixed(1);
const OUTLINE = [
  [102.1, 22.4], [103.0, 22.6], [104.0, 22.8], [105.3, 23.3], [106.5, 22.9], [107.4, 21.6], [106.8, 20.9],
  [106.0, 19.9], [105.7, 19.0], [106.4, 18.0], [107.1, 17.0], [108.2, 16.1], [108.8, 15.3], [109.2, 13.8],
  [109.4, 12.5], [109.2, 11.6], [108.0, 10.7], [106.8, 10.3], [106.7, 9.6], [105.9, 8.8], [104.8, 8.6],
  [104.8, 9.5], [104.9, 10.4], [105.1, 10.9], [106.0, 11.4], [107.5, 12.3], [107.6, 13.6], [107.6, 14.6],
  [107.1, 15.2], [106.6, 16.3], [105.8, 17.3], [105.1, 18.4], [104.4, 18.9], [103.9, 19.3], [104.3, 19.9],
  [103.3, 20.8], [102.6, 21.3],
];
const ICON_NUDGE = { hoian: [7, 9], danang: [2, -4], hue: [-6, -4] }; // 가까운 도시 아이콘 겹침 방지
function renderMap() {
  const path = OUTLINE.map(([lon, lat], i) => `${i ? 'L' : 'M'}${mx(lon)},${my(lat)}`).join(' ') + 'Z';
  const pins = CITIES.map((c) => {
    const [dx, dy] = ICON_NUDGE[c.id] || [0, 0];
    const x = +mx(c.lon) + dx, y = +my(c.lat) + dy;
    return `<a href="city.html?c=${c.id}" target="_blank" rel="noopener" class="pin">
      <title>${c.name}</title>
      <circle cx="${x}" cy="${y}" r="9.5" />
      <text x="${x}" y="${y + 4.5}" text-anchor="middle">${c.icon}</text></a>`;
  }).join('');
  $('#vn-map').innerHTML = `<svg viewBox="0 -4 180 310" role="img" aria-label="베트남 지도와 주요 관광지">
      <path d="${path}" class="land"/>
      <circle cx="${mx(103.97)}" cy="${my(10.23)}" r="5" class="land"/>
      ${pins}
    </svg>`;
  $('#city-list').innerHTML = CITIES.map((c) =>
    `<a href="city.html?c=${c.id}" target="_blank" rel="noopener"><span>${c.icon}</span>${c.name}</a>`).join('');
}

/* ───── 하단 바: 내 목적지 (구글 지도) ───── */
function getPlace() {
  try { return { ...DOCK, ...JSON.parse(store.get('place') || '{}') }; } catch { return { ...DOCK }; }
}
const isLink = (q) => /^https?:\/\//i.test(q.trim());
const mapView = (q) => isLink(q) ? q.trim() : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
const mapDir = (q) => isLink(q) ? q.trim() : 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(q);

function renderDock() {
  const p = getPlace();
  $('#dock-title').textContent = p.title;
  $('#dock-sub').textContent = p.sub || p.query;
  $('#dock-dir').href = mapDir(p.query);
  $('#sheet-open').href = mapView(p.query);
}
const sheet = $('#place-sheet'), form = $('#place-form');
$('#dock-main').addEventListener('click', () => {
  const p = getPlace();
  form.title.value = p.title; form.sub.value = p.sub || ''; form.query.value = p.query;
  sheet.showModal();
});
form.addEventListener('submit', () => {
  store.set('place', JSON.stringify({ title: form.title.value.trim(), sub: form.sub.value.trim(), query: form.query.value.trim() }));
  renderDock();
});
$('#place-cancel').addEventListener('click', () => sheet.close());
$('#place-reset').addEventListener('click', () => { store.del('place'); renderDock(); sheet.close(); });
sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); }); // 바깥 누르면 닫기

/* ───── 홈 화면 설치 안내 ───── */
// 카카오톡 등 앱 안의 브라우저에서는 '홈 화면에 추가'가 안 되므로 외부 브라우저로 안내
(function setupInstall() {
  const ua = navigator.userAgent;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone || store.get('installHidden') === '1') return;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isKakao = /KAKAOTALK/i.test(ua);
  const inApp = isKakao || /NAVER|Line\/|Instagram|FBAN|FBAV|DaumApps|everytimeApp/i.test(ua);
  const box = $('#install'), text = $('#install-text'), btn = $('#install-btn');
  const show = (msg, label, href) => {
    text.innerHTML = msg; box.hidden = false;
    if (label) { btn.textContent = label; btn.hidden = false; if (href) btn.href = href; }
  };
  const url = location.href.split('#')[0];

  if (isKakao) {
    show('카카오톡 안에서는 홈 화면에 추가가 안 돼요.', isIOS ? '사파리로 열기' : '크롬으로 열기',
      'kakaotalk://web/openExternal?url=' + encodeURIComponent(url));
  } else if (inApp && isAndroid) {
    show('이 앱 안에서는 설치가 안 돼요.', '크롬으로 열기',
      'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end');
  } else if (inApp) {
    show('오른쪽 아래 <b>⋯</b> 또는 <b>공유</b> → <b>Safari로 열기</b> 후 홈 화면에 추가하세요.');
  } else if (isIOS) {
    show('하단 <b>공유(□↑)</b> → <b>홈 화면에 추가</b>를 누르면 앱처럼 쓸 수 있어요.');
  } else {
    // 안드로이드 크롬·PC 크롬/엣지: 설치 가능해지면 버튼 표시
    let deferred;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); deferred = e;
      show('홈 화면에 설치하면 앱처럼 바로 열 수 있어요.', '앱 설치');
    });
    btn.addEventListener('click', async (e) => {
      if (!deferred) return;
      e.preventDefault();
      deferred.prompt();
      await deferred.userChoice; deferred = null; box.hidden = true;
    });
    window.addEventListener('appinstalled', () => { box.hidden = true; });
  }
  $('#install-close').addEventListener('click', () => { box.hidden = true; store.set('installHidden', '1'); });
})();

/* ───── 시작 ───── */
renderViet(); renderCalendar(); renderDock(); renderMap();
tick(); setInterval(tick, 15000);
showTab('rate'); // 앱을 켜면 항상 경제(환율) 탭부터
window.addEventListener('pageshow', (e) => { if (e.persisted) showTab('rate'); }); // 뒤로가기 캐시로 다시 열릴 때도
window.addEventListener('hashchange', () => showTab(location.hash.slice(1)));

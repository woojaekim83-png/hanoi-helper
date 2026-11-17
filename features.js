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
// 한글 발음 각 음절 위에 화살표 올리기 (south=true면 남부 발음으로 바꿔서 표시)
function rubyLine(vi, ko, south = false) {
  const v = vi.split(/\s+/), k = ko.split(/\s+/);
  return k.map((syl, i) => {
    let tone = toneOf(v[i] || '');
    if (south && tone === 'nga') tone = 'hoi'; // 남부는 ngã(끊었다 올리기)를 hỏi처럼 발음
    const t = TONES[tone];
    const kr = south ? toSouth(v[i] || '', syl) : syl;
    return `<span class="syl ${t.cls}"><span class="arrow" title="${t.name}">${t.arrow}</span><span class="kr">${esc(kr)}</span></span>`;
  }).join('');
}

/* ───── 남부 발음 변환 (호치민 등 냐짱 이남) ─────
   북부 발음으로 적힌 한글을 베트남어 철자를 보고 남부식으로 바꿔요.
   · d / gi 로 시작: 북부 'ㅈ' → 남부 'y(이)' 소리   예) giờ 저→여, dị 지→이, giúp 줍→윱
   · r 로 시작:      북부 'ㅈ' → 남부 'ㄹ' 소리       예) rau 자우→라우, rồi 조이→로이
   · s 로 시작:      'ㅆ' → 'ㅅ'                     예) sân 썬→선
   · -anh 으로 끝남: '아인' → '안'                    예) nhanh 냐인→냔, Anh 아인→안
   · 성조: ngã(~↗)를 hỏi(↘↗)처럼 발음 */
const HG = 0xAC00;
const splitHangul = (ch) => { const c = ch.charCodeAt(0) - HG; return c < 0 || c > 11171 ? null : [Math.floor(c / 588), Math.floor((c % 588) / 28), c % 28]; };
const joinHangul = (l, v, t) => String.fromCharCode(HG + l * 588 + v * 28 + t);
const Y_GLIDE = { 0: 2, 4: 6, 13: 17, 8: 12, 1: 3, 5: 7 }; // ㅏ→ㅑ ㅓ→ㅕ ㅜ→ㅠ ㅗ→ㅛ ㅐ→ㅒ ㅔ→ㅖ
function toSouth(viSyl, ko) {
  const base = viSyl.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-zđ]/g, '');
  const chars = [...ko];
  const f = splitHangul(chars[0] || '');
  if (f) {
    let [l, v, t] = f;
    if (/^(gi|d)/.test(base) && l === 12) { l = 11; v = Y_GLIDE[v] ?? v; }
    else if (/^r/.test(base) && l === 12) l = 5;
    else if (/^s/.test(base) && l === 10) l = 9;
    chars[0] = joinHangul(l, v, t);
  }
  if (/anh$/.test(base) && chars.length >= 2 && chars[chars.length - 1] === '인') {
    const p = splitHangul(chars[chars.length - 2]);
    if (p && p[2] === 0 && (p[1] === 0 || p[1] === 2)) { chars.splice(-2, 2, joinHangul(p[0], p[1], 4)); }
  }
  return chars.join('');
}
// 내 지역이 냐짱(위도 12.3°) 이남이면 남부 발음
const isSouth = () => { try { return getPlace().lat <= 12.3; } catch { return false; } };
function dialectLabel() {
  const p = getPlace();
  if (p.lat <= 12.3) return `${p.region}(남부)`;
  if (p.lat >= 18) return `${p.region}(북부)`;
  return '하노이(북부)'; // 중부(다낭 등)는 북부 발음 기준
}

/* ───── 구글 번역 연결 (무료 · 인증키 없음) ───── */
// 구글 번역 웹 주소로 열면, 휴대폰에 구글 번역 앱이 있으면 앱으로 열려요.
const gtUrl = (text, sl, tl) =>
  `https://translate.google.com/?sl=${sl}&tl=${tl}&op=translate&text=${encodeURIComponent(String(text).trim())}`;
const gtBtn = (text, sl, tl) =>
  `<a class="gt" href="${gtUrl(text, sl, tl)}" target="_blank" rel="noopener" title="구글 번역에서 보기" aria-label="구글 번역에서 보기">G</a>`;

let vietCat = store.get('vietCat') || VIET[0].id;
function renderViet() {
  $('#viet-cats').innerHTML = VIET.map((c) =>
    `<button class="chip" type="button" data-id="${c.id}" aria-pressed="${c.id === vietCat}">${c.icon} ${c.name}</button>`
  ).join('');
  const cat = VIET.find((c) => c.id === vietCat) || VIET[0];
  const south = isSouth();
  $('#viet-note').textContent = `한글 발음은 ${dialectLabel()} 기준이에요. 문장을 누르면 소리로 들려줘요 🔊`;
  $('#viet-list').innerHTML = cat.items.map((row) => {
    // 형식: [베트남어, 한글 발음, 뜻, '단어:뜻|단어:뜻']  (옛 형식 {vi, ko, mean}도 지원)
    const [vi, ko, mean, words = ''] = Array.isArray(row) ? row : [row.vi, row.ko, row.mean, row.w];
    const wl = words.split('|').filter(Boolean).map((x) => {
      const [w, m] = x.split(':');
      return `<li><b>${esc(w)}</b><span>${esc(m || '')}</span></li>`;
    }).join('');
    // 문장마다 구글 번역 아이콘 1개 (카드 오른쪽 위)
    return `
    <li><div class="phrase" role="button" tabindex="0" data-vi="${esc(vi)}">
      ${gtBtn(vi, 'vi', 'ko')}
      <span class="ph-main">
        <span class="ph-mean">${esc(mean)}</span>
        <span class="ph-ko">${rubyLine(vi, ko, south)}</span>
        <span class="ph-vi">${esc(vi)} <span class="say" aria-hidden="true">🔊</span></span>
      </span>
      ${wl ? `<ul class="ph-words">${wl}</ul>` : ''}
    </div></li>`;
  }).join('');
  fitPhrases();
}
// 카드 크기는 그대로 두고, 넘치는 글자만 줄여서 한 줄에 맞춤
function shrinkToFit(el, prop, min, over) {
  let size = parseFloat(getComputedStyle(el)[prop === 'kr' ? 'fontSize' : prop]);
  const targets = prop === 'kr' ? el.querySelectorAll('.kr') : [el];
  if (prop === 'kr') size = parseFloat(getComputedStyle(targets[0]).fontSize);
  let gap = parseFloat(getComputedStyle(el).columnGap) || 0;
  while (over() && size > min) {
    size -= 0.5;
    targets.forEach((t) => { t.style.fontSize = size + 'px'; if (prop === 'kr') t.style.letterSpacing = '-0.5px'; });
    if (prop === 'kr' && gap > 2) { gap -= 0.5; el.style.columnGap = gap + 'px'; }
  }
}
function fitPhrases() {
  if ($('#panel-viet').hidden) return; // 숨겨진 상태에선 크기를 잴 수 없음
  $('#viet-list').querySelectorAll('.phrase').forEach((p) => {
    const ko = p.querySelector('.ph-ko');
    if (ko.children.length) shrinkToFit(ko, 'kr', 12, () => ko.scrollWidth > ko.clientWidth);
    p.querySelectorAll('.ph-mean, .ph-vi').forEach((el) => shrinkToFit(el, 'fontSize', 10, () => el.scrollWidth > el.clientWidth));
    const w = p.querySelector('.ph-words');
    if (!w) return;
    if (w.scrollHeight > w.clientHeight) w.classList.add('row');
    const items = w.querySelectorAll('li');
    let fs = 12;
    while (w.scrollHeight > w.clientHeight && fs > 9.5) {
      fs -= 0.5;
      items.forEach((li) => { li.style.fontSize = fs + 'px'; li.querySelector('b').style.fontSize = (fs + 1) + 'px'; });
    }
  });
}
addEventListener('resize', () => { if (!$('#panel-viet').hidden) renderViet(); });
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
$('#viet-list').addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('phrase')) { e.preventDefault(); e.target.click(); }
});
$('#viet-list').addEventListener('click', (e) => {
  if (e.target.closest('a.gt')) return; // 번역 아이콘을 누르면 소리 대신 구글 번역만 열기
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

/* ───── 생활: 필수앱 모음 ───── */
// 웹에서는 '앱이 설치돼 있는지' 직접 알 수 없어서, 휴대폰 종류에 맞는 공식 스토어로 연결해요.
//  · 안드로이드: intent 링크 → 설치돼 있으면 앱이 바로 열리고, 없으면 플레이스토어 설치 화면
//  · 아이폰: 앱스토어 화면 → 설치돼 있으면 [열기], 없으면 [받기] 버튼
const UA = navigator.userAgent;
const OS = /iPhone|iPad|iPod/i.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1) ? 'ios'
  : /Android/i.test(UA) ? 'android' : 'other';
const playUrl = (pkg) => `https://play.google.com/store/apps/details?id=${pkg}&hl=ko`;
function appLink(a) {
  if (OS === 'ios') return `https://apps.apple.com/app/id${a.ios}`;
  if (OS === 'android') {
    // 크롬은 '앱 실행(런처)' 링크를 막아서 늘 플레이스토어로 가요.
    // 그래서 그 앱이 직접 받아 주는 링크(open)로 열고, 앱이 없을 때만 플레이스토어로 보내요.
    if (!a.open) return playUrl(a.android);
    const m = a.open.match(/^([a-z][\w+.-]*):\/\/(.*)$/i);
    return `intent://${m[2]}#Intent;scheme=${m[1]};package=${a.android};`
      + `S.browser_fallback_url=${encodeURIComponent(playUrl(a.android))};end`;
  }
  return playUrl(a.android); // PC 등
}
function renderApps() {
  $('#apps-grid').innerHTML = APPS.map((a) => `
    <a class="app-tile" href="${esc(appLink(a))}" ${OS === 'android' ? '' : 'target="_blank" rel="noopener"'}>
      <span class="app-icon" style="--app:${a.color}" aria-hidden="true">${a.icon}</span>
      <b>${esc(a.name)}</b><small>${esc(a.sub)}</small>
    </a>`).join('');
  $('#apps-os').textContent = OS === 'ios' ? ' App Store' : OS === 'android' ? '▶ Google Play' : '';
  $('#apps-note').textContent = OS === 'ios'
    ? '누르면 앱스토어가 열려요. 설치돼 있으면 [열기], 없으면 [받기]만 누르면 돼요.'
    : OS === 'android'
      ? '설치된 앱은 바로 열리고, 없으면 플레이스토어 설치 화면으로 이동해요. (배달K·우리 WON은 플레이스토어에서 [열기])'
      : '휴대폰에서 누르면 설치돼 있는 앱은 열리고, 없으면 설치 화면으로 이동해요.';
}

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
    return `<a href="city.html?c=${c.id}" class="pin" data-return="life">
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
    `<a href="city.html?c=${c.id}" data-return="life"><span>${c.icon}</span>${c.name}</a>`).join('');
}

/* ───── 하단 바: 내 목적지 (구글 지도) ───── */
// getPlace()·applyAppName()은 app.js에 있어요
const mapView = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
const mapDir = (q) => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(q);

function renderDock() {
  const p = getPlace();
  $('#dock-title').textContent = '내 지역 설정';
  $('#dock-sub').textContent = p.mode === 'manual' ? p.query : p.title; // 지금 선택된 지점이나 주소
  $('#dock-dir').href = mapDir(p.query);
  $('#sheet-open').href = mapView(p.query);
}
const sheet = $('#place-sheet'), form = $('#place-form');
const sel = $('#branch-select'), manualBtn = $('#manual-toggle'), manualBox = $('#manual-box');
sel.innerHTML = BRANCHES.map((b) => `<option value="${b.id}">${esc(b.label)}</option>`).join('');

function showBranchAddr() {
  const b = BRANCHES.find((x) => x.id === sel.value);
  if (!b) return;
  $('#branch-addr').innerHTML = `📍 ${esc(b.addr)}`;
  $('#sheet-open').href = mapView(BRANCH_QUERY[b.id] || b.addr);
}
function setManual(on) {
  manualBtn.setAttribute('aria-pressed', on);
  manualBox.hidden = !on;
  sel.disabled = on;
  $('#branch-addr').hidden = on;
}
sel.addEventListener('change', showBranchAddr);
manualBtn.addEventListener('click', () => {
  const on = manualBtn.getAttribute('aria-pressed') !== 'true';
  setManual(on);
  if (on) $('#manual-query').focus(); // 수동을 직접 눌렀을 때만 키보드 표시
});

$('#dock-main').addEventListener('click', () => {
  const p = getPlace();
  $('#place-status').textContent = '';
  if (p.mode === 'manual') { $('#manual-query').value = p.query; setManual(true); }
  else { sel.value = p.id; $('#manual-query').value = ''; setManual(false); showBranchAddr(); }
  sheet.showModal();
  $('#sheet-title').focus({ preventScroll: true }); // 입력칸 자동 선택 방지 (키보드 안 뜸)
});

// 수동 주소 → 좌표·도시 이름 찾기 (OpenStreetMap 무료 지오코딩)
async function geocode(q) {
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn&addressdetails=1&accept-language=ko&q=' + encodeURIComponent(q);
  const r = await (await fetch(url)).json();
  if (!r[0]) return null;
  const a = r[0].address || {};
  return { lat: +(+r[0].lat).toFixed(4), lon: +(+r[0].lon).toFixed(4), city: a.city || a.town || a.state || a.province || a.county || '' };
}
function afterSave() {
  renderDock(); applyAppName(); loadToday(); renderViet(); // 지역에 따라 북부/남부 발음도 바로 바뀜
}
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (manualBtn.getAttribute('aria-pressed') === 'true') {
    const q = $('#manual-query').value.trim();
    if (!q) { $('#place-status').textContent = '주소를 입력해 주세요.'; return; }
    $('#place-status').textContent = '주소 위치를 찾는 중…';
    let g = null;
    try { g = await geocode(q); } catch {}
    store.set('place', JSON.stringify({ mode: 'manual', query: q, ...(g || {}) }));
    if (!g) {
      $('#place-status').textContent = '위치를 찾지 못해 날씨는 하노이 기준으로 보여드려요. 지도 길찾기는 입력한 주소로 열려요.';
      afterSave(); setTimeout(() => sheet.close(), 1800); return;
    }
  } else {
    store.set('place', JSON.stringify({ mode: 'branch', id: sel.value }));
  }
  afterSave(); sheet.close();
});
$('#place-cancel').addEventListener('click', () => sheet.close());
$('#place-reset').addEventListener('click', () => { store.del('place'); afterSave(); sheet.close(); });
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
renderViet(); renderCalendar(); renderDock(); renderMap(); renderApps();
tick(); setInterval(tick, 15000);
// 도시 안내·주간 날씨는 같은 창에서 열고, 휴대폰 뒤로가기로 돌아오면 보던 탭을 다시 보여줌
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-return]');
  if (!a) return;
  try { sessionStorage.setItem('returnTab', a.dataset.return === 'current'
    ? (document.querySelector('.tab[aria-selected="true"]')?.dataset.tab || 'rate') : a.dataset.return); } catch {}
});
function startTab() {
  let t = null;
  try { t = sessionStorage.getItem('returnTab'); sessionStorage.removeItem('returnTab'); } catch {}
  showTab(t || 'rate'); // 평소에는 앱을 켜면 항상 경제(환율) 탭부터
  if (t === 'life') $('#vn-map')?.scrollIntoView({ block: 'center' }); // 지도에서 보던 자리로
}
startTab();
window.addEventListener('pageshow', (e) => { if (e.persisted) startTab(); }); // 뒤로가기로 돌아왔을 때
window.addEventListener('hashchange', () => showTab(location.hash.slice(1)));

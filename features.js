// 하노이 생활 도우미 — 베트남어 · 생활(시계·달력) · 하단 바

/* ───── 베트남어: 성조 화살표 ───── */
// 성조 부호(유니코드 결합 문자)로 6성조를 판별
const TONES = {
  ngang: { arrow: '→', name: '평평하게', cls: 't-ngang' },
  sac:   { arrow: '↗', name: '올리기', cls: 't-sac' },
  huyen: { arrow: '↘', name: '낮게 내리기', cls: 't-huyen' },
  hoi:   { arrow: '↘↗', name: '내렸다 올리기', cls: 't-hoi' },
  nga:   { arrow: '~↗', name: '끊었다 확 올리기', cls: 't-nga' },
  nang:  { arrow: '↓', name: '짧고 무겁게 뚝', cls: 't-nang' },
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
  $('#viet-list').innerHTML = cat.items.map((p) => `
    <li><button class="phrase" type="button" data-vi="${esc(p.vi)}">
      <span class="ph-mean">${esc(p.mean)}</span>
      <span class="ph-ko">${rubyLine(p.vi, p.ko)}</span>
      <span class="ph-vi">${esc(p.vi)} <span class="say" aria-hidden="true">🔊</span></span>
    </button></li>`).join('');
}
$('#tone-legend').innerHTML = Object.values(TONES).map((t) =>
  `<span class="${t.cls}"><b>${t.arrow}</b>${t.name}</span>`
).join('');
$('#viet-cats').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  vietCat = b.dataset.id; store.set('vietCat', vietCat); renderViet();
});
// 브라우저 내장 음성(TTS)으로 읽어주기
$('#viet-list').addEventListener('click', (e) => {
  const b = e.target.closest('.phrase'); if (!b || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(b.dataset.vi);
  u.lang = 'vi-VN'; u.rate = 0.8;
  const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('vi'));
  if (voice) u.voice = voice;
  document.querySelectorAll('.phrase.speaking').forEach((x) => x.classList.remove('speaking'));
  b.classList.add('speaking');
  u.onend = () => b.classList.remove('speaking');
  speechSynthesis.speak(u);
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
const calYear = HOLIDAYS.year;
let calMonth = vnToday.getFullYear() === calYear ? vnToday.getMonth() + 1 : 1;

function gcalLink(h) {
  const s = h.d.replace(/-/g, '');
  const end = new Date((h.to || h.d) + 'T00:00'); end.setDate(end.getDate() + 1);
  const e = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}`;
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + '&text=' + encodeURIComponent('🇻🇳 ' + h.name) + `&dates=${s}/${e}`
    + '&details=' + encodeURIComponent((h.off ? '베트남 공휴일 (휴무)' : '베트남 기념일') + (h.memo ? ' · ' + h.memo : ''));
}
function renderCalendar() {
  $('#cal-title').textContent = `${calYear}년 ${calMonth}월`;
  $('#cal-months').innerHTML = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const hasOff = HOLIDAYS.days.some((h) => +h.d.slice(5, 7) === m && h.off);
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
    html += `<span class="day ${cls}" title="${esc(hs.map((h) => h.name).join(', '))}">${d}${hs.length ? `<em>${esc(hs[0].name.split(' ')[0])}</em>` : ''}</span>`;
  }
  $('#cal-grid').innerHTML = html;

  const list = HOLIDAYS.days.filter((h) => +h.d.slice(5, 7) === calMonth);
  const md = (s) => `${+s.slice(5, 7)}/${+s.slice(8)}`;
  $('#hol-list').innerHTML = list.length
    ? list.map((h) => `<li class="${h.off ? 'off' : 'memo'}">
        <span class="hd">${md(h.d)}${h.to ? '~' + md(h.to) : ''}</span>
        <span class="hn"><b>${esc(h.name)}</b>${h.memo ? `<small>${esc(h.memo)}</small>` : ''}</span>
        <a class="add-cal" href="${gcalLink(h)}" target="_blank" rel="noopener" title="내 구글 캘린더에 추가">+ 캘린더</a>
      </li>`).join('')
    : '<li class="none">이달에는 공휴일이 없어요</li>';
}
$('#cal-months').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  calMonth = +b.dataset.m; renderCalendar();
});
$('#cal-prev').addEventListener('click', () => { calMonth = calMonth === 1 ? 12 : calMonth - 1; renderCalendar(); });
$('#cal-next').addEventListener('click', () => { calMonth = calMonth === 12 ? 1 : calMonth + 1; renderCalendar(); });

$('#facts').innerHTML = FACTS.map((f) => `<li><span>${f.icon}</span><span>${esc(f.text)}</span></li>`).join('');

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
renderViet(); renderCalendar(); renderDock();
tick(); setInterval(tick, 15000);
showTab(location.hash.slice(1) || 'rate'); // 처음 열면 항상 환율 탭
window.addEventListener('hashchange', () => showTab(location.hash.slice(1)));

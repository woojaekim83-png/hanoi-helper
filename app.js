// 베트남 생활 도우미 — 공통 · 탭 · 뉴스 · 환율 · 지폐
const $ = (s) => document.querySelector(s);
const fmt = (n, d = 0) => n.toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: 0 });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

/* ───── 내 목적지 (우리은행 지점 또는 수동 주소) ───── */
// 저장 형식: { mode: 'branch', id } 또는 { mode: 'manual', query, lat, lon, city }
const BRANCH_QUERY = {
  hanoi: 'Woori Bank Vietnam Hanoi Branch Keangnam', hcm: 'Woori Bank Vietnam Ho Chi Minh branch Mplaza',
  dongnai: 'Woori Bank Vietnam Dong Nai branch', bacninh: 'Woori Bank Vietnam Bac Ninh branch',
  starlake: 'Woori Bank Vietnam Starlake branch', binhduong: 'Woori Bank Binh Duong branch Becamex',
  danang: 'Woori Bank Vietnam Da Nang branch', vinhphuc: 'Woori Bank Vinh Phuc branch',
  lotte: 'Woori Bank Vietnam Lotte Mall branch', bienhoa: 'Woori Bank Bien Hoa branch Sonadezi',
  hanam: 'Woori Bank Vietnam Ha Nam branch',
};
function getPlace() {
  let s = {};
  try { s = JSON.parse(store.get('place') || '{}') || {}; } catch {}
  if (s.mode === 'manual' && s.query) {
    return { mode: 'manual', title: '내가 정한 장소', sub: s.query, query: s.query,
      lat: s.lat ?? 21.03, lon: s.lon ?? 105.85, region: s.city || '하노이', appName: '베트남' };
  }
  const b = BRANCHES.find((x) => x.id === s.id) || BRANCHES[0];
  const saved = s.mode === 'branch' && s.id; // 아직 저장 전이면 앱 이름은 '베트남 생활 도우미'
  return { mode: 'branch', id: b.id, title: b.id === 'hanoi' ? '우리은행 베트남 본점' : `우리은행 ${b.label}`, sub: b.short,
    query: BRANCH_QUERY[b.id] || b.addr, lat: b.lat, lon: b.lon, region: b.region, appName: saved ? b.region : '베트남' };
}
// 앱 이름: 지점을 고르면 'OO 생활 도우미', 수동이면 '베트남 생활 도우미'
function applyAppName() {
  const name = `${getPlace().appName} 생활 도우미`;
  document.title = name;
  $('#app-name').textContent = name;
}

/* ───── 탭 전환 ───── */
const TABS = ['rate', 'news', 'viet', 'life'];
function showTab(name) {
  if (!TABS.includes(name)) name = 'rate';
  document.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === name));
  TABS.forEach((t) => ($('#panel-' + t).hidden = t !== name));
  store.set('tab', name);
  if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
  window.scrollTo(0, 0);
}
document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

/* ───── 뉴스 ───── */
const REGIONS = [
  { id: 'all', label: '전체' },
  { id: 'vn', label: '베트남', flag: 'VN' },
  { id: 'krvn', label: '한-베', flag: 'KRVN' },
  { id: 'kr', label: '한국', flag: 'KR' },
];
const REGION_NAME = { vn: '베트남', krvn: '한-베', kr: '한국' };
// 중요도 순서 — '전체'에서는 이 순서대로 분류별 주요 뉴스를 먼저 보여줍니다
const CATEGORIES = ['전체', '경제', '금융', '사회', '시사', '생활', '교민'];
const PER_GROUP = 4; // '전체' 화면에서 분류마다 보여줄 기사 수
const newsState = { region: 'all', category: '전체', limit: 30 };
let newsData = { updatedAt: '', items: [] };

// news.json: GitHub Actions가 3시간마다 자동으로 모아 둔 뉴스
async function loadNews() {
  try {
    const r = await fetch('news.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    newsData = await r.json();
  } catch {
    newsData = NEWS; // 못 불러오면 data.js의 기본 목록
  }
  renderNews();
}
function safeHttps(u) {
  try { const x = new URL(String(u || '')); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; }
}
function ago(iso) {
  if (!iso) return '';
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 60) return `${Math.max(m, 1)}분 전`;
  if (m < 1440) return `${Math.round(m / 60)}시간 전`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

function renderNewsFilters() {
  $('#region').innerHTML = REGIONS.map((r) =>
    `<button data-r="${r.id}" aria-pressed="${newsState.region === r.id}">${r.flag ? `<small>${r.flag}</small>` : ''}${r.label}</button>`
  ).join('');
  $('#category').innerHTML = CATEGORIES.map((c) =>
    `<button class="chip" data-c="${c}" aria-pressed="${newsState.category === c}">${c}</button>`
  ).join('');
}
function renderNews() {
  const items = (newsData.items || []).filter((n) =>
    (newsState.region === 'all' || n.region === newsState.region) &&
    (newsState.category === '전체' || n.category === newsState.category)
  );
  $('#news-meta').textContent = `${items.length}건 · ${newsData.updatedAt || '-'} 업데이트 · 1시간 반마다 갱신`;
  const card = (n) => {
    // 보안: https 주소만 그대로 열고, 그 외(javascript:, http:, 이상한 값)는 구글 뉴스 검색으로 대체
    const url = safeHttps(n.url) || 'https://news.google.com/search?hl=ko&q=' + encodeURIComponent(n.title);
    return `<a class="news" href="${esc(url)}" target="_blank" rel="noopener">
      <h3>${esc(n.title)}</h3>
      <div class="src"><span class="tag cat">${esc(n.category)}</span><span class="tag reg">${REGION_NAME[n.region] || ''}</span>${esc(n.source)} · ${esc(n.time ? ago(n.time) : n.date || '')}</div>
    </a>`;
  };
  if (!items.length) { $('#news-list').innerHTML = '<div class="card empty">해당 조건의 뉴스가 없어요</div>'; return; }

  if (newsState.category === '전체') {
    // 분류별로 묶어서 중요도 순서대로 (경제 → 금융 → 사회 → 시사 → 생활 → 교민)
    $('#news-list').innerHTML = CATEGORIES.slice(1).map((c) => {
      const g = items.filter((n) => n.category === c);
      if (!g.length) return '';
      return `<section class="news-group">
        <div class="group-head"><h2>${c}</h2><button type="button" class="group-more" data-c="${c}">${g.length}건 모두 보기 ›</button></div>
        ${g.slice(0, PER_GROUP).map(card).join('')}
      </section>`;
    }).join('');
    return;
  }
  const shown = items.slice(0, newsState.limit);
  $('#news-list').innerHTML = shown.map(card).join('') + (items.length > shown.length
    ? `<button class="more" id="news-more" type="button">더 보기 (${items.length - shown.length}건 남음)</button>` : '');
}
$('#news-list').addEventListener('click', (e) => {
  const g = e.target.closest('.group-more');
  if (g) { newsState.category = g.dataset.c; newsState.limit = 30; renderNewsFilters(); renderNews(); window.scrollTo(0, 0); return; }
  if (e.target.id !== 'news-more') return;
  newsState.limit += 30; renderNews();
});
$('#region').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  newsState.region = b.dataset.r; newsState.limit = 30; renderNewsFilters(); renderNews();
});
$('#category').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  newsState.category = b.dataset.c; newsState.limit = 30; renderNewsFilters(); renderNews();
});

/* ───── 환율 ───── */
let rates = { ...FALLBACK_RATES };
const CUR = {
  KRW: { label: '한국 원 (KRW)', d: 0, presets: [[10000, '1만'], [50000, '5만'], [100000, '10만'], [1000000, '100만']] },
  VND: { label: '베트남 동 (VND)', d: 0, presets: [[20000, '20k'], [50000, '50k'], [100000, '100k'], [200000, '200k'], [500000, '500k'], [1000000, '1M']] },
  USD: { label: '미국 달러 (USD)', d: 2, presets: [[10, '10'], [50, '50'], [100, '100'], [1000, '1,000']] },
};
const UNIT = { KRW: '원', VND: '동', USD: '달러' };
const convert = (amt, from, to) => (amt / rates[from]) * rates[to];
const parseAmount = (s) => Number(String(s).replace(/[^\d.]/g, '')) || 0;
const setAmount = (n, d = 0) => { $('#amount').value = n.toLocaleString('en-US', { maximumFractionDigits: d }); };

function renderPresets() {
  const from = $('#from').value;
  $('#presets').innerHTML = CUR[from].presets.map(([v, l]) =>
    `<button class="chip" type="button" data-v="${v}">${l}${from === 'VND' ? '' : ' ' + UNIT[from]}</button>`
  ).join('');
}
function renderConverter() {
  const amt = parseAmount($('#amount').value);
  const from = $('#from').value;
  $('#results').innerHTML = Object.keys(CUR).filter((c) => c !== from).map((c) =>
    `<li><span>${CUR[c].label}</span><b>${fmt(convert(amt, from, c), CUR[c].d)}</b></li>`
  ).join('');
  const to = from === 'KRW' ? 'VND' : 'KRW';
  $('#summary').innerHTML = `${fmt(amt, CUR[from].d)}${UNIT[from]} ≈ <b>${fmt(convert(amt, from, to))}${UNIT[to]}</b>`;
}
$('#presets').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  setAmount(Number(b.dataset.v)); renderConverter();
});
$('#swap').addEventListener('click', () => {
  const from = $('#from').value;
  const to = from === 'VND' ? 'KRW' : 'VND';
  const v = convert(parseAmount($('#amount').value), from, to);
  $('#from').value = to;
  setAmount(Math.round(v));
  renderPresets(); renderConverter();
});
$('#amount').addEventListener('input', (e) => {
  const raw = e.target.value.replace(/[^\d.]/g, '');
  const [i, d] = raw.split('.');
  e.target.value = (i ? Number(i).toLocaleString('en-US') : '') + (d !== undefined ? '.' + d : '');
  renderConverter();
});
$('#from').addEventListener('change', () => { renderPresets(); renderConverter(); });

async function loadRates() {
  try {
    const j = await (await fetch('https://open.er-api.com/v6/latest/USD')).json();
    if (j.result !== 'success') throw new Error('bad response');
    rates = { USD: 1, KRW: j.rates.KRW, VND: j.rates.VND };
    const when = new Date(j.time_last_update_unix * 1000)
      .toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\.\s?/g, '.').replace(/\.$/, '');
    $('#rate-base').innerHTML =
      `<div>1원 =<b>${fmt(rates.VND / rates.KRW, 1)}동</b></div>` +
      `<div>1달러 =<b>${fmt(rates.KRW)}원</b></div>` +
      `<div>1달러 =<b>${fmt(rates.VND)}동</b></div>`;
    $('#rate-meta').textContent = `기준환율 · ${when.slice(5)} 시장 기준 · 실제 환전 시 수수료 별도`;
  } catch {
    $('#rate-meta').textContent = '실시간 환율을 불러오지 못해 예시 환율로 계산 중이에요 (실제 환전 시 수수료 별도)';
  }
  renderConverter(); renderNotes();
}

/* ───── 오늘의 시세 (market.json: 우리은행 환율 + Petrolimex 유가, 자동 갱신) ───── */
function chg(v, d = 2) {
  if (v == null) return '<span class="chg">-</span>';
  if (Math.abs(v) < 1e-9) return '<span class="chg flat">-</span>';
  return `<span class="chg ${v > 0 ? 'up' : 'down'}">${v > 0 ? '▲' : '▼'}${fmt(Math.abs(v), d)}</span>`;
}
const FUEL_NAME = { '0201007': '고급 RON95', '0201005': 'E10 RON95', '0201004': 'E5 RON92', '0601002': '경유' };
async function loadMarket() {
  let m;
  try { m = await (await fetch('market.json?t=' + Date.now(), { cache: 'no-store' })).json(); } catch { m = null; }
  if (!m || (!m.rates && !m.fuel)) { $('#market').innerHTML = '<p class="meta">시세를 불러오지 못했어요</p>'; return; }
  const day = (s) => (s ? s.replace(/^\d{4}[.-]/, '').replace('-', '.').slice(0, 5) : m.updatedAt?.slice(0, 5) || '');
  let html = '';
  if (m.rates) {
    html += `<div class="mk-head"><b>환율</b><span>${day(m.rates.noticedAt)} 기준</span></div><ul class="mk-list">` +
      m.rates.items.map((r) => `<li><span class="mk-name">${r.flag} ${esc(r.name)}</span>
        <b class="mk-val">${r.value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>${chg(r.change)}</li>`).join('') + '</ul>';
  }
  if (m.fuel) {
    html += `<div class="mk-head mk-sep"><b>주유소 가격 (하노이)</b><span>${day(m.fuel.effectiveAt)} 기준</span></div><ul class="mk-list">` +
      m.fuel.items.map((f) => `<li><span class="mk-name">${f.icon} ${esc(FUEL_NAME[f.code] || f.name)}</span>
        <b class="mk-val">${fmt(f.value)}<small>동/L</small></b>${chg(f.change, 0)}</li>`).join('') + '</ul>';
  }
  html += `<p class="mk-src">출처: 우리은행 매매기준율(원) · Petrolimex 소매가 · ${esc(m.updatedAt || '')} 갱신</p>`;
  $('#market').innerHTML = html;
}

/* ───── 베트남 기준금리 ───── */
function renderPolicy() {
  const p = window.POLICY_RATE; if (!p) return;
  const diff = p.refinancing - p.prevRefinancing;
  $('#policy').innerHTML = `
    <div class="pol-main"><span>재융자금리 (기준금리)</span><b>${p.refinancing.toFixed(2)}%</b>
      <small>${diff < 0 ? '▼' : '▲'} ${Math.abs(diff).toFixed(2)}%p</small></div>
    <div class="pol-sub"><span>재할인금리</span><b>${p.discount.toFixed(2)}%</b></div>
    <div class="pol-sub"><span>최근 변경일</span><b>${p.changedAt}</b></div>
    <div class="pol-sub"><span>다음 발표일</span><b>정해진 일정 없음</b></div>`;
  $('#policy-meta').innerHTML = `베트남 중앙은행(SBV)은 정기 발표일 없이 수시로 결정해요 · ${p.checkedAt} 확인 · <a href="${p.source}" target="_blank" rel="noopener">SBV 홈페이지</a>`;
}

/* ───── 지폐: 실물 사진 + 금액 ───── */
// 사진이 없거나 못 불러올 때 대신 보여줄 색 그림
function billArt(n, label) {
  return `<div class="side-img bill-art" style="background:linear-gradient(135deg, ${n.c1}, ${n.c2})">
    <span class="art-text">${label}</span><span class="face">${n.short}</span></div>`;
}
// 한 면(앞/뒤) 그리기: 사진이 있으면 사진, 없으면 색 그림
function side(n, s, label) {
  let pic;
  if (s && s.src) {
    const size = s.crop ? '100% 200%' : 'cover';
    const pos = s.crop === 'top' ? 'center top' : s.crop === 'bottom' ? 'center bottom' : 'center';
    pic = `<div class="side-img" role="img" aria-label="${fmt(n.v)}동 ${label}"
      style="background-image:url('${esc(s.src)}');background-size:${size};background-position:${pos}"></div>`;
  } else {
    pic = billArt(n, label === '뒷면' ? n.back : '호찌민 초상');
  }
  return `<figure class="side">${pic}<figcaption>${label}${s && s.src ? '' : ' (그림)'}</figcaption></figure>`;
}
function renderNotes() {
  $('#notes').innerHTML = BANKNOTES.map((n) => {
    const krw = Math.round(convert(n.v, 'VND', 'KRW'));
    return `<li class="note-row" style="--c:${n.c2}">
      <div class="note-head">
        <div class="note-v">${fmt(n.v)}<small>동</small></div>
        <div class="note-k">≈ ${fmt(krw)}원</div>
      </div>
      <div class="note-sides">${side(n, n.front, '앞면')}${side(n, n.rear, '뒷면')}</div>
      <div class="note-desc"><i class="swatch"></i>${n.color} · 뒷면 ${n.back}${n.note ? ` · ${n.note}` : ''}</div>
      ${n.warn ? `<div class="note-warn">⚠️ ${n.warn}</div>` : ''}
    </li>`;
  }).join('');
}

/* ───── 헤더: 오늘 날짜 + 하노이 날씨 ───── */
const WEATHER = [
  [0, '☀️', '맑음'], [2, '🌤️', '구름 조금'], [3, '☁️', '흐림'], [48, '🌫️', '안개'],
  [57, '🌦️', '이슬비'], [67, '🌧️', '비'], [77, '🌨️', '눈'], [82, '🌧️', '소나기'], [99, '⛈️', '뇌우'],
];
async function loadToday() {
  const date = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Ho_Chi_Minh', month: 'long', day: 'numeric', weekday: 'short' });
  const vn = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  $('#today-date').textContent = `📅 ${vn.getMonth() + 1}.${vn.getDate()}(${'일월화수목금토'[vn.getDay()]})`;
  $('#today-date').title = `${date} · 내 구글 캘린더 열기`;
  // 날씨·미세먼지는 내 목적지(지점 또는 수동 주소)가 있는 지역 기준
  const p = getPlace();
  const wk = `weather.html?lat=${p.lat}&lon=${p.lon}&name=${encodeURIComponent(p.region)}`;
  $('#today-weather').href = wk; $('#today-air').href = wk;
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,weather_code&timezone=Asia%2FHo_Chi_Minh`);
    const c = (await r.json()).current;
    const [, icon, text] = WEATHER.find(([max]) => c.weather_code <= max) || WEATHER[0];
    $('#today-weather').textContent = `${icon} ${p.region} ${Math.round(c.temperature_2m)}° ${text}`;
    $('#today-weather').title = `${p.region} 현재 ${Math.round(c.temperature_2m)}° ${text} · 주간 날씨 보기`;
    $('#today-weather').hidden = false;
  } catch { /* 날씨를 못 불러오면 날짜만 표시 */ }
  loadAir(p);
}

/* ───── 미세먼지 (초미세먼지 PM2.5, ㎍/㎥) ───── */
// 5단계: 한국 환경부 기준(좋음 ~15 · 보통 ~35 · 나쁨 ~75 · 매우나쁨 76~)에 '아주좋음(~8)'을 더함
const AIR_LEVELS = [
  [8, '아주좋음', '😄', '#1c7ed6'],
  [15, '좋음', '🙂', '#2b8a3e'],
  [35, '보통', '😐', '#e67700'],
  [75, '나쁨', '😷', '#e8590c'],
  [Infinity, '아주나쁨', '🤢', '#c92a2a'],
];
const airLevel = (pm) => AIR_LEVELS.find(([max]) => pm <= max);
async function loadAir(p = getPlace()) {
  try {
    const r = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${p.lat}&longitude=${p.lon}&current=pm2_5,pm10&timezone=Asia%2FHo_Chi_Minh`);
    const pm = (await r.json()).current.pm2_5;
    if (pm == null) return;
    const [, label, icon, color] = airLevel(pm);
    const el = $('#today-air');
    el.innerHTML = `${icon} 미세먼지 <b style="color:${color}">${label}</b>`;
    el.title = `초미세먼지(PM2.5) ${Math.round(pm)}㎍/㎥`;
    el.hidden = false;
  } catch { /* 못 불러오면 표시 안 함 */ }
}

/* ───── 시작 ───── */
renderNewsFilters(); loadNews();
applyAppName();
renderPresets(); renderConverter(); renderPolicy(); renderNotes(); loadRates(); loadToday(); loadMarket();

// 웹앱(PWA): 오프라인에서도 열리도록 서비스 워커 등록
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
    .then((reg) => reg.update()).catch(() => {});
  // 새 버전이 설치되면 한 번 자동 새로고침해서 최신 화면 보여주기
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
}

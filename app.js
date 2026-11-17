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
  hanam: 'Woori Bank Vietnam Ha Nam branch', thainguyen: 'Woori Bank Vietnam Thai Nguyen branch',
  haiphong: 'Woori Bank Hai Phong Branch',
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
  const p = getPlace();
  const name = `${p.appName} 생활 도우미`;
  document.title = name;
  $('#app-name').textContent = name;
  // 지점을 저장했으면 맨 위 영역을 그 지역 일러스트로 (수동 입력·저장 전에는 기존 빨간 배경)
  const scene = p.mode === 'branch' && p.appName !== '베트남' && (window.SCENES?.branch || {})[p.id];
  const hero = $('.hero');
  hero.classList.toggle('scene', !!scene);
  $('#hero-scene').src = scene ? `images/scenes/${scene}.png` : '';
  $('#hero-scene').hidden = !scene;
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

// 손가락으로 좌우로 쓸어서 탭 이동 (왼쪽으로 쓸면 다음 탭, 오른쪽으로 쓸면 이전 탭)
(function setupSwipe() {
  let sx = 0, sy = 0, t0 = 0, skip = false;
  const area = document.querySelector('main');
  area.addEventListener('touchstart', (e) => {
    const t = e.touches[0]; sx = t.clientX; sy = t.clientY; t0 = Date.now();
    // 입력칸, 가로로 스크롤되는 영역(월 선택 등)에서는 탭 이동 안 함
    skip = e.touches.length > 1 || !!e.target.closest('input, select, textarea, .months, .vn-map, [data-noswipe]');
  }, { passive: true });
  area.addEventListener('touchend', (e) => {
    if (skip) return;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    // 감도: 40px 이상 옆으로 밀거나, 짧아도(25px~) 빠르게 튕기면 넘어감 · 대각선은 옆으로 더 많이 움직였을 때만
    const ms = Math.max(Date.now() - t0, 1), adx = Math.abs(dx), ady = Math.abs(dy);
    const flick = adx >= 25 && adx / ms > 0.35;
    if ((adx < 40 && !flick) || adx < ady * 1.2 || ms > 1000) return;
    const cur = TABS.indexOf(document.querySelector('.tab[aria-selected="true"]')?.dataset.tab);
    // 끝에서 계속 밀면 반대쪽 끝으로 (경제 ↔ 생활 순환)
    const next = (cur + (dx < 0 ? 1 : -1) + TABS.length) % TABS.length;
    showTab(TABS[next]);
  }, { passive: true });
})();

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
  $('#news-meta').textContent = `${items.length}건 · ${newsData.updatedAt || '-'} 업데이트 · 30분마다 갱신`;
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
    html += `<div class="mk-head mk-sep"><b>유류가격 (하노이)</b><span>${day(m.fuel.effectiveAt)} 기준</span></div><ul class="mk-list">` +
      m.fuel.items.map((f) => `<li><span class="mk-name">${f.icon} ${esc(FUEL_NAME[f.code] || f.name)}</span>
        <b class="mk-val">${fmt(f.value)}<small>동/L</small></b>${chg(f.change, 0)}</li>`).join('') + '</ul>';
  }
  html += `<p class="mk-src">출처: 우리은행 매매기준율(원) · Petrolimex 소매가 · ${esc(m.updatedAt || '')} 갱신</p>`;
  $('#market').innerHTML = html;
}

/* ───── 베트남 기준금리 ───── */
// policy.json: GitHub가 매일 베트남 시각 09:00에 SBV 홈페이지에서 읽어 둔 기준금리 (못 읽으면 data.js 값)
async function loadPolicy() {
  try {
    const j = await (await fetch('policy.json?t=' + Math.floor(Date.now() / 600000), { cache: 'no-cache' })).json();
    if (j && j.refinancing != null) window.POLICY_RATE = { ...window.POLICY_RATE, ...j };
  } catch { /* 파일이 없으면 data.js 값 사용 */ }
  renderPolicy();
}
function renderPolicy() {
  const p = window.POLICY_RATE; if (!p) return;
  const diff = p.refinancing - p.prevRefinancing;
  $('#policy').innerHTML = `
    <div class="pol-main"><span>재융자금리 (기준금리)</span><b>${p.refinancing.toFixed(2)}%</b>
      <small>${diff < 0 ? '▼' : '▲'} ${Math.abs(diff).toFixed(2)}%p</small></div>
    <div class="pol-sub"><span>재할인금리</span><b>${p.discount.toFixed(2)}%</b></div>
    <div class="pol-sub"><span>최근 결정일</span><b>${p.changedAt}</b></div>
    <div class="pol-sub"><span>다음 발표일</span><b>정해진 일정 없음</b></div>`;
  $('#policy-meta').innerHTML = `SBV는 정기 발표일 없이 수시로 결정해요${p.decision ? ` · 근거 ${esc(p.decision)}` : ''} · 매일 09시(베트남) 자동 확인 · 마지막 확인 ${esc(p.checkedAt)} · <a href="${esc(safeHttps(p.source) || 'https://sbv.gov.vn')}" target="_blank" rel="noopener">SBV 홈페이지</a>`;
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
    pic = billArt(n, label === '뒷면' ? n.back : '호치민 초상');
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
  // 날씨·미세먼지는 내 지역(지점 또는 수동 주소) 기준
  const p = getPlace();
  const wk = `weather.html?lat=${p.lat}&lon=${p.lon}&name=${encodeURIComponent(p.region)}`;
  $('#today-weather').href = wk; $('#today-air').href = wk;
  // ① 휴대폰에 저장된 값 → ② 우리 사이트의 weather.json(빠르고 안정적) → ③ 날씨 서버에서 최신 값
  if (!renderWx(p)) {
    $('#today-weather').textContent = `⏳ ${p.region} 날씨…`; $('#today-weather').hidden = false;
    $('#today-air').hidden = true;
  }
  await loadSiteWx();
  if (renderWx(p) && Date.now() - WX[wxKey(p.lat, p.lon)].at < WX_FRESH) return;
  await fetchWx([[p.lat, p.lon]]);
  if (!renderWx(p)) { // 모두 실패하면 멈춰 있지 않게 안내 (누르면 주간 날씨 페이지)
    $('#today-weather').textContent = `🌡️ ${p.region} 날씨 보기`;
  }
}

// GitHub가 30분마다 모아 두는 전 지역 날씨 파일 (같은 사이트라 휴대폰에서도 바로 열림)
let siteWxLoaded = null;
function loadSiteWx() {
  if (siteWxLoaded) return siteWxLoaded;
  siteWxLoaded = (async () => {
    try {
      const j = await (await fetch('weather.json?t=' + Math.floor(Date.now() / 600000), { cache: 'no-cache' })).json();
      for (const [k, v] of Object.entries(j.places || {})) {
        if (!v.current) continue;
        const old = WX[k];
        if (old && old.at >= j.at) continue; // 휴대폰에 더 최신 값이 있으면 유지
        WX[k] = { temp: v.current.temperature_2m, code: v.current.weather_code, pm: v.pm, at: j.at };
      }
      saveWx();
    } catch { /* 파일을 못 읽으면 날씨 서버로 */ }
  })();
  return siteWxLoaded;
}

/* ───── 날씨·미세먼지 빠르게: 여러 곳을 한 번에 받아 저장해 두기 ───── */
const WX_FRESH = 20 * 60 * 1000; // 20분 동안은 저장해 둔 값을 그대로 사용
const wxKey = (lat, lon) => `${(+lat).toFixed(2)},${(+lon).toFixed(2)}`;
let WX = {};
try { WX = JSON.parse(localStorage.getItem('wxCache') || '{}') || {}; } catch {}
const saveWx = () => { try { localStorage.setItem('wxCache', JSON.stringify(WX)); } catch {} };

// 날씨 서버 연결이 가끔 20초 넘게 멈추는 경우가 있어서: 4초 안에 답이 없으면 끊고 다시 시도 (최대 3번)
async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 4000);
    try { const r = await fetch(url, { signal: ctl.signal }); if (r.ok) return await r.json(); }
    catch {} finally { clearTimeout(timer); }
  }
  return null;
}
// 좌표 여러 개의 현재 날씨 + 초미세먼지를 동시에 받아오기 (Open-Meteo는 한 번에 여러 지점 조회 가능)
async function fetchWx(points) {
  const lat = points.map((x) => (+x[0]).toFixed(4)).join(','), lon = points.map((x) => (+x[1]).toFixed(4)).join(',');
  const [w, a] = await Promise.all([
    getJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia%2FHo_Chi_Minh`),
    getJson(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5&timezone=Asia%2FHo_Chi_Minh`),
  ]);
  const ws = w ? (Array.isArray(w) ? w : [w]) : [], as = a ? (Array.isArray(a) ? a : [a]) : [];
  points.forEach(([la, lo], i) => {
    const k = wxKey(la, lo), old = WX[k] || {};
    const cw = ws[i]?.current, ca = as[i]?.current;
    if (!cw && !ca) return;
    WX[k] = { temp: cw ? cw.temperature_2m : old.temp, code: cw ? cw.weather_code : old.code,
      pm: ca ? ca.pm2_5 : old.pm, at: Date.now() };
  });
  saveWx();
}
// 저장된 값으로 헤더 그리기 (있으면 true)
function renderWx(p) {
  const c = WX[wxKey(p.lat, p.lon)];
  if (!c || c.temp == null) return false;
  const [, icon, text] = WEATHER.find(([max]) => c.code <= max) || WEATHER[0];
  const el = $('#today-weather');
  el.textContent = `${icon} ${p.region} ${Math.round(c.temp)}° ${text}`;
  el.title = `${p.region} 현재 ${Math.round(c.temp)}° ${text} · 주간 날씨 보기`;
  el.hidden = false;
  if (c.pm != null) {
    const [, label, aicon, color] = airLevel(c.pm);
    const air = $('#today-air');
    air.innerHTML = `${aicon} 미세먼지 <b style="color:${color}">${label}</b>`;
    air.title = `초미세먼지(PM2.5) ${Math.round(c.pm)}㎍/㎥`;
    air.hidden = false;
  }
  return true;
}
// 앱을 열면 우리은행 전 지점 + 지도 도시들의 날씨를 한 번에 미리 받아 둠 → 지역을 바꾸면 즉시 표시
async function prefetchWx() {
  await loadSiteWx();
  const pts = [...BRANCHES, ...(window.CITIES || [])].map((x) => [x.lat, x.lon]);
  const stale = pts.filter(([la, lo]) => { const c = WX[wxKey(la, lo)]; return !c || Date.now() - c.at > WX_FRESH; });
  if (stale.length) fetchWx(stale).then(() => renderWx(getPlace()));
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

/* ───── 시작 ───── */
renderNewsFilters(); loadNews();
applyAppName();
renderPresets(); renderConverter(); renderPolicy(); loadPolicy(); renderNotes(); loadRates(); loadToday(); loadMarket();
setTimeout(prefetchWx, 300); // 내 지역 날씨를 먼저 받고 나서 나머지 지역을 미리 받아 둠

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

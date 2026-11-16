// 하노이 생활 도우미 — 공통 · 탭 · 뉴스 · 환율 · 지폐
const $ = (s) => document.querySelector(s);
const fmt = (n, d = 0) => n.toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: 0 });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

/* ───── 탭 전환 ───── */
const TABS = ['rate', 'news', 'viet', 'life'];
function showTab(name) {
  if (!TABS.includes(name)) name = 'news';
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
const CATEGORIES = ['전체', '경제', '금융', '생활', '사회', '시사', '일반'];
const newsState = { region: 'vn', category: '전체' };

function renderNewsFilters() {
  $('#region').innerHTML = REGIONS.map((r) =>
    `<button data-r="${r.id}" aria-pressed="${newsState.region === r.id}">${r.flag ? `<small>${r.flag}</small>` : ''}${r.label}</button>`
  ).join('');
  $('#category').innerHTML = CATEGORIES.map((c) =>
    `<button class="chip" data-c="${c}" aria-pressed="${newsState.category === c}">${c}</button>`
  ).join('');
}
function renderNews() {
  const items = NEWS.items.filter((n) =>
    (newsState.region === 'all' || n.region === newsState.region) &&
    (newsState.category === '전체' || n.category === newsState.category)
  );
  $('#news-meta').textContent = `${items.length}건 · 업데이트 ${NEWS.updatedAt} · 기사를 누르면 원문이 열립니다`;
  $('#news-list').innerHTML = items.length
    ? items.map((n) => {
        const url = n.url || 'https://news.google.com/search?hl=ko&q=' + encodeURIComponent(n.title.replace(/^\[예시\]\s*/, ''));
        return `<a class="news" href="${esc(url)}" target="_blank" rel="noopener">
          <div class="tags"><span class="tag cat">${esc(n.category)}</span><span class="tag reg">${REGION_NAME[n.region] || ''}</span></div>
          <h3>${esc(n.title)}</h3>
          <div class="src">${esc(n.source)} · ${esc(n.date)}</div>
        </a>`;
      }).join('')
    : '<div class="card empty">해당 조건의 뉴스가 없어요</div>';
}
$('#region').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  newsState.region = b.dataset.r; renderNewsFilters(); renderNews();
});
$('#category').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  newsState.category = b.dataset.c; renderNewsFilters(); renderNews();
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
    $('#rate-meta').innerHTML = `기준환율 <b>1원 ≈ ${fmt(rates.VND / rates.KRW, 1)}동</b> · 1달러 ≈ ${fmt(rates.KRW)}원 (${when} 시장 기준 · 실제 환전 시 수수료 별도)`;
  } catch {
    $('#rate-meta').textContent = '실시간 환율을 불러오지 못해 예시 환율로 계산 중이에요 (실제 환전 시 수수료 별도)';
  }
  renderConverter(); renderNotes();
}

/* ───── 지폐: 실물 사진 + 금액 ───── */
// 사진이 없거나 못 불러올 때 대신 보여줄 색 그림
function billArt(n) {
  return `<div class="bill-art" style="background:linear-gradient(135deg, ${n.c1}, ${n.c2})">
    <span class="bank">NGÂN HÀNG NHÀ NƯỚC VIỆT NAM</span><span class="face">${n.short}</span></div>`;
}
function renderNotes() {
  $('#notes').innerHTML = BANKNOTES.map((n, i) => {
    const krw = Math.round(convert(n.v, 'VND', 'KRW'));
    const pic = n.photo
      ? `<img src="${esc(n.photo)}" alt="${fmt(n.v)}동 지폐 실물 사진" loading="lazy" data-i="${i}">`
      : billArt(n);
    return `<li class="note-row" style="--c:${n.c2}">
      <div class="note-pic">${pic}<span class="note-badge">${n.short}</span></div>
      <div class="note-info">
        <div class="note-v">${fmt(n.v)}<small>동</small></div>
        <div class="note-k">≈ ${fmt(krw)}원</div>
        <div class="note-desc"><i class="swatch"></i>${n.color} · ${n.back}${n.note ? ` · ${n.note}` : ''}</div>
        ${n.warn ? `<div class="note-warn">⚠️ ${n.warn}</div>` : ''}
      </div>
    </li>`;
  }).join('');
  // 사진을 못 불러오면 그림으로 교체
  document.querySelectorAll('.note-pic img').forEach((img) => {
    img.addEventListener('error', () => { img.outerHTML = billArt(BANKNOTES[img.dataset.i]); }, { once: true });
  });
}

/* ───── 헤더: 오늘 날짜 + 하노이 날씨 ───── */
const WEATHER = [
  [0, '☀️', '맑음'], [2, '🌤️', '구름 조금'], [3, '☁️', '흐림'], [48, '🌫️', '안개'],
  [57, '🌦️', '이슬비'], [67, '🌧️', '비'], [77, '🌨️', '눈'], [82, '🌧️', '소나기'], [99, '⛈️', '뇌우'],
];
async function loadToday() {
  const date = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Ho_Chi_Minh', month: 'long', day: 'numeric', weekday: 'short' });
  $('#today').textContent = `📅 ${date}`;
  try {
    const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=21.03&longitude=105.85&current=temperature_2m,weather_code&timezone=Asia%2FHo_Chi_Minh');
    const c = (await r.json()).current;
    const [, icon, text] = WEATHER.find(([max]) => c.weather_code <= max) || WEATHER[0];
    $('#today').textContent = `📅 ${date} · ${icon} 하노이 ${Math.round(c.temperature_2m)}° ${text}`;
  } catch { /* 날씨를 못 불러오면 날짜만 표시 */ }
}

/* ───── 시작 ───── */
renderNewsFilters(); renderNews();
renderPresets(); renderConverter(); renderNotes(); loadRates(); loadToday();

// 웹앱(PWA): 오프라인에서도 열리도록 서비스 워커 등록
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

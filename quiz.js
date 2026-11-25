// ─────────────────────────────────────────────
// 오늘의 퀴즈: 하루 10문제 (4지선다) · 즉시 채점 · 찬스 1번 · 10개 다 맞히면 맛집 공개
// 모든 기록은 이 휴대폰(localStorage)에만 저장 — 서버로 보내지 않아요
// ─────────────────────────────────────────────
const QZ_CAT = {
  word: { icon: '🔤', name: '단어', color: '#2f6fed' },
  phrase: { icon: '🗣️', name: '생활 표현', color: '#0f9d76' },
  expr: { icon: '💬', name: '회화', color: '#0f9d76' },
  idiom: { icon: '📜', name: '숙어·속담', color: '#a35bd6' },
  culture: { icon: '🏮', name: '상식·문화', color: '#e8590c' },
  geo: { icon: '🗺️', name: '지리', color: '#1c7ed6' },
  history: { icon: '🏛️', name: '역사', color: '#c2255c' },
};
// 하루 10문제 구성: 언어 5 + 상식 5
const QZ_PLAN = ['phrase', 'phrase', 'word', 'expr', 'idiom', 'culture', 'culture', 'geo', 'history', 'history'];
const QZ_TOTAL = 10;

/* ── 문제은행 만들기 ── */
let QZ_BANK = null;
function qzBank() {
  if (QZ_BANK) return QZ_BANK;
  const bank = {};
  const add = (q) => { (bank[q.cat] = bank[q.cat] || []).push(q); };
  // ① 직접 만든 문제 (quiz1.js · quiz2.js)
  (window.QUIZ || []).forEach((r, i) => {
    const [cat, q, a, w1, w2, w3, hint, exp] = r;
    add({ id: 'h' + i, cat, q, a, wrong: [w1, w2, w3], hint, exp });
  });
  // ② 베트남어 탭 표현으로 자동 생성 (뜻 맞히기 · 베트남어 고르기 · 단어 뜻)
  // 헷갈리는 오답 거르기: 괄호·문장부호를 뺀 뒤 같거나, 한쪽이 다른 쪽을 품거나, 글자 조각이 절반 이상 겹치면 "비슷함"
  //   예) "지금 몇 시예요?" ↔ "지금 몇 시예요? (정중하게)", "Cảm ơn" ↔ "Cảm ơn nhiều" 은 같은 문제의 보기로 안 씀
  const qzNorm = (s) => String(s).toLowerCase().replace(/\(.*?\)/g, '').replace(/[?!.,·~…"“”'’/\s-]/g, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  const grams = (s) => { const g = new Set(); for (let i = 0; i < s.length - 1; i++) g.add(s.slice(i, i + 2)); return g; };
  const qzSimilar = (a, b) => {
    const x = qzNorm(a), y = qzNorm(b);
    if (!x || !y || x === y || x.includes(y) || y.includes(x)) return true;
    const gx = grams(x), gy = grams(y);
    let n = 0; gx.forEach((g) => gy.has(g) && n++);
    return n / Math.min(gx.size || 1, gy.size || 1) >= 0.5;
  };
  // pool: 후보 [보기로 쓸 글, 짝 글] 목록 · ans: 정답 쪽 [보기 글, 짝 글] — 둘 다 비슷하지 않은 것만 오답으로
  const pick3 = (pool, ans, seed) => {
    const out = [];
    const ok = (c) => !qzSimilar(c[0], ans[0]) && !(c[1] && ans[1] && qzSimilar(c[1], ans[1])) && out.every((o) => !qzSimilar(o, c[0]));
    for (let k = 0; out.length < 3 && k < pool.length * 2; k++) {
      const c = pool[(seed * 7 + k * 13) % pool.length];
      if (c && c[0] && ok(c)) out.push(c[0]);
    }
    return out.length === 3 ? out : null;
  };
  const words = new Map();
  (window.VIET || []).forEach((g) => {
    const kv = g.items.map((it) => [it[2], it[0]]), vk = g.items.map((it) => [it[0], it[2]]);
    g.items.forEach((it, j) => {
      const [vi, pron, ko, ws] = it;
      const where = `${g.icon} ${g.name}`;
      const w1 = pick3(kv, [ko, vi], j);
      if (w1) add({ id: `p${g.id}${j}a`, cat: 'phrase', q: `“${vi}”의 뜻은?`, say: vi, a: ko, wrong: w1,
        hint: `발음은 “${pron}”, ${g.name} 상황에서 써요`, exp: `${vi} [${pron}] = ${ko} · ${where}` });
      const w2 = pick3(vk, [vi, ko], j + 3);
      if (w2) add({ id: `p${g.id}${j}b`, cat: 'phrase', q: `“${ko}”를 베트남어로 하면?`, a: vi, wrong: w2, sayAns: true,
        hint: `발음: ${pron}`, exp: `${vi} [${pron}] = ${ko} · ${where}` });
      String(ws || '').split('|').forEach((p) => {
        const k = p.indexOf(':'), w = k > 0 ? p.slice(0, k) : '', m = k > 0 ? p.slice(k + 1) : ''; // 뜻 안의 ':'는 그대로
        if (w && m && !words.has(w.trim().toLowerCase())) words.set(w.trim().toLowerCase(), { w: w.trim(), m: m.trim(), ex: vi, exKo: ko, g: g.name, gi: g.icon });
      });
    });
  });
  const wl = [...words.values()], mw = wl.map((x) => [x.m, x.w]);
  wl.forEach((x, i) => {
    const wr = pick3(mw, [x.m, x.w], i);
    if (wr) add({ id: 'w' + i, cat: 'word', q: `베트남어 단어 “${x.w}”의 뜻은?`, say: x.w, a: x.m, wrong: wr,
      hint: `${x.gi} ${x.g} 상황에서 자주 쓰는 단어예요`, exp: `${x.w} = ${x.m} · 예) ${x.ex} = ${x.exKo}` });
  });
  QZ_BANK = bank;
  return bank;
}
const qzCount = () => Object.values(qzBank()).reduce((s, a) => s + a.length, 0);

/* ── 저장 (휴대폰 안에만) ── */
const qzToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }); // YYYY-MM-DD
const qzLoad = (k, d) => { try { return JSON.parse(store.get(k) || 'null') ?? d; } catch { return d; } };
const qzSave = (k, v) => store.set(k, JSON.stringify(v));
const qzStats = () => qzLoad('quiz-stats', { streak: 0, last: '', days: 0, perfect: 0, solved: 0, correct: 0, seen: [], food: [] });
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function qzNewSet() {
  const bank = qzBank(), st = qzStats(), seen = new Set(st.seen || []), used = new Set();
  return shuffle(QZ_PLAN).map((cat) => {
    const pool = bank[cat] || bank.culture;
    let cand = pool.filter((q) => !seen.has(q.id) && !used.has(q.id));
    if (!cand.length) cand = pool.filter((q) => !used.has(q.id));
    const q = cand[Math.floor(Math.random() * cand.length)];
    used.add(q.id);
    return { id: q.id, opts: shuffle([q.a, ...q.wrong]), pick: null, chance: false };
  });
}
const qzFind = (id) => { for (const a of Object.values(qzBank())) { const q = a.find((x) => x.id === id); if (q) return q; } return null; };

/* ── 화면 ── */
let qz = null, qzLast = -1; // 지금 풀고 있는 판 { date, practice, items, cur, chanceUsed, done }
function qzState() {
  const today = qzToday();
  const s = qzLoad('quiz-day', null);
  return s && s.date === today ? s : null;
}
function qzPersist() { if (qz && !qz.practice) qzSave('quiz-day', qz); }

function renderQuiz() {
  const box = $('#quiz');
  if (!box) return;
  const day = qzState();
  if (qz && qz.practice) return qz.done ? qzResult() : qzDraw();
  qz = day;
  if (!qz) return qzHome();
  if (qz.done) return qzResult();
  qzDraw();
}

function qzHome() {
  const st = qzStats();
  $('#quiz').innerHTML = `
    <div class="qz-hero">
      <div class="qz-hero-top"><span class="qz-date">${qzToday().slice(5).replace('-', '월 ')}일 · 오늘의 10문제</span>
        <span class="qz-streak" title="연속 참여">🔥 ${st.streak}일 연속</span></div>
      <h3>오늘의 베트남 퀴즈</h3>
      <p class="qz-tag">하루 10문제, 3분이면 충분해요</p>
      <p>단어 · 회화부터 역사 · 지리까지.<br>매일 조금씩 풀다 보면 베트남이 더 가까워져요.</p>
      <div class="qz-rules">
        <span>💡 <b>찬스 1회</b> · 헷갈리면 오답 2개 지우기</span>
        <span>🎁 <b>10문제 모두 맞히면</b> 숨겨진 보상이 열려요</span>
      </div>
      <button class="qz-start" id="qz-start" type="button">시작하기 <span aria-hidden="true">→</span></button>
      <div class="qz-deco" aria-hidden="true"><i>🍜</i><i>🏮</i><i>🧧</i><i>🛵</i></div>
    </div>
    <div class="qz-stats">
      <div><b>${st.days}</b><span>참여한 날</span></div>
      <div><b>${st.perfect}</b><span>만점 횟수</span></div>
      <div><b>${st.solved ? Math.round((st.correct / st.solved) * 100) : 0}%</b><span>정답률</span></div>
    </div>
    <p class="qz-foot">총 ${qzCount().toLocaleString()}문제 · 기록은 내 기기에만 저장돼요</p>`;
  $('#qz-start').onclick = () => {
    qz = { date: qzToday(), practice: false, items: qzNewSet(false), cur: 0, chanceUsed: false, done: false };
    qzPersist();
    qzDraw();
  };
}

function qzDots() {
  return `<div class="qz-dots">${qz.items.map((it, i) => {
    const q = qzFind(it.id);
    const cls = it.pick == null ? (i === qz.cur ? 'now' : '') : it.pick === q.a ? 'ok' : 'no';
    return `<i class="${cls}"></i>`;
  }).join('')}</div>`;
}

function qzDraw() {
  const it = qz.items[qz.cur], q = qzFind(it.id), c = QZ_CAT[q.cat] || QZ_CAT.culture;
  const answered = it.pick != null, ok = answered && it.pick === q.a;
  const score = qz.items.filter((x) => x.pick != null && x.pick === qzFind(x.id).a).length;
  const hidden = it.chance ? qzHidden(it, q) : [];
  const fresh = qzLast !== qz.cur + (qz.practice ? 100 : 0); qzLast = qz.cur + (qz.practice ? 100 : 0); // 새 문제일 때만 등장 효과
  $('#quiz').innerHTML = `
    <div class="qz-play${qz.practice ? ' practice' : ''}">
      <div class="qz-bar">
        <span class="qz-num">${qz.practice ? '연습 ' : ''}<b>${qz.cur + 1}</b> / ${QZ_TOTAL}</span>
        ${qzDots()}
        <span class="qz-score">✔ ${score}</span>
      </div>
      <div class="qz-card${fresh ? ' enter' : ''}" style="--qc:${c.color}">
        <span class="qz-chip">${c.icon} ${c.name}</span>
        <p class="qz-q">${esc(q.q)}</p>
        ${q.say ? `<button class="qz-say" type="button" data-say="${esc(q.say)}">🔊 발음 듣기</button>` : ''}
        ${it.chance && !answered ? `<p class="qz-hint">💡 ${esc(q.hint || '보기 2개를 지웠어요')}</p>` : ''}
        <div class="qz-opts">
          ${it.opts.map((o, i) => {
            let cls = '';
            if (answered) cls = o === q.a ? 'right' : o === it.pick ? 'wrong' : 'dim';
            else if (hidden.includes(o)) cls = 'gone';
            return `<button class="qz-opt ${cls}" type="button" data-i="${i}" ${answered || cls === 'gone' ? 'disabled' : ''}>
              <span class="qz-letter">${'ABCD'[i]}</span><span class="qz-txt">${esc(o)}</span>
              ${answered && o === q.a ? '<span class="qz-mark">○</span>' : answered && o === it.pick ? '<span class="qz-mark">✕</span>' : ''}</button>`;
          }).join('')}
        </div>
        ${answered ? `<div class="qz-fb ${ok ? 'ok' : 'no'}">
            <b>${ok ? qzCheer() : '아쉬워요! 정답은 “' + esc(q.a) + '”'}</b>
            <p>${esc(q.exp || '')}</p>
            ${q.sayAns ? `<button class="qz-say small" type="button" data-say="${esc(q.a)}">🔊 정답 발음</button>` : ''}
          </div>
          <button class="qz-next" id="qz-next" type="button">${qz.cur + 1 < QZ_TOTAL ? '다음 문제 →' : '결과 보기 🎉'}</button>`
        : `<button class="qz-chance" id="qz-chance" type="button" ${qz.chanceUsed ? 'disabled' : ''}>
            💡 찬스 ${qz.chanceUsed ? '사용함' : '쓰기 (1번)'}</button>`}
      </div>
    </div>`;
  $('#quiz').querySelectorAll('.qz-opt').forEach((b) => (b.onclick = () => qzAnswer(+b.dataset.i)));
  $('#quiz').querySelectorAll('.qz-say').forEach((b) => (b.onclick = () => qzSay(b.dataset.say)));
  const ch = $('#qz-chance');
  if (ch) ch.onclick = () => { if (qz.chanceUsed) return; qz.chanceUsed = true; it.chance = true; qzPersist(); qzDraw(); };
  const nx = $('#qz-next');
  if (nx) nx.onclick = () => {
    if (qz.cur + 1 < QZ_TOTAL) { qz.cur++; qzPersist(); qzDraw(); }
    else qzFinish();
    $('#panel-quiz').scrollIntoView({ block: 'start' });
    window.scrollTo(0, 0);
  };
}
// 찬스: 오답 2개를 지움 (같은 문제에서는 늘 같은 보기)
function qzHidden(it, q) {
  const wrongs = it.opts.filter((o) => o !== q.a);
  return wrongs.slice(0, 2);
}
const qzCheer = () => ['정답! 👏', '딩동댕! 🎯', '완벽해요! ✨', '맞았어요! 🙌', '역시! 💯'][Math.floor(Math.random() * 5)];
function qzSay(text) {
  try {
    player.pause();
    player.src = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=' + encodeURIComponent(text);
    player.onerror = () => speakTTS(text, () => {});
    player.play().catch(() => speakTTS(text, () => {}));
  } catch {}
}

function qzAnswer(i) {
  const it = qz.items[qz.cur];
  if (it.pick != null) return;
  it.pick = it.opts[i];
  const q = qzFind(it.id);
  if (navigator.vibrate) navigator.vibrate(it.pick === q.a ? 20 : [40, 40, 40]);
  qzPersist();
  qzDraw();
  $('.qz-fb')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function qzFinish() {
  qz.done = true;
  const score = qz.items.filter((x) => x.pick === qzFind(x.id).a).length;
  qz.score = score;
  if (!qz.practice) {
    const st = qzStats(), today = qz.date;
    const y = new Date(new Date(today + 'T00:00:00Z').getTime() - 86400000).toISOString().slice(0, 10);
    if (st.last !== today) { st.streak = st.last === y ? st.streak + 1 : 1; st.days++; st.last = today; }
    st.solved += QZ_TOTAL; st.correct += score;
    st.seen = [...(st.seen || []), ...qz.items.map((x) => x.id)].slice(-600); // 최근 푼 문제는 한동안 다시 안 나와요
    if (score === QZ_TOTAL) { st.perfect++; qz.food = qzPickFood(st); }
    qzSave('quiz-stats', st);
    qzPersist();
  }
  qzResult();
}

/* ── 보상: 내 지역(가까운 미쉐린 도시) 맛집 ── */
function qzCity() {
  let p = { lat: 21.03, lon: 105.85 };
  try { p = getPlace(); } catch {}
  let best = 'hn', bd = 1e9;
  Object.entries(FOOD_CITY).forEach(([k, c]) => { const d = (c.lat - p.lat) ** 2 + (c.lon - p.lon) ** 2; if (d < bd) { bd = d; best = k; } });
  return { id: best, ...FOOD_CITY[best] };
}
function qzPickFood(st) {
  const city = qzCity().id;
  const list = FOOD.filter((f) => f[1] === city);
  const fresh = list.filter((f) => !(st.food || []).includes(f[0]));
  const pool = fresh.length ? fresh : list;
  // 만점 3번마다 한 번은 별 식당이 나올 확률을 높여요
  const stars = pool.filter((f) => f[2] === 'star');
  const f = stars.length && Math.random() < 0.25 ? stars[Math.floor(Math.random() * stars.length)] : pool[Math.floor(Math.random() * pool.length)];
  st.food = [...(st.food || []), f[0]].slice(-200);
  return f;
}

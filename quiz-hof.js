// 퀴즈 명예의 전당: 이번 달(1일~말일) 10문제 만점 횟수 순위
// HOF_URL: 구글 앱스 스크립트 웹앱 주소 (아직 비어 있으면 '미리보기 예시' 순위를 보여줘요)
// 보내는 정보: 필명 · 만점 날짜 · 무작위 기기 번호 — 필명을 등록하지 않으면 아무것도 보내지 않아요
const HOF_URL = '';
const HOF_DEMO = [['하노이쌀국수', 14], ['분짜마스터', 12], ['호안끼엠산책', 11], ['씬짜오', 9], ['다낭바다', 8],
  ['롯데몰단골', 7], ['퍼보러버', 6], ['떠이호주민', 5], ['반미한입', 4], ['오토바이초보', 3]];

const hofMonth = () => qzToday().slice(0, 7); // YYYY-MM (베트남 날짜 기준)
const hofNick = () => store.get('quiz-nick') || '';
const hofDevice = () => {
  let d = store.get('quiz-device');
  if (!d) { d = Math.random().toString(36).slice(2, 10); store.set('quiz-device', d); }
  return d;
};
// 내 기기의 이번 달 만점 횟수 (서버가 없어도 내 기록은 보여줘요)
const hofMine = () => (qzStats().monthly || {})[hofMonth()] || 0;

async function hofList() {
  if (!HOF_URL) return { demo: true, rows: HOF_DEMO.map(([name, count]) => ({ name, count })) };
  try {
    const r = await fetch(`${HOF_URL}?month=${hofMonth()}`, { cache: 'no-store' });
    const j = await r.json();
    return { demo: false, rows: (j.rows || []).slice(0, 10) };
  } catch { return { demo: false, rows: [], error: true }; }
}

async function hofSubmit(date) {
  const name = hofNick();
  if (!HOF_URL || !name) return false;
  try {
    await fetch(HOF_URL, { method: 'POST', body: JSON.stringify({ name, date, device: hofDevice() }) });
    return true;
  } catch { return false; }
}

const hofBadWords = /(씨발|시발|병신|좆|개새|fuck|shit)/i;
function hofAskNick(after) {
  const cur = hofNick();
  const box = document.createElement('div');
  box.className = 'hof-modal';
  box.innerHTML = `<div class="hof-sheet" role="dialog" aria-label="필명 등록">
      <h4>🏆 명예의 전당 필명</h4>
      <p>순위표에 보일 이름이에요. <b>실명 대신 필명</b>을 써 주세요.</p>
      <input class="input" id="hof-in" maxlength="10" placeholder="예: 하노이쌀국수" value="${esc(cur)}">
      <p class="hof-err" id="hof-err"></p>
      <div class="hof-btns"><button type="button" id="hof-cancel">다음에</button><button type="button" class="on" id="hof-ok">등록하기</button></div>
      <small>필명 · 만점 날짜만 저장돼요. 등록하지 않으면 아무것도 보내지 않아요.</small>
    </div>`;
  document.body.appendChild(box);
  const inp = box.querySelector('#hof-in');
  setTimeout(() => inp.focus(), 50);
  const close = () => box.remove();
  box.querySelector('#hof-cancel').onclick = close;
  box.onclick = (e) => { if (e.target === box) close(); };
  box.querySelector('#hof-ok').onclick = () => {
    const v = inp.value.trim().replace(/\s+/g, ' ');
    const err = box.querySelector('#hof-err');
    if (v.length < 2) { err.textContent = '2자 이상 입력해 주세요'; return; }
    if (hofBadWords.test(v)) { err.textContent = '다른 필명을 써 주세요'; return; }
    store.set('quiz-nick', v);
    close();
    after && after(v);
  };
}

async function hofRender(el) {
  if (!el) return;
  const m = +hofMonth().slice(5), last = new Date(+hofMonth().slice(0, 4), m, 0).getDate();
  el.innerHTML = `<div class="hof"><div class="hof-head"><h4>🏆 ${m}월 명예의 전당</h4><span>${m}월 1일~${last}일 · 만점 횟수</span></div><p class="hof-load">불러오는 중…</p></div>`;
  const { demo, rows, error } = await hofList();
  const me = hofNick(), mine = hofMine();
  const medal = ['🥇', '🥈', '🥉'];
  const top = rows.slice(0, 3), rest = rows.slice(3);
  const podium = top.length ? `<div class="hof-podium">${[1, 0, 2].filter((i) => top[i]).map((i) => `
      <div class="hof-pod p${i + 1}${top[i].name === me ? ' me' : ''}">
        <span class="hof-medal">${medal[i]}</span><b>${esc(top[i].name)}</b><span class="hof-cnt">${top[i].count}회</span><i></i>
      </div>`).join('')}</div>` : '';
  const list = rest.map((r, i) => `<li class="${r.name === me ? 'me' : ''}"><span class="hof-rank">${i + 4}</span><b>${esc(r.name)}</b><span>${r.count}회</span></li>`).join('');
  el.querySelector('.hof').innerHTML = `
    <div class="hof-head"><h4>🏆 ${m}월 명예의 전당</h4><span>${m}월 1일~${last}일 · 만점 횟수</span></div>
    ${demo ? '<p class="hof-demo">미리보기 예시 순위예요 (기록 저장소 연결 전)</p>' : ''}
    ${error ? '<p class="hof-demo">순위를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>' : ''}
    ${!rows.length && !error ? '<p class="hof-demo">아직 이번 달 만점자가 없어요. 첫 번째 주인공이 되어 보세요!</p>' : ''}
    ${podium}
    ${list ? `<ol class="hof-list">${list}</ol>` : ''}
    <div class="hof-me">
      ${me ? `<span>내 필명 <b>${esc(me)}</b> · 이번 달 만점 <b>${mine}회</b></span><button type="button" id="hof-edit">변경</button>`
        : `<span>필명을 등록하면 만점 기록이 여기에 올라가요</span><button type="button" class="on" id="hof-edit">필명 등록</button>`}
    </div>`;
  el.querySelector('#hof-edit').onclick = () => hofAskNick(() => hofRender(el));
}

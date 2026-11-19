// 퀴즈 결과 화면: 만점이면 lì xì(세뱃돈) 봉투가 열리고 맛집 공개, 아니면 봉투가 잠긴 채 흔들려요
const QZ_SAY = [
  [10, '만점! 오늘 완벽했어요', '숨겨진 보상이 열렸어요', '🏆'],
  [8, '아깝다, 딱 한 끗!', '내일은 만점 가 봐요', '🔥'],
  [5, '절반은 넘었어요', '오답 노트로 복습하면 금방 늘어요', '👍'],
  [0, '오늘은 워밍업', '내일 다시 도전해요', '💪'],
];

function qzFoodCard(f) {
  const city = FOOD_CITY[f[1]];
  const star = f[2] === 'star';
  const en = { 하노이: 'Hanoi', 호찌민: 'Ho Chi Minh', 다낭: 'Da Nang' }[city.name];
  const map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${f[0]} ${en}`);
  return `<div class="qz-gift-inner">
      <span class="qz-gift-badge ${star ? 'star' : 'bib'}">${star ? '⭐ 미쉐린 1스타' : '😋 미쉐린 빕 구르망'}</span>
      <h4>${esc(f[0])}</h4>
      <p>${esc(f[3])} · ${city.name}</p>
      <small>${star ? '미쉐린이 별을 준 곳. 특별한 날 아껴 두세요.' : '미쉐린이 고른 “가성비 숨은 맛집”. 오늘 저녁 어때요?'}</small>
      <a class="qz-gift-map" href="${map}" target="_blank" rel="noopener">📍 구글 지도에서 찾아가기</a>
      <p class="qz-gift-src">미쉐린 가이드 베트남 2026 선정 · 영업시간은 방문 전에 확인하세요</p>
    </div>`;
}

// 봉투 그림 (닫힘/잠김/열림은 CSS 클래스로)
const qzEnvelope = (locked) => `
  <div class="qz-env${locked ? ' locked' : ''}" id="qz-env" role="button" tabindex="0" aria-label="${locked ? '잠긴 보상' : '보상 열기'}">
    <div class="qz-env-back"></div>
    <div class="qz-env-front"><span class="qz-env-seal">${locked ? '🔒' : '🎁'}</span></div>
    <div class="qz-env-flap"></div>
  </div>`;

function qzResult() {
  const score = qz.score ?? qz.items.filter((x) => x.pick === qzFind(x.id).a).length;
  const perfect = score === QZ_TOTAL;
  const [, vi, ko, emoji] = QZ_SAY.find(([min]) => score >= min);
  const wrong = qz.items.filter((x) => x.pick !== qzFind(x.id).a);
  const confetti = perfect ? '<div class="qz-confetti" aria-hidden="true">' + Array.from({ length: 36 }, (_, i) =>
    `<i style="--x:${(i * 37) % 100};--d:${(i % 9) * 0.1}s;--c:${['#ffd43b', '#ff6b6b', '#e03131', '#fab005', '#ff8787'][i % 5]}"></i>`).join('') + '</div>' : '';
  $('#quiz').innerHTML = `
    <div class="qz-result ${perfect ? 'perfect' : 'miss'}">
      ${confetti}
      <span class="qz-res-emoji">${emoji}</span>
      <p class="qz-res-vi">${vi}</p>
      <p class="qz-res-ko">${ko}</p>
      <p class="qz-res-score"><b id="qz-count">0</b> / ${QZ_TOTAL}</p>
      ${qzDots()}
      ${qz.practice ? '' : perfect && qz.food && qz.opened ? `<div class="qz-gift">${qzFoodCard(qz.food)}</div><p class="qz-env-tip">🎉 오늘의 보상: 미쉐린 가이드 선정 맛집</p>` : perfect && qz.food ? `
        ${qzEnvelope(false)}
        <p class="qz-env-tip" id="qz-env-tip">👆 눌러서 보상 확인하기</p>`
      : `
        ${qzEnvelope(true)}
        <p class="qz-env-tip">10문제를 모두 맞히면 열려요 · 내일 다시 도전!</p>`}
      ${!perfect ? '<div class="qz-moto" aria-hidden="true">🛵💨</div>' : ''}
    </div>
    ${wrong.length ? `<div class="qz-review"><h4>📝 오답 노트</h4>${wrong.map((x) => {
      const q = qzFind(x.id);
      return `<div class="qz-rv"><p>${esc(q.q)}</p><b>정답: ${esc(q.a)}</b><small>${esc(q.exp || '')}</small></div>`;
    }).join('')}</div>` : ''}
    <div class="qz-after">
      <button class="qz-practice" id="qz-practice" type="button">🔁 연습 문제 10개 더 풀기</button>
      <p>${qz.practice ? '연습 문제는 기록과 보상에 포함되지 않아요.' : '오늘 도전 완료! 새 문제는 베트남 시각 0시에 열려요.'}</p>
    </div>`;
  // 점수 올라가는 효과
  let n = 0;
  const el = $('#qz-count');
  const t = setInterval(() => { el.textContent = n; if (n++ >= score) clearInterval(t); }, 90);
  // 만점 봉투 열기
  const env = $('#qz-env');
  if (env && perfect && qz.food) {
    const open = () => {
      if (env.classList.contains('open')) return;
      env.classList.add('open');
      qz.opened = true; qzPersist(); // 다시 들어와도 열린 상태로
      setTimeout(() => {
        env.outerHTML = '<div class="qz-gift">' + qzFoodCard(qz.food) + '</div>';
        $('#qz-env-tip').textContent = '🎉 오늘의 보상: 미쉐린 가이드 선정 맛집';
      }, 650);
      if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
    };
    env.onclick = open;
    env.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
  } else if (env) {
    env.onclick = () => { env.classList.remove('nope'); void env.offsetWidth; env.classList.add('nope'); };
  }
  $('#qz-practice').onclick = () => {
    qz = { date: qzToday(), practice: true, items: qzNewSet(true), cur: 0, chanceUsed: false, done: false };
    qzDraw();
    window.scrollTo(0, 0);
  };
}

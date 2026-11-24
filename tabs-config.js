// ⚙️ 탭 설정: 보일 탭과 순서를 사용자가 고르기 (네이버 웨일 가젯처럼)
// 저장: 이 휴대폰에만 (localStorage 'tabs') — { order: [...], hidden: [...] }
// 맛집 탭은 미쉐린 페이지(michelin.html)로 이동하는 링크예요.
(function () {
  const nav = document.querySelector('.tabs');
  const ALL = [...nav.querySelectorAll('.tab')].map((b) => ({ id: b.dataset.tab, html: b.innerHTML.trim() }));
  ALL.push({ id: 'food', html: '<span aria-hidden="true">🍽️</span> 맛집', href: 'michelin.html' });
  const byId = Object.fromEntries(ALL.map((t) => [t.id, t]));
  const DEFAULT = ALL.map((t) => t.id);
  const MIN = 2;

  function load() {
    let c = null;
    try { c = JSON.parse(store.get('tabs') || 'null'); } catch {}
    const order = (c && Array.isArray(c.order) ? c.order.filter((id) => byId[id]) : []);
    DEFAULT.forEach((id) => { if (!order.includes(id)) order.push(id); }); // 새로 생긴 탭은 맨 뒤에
    const hidden = (c && Array.isArray(c.hidden) ? c.hidden.filter((id) => byId[id]) : []);
    return { order, hidden };
  }
  let cfg = load();
  const visible = () => cfg.order.filter((id) => !cfg.hidden.includes(id));
  const label = (t) => t.html.replace(/<span[^>]*>.*?<\/span>\s*/s, '').trim();
  const icon = (t) => (t.html.match(/<span[^>]*>.*?<\/span>/s) || [''])[0];

  function render() {
    const cur = document.querySelector('.tab[aria-selected="true"]')?.dataset.tab;
    const vis = visible();
    nav.innerHTML = vis.map((id) => {
      const t = byId[id];
      return t.href
        ? `<a class="tab" href="${t.href}" data-return="current" role="tab">${t.html}</a>`
        : `<button class="tab" role="tab" data-tab="${id}" aria-selected="${id === cur}">${t.html}</button>`;
    }).join('') + `<button class="tab tab-gear" type="button" id="tab-gear" aria-label="탭 설정"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zm8.3 4.6l1.7 1.3-1.9 3.3-2-.8a7.6 7.6 0 0 1-1.9 1.1l-.3 2.1H12.1l-.3-2.1a7.6 7.6 0 0 1-1.9-1.1l-2 .8-1.9-3.3 1.7-1.3a7.7 7.7 0 0 1 0-2.4L6 9.5l1.9-3.3 2 .8a7.6 7.6 0 0 1 1.9-1.1l.3-2.1h3.8l.3 2.1a7.6 7.6 0 0 1 1.9 1.1l2-.8 1.9 3.3-1.7 1.3a7.7 7.7 0 0 1 0 2.4z" fill="none" stroke="#8a8f98" stroke-width="1.5" stroke-linejoin="round"/></svg></button>`;
    nav.style.gridTemplateColumns = `repeat(${vis.length}, 1fr) 40px`;
    nav.dataset.count = vis.length;
    // 화면 전환·손가락 넘기기 순서도 보이는 탭 기준으로
    TABS.splice(0, TABS.length, ...vis.filter((id) => !byId[id].href));
    // 손가락 넘기기는 링크 탭(맛집)까지 포함한 순서로 — 맛집 페이지(back.js)도 이 순서를 읽어요
    window.TAB_ALL = vis.map((id) => ({ id, href: byId[id].href || '' }));
    store.set('tabOrder', JSON.stringify(window.TAB_ALL));
    $('#tab-gear').onclick = openSheet;
  }

  function save() { store.set('tabs', JSON.stringify(cfg)); }

  function openSheet() {
    const box = document.createElement('div');
    box.className = 'tabset-modal';
    document.body.appendChild(box);
    let first = true; // 처음 열 때만 아래에서 올라오는 효과
    const draw = () => {
      const shown = visible().length;
      box.innerHTML = `<div class="tabset-sheet${first ? ' enter' : ''}" role="dialog" aria-label="탭 설정">
        <div class="tabset-head"><h4>탭 설정</h4><span>${shown}개 보이는 중</span></div>
        <p class="tabset-sub">보고 싶은 탭만 켜고, 화살표로 순서를 바꿔요.</p>
        <ul class="tabset-list">${cfg.order.map((id, i) => {
          const t = byId[id], on = !cfg.hidden.includes(id);
          return `<li class="${on ? '' : 'off'}">
            <span class="tabset-ic">${icon(t)}</span><b>${label(t)}</b>
            <span class="tabset-move">
              <button type="button" data-up="${i}" aria-label="${label(t)} 위로" ${i === 0 ? 'disabled' : ''}>▲</button>
              <button type="button" data-down="${i}" aria-label="${label(t)} 아래로" ${i === cfg.order.length - 1 ? 'disabled' : ''}>▼</button>
            </span>
            <label class="tabset-sw"><input type="checkbox" data-id="${id}" ${on ? 'checked' : ''}><i></i></label>
          </li>`;
        }).join('')}</ul>
        <p class="tabset-err" id="tabset-err"></p>
        <div class="tabset-btns"><button type="button" id="tabset-reset">기본값으로</button><button type="button" class="on" id="tabset-done">완료</button></div>
      </div>`;
      box.querySelectorAll('[data-up]').forEach((b) => (b.onclick = () => move(+b.dataset.up, -1)));
      box.querySelectorAll('[data-down]').forEach((b) => (b.onclick = () => move(+b.dataset.down, 1)));
      box.querySelectorAll('input[data-id]').forEach((c) => (c.onchange = () => toggle(c.dataset.id, c.checked)));
      box.querySelector('#tabset-reset').onclick = () => { cfg = { order: [...DEFAULT], hidden: [] }; apply(); };
      box.querySelector('#tabset-done').onclick = () => box.remove();
      first = false;
    };
    const apply = () => { save(); render(); const cur = TABS.includes(store.get('tab')) ? store.get('tab') : TABS[0]; showTab(cur); draw(); };
    const move = (i, d) => { const o = cfg.order; [o[i], o[i + d]] = [o[i + d], o[i]]; apply(); };
    const toggle = (id, on) => {
      const nextHidden = on ? cfg.hidden.filter((x) => x !== id) : [...cfg.hidden, id];
      const left = cfg.order.filter((x) => !nextHidden.includes(x));
      if (left.length < MIN || !left.some((x) => !byId[x].href)) {
        draw();
        box.querySelector('#tabset-err').textContent = `탭은 최소 ${MIN}개는 남겨 주세요`;
        return;
      }
      cfg.hidden = nextHidden; apply();
    };
    box.onclick = (e) => { if (e.target === box) box.remove(); };
    draw();
  }

  render(); // 이어서 features.js의 startTab()이 이 순서대로 첫 탭을 골라요
})();

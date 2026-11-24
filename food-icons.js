// 음식 종류별 직접 그린 아이콘 (SVG · 저작권 걱정 없음 · 용량 거의 0)
// 사용: foodIcon('Noodles') → 해당 그림 SVG 문자열
(function () {
  const S = (body) => `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">${body}</svg>`;
  const ICONS = {
    // 쌀국수: 김 나는 그릇 + 젓가락
    noodle: S(`<path d="M14 8 q-2 3 0 6 M20 6 q-2 3 0 6 M26 8 q-2 3 0 6" stroke="#c9ced6" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M28 4 L18 22 M33 6 L21 23" stroke="#a0522d" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M5 20 h30 q-1 13 -15 14 q-14 -1 -15 -14z" fill="#e03131"/><path d="M8 20 q4 -3 8 0 q4 3 8 0 q4 -3 8 0" stroke="#ffe8a3" stroke-width="2" fill="none"/>
      <rect x="14" y="33" width="12" height="3" rx="1.5" fill="#c92a2a"/><path d="M9 25 h22" stroke="#ff8787" stroke-width="1.2"/>`),
    // 베트남 요리: 바나나잎 위 짜조(롤) + 고추
    viet: S(`<ellipse cx="20" cy="27" rx="16" ry="8" fill="#69b34c"/><path d="M5 27 q15 -4 30 0" stroke="#4d8c33" stroke-width="1" fill="none"/>
      <rect x="9" y="17" width="18" height="7" rx="3.5" fill="#e8a33d" transform="rotate(-12 18 20)"/><rect x="13" y="21" width="18" height="7" rx="3.5" fill="#f0b75a" transform="rotate(-6 22 24)"/>
      <path d="M17 19 l2 4 M22 18 l2 4" stroke="#c97c1f" stroke-width="1" transform="rotate(-12 18 20)"/><path d="M30 12 q4 2 3 7" stroke="#e03131" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M30 12 l-1 -2" stroke="#2f9e44" stroke-width="1.4"/>`),
    // 길거리 음식: 반미
    banhmi: S(`<path d="M4 22 q2 -10 18 -11 q14 0 15 8 q0 6 -16 9 q-15 2 -17 -6z" fill="#f2b45a"/><path d="M6 22 q10 2 30 -4" stroke="#69b34c" stroke-width="2.4" fill="none"/>
      <path d="M7 21 q10 1 28 -4" stroke="#e03131" stroke-width="1.6" fill="none"/><path d="M12 14 l3 3 M19 12 l3 3 M26 12 l3 3" stroke="#d68a2e" stroke-width="1.4" stroke-linecap="round"/>`),
    // 해산물: 새우
    seafood: S(`<path d="M30 12 q-14 -6 -20 6 q-3 7 3 11 q5 3 9 -1" fill="none" stroke="#ff7a59" stroke-width="7" stroke-linecap="round"/>
      <path d="M30 12 q-14 -6 -20 6 q-3 7 3 11 q5 3 9 -1" fill="none" stroke="#ffa07a" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 3"/>
      <path d="M22 28 l4 4 M22 28 l5 1" stroke="#ff7a59" stroke-width="2.4" stroke-linecap="round"/><circle cx="28" cy="10" r="1.3" fill="#3a3f47"/><path d="M31 10 q5 -4 7 -1 M31 12 q6 -1 7 2" stroke="#ff7a59" stroke-width="1" fill="none"/>`),
    // 채식: 잎사귀 + 토마토
    veg: S(`<path d="M8 30 q0 -20 22 -22 q0 20 -22 22z" fill="#51cf66"/><path d="M8 30 L26 12" stroke="#2f9e44" stroke-width="1.6"/>
      <circle cx="27" cy="28" r="7" fill="#ff6b6b"/><path d="M24 22 l3 2 3 -2" stroke="#2f9e44" stroke-width="1.8" fill="none" stroke-linecap="round"/>`),
    // 프렌치·유럽: 크루아상
    french: S(`<path d="M6 26 q6 -14 14 -14 q8 0 14 14 q-3 3 -6 1 q-2 -6 -8 -6 q-6 0 -8 6 q-3 2 -6 -1z" fill="#e8a33d"/>
      <path d="M13 17 q2 4 1 9 M20 13 v12 M27 17 q-2 4 -1 9" stroke="#c97c1f" stroke-width="1.4" fill="none"/>`),
    // 스테이크
    steak: S(`<path d="M7 18 q2 -9 14 -9 q13 0 13 10 q0 11 -14 12 q-15 1 -13 -13z" fill="#a8432f"/><path d="M11 18 q2 -6 10 -6 q9 0 9 7" stroke="#f4d0b5" stroke-width="2" fill="none"/>
      <circle cx="24" cy="21" r="3" fill="#f4d0b5"/><path d="M12 24 l10 -6 M16 27 l10 -6" stroke="#7a2e20" stroke-width="1.2"/>`),
    // 일식·철판: 초밥
    japan: S(`<rect x="7" y="20" width="26" height="11" rx="5.5" fill="#fff" stroke="#e9ecef"/><path d="M6 21 q14 -10 28 0 q-2 3 -14 3 q-12 0 -14 -3z" fill="#ff8a65"/>
      <path d="M12 17 l2 4 M18 15 l2 4 M24 15 l2 4" stroke="#ffccbc" stroke-width="1.6" stroke-linecap="round"/><rect x="17" y="20" width="6" height="11" fill="#2b3a2b"/>`),
    // 한식: 비빔밥
    korean: S(`<path d="M5 18 h30 q-1 14 -15 15 q-14 -1 -15 -15z" fill="#4a3f35"/><ellipse cx="20" cy="18" rx="15" ry="4.5" fill="#fff"/>
      <circle cx="20" cy="17" r="3" fill="#ffd43b"/><path d="M10 18 l4 -1 M26 16 l4 1" stroke="#51cf66" stroke-width="2.4" stroke-linecap="round"/><path d="M14 15 l3 -1 M24 19 l3 1" stroke="#ff922b" stroke-width="2.4" stroke-linecap="round"/><circle cx="20" cy="17" r="1.2" fill="#ff922b"/>`),
    // 중식(광둥): 딤섬 찜기
    chinese: S(`<rect x="6" y="18" width="28" height="13" rx="3" fill="#d9a066"/><path d="M6 24 h28" stroke="#b9824d" stroke-width="1.2"/>
      <path d="M12 18 q2 -8 6 0z M20 18 q2 -9 6 0z" fill="#fff" stroke="#e9ecef"/><path d="M15 12 q-1 -3 1 -5 M23 11 q-1 -3 1 -5" stroke="#c9ced6" stroke-width="1.4" fill="none" stroke-linecap="round"/>`),
    // 인도: 커리 그릇
    indian: S(`<path d="M6 19 h28 q-2 12 -14 13 q-12 -1 -14 -13z" fill="#f5f5f5" stroke="#ced4da"/><ellipse cx="20" cy="19" rx="14" ry="4" fill="#f08c00"/>
      <circle cx="15" cy="18.5" r="1.6" fill="#fff3bf"/><circle cx="23" cy="19.5" r="1.4" fill="#2f9e44"/><path d="M28 9 q-3 3 0 6" stroke="#c9ced6" stroke-width="1.6" fill="none"/>`),
    // 이탈리안·지중해: 피자 조각
    italian: S(`<path d="M20 5 L33 31 Q20 36 7 31z" fill="#ffd43b"/><path d="M7 31 Q20 36 33 31 l1 3 Q20 39 6 34z" fill="#e8a33d"/>
      <circle cx="18" cy="17" r="2.4" fill="#e03131"/><circle cx="23" cy="25" r="2.6" fill="#e03131"/><circle cx="14" cy="27" r="2.2" fill="#e03131"/><circle cx="21" cy="12" r="1" fill="#2f9e44"/>`),
    // 중남미: 타코
    latin: S(`<path d="M5 28 q15 -24 30 0z" fill="#f2c14e"/><path d="M8 26 q4 -6 8 -5 q4 -6 8 -2 q5 -2 8 6" stroke="#51cf66" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <circle cx="16" cy="23" r="1.6" fill="#e03131"/><circle cx="24" cy="22" r="1.6" fill="#e03131"/>`),
    // 밥 요리: 밥그릇
    rice: S(`<path d="M5 20 h30 q-1 12 -15 13 q-14 -1 -15 -13z" fill="#1c64d9"/><path d="M5 20 q4 -10 15 -10 q11 0 15 10z" fill="#fff" stroke="#e9ecef"/>
      <path d="M12 26 h16" stroke="#74a9f5" stroke-width="1.4"/><path d="M15 14 h1 M20 12 h1 M25 15 h1 M18 16 h1" stroke="#ced4da" stroke-width="1.4" stroke-linecap="round"/>`),
    // 컨템퍼러리·이노베이티브: 파인다이닝 접시
    fine: S(`<ellipse cx="20" cy="24" rx="16" ry="9" fill="#fff" stroke="#dee2e6" stroke-width="1.4"/><ellipse cx="20" cy="24" rx="9" ry="4.5" fill="#f8f9fa"/>
      <path d="M13 24 q7 -5 14 0" stroke="#c8102e" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="20" cy="21" r="2.6" fill="#ff922b"/><path d="M20 18 l1 -3" stroke="#2f9e44" stroke-width="1.4"/>
      <circle cx="12" cy="27" r="1" fill="#2f9e44"/><circle cx="28" cy="27" r="1" fill="#c8102e"/>`),
  };
  const MAP = {
    'Noodles': 'noodle', 'Vietnamese': 'viet', 'Vietnamese Contemporary': 'fine', 'Street Food': 'banhmi', 'Small eats': 'viet',
    'Fish and Seafood': 'seafood', 'Seafood': 'seafood', 'Vegetarian': 'veg', 'French': 'french', 'French Contemporary': 'french',
    'European': 'french', 'European Contemporary': 'fine', 'British Contemporary': 'fine', 'Steakhouse': 'steak', 'Japanese': 'japan',
    'Teppanyaki': 'japan', 'Korean Contemporary': 'korean', 'Cantonese': 'chinese', 'Indian': 'indian', 'Italian': 'italian',
    'Italian Contemporary': 'italian', 'Mediterranean Cuisine': 'italian', 'Latin American': 'latin', 'Rice Dishes': 'rice',
    'Innovative': 'fine', 'Contemporary': 'fine', 'Asian Contemporary': 'fine', 'International': 'fine', 'Fusion': 'fine',
  };
  // 가게 이름에 요리 이름이 들어 있으면 그 요리 그림을 먼저 (예: 'Phở …'는 분류가 길거리 음식이어도 국수 그림)
  const BY_NAME = [
    [/(bánh mì)/i, 'banhmi'],
    [/(phở|bún|miến|mì|mỳ|hủ tiếu|bánh canh|canh cá)/i, 'noodle'],
    [/(cơm|xôi)/i, 'rice'],
    [/(ốc|cua|seafood|hải sản)/i, 'seafood'],
    [/(bánh xèo|bánh cuốn|bánh bèo|chả cá|bò kho)/i, 'viet'],
    [/(chay|vegetarian)/i, 'veg'],
  ];
  window.foodIcon = (cuisine, name) => {
    const hit = BY_NAME.find(([re]) => re.test(name || ''));
    return ICONS[hit ? hit[1] : MAP[cuisine] || 'fine'];
  };
  window.FOOD_ICONS = ICONS;
})();

// ─────────────────────────────────────────────
// 앱에 표시되는 데이터. 내용을 바꾸고 싶으면 이 파일만 고치면 됩니다.
// ─────────────────────────────────────────────

// 뉴스 목록 (지금은 직접 입력하는 방식 — 나중에 RSS/API로 자동화 가능)
// region: 'vn' 베트남 | 'krvn' 한-베 | 'kr' 한국
// url을 비워두면 제목으로 구글 뉴스 검색 결과가 열립니다.
window.NEWS = {
  updatedAt: '2026.11.16 08:50 (KST)',
  items: [
    { title: '베트남 중앙은행, 11일부터 USD 현물 정기 매입…주 2회 달러당 25,500동', source: '굿모닝베트남미디어', date: '11.11', region: 'vn', category: '금융', url: '' },
    { title: 'VN지수 1,743 마감, 보름 만에 최고…중앙銀 달러 매입 발표에 금융·부동산주 강세', source: '뉴스핌', date: '11.10', region: 'vn', category: '금융', url: '' },
    { title: '[예시] 하노이 도심 오토바이 배출가스 규제 단계적 시행 안내', source: '예시 기사', date: '11.09', region: 'vn', category: '생활', url: '' },
    { title: '[예시] 하노이 메트로 노선 운행 시간과 요금 정리', source: '예시 기사', date: '11.08', region: 'vn', category: '생활', url: '' },
    { title: '[예시] 베트남 수출 동향과 하반기 성장률 전망', source: '예시 기사', date: '11.08', region: 'vn', category: '경제', url: '' },
    { title: '[예시] 한-베 교역 확대…한국 기업 베트남 투자 동향', source: '예시 기사', date: '11.07', region: 'krvn', category: '경제', url: '' },
    { title: '[예시] 한국인 체류자 대상 비자·거주증 제도 변경 사항', source: '예시 기사', date: '11.06', region: 'krvn', category: '사회', url: '' },
    { title: '[예시] 원·달러 환율 주간 동향', source: '예시 기사', date: '11.06', region: 'kr', category: '금융', url: '' },
    { title: '[예시] 국내 주요 시사 이슈 한눈에 보기', source: '예시 기사', date: '11.05', region: 'kr', category: '시사', url: '' },
  ],
};

// 환율: 인터넷 연결이 안 될 때 쓰는 기본값 (1 USD 기준, 대략치)
window.FALLBACK_RATES = { USD: 1, KRW: 1400, VND: 26300 };

// 베트남 지폐
// photo: 실물 사진 주소 (베트남어 위키백과 게시 이미지). 직접 찍은 사진으로 바꾸려면
//        images 폴더에 넣고 photo: 'images/500000.jpg' 처럼 고치면 됩니다.
//        사진이 없거나 안 열리면 색 그림으로 대신 보여줍니다.
const WIKI = 'https://upload.wikimedia.org/wikipedia/vi/';
window.BANKNOTES = [
  { v: 500000, short: '500K', c1: '#6cc3cc', c2: '#3a8f9a', color: '청록색', back: '호찌민 생가 (낌리엔)', icon: 'house', photo: WIKI + '9/9f/500000_polymer.jpg', warn: '20,000동(파랑)과 헷갈리기 쉬워요' },
  { v: 200000, short: '200K', c1: '#e8946a', c2: '#b8562f', color: '주황·적갈색', back: '하롱베이 향로섬', icon: 'islet', photo: WIKI + '0/04/Gi%E1%BA%A5y_b%E1%BA%A1c_200.000.jpg' },
  { v: 100000, short: '100K', c1: '#86c17e', c2: '#4a8a4c', color: '초록색', back: '문묘 (반미에우)', icon: 'pavilion', photo: WIKI + 'a/a9/100nghins.jpg' },
  { v: 50000,  short: '50K',  c1: '#e08bb4', c2: '#a8467a', color: '분홍·자주색', back: '후에 응인르엉딘 정자', icon: 'gate', photo: WIKI + '2/28/%C4%90%E1%BB%93ng_b%E1%BA%A1c_50.000.jpg' },
  { v: 20000,  short: '20K',  c1: '#78a8e6', c2: '#3a68b4', color: '파란색', back: '호이안 내원교 (일본교)', icon: 'bridge', photo: WIKI + 'f/f2/%C4%90%E1%BB%93ng_b%E1%BA%A1c_20.000.jpg', warn: '500,000동(청록)과 헷갈리기 쉬워요' },
  { v: 10000,  short: '10K',  c1: '#e3c066', c2: '#a8812c', color: '황토·갈색', back: '바익호 해상 석유시추선', icon: 'rig', photo: WIKI + '3/32/%C4%90%E1%BB%93ng_b%E1%BA%A1c_10.000_%C4%91%E1%BB%93ng.jpg' },
  { v: 5000,   short: '5K',   c1: '#a9b4d8', c2: '#6b77a8', color: '연보라·청색', back: '찌안 수력발전소', icon: 'dam', note: '종이 지폐', photo: '' },
  { v: 2000,   short: '2K',   c1: '#c9ac8a', c2: '#8f7152', color: '회갈색', back: '남딘 방직공장', icon: 'factory', note: '종이 지폐', photo: '' },
  { v: 1000,   short: '1K',   c1: '#b7b98a', c2: '#7d7f52', color: '올리브·보라', back: '떠이응우옌 코끼리', icon: 'elephant', note: '종이 지폐', photo: '' },
];

// 2026년 베트남 공휴일 (off: 쉬는 날 / 나머지는 쉬지 않는 기념일)
// ※ 설·국경일 연휴의 정확한 날짜는 매년 정부 발표로 확정되니 회사 공지를 함께 확인하세요.
window.HOLIDAYS = {
  year: 2026,
  days: [
    { d: '2026-01-01', name: '양력 새해', off: true },
    { d: '2026-02-14', to: '2026-02-22', name: '설 연휴 (뗏)', off: true, memo: '음력 설날은 2월 17일' },
    { d: '2026-03-08', name: '세계 여성의 날', off: false },
    { d: '2026-04-26', name: '흥왕 기념일', off: true, memo: '음력 3월 10일 · 일요일이라 27일 대체휴무' },
    { d: '2026-04-27', name: '흥왕 기념일 대체휴무', off: true },
    { d: '2026-04-30', name: '남부 해방·통일의 날', off: true },
    { d: '2026-05-01', name: '국제 노동절', off: true },
    { d: '2026-06-01', name: '국제 아동절', off: false },
    { d: '2026-09-01', to: '2026-09-02', name: '국경일 (독립기념일) 연휴', off: true },
    { d: '2026-09-25', name: '중추절 (베트남 추석)', off: false, memo: '음력 8월 15일 · 쉬지 않아요' },
    { d: '2026-10-20', name: '베트남 여성의 날', off: false },
    { d: '2026-11-20', name: '스승의 날', off: false },
    { d: '2026-12-25', name: '크리스마스', off: false },
  ],
};

// 알아두면 좋은 것
window.FACTS = [
  { icon: '🔌', text: '전압 220V — 한국 플러그 대부분 그대로 사용 가능' },
  { icon: '🛵', text: '이동은 Grab · Be · Xanh SM 앱 호출이 편리해요' },
  { icon: '💧', text: '수돗물은 마시지 말고 생수를 이용하세요' },
  { icon: '💵', text: '현금은 소액권 위주로, 큰 지폐는 거스름돈 확인' },
  { icon: '🛂', text: '여권·거주증 사본을 휴대폰에 저장해 두세요' },
];

// 하단 바 기본 목적지 (앱에서 '목적지 변경'으로 바꿀 수 있어요)
window.DOCK = {
  title: '우리은행 베트남 본점',
  sub: '경남 랜드마크72 · Phạm Hùng',
  query: 'Keangnam Landmark 72, Phạm Hùng, Hà Nội',
};

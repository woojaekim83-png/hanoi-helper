// ─────────────────────────────────────────────
// 앱에 표시되는 데이터. 내용을 바꾸고 싶으면 이 파일만 고치면 됩니다.
// ─────────────────────────────────────────────

// 뉴스는 GitHub Actions가 30분마다 자동으로 모아 news.json에 저장합니다
// (scripts/fetch_news.py — 검색어를 바꾸려면 그 파일의 FEEDS를 고치세요).
// 아래는 news.json을 못 불러올 때만 쓰는 비상용 목록입니다.
window.NEWS = {
  updatedAt: '',
  items: [
    { title: '뉴스를 불러오지 못했어요. 인터넷 연결을 확인해 주세요 (누르면 구글 뉴스 검색)', source: '안내', date: '', region: 'vn', category: '생활', url: 'https://news.google.com/search?q=%ED%95%98%EB%85%B8%EC%9D%B4&hl=ko&gl=KR&ceid=KR:ko' },
  ],
};

// 베트남 기준금리 (베트남 중앙은행 SBV) — 바뀌면 이 숫자와 날짜만 고치면 됩니다.
// SBV는 한국은행처럼 정해진 발표 일정이 없고, 필요할 때 수시로 결정·발표합니다.
window.POLICY_RATE = {
  refinancing: 4.5,          // 재융자금리 (기준금리 역할)
  discount: 3.0,             // 재할인금리
  changedAt: '2023.06.19',   // 마지막 금리 변경 시행일
  prevRefinancing: 5.0,      // 변경 전 재융자금리
  checkedAt: '2026.11.16',   // 이 정보를 마지막으로 확인한 날
  source: 'https://sbv.gov.vn',
};

// 환율: 인터넷 연결이 안 될 때 쓰는 기본값 (1 USD 기준, 대략치)
window.FALLBACK_RATES = { USD: 1, KRW: 1400, VND: 26300 };

// 베트남 지폐 — 앞면(front)·뒷면(rear) 사진을 나란히 보여줍니다.
// 폴리머 6종: images 폴더의 견본(SPECIMEN) 사진 / 5,000동: 베트남어 위키백과 게시 이미지
// 사진을 바꾸려면 images 폴더의 같은 이름 파일을 덮어쓰면 됩니다.
// crop: 'top' / 'bottom' — 앞뒷면이 위아래로 붙어 있는 사진에서 절반만 잘라 보여줄 때
const WIKI = 'https://upload.wikimedia.org/wikipedia/vi/';
const img = (v) => ({ front: { src: `images/${v}-front.jpg` }, rear: { src: `images/${v}-back.jpg` } });
window.BANKNOTES = [
  { v: 500000, short: '500K', c1: '#6cc3cc', c2: '#3a8f9a', color: '청록색', back: '호치민 생가 (낌리엔)', ...img(500000), warn: '20,000동(파랑)과 헷갈리기 쉬워요' },
  { v: 200000, short: '200K', c1: '#e8946a', c2: '#b8562f', color: '주황·적갈색', back: '하롱베이 향로섬', ...img(200000) },
  { v: 100000, short: '100K', c1: '#86c17e', c2: '#4a8a4c', color: '초록색', back: '문묘 (반미에우)', ...img(100000) },
  { v: 50000,  short: '50K',  c1: '#e08bb4', c2: '#a8467a', color: '분홍·자주색', back: '후에 응인르엉딘 정자', ...img(50000) },
  { v: 20000,  short: '20K',  c1: '#78a8e6', c2: '#3a68b4', color: '파란색', back: '호이안 내원교 (일본교)', ...img(20000), warn: '500,000동(청록)과 헷갈리기 쉬워요' },
  { v: 10000,  short: '10K',  c1: '#e3c066', c2: '#a8812c', color: '황토·갈색', back: '바익호 해상 석유시추선', ...img(10000) },
  { v: 5000,   short: '5K',   c1: '#8fb0de', c2: '#4f6fa8', color: '파란색', back: '찌안 수력발전소', note: '종이 지폐',
    front: { src: WIKI + '7/7c/%C4%90%E1%BB%93ng_b%E1%BA%A1c_5000_%C4%91%E1%BB%93ng.jpg' },
    rear: { src: WIKI + 'd/de/Gi%E1%BA%A5y_b%E1%BA%A1c_5000_%C4%91%E1%BB%93ng.jpg' } },
];

// 베트남 공휴일·기념일 (off: 쉬는 날 / false: 쉬지 않는 기념일)
// short: 달력 날짜 칸에 보이는 짧은 이름
// ※ 설·국경일 연휴의 정확한 날짜는 매년 정부 발표로 확정돼요. 2027년 설 연휴는 예상치예요.
window.HOLIDAYS = {
  days: [
    // 2026
    { d: '2026-01-01', short: '신정', name: '양력 새해', off: true },
    { d: '2026-02-14', to: '2026-02-22', short: '설연휴', name: '설 연휴 (뗏)', off: true },
    { d: '2026-02-17', short: '설날', name: '음력 설날', off: true },
    { d: '2026-03-08', short: '여성의날', name: '세계 여성의 날', off: false },
    { d: '2026-04-26', short: '흥왕', name: '흥왕 기념일 (음력 3/10)', off: true },
    { d: '2026-04-27', short: '대체휴무', name: '흥왕 기념일 대체휴무', off: true },
    { d: '2026-04-30', short: '통일의날', name: '남부 해방·통일의 날', off: true },
    { d: '2026-05-01', short: '노동절', name: '국제 노동절', off: true },
    { d: '2026-06-01', short: '아동절', name: '국제 아동절', off: false },
    { d: '2026-09-01', to: '2026-09-02', short: '국경일', name: '국경일 (독립기념일) 연휴', off: true },
    { d: '2026-09-25', short: '추석', name: '중추절 (음력 8/15, 쉬지 않음)', off: false },
    { d: '2026-10-20', short: '여성의날', name: '베트남 여성의 날', off: false },
    { d: '2026-11-20', short: '스승의날', name: '스승의 날', off: false },
    { d: '2026-12-25', short: '성탄절', name: '크리스마스', off: false },
    // 2027
    { d: '2027-01-01', short: '신정', name: '양력 새해', off: true },
    { d: '2027-02-04', to: '2027-02-10', short: '설연휴', name: '설 연휴 (뗏, 예상)', off: true },
    { d: '2027-02-06', short: '설날', name: '음력 설날', off: true },
    { d: '2027-03-08', short: '여성의날', name: '세계 여성의 날', off: false },
    { d: '2027-04-16', short: '흥왕', name: '흥왕 기념일 (음력 3/10)', off: true },
    { d: '2027-04-30', short: '통일의날', name: '남부 해방·통일의 날', off: true },
    { d: '2027-05-01', short: '노동절', name: '국제 노동절', off: true },
    { d: '2027-06-01', short: '아동절', name: '국제 아동절', off: false },
    { d: '2027-09-02', short: '국경일', name: '국경일 (독립기념일, 앞뒤 1일 추가 휴무)', off: true },
    { d: '2027-09-15', short: '추석', name: '중추절 (음력 8/15, 쉬지 않음)', off: false },
    { d: '2027-10-20', short: '여성의날', name: '베트남 여성의 날', off: false },
    { d: '2027-11-20', short: '스승의날', name: '스승의 날', off: false },
    { d: '2027-12-25', short: '성탄절', name: '크리스마스', off: false },
  ],
};

// 알아두면 좋은 것
// 분야별로 묶여 있고, 생활 탭에서 분야를 눌러 펼쳐 볼 수 있어요.
// 제도·요금은 바뀔 수 있으니 중요한 일은 회사·대사관 공지로 한 번 더 확인하세요.
window.FACTS = [
  { icon: '🔌', title: '전기', items: [
    ['변압기 필요 없어요', '베트남도 220V라 한국 제품을 그대로 쓸 수 있어요.'],
    ['돼지코도 대부분 필요 없어요', '한국식 둥근 핀 플러그가 대부분 들어가요. 오래된 건물·호텔에는 납작한 11자 콘센트가 있어 멀티 어댑터 하나는 챙겨 두면 좋아요.'],
    ['주파수가 달라요 (한국 60Hz → 베트남 50Hz)', '모터·변압기가 든 제품(선풍기, 믹서, 일부 밥솥·제빵기, 오디오 앰프)은 느리게 돌거나 더 뜨거워질 수 있어요. 오래 켜 두는 제품은 처음 며칠 열이 나는지 지켜보세요.'],
    ['정밀 제어 기기는 주의', '전원 주파수로 시간을 재는 타이머·시계, 일부 의료·측정 기기는 오차가 생기거나 오작동할 수 있어요. 제품 뒷면에 "50/60Hz"라고 적혀 있으면 안심이에요.'],
    ['열만 내는 기기는 대체로 괜찮아요', '전기장판·드라이기·전기포트처럼 단순히 열을 내는 기기는 주파수 영향이 거의 없어요. 다만 모터나 전자 제어가 같이 들어간 제품은 위와 같이 과열·고장 위험이 있어요.'],
    ['전압이 불안정할 때가 있어요', '갑자기 정전·전압 변동이 있어요. 비싼 가전·PC는 서지 보호 멀티탭을 쓰고, 현지에서는 전압 안정기(ổn áp, LiOA 등)를 많이 써요.'],
  ]},
  { icon: '🚕', title: '교통 앱 · 안전', items: [
    ['Grab (그랩)', '가장 많이 써요. 오토바이·택시·배달·장보기까지 한 앱으로 돼요.'],
    ['Xanh SM (싸인 에스엠)', '빈패스트 전기차 택시예요. 그랩 다음으로 많이 쓰고, 차가 깨끗하고 기사 응대가 친절해 주재원·교민 가족이 특히 많이 써요. 초록색 차량이에요.'],
    ['Be (베)', '베트남 토종 호출 앱이에요. 요금이 그랩보다 조금 싼 경우가 많아 비교용으로 깔아 두면 좋아요.'],
    ['길에서 택시를 잡을 때', '미터기를 꼭 켜는지 확인하세요. 앱 호출이 요금이 정해져 있어 가장 안전해요.'],
    ['하노이 지하철', '2A호선(깟린–하동)과 3호선(녓 방면)이 운행 중이에요. 길찾기는 구글 지도가 버스·지하철까지 잘 알려줘요.'],
    ['오토바이 탈 때', '헬멧은 법적 의무예요. 그랩 바이크는 기사가 헬멧을 줘요.'],
    ['길 건너기 · 인도', '오토바이가 알아서 피해 가니 뛰지 말고 일정한 속도로 천천히 건너세요. 갑자기 멈추거나 뒤로 물러서는 게 더 위험해요. 인도로 올라오는 오토바이와 인도에 주차된 오토바이도 많으니 걸을 때도 조심하세요.'],
    ['운전면허', '한국에서 발급한 국제운전면허증은 베트남에서 인정되지 않는 경우가 많아요. 직접 운전하려면 베트남 면허로 바꿔야 해요(교통국 신청).'],
  ]},
  { icon: '📱', title: '통신 · 결제', items: [
    ['유심', 'Viettel · Vinaphone · Mobifone이 대표 통신사예요. 개통할 때 여권이 필요하고, 본인 인증(얼굴 인증)을 해야 계속 쓸 수 있어요.'],
    ['QR 송금이 일상', '베트남 은행 계좌를 만들면 시장·식당·카페까지 대부분 QR(VietQR)로 바로 계좌이체해요. 계좌 개설은 여권·거주증이 필요해요.'],
    ['카드', '대형 마트·쇼핑몰·호텔은 카드가 되지만 작은 가게는 현금이나 QR만 받는 곳이 많아요.'],
    ['현금 다루기', '소액권 위주로 들고 다니고, 낼 때 0의 개수를 꼭 확인하세요(경제 탭의 지폐 사진 참고).'],
    ['환전', '은행이나 공인 환전소를 이용하세요. 금은방 환전은 불법이라 단속·벌금 사례가 있어요.'],
  ]},
  { icon: '🛒', title: '쇼핑 · 배달', items: [
    ['음식 배달', 'GrabFood · ShopeeFood · Be가 많이 쓰여요.'],
    ['배달K (한국어 배달 앱)', '교민들이 많이 쓰는 한국어 음식 배달 앱이에요. 한식당·한인 가게 메뉴를 한국어로 보고 주문할 수 있어서 베트남어가 서툴러도 편해요. 하노이·호치민 등 한인이 많이 사는 지역 위주로 운영돼요.'],
    ['온라인 쇼핑', 'Shopee · Lazada · TikTok Shop이 대표적이에요. 착불(현금) 결제도 많이 해요.'],
    ['마트', '윈마트(WinMart), 이온몰(AEON), 롯데마트, 고(GO!) 등이 있어요. 한국 식품은 한인 마트나 롯데마트에서 쉽게 구해요.'],
    ['한인 밀집 지역', '경남 랜드마크72 주변(미딩·쭝화), 롯데센터 근처, 스타레이크 등에 한식당·한인 마트·학원이 모여 있어요.'],
  ]},
  { icon: '🌤️', title: '날씨 · 건강', items: [
    ['계절', '5~9월은 덥고 비가 많은 우기, 12~2월은 습하고 쌀쌀해요. 집에 난방이 없는 경우가 많아 겨울용 전기히터나 온풍 에어컨이 있으면 좋아요.'],
    ['미세먼지', '겨울철 공기가 나쁜 날이 많아요. IQAir 같은 앱으로 공기질을 확인하고 공기청정기를 쓰는 집이 많아요.'],
    ['물', '수돗물은 마시지 말고 생수나 정수기를 쓰세요. 양치는 수돗물로 해도 괜찮다는 사람이 많아요.'],
    ['외국인 병원', '빈멕(Vinmec), 홍응옥(Hồng Ngọc), 패밀리 메디컬 프랙티스(FMP) 등은 외국인 진료에 익숙하고 일부는 한국어 통역도 있어요. 해외 의료보험 처리 여부를 미리 확인하세요.'],
    ['모기', '뎅기열이 유행하는 시기가 있어요. 모기 기피제를 챙기고 고열이 나면 바로 병원에 가세요.'],
  ]},
  { icon: '🏛️', title: '행정 · 생활 예절', items: [
    ['거주 등록', '이사하면 집주인(또는 호텔)이 공안에 임시 거주 등록을 해요. 새 집에 들어가면 등록됐는지 확인하세요.'],
    ['관공서 점심시간', '보통 12시~13시 반은 점심·휴식 시간이라 업무를 잘 안 봐요.'],
    ['설(뗏) 연휴', '앞뒤로 1~2주는 가게·식당이 많이 쉬고 교통이 붐벼요. 생필품을 미리 사 두세요.'],
    ['팁', '기본적으로 팁 문화는 없어요. 다만 마사지·스파를 이용하고 만족했다면 5만~10만동을 주기도 해요. 일부 한인 대상 샵은 가격에 팁이 이미 포함돼 있으니, 이럴 땐 따로 주지 않으셔도 돼요.'],
  ]},
];

// 생활 필수앱 — android: 플레이스토어 패키지 이름 / ios: 앱스토어 ID (2026.11.17 스토어에서 확인)
// 누르면: 안드로이드는 설치돼 있으면 바로 열고, 없으면 플레이스토어 설치 화면 / 아이폰은 앱스토어 화면(설치돼 있으면 '열기')
window.APPS = [
// open: 설치된 앱을 바로 여는 주소 (앱이 받아 주는 링크). 없으면 플레이스토어 화면으로 연결
  { name: 'Grab', sub: '택시·오토바이·음식배달', icon: '🚗', color: '#00b14f', android: 'com.grabtaxi.passenger', img: 'images/apps/grab.png', ios: '647268330', iosOpen: 'https://www.grab.com/vn/download/', open: 'grab://open?screenType=MAIN' },
  { name: 'Zalo', sub: '베트남 국민 메신저', icon: '💬', color: '#0068ff', android: 'com.zing.zalo', img: 'images/apps/zalo.png', ios: '579523206', iosOpen: 'https://zalo.me/', open: 'https://zalo.me/' },
  { name: 'Google 번역', sub: '사진·음성 번역', icon: '🌐', color: '#4285f4', android: 'com.google.android.apps.translate', img: 'images/apps/translate.png', ios: '414706506', iosOpen: 'googletranslate://', open: 'https://translate.google.com/' },
  { name: 'Google 지도', sub: '길찾기·버스·지하철', icon: '🗺️', color: '#34a853', android: 'com.google.android.apps.maps', img: 'images/apps/maps.png', ios: '585027354', iosOpen: 'https://maps.google.com/', open: 'https://www.google.com/maps' },
  { name: '배달K', sub: '한국어 음식배달', icon: '🍱', color: '#ff5a3c', android: 'com.teamjin.deliveryk', img: 'images/apps/deliveryk.png', ios: '1456285291', iosOpen: 'https://www.deliveryk.com/', open: 'deliveryk://docs/' },
  { name: '우리 WON', sub: '우리은행 베트남', icon: '🏦', color: '#0067ac', android: 'vn.com.woori.smart', img: 'images/apps/wooriwon.png', ios: '1501785125',
    open: 'wvbs://', iosOpen: 'wvbs://' }, // 우리 WON 베트남 앱 주소 (VietQR 은행앱 바로가기 목록에 등록된 값)
];

// 지역 일러스트 (images/scenes 폴더) — 파일 이름만 바꾸면 다른 그림으로 교체돼요
// branch: 내 지역(지점)을 고르면 맨 위 제목 영역 배경 / city: 생활 → 지도에서 도시를 누르면 도시 안내 배경
window.SCENES = {
  branch: {
    hanoi: 'hanoi_01_van-mieu', hcm: 'ho-chi-minh_02_central-post-office', dongnai: 'dong-nai_02_tri-an',
    bacninh: 'bac-ninh_02_quan-ho', starlake: 'hoan-kiem_01_turtle-tower', binhduong: 'binh-duong_01_hoi-khanh',
    danang: 'da-nang_01_dragon-bridge', vinhphuc: 'vinh-phuc_02_dai-lai', lotte: 'hoan-kiem_01_turtle-tower',
    bienhoa: 'bien-hoa_01-tran-bien', hanam: 'ha-nam_01_tam-chuc',
    thainguyen: 'thai-nguyen_01_tan-cuong-corrected', haiphong: 'hai-phong_02_cat-ba',
  },
  city: {
    hanoi: 'hoan-kiem_01_turtle-tower', hcmc: 'ho-chi-minh_02_central-post-office', danang: 'da-nang_01_dragon-bridge',
    halong: 'hai-phong_02_cat-ba', ninhbinh: 'ha-nam_01_tam-chuc',
  },
};

// 하단 바 목적지: 우리은행 베트남 지점 목록 (첫 번째가 기본값)
// addr: 우리은행 베트남 공식 홈페이지 주소 / lat·lon: 구글 지도의 해당 지점 위치
// region: 저장하면 앱 제목이 'OO 생활 도우미'로 바뀌고, 이 지역 날씨를 보여줘요
// mapCheck: 공식 주소 위치와 구글 지도 지점 위치의 거리 (2026.11.16 확인)
window.BRANCHES = [
  { id: 'hanoi', label: '본점 (하노이 지점)', region: '하노이', lat: 21.0172334, lon: 105.783756,
    short: '경남 랜드마크72 · Phạm Hùng', addr: 'Room 101 & O3401, Keangnam Landmark 72, Pham Hung, Yen Hoa, Hanoi', mapCheck: 53 },
  { id: 'hcm', label: '호치민지점', region: '호치민', lat: 10.781316, lon: 106.7006022,
    short: 'Mplaza Saigon · 39 Lê Duẩn', addr: 'Room 7-9, 2F, Mplaza Saigon, 39 Le Duan, Sai Gon, Ho Chi Minh City', mapCheck: 13 },
  { id: 'dongnai', label: '동나이지점', region: '동나이', lat: 10.7342379, lon: 106.9312721,
    short: '년짝3 공단 · Tôn Đức Thắng', addr: 'Ton Duc Thang Road, Nhon Trach 3 Industrial Park, Nhon Trach Ward, Dong Nai City (공식 홈페이지 주소)', mapCheck: 0 },
  { id: 'bacninh', label: '박닌지점', region: '박닌', lat: 21.1784383, lon: 106.0723116,
    short: '빈컴 플라자 박닌 · Lý Thái Tổ', addr: '1F & 3F, Vincom Plaza Bac Ninh, Ly Thai To, Kinh Bac, Bac Ninh', mapCheck: 124 },
  { id: 'starlake', label: '스타레이크지점', region: '하노이', lat: 21.0521939, lon: 105.798065,
    short: '스타레이크 · Xuân Đỉnh', addr: 'K7TT1-SH06, KTT, Khu đô thị Tây Hồ Tây, Xuân Đỉnh, Hà Nội 10000 (구글 지도 주소)', mapCheck: 0 },
  { id: 'binhduong', label: '빈증지점', region: '빈증', lat: 10.9763621, lon: 106.6704869,
    short: '베카멕스 빌딩 10층', addr: '10F, Becamex Building, 230 Binh Duong Boulevard, Phu Loi, Ho Chi Minh City', mapCheck: 0 },
  { id: 'danang', label: '다낭지점', region: '다낭', lat: 16.0608222, lon: 108.215951,
    short: '피롱 테크놀로지 빌딩 · 52 Nguyễn Văn Linh', addr: '2F, Phi Long Technology Building, 52 Nguyen Van Linh, Hai Chau, Da Nang', mapCheck: 0 },
  { id: 'vinhphuc', label: '빈푹지점', region: '빈푹', lat: 21.3130825, lon: 105.6133375,
    short: '396 Mê Linh · 빈옌', addr: '1F & 2F, Bao Quan Hotel, 396 Me Linh, Vinh Phuc, Phu Tho', mapCheck: 47 },
  { id: 'lotte', label: '롯데몰지점', region: '하노이', lat: 21.0773036, lon: 105.8130745,
    short: '롯데몰 웨스트레이크 1층', addr: 'Lot 113, 1F, Lotte Mall Hanoi, 272 Vo Chi Cong, Tay Ho, Hanoi', mapCheck: 156 },
  { id: 'bienhoa', label: '비엔화지점', region: '비엔화', lat: 10.9072877, lon: 106.848674,
    short: '소나데지 빌딩 5층', addr: '5F, Sonadezi Building, No.1 Road 1, Bien Hoa 1 IP, Tran Bien, Dong Nai', mapCheck: 8 },
  { id: 'hanam', label: '하남지점', region: '하남', lat: 20.5318527, lon: 105.9141187,
    short: 'TMDV4 상업지구 · 푸리', addr: 'Khu TMDV4, QL1A, Phủ Lý, Ninh Bình (구글 지도 주소)', mapCheck: 0 },
  { id: 'thainguyen', label: '타이응웬지점', region: '타이응웬', lat: 21.4246433, lon: 105.8949051,
    short: '삼성 타이응웬 1번 게이트 2층', addr: 'Tầng 2, Cổng số 1, Samsung, Khu công nghiệp Yên Bình, Vạn Xuân, Thái Nguyên (구글 지도 주소)', mapCheck: 0 },
  { id: 'haiphong', label: '하이퐁지점', region: '하이퐁', lat: 20.8488956, lon: 106.7049861,
    short: 'Lô 22A · Lê Hồng Phong', addr: 'No. 4, Lot 22A, Le Hong Phong Street, Gia Vien Ward, Hai Phong (공식 홈페이지 주소)', mapCheck: 8 },
];

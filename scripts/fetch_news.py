"""하노이 주재원·가족에게 필요한 뉴스를 모아 news.json으로 저장합니다.

GitHub Actions가 몇 시간마다 이 스크립트를 실행합니다(.github/workflows/news.yml).
출처: 구글 뉴스 RSS (제목·언론사·날짜·원문 링크만 저장, 본문은 저장하지 않음)
검색어를 추가하거나 바꾸려면 아래 FEEDS 목록만 고치면 됩니다.
"""
import json
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

KST = timezone(timedelta(hours=9))
DAYS = 7          # 최근 며칠치 뉴스만
PER_FEED = 15     # 피드 하나에서 가져올 최대 기사 수
TOTAL = 150       # 전체 최대 기사 수

# (지역, 분류, 검색어) — 검색어가 None이면 한국 주요뉴스 헤드라인
# 지역: vn 베트남 / krvn 한-베 / kr 한국
FEEDS = [
    # 베트남·하노이 현지 소식
    ('vn', '생활', '하노이'),
    ('vn', '생활', '베트남 비자 OR 거주증 OR 출입국'),
    ('vn', '생활', '하노이 날씨 OR 태풍 OR 미세먼지'),
    ('vn', '생활', '하노이 교통 OR 지하철 OR 오토바이'),
    ('vn', '생활', '베트남 물가 OR 전기요금 OR 휘발유'),
    ('vn', '경제', '베트남 경제'),
    ('vn', '경제', '베트남 부동산'),
    ('vn', '금융', '베트남 금융 OR 은행 OR 중앙은행'),
    ('vn', '금융', '베트남 동화 환율'),
    ('vn', '금융', 'VN지수 OR 베트남 증시'),
    ('vn', '사회', '베트남 사회 OR 사건 OR 사고'),
    ('vn', '사회', '베트남 정부 OR 법 개정 OR 시행'),
    ('vn', '시사', '베트남 공산당 OR 또 럼 OR 총리'),
    # 한국-베트남
    ('krvn', '교민', '베트남 교민 OR 한인'),
    ('krvn', '교민', '주베트남 대사관 OR 하노이 한국'),
    ('krvn', '교민', '베트남 한국국제학교 OR 하노이 한국학교'),
    ('krvn', '경제', '한국 베트남 협력 OR 교역 OR 투자'),
    ('krvn', '금융', '베트남 한국 은행 OR 신한베트남 OR 우리베트남'),
    ('krvn', '경제', '삼성 베트남 OR LG 베트남'),
    # 한국 주요 뉴스
    ('kr', '시사', None),
    ('kr', '경제', '#BUSINESS'),
    ('kr', '사회', '#NATION'),
    ('kr', '금융', '원달러 환율 OR 기준금리 OR 코스피'),
]

BASE = 'https://news.google.com/rss'
TAIL = 'hl=ko&gl=KR&ceid=KR:ko'


def feed_url(q):
    if q is None:
        return f'{BASE}?{TAIL}'
    if q.startswith('#'):
        return f'{BASE}/headlines/section/topic/{q[1:]}?{TAIL}'
    return f'{BASE}/search?q={urllib.parse.quote(q + f" when:{DAYS}d")}&{TAIL}'


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (news collector)'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def clean_title(title, source):
    # 구글 뉴스 제목 끝의 " - 언론사" 제거
    if source and title.endswith(' - ' + source):
        title = title[: -len(source) - 3]
    return re.sub(r'\s+', ' ', title).strip()


def main():
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=DAYS)
    seen, items = set(), []
    for region, category, q in FEEDS:
        try:
            root = ET.fromstring(fetch(feed_url(q)))
        except Exception as e:  # 피드 하나가 실패해도 나머지는 계속
            print('skip', q, e)
            continue
        count = 0
        for it in root.iter('item'):
            if count >= PER_FEED:
                break
            src_el = it.find('source')
            source = (src_el.text or '').strip() if src_el is not None else ''
            title = clean_title(it.findtext('title', ''), source)
            try:
                pub = parsedate_to_datetime(it.findtext('pubDate', ''))
            except Exception:
                continue
            if pub < cutoff:
                continue
            key = re.sub(r'[^0-9A-Za-z가-힣]', '', title)[:40]
            if not title or key in seen:
                continue
            seen.add(key)
            items.append({
                'title': title,
                'source': source,
                'time': pub.astimezone(KST).isoformat(timespec='minutes'),
                'region': region,
                'category': category,
                'url': it.findtext('link', ''),
            })
            count += 1
        time.sleep(1)  # 서버에 부담 주지 않게 천천히

    items.sort(key=lambda x: x['time'], reverse=True)
    out = {
        'updatedAt': now.astimezone(KST).strftime('%Y.%m.%d %H:%M (KST)'),
        'items': items[:TOTAL],
    }
    with open('news.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"saved {len(out['items'])} items")


if __name__ == '__main__':
    main()

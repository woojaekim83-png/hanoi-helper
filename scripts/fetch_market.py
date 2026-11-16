"""오늘의 시세(환율·유가)를 모아 market.json으로 저장합니다.

- 환율: 우리은행 공식 홈페이지 '일별환율조회' (매매기준율, 원화 기준)
- 유가: Petrolimex 공식 앱/웹이 쓰는 공개 가격 API (하노이 등 1지역 소매가, 동/리터)
GitHub Actions가 뉴스 수집과 함께 실행합니다. 한쪽이 실패하면 기존 값을 그대로 둡니다.
"""
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))
UA = {'User-Agent': 'Mozilla/5.0 (market collector)'}

# 화면에 보일 순서: 미달러, 베트남 동, 유로, 위안, 엔
CURRENCIES = [
    ('USD', '🇺🇸', '달러', 1),
    ('VND', '🇻🇳', '동(100)', 100),
    ('EUR', '🇪🇺', '유로', 1),
    ('CNY', '🇨🇳', '위안', 1),
    ('JPY', '🇯🇵', '엔(100)', 100),
]
FUELS = [
    ('0201007', '⛽', '휘발유 RON95-V'),
    ('0201005', '⛽', '휘발유 E10 RON95'),
    ('0201004', '⛽', '휘발유 E5 RON92'),
    ('0601002', '🛢️', '경유 DO 0.05S'),
]

WOORI = 'https://spot.wooribank.com/pot/jcc?withyou=FXXRT0011&__ID=c008329'
PETRO = 'https://mobile-cms.petrolimex.com.vn/cms-service/public/api/v1/petrol-rentail-prices/list-retail-price-web?recentTime=12'


def woori_rates(day):
    """해당 날짜의 마지막 고시 매매기준율 {통화: 값}, 고시일시"""
    d = day.strftime('%Y.%m.%d')
    body = urllib.parse.urlencode({
        'BAS_DT': day.strftime('%Y%m%d'), 'NTC_DIS': 'A', 'SELECT_DATE': d,
        'SELECT_DATEY': day.strftime('%Y'), 'SELECT_DATEM': day.strftime('%m'), 'SELECT_DATED': day.strftime('%d'),
    }).encode()
    req = urllib.request.Request(WOORI, data=body, headers={**UA, 'X-Requested-With': 'XMLHttpRequest',
                                                            'Content-Type': 'application/x-www-form-urlencoded'})
    html = urllib.request.urlopen(req, timeout=25).read().decode('utf-8', 'ignore')
    noticed = re.search(r'고시기준일시[^0-9]{0,40}?(\d{4}\.\d{2}\.\d{2})\s*(\d{2}:\d{2})', html)
    out = {}
    for row in re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.S):
        # 우리은행 표는 첫 칸 태그가 어긋나 있어(<td>…</th>) 통화코드는 goDetail 링크에서 읽음
        code = re.search(r"goDetail\('\d+'\s*,\s*'([A-Z]{3})'", row)
        # 숫자 칸 순서: 송금보낼때, 받을때, 현찰살때, 현찰팔때, 매매기준율, 기준환율, 대미환산율 (% 칸 제외)
        nums = re.findall(r'<td[^>]*>\s*([\d,]+\.\d+)\s*</td>', row)
        if code and len(nums) >= 5:
            out[code.group(1)] = float(nums[4].replace(',', ''))
    return out, (f'{noticed.group(1)} {noticed.group(2)}' if noticed else '')


def fetch_rates():
    today = datetime.now(KST)
    cur, noticed = woori_rates(today)
    if not cur:  # 아직 오늘 고시 전이면 하루씩 거슬러 올라감
        for back in range(1, 8):
            today -= timedelta(days=1)
            cur, noticed = woori_rates(today)
            if cur:
                break
    prev, day = {}, today
    for back in range(1, 8):  # 전 영업일
        day -= timedelta(days=1)
        prev, _ = woori_rates(day)
        if prev:
            break
    rows = []
    for code, flag, name, unit in CURRENCIES:
        if code in cur:
            rows.append({'code': code, 'flag': flag, 'name': name, 'unit': unit, 'value': cur[code],
                         'change': round(cur[code] - prev[code], 2) if code in prev else None})
    return {'source': '우리은행 매매기준율', 'noticedAt': noticed, 'items': rows}


def fetch_fuel():
    req = urllib.request.Request(PETRO, headers={**UA, 'Origin': 'https://plxid.petrolimex.com.vn',
                                                 'Referer': 'https://plxid.petrolimex.com.vn/'})
    data = json.loads(urllib.request.urlopen(req, timeout=25).read().decode('utf-8'))['data']
    by = {d['goodsCode']: d for d in data}
    rows, eff = [], ''
    for code, icon, name in FUELS:
        d = by.get(code)
        if not d:
            continue
        eff = d.get('timeEffective', eff)
        before = d.get('priceAreaOneBefore')
        rows.append({'code': code, 'icon': icon, 'name': name, 'value': d['priceAreaOne'],
                     'change': (d['priceAreaOne'] - before) if before else None})
    return {'source': 'Petrolimex 1지역 소매가', 'effectiveAt': eff[:16], 'items': rows}


def main():
    try:
        with open('market.json', encoding='utf-8') as f:
            out = json.load(f)
    except Exception:
        out = {}
    for key, fn in (('rates', fetch_rates), ('fuel', fetch_fuel)):
        try:
            res = fn()
            if res['items']:
                out[key] = res
                print(key, 'ok', len(res['items']))
            else:
                print(key, 'empty — 기존 값 유지')
        except Exception as e:
            print(key, 'fail — 기존 값 유지:', e)
    out['updatedAt'] = datetime.now(KST).strftime('%m.%d %H:%M')
    with open('market.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()

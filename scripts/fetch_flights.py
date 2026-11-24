"""베트남 주요 공항 출발 최저가 항공권을 Travelpayouts(Aviasales) 가격 API에서 받아 flights.json으로 저장합니다.

- 가격은 최근 사용자 검색에서 모인 값(캐시)이라 실시간 가격과 다를 수 있어요
- 출발: 하노이(HAN) · 호찌민(SGN) · 다낭(DAD) / 도착: 한국(ICN · PUS · CJU) + 전체(목적지 제한 없음)
- 편도·왕복, 이번 달 + 다음 달 출발, 직항·경유 모두 받아서 화면에서 거릅니다
- API 토큰은 GitHub Secrets의 TRAVELPAYOUTS_TOKEN (로그에 절대 찍지 않아요)
- 실행 끝에 노선별로 몇 건 받았는지 요약을 찍어요 (데이터가 충분한지 확인용)
- GitHub Actions에서 실행 (.github/workflows/flights.yml)
"""
import gzip, json, os, sys, urllib.parse, urllib.request
from datetime import datetime, timezone, timedelta

API = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates'
VN = timezone(timedelta(hours=7))
OUT = 'flights.json'
ORIGINS = ['HAN', 'SGN', 'DAD']
KOREA = ['ICN', 'PUS', 'CJU']
CURRENCY = 'vnd'

TOKEN = os.environ.get('TRAVELPAYOUTS_TOKEN', '').strip()
if not TOKEN:
    sys.exit('TRAVELPAYOUTS_TOKEN이 없어요 (GitHub Secrets 확인)')


def get(params):
    q = dict(params, currency=CURRENCY, sorting='price', limit=1000, page=1)
    req = urllib.request.Request(API + '?' + urllib.parse.urlencode(q),
                                 headers={'X-Access-Token': TOKEN, 'Accept-Encoding': 'gzip, deflate',
                                          'User-Agent': 'hanoi-helper flight bot'})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            body = r.read()
            if r.headers.get('Content-Encoding') == 'gzip':
                body = gzip.decompress(body)
    except urllib.error.HTTPError as e:
        return None, f'HTTP {e.code} {e.read()[:200]!r}'
    except Exception as e:  # 네트워크 오류 등
        return None, repr(e)[:200]
    d = json.loads(body)
    if not d.get('success', True):
        return None, str(d.get('error'))[:200]
    return d.get('data') or [], None


def months(n=2):
    t = datetime.now(VN)
    out = []
    for i in range(n):
        y, m = t.year + (t.month - 1 + i) // 12, (t.month - 1 + i) % 12 + 1
        out.append(f'{y}-{m:02d}')
    return out


def norm(x, trip):
    return {
        'from': x.get('origin_airport') or x.get('origin'),
        'to': x.get('destination_airport') or x.get('destination'),
        'airline': x.get('airline'),
        'flight': x.get('flight_number'),
        'transfers': x.get('transfers'),
        'return_transfers': x.get('return_transfers'),
        'price': x.get('price'),
        'depart': (x.get('departure_at') or '')[:16],
        'return': (x.get('return_at') or '')[:16] if trip == 'rt' else '',
        'duration': x.get('duration_to') or x.get('duration'),
        'trip': trip,
    }


def main():
    rows, summary, errors = [], [], []
    for o in ORIGINS:
        for dest in KOREA + ['']:  # '' = 목적지 제한 없음(전체)
            for trip in ('ow', 'rt'):
                got = 0
                for mo in months():
                    p = {'origin': o, 'departure_at': mo, 'one_way': 'true' if trip == 'ow' else 'false', 'direct': 'false'}
                    if dest:
                        p['destination'] = dest
                    data, err = get(p)
                    if err:
                        errors.append(f'{o}->{dest or "*"} {trip} {mo}: {err}')
                        continue
                    got += len(data)
                    rows += [norm(x, trip) for x in data]
                direct = sum(1 for r in rows if r['from'] == o and (not dest or r['to'] == dest) and r['trip'] == trip and r['transfers'] == 0)
                summary.append((o, dest or '전체', trip, got, direct))

    # 같은 항공편·날짜 중복 제거 (한국행 조회와 전체 조회가 겹칠 수 있어요)
    seen, uniq = set(), []
    for r in rows:
        k = (r['from'], r['to'], r['airline'], r['flight'], r['depart'], r['return'], r['trip'])
        if k not in seen and r['price']:
            seen.add(k)
            uniq.append(r)
    uniq.sort(key=lambda r: r['price'])

    # 앱이 빨리 열리도록 줄이기: 지난 날짜는 빼고, 노선(출발·도착·편도/왕복)마다 싼 순으로
    # 한국행은 날짜 고르기에 충분하도록 최대 60건, 그 밖의 목적지는 최대 3건만 남겨요
    today = datetime.now(VN).strftime('%Y-%m-%d')
    kept, count = [], {}
    for r in uniq:
        if r['depart'][:10] < today:
            continue
        k = (r['from'], r['to'], r['trip'])
        cap = 60 if r['to'] in KOREA else 3
        if count.get(k, 0) < cap:
            count[k] = count.get(k, 0) + 1
            kept.append(r)
    print(f'앱용으로 줄인 뒤 {len(kept)}건')
    uniq = kept

    print('출발  도착   구분  받은건수  (그중 직항)')
    for o, d, t, n, dn in summary:
        print(f'{o}   {d:<5} {"편도" if t == "ow" else "왕복"}  {n:>6}   ({dn})')
    print(f'중복 제거 후 {len(uniq)}건 · 통화 {CURRENCY}')
    if errors:
        print(f'\n오류 {len(errors)}건:')
        for e in errors[:10]:
            print(' -', e)

    if not uniq:
        sys.exit('받은 가격이 없어요 — flights.json은 그대로 둬요')
    json.dump({'updated': datetime.now(VN).strftime('%Y-%m-%d %H:%M'), 'currency': CURRENCY, 'flights': uniq},
              open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))


if __name__ == '__main__':
    main()

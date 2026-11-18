"""통화별 환율 기록(최대 10년)을 우리은행 '기간별환율조회'에서 모아 history/통화.json으로 저장합니다.

- 처음(파일이 없을 때)은 10년치를 한 번에 받고, 그 뒤로는 최근 3주만 다시 받아 덮어씁니다.
  (오늘 값은 하루 중에도 고시가 바뀌므로 30분마다 갱신)
- 한 줄 형식: [날짜 YYYYMMDD, 매매기준율, 송금 보낼 때, 송금 받을 때, 현찰 살 때, 현찰 팔 때]
  값이 없는 칸(예: 예전 VND 송금 환율)은 null
GitHub Actions가 뉴스·시세 수집과 함께 실행합니다. 실패하면 기존 파일을 그대로 둡니다.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))
UA = {'User-Agent': 'Mozilla/5.0 (rate history collector)'}
URL = 'https://spot.wooribank.com/pot/jcc?withyou=FXXRT0014&__ID=c008217'
CODES = ['USD', 'VND', 'EUR', 'CNY', 'JPY']
OUT = 'history'


def num(s):
    s = s.strip().replace(',', '')
    try:
        return float(s)
    except ValueError:
        return None


def fetch(code, start, end):
    body = urllib.parse.urlencode({
        'INQ_DIS': code, 'DIS': '1',
        'BAS_SDT': start.strftime('%Y%m%d'), 'BAS_EDT': end.strftime('%Y%m%d'),
        'START_DATE': start.strftime('%Y.%m.%d'), 'END_DATE': end.strftime('%Y.%m.%d'),
        'START_DATEY': start.strftime('%Y'), 'START_DATEM': start.strftime('%m'), 'START_DATED': start.strftime('%d'),
        'END_DATEY': end.strftime('%Y'), 'END_DATEM': end.strftime('%m'), 'END_DATED': end.strftime('%d'),
    }).encode()
    req = urllib.request.Request(URL, data=body, headers={**UA, 'X-Requested-With': 'XMLHttpRequest',
                                                          'Content-Type': 'application/x-www-form-urlencoded'})
    html = urllib.request.urlopen(req, timeout=90).read().decode('utf-8', 'ignore')
    rows = {}
    for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.S):
        cells = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)
        if len(cells) < 6:
            continue
        d = re.fullmatch(r'\s*(\d{4})\.(\d{2})\.(\d{2})\s*', cells[0])
        if not d:
            continue
        # 매매기준율 칸: "5.20<br/><span>하락</span>-0.01" → 앞의 숫자만
        base = num(re.split(r'<', cells[5])[0])
        if base is None:
            continue
        send, recv, buy, sell = (num(re.sub(r'<[^>]*>', '', c)) for c in cells[1:5])
        rows[''.join(d.groups())] = [''.join(d.groups()), base, send, recv, buy, sell]
    return rows


def main():
    os.makedirs(OUT, exist_ok=True)
    now = datetime.now(KST)
    full = '--full' in sys.argv
    for code in CODES:
        path = f'{OUT}/{code}.json'
        try:
            with open(path, encoding='utf-8') as f:
                old = json.load(f)
        except Exception:
            old = None
        # 받을 구간: 최근 3주 + (10년치가 다 안 모였으면) 그 앞 1년씩 최대 2구간
        # 한 번에 10년을 요청하면 해외(GitHub) 서버에서 시간이 초과돼서 1년 단위로 나눠 받음
        target = (now - timedelta(days=3652)).strftime('%Y%m%d')
        oldest = old['rows'][0][0] if old and old.get('rows') and not full else None
        recent = now - timedelta(days=21)
        if old and old.get('rows'):  # 한동안 수집이 멈췄다면 마지막 기록부터 이어서
            recent = min(recent, datetime.strptime(old['rows'][-1][0], '%Y%m%d').replace(tzinfo=KST))
        spans = [(recent, now)]
        edge = datetime.strptime(oldest, '%Y%m%d').replace(tzinfo=KST) if oldest else now
        for _ in range(2 if oldest else 3):
            if edge.strftime('%Y%m%d') <= target:
                break
            s = max(edge - timedelta(days=365), datetime.strptime(target, '%Y%m%d').replace(tzinfo=KST))
            spans.append((s, edge))
            edge = s
        new = {}
        for s, e in spans:
            try:
                new.update(fetch(code, s, e))
            except Exception as err:
                print(code, s.strftime('%Y%m%d'), '~', e.strftime('%Y%m%d'), 'fail:', err)
                break  # 앞 구간이 비면 중간이 끊기니 여기서 멈춤 (다음 실행 때 이어서)
        if not new:
            print(code, 'empty — 기존 파일 유지')
            continue
        merged = {r[0]: r for r in (old['rows'] if old else [])}
        merged.update(new)
        rows = sorted(merged.values(), key=lambda r: r[0])
        out = {'code': code, 'source': '우리은행 기간별환율조회',
               'updatedAt': now.strftime('%Y.%m.%d %H:%M'), 'rows': rows}
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
        print(code, 'ok', len(rows), rows[0][0], '~', rows[-1][0])


if __name__ == '__main__':
    main()

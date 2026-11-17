"""베트남 중앙은행(SBV) 기준금리를 읽어 policy.json으로 저장합니다.

출처: SBV 공식 홈페이지 '각종 금리' 페이지의 'NHNN 규정 금리' 표
      (재할인금리 Lãi suất tái chiết khấu / 재융자금리 Lãi suất tái cấp vốn)
GitHub Actions가 매일 베트남 시각 09:00(.github/workflows/policy.yml)에 실행합니다.
읽기에 실패하면 기존 policy.json을 그대로 둡니다.
"""
import json
import re
import urllib.request
from datetime import datetime, timedelta, timezone

URL = 'https://sbv.gov.vn/vi/l%C3%A3i-su%E1%BA%A5t1'
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'}
ICT = timezone(timedelta(hours=7))


def to_date(s):  # '16/06/2023' -> '2023.06.16'
    d, m, y = s.split('/')
    return f'{y}.{int(m):02d}.{int(d):02d}'


def row(html, label):
    m = re.search(label + r'\s*</td>\s*<td[^>]*>\s*([\d.,]+)\s*%\s*</td>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>\s*([\d/]+)\s*</td>', html, re.S)
    if not m:
        raise ValueError(f'표에서 {label} 을(를) 찾지 못함')
    rate = float(m.group(1).replace('.', '').replace(',', '.'))  # 4,500 -> 4.5
    doc = re.sub(r'<[^>]+>|\s+', ' ', m.group(2)).strip()
    return rate, doc, m.group(3)


def main():
    html = urllib.request.urlopen(urllib.request.Request(URL, headers=UA), timeout=60).read().decode('utf-8', 'ignore')
    refi, doc, applied = row(html, 'Lãi suất tái cấp vốn')
    disc, _, _ = row(html, 'Lãi suất tái chiết khấu')
    dm = re.search(r'ngày\s*([\d/]+)', doc)
    decided = to_date(dm.group(1)) if dm else ''
    applied = to_date(applied)
    # SBV 표의 적용일이 결정일보다 앞서 있으면(오기) 결정일을 변경일로 사용
    changed = decided if decided and applied < decided else applied

    try:
        old = json.load(open('policy.json', encoding='utf-8'))
    except Exception:
        old = {}
    prev = old.get('prevRefinancing', 5.0)
    if old.get('refinancing') is not None and old['refinancing'] != refi:
        prev = old['refinancing']  # 금리가 바뀌면 직전 값을 기록

    out = {
        'refinancing': refi, 'discount': disc, 'prevRefinancing': prev,
        'changedAt': changed, 'decision': doc,
        'checkedAt': datetime.now(ICT).strftime('%Y.%m.%d %H:%M'),
        'source': URL,
    }
    json.dump(out, open('policy.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('policy', out)


if __name__ == '__main__':
    main()

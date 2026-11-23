"""우리은행 베트남 개인 예·적금 금리를 공식 홈페이지(woori.com.vn/lai-suat/)에서 읽어 deposit.json으로 저장합니다.

- 홈페이지 '금리' 화면에 올라오는 PDF 두 개를 읽어요
  · 인터넷·모바일 전용 상품표 (LAI-SUAT-TIEN-GUI-TRUC-TUYEN): WON 정기예금 · WON Challenge · WON Goal
  · 영업점 개인 상품표 (Lai-suat-tien-gui-KH-ca-nhan): 일반 정기적금(Tiền gửi tích lũy định kỳ cố định)
- 표 구조가 바뀌어 못 읽으면 기존 deposit.json을 그대로 두고 실패로 끝나요 (화면엔 마지막으로 확인한 금리가 보여요)
- GitHub Actions가 1시간마다 실행 (.github/workflows/deposit.yml)
"""
import io, json, re, sys, urllib.request
from datetime import datetime, timezone, timedelta

import pdfplumber

PAGE = 'https://woori.com.vn/lai-suat/'
UA = {'User-Agent': 'Mozilla/5.0 (compatible; hanoi-helper rate bot)'}
VN = timezone(timedelta(hours=7))
OUT = 'deposit.json'


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()


def pct(cell):
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*%', cell or '')
    return float(m.group(1).replace(',', '.')) if m else None


def term_ko(cell):
    """'1 tháng ~ dưới 3 tháng' → '1~3개월', '12/15/18/21 tháng' → '12·15·18·21개월', 'Từ 6 tháng đến dưới 12 tháng' → '6~12개월'"""
    c = ' '.join((cell or '').split())
    nums = re.findall(r'\d+(?:/\d+)*', c)
    unit = '일' if 'ngày' in c else '개월'
    if len(nums) >= 2:
        return f'{nums[0]}~{nums[1]}{unit}'
    if nums:
        return nums[0].replace('/', '·') + unit
    return c


def clean(t):
    return [[' '.join((c or '').split()) for c in row] for row in t if any(row)]


def tables(pdf_bytes):
    out = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            out += [clean(t) for t in page.extract_tables()]
    return out


def effective(pdf_bytes):
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        text = pdf.pages[0].extract_text() or ''
    m = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', text)
    return f'{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}' if m else ''


def row_of(t, *keys):
    for r in t:
        if r and any(k in r[0].lower() for k in keys):
            return r
    return None


def online_products(ts):
    """가로형 표: 첫 줄 = 기간, 다음 줄 = 금리(총/기본), 우대 줄은 '최대 n%'"""
    prods = {}
    for t in ts:
        head = t[0] if t else []
        if not head or 'kỳ hạn' not in head[0].lower():
            continue
        terms = [term_ko(c) for c in head[1:] if c]
        total = row_of(t, 'tổng lãi suất')
        base = row_of(t, 'lãi suất cơ bản')
        bonus = row_of(t, 'ưu đãi')
        plain = row_of(t, 'lãi suất (%/năm)')
        heads = ' '.join(head)
        if 'ngày' in heads:  # 일 단위 적립(60/90/120일) — 이번 화면에선 안 씀
            continue
        if total and '6/9' in heads:
            key = 'challenge'
        elif total and 'dưới' in heads:
            key = 'goal'
        elif plain and not total and len(terms) >= 4 and 'tháng' in heads:
            key = 'won'
        else:
            continue
        rows = []
        vals = [pct(c) for c in (total or plain)[1:] if c]
        bases = [pct(c) for c in base[1:] if c] if base else []
        for i, term in enumerate(terms):
            if i >= len(vals) or vals[i] is None:
                raise ValueError(f'{key}: {term} 금리를 못 읽음')
            rows.append({'term': term, 'rate': vals[i], **({'base': bases[i]} if i < len(bases) and bases[i] is not None else {})})
        bon = [pct(c) for c in (bonus or [])[1:] if c and pct(c) is not None]
        prods[key] = {'rows': rows, **({'bonusMax': max(bon)} if bon else {})}
    return prods


def counter_installment(ts):
    """세로형 표 '기간 | 금리', 'Từ … tháng' 줄만 있고 '기본/우대' 열이 없는 표 = 정기적금(tích lũy định kỳ cố định)"""
    for t in ts:
        txt = ' '.join(c for r in t for c in r).lower()
        if 'cơ bản' in txt or 'ưu đãi' in txt:  # Woori V Free(기본+우대) 표는 제외
            continue
        rows = []
        for r in t:
            cells = [c for c in r if c]
            if not cells or not cells[0].lower().startswith('từ'):
                continue
            rates = [pct(c) for c in cells[1:] if pct(c) is not None]
            if rates:
                rows.append({'term': term_ko(cells[0]), 'rate': rates[-1]})
        if len(rows) >= 3:
            return {'rows': rows}
    for i, t in enumerate(ts):  # 못 찾았을 때 표 모양을 기록 (원인 확인용)
        print(f'표 {i}:', t[:3])
    raise ValueError('정기적금 표를 못 찾음')


def main():
    html = get(PAGE).decode('utf-8', 'ignore')
    pdfs = re.findall(r'href="(https://woori\.com\.vn/wp-content/uploads/[^"]+\.pdf)"', html)
    online = next((u for u in pdfs if 'TRUC-TUYEN' in u.upper()), None)
    counter = next((u for u in pdfs if 'CA-NHAN' in u.upper()), None)
    if not online or not counter:
        raise SystemExit(f'금리 PDF 링크를 못 찾음: {pdfs}')
    ob, cb = get(online), get(counter)
    op = online_products(tables(ob))
    for k in ('won', 'challenge', 'goal'):
        if k not in op:
            raise SystemExit(f'온라인 상품표에서 {k}를 못 읽음 — 기존 값 유지')
    data = {
        'source': '우리은행 베트남 공식 홈페이지 금리 안내(PDF)',
        'page': PAGE,
        'checkedAt': datetime.now(VN).strftime('%Y-%m-%d %H:%M'),
        'effective': {'online': effective(ob), 'counter': effective(cb)},
        'files': {'online': online, 'counter': counter},
        'products': {
            'won': {'name': 'WON 정기예금', 'vi': 'Tiền gửi có kỳ hạn WON', 'kind': '예금', **op['won']},
            'challenge': {'name': 'WON 챌린지 자유적금', 'vi': 'Tiền gửi tích lũy WON Challenge', 'kind': '적금', **op['challenge']},
            'goal': {'name': 'WON Goal 정기적금', 'vi': 'Tiền gửi tích lũy WON Goal', 'kind': '적금', **op['goal']},
            'regular': {'name': '일반 정기적금', 'vi': 'Tiền gửi tích lũy định kỳ cố định', 'kind': '적금 · 영업점', **counter_installment(tables(cb))},
        },
    }
    # 금리가 그대로면 확인 시각만 바뀌므로 파일을 다시 쓰지 않아요 (매시간 쓸데없는 기록 방지)
    try:
        old = json.load(open(OUT, encoding='utf-8'))
        if old.get('products') == data['products'] and old.get('effective') == data['effective']:
            print('금리 변동 없음')
            return
    except Exception:
        pass
    json.dump(data, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(data['products'], ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('실패:', e)
        sys.exit(1)

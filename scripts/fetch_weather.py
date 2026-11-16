"""우리은행 지점 + 지도 도시들의 날씨·미세먼지를 미리 받아 weather.json으로 저장합니다.

베트남 휴대폰 네트워크에서 날씨 서버(Open-Meteo) 연결이 자주 끊겨서,
GitHub 서버가 대신 받아 두고 앱은 우리 사이트의 파일을 바로 읽도록 했어요.
좌표는 data.js(지점)와 cities.js(도시)에서 자동으로 읽어요.
"""
import json
import re
import urllib.request
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))
UA = {'User-Agent': 'Mozilla/5.0 (weather collector)'}


def points():
    pts = []
    for f in ('data.js', 'cities.js'):
        txt = open(f, encoding='utf-8-sig').read()
        pts += [(float(a), float(b)) for a, b in re.findall(r'lat:\s*([\d.]+),\s*lon:\s*([\d.]+)', txt)]
    seen, out = set(), []
    for la, lo in pts:
        k = f'{la:.2f},{lo:.2f}'
        if k not in seen:
            seen.add(k)
            out.append((la, lo))
    return out


def get(url):
    req = urllib.request.Request(url, headers=UA)
    data = json.loads(urllib.request.urlopen(req, timeout=40).read().decode('utf-8'))
    return data if isinstance(data, list) else [data]


def main():
    pts = points()
    lat = ','.join(f'{a:.4f}' for a, _ in pts)
    lon = ','.join(f'{b:.4f}' for _, b in pts)
    tz = 'timezone=Asia%2FHo_Chi_Minh'
    wx = get(f'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&{tz}&forecast_days=7'
             '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m'
             '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,'
             'precipitation_sum,uv_index_max')
    try:
        air = get(f'https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&{tz}&current=pm2_5')
    except Exception as e:
        print('air fail', e)
        air = [{}] * len(pts)
    out = {'updatedAt': datetime.now(KST).strftime('%m.%d %H:%M'), 'at': int(datetime.now(timezone.utc).timestamp() * 1000), 'places': {}}
    for (la, lo), w, a in zip(pts, wx, air):
        out['places'][f'{la:.2f},{lo:.2f}'] = {
            'current': w.get('current'), 'daily': w.get('daily'),
            'pm': (a.get('current') or {}).get('pm2_5'),
        }
    with open('weather.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    print('saved', len(out['places']), 'places')


if __name__ == '__main__':
    main()

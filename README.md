# 베트남 생활 도우미

하노이 생활에 필요한 환율·지폐, 뉴스, 생활 베트남어, 공휴일 달력을 한곳에 모은 웹앱(PWA)입니다.

## 파일 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 화면 구조 |
| `style.css` | 디자인 |
| `app.js` | 탭, 뉴스, 환율, 지폐 |
| `features.js` | 베트남어, 시계, 달력, 하단 바 |
| `data.js` | 뉴스·지폐·공휴일·생활 정보 데이터 |
| `viet.js` | 상황별 베트남어 문장 |
| `manifest.webmanifest`, `sw.js` | 웹앱 설치·오프라인 지원 |

## 내용 고치기

글이나 데이터만 바꿀 때는 `data.js`와 `viet.js`만 고치면 됩니다.

## 내 PC에서 미리 보기

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

브라우저에서 http://localhost:8124 를 엽니다.

## 다시 배포하기

```
git add -A
git commit -m "내용 수정"
git push
```

1~2분 뒤 GitHub Pages 주소에 반영됩니다.

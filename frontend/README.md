# 🔥 ThemeFlow — 테마 자금 흐름 분석 서비스

주식 시장에서 **"지금 돈이 어디로 몰리는지"** 테마 단위로 보여주는 서비스

---

## 📁 프로젝트 구조

```
theme-flow/
├── backend/
│   ├── main.py                  ← FastAPI 앱 진입점
│   ├── requirements.txt
│   ├── data/
│   │   ├── krx_fetcher.py       ← 한국 주식 (pykrx)
│   │   └── us_fetcher.py        ← 미국 주식 (yfinance, 추후 활성화)
│   ├── themes/
│   │   └── mapper.py            ← 테마-종목 매핑 데이터
│   └── api/
│       └── routes.py            ← API 라우터
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx               ← 메인 대시보드
        ├── index.css
        ├── components/
        │   ├── TopThemes.jsx     ← 오늘 TOP 10 테마
        │   ├── ThemeRanking.jsx  ← 전체 랭킹
        │   ├── FlowChart.jsx     ← 기간별 차트
        │   └── SurgeAlert.jsx    ← 급증 테마 감지
        └── hooks/
            └── useThemeData.js   ← API 호출 훅
```

---

## 🚀 실행 방법

### 1️⃣ 백엔드 실행

```bash
cd backend

# 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows

# 패키지 설치
pip install -r requirements.txt

# 서버 실행
uvicorn main:app --reload --port 8000
```

백엔드 실행 후 → http://localhost:8000/docs 에서 API 확인 가능

### 2️⃣ 프론트엔드 실행

```bash
cd frontend

# 패키지 설치
npm install

# 개발서버 실행
npm run dev
```

→ http://localhost:5173 에서 대시보드 확인

---

## 🌐 API 엔드포인트 목록

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/themes/today?market=kr&top=10` | 오늘 TOP N 테마 |
| GET | `/api/themes/ranking?market=kr` | 전체 랭킹 |
| GET | `/api/themes/{name}/chart?weeks=1` | 차트 데이터 |
| GET | `/api/themes/surge?threshold=1.5` | 급증 테마 감지 |
| GET | `/api/themes/{name}/stocks` | 테마별 종목 목록 |

---

## 🛠️ 추가 개발 가이드

### 테마-종목 매핑 수정
`backend/themes/mapper.py` 파일의 `THEME_STOCK_MAP` 딕셔너리를 수정하세요.
각 종목코드는 KRX 6자리 코드입니다.

### 미국 주식 활성화
현재 미국 시장은 `us_fetcher.py`에 코드가 준비되어 있습니다.
프론트엔드에서 마켓을 🇺🇸로 선택하면 자동으로 yfinance 데이터를 사용합니다.

### 데이터 캐싱 추가 (권장)
실서비스에서는 API 호출 빈도를 줄이기 위해 Redis 또는 인메모리 캐싱을 추가하세요.

```python
# 예시: FastAPI 캐싱 (fastapi-cache2 라이브러리)
from fastapi_cache.decorator import cache

@router.get("/themes/today")
@cache(expire=300)  # 5분 캐시
async def get_today_top_themes(...):
    ...
```

### 모바일 앱 (React Native)
프론트엔드 로직과 훅(`useThemeData.js`)을 그대로 React Native로 이식 가능합니다.
API URL만 환경변수로 분리해두면 됩니다.

---

## ⚠️ 주의사항

- `pykrx`는 **장중/장마감 이후** 데이터가 다를 수 있어요 (실시간 아님)
- `yfinance`는 **개인 사용 목적**으로 설계된 라이브러리예요 → 서비스 오픈 시 유료 API 전환 권장
- 테마-종목 매핑은 현재 **수동 관리** → 서비스 확장 시 DB화 권장

---

## 🗺️ 로드맵

- [x] 1단계: 한국 주식 데이터 수집 + FastAPI 백엔드
- [x] 2단계: React 반응형 대시보드
- [ ] 3단계: 미국 주식 활성화
- [ ] 4단계: 실시간 데이터 (WebSocket)
- [ ] 5단계: 회원가입/로그인, 관심 테마 저장
- [ ] 6단계: React Native 모바일 앱
- [ ] 7단계: 서비스 배포 (Vercel + Railway/AWS)

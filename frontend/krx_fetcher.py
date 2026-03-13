"""
한국 주식 데이터 수집 모듈 (pykrx 사용)
- 종목별 거래대금 수집
- 테마별 거래대금 합산
- 급등 테마 감지
"""

from pykrx import stock
import pandas as pd
from datetime import datetime, timedelta
from themes.mapper import THEME_STOCK_MAP, get_stocks_by_theme, get_all_stock_codes
import logging

logger = logging.getLogger(__name__)


def get_recent_trading_date(days_back: int = 0) -> str:
    """최근 거래일 반환 (주말/공휴일 제외 근사값)"""
    date = datetime.now() - timedelta(days=days_back)
    # 주말이면 금요일로 이동
    while date.weekday() >= 5:
        date -= timedelta(days=1)
    return date.strftime("%Y%m%d")


def fetch_stock_trading_volume(date: str = None) -> dict:
    """
    특정 날짜의 전체 종목 거래대금 수집
    Returns: {종목코드: 거래대금(원)} 딕셔너리
    """
    if not date:
        date = get_recent_trading_date()

    try:
        # KOSPI + KOSDAQ 전체 종목 OHLCV
        kospi = stock.get_market_ohlcv(date, market="KOSPI")
        kosdaq = stock.get_market_ohlcv(date, market="KOSDAQ")

        combined = pd.concat([kospi, kosdaq])

        # 거래대금 컬럼: '거래대금'
        volume_dict = {}
        if "거래대금" in combined.columns:
            volume_dict = combined["거래대금"].to_dict()
        elif "값" in combined.columns:
            volume_dict = combined["값"].to_dict()
        else:
            # 컬럼명 변환 시도
            combined.columns = [str(c) for c in combined.columns]
            for col in combined.columns:
                if "거래" in col and "대금" in col:
                    volume_dict = combined[col].to_dict()
                    break

        # 인덱스를 문자열 6자리로 정규화
        normalized = {}
        for code, val in volume_dict.items():
            str_code = str(code).zfill(6)
            normalized[str_code] = int(val) if pd.notna(val) else 0

        logger.info(f"[KRX] {date} 거래대금 수집 완료: {len(normalized)}종목")
        return normalized

    except Exception as e:
        logger.error(f"[KRX] 거래대금 수집 실패 ({date}): {e}")
        return {}


def fetch_stock_ohlcv_range(code: str, start: str, end: str) -> pd.DataFrame:
    """
    개별 종목 기간별 OHLCV 수집
    Returns: DataFrame with columns [날짜, 시가, 고가, 저가, 종가, 거래량, 거래대금]
    """
    try:
        df = stock.get_market_ohlcv(start, end, code)
        df.index = pd.to_datetime(df.index)
        df.index.name = "날짜"
        return df
    except Exception as e:
        logger.error(f"[KRX] 종목 {code} OHLCV 수집 실패: {e}")
        return pd.DataFrame()


def calculate_theme_volume_today() -> list:
    """
    오늘(최근 거래일) 테마별 거래대금 합산
    Returns: [
        {
          "theme": str,
          "description": str,
          "total_volume": int,
          "stocks": [{code, name, volume}, ...]
        }
    ]
    """
    today = get_recent_trading_date()
    stock_volumes = fetch_stock_trading_volume(today)

    if not stock_volumes:
        # 전날로 재시도
        yesterday = get_recent_trading_date(days_back=1)
        stock_volumes = fetch_stock_trading_volume(yesterday)

    theme_results = []

    for theme_name, theme_data in THEME_STOCK_MAP.items():
        stocks = theme_data["stocks"]
        stock_details = []
        total_volume = 0

        for s in stocks:
            vol = stock_volumes.get(s["code"], 0)
            total_volume += vol
            stock_details.append({
                "code": s["code"],
                "name": s["name"],
                "volume": vol
            })

        # 거래대금 기준 정렬
        stock_details.sort(key=lambda x: x["volume"], reverse=True)

        theme_results.append({
            "theme": theme_name,
            "description": theme_data.get("description", ""),
            "total_volume": total_volume,
            "stocks": stock_details
        })

    # 거래대금 내림차순 정렬
    theme_results.sort(key=lambda x: x["total_volume"], reverse=True)
    return theme_results


def calculate_theme_volume_range(weeks: int = 1) -> dict:
    """
    기간별 테마 거래대금 시계열 데이터
    Args:
        weeks: 1=1주, 4=4주, 12=12주
    Returns: {
        "theme_name": [{"date": str, "volume": int}, ...]
    }
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(weeks=weeks)

    # 거래일 목록 생성
    trading_dates = []
    current = start_date
    while current <= end_date:
        if current.weekday() < 5:  # 주말 제외
            trading_dates.append(current.strftime("%Y%m%d"))
        current += timedelta(days=1)

    # 날짜별 전체 거래대금 미리 수집 (API 호출 최소화)
    date_volumes = {}
    for date in trading_dates:
        vols = fetch_stock_trading_volume(date)
        if vols:
            date_volumes[date] = vols

    # 테마별 시계열 계산
    theme_timeseries = {}

    for theme_name, theme_data in THEME_STOCK_MAP.items():
        stocks = theme_data["stocks"]
        series = []

        for date in sorted(date_volumes.keys()):
            day_vols = date_volumes[date]
            total = sum(day_vols.get(s["code"], 0) for s in stocks)
            series.append({
                "date": date[:4] + "-" + date[4:6] + "-" + date[6:],
                "volume": total
            })

        theme_timeseries[theme_name] = series

    return theme_timeseries


def detect_surge_themes(threshold_ratio: float = 1.5) -> list:
    """
    거래대금 급증 테마 감지
    전일 대비 threshold_ratio 배 이상 증가한 테마 반환
    Returns: [{theme, today_volume, yesterday_volume, ratio}, ...]
    """
    today_str = get_recent_trading_date(0)
    yesterday_str = get_recent_trading_date(1)

    today_vols = fetch_stock_trading_volume(today_str)
    yesterday_vols = fetch_stock_trading_volume(yesterday_str)

    surge_themes = []

    for theme_name, theme_data in THEME_STOCK_MAP.items():
        stocks = theme_data["stocks"]

        today_total = sum(today_vols.get(s["code"], 0) for s in stocks)
        yesterday_total = sum(yesterday_vols.get(s["code"], 0) for s in stocks)

        if yesterday_total == 0:
            continue

        ratio = today_total / yesterday_total

        if ratio >= threshold_ratio:
            surge_themes.append({
                "theme": theme_name,
                "today_volume": today_total,
                "yesterday_volume": yesterday_total,
                "ratio": round(ratio, 2)
            })

    surge_themes.sort(key=lambda x: x["ratio"], reverse=True)
    return surge_themes

import FinanceDataReader as fdr
import pandas as pd
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from themes.mapper import THEME_STOCK_MAP
import logging

logger = logging.getLogger(__name__)

_daily_cache = {}
_range_cache = {}


def get_default_date() -> str:
    """
    오후 4시 이전 → 전 거래일
    오후 4시 이후 → 당일
    주말은 금요일로
    """
    now = datetime.now()
    base = now if now.hour >= 16 else now - timedelta(days=1)
    while base.weekday() >= 5:
        base -= timedelta(days=1)
    return base.strftime("%Y%m%d")


def get_recent_trading_date(days_back: int = 1) -> str:
    date = datetime.now() - timedelta(days=days_back)
    while date.weekday() >= 5:
        date -= timedelta(days=1)
    return date.strftime("%Y%m%d")


def _is_today(date: str) -> bool:
    """date가 오늘이고 오후 4시 이후인지 확인"""
    now = datetime.now()
    today = now.strftime("%Y%m%d")
    return date == today and now.hour >= 16


def _fetch_one(code: str, start: str, end: str) -> tuple:
    try:
        df = fdr.DataReader(code, start, end)
        if df.empty:
            return code, {}
        df.index = pd.to_datetime(df.index)
        result = {dt.strftime("%Y%m%d"): int(row["Close"] * row["Volume"])
                  for dt, row in df.iterrows()}
        return code, result
    except Exception as e:
        logger.error(f"[FDR] {code} 실패: {e}")
        return code, {}


def _build_daily_cache(date: str):
    if date in _daily_cache:
        return

    all_codes = list({s["code"] for td in THEME_STOCK_MAP.values() for s in td["stocks"]})
    dt = datetime.strptime(date, "%Y%m%d")
    start = (dt - timedelta(days=5)).strftime("%Y-%m-%d")
    end = dt.strftime("%Y-%m-%d")

    logger.info(f"[FDR] {date} {len(all_codes)}종목 병렬 수집 시작")
    result = {}

    with ThreadPoolExecutor(max_workers=10) as exe:
        futures = {exe.submit(_fetch_one, code, start, end): code for code in all_codes}
        for f in as_completed(futures):
            code, series = f.result()
            if date in series:
                result[code] = series[date]
            elif series:
                result[code] = list(series.values())[-1]
            else:
                result[code] = 0

    _daily_cache[date] = result
    logger.info(f"[FDR] {date} 캐시 완료: {len(result)}종목")


def calculate_theme_volume_today(date: str = None) -> tuple:
    if not date:
        date = get_default_date()

    # 오늘 장마감 후(16시 이후)만 StockListing 사용, 나머지는 DataReader
    if _is_today(date) and date not in _daily_cache:
        try:
            df = fdr.StockListing('KRX')
            df["Code"] = df["Code"].astype(str).str.zfill(6)
            df = df.set_index("Code")
            all_codes = {s["code"].zfill(6) for td in THEME_STOCK_MAP.values() for s in td["stocks"]}
            _daily_cache[date] = {
                code: int(df.loc[code, "Amount"] or 0) if code in df.index else 0
                for code in all_codes
            }
            logger.info(f"[FDR] StockListing 사용: {date}")
        except Exception as e:
            logger.error(f"[FDR] StockListing 실패, DataReader로 대체: {e}")
            _build_daily_cache(date)
    else:
        _build_daily_cache(date)

    vol_map = _daily_cache.get(date, {})
    theme_results = []

    for theme_name, theme_data in THEME_STOCK_MAP.items():
        stocks = theme_data["stocks"]
        stock_details = []
        total_volume = 0
        for s in stocks:
            code = s["code"].zfill(6)
            vol = vol_map.get(code, 0)
            total_volume += vol
            stock_details.append({"code": code, "name": s["name"], "volume": vol})

        stock_details.sort(key=lambda x: x["volume"], reverse=True)
        theme_results.append({
            "theme": theme_name,
            "description": theme_data.get("description", ""),
            "total_volume": total_volume,
            "stocks": stock_details
        })

    theme_results.sort(key=lambda x: x["total_volume"], reverse=True)
    return theme_results, date


def calculate_theme_volume_range(weeks: int = 1, end_date: str = None) -> dict:
    if not end_date:
        end_date = get_default_date()

    key = (end_date, weeks)
    if key in _range_cache:
        return _range_cache[key]

    dt = datetime.strptime(end_date, "%Y%m%d")
    start = (dt - timedelta(weeks=weeks)).strftime("%Y-%m-%d")
    end = dt.strftime("%Y-%m-%d")

    all_codes = list({s["code"] for td in THEME_STOCK_MAP.values() for s in td["stocks"]})
    logger.info(f"[FDR] 기간 {start}~{end} {len(all_codes)}종목 병렬 수집")

    code_series = {}
    with ThreadPoolExecutor(max_workers=10) as exe:
        futures = {exe.submit(_fetch_one, code, start, end): code for code in all_codes}
        for f in as_completed(futures):
            code, series = f.result()
            code_series[code] = series

    theme_ts = {}
    for theme_name, theme_data in THEME_STOCK_MAP.items():
        stocks = theme_data["stocks"]
        all_dates = sorted({d for s in stocks for d in code_series.get(s["code"], {})})
        series = []
        for d in all_dates:
            total = sum(code_series.get(s["code"], {}).get(d, 0) for s in stocks)
            series.append({"date": f"{d[:4]}-{d[4:6]}-{d[6:]}", "volume": total})
        theme_ts[theme_name] = series

    _range_cache[key] = theme_ts
    logger.info(f"[FDR] 기간 캐시 저장완료")
    return theme_ts


def detect_surge_themes(threshold_ratio: float = 1.5, date: str = None) -> list:
    if not date:
        date = get_default_date()

    dt = datetime.strptime(date, "%Y%m%d")
    prev_dt = dt - timedelta(days=1)
    while prev_dt.weekday() >= 5:
        prev_dt -= timedelta(days=1)
    prev_date = prev_dt.strftime("%Y%m%d")

    _build_daily_cache(date)
    _build_daily_cache(prev_date)

    today_map = _daily_cache.get(date, {})
    prev_map  = _daily_cache.get(prev_date, {})

    surge_themes = []
    for theme_name, theme_data in THEME_STOCK_MAP.items():
        stocks = theme_data["stocks"]
        today_total = sum(today_map.get(s["code"].zfill(6), 0) for s in stocks)
        prev_total  = sum(prev_map.get(s["code"].zfill(6), 0) for s in stocks)
        if prev_total == 0:
            continue
        ratio = today_total / prev_total
        if ratio >= threshold_ratio:
            surge_themes.append({
                "theme": theme_name,
                "today_volume": today_total,
                "yesterday_volume": prev_total,
                "ratio": round(ratio, 2)
            })

    surge_themes.sort(key=lambda x: x["ratio"], reverse=True)
    return surge_themes
import FinanceDataReader as fdr
import pandas as pd
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from themes.mapper import get_merged_theme_map
import logging

logger = logging.getLogger(__name__)

# 캐시: { date: { code: { "volume": int, "close": float } } }
_daily_cache = {}
_range_cache = {}


def get_default_date() -> str:
    now = datetime.now()
    base = now if now.hour >= 16 else now - timedelta(days=1)
    while base.weekday() >= 5:
        base -= timedelta(days=1)
    return base.strftime("%Y%m%d")


def _prev_trading_date(date: str) -> str:
    dt = datetime.strptime(date, "%Y%m%d") - timedelta(days=1)
    while dt.weekday() >= 5:
        dt -= timedelta(days=1)
    return dt.strftime("%Y%m%d")


def _is_today(date: str) -> bool:
    now = datetime.now()
    return date == now.strftime("%Y%m%d") and now.hour >= 16


def _fetch_one(code: str, start: str, end: str) -> tuple:
    """{ "YYYYMMDD": { "volume": int, "close": float } }"""
    try:
        df = fdr.DataReader(code, start, end)
        if df.empty:
            return code, {}
        df.index = pd.to_datetime(df.index)
        result = {}
        for dt, row in df.iterrows():
            close = float(row["Close"]) if row["Close"] else 0.0
            vol_amount = int(close * row["Volume"]) if row["Volume"] else 0
            result[dt.strftime("%Y%m%d")] = {"volume": vol_amount, "close": close}
        return code, result
    except Exception as e:
        logger.error(f"[FDR] {code} 실패: {e}")
        return code, {}


def _build_daily_cache(date: str):
    """date + 전일 데이터를 함께 수집"""
    prev_date = _prev_trading_date(date)
    if date in _daily_cache and prev_date in _daily_cache:
        return

    all_codes = list({s["code"].zfill(6) for td in get_merged_theme_map().values() for s in td["stocks"]})
    dt = datetime.strptime(date, "%Y%m%d")
    start = (dt - timedelta(days=7)).strftime("%Y-%m-%d")
    end = dt.strftime("%Y-%m-%d")

    logger.info(f"[FDR] {date} {len(all_codes)}종목 병렬 수집 시작")
    code_series = {}
    with ThreadPoolExecutor(max_workers=10) as exe:
        futures = {exe.submit(_fetch_one, code, start, end): code for code in all_codes}
        for f in as_completed(futures):
            code, series = f.result()
            code_series[code] = series

    empty = {"volume": 0, "close": 0.0}

    if date not in _daily_cache:
        result = {}
        for code in all_codes:
            series = code_series.get(code, {})
            if date in series:
                result[code] = series[date]
            elif series:
                result[code] = list(series.values())[-1]
            else:
                result[code] = dict(empty)
        _daily_cache[date] = result

    if prev_date not in _daily_cache:
        result = {}
        for code in all_codes:
            series = code_series.get(code, {})
            candidates = {d: v for d, v in series.items() if d <= prev_date}
            result[code] = candidates[max(candidates)] if candidates else dict(empty)
        _daily_cache[prev_date] = result

    logger.info(f"[FDR] {date} 캐시 완료")


def _safe_get(map_, code) -> dict:
    v = map_.get(code, {})
    if isinstance(v, dict):
        return v
    return {"volume": int(v), "close": 0.0}


def calculate_theme_volume_today(date: str = None) -> tuple:
    if not date:
        date = get_default_date()

    prev_date = _prev_trading_date(date)

    if _is_today(date) and date not in _daily_cache:
        try:
            df = fdr.StockListing('KRX')
            df["Code"] = df["Code"].astype(str).str.zfill(6)
            df = df.set_index("Code")
            all_codes = {s["code"].zfill(6) for td in get_merged_theme_map().values() for s in td["stocks"]}
            _daily_cache[date] = {
                code: {
                    "volume": int(df.loc[code, "Amount"] or 0) if code in df.index else 0,
                    "close":  float(df.loc[code, "Close"] or 0) if code in df.index else 0.0,
                }
                for code in all_codes
            }
            logger.info(f"[FDR] StockListing 사용: {date}")
            # 전일 데이터도 확보
            if prev_date not in _daily_cache:
                _build_daily_cache(date)
        except Exception as e:
            logger.error(f"[FDR] StockListing 실패: {e}")
            _build_daily_cache(date)
    else:
        _build_daily_cache(date)

    today_map = _daily_cache.get(date, {})
    prev_map  = _daily_cache.get(prev_date, {})

    theme_results = []
    for theme_name, theme_data in get_merged_theme_map().items():
        stocks = theme_data["stocks"]
        stock_details = []
        total_volume = 0
        total_prev_volume = 0
        price_changes = []

        for s in stocks:
            code = s["code"].zfill(6)
            today = _safe_get(today_map, code)
            prev  = _safe_get(prev_map,  code)

            vol_today   = today["volume"]
            vol_prev    = prev["volume"]
            close_today = today["close"]
            close_prev  = prev["close"]

            # 주가 등락률 %
            price_change_pct = None
            if close_prev and close_prev > 0:
                price_change_pct = round((close_today - close_prev) / close_prev * 100, 2)
                price_changes.append(price_change_pct)

            # 거래대금 증가액·증가율
            vol_change_amount = vol_today - vol_prev
            vol_change_pct = None
            if vol_prev and vol_prev > 0:
                vol_change_pct = round(vol_change_amount / vol_prev * 100, 2)

            total_volume      += vol_today
            total_prev_volume += vol_prev

            stock_details.append({
                "code": code,
                "name": s["name"],
                "volume":             vol_today,          # 오늘 거래대금
                "prev_volume":        vol_prev,           # 전일 거래대금
                "vol_change_amount":  vol_change_amount,  # 거래대금 증가액 (원)
                "vol_change_pct":     vol_change_pct,     # 거래대금 증가율 %
                "close":              close_today,        # 오늘 종가
                "prev_close":         close_prev,         # 전일 종가
                "change_pct":         price_change_pct,   # 주가 등락률 %
            })

        stock_details.sort(key=lambda x: x["volume"], reverse=True)

        avg_change_pct       = round(sum(price_changes) / len(price_changes), 2) if price_changes else None
        sector_vol_change_pct = round((total_volume - total_prev_volume) / total_prev_volume * 100, 2) if total_prev_volume else None

        theme_results.append({
            "theme":                theme_name,
            "description":          theme_data.get("description", ""),
            "total_volume":         total_volume,
            "total_prev_volume":    total_prev_volume,
            "sector_vol_change_pct": sector_vol_change_pct,  # 섹터 거래대금 증가율 %
            "avg_change_pct":        avg_change_pct,          # 섹터 평균 주가 등락률 %
            "stocks":               stock_details
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

    all_codes = list({s["code"] for td in get_merged_theme_map().values() for s in td["stocks"]})
    logger.info(f"[FDR] 기간 {start}~{end} {len(all_codes)}종목 병렬 수집")

    code_series = {}
    with ThreadPoolExecutor(max_workers=10) as exe:
        futures = {exe.submit(_fetch_one, code, start, end): code for code in all_codes}
        for f in as_completed(futures):
            code, series = f.result()
            code_series[code] = series

    theme_ts = {}
    for theme_name, theme_data in get_merged_theme_map().items():
        stocks = theme_data["stocks"]
        all_dates = sorted({d for s in stocks for d in code_series.get(s["code"], {})})
        series_out = []
        for d in all_dates:
            total = sum(code_series.get(s["code"], {}).get(d, {}).get("volume", 0) for s in stocks)
            series_out.append({"date": f"{d[:4]}-{d[4:6]}-{d[6:]}", "volume": total})
        theme_ts[theme_name] = series_out

    _range_cache[key] = theme_ts
    logger.info(f"[FDR] 기간 캐시 저장완료")
    return theme_ts


def detect_surge_themes(threshold_ratio: float = 1.5, date: str = None) -> list:
    if not date:
        date = get_default_date()

    prev_date = _prev_trading_date(date)
    _build_daily_cache(date)

    today_map = _daily_cache.get(date, {})
    prev_map  = _daily_cache.get(prev_date, {})

    surge_themes = []
    for theme_name, theme_data in get_merged_theme_map().items():
        stocks = theme_data["stocks"]
        today_total = sum(_safe_get(today_map, s["code"].zfill(6))["volume"] for s in stocks)
        prev_total  = sum(_safe_get(prev_map,  s["code"].zfill(6))["volume"] for s in stocks)
        if prev_total == 0:
            continue
        ratio = today_total / prev_total
        if ratio >= threshold_ratio:
            surge_themes.append({
                "theme":            theme_name,
                "today_volume":     today_total,
                "yesterday_volume": prev_total,
                "ratio":            round(ratio, 2)
            })

    surge_themes.sort(key=lambda x: x["ratio"], reverse=True)
    return surge_themes

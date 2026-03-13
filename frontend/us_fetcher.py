"""
미국 주식 데이터 수집 모듈 (yfinance 사용)
- 추후 미국 시장 확장 시 사용
- 섹터(ETF 기반) 자금 흐름 분석
"""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# 미국 섹터 ETF 기반 테마 매핑
US_SECTOR_MAP = {
    "Technology": {
        "description": "기술·반도체·소프트웨어",
        "etf": "XLK",
        "stocks": ["AAPL", "MSFT", "NVDA", "AMD", "INTC", "QCOM", "AVGO", "TXN"]
    },
    "Healthcare": {
        "description": "헬스케어·바이오·제약",
        "etf": "XLV",
        "stocks": ["JNJ", "UNH", "PFE", "ABBV", "MRK", "TMO", "ABT", "DHR"]
    },
    "Energy": {
        "description": "에너지·오일·가스·신재생",
        "etf": "XLE",
        "stocks": ["XOM", "CVX", "COP", "EOG", "SLB", "OXY", "PSX", "VLO"]
    },
    "Financials": {
        "description": "금융·은행·보험",
        "etf": "XLF",
        "stocks": ["JPM", "BAC", "WFC", "GS", "MS", "C", "BLK", "AXP"]
    },
    "Consumer Discretionary": {
        "description": "소비재·리테일·자동차",
        "etf": "XLY",
        "stocks": ["AMZN", "TSLA", "HD", "MCD", "NKE", "SBUX", "LOW", "TJX"]
    },
    "Industrials": {
        "description": "산업재·항공우주·방산",
        "etf": "XLI",
        "stocks": ["BA", "HON", "UPS", "CAT", "GE", "LMT", "RTX", "DE"]
    },
    "AI & Cloud": {
        "description": "AI·클라우드·빅데이터",
        "etf": "BOTZ",
        "stocks": ["GOOGL", "META", "AMZN", "MSFT", "NVDA", "CRM", "SNOW", "PLTR"]
    },
    "Clean Energy": {
        "description": "청정에너지·전기차·배터리",
        "etf": "ICLN",
        "stocks": ["TSLA", "ENPH", "PLUG", "FSLR", "RUN", "SEDG", "STEM", "NEE"]
    },
}


def fetch_us_stock_volume(tickers: list, period: str = "1d") -> dict:
    """
    미국 주식 거래대금 수집
    Args:
        tickers: 티커 리스트
        period: '1d', '5d', '1mo', '3mo'
    Returns: {ticker: volume} dict
    """
    try:
        data = yf.download(
            tickers,
            period=period,
            interval="1d",
            auto_adjust=True,
            progress=False
        )

        if data.empty:
            return {}

        result = {}

        if len(tickers) == 1:
            # 단일 종목
            ticker = tickers[0]
            info = yf.Ticker(ticker).fast_info
            price = float(data["Close"].iloc[-1]) if not data.empty else 0
            volume = float(data["Volume"].iloc[-1]) if not data.empty else 0
            result[ticker] = int(price * volume)
        else:
            close = data["Close"].iloc[-1]
            volume = data["Volume"].iloc[-1]
            for ticker in tickers:
                try:
                    p = float(close[ticker]) if ticker in close else 0
                    v = float(volume[ticker]) if ticker in volume else 0
                    result[ticker] = int(p * v)
                except Exception:
                    result[ticker] = 0

        return result

    except Exception as e:
        logger.error(f"[US] 거래대금 수집 실패: {e}")
        return {}


def calculate_us_theme_volume_today() -> list:
    """
    오늘 미국 섹터별 거래대금 합산
    Returns: 테마별 거래대금 리스트 (krx_fetcher와 동일 포맷)
    """
    theme_results = []

    for theme_name, theme_data in US_SECTOR_MAP.items():
        stocks = theme_data["stocks"]
        vol_dict = fetch_us_stock_volume(stocks, period="1d")

        stock_details = []
        total_volume = 0

        for ticker in stocks:
            vol = vol_dict.get(ticker, 0)
            total_volume += vol
            stock_details.append({
                "code": ticker,
                "name": ticker,
                "volume": vol
            })

        stock_details.sort(key=lambda x: x["volume"], reverse=True)

        theme_results.append({
            "theme": theme_name,
            "description": theme_data.get("description", ""),
            "total_volume": total_volume,
            "stocks": stock_details
        })

    theme_results.sort(key=lambda x: x["total_volume"], reverse=True)
    return theme_results


def fetch_us_theme_timeseries(weeks: int = 1) -> dict:
    """
    미국 섹터별 ETF 거래대금 시계열
    Args:
        weeks: 1, 4, 12
    Returns: {theme_name: [{date, volume}, ...]}
    """
    period_map = {1: "5d", 4: "1mo", 12: "3mo"}
    period = period_map.get(weeks, "5d")

    result = {}

    for theme_name, theme_data in US_SECTOR_MAP.items():
        etf = theme_data["etf"]
        try:
            df = yf.download(etf, period=period, interval="1d", auto_adjust=True, progress=False)
            if df.empty:
                result[theme_name] = []
                continue

            series = []
            for date, row in df.iterrows():
                close = float(row["Close"]) if "Close" in row else 0
                volume = float(row["Volume"]) if "Volume" in row else 0
                series.append({
                    "date": str(date)[:10],
                    "volume": int(close * volume)
                })

            result[theme_name] = series

        except Exception as e:
            logger.error(f"[US] {theme_name} 시계열 수집 실패: {e}")
            result[theme_name] = []

    return result
